import { randomUUID } from 'node:crypto';

export function generateID() {
  return randomUUID({ disableEntropyCache: true });
}

function parseCondition(condition = {}) {
  if(typeof condition === 'function') return condition;

  const filters = [];

  for(const [k, v] of Object.entries(condition)) {
    if(typeof v !== 'function') {
      filters.push((d) => d[k] === v);
    } else {
      filters.push((d) => v(d[k], k, d));
    }
  }
  return record => filters.every(f => f(record));
}

export function mergeConditions(conditions, type = 'and') {
  const filters = [];
  for(let i = 0; i < conditions.length; i++) {
    filters.push(parseCondition(conditions[i]));
  }

  if(type === 'and') {
    return record => filters.every(f => f(record));
  } else if(type === 'or') {
    return record => filters.some(f => f(record));
  } else if(type === 'nor') {
    return record => !filters.some(f => f(record));
  }
}

export function getType(value) {
  let type = typeof value;
  if(type === 'object' && Array.isArray(value)) {
    type = 'array';
  } else if(type === 'object' && value instanceof Date) {
    type = 'date';
  } else if(type === 'object' && value instanceof RegExp) {
    type = 'regexp';
  } else if(value == null) {
    type = 'null';
  }
  return type;
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}