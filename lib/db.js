import Table from './table.js';

import Operator from './operator.js';

export default class extends Operator {
  #root;
  #meta;
  #tables = {};

  constructor({root = '.db', meta = '.meta'} = {}) {
    super();
    this.#root = root;
    this.#meta = meta;
  }

  table(name) {
    if(!this.#tables[name])
      this.#tables[name] = new Table(name, {root: this.#root, meta: this.#meta});
    return this.#tables[name];
  }
}