import Table from './table.js';

import Operator from './operator.js';

export default class extends Operator {
  #root;
  #meta;
  #name;
  #version;
  #tables = {};

  constructor({root = '.db', meta = '.meta', name = 'airdb', version = 1} = {}) {
    super();
    this.#root = root;
    this.#meta = meta;
    this.#name = name;
    this.#version = version;
  }

  get name() {
    return this.#name;
  }

  get version() {
    return this.#version;
  }

  close() {
    if(this.instance) this.instance.close();
  }

  table(name, {indexes} = {}) {
    if(!this.#tables[name])
      this.#tables[name] = new Table(name, {root: this.#root, meta: this.#meta, database: this, indexes});
    return this.#tables[name];
  }
}