// lib/utils.js
function parseCondition(condition = {}) {
  if (typeof condition === "function")
    return condition;
  const filters = [];
  for (const [k, v] of Object.entries(condition)) {
    if (typeof v === "function") {
      filters.push((d) => v(d[k], k, d));
    } else if (v instanceof RegExp) {
      filters.push((d) => d[k].match(v) != null);
    } else {
      filters.push((d) => d[k] === v);
    }
  }
  return (record) => filters.every((f) => f(record));
}
function mergeConditions(conditions, type = "and") {
  const filters = [];
  for (let i = 0; i < conditions.length; i++) {
    filters.push(parseCondition(conditions[i]));
  }
  if (type === "and") {
    return (record) => filters.every((f) => f(record));
  } else if (type === "or") {
    return (record) => filters.some((f) => f(record));
  } else if (type === "nor") {
    return (record) => !filters.some((f) => f(record));
  }
}
function getType(value) {
  let type = typeof value;
  if (type === "object" && Array.isArray(value)) {
    type = "array";
  } else if (type === "object" && value instanceof Date) {
    type = "date";
  } else if (type === "object" && value instanceof RegExp) {
    type = "regexp";
  } else if (value == null) {
    type = "null";
  }
  return type;
}

// lib/query.js
var query_default = class {
  #table;
  #filter;
  #records;
  #sorter = null;
  #skip = 0;
  #limit = 0;
  #projection = null;
  #updateFields = null;
  #insertFields = null;
  #setOnInsertFields = null;
  #upsert = false;
  constructor(conditions, table) {
    this.#filter = mergeConditions([conditions]);
    this.#table = table;
    this.#insertFields = { ...conditions };
  }
  and(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions);
    this.#filter = (record) => left(record) && right(record);
    for (let i = 0; i < conditions.length; i++) {
      Object.assign(this.#insertFields, conditions[i]);
    }
    return this;
  }
  or(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions, "or");
    this.#filter = (record) => left(record) || right(record);
    this.#insertFields = {};
    return this;
  }
  nor(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions, "nor");
    this.#filter = (record) => !(left(record) || right(record));
    this.#insertFields = {};
    return this;
  }
  async find() {
    const records = await this.#table.getRecords();
    let filtedRecords = records.filter(this.#filter);
    if (this.#sorter)
      filtedRecords.sort(this.#sorter);
    if (this.#skip > 0 || this.#limit > 0) {
      filtedRecords = filtedRecords.slice(this.#skip, this.#skip + this.#limit);
    }
    if (this.#projection) {
      const { type, fields } = this.#projection;
      if (type === "inclusion") {
        filtedRecords = filtedRecords.map((r) => {
          const ret = {};
          fields.forEach((f) => ret[f] = r[f]);
          ret._id = r._id;
          return ret;
        });
      } else if (type === "exclusion") {
        filtedRecords = filtedRecords.map((r) => {
          const ret = { ...r };
          fields.forEach((f) => delete ret[f]);
          return ret;
        });
      }
    }
    this.#records = filtedRecords;
    return filtedRecords;
  }
  async findOne() {
    if (this.#sorter || this.#skip > 0 || this.#limit > 0) {
      return (await this.find())[0] || null;
    }
    const records = await this.#table.getRecords();
    const record = records.find(this.#filter) || null;
    if (this.#projection) {
      const { type, fields } = this.#projection;
      const ret = {};
      if (type === "inclusion") {
        fields.forEach((f) => ret[f] = record[f]);
      } else if (type === "exclusion") {
        Object.assign(ret, record);
        fields.forEach((f) => delete ret[f]);
      }
      return ret;
    }
    return record;
  }
  async count() {
    if (this.#records)
      return this.#records.length;
    return await this.find().length;
  }
  set(fields) {
    this.#updateFields = fields;
    return this;
  }
  setOnInsert(fields) {
    this.#setOnInsertFields = fields;
    return this;
  }
  upsert(flag) {
    this.#upsert = flag;
    return this;
  }
  async save() {
    if (this.#updateFields || this.#upsert) {
      let records = this.#records;
      if (!records)
        records = await this.find();
      if (records.length <= 0 && this.#upsert) {
        records = Object.assign({}, this.#insertFields, this.#setOnInsertFields);
        for (const [k, v] of Object.entries(records)) {
          if (typeof v === "function")
            delete records[k];
        }
        if (this.#updateFields) {
          const updateFields = this.#updateFields;
          for (const [k, v] of Object.entries(updateFields)) {
            if (typeof v !== "function") {
              records[k] = v;
            } else {
              records[k] = v(records[k], k, records);
              if (records[k] === void 0)
                delete records[k];
            }
          }
        }
      } else if (this.#updateFields) {
        const updateFields = this.#updateFields;
        records = records.map((record) => {
          const ret = { ...record };
          for (const [k, v] of Object.entries(updateFields)) {
            if (typeof v !== "function") {
              ret[k] = v;
            } else {
              ret[k] = v(ret[k], k, ret);
              if (ret[k] === void 0)
                delete ret[k];
            }
          }
          return ret;
        });
      } else {
        return await this.#table.save([], true);
      }
      return await this.#table.save(records, true);
    }
    throw new Error("Must use set or upsert at least once");
  }
  async delete() {
    let records = this.#records;
    if (!records)
      records = await this.find();
    return await this.#table.delete(records);
  }
  sort(conditions) {
    const conds = Object.entries(conditions);
    this.#sorter = (a, b) => {
      for (let [k, v] of conds) {
        if (typeof v === "string") {
          if (v.toLowerCase() === "asc") {
            v = 1;
          } else if (v.toLowerCase() === "desc") {
            v = -1;
          }
        }
        if (v !== 1 && v !== -1)
          throw new Error(`Invalid sort condition: ${k} ${v}`);
        if (a[k] != b[k]) {
          return a[k] > b[k] ? v * 1 : v * -1;
        }
      }
      return 0;
    };
    return this;
  }
  skip(n) {
    this.#skip = n;
    return this;
  }
  limit(n) {
    this.#limit = n;
    return this;
  }
  projection(conditions) {
    let type = null;
    const fields = [];
    for (const [k, v] of Object.entries(conditions)) {
      if (!type && v === 1)
        type = "inclusion";
      else if (!type && v === 0)
        type = "exclusion";
      else if (type === "inclusion" && v === 0 || type === "exclusion" && v === 1)
        throw new Error("Projection cannot have a mix of inclusion and exclusion.");
      fields.push(k);
    }
    this.#projection = { type, fields };
    return this;
  }
  get table() {
    return this.#table;
  }
};

// node_modules/uuid/dist/esm-browser/rng.js
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  if (!getRandomValues) {
    getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);
    if (!getRandomValues) {
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    }
  }
  return getRandomValues(rnds8);
}

// node_modules/uuid/dist/esm-browser/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// node_modules/uuid/dist/esm-browser/native.js
var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var native_default = {
  randomUUID
};

// node_modules/uuid/dist/esm-browser/v4.js
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  options = options || {};
  const rnds = options.random || (options.rng || rng)();
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default = v4;

// lib/platform/browser/index.js
function createTable(table) {
}
async function fileSync(table) {
}
async function getRecords(table) {
}

// lib/table.js
function _insert(records, ids, table) {
  const start = table.records.length;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    table._ids[id] = start + i;
  }
  table.records = [...table.records, ...records];
}
RegExp.prototype.toJSON = function() {
  return { type: "RegExp", source: this.source, flags: this.flags };
};
var table_default = class {
  #name;
  #db;
  constructor(name, { root = ".db", meta = ".meta", database } = {}) {
    if (name.startsWith(".")) {
      throw new TypeError("The table name cannot starts with '.'.");
    }
    this.#name = name;
    this.#db = database;
    createTable(this, root, meta);
  }
  get database() {
    return this.#db;
  }
  get name() {
    return this.#name;
  }
  async getRecords() {
    return getRecords(this);
  }
  async save(records = [], countResult = false) {
    const originalRecords = records;
    if (!Array.isArray(records)) {
      records = [records];
    }
    await getRecords(this);
    const insertRecords = [];
    const insertIds = [];
    const datetime = /* @__PURE__ */ new Date();
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      record.createdAt = record.createdAt || datetime;
      record.updatedAt = datetime;
      if (record._id != null) {
        const idx = this._storage._ids[record._id];
        if (idx >= 0) {
          this._storage.records[idx] = record;
        }
      } else {
        record._id = record._id || v4_default();
        insertRecords.push(record);
        insertIds.push(record._id);
      }
    }
    const upsertedCount = insertRecords.length;
    const modifiedCount = records.length - upsertedCount;
    _insert(insertRecords, insertIds, this._storage);
    await fileSync(this);
    if (countResult)
      return { modifiedCount, upsertedCount };
    return originalRecords;
  }
  async delete(records = []) {
    if (!Array.isArray(records))
      records = [records];
    await getRecords(this);
    let deletedCount = 0;
    const filterMap = {};
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const idx = this._storage._ids[record._id];
      if (idx >= 0)
        deletedCount++;
      filterMap[idx] = true;
    }
    this._storage.records = this._storage.records.filter((_, idx) => !filterMap[idx]);
    this._storage._ids = {};
    for (let i = 0; i < this._storage.records.length; i++) {
      const record = this._storage.records[i];
      this._storage._ids[record._id] = i;
    }
    await fileSync(this);
    return { deletedCount };
  }
  where(conditions) {
    const query = new query_default(conditions, this);
    return query;
  }
};

