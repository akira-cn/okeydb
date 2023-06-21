import path from 'node:path';
import {existsSync, mkdirSync, writeFileSync, readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import Query from './query.js';
import {generateID} from './utils.js';

export default class {
  #name;
  #root = '.db';
  #records;

  constructor(name) {
    this.#name = name;
    if(!existsSync(this.#root)) {
      mkdirSync(this.#root);
    }
    if(!existsSync(this.filepath)) {
      const records = {
        _ids: [],
        records: [],
      };
      writeFileSync(this.filepath, JSON.stringify(records), {charset: 'utf8'});
      this.#records = records;
    } else {
      const records = readFileSync(this.filepath, {charset: 'utf8'});
      this.#records = JSON.parse(records);
    }
  }

  get records() {
    return this.#records.records;
  }
  
  get indices() {
    return this.#records._ids;
  }

  get name() {
    return this.#name;
  }

  get filepath() {
    return path.join(this.#root, this.name);
  }

  _insertOrUpdate(record) {
    const datetime = (new Date()).toISOString();
    record.createdAt = record.createdAt || datetime;
    record.updatedAt = record.updatedAt || datetime;
    if(record._id == null) { // new insert
      const _id = generateID();
      record._id = _id;
      this.#records.records.unshift(record);
      this.#records._ids.unshift(record._id);
    } else {
      const idx = this.#records._ids.indexOf(record._id);
      if(idx >= 0) {
        this.#records.records[idx] = record;
      } else {
        this.#records.records.unshift(record);
        this.#records._ids.unshift(record._id);
      }
    }
  }

  _delete(record) {
    if(record._id != null) {
      const idx = this.#records._ids.indexOf(record._id);
      if(idx >= 0) {
        this.#records._ids.splice(idx, 1);
        this.#records.records.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  async save(records = []) {
    if(!Array.isArray(records)) records = [records];
    for(let i = 0; i < records.length; i++) {
      const record = records[i];
      this._insertOrUpdate(record);
    }
    await writeFile(this.filepath, JSON.stringify(this.#records), {charset: 'utf8'});
    return records;
  }

  async delete(records = []) {
    if(!Array.isArray(records)) records = [records];
    let deletedCount = 0;
    for(let i = 0; i < records.length; i++) {
      const record = records[i];
      if(this._delete(record)) deletedCount++;
    }
    return {deletedCount};
  }

  where(conditions = {}) {
    const query = new Query(conditions, this);
    return query;
  }
}