import { Storage } from './storage.js';

const dbInstances = {};

export async function createTable(table) {
  const dbName = table.database.name;
  const version = table.database.version;
  const tableName = table.name;

  if(!dbInstances[dbName]) {
    dbInstances[dbName] = await new Promise((resolve, reject) => {
      const request = window.indexedDB.open(dbName, version);
      request.onerror = function () {
        reject(new Error(request));
      };
      request.onsuccess = function () {
        const db = request.result;
        if (db.objectStoreNames.contains(tableName)) {
          resolve(db);
        }
      };
      request.onupgradeneeded = function() {
        const db = request.result;
        const objectStore = db.createObjectStore(tableName, { keyPath: '_id' });
        const indexes = table.indexes;
        for(const [k, v] of Object.entries(indexes)) {
          if(k !== '_id') {
            objectStore.createIndex(k, k, { unique: v });
          }
        }
        resolve(db);
      };
    });
  }
  const db = dbInstances[dbName];

  return new Storage({db, tableName});
}

export async function fileSync() {
  // keep empty
}

export async function flushData() {
  // keep empty
}

export async function getRecords(table, {filter, sorter, skip, limit, indexes} = {}) {
  const objectStore = table._storage.transaction();
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