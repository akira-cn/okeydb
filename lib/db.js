import Table from './table.js';

import {mergeConditions} from './utils.js';

export default class {
  #root;

  constructor(root = '.db') {
    this.#root = root;
  }

  table(name) {
    return new Table(name, this.#root);
  }

  gt(value) {
    return d => d > value;
  }

  gte(value) {
    return d => d >= value;
  }

  lt(value) {
    return d => d < value;
  }

  lte(value) {
    return d => d <= value;
  }

  ne(value) {
    return d => d != value;
  }

  in(list) {
    return d => {
      if(Array.isArray(d)) {
        return d.some(item => list.includes(item));
      }
      return list.includes(d);
    };
  }

  nin(list) {
    return d => {
      if(Array.isArray(d)) {
        return !d.some(item => list.includes(item));
      }
      return !list.includes(d);
    };
  }

  not(condition) {
    return d => !condition(d);
  }

  and(conditions) {
    return mergeConditions(conditions, 'and');
  }

  or(conditions) {
    return mergeConditions(conditions, 'or');
  }

  nor(conditions) {
    return mergeConditions(conditions, 'nor');
  }
}