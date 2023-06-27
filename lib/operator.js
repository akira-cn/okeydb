import {mergeConditions, getType} from './utils.js';

export default class {
  gt(value) {
    return d => d > value;
  }

  greaterThan(value) {
    return d => d > value;
  }

  gte(value) {
    return d => d >= value;
  }

  greaterThanOrEqual(value) {
    return d => d >= value;
  }

  lt(value) {
    return d => d < value;
  }

  lessThan(value) {
    return d => d < value;
  }

  lte(value) {
    return d => d <= value;
  }

  lessThanOrEqual(value) {
    return d => d <= value;
  }

  eq(value) {
    return d => d == value;
  }

  equal(value) {
    return d => d == value;
  }

  ne(value) {
    return d => d != value;
  }

  notEqual(value) {
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

  exists(flag) {
    return (d, k, o) => k in o == flag;
  }

  type(t) {
    return (d, k, o) => k in o && getType(d) === t;
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