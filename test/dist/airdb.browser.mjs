var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// lib/platform/browser/storage.js
var Storage;
var init_storage = __esm({
  "lib/platform/browser/storage.js"() {
    Storage = class {
      #storage;
      constructor(storage) {
        this.#storage = storage;
      }
      transaction(type = "readonly") {
        const name = this.#storage.tableName;
        return this.#storage.db.transaction([name], type).objectStore(name);
      }
      add(records) {
        const promises = records.map((record) => {
          return new Promise((resolve, reject) => {
            const request = this.transaction("readwrite").add(record);
            request.onsuccess = function() {
              resolve(request.result);
            };
            request.onerror = function() {
              reject(new Error("Datebase error."));
            };
          });
        });
        return Promise.all(promises);
      }
      getItemIndex(id) {
        return id;
      }
      put(idx, record) {
        return new Promise((resolve, reject) => {
          const request = this.transition("readwrite").put(record);
          request.onsuccess = function() {
            resolve(request.result);
          };
          request.onerror = function() {
            reject(new Error("Datebase error."));
          };
        });
      }
      delete(deleteMap) {
        const promises = [];
        for (const id of Object.keys(deleteMap)) {
          promises.push(new Promise((resolve, reject) => {
            const request = this.transition("readwrite").delete(id);
            request.onsuccess = function() {
              resolve(request.result);
            };
            request.onerror = function() {
              reject(new Error("Datebase error."));
            };
          }));
        }
        return Promise.all(promises);
      }
    };
  }
});

