import Table from './table.js';

import Operator from './operator.js';

export default class extends Operator {
  #root;
  #meta;

  constructor(root = '.db', meta = '.meta') {
    super();
    this.#root = root;
    this.#meta = meta;
  }

  table(name) {
    return new Table(name, this.#root, this.#meta);
  }
}