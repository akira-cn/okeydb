import { getType } from '../../utils.js';

export class Storage {
  #storage;

  constructor(storage) {
    this.#storage = storage;
  }

  toJSON() {
    const _schema = this.#storage.records.map(d => {
      const s = {};
      for(const [k,  v] of Object.entries(d)) {
        s[k] = getType(v);
      }
      return s;
    });
    return {
      _ids: this.#storage._ids,
      records: this.#storage.records,
      _schema,
    };
  }

  get records() {
    return this.#storage.records;
  }

  add(records) {
    const start = this.#storage.records.length;
    for(let i = 0; i < records.length; i++) {
      const id = records[i]._id;
      this.#storage._ids[id] = start + i;
    }
    this.#storage.records = [...this.#storage.records, ...records];
  }

  getItemIndex(id) {
    return this.#storage._ids[id];
  }

  put(idx, record) {
    this.#storage.records[idx] = record;
  }

  delete(deleteMap) {
    this.#storage.records = this.#storage.records.filter((_, idx) => !deleteMap[idx]);
    this.#storage._ids = {};
    for(let i = 0; i < this.#storage.records.length; i++) {
      const record = this.#storage.records[i];
      this.#storage._ids[record._id] = i;
    }
  }
}
