import {mergeConditions} from './utils.js';

export default class {
  #table;
  #filter;
  #records;
  #sorter = null;
  #skip = 0;
  #limit = 0;
  #projection = null;
  #updateFields = null;
  #insertFields = null;
  #setOnInsertFields = null;
  #upsert = false;

  constructor(conditions, table) {
    this.#filter = mergeConditions([conditions]);
    this.#table = table;
    this.#insertFields = {...conditions};
  }

  and(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions);
    this.#filter = record => left(record) && right(record);
    for(let i = 0; i < conditions.length; i++) {
      Object.assign(this.#insertFields, conditions[i]);
    }
    return this;
  }

  or(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions, 'or');
    this.#filter = record => left(record) || right(record);
    this.#insertFields = {};
    return this;
  }

  nor(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions, 'nor');
    this.#filter = record => !(left(record) || right(record));
    this.#insertFields = {};
    return this;
  }

  async find() {
    const records = await this.#table.getRecords();
    let filtedRecords = records.filter(this.#filter);
    if(this.#sorter) filtedRecords.sort(this.#sorter);
    if(this.#skip > 0 || this.#limit > 0) {
      filtedRecords = filtedRecords.slice(this.#skip, this.#skip + this.#limit);
    }
    if(this.#projection) {
      const {type, fields} = this.#projection;
      if(type === 'inclusion') {
        filtedRecords = filtedRecords.map(r => {
          const ret = {};
          fields.forEach(f => ret[f] = r[f]);
          ret._id = r._id;
          return ret;
        });
      } else if(type === 'exclusion') {
        filtedRecords = filtedRecords.map(r => {
          const ret = {...r};
          fields.forEach(f => delete ret[f]);
          return ret;
        });
      }
    }
    this.#records = filtedRecords;
    return filtedRecords;
  }

  async findOne() {
    if(this.#sorter || this.#skip > 0 || this.#limit > 0) {
      return (await this.find())[0] || null;
    }
    const records = await this.#table.getRecords();
    const record = records.find(this.#filter) || null;
    if(this.#projection) {
      const {type, fields} = this.#projection;
      const ret = {};
      if(type === 'inclusion') {
        fields.forEach(f => ret[f] = record[f]);
      } else if(type === 'exclusion') {
        Object.assign(ret, record);
        fields.forEach(f => delete ret[f]);
      }
      return ret;
    }
    return record;
  }

  async count() {
    if(this.#records) return this.#records.length;
    return await this.find().length;
  }

  set(fields) {
    this.#updateFields = fields;
    return this;
  }

  setOnInsert(fields) {
    this.#setOnInsertFields = fields;
    return this;
  }

  upsert(flag) {
    this.#upsert = flag;
    return this;
  }

  async save() {
    if(this.#updateFields || this.#upsert) {
      let records = this.#records;
      if(!records) records = await this.find();
      if(records.length <= 0 && this.#upsert) {
        // insert
        records = Object.assign({}, this.#insertFields, this.#setOnInsertFields);
        for(const [k, v] of Object.entries(records)) {
          if(typeof v === 'function') delete records[k];
        }
        if(this.#updateFields) {
          const updateFields = this.#updateFields;
          for(const [k, v] of Object.entries(updateFields)) {
            if(typeof v !== 'function') {
              records[k] = v;
            } else {
              records[k] = v(records[k], k, records);
              if(records[k] === undefined) delete records[k];
            }
          }
        }
      } else if(this.#updateFields) {
        const updateFields = this.#updateFields;
        records = records.map(record => {
          const ret = {...record};
          for(const [k, v] of Object.entries(updateFields)) {
            if(typeof v !== 'function') {
              ret[k] = v;
            } else {
              ret[k] = v(ret[k], k, ret);
              if(ret[k] === undefined) delete ret[k];
            }
          }
          return ret;
        });
      } else {
        return await this.#table.save([], true);
      }
      return await this.#table.save(records, true);
    }
    throw new Error('Must use set or upsert at least once');
  }

  async delete() {
    let records = this.#records;
    if(!records) records = await this.find();
    return await this.#table.delete(records);
  }

  sort(conditions) {
    const conds = Object.entries(conditions);
    this.#sorter = (a, b) => {
      for(let [k, v] of conds) {
        if(typeof v === 'string') {
          if(v.toLowerCase() === 'asc') {
            v = 1;
          } else if(v.toLowerCase() === 'desc') {
            v = -1;
          }
        }
        if(v !== 1 && v !== -1) throw new Error(`Invalid sort condition: ${k} ${v}`);
        if(a[k] != b[k]) {
          return a[k] > b[k] ? v * 1 : v * -1;
        } 
      }
      return 0;
    };
    return this;
  }

  skip(n) {
    this.#skip = n;
    return this;
  }

  limit(n) {
    this.#limit = n;
    return this;
  }

  projection(conditions) {
    let type = null;
    const fields = [];
    for(const [k, v] of Object.entries(conditions)) {
      if(!type && v === 1) type = 'inclusion';
      else if(!type && v === 0) type = 'exclusion';
      else if(type === 'inclusion' && v === 0 || type === 'exclusion' && v === 1)
        throw new Error('Projection cannot have a mix of inclusion and exclusion.');
      fields.push(k);
    }
    this.#projection = {type, fields};
    return this;
  }

  get table() {
    return this.#table;
  }
}