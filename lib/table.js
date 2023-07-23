import path from 'node:path';
import {existsSync, mkdirSync, writeFileSync, readFileSync} from 'node:fs';
import {writeFile, readFile, unlink} from 'node:fs/promises';
import Query from './query.js';
import {generateID, getType, sleep} from './utils.js';

RegExp.prototype.toJSON = function() {
  return {type: 'RegExp', source: this.source, flags: this.flags};
};

function toJSON() {
  const _schema = this.records.map(d => {
    const s = {};
    for(const [k,  v] of Object.entries(d)) {
      s[k] = getType(v);
    }
    return s;
  });
  return {
    _ids: this._ids,
    records: this.records,
    _schema,
  };
}

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
  records.toJSON = toJSON;
  return records;
}


function _insert(records, ids, table) {
  const start = table.records.length;
  for(let i = 0; i < ids.length; i++) {
    const id = ids[i];
    table._ids[id] = start + i;
  }
  table.records = [...table.records, ...records];
}

async function _fileLock(filepath, unlock = false) {
  const locker = `${filepath}.lck`;
  while(existsSync(locker)) {
    await sleep(10);
  }
  if(!unlock) writeFileSync(locker, '');
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

export default class {
  #name;
  #root;
  #records;
  #meta;
  #version;

  constructor(name, {root = '.db', meta = '.meta'} = {}) {
    if(name.startsWith('.')) {
      throw new TypeError('The table name cannot starts with \'.\'.');
    }
  
    this.#name = name;
    this.#root = root;
    this.#meta = meta;

    if(!existsSync(this.#root)) {
      mkdirSync(this.#root);
    }

    if(!existsSync(this.#meta)) {
      mkdirSync(this.#meta);
    }

    if(!existsSync(this.metapath)) {
      this.#version = generateID();
      writeFileSync(this.metapath, JSON.stringify({version: this.#version}), {charset: 'utf8'});
    } else {
      const {version} = JSON.parse(readFileSync(this.metapath, {charset: 'utf8'}));
      this.#version = version;
    }

    if(!existsSync(this.filepath)) {
      const records = {
        _ids: {},
        records: [],
        toJSON,
      };
      writeFileSync(this.filepath, JSON.stringify(records), {charset: 'utf8'});
      this.#records = records;
    }
  }

  async getRecords() {
    await _fileLock(this.metapath);
    const {version} = JSON.parse(await readFile(this.metapath, {charset: 'utf8'}));
    if(!this.#records || this.#version !== version) {
      this.#records = await getRecordsFromFile(this.filepath);
    }
    this.#version = version;
    await _fileUnlock(this.metapath);
    return this.#records.records.slice(0);
  }

  get name() {
    return this.#name;
  }

  get metapath() {
    return path.join(this.#meta, `${this.name}.meta`);
  }

  get filepath() {
    return path.join(this.#root, this.name);
  }

  async save(records = [], countResult = false) {
    const originalRecords = records;
    if(!Array.isArray(records)) {
      records = [records];
    }
    
    await this.getRecords();

    const insertRecords = [];
    const insertIds = [];
    const datetime = new Date();

    for(let i = 0; i < records.length; i++) {
      const record = records[i];
      record.createdAt = record.createdAt || datetime;
      record.updatedAt = datetime;

      if(record._id != null) {
        const idx = this.#records._ids[record._id];
        if(idx >= 0) {
          this.#records.records[idx] = record;
        }
      } else {
        record._id = record._id || generateID();
        insertRecords.push(record);
        insertIds.push(record._id);
      }
    }

    const upsertedCount = insertRecords.length;
    const modifiedCount = records.length - upsertedCount;
    _insert(insertRecords, insertIds, this.#records);

    this.#fileSync();

    if(countResult) return {modifiedCount, upsertedCount};

    return originalRecords;
  }

  async #fileSync() {
    await _fileLock(this.filepath);
    await writeFile(this.filepath, JSON.stringify(this.#records), {charset: 'utf8'});
    const version = generateID();
    await _updateMeta(this.metapath, version);
    this.#version = version;
    await _fileUnlock(this.filepath);
  }

  async delete(records = []) {
    if(!Array.isArray(records)) records = [records];
    
    await this.getRecords();

    let deletedCount = 0;

    const filterMap = {};

    for(let i = 0; i < records.length; i++) {
      const record = records[i];
      const idx = this.#records._ids[record._id];
      if(idx >= 0) deletedCount++;
      filterMap[idx] = true;
    }

    this.#records.records = this.#records.records.filter((_, idx) => !filterMap[idx]);
    this.#records._ids = {};
    for(let i = 0; i < this.#records.records.length; i++) {
      const record = this.#records.records[i];
      this.#records._ids[record._id] = i;
    }

    this.#fileSync();

    return {deletedCount};
  }

  where(conditions) {
    const query = new Query(conditions, this);
    return query;
  }
}