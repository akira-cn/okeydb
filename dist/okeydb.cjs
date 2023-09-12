var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
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

// lib/utils.js
function parseCondition(condition = {}) {
  if (typeof condition === "function")
    return condition;
  if (condition[_filter])
    return condition[_filter];
  const filters = [];
  for (const [k, v] of Object.entries(condition)) {
    if (typeof v === "function") {
      filters.push((d) => v(d[k], k, d));
    } else if (v && typeof v[_filter] === "function") {
      const f = v[_filter];
      filters.push((d) => f(d[k], k, d));
    } else if (v instanceof RegExp) {
      filters.push((d) => d[k] && typeof d[k].match === "function" && d[k].match(v) != null);
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
var _filter;
var init_utils = __esm({
  "lib/utils.js"() {
    _filter = Symbol.for("okeydb-filter");
  }
});

// node_modules/uuid/dist/esm-node/rng.js
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    import_crypto.default.randomFillSync(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}
var import_crypto, rnds8Pool, poolPtr;
var init_rng = __esm({
  "node_modules/uuid/dist/esm-node/rng.js"() {
    import_crypto = __toESM(require("crypto"));
    rnds8Pool = new Uint8Array(256);
    poolPtr = rnds8Pool.length;
  }
});

// node_modules/uuid/dist/esm-node/stringify.js
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
var byteToHex;
var init_stringify = __esm({
  "node_modules/uuid/dist/esm-node/stringify.js"() {
    byteToHex = [];
    for (let i = 0; i < 256; ++i) {
      byteToHex.push((i + 256).toString(16).slice(1));
    }
  }
});

// node_modules/uuid/dist/esm-node/native.js
var import_crypto2, native_default;
var init_native = __esm({
  "node_modules/uuid/dist/esm-node/native.js"() {
    import_crypto2 = __toESM(require("crypto"));
    native_default = {
      randomUUID: import_crypto2.default.randomUUID
    };
  }
});

// node_modules/uuid/dist/esm-node/v4.js
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
var v4_default;
var init_v4 = __esm({
  "node_modules/uuid/dist/esm-node/v4.js"() {
    init_native();
    init_rng();
    init_stringify();
    v4_default = v4;
  }
});

// node_modules/uuid/dist/esm-node/index.js
var init_esm_node = __esm({
  "node_modules/uuid/dist/esm-node/index.js"() {
    init_v4();
  }
});

// lib/platform/node/storage.js
var Storage;
var init_storage = __esm({
  "lib/platform/node/storage.js"() {
    init_utils();
    Storage = class {
      #storage;
      constructor(storage) {
        this.#storage = storage;
      }
      toJSON() {
        const _schema = this.#storage.records.map((d) => {
          const s = {};
          for (const [k, v] of Object.entries(d)) {
            s[k] = getType(v);
          }
          return s;
        });
        return {
          _ids: this.#storage._ids,
          records: this.#storage.records,
          _schema
        };
      }
      get records() {
        return this.#storage.records;
      }
      add(records) {
        const start = this.#storage.records.length;
        for (let i = 0; i < records.length; i++) {
          const id = records[i]._id;
          this.#storage._ids[id] = start + i;
        }
        this.#storage.records = [...this.#storage.records, ...records];
      }
      getItemIndex(id) {
        return this.#storage._ids[id];
      }
      put(idx, record) {
        this.#storage.records[idx] = record;
      }
      delete(deleteMap) {
        this.#storage.records = this.#storage.records.filter((_, idx) => !deleteMap[idx]);
        this.#storage._ids = {};
        for (let i = 0; i < this.#storage.records.length; i++) {
          const record = this.#storage.records[i];
          this.#storage._ids[record._id] = i;
        }
      }
    };
  }
});

// lib/platform/node/index.js
var node_exports = {};
__export(node_exports, {
  createTable: () => createTable,
  fileSync: () => fileSync,
  flushData: () => flushData,
  getRecords: () => getRecords
});
async function getRecordsFromFile(filepath2) {
  await _fileLock(filepath2);
  let records = await (0, import_promises.readFile)(filepath2, { charset: "utf8" });
  await _fileUnlock(filepath2);
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
  return new Storage(records);
}
async function _fileLock(filepath2, unlock = false) {
  const locker = `${filepath2}.lck`;
  while ((0, import_node_fs.existsSync)(locker)) {
    await sleep(10);
  }
  if (!unlock)
    await (0, import_promises.writeFile)(locker, "");
}
async function _fileUnlock(filepath2) {
  const locker = `${filepath2}.lck`;
  await (0, import_promises.unlink)(locker);
}
async function _updateMeta(metafile, version) {
  await _fileLock(metafile);
  const metadata = JSON.parse(await (0, import_promises.readFile)(metafile, { charset: "utf8" }));
  metadata.version = version;
  await (0, import_promises.writeFile)(metafile, JSON.stringify(metadata), { charset: "utf8" });
  await _fileUnlock(metafile);
}
function metapath(table) {
  return import_node_path.default.join(table[_meta], `${table.name}.meta`);
}
function filepath(table) {
  return import_node_path.default.join(table[_root], table.name);
}
async function createTable(table, root, meta) {
  table[_root] = root;
  table[_meta] = meta;
  if (!(0, import_node_fs.existsSync)(table[_root])) {
    await (0, import_promises.mkdir)(table[_root]);
  }
  if (!(0, import_node_fs.existsSync)(table[_meta])) {
    await (0, import_promises.mkdir)(table[_meta]);
  }
  if (!(0, import_node_fs.existsSync)(metapath(table))) {
    table._version = v4_default();
    await (0, import_promises.writeFile)(metapath(table), JSON.stringify({ version: table._version }), { charset: "utf8" });
  } else {
    const { version } = JSON.parse(await (0, import_promises.readFile)(metapath(table), { charset: "utf8" }));
    table._version = version;
  }
  if (!(0, import_node_fs.existsSync)(filepath(table))) {
    const records = {
      _ids: {},
      records: []
    };
    await (0, import_promises.writeFile)(filepath(table), JSON.stringify(records), { charset: "utf8" });
    return new Storage(records);
  }
  return null;
}
async function fileSync(table) {
  await _fileLock(filepath(table));
  await (0, import_promises.writeFile)(filepath(table), JSON.stringify(table._storage), { charset: "utf8" });
  const version = v4_default();
  await _updateMeta(metapath(table), version);
  table._version = version;
  await _fileUnlock(filepath(table));
}
async function flushData(table) {
  await _fileLock(metapath(table));
  const { version } = JSON.parse(await (0, import_promises.readFile)(metapath(table), { charset: "utf8" }));
  if (!table._storage || table._version !== version) {
    table._storage = await getRecordsFromFile(filepath(table));
  }
  table._version = version;
  await _fileUnlock(metapath(table));
}
async function getRecords(table, { filter, sorter, skip, limit } = {}) {
  await flushData(table);
  const records = table._storage.records;
  let filtedRecords;
  if (!sorter && skip === 0 && limit === 1) {
    filtedRecords = records.find(filter);
    if (filtedRecords)
      return [filtedRecords];
    return [];
  } else {
    filtedRecords = records.filter(filter);
  }
  if (sorter)
    filtedRecords.sort(sorter);
  if (skip > 0 || Number.isFinite(limit)) {
    filtedRecords = filtedRecords.slice(skip, skip + limit);
  }
  return filtedRecords;
}
var import_node_path, import_node_fs, import_promises, _root, _meta;
var init_node = __esm({
  "lib/platform/node/index.js"() {
    init_utils();
    init_storage();
    import_node_path = __toESM(require("node:path"), 1);
    import_node_fs = require("node:fs");
    import_promises = require("node:fs/promises");
    init_esm_node();
    _root = Symbol("root");
    _meta = Symbol("meta");
  }
});

// index.js
var airdb_lite_exports = {};
__export(airdb_lite_exports, {
  OkeyDB: () => db_default,
  default: () => airdb_lite_default
});
module.exports = __toCommonJS(airdb_lite_exports);

// lib/query.js
init_utils();
var _notIndexFilter = Symbol.for("not-index-filter");
function updateFilterIndex(query, conditions, filterIndexes = {}, phase = "and") {
  const indexes = query.table.indexes;
  let notIndexFilter = false;
  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];
    let hasIndex = false;
    for (const [k, v] of Object.entries(condition)) {
      if (k in indexes) {
        hasIndex = true;
        filterIndexes[k] = filterIndexes[k] || /* @__PURE__ */ new Set();
        filterIndexes[k].add(v);
        if (phase === "and" && filterIndexes[k].size > 1)
          filterIndexes[k].clear();
      } else {
        notIndexFilter = true;
      }
    }
    if (!hasIndex && phase === "or") {
      query.table[_notIndexFilter] = notIndexFilter;
      return null;
    }
  }
  query.table[_notIndexFilter] = notIndexFilter;
  return filterIndexes;
}
var _filter2 = Symbol.for("okeydb-filter");
var query_default = class {
  #table;
  #filter;
  #records;
  #sorter = null;
  #rawSorter;
  #skip = 0;
  #limit = Infinity;
  #projection = null;
  #updateFields = null;
  #insertFields = {};
  #setOnInsertFields = null;
  #upsert = false;
  #filterIndexes = {};
  constructor(condition, table) {
    this.#table = table;
    if (condition) {
      this.#filter = mergeConditions([condition]);
      this.#insertFields = { ...condition };
      this.#filterIndexes = updateFilterIndex(this, [condition], {}, "and");
    }
  }
  and(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions);
    if (left) {
      this.#filter = (record) => left(record) && right(record);
    } else {
      this.#filter = right;
    }
    for (let i = 0; i < conditions.length; i++) {
      Object.assign(this.#insertFields, conditions[i]);
    }
    if (this.#filterIndexes)
      this.#filterIndexes = updateFilterIndex(this, conditions, this.#filterIndexes, "and");
    return this;
  }
  or(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions, "or");
    if (left) {
      this.#filter = (record) => left(record) || right(record);
    } else {
      this.#filter = right;
    }
    this.#insertFields = {};
    if (this.#filterIndexes)
      this.#filterIndexes = updateFilterIndex(this, conditions, this.#filterIndexes, "or");
    return this;
  }
  nor(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions, "or");
    if (left) {
      this.#filter = (record) => !(left(record) || right(record));
    } else {
      this.#filter = (record) => !right(record);
    }
    this.#insertFields = {};
    this.#filterIndexes = null;
    this.table[_notIndexFilter] = true;
    return this;
  }
  async find() {
    let filtedRecords = await this.#table.getRecords({
      filter: this.#filter || function() {
        return true;
      },
      sorter: this.#sorter,
      rawSorter: this.#rawSorter,
      skip: this.#skip,
      limit: this.#limit,
      filterIndexes: this.filterIndexes
    });
    if (this.#projection) {
      const { type, fields } = this.#projection;
      if (type === "inclusion") {
        filtedRecords = filtedRecords.map((r) => {
          const ret = {};
          fields.forEach((f) => ret[f] = r[f]);
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
    const records = await this.#table.getRecords({
      filter: this.#filter || function() {
        return true;
      },
      sorter: this.#sorter,
      rawSorter: this.#rawSorter,
      skip: this.#skip,
      limit: 1,
      filterIndexes: this.filterIndexes
    });
    const record = records[0];
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
        for (let [k, v] of Object.entries(records)) {
          if (v && typeof v[_filter2] === "function") {
            v = v[_filter2];
          }
          if (typeof v === "function") {
            records[k] = v(records[k], k, records);
          }
        }
        if (this.#updateFields) {
          const updateFields = this.#updateFields;
          for (let [k, v] of Object.entries(updateFields)) {
            if (v && typeof v[_filter2] === "function") {
              v = v[_filter2];
            }
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
          for (let [k, v] of Object.entries(updateFields)) {
            if (v && typeof v[_filter2] === "function") {
              v = v[_filter2];
            }
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
    this.#rawSorter = conditions;
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
    let ignoreId = false;
    for (const [k, v] of Object.entries(conditions)) {
      if (k === "_id") {
        ignoreId = !v;
        continue;
      }
      if (!type && v)
        type = "inclusion";
      else if (!type && !v)
        type = "exclusion";
      else if (type === "inclusion" && !v || type === "exclusion" && v)
        throw new Error("Projection cannot have a mix of inclusion and exclusion.");
      fields.push(k);
    }
    if (type === "exclusion" && ignoreId || type === "inclusion" && !ignoreId) {
      fields.push("_id");
    }
    if (type === "exclusion" && !ignoreId) {
      throw new Error("Projection cannot have a mix of inclusion and exclusion.");
    }
    this.#projection = { type: type || "inclusion", fields };
    return this;
  }
  get table() {
    return this.#table;
  }
  get filterIndexes() {
    const filterIndexes = this.#filterIndexes || {};
    if (Object.keys(filterIndexes).length)
      return filterIndexes;
    return null;
  }
};

// lib/table.js
init_esm_node();
var Table = (() => {
  let platform;
  if (false) {
    platform = null;
  } else {
    platform = Promise.resolve().then(() => (init_node(), node_exports));
  }
  RegExp.prototype.toJSON = function() {
    return { type: "RegExp", source: this.source, flags: this.flags };
  };
  return class {
    #name;
    #db;
    #ready;
    #indexes;
    constructor(name, { root = ".db", meta = ".meta", database, indexes } = {}) {
      if (name.startsWith(".")) {
        throw new TypeError("The table name cannot starts with '.'.");
      }
      this.#name = name;
      this.#db = database;
      this.#indexes = {
        _id: true,
        // indent
        createdAt: false,
        updatedAt: false,
        ...indexes
      };
      this.#ready = platform.then(({ createTable: createTable2 }) => {
        return createTable2(this, root, meta);
      }).then((res) => {
        this._storage = res;
      });
    }
    get indexes() {
      return this.#indexes;
    }
    get database() {
      return this.#db;
    }
    get name() {
      return this.#name;
    }
    async getRecords({ filter, sorter, skip, limit, filterIndexes, rawSorter } = {}) {
      await this.#ready;
      const { getRecords: getRecords2 } = await platform;
      return getRecords2(this, { filter, sorter, skip, limit, filterIndexes, rawSorter });
    }
    async save(records = [], countResult = false) {
      await this.#ready;
      const originalRecords = records;
      if (!Array.isArray(records)) {
        records = [records];
      }
      const { flushData: flushData2 } = await platform;
      await flushData2(this);
      const insertRecords = [];
      const datetime = /* @__PURE__ */ new Date();
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        record.createdAt = record.createdAt || datetime;
        record.updatedAt = datetime;
        if (record._id != null) {
          const idx = this._storage.getItemIndex(record._id);
          if (idx >= 0) {
            await this._storage.put(idx, record);
          }
        } else {
          record._id = record._id || v4_default();
          insertRecords.push(record);
        }
      }
      const upsertedCount = insertRecords.length;
      const modifiedCount = records.length - upsertedCount;
      await this._storage.add(insertRecords);
      const { fileSync: fileSync2 } = await platform;
      await fileSync2(this);
      if (countResult)
        return { modifiedCount, upsertedCount };
      return originalRecords;
    }
    async delete(records = []) {
      await this.#ready;
      if (!Array.isArray(records))
        records = [records];
      const { flushData: flushData2 } = await platform;
      await flushData2(this);
      let deletedCount = 0;
      const filterMap = {};
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const idx = this._storage.getItemIndex(record._id);
        if (idx >= 0)
          deletedCount++;
        filterMap[idx] = true;
      }
      await this._storage.delete(filterMap);
      const { fileSync: fileSync2 } = await platform;
      await fileSync2(this);
      return { deletedCount };
    }
    where(condition = null) {
      const query = new query_default(condition, this);
      return query;
    }
  };
})();
var table_default = Table;