// lib/operator.js
var operator_default = class {
  gt(value) {
    return (d) => d > value;
  }
  greaterThan(value) {
    return (d) => d > value;
  }
  gte(value) {
    return (d) => d >= value;
  }
  greaterThanOrEqual(value) {
    return (d) => d >= value;
  }
  lt(value) {
    return (d) => d < value;
  }
  lessThan(value) {
    return (d) => d < value;
  }
  lte(value) {
    return (d) => d <= value;
  }
  lessThanOrEqual(value) {
    return (d) => d <= value;
  }
  eq(value) {
    return (d) => d == value;
  }
  equal(value) {
    return (d) => d == value;
  }
  ne(value) {
    return (d) => d != value;
  }
  notEqual(value) {
    return (d) => d != value;
  }
  mod(divisor, remainder) {
    return (d) => d % divisor === remainder;
  }
  in(list) {
    return (d) => {
      if (Array.isArray(d)) {
        return d.some((item) => list.includes(item));
      }
      return list.includes(d);
    };
  }
  nin(list) {
    return (d) => {
      if (Array.isArray(d)) {
        return !d.some((item) => list.includes(item));
      }
      return !list.includes(d);
    };
  }
  all(list) {
    return (d) => {
      if (Array.isArray(d)) {
        return d.every((item) => list.includes(item));
      }
    };
  }
  size(len) {
    return (d) => {
      if (Array.isArray(d)) {
        return d.length === len;
      }
    };
  }
  bitsAllClear(positions) {
    return (d) => {
      if (typeof d === "number") {
        const mask = 0;
        positions.forEach((p) => mask | 1 << p);
        return d & mask === 0;
      }
    };
  }
  bitsAnyClear(positions) {
    return (d) => {
      if (typeof d === "number") {
        const mask = 0;
        positions.forEach((p) => mask | 1 << p);
        return d & mask < mask;
      }
    };
  }
  bitsAllSet(positions) {
    return (d) => {
      if (typeof d === "number") {
        const mask = 0;
        positions.forEach((p) => mask | 1 << p);
        return d & mask === mask;
      }
    };
  }
  bitsAnySet(positions) {
    return (d) => {
      if (typeof d === "number") {
        const mask = 0;
        positions.forEach((p) => mask | 1 << p);
        return d & mask > 0;
      }
    };
  }
  elemMatch(conditions) {
    const filter = typeof conditions === "function" ? conditions : mergeConditions(conditions);
    return (d) => {
      if (Array.isArray(d)) {
        return d.some((item) => filter(item));
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
    return (d) => !condition(d);
  }
  and(conditions) {
    return mergeConditions(conditions, "and");
  }
  or(conditions) {
    return mergeConditions(conditions, "or");
  }
  nor(conditions) {
    return mergeConditions(conditions, "nor");
  }
  inc(value) {
    return (d) => {
      if (typeof d !== "number") {
        throw new Error("Cannot apply $inc to a value of non-numeric type.");
      }
      return d + value;
    };
  }
  mul(value) {
    return (d) => {
      if (typeof d !== "number") {
        throw new Error("Cannot apply $inc to a value of non-numeric type.");
      }
      return d * value;
    };
  }
  min(value) {
    return (d) => {
      if (typeof d !== "number") {
        throw new Error("Cannot apply $inc to a value of non-numeric type.");
      }
      return Math.min(d, value);
    };
  }
  max(value) {
    return (d) => {
      if (typeof d !== "number") {
        throw new Error("Cannot apply $inc to a value of non-numeric type.");
      }
      return Math.max(d, value);
    };
  }
  rename(newKey) {
    return (d, k, o) => {
      if (newKey !== k) {
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
    return () => /* @__PURE__ */ new Date();
  }
};

// lib/db.js
var db_default = class extends operator_default {
  #root;
  #meta;
  #name;
  #tables = {};
  constructor({ root = ".db", meta = ".meta", name = v4_default() } = {}) {
    super();
    this.#root = root;
    this.#meta = meta;
    this.#name = name;
  }
  get name() {
    return this.#name;
  }
  table(name) {
    if (!this.#tables[name])
      this.#tables[name] = new table_default(name, { root: this.#root, meta: this.#meta, database: this });
    return this.#tables[name];
  }
};

// index.js
var airdb_lite_default = db_default;
export {
  db_default as AirDB,
  airdb_lite_default as default
};
