import {mergeConditions} from './utils.js';

function updateFilterIndex(query, conditions, filterIndexes = {} ,phase = 'and') {
  const indexes = query.table.indexes;
  for(let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];
    let hasIndex = false;
    for(const [k, v] of Object.entries(condition)) {
      if(k in indexes) {
        hasIndex = true;
        filterIndexes[k] = filterIndexes[k] || new Set();
        filterIndexes[k].add(v);
        if(phase === 'and' && filterIndexes[k].size > 1) filterIndexes[k].clear();
      }
    }
    if(!hasIndex && phase === 'or') {
      return null;
    }
  }
  return filterIndexes;
}


const _filter = Symbol.for('airdb-filter');

export default class {
  #table;
  #filter;
  #records;
  #sorter = null;
  #rawSorter;
  #skip = 0;
  #limit = 0;
  #projection = null;
  #updateFields = null;
  #insertFields = null;
  #setOnInsertFields = null;
  #upsert = false;
  #filterIndexes = {};

  constructor(condition, table) {
    this.#filter = mergeConditions([condition]);
    this.#table = table;
    this.#insertFields = {...condition};
    this.#filterIndexes = updateFilterIndex(this, [condition], {}, 'and');
  }

  and(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions);
    this.#filter = record => left(record) && right(record);
    for(let i = 0; i < conditions.length; i++) {
      Object.assign(this.#insertFields, conditions[i]);
    }
    if(this.#filterIndexes) this.#filterIndexes = updateFilterIndex(this, conditions, this.#filterIndexes, 'and');
    return this;
  }

  or(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions, 'or');
    this.#filter = record => left(record) || right(record);
    this.#insertFields = {};
    if(this.#filterIndexes) this.#filterIndexes = updateFilterIndex(this, conditions, this.#filterIndexes, 'or');
    return this;
  }

  nor(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions, 'nor');
    this.#filter = record => !(left(record) || right(record));
    this.#insertFields = {};
    this.#filterIndexes = null;
    return this;
  }

  async find() {
    let filtedRecords = await this.#table.getRecords({
      filter: this.#filter,
      sorter: this.#sorter,
      rawSorter: this.#rawSorter,
      skip: this.#skip,
      limit: this.#limit,
      filterIndexes: this.filterIndexes,
    });

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
    const records = await this.#table.getRecords({
      filter: this.#filter,
      sorter: this.#sorter,
      rawSorter: this.#rawSorter,
      skip: 0,
      limit: 1,
      filterIndexes: this.filterIndexes,
    });
    const record = records[0];
    // const record = records.find(this.#filter) || null;
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
          if(typeof v === 'function' || v && typeof v[_filter] === 'function') delete records[k];
        }
        if(this.#updateFields) {
          const updateFields = this.#updateFields;
          for(let [k, v] of Object.entries(updateFields)) {
            if(v && v[_filter] === 'function') {
              v = v[_filter];
            }
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
          for(let [k, v] of Object.entries(updateFields)) {
            if(v && v[_filter] === 'function') {
              v = v[_filter];
            }
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
    this.#rawSorter = conditions;
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

  get filterIndexes() {
    const filterIndexes = this.#filterIndexes || {};
    if(Object.keys(filterIndexes).length) return filterIndexes;
    return null;
  }
}