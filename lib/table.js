import Query from './query.js';
import { v4 as uuidv4 } from 'uuid';

const Table = await (async () => {
  let platform;

  // eslint-disable-next-line no-undef
  if(typeof ESB_PLATFORM === 'string' && ESB_PLATFORM === 'browser') {
    platform = await import('./platform/browser/index.js');
  } else {
    platform = await import('./platform/node/index.js');
  }
  const { fileSync, getRecords, flushData, createTable } = platform;
  
  
  RegExp.prototype.toJSON = function() {
    return {type: 'RegExp', source: this.source, flags: this.flags};
  };
  
  return class {
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
      this.#indexes = {
        _id: true,  // indent
        createdAt: false,
        updatedAt: false,
        ...indexes,
      };
  
      this.#ready = createTable(this, root, meta).then((res) => {
        this._storage = res;
      });
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
  
    async getRecords({filter, sorter, skip, limit, filterIndexes, rawSorter} = {}) {
      await this.#ready;
      return getRecords(this, {filter, sorter, skip, limit, filterIndexes, rawSorter});
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
  
    where(condition = null) {
      const query = new Query(condition, this);
      return query;
    }
  };
})();

export default Table;