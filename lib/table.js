import Query from './query.js';
import { v4 as uuidv4 } from 'uuid';

import { fileSync, getRecords, flushData, createTable } from './platform';

RegExp.prototype.toJSON = function() {
  return {type: 'RegExp', source: this.source, flags: this.flags};
};

export default class {
  #name;
  #db;
  #ready;
  #indexes;

  constructor(name, {root = '.db', meta = '.meta', database, indexes} = {}) {
    if(name.startsWith('.')) {
      throw new TypeError('The table name cannot starts with \'.\'.');
    }
  
    this.#name = name;
    this.#db = database;
    this.#ready = createTable(this, root, meta).then((res) => {
      this._storage = res;
    });

    this.#indexes = {
      _id: true,  // indent
      ...indexes,
    };
  }

  get indexes() {
    return this.#indexes;
  }

  get database() {
    return this.#db;
  }

  get name() {
    return this.#name;
  }

  async getRecords({filter, sorter, skip, limit} = {}) {
    await this.#ready;
    return getRecords(this, {filter, sorter, skip, limit});
  }

  async save(records = [], countResult = false) {
    await this.#ready;
    const originalRecords = records;
    if(!Array.isArray(records)) {
      records = [records];
    }
    
    await flushData(this);

    const insertRecords = [];
    const datetime = new Date();

    for(let i = 0; i < records.length; i++) {
      const record = records[i];
      record.createdAt = record.createdAt || datetime;
      record.updatedAt = datetime;

      if(record._id != null) {
        const idx = this._storage.getItemIndex(record._id);
        if(idx >= 0) {
          await this._storage.put(idx, record);
        }
      } else {
        record._id = record._id || uuidv4();
        insertRecords.push(record);
      }
    }

    const upsertedCount = insertRecords.length;
    const modifiedCount = records.length - upsertedCount;

    await this._storage.add(insertRecords);
    await fileSync(this);

    if(countResult) return {modifiedCount, upsertedCount};

    return originalRecords;
  }

  async delete(records = []) {
    await this.#ready;
    if(!Array.isArray(records)) records = [records];
    
    await flushData(this);

    let deletedCount = 0;

    const filterMap = {};

    for(let i = 0; i < records.length; i++) {
      const record = records[i];
      const idx = this._storage.getItemIndex(record._id);
      if(idx >= 0) deletedCount++;
      filterMap[idx] = true;
    }

    await this._storage.delete(filterMap);
    await fileSync(this);

    return {deletedCount};
  }

  where(condition = {}) {
    const query = new Query(condition, this);
    return query;
  }
}