// lib/platform/browser/index.js
var browser_exports = {};
__export(browser_exports, {
  createTable: () => createTable,
  fileSync: () => fileSync,
  flushData: () => flushData,
  getRecords: () => getRecords
});
function upgradeDB(metaDB) {
  return new Promise((resolve, reject) => {
    const transaction = metaDB.transaction(["version"], "readwrite");
    const objectStore = transaction.objectStore("version");
    const request = objectStore.get(1);
    request.onerror = function() {
      reject(new Error(request));
    };
    request.onsuccess = function() {
      const req = objectStore.put({ id: 1, version: request.result.version + 1 });
      req.onerror = function() {
        reject(new Error(req));
      };
      req.onsuccess = function() {
        resolve(request.result.version + 1);
      };
    };
  });
}
async function createTable(table) {
  const dbName = table.database.name;
  const meta = `${dbName}.__meta__`;
  const tableName = table.name;
  if (!dbInstances[tableName]) {
    const metaDB = await new Promise((resolve, reject) => {
      const request = window.indexedDB.open(meta);
      request.onerror = function() {
        reject(new Error(request));
      };
      request.onsuccess = function() {
        const db2 = request.result;
        resolve(db2);
      };
      request.onupgradeneeded = function() {
        const db2 = request.result;
        db2.createObjectStore("version", { keyPath: "id" });
        db2.createObjectStore("tables", { keyPath: "name" });
      };
    });
    if (!version)
      version = await new Promise((resolve, reject) => {
        const transaction = metaDB.transaction(["version"], "readwrite");
        const objectStore = transaction.objectStore("version");
        const request = objectStore.get(1);
        request.onerror = function() {
          reject(new Error(request));
        };
        request.onsuccess = function() {
          if (!request.result) {
            const req = objectStore.add({ id: 1, version: 0 });
            req.onerror = function() {
              reject(new Error(req));
            };
            req.onsuccess = function() {
              resolve(0);
            };
          } else {
            resolve(request.result.version);
          }
        };
      });
    const tableData = await new Promise((resolve, reject) => {
      const transaction = metaDB.transaction(["tables"], "readwrite");
      const objectStore = transaction.objectStore("tables");
      const request = objectStore.get(tableName);
      request.onerror = function() {
        reject(new Error(request));
      };
      request.onsuccess = function() {
        resolve(request.result);
      };
    });
    if (!tableData) {
      await new Promise((resolve, reject) => {
        const transaction = metaDB.transaction(["tables"], "readwrite");
        const objectStore = transaction.objectStore("tables");
        const request = objectStore.add({ name: tableName, indexes: table.indexes });
        request.onerror = function() {
          reject(new Error(request));
        };
        request.onsuccess = function() {
          resolve(request.result);
        };
      });
      version = await upgradeDB(metaDB);
    } else {
      const needsUpdate = await new Promise((resolve, reject) => {
        const transaction = metaDB.transaction(["tables"], "readwrite");
        const objectStore = transaction.objectStore("tables");
        const request = objectStore.get(tableName);
        request.onerror = function() {
          reject(new Error(request));
        };
        request.onsuccess = function() {
          if (JSON.stringify(request.result.indexes) === JSON.stringify(table.indexes)) {
            resolve(false);
          } else {
            const req = objectStore.put({ name: tableName, indexes: table.indexes });
            req.onerror = function() {
              reject(new Error(req));
            };
            req.onsuccess = function() {
              resolve(true);
            };
          }
        };
      });
      if (needsUpdate) {
        version = await upgradeDB(metaDB);
      }
    }
    dbInstances[tableName] = await new Promise((resolve, reject) => {
      const request = window.indexedDB.open(dbName, version);
      request.onerror = function() {
        reject(new Error(request));
      };
      request.onsuccess = function() {
        resolve(request.result);
      };
      request.onupgradeneeded = function() {
        const db2 = request.result;
        const upgradeTransaction = request.transaction;
        let objectStore;
        if (!db2.objectStoreNames.contains(tableName)) {
          objectStore = db2.createObjectStore(tableName, { keyPath: "_id" });
        } else {
          objectStore = upgradeTransaction.objectStore(tableName);
        }
        const indexes = table.indexes;
        const len = objectStore.indexNames.length;
        for (let i = len - 1; i >= 0; i--) {
          objectStore.deleteIndex(objectStore.indexNames[i]);
        }
        for (const [k, v] of Object.entries(indexes)) {
          if (k !== "_id") {
            if (!objectStore.indexNames.contains(k)) {
              objectStore.createIndex(k, k, { unique: v });
            }
          }
        }
      };
    });
  }
  const db = dbInstances[tableName];
  return new Storage({ db, tableName });
}
async function fileSync() {
}
async function flushData() {
}
async function getRecords(table, { filter, sorter, skip, limit, filterIndexes, rawSorter } = {}) {
  const objectStore = table._storage.transaction();
  const notIndexFilter = table[_notIndexFilter2];
  if (filterIndexes) {
    const records = [];
    const indexes = Object.keys(filterIndexes);
    let singleIndex = false;
    for (let i = 0; i < indexes.length; i++) {
      const indexName = indexes[i];
      const isUnique = table.indexes[indexName];
      const indexValues = [...filterIndexes[indexName]];
      const ret2 = await Promise.all(indexValues.map(async (value) => {
        if (indexName === "_id") {
          return new Promise((resolve, reject) => {
            const request = objectStore.get(value);
            request.onerror = function() {
              reject(new Error(request));
            };
            request.onsuccess = function() {
              resolve(request.result);
            };
          });
        } else if (isUnique && value && typeof value !== "function" && typeof value[_filter2] !== "function" && !(value instanceof RegExp)) {
          return new Promise((resolve, reject) => {
            const request = objectStore.index(indexName).get(value);
            request.onerror = function() {
              reject(new Error(request));
            };
            request.onsuccess = function() {
              resolve(request.result);
            };
          });
        } else if (value && typeof value !== "function" && typeof value[_filter2] !== "function" && !(value instanceof RegExp)) {
          return new Promise((resolve, reject) => {
            const request = objectStore.index(indexName).openCursor(IDBKeyRange.only(value));
            const records2 = [];
            request.onerror = function() {
              reject(new Error(request));
            };
            request.onsuccess = function() {
              const cursor = request.result;
              if (cursor) {
                records2.push(cursor.value);
                cursor.continue();
              } else {
                resolve(records2);
              }
            };
          });
        } else {
          const type = value._type;
          let range = null;
          if (type === "gt") {
            range = IDBKeyRange.lowerBound(value._value, true);
          } else if (type === "gte") {
            range = IDBKeyRange.lowerBound(value._value);
          } else if (type === "lt") {
            range = IDBKeyRange.upperBound(value._value, true);
          } else if (type === "lte") {
            range = IDBKeyRange.upperBound(value._value);
          } else if (type === "gtlt") {
            range = IDBKeyRange.bound(...value._value, true, true);
          } else if (type === "gtlte") {
            range = IDBKeyRange.bound(...value._value, true, false);
          } else if (type === "gtelt") {
            range = IDBKeyRange.bound(...value._value, false, true);
          } else if (type === "gtelte") {
            range = IDBKeyRange.bound(...value._value, false, false);
          }
          let direction = "next";
          if (rawSorter) {
            const order = rawSorter[indexName];
            if (order === -1 || order === "desc")
              direction = "prev";
            if (indexes.length === 1 && indexValues.length === 1) {
              singleIndex = true;
              const keys = Object.keys(rawSorter);
              if (keys.length === 1 && keys[0] === indexName) {
                sorter = null;
              }
            }
          }
          return new Promise((resolve, reject) => {
            const request = objectStore.index(indexName).openCursor(range, direction);
            const records2 = [];
            request.onerror = function() {
              reject(new Error(request));
            };
            request.onsuccess = function() {
              const cursor = request.result;
              if (cursor) {
                if (singleIndex && !notIndexFilter && !sorter) {
                  if (skip > 0) {
                    cursor.advance(skip);
                    skip = 0;
                  } else {
                    records2.push(cursor.value);
                    if (records2.length === limit) {
                      resolve(records2);
                    } else {
                      cursor.continue();
                    }
                  }
                } else {
                  if (filter(cursor.value)) {
                    records2.push(cursor.value);
                  }
                  if (singleIndex && !sorter && records2.length === skip + limit) {
                    resolve(records2);
                  } else {
                    cursor.continue();
                  }
                }
              } else {
                resolve(records2);
              }
            };
          });
        }
      }));
      records.push(...ret2.flat());
    }
    if (singleIndex) {
      if (sorter)
        records.sort(sorter);
      return records.slice(skip, skip + limit);
    }
    const ret = [];
    const ids = /* @__PURE__ */ new Set();
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (!record || ids.has(record._id) || !filter(record))
        continue;
      ids.add(record._id);
      ret.push(record);
      if (!sorter && (skip > 0 || Number.isFinite(limit)) && ret.length >= skip + limit) {
        return ret.slice(skip, skip + limit);
      }
    }
    if (sorter)
      ret.sort(sorter);
    if (skip > 0 || Number.isFinite(limit)) {
      return ret.slice(skip, skip + limit);
    }
    return ret;
  } else {
    if (rawSorter) {
      const keys = Object.keys(rawSorter);
      if (keys.length === 1) {
        const key = keys[0];
        const order = rawSorter[key];
        if (table.indexes[key] != null) {
          let direction = "next";
          if (order === -1 || order === "desc")
            direction = "prev";
          const records2 = await new Promise((resolve, reject) => {
            const request = objectStore.index(key).openCursor(null, direction);
            const records3 = [];
            request.onerror = function() {
              reject(new Error(request));
            };
            request.onsuccess = function() {
              const cursor = request.result;
              if (cursor) {
                if (!notIndexFilter) {
                  if (skip > 0) {
                    cursor.advance(skip);
                    skip = 0;
                  } else {
                    records3.push(cursor.value);
                    if (records3.length === limit) {
                      resolve(records3);
                    } else {
                      cursor.continue();
                    }
                  }
                } else {
                  if (filter(cursor.value)) {
                    records3.push(cursor.value);
                  }
                  if (records3.length === skip + limit) {
                    resolve(records3);
                  } else {
                    cursor.continue();
                  }
                }
              } else {
                resolve(records3);
              }
            };
          });
          return records2.slice(skip, skip + limit);
        }
      }
    }
    const records = await new Promise((resolve, reject) => {
      const request = objectStore.index("createdAt").getAll();
      request.onerror = function() {
        reject(new Error(request));
      };
      request.onsuccess = function() {
        resolve(request.result);
      };
    });
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
}
var dbInstances, _filter2, _notIndexFilter2, version;
var init_browser = __esm({
  "lib/platform/browser/index.js"() {
    init_storage();
    dbInstances = {};
    _filter2 = Symbol.for("airdb-filter");
    _notIndexFilter2 = Symbol.for("not-index-filter");
    version = 0;
  }
});

