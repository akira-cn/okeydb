import {mergeConditions} from './utils.js';

export default class {
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

  async find() {
    const filtedRecords = (await this.#table.getRecords()).filter(this.#filter);
    return filtedRecords;
  }

  async findOne() {
    const record = (await this.#table.getRecords()).find(this.#filter);
    return record;
  }

  count() {
    return this.find().length;
  }

  get table() {
    return this.#table;
  }
}