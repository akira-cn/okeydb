import { sleep } from '../../utils.js';

import { Storage } from './storage.js';

import path from 'node:path';
import { existsSync } from 'node:fs';
import { writeFile, readFile, unlink, mkdir } from 'node:fs/promises';

import { v4 as uuidv4 } from 'uuid';

async function getRecordsFromFile(filepath) {
  await _fileLock(filepath);
  let records = await readFile(filepath, {charset: 'utf8'});
  await _fileUnlock(filepath);
  records = JSON.parse(records);
  records.records = records.records.map((r, i) => {
    const schema = records._schema[i];
    for(const [k, v] of Object.entries(schema)) {
      if(v === 'date') {
        r[k] = new Date(r[k]);
      } else if(v === 'regexp') {
        r[k] = new RegExp(r[k].source, r[k].flags);
      }
    }
    return r;
  });
  delete records._schema;
  return new Storage(records);
}

async function _fileLock(filepath, unlock = false) {
  const locker = `${filepath}.lck`;
  while(existsSync(locker)) {
    await sleep(10);
  }
  if(!unlock) await writeFile(locker, '');
}

async function _fileUnlock(filepath) {
  const locker = `${filepath}.lck`;
  await unlink(locker);
}

async function _updateMeta(metafile, version) {
  await _fileLock(metafile);
  const metadata = JSON.parse(await readFile(metafile, {charset: 'utf8'}));
  metadata.version = version;
  await writeFile(metafile, JSON.stringify(metadata), {charset: 'utf8'});
  await _fileUnlock(metafile);
}

const _root = Symbol('root');
const _meta = Symbol('meta');


function metapath(table) {
  return path.join(table[_meta], `${table.name}.meta`);
}

function filepath(table) {
  return path.join(table[_root], table.name);
}

export async function createTable(table, root, meta) {
  table[_root] = root;
  table[_meta] = meta;

  if(!(existsSync(table[_root]))) {
    await mkdir(table[_root]);
  }

  if(!(existsSync(table[_meta]))) {
    await mkdir(table[_meta]);
  }

  if(!(existsSync(metapath(table)))) {
    table._version = uuidv4();
    await writeFile(metapath(table), JSON.stringify({version: table._version}), {charset: 'utf8'});
  } else {
    const {version} = JSON.parse(await readFile(metapath(table), {charset: 'utf8'}));
    table._version = version;
  }

  if(!(existsSync(filepath(table)))) {
    const records = {
      _ids: {},
      records: [],
    };
    await writeFile(filepath(table), JSON.stringify(records), {charset: 'utf8'});
    return new Storage(records);
  }

  return null;
}

export async function fileSync(table) {
  await _fileLock(filepath(table));
  await writeFile(filepath(table), JSON.stringify(table._storage), {charset: 'utf8'});
  const version = uuidv4();
  await _updateMeta(metapath(table), version);
  table._version = version;
  await _fileUnlock(filepath(table));
}

export async function flushData(table) {
  await _fileLock(metapath(table));
  const {version} = JSON.parse(await readFile(metapath(table), {charset: 'utf8'}));
  if(!table._storage || table._version !== version) {
    table._storage = await getRecordsFromFile(filepath(table));
  }
  table._version = version;
  await _fileUnlock(metapath(table));
}

export async function getRecords(table, {filter, sorter, skip, limit} = {}) {
  await flushData(table);
  const records = table._storage.records;
  let filtedRecords;
  if(!sorter && skip === 0 && limit === 1) {
    filtedRecords = records.find(filter);
    if(filtedRecords) return [filtedRecords];
    return [];
  } else {
    filtedRecords = records.filter(filter);
  }
  if(sorter) filtedRecords.sort(sorter);
  if(skip > 0 || limit > 0) {
    filtedRecords = filtedRecords.slice(skip, skip + limit);
  }
  return filtedRecords;
}
