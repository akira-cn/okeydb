var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.js
var airdb_lite_exports = {};
__export(airdb_lite_exports, {
  default: () => airdb_lite_default
});
module.exports = __toCommonJS(airdb_lite_exports);

// lib/table.js
var import_node_path = __toESM(require("node:path"), 1);
var import_node_fs = require("node:fs");
var import_promises = require("node:fs/promises");

// lib/utils.js
var import_node_crypto = require("node:crypto");
function generateID() {
  return (0, import_node_crypto.randomUUID)({ disableEntropyCache: true });
}
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
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

// lib/table.js
RegExp.prototype.toJSON = function() {
  return { type: "RegExp", source: this.source, flags: this.flags };
};
function toJSON() {
  const _schema = this.records.map((d) => {
    const s = {};
    for (const [k, v] of Object.entries(d)) {
      s[k] = getType(v);
    }
    return s;
  });
  return {
    _ids: this._ids,
    records: this.records,
    _schema
  };
}
async function getRecordsFromFile(filepath) {
  await _fileLock(filepath);
  let records = await (0, import_promises.readFile)(filepath, { charset: "utf8" });
  await _fileUnlock(filepath);
  records = JSON.parse(records);
  records.records = records.records.map((r, i) => {
    const schema = records._schema[i];
    for (const [k, v] of Object.entries(schema)) {
      if (v === "date") {
        r[k] = new Date(r[k]);
      } else if (v === "regexp") {
        r[k] = new RegExp(r[k].source, r[k].flags);
      }
    }
    return r;
  });
  delete records._schema;
  records.toJSON = toJSON;
  return records;
}
function _insert(records, ids, table) {
  const start = table.records.length;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    table._ids[id] = start + i;
  }
  table.records = [...table.records, ...records];
}
async function _fileLock(filepath, unlock = false) {
  const locker = `${filepath}.lck`;
  while ((0, import_node_fs.existsSync)(locker)) {
    await sleep(10);
  }
  if (!unlock)
    (0, import_node_fs.writeFileSync)(locker, "");
}
async function _fileUnlock(filepath) {
  const locker = `${filepath}.lck`;
  await (0, import_promises.unlink)(locker);
}
async function _updateMeta(metafile, version) {
  await _fileLock(metafile);
  const metadata = JSON.parse(await (0, import_promises.readFile)(metafile, { charset: "utf8" }));
  metadata.version = version;
  await (0, import_promises.writeFile)(metafile, JSON.stringify(metadata), { charset: "utf8" });
  await _fileUnlock(metafile);
}
var table_default = class {
  #name;
  #root;
  #records;
  #meta;
  #version;
  constructor(name, { root = ".db", meta = ".meta" } = {}) {
    if (name.startsWith(".")) {
      throw new TypeError("The table name cannot starts with '.'.");
    }
    this.#name = name;
    this.#root = root;
    this.#meta = meta;
    if (!(0, import_node_fs.existsSync)(this.#root)) {
      (0, import_node_fs.mkdirSync)(this.#root);
    }
    if (!(0, import_node_fs.existsSync)(this.#meta)) {
      (0, import_node_fs.mkdirSync)(this.#meta);
    }
    if (!(0, import_node_fs.existsSync)(this.metapath)) {
      this.#version = generateID();
      (0, import_node_fs.writeFileSync)(this.metapath, JSON.stringify({ version: this.#version }), { charset: "utf8" });
    } else {
      const { version } = JSON.parse((0, import_node_fs.readFileSync)(this.metapath, { charset: "utf8" }));
      this.#version = version;
    }
    if (!(0, import_node_fs.existsSync)(this.filepath)) {
      const records = {
        _ids: {},
        records: [],
        toJSON
      };
      (0, import_node_fs.writeFileSync)(this.filepath, JSON.stringify(records), { charset: "utf8" });
      this.#records = records;
    }
  }
  async getRecords() {
    await _fileLock(this.metapath);
    const { version } = JSON.parse(await (0, import_promises.readFile)(this.metapath, { charset: "utf8" }));
    if (!this.#records || this.#version !== version) {
      this.#records = await getRecordsFromFile(this.filepath);
    }
    this.#version = version;
    await _fileUnlock(this.metapath);
    return this.#records.records.slice(0);
  }
  get name() {
    return this.#name;
  }
  get metapath() {
    return import_node_path.default.join(this.#meta, `${this.name}.meta`);
  }
  get filepath() {
    return import_node_path.default.join(this.#root, this.name);
  }
  async save(records = [], countResult = false) {
    if (!Array.isArray(records))
      records = [records];
    await this.getRecords();
    const insertRecords = [];
    const insertIds = [];
    const datetime = /* @__PURE__ */ new Date();
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      record.createdAt = record.createdAt || datetime;
      record.updatedAt = datetime;
      if (record._id != null) {
        const idx = this.#records._ids[record._id];
        if (idx >= 0) {
          this.#records.records[idx] = record;
        }
      } else {
        record._id = record._id || generateID();
        insertRecords.push(record);
        insertIds.push(record._id);
      }
    }
    const upsertedCount = insertRecords.length;
    const modifiedCount = records.length - upsertedCount;
    _insert(insertRecords, insertIds, this.#records);
    this.#fileSync();
    if (countResult)
      return { modifiedCount, upsertedCount };
    return records;
  }
  async #fileSync() {
    await _fileLock(this.filepath);
    await (0, import_promises.writeFile)(this.filepath, JSON.stringify(this.#records), { charset: "utf8" });
    const version = generateID();
    await _updateMeta(this.metapath, version);
    this.#version = version;
    await _fileUnlock(this.filepath);
  }
  async delete(records = []) {
    if (!Array.isArray(records))
      records = [records];
    await this.getRecords();
    let deletedCount = 0;
    const filterMap = {};
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const idx = this.#records._ids[record._id];
      if (idx >= 0)
        deletedCount++;
      filterMap[idx] = true;
    }
    this.#records.records = this.#records.records.filter((_, idx) => !filterMap[idx]);
    this.#records._ids = {};
    for (let i = 0; i < this.#records.records.length; i++) {
      const record = this.#records.records[i];
      this.#records._ids[record._id] = i;
    }
    this.#fileSync();
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
  #tables = {};
  constructor({ root = ".db", meta = ".meta" } = {}) {
    super();
    this.#root = root;
    this.#meta = meta;
  }
  table(name) {
    if (!this.#tables[name])
      this.#tables[name] = new table_default(name, { root: this.#root, meta: this.#meta });
    return this.#tables[name];
  }
};

// index.js
var airdb_lite_default = db_default;