// lib/operator.js
init_utils();
var _filter3 = Symbol.for("okeydb-filter");
var Operator = class _Operator {
  constructor(filter, prev) {
    if (filter && prev) {
      this[_filter3] = this.and(prev, filter)[_filter3];
    } else if (filter) {
      this[_filter3] = filter;
    }
  }
  gt(value) {
    const fn = (d) => d > value;
    const ret = new _Operator(fn, this[_filter3]);
    if (!this[_filter3]) {
      ret._type = "gt";
      ret._value = value;
    } else if (this._type === "lt" || this._type === "lte") {
      ret._type = `gt${this._type}`;
      ret._value = [value, this._value];
    }
    return ret;
  }
  greaterThan(value) {
    return this.gt(value);
  }
  gte(value) {
    const fn = (d) => d >= value;
    const ret = new _Operator(fn, this[_filter3]);
    if (!this[_filter3]) {
      ret._type = "gte";
      ret._value = value;
    } else if (this._type === "lt" || this._type === "lte") {
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
    const ret = new _Operator(fn, this[_filter3]);
    if (!this[_filter3]) {
      ret._type = "lt";
      ret._value = value;
    } else if (this._type === "gt" || this._type === "gte") {
      ret._type = `${this._type}lt`;
      ret._value = [this._value, value];
    }
    return ret;
  }
  lessThan(value) {
    return this.lt(value);
  }
  lte(value) {
    const fn = (d) => d <= value;
    const ret = new _Operator(fn, this[_filter3]);
    if (!this[_filter3]) {
      ret._type = "lte";
      ret._value = value;
    } else if (this._type === "gt" || this._type === "gte") {
      ret._type = `${this._type}lte`;
      ret._value = [this._value, value];
    }
    return ret;
  }
  lessThanOrEqual(value) {
    return this.lte(value);
  }
  eq(value) {
    return new _Operator((d) => d == value, this[_filter3]);
  }
  equal(value) {
    return new _Operator((d) => d == value, this[_filter3]);
  }
  ne(value) {
    return new _Operator((d) => d != value, this[_filter3]);
  }
  notEqual(value) {
    return new _Operator((d) => d != value, this[_filter3]);
  }
  mod(divisor, remainder) {
    return new _Operator((d) => d % divisor === remainder, this[_filter3]);
  }
  in(list) {
    return new _Operator((d) => {
      if (Array.isArray(d)) {
        return d.some((item) => list.includes(item));
      }
      return list.includes(d);
    }, this[_filter3]);
  }
  nin(list) {
    return new _Operator((d) => {
      if (Array.isArray(d)) {
        return !d.some((item) => list.includes(item));
      }
      return !list.includes(d);
    }, this[_filter3]);
  }
  all(list) {
    return new _Operator((d) => {
      if (Array.isArray(d)) {
        return d.every((item) => list.includes(item));
      }
    }, this[_filter3]);
  }
  size(len) {
    return new _Operator((d) => {
      if (Array.isArray(d)) {
        return d.length === len;
      }
    }, this[_filter3]);
  }
  bitsAllClear(positions) {
    return new _Operator((d) => {
      if (typeof d === "number") {
        let mask = 0;
        positions.forEach((p) => mask |= 1 << p);
        return (d & mask) === 0;
      }
    }, this[_filter3]);
  }
  bitsAnyClear(positions) {
    return new _Operator((d) => {
      if (typeof d === "number") {
        let mask = 0;
        positions.forEach((p) => mask |= 1 << p);
        return (d & mask) < mask;
      }
    }, this[_filter3]);
  }
  bitsAllSet(positions) {
    return new _Operator((d) => {
      if (typeof d === "number") {
        let mask = 0;
        positions.forEach((p) => mask |= 1 << p);
        return (d & mask) === mask;
      }
    }, this[_filter3]);
  }
  bitsAnySet(positions) {
    return new _Operator((d) => {
      if (typeof d === "number") {
        let mask = 0;
        positions.forEach((p) => mask |= 1 << p);
        return (d & mask) > 0;
      }
    }, this[_filter3]);
  }
  elemMatch(conditions) {
    if (conditions instanceof _Operator) {
      conditions = conditions[_filter3];
    }
    const filter = typeof conditions === "function" ? conditions : mergeConditions(conditions);
    return new _Operator((d) => {
      if (Array.isArray(d)) {
        return d.some((item) => filter(item));
      }
    }, this[_filter3]);
  }
  exists(flag) {
    return new _Operator((d, k, o) => k in o == flag, this[_filter3]);
  }
  type(t) {
    return new _Operator((d, k, o) => k in o && getType(d) === t, this[_filter3]);
  }
  not(condition) {
    if (condition instanceof _Operator) {
      condition = condition[_filter3];
    } else if (typeof condition !== "function") {
      condition = (d) => d === condition;
    }
    return new _Operator((d, k, o) => !condition(d, k, o), this[_filter3]);
  }
  and(...conditions) {
    return new _Operator(mergeConditions(conditions, "and"), this[_filter3]);
  }
  or(...conditions) {
    return new _Operator(mergeConditions(conditions, "or"), this[_filter3]);
  }
  nor(...conditions) {
    return new _Operator(mergeConditions(conditions, "nor"), this[_filter3]);
  }
  inc(value) {
    const filter = this[_filter3];
    return new _Operator((d) => {
      if (filter)
        d = filter(d);
      if (typeof d !== "number") {
        throw new Error("Cannot apply $inc to a value of non-numeric type.");
      }
      return d + value;
    });
  }
  mul(value) {
    const filter = this[_filter3];
    return new _Operator((d) => {
      if (filter)
        d = filter(d);
      if (typeof d !== "number") {
        throw new Error("Cannot apply $inc to a value of non-numeric type.");
      }
      return d * value;
    });
  }
  min(value) {
    const filter = this[_filter3];
    return new _Operator((d) => {
      if (filter)
        d = filter(d);
      if (typeof d !== "number") {
        throw new Error("Cannot apply $inc to a value of non-numeric type.");
      }
      return Math.min(d, value);
    });
  }
  max(value) {
    const filter = this[_filter3];
    return new _Operator((d) => {
      if (filter)
        d = filter(d);
      if (typeof d !== "number") {
        throw new Error("Cannot apply $inc to a value of non-numeric type.");
      }
      return Math.max(d, value);
    });
  }
  rename(newKey) {
    return new _Operator((d, k, o) => {
      if (newKey !== k) {
        o[newKey] = o[k];
      }
      return;
    });
  }
  unset() {
    return new _Operator(() => {
      return;
    });
  }
  currentDate() {
    return new _Operator(() => /* @__PURE__ */ new Date());
  }
  regex(value) {
    return new _Operator((d) => {
      const exp = new RegExp(value);
      return d.match(exp) != null;
    });
  }
};

// lib/db.js
var db_default = class extends Operator {
  #root;
  #meta;
  #name;
  #version;
  #tables = {};
  constructor({ root = ".db", meta = ".meta", name = "okeydb", version = 1 } = {}) {
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
    if (this.instance)
      this.instance.close();
  }
  table(name, { indexes } = {}) {
    if (!this.#tables[name])
      this.#tables[name] = new table_default(name, { root: this.#root, meta: this.#meta, database: this, indexes });
    return this.#tables[name];
  }
};

// index.js
var airdb_lite_default = db_default;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OkeyDB
});
