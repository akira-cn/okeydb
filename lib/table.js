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
  let records = await readFile(filepath, {charset: 'utf8'});
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

function _insertOrUpdate(record, records) {
  const datetime = new Date();
  record.createdAt = record.createdAt || datetime;
  record.updatedAt = record.updatedAt || datetime;
  if(record._id == null) { // new insert
    const _id = generateID();
    record._id = _id;
    records.records.unshift(record);
    records._ids.unshift(record._id);
  } else {
    const idx = records._ids.indexOf(record._id);
    if(idx >= 0) {
      records.records[idx] = record;
    } else {
      records.records.unshift(record);
      records._ids.unshift(record._id);
    }
  }
}

function _delete(record, records) {
  if(record._id != null) {
    const idx = records._ids.indexOf(record._id);
    if(idx >= 0) {
      records._ids.splice(idx, 1);
      records.records.splice(idx, 1);
      return true;
    }
  }
  return false;
}

async function _updateMeta(metafile, tablename, version) {
  const metadata = JSON.parse(await readFile(metafile, {charset: 'utf8'}));
  metadata.tables[tablename] = version;
  await writeFile(metafile, JSON.stringify(metadata), {charset: 'utf8'});
}

async function _metaLock(metafile) {
  const locker = `${metafile}.lck`;
  while(existsSync(locker)) {
    await sleep(10);
  }
  writeFileSync(locker, '');
}

async function _metaUnlock(metafile) {
  const locker = `${metafile}.lck`;
  await unlink(locker);
}

export default class {
  #name;
  #root;
  #records;
  #meta = '.meta';
  #version;

  constructor(name, root = '.db') {
    if(name.startsWith('.')) {
      throw new TypeError('The table name cannot starts with \'.\'.');
    }
  
    this.#name = name;
    this.#root = root;

    if(!existsSync(this.#root)) {
      mkdirSync(this.#root);
    }

    if(!existsSync(this.metapath)) {
      this.#version = generateID();
      writeFileSync(this.metapath, JSON.stringify({tables: {[name]: this.#version}}), {charset: 'utf8'});
    } else {
      const {tables} = JSON.parse(readFileSync(this.metapath, {charset: 'utf8'}));
      this.#version = tables[name];
    }

    if(!existsSync(this.filepath)) {
      const records = {
        _ids: [],
        records: [],
        toJSON,
      };
      writeFileSync(this.filepath, JSON.stringify(records), {charset: 'utf8'});
      this.#records = records;
    }
  }

  async getRecords() {
    const {tables} = JSON.parse(await readFile(this.metapath, {charset: 'utf8'}));
    const version = tables[this.#name];
    if(!this.#records || this.#version !== version) {
      this.#records = await getRecordsFromFile(this.filepath);
    }
    this.#version = version;
    return this.#records.records;
  }

  get name() {
    return this.#name;
  }

  get metapath() {
    return path.join(this.#root, this.#meta);
  }

  get filepath() {
    return path.join(this.#root, this.name);
  }

  async save(records = []) {
    if(!Array.isArray(records)) records = [records];
    await _metaLock(this.metapath);
    await this.getRecords();
    for(let i = 0; i < records.length; i++) {
      const record = records[i];
      _insertOrUpdate(record, this.#records);
    }
    await writeFile(this.filepath, JSON.stringify(this.#records), {charset: 'utf8'});
    this.#version = generateID();
    await _updateMeta(this.metapath, this.#name, this.#version);
    await _metaUnlock(this.metapath);
    return records;
  }

  async delete(records = []) {
    if(!Array.isArray(records)) records = [records];
    await _metaLock(this.metapath);
    await this.getRecords();
    let deletedCount = 0;
    for(let i = 0; i < records.length; i++) {
      const record = records[i];
      if(_delete(record, this.#records)) deletedCount++;
    }
    await writeFile(this.filepath, JSON.stringify(this.#records), {charset: 'utf8'});
    this.#version = generateID();
    await _updateMeta(this.metapath, this.#name, this.#version);
    await _metaUnlock(this.metapath);
    return {deletedCount};
  }

  where(...conditions) {
    const query = new Query(conditions, this);
    return query;
  }
}