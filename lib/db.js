import Table from './table.js';

import Operator from './operator.js';

export default class extends Operator {
  #root;
  #meta;
  #name;
  #tables = {};

  constructor({root = '.db', meta = '.meta', name = 'airdb'} = {}) {
    super();
    this.#root = root;
    this.#meta = meta;
    this.#name = name;
  }

  get name() {
    return this.#name;
  }

  table(name) {
    if(!this.#tables[name])
      this.#tables[name] = new Table(name, {root: this.#root, meta: this.#meta, database: this});
    return this.#tables[name];
  }
}