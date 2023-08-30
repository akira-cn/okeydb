import { Storage } from './storage.js';

const dbInstances = {};

function upgradeDB(metaDB) {
  return new Promise((resolve, reject) => {
    const transaction = metaDB.transaction(['version'], 'readwrite');
    const objectStore = transaction.objectStore('version');
    const request = objectStore.get(1);
    request.onerror = function() {
      reject(new Error(request));
    };
    request.onsuccess = function() {
      const req = objectStore.put({id: 1, version: request.result.version + 1});
      req.onerror = function() {
        reject(new Error(req));
      };
      req.onsuccess = function() {
        resolve(request.result.version + 1);
      };
    };
  });
}

let version = 0;
export async function createTable(table) {
  const dbName = table.database.name;
  const meta = `${dbName}.__meta__`;
  const tableName = table.name;

  if(!dbInstances[tableName]) {
    const metaDB = await new Promise((resolve, reject) => {
      const request = window.indexedDB.open(meta);
      request.onerror = function() {
        reject(new Error(request));
      };
      request.onsuccess = function() {
        const db = request.result;
        resolve(db);
      };
      request.onupgradeneeded = function() {
        const db = request.result;
        db.createObjectStore('version', {keyPath: 'id'});
        db.createObjectStore('tables', { keyPath: 'name' });
      };
    });

    if(!version) 
      version = await new Promise((resolve, reject) => {
        const transaction = metaDB.transaction(['version'], 'readwrite');
        const objectStore = transaction.objectStore('version');
        const request = objectStore.get(1);
        request.onerror = function() {
          reject(new Error(request));
        };
        request.onsuccess = function() {
          if(!request.result) {
            const req = objectStore.add({id: 1, version: 0});
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
      const transaction = metaDB.transaction(['tables'], 'readwrite');
      const objectStore = transaction.objectStore('tables');
      const request = objectStore.get(tableName);
      request.onerror = function() {
        reject(new Error(request));
      };
      request.onsuccess = function() {
        resolve(request.result);
      };
    });

    if(!tableData) {
      await new Promise((resolve, reject) => {
        const transaction = metaDB.transaction(['tables'], 'readwrite');
        const objectStore = transaction.objectStore('tables');
        const request = objectStore.add({name: tableName, indexes: table.indexes});
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
        const transaction = metaDB.transaction(['tables'], 'readwrite');
        const objectStore = transaction.objectStore('tables');
        const request = objectStore.get(tableName);
        request.onerror = function() {
          reject(new Error(request));
        };
        request.onsuccess = function() {
          if(JSON.stringify(request.result.indexes) === JSON.stringify(table.indexes)) {
            resolve(false);
          } else {
            const req = objectStore.put({name: tableName, indexes: table.indexes});
            req.onerror = function() {
              reject(new Error(req));
            };
            req.onsuccess = function() {
              resolve(true);
            };
          }
        };
      });
      if(needsUpdate) {
        version = await upgradeDB(metaDB);
      }
    }

    dbInstances[tableName] = await new Promise((resolve, reject) => {
      // console.log(dbName, version, tableName);
      const request = window.indexedDB.open(dbName, version);
      request.onerror = function () {
        reject(new Error(request));
      };
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onupgradeneeded = function() {
        const db = request.result;
        const upgradeTransaction = request.transaction;
        let objectStore;
        if (!db.objectStoreNames.contains(tableName)) {
          objectStore = db.createObjectStore(tableName, { keyPath: '_id' });
        } else {
          objectStore = upgradeTransaction.objectStore(tableName);
        }
        const indexes = table.indexes;
        const len = objectStore.indexNames.length;
        for(let i = len - 1; i >= 0; i--) {
          objectStore.deleteIndex(objectStore.indexNames[i]);
        }
        for(const [k, v] of Object.entries(indexes)) {
          if(k !== '_id') {
            if (!objectStore.indexNames.contains(k)) {
              objectStore.createIndex(k, k, { unique: v });
            }
          }
        }
      };
    });
  }
  const db = dbInstances[tableName];
  return new Storage({db, tableName});
}

export async function fileSync() {
  // keep empty
}

export async function flushData() {
  // keep empty
}

export async function getRecords(table, {filter, sorter, skip, limit, filterIndexes} = {}) {
  const records = [];
  const objectStore = table._storage.transaction();
  // console.log(filterIndexes);
  if(filterIndexes) {
    const indexes = Object.keys(filterIndexes);
    // console.log(indexes, filterIndexes);
    for(let i = 0; i < indexes.length; i++) {
      const indexName = indexes[i];
      const isUnique = table.indexes[indexName];
      const indexValues = [...filterIndexes[indexName]];
      // console.log(indexName, isUnique, indexValues);
      const ret = await Promise.all(indexValues.map(async (value) => {
        if(indexName === '_id') {
          return new Promise((resolve, reject) => {
            const request = objectStore.get(value);
            request.onerror = function() {
              reject(new Error(request));
            };
            request.onsuccess = function() {
              resolve(request.result);
            };
          });
        } else if(isUnique && value && !value[Symbol.for('index-range')]) {
          return new Promise((resolve, reject) => {
            const request = objectStore.index(indexName).get(value);
            request.onerror = function() {
              reject(new Error(request));
            };
            request.onsuccess = function() {
              resolve(request.result);
            };
          });
        } else if(value && !value[Symbol.for('index-range')]) {
          return new Promise((resolve, reject) => {
            const request = objectStore.index(indexName).openCursor();
            const records = [];
            request.onerror = function() {
              reject(new Error(request));
            };
            request.onsuccess = function() {
              const cursor = request.result;
              if(cursor) {
                records.push(cursor.value);
                cursor.continue();
              } else {
                resolve(records);
              }
            };
          });
        } else {
          const type = value[Symbol.for('index-range')];
          let range = null;
          if(type === 'gt') {
            range = IDBKeyRange.lowerBound(value.value, true);
          } else if(type === 'gte') {
            range = IDBKeyRange.lowerBound(value.value);
          } else if(type === 'lt') {
            range = IDBKeyRange.upperBound(value.value, true);
          } else if(type === 'lte') {
            range = IDBKeyRange.upperBound(value.value);
          }
          return new Promise((resolve, reject) => {
            const request = objectStore.index(indexName).openCursor(range);
            const records = [];
            request.onerror = function() {
              reject(new Error(request));
            };
            request.onsuccess = function() {
              const cursor = request.result;
              if(cursor) {
                records.push(cursor.value);
                cursor.continue();
              } else {
                resolve(records);
              }
            };
          });
        }
      }));
      records.push(...ret.flat());
    }
    // console.log(records);
    const ret = []; // filter duplication
    const ids = new Set();
    for(let i = 0; i < records.length; i++) {
      const record = records[i];
      if(!record || ids.has(record._id)) continue;
      ids.add(record._id);
      ret.push(record);
    }
    return ret;
  } else {
    return new Promise((resolve, reject) => {
      const request =  objectStore.getAll();
      request.onerror = function() {
        reject(new Error(request));
      };
      request.onsuccess = function() {
        resolve(request.result);
      };
    });
  }
}