// lib/utils.js
function parseCondition(condition = {}) {
  if (typeof condition === "function")
    return condition;
  const filters = [];
  for (const [k, v] of Object.entries(condition)) {
    if (typeof v === "function") {
      filters.push((d) => v(d[k], k, d));
    } else if (v && typeof v[Symbol.for("airdb-filter")] === "function") {
      const f = v[Symbol.for("airdb-filter")];
      filters.push((d) => f(d[k], k, d));
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
var _filter = Symbol.for("airdb-filter");
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
  #insertFields = null;
  #setOnInsertFields = null;
  #upsert = false;
  #filterIndexes = {};
  constructor(condition, table) {
    this.#filter = mergeConditions([condition]);
    this.#table = table;
    this.#insertFields = { ...condition };
    this.#filterIndexes = updateFilterIndex(this, [condition], {}, "and");
  }
  and(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions);
    this.#filter = (record) => left(record) && right(record);
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
    this.#filter = (record) => left(record) || right(record);
    this.#insertFields = {};
    if (this.#filterIndexes)
      this.#filterIndexes = updateFilterIndex(this, conditions, this.#filterIndexes, "or");
    return this;
  }
  nor(...conditions) {
    const left = this.#filter;
    const right = mergeConditions(conditions, "nor");
    this.#filter = (record) => !(left(record) || right(record));
    this.#insertFields = {};
    this.#filterIndexes = null;
    this.table[_notIndexFilter] = true;
    return this;
  }
  async find() {
    let filtedRecords = await this.#table.getRecords({
      filter: this.#filter,
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
    const records = await this.#table.getRecords({
      filter: this.#filter,
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
        for (const [k, v] of Object.entries(records)) {
          if (typeof v === "function" || v && typeof v[_filter] === "function")
            delete records[k];
        }
        if (this.#updateFields) {
          const updateFields = this.#updateFields;
          for (let [k, v] of Object.entries(updateFields)) {
            if (v && v[_filter] === "function") {
              v = v[_filter];
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
            if (v && v[_filter] === "function") {
              v = v[_filter];
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
  get filterIndexes() {
    const filterIndexes = this.#filterIndexes || {};
    if (Object.keys(filterIndexes).length)
      return filterIndexes;
    return null;
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

// lib/table.js
var Table = await (async () => {
  let platform;
  if (true) {
    platform = await Promise.resolve().then(() => (init_browser(), browser_exports));
  } else {
    platform = await null;
  }
  const { fileSync: fileSync2, getRecords: getRecords2, flushData: flushData2, createTable: createTable2 } = platform;
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
      this.#ready = createTable2(this, root, meta).then((res) => {
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
      return getRecords2(this, { filter, sorter, skip, limit, filterIndexes, rawSorter });
    }
    async save(records = [], countResult = false) {
      await this.#ready;
      const originalRecords = records;
      if (!Array.isArray(records)) {
        records = [records];
      }
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
      await fileSync2(this);
      if (countResult)
        return { modifiedCount, upsertedCount };
      return originalRecords;
    }
    async delete(records = []) {
      await this.#ready;
      if (!Array.isArray(records))
        records = [records];
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
      await fileSync2(this);
      return { deletedCount };
    }
    where(condition = {}) {
      const query = new query_default(condition, this);
      return query;
    }
  };
})();
var table_default = Table;

// lib/operator.js
var _filter3 = Symbol.for("airdb-filter");
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
        const mask = 0;
        positions.forEach((p) => mask | 1 << p);
        return d & mask === 0;
      }
    }, this[_filter3]);
  }
  bitsAnyClear(positions) {
    return new _Operator((d) => {
      if (typeof d === "number") {
        const mask = 0;
        positions.forEach((p) => mask | 1 << p);
        return d & mask < mask;
      }
    }, this[_filter3]);
  }
  bitsAllSet(positions) {
    return new _Operator((d) => {
      if (typeof d === "number") {
        const mask = 0;
        positions.forEach((p) => mask | 1 << p);
        return d & mask === mask;
      }
    }, this[_filter3]);
  }
  bitsAnySet(positions) {
    return new _Operator((d) => {
      if (typeof d === "number") {
        const mask = 0;
        positions.forEach((p) => mask | 1 << p);
        return d & mask > 0;
      }
    }, this[_filter3]);
  }
  elemMatch(conditions) {
    const filter = conditions instanceof _Operator || typeof conditions === "function" ? conditions : mergeConditions(conditions);
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
    return new _Operator((d) => !condition(d), this[_filter3]);
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
};

// lib/db.js
var db_default = class extends Operator {
  #root;
  #meta;
  #name;
  #version;
  #tables = {};
  constructor({ root = ".db", meta = ".meta", name = "airdb", version: version2 = 1 } = {}) {
    super();
    this.#root = root;
    this.#meta = meta;
    this.#name = name;
    this.#version = version2;
  }
  get name() {
    return this.#name;
  }
  get version() {
    return this.#version;
  }
  table(name, { indexes } = {}) {
    if (!this.#tables[name])
      this.#tables[name] = new table_default(name, { root: this.#root, meta: this.#meta, database: this, indexes });
    return this.#tables[name];
  }
};

// index.js
var airdb_lite_default = db_default;
export {
  db_default as AirDB,
  airdb_lite_default as default
};
