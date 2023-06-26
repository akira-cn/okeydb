import {mergeConditions} from './utils.js';

export default class {
  #records = null;
  #table;
  #filter;

  constructor(conditions, table) {
    this.#filter = mergeConditions(conditions);
    this.#table = table;
  }

  and(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions);
    this.#filter = record => left(record) && right(record);
    return this;
  }

  or(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions, 'or');
    this.#filter = record => left(record) || right(record);
    return this;
  }

  nor(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions, 'nor');
    this.#filter = record => !(left(record) || right(record));
  }

  find() {
    if(this.#records) return this.#records;
    const filtedRecords = this.#table.records.filter(this.#filter);
    this.#records = filtedRecords;
    return filtedRecords;
  }

  findOne() {
    if(this.#records) return this.#records[0];
    const record = this.#table.records.find(this.#filter);
    return record;
  }

  count() {
    return this.find().length;
  }

  get table() {
    return this.#table;
  }
}