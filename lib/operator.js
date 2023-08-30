import {mergeConditions, getType} from './utils.js';

export default class {
  gt(value) {
    const fn = d => d > value;
    fn._type = 'gt';
    fn._value = value;
    return fn;
  }

  greaterThan(value) {
    return this.gt(value);
  }

  gte(value) {
    const fn = d => d >= value;
    fn._type = 'gte';
    fn._value = value;
    return fn;
  }

  greaterThanOrEqual(value) {
    return this.gte(value);
  }

  lt(value) {
    const fn = d => d < value;
    fn._type = 'lt';
    fn._value = value;
    return fn;
  }

  lessThan(value) {
    return this.lt(value);
  }

  lte(value) {
    const fn = d => d <= value;
    fn._type = 'lte';
    fn._value = value;
    return fn;
  }

  lessThanOrEqual(value) {
    return this.lte(value);
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

  mod(divisor, remainder) {
    return d => d % divisor === remainder;
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

  all(list) {
    return d => {
      if(Array.isArray(d)) {
        return d.every(item => list.includes(item));
      }
    };
  }

  size(len) {
    return d => {
      if(Array.isArray(d)) {
        return d.length === len;
      }
    };
  }

  bitsAllClear(positions) {
    return d => {
      if(typeof d === 'number') {
        const mask = 0;
        positions.forEach(p => mask | (1 << p));
        return d & mask === 0;
      }
    };
  }

  bitsAnyClear(positions) {
    return d => {
      if(typeof d === 'number') {
        const mask = 0;
        positions.forEach(p => mask | (1 << p));
        return d & mask < mask;
      }
    };
  }

  bitsAllSet(positions) {
    return d => {
      if(typeof d === 'number') {
        const mask = 0;
        positions.forEach(p => mask | (1 << p));
        return d & mask === mask;
      }
    };
  }

  bitsAnySet(positions) {
    return d => {
      if(typeof d === 'number') {
        const mask = 0;
        positions.forEach(p => mask | (1 << p));
        return d & mask > 0;
      }
    };
  }

  elemMatch(conditions) {
    const filter = typeof conditions === 'function' ? conditions : mergeConditions(conditions);

    return d => {
      if(Array.isArray(d)) {
        return d.some(item => filter(item));
      }
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

  inc(value) {
    return (d) => {
      if(typeof d !== 'number') {
        throw new Error('Cannot apply $inc to a value of non-numeric type.');
      }
      return d + value;
    };
  }

  mul(value) {
    return (d) => {
      if(typeof d !== 'number') {
        throw new Error('Cannot apply $inc to a value of non-numeric type.');
      }
      return d * value;
    };
  }

  min(value) {
    return (d) => {
      if(typeof d !== 'number') {
        throw new Error('Cannot apply $inc to a value of non-numeric type.');
      }
      return Math.min(d, value);
    };
  }

  max(value) {
    return (d) => {
      if(typeof d !== 'number') {
        throw new Error('Cannot apply $inc to a value of non-numeric type.');
      }
      return Math.max(d, value);
    };
  }

  rename(newKey) {
    return (d, k, o) => {
      if(newKey !== k) {
        o[newKey] = o[k];
      }
    };
  }

  unset() {
    return () => {
      return;
    };
  }

  currentDate() {
    return () => new Date();
  }
}