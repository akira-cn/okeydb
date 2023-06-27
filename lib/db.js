import Table from './table.js';

import Operator from './operator.js';

export default class extends Operator {
  #root;

  constructor(root = '.db') {
    super();
    this.#root = root;
  }

  table(name) {
    return new Table(name, this.#root);
  }
}