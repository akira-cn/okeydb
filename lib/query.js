export default class {
  #records = null;
  #table;
  #filters;

  _parseCondition(conditions) {
    const filters = [];

    for(const [k, v] of Object.entries(conditions)) {
      if(typeof v !== 'function') {
        filters.push((d) => d[k] === v);
      } else {
        filters.push((d) => v(d[k]));
      }
    }

    return filters;
  }

  constructor(conditions, table) {
    this.#filters = this._parseCondition(conditions);
    this.#table = table;
  }

  find() {
    if(this.#records) return this.#records;
    const filtedRecords = this.#table.records.filter((record) => this.#filters.every((f) => f(record)));
    this.#records = filtedRecords;
    return filtedRecords;
  }

  findOne() {
    if(this.#records) return this.#records[0];
    const record = this.#table.records.find((record) => this.#filters.every((f) => f(record)));
    return record;
  }

  count() {
    return this.find().length;
  }

  get table() {
    return this.#table;
  }
}