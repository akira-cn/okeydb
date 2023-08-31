import {mergeConditions, getType} from './utils.js';

const _filter = Symbol.for('airdb-filter');

export default class Operator {
  constructor(filter, prev) {
    if(filter && prev) {
      this[_filter] = (this.and(prev, filter))[_filter];
    } else if(filter) {
      this[_filter] = filter;
    }
  }

  gt(value) {
    const fn = d => d > value;
    const ret = new Operator(fn, this[_filter]);
    if(!this[_filter]) {
      ret._type = 'gt';
      ret._value = value;
    } else if(this._type === 'lt' || this._type === 'lte') {
      ret._type = `gt${this._type}`; // ltgt & ltegt
      ret._value = [value, this._value];
    }
    return ret;
  }

  greaterThan(value) {
    return this.gt(value);
  }

  gte(value) {
    const fn = d => d >= value;
    const ret = new Operator(fn, this[_filter]);
    if(!this[_filter]) {
      ret._type = 'gte';
      ret._value = value;
    } else if(this._type === 'lt' || this._type === 'lte') {
      ret._type = `gte${this._type}`;
      ret._value = [value, this._value];
    }
    return ret;
  }

  greaterThanOrEqual(value) {
    return this.gte(value);
  }

  lt(value) {
    const fn = (d) => d < value;
    const ret = new Operator(fn, this[_filter]);
    if(!this[_filter]) {
      ret._type = 'lt';
      ret._value = value;
    } else if(this._type === 'gt' || this._type === 'gte') {
      ret._type = `${this._type}lt`;
      ret._value = [this._value, value];
    }
    return ret;
  }

  lessThan(value) {
    return this.lt(value);
  }

  lte(value) {
    const fn = d => d <= value;
    const ret = new Operator(fn, this[_filter]);
    if(!this[_filter]) {
      ret._type = 'lte';
      ret._value = value;
    } else if(this._type === 'gt' || this._type === 'gte') {
      ret._type = `${this._type}lte`;
      ret._value = [this._value, value];
    }
    return ret;
  }

  lessThanOrEqual(value) {
    return this.lte(value);
  }

  eq(value) {
    return new Operator(d => d == value, this[_filter]);
  }

  equal(value) {
    return new Operator(d => d == value, this[_filter]);
  }

  ne(value) {
    return new Operator(d => d != value, this[_filter]);
  }

  notEqual(value) {
    return new Operator(d => d != value, this[_filter]);
  }

  mod(divisor, remainder) {
    return new Operator(d => d % divisor === remainder, this[_filter]);
  }

  in(list) {
    return new Operator(d => {
      if(Array.isArray(d)) {
        return d.some(item => list.includes(item));
      }
      return list.includes(d);
    }, this[_filter]);
  }

  nin(list) {
    return new Operator(d => {
      if(Array.isArray(d)) {
        return !d.some(item => list.includes(item));
      }
      return !list.includes(d);
    }, this[_filter]);
  }

  all(list) {
    return new Operator(d => {
      if(Array.isArray(d)) {
        return d.every(item => list.includes(item));
      }
    }, this[_filter]);
  }

  size(len) {
    return new Operator(d => {
      if(Array.isArray(d)) {
        return d.length === len;
      }
    }, this[_filter]);
  }

  bitsAllClear(positions) {
    return new Operator(d => {
      if(typeof d === 'number') {
        const mask = 0;
        positions.forEach(p => mask | (1 << p));
        return d & mask === 0;
      }
    }, this[_filter]);
  }

  bitsAnyClear(positions) {
    return new Operator(d => {
      if(typeof d === 'number') {
        const mask = 0;
        positions.forEach(p => mask | (1 << p));
        return d & mask < mask;
      }
    }, this[_filter]);
  }

  bitsAllSet(positions) {
    return new Operator(d => {
      if(typeof d === 'number') {
        const mask = 0;
        positions.forEach(p => mask | (1 << p));
        return d & mask === mask;
      }
    }, this[_filter]);
  }

  bitsAnySet(positions) {
    return new Operator(d => {
      if(typeof d === 'number') {
        const mask = 0;
        positions.forEach(p => mask | (1 << p));
        return d & mask > 0;
      }
    }, this[_filter]);
  }

  elemMatch(conditions) {
    const filter = conditions instanceof Operator || typeof conditions === 'function' 
      ? conditions : mergeConditions(conditions);

    return new Operator(d => {
      if(Array.isArray(d)) {
        return d.some(item => filter(item));
      }
    }, this[_filter]);
  }

  exists(flag) {
    return new Operator((d, k, o) => k in o == flag, this[_filter]);
  }

  type(t) {
    return new Operator((d, k, o) => k in o && getType(d) === t, this[_filter]);
  }

  not(condition) {
    return new Operator(d => !condition(d), this[_filter]);
  }

  and(...conditions) {
    return new Operator(mergeConditions(conditions, 'and'), this[_filter]);
  }

  or(...conditions) {
    return new Operator(mergeConditions(conditions, 'or'), this[_filter]);
  }

  nor(...conditions) {
    return new Operator(mergeConditions(conditions, 'nor'), this[_filter]);
  }

  inc(value) {
    return new Operator((d) => {
      if(typeof d !== 'number') {
        throw new Error('Cannot apply $inc to a value of non-numeric type.');
      }
      return d + value;
    }, this[_filter]);
  }

  mul(value) {
    return new Operator((d) => {
      if(typeof d !== 'number') {
        throw new Error('Cannot apply $inc to a value of non-numeric type.');
      }
      return d * value;
    }, this[_filter]);
  }

  min(value) {
    return new Operator((d) => {
      if(typeof d !== 'number') {
        throw new Error('Cannot apply $inc to a value of non-numeric type.');
      }
      return Math.min(d, value);
    }, this[_filter]);
  }

  max(value) {
    return new Operator((d) => {
      if(typeof d !== 'number') {
        throw new Error('Cannot apply $inc to a value of non-numeric type.');
      }
      return Math.max(d, value);
    }, this[_filter]);
  }

  rename(newKey) {
    return new Operator((d, k, o) => {
      if(newKey !== k) {
        o[newKey] = o[k];
      }
    }, this[_filter]);
  }

  unset() {
    return new Operator(() => {
      return;
    }, this[_filter]);
  }

  currentDate() {
    return new Operator(() => new Date(), this[_filter]);
  }
}