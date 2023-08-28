const dbInstances = {};

export async function createTable(table) {
  const dbName = table.database.name;
  if(!dbInstances[dbName]) {
    dbInstances[dbName] = await new Promise((resolve, reject) => {
      const request = window.indexedDB.open(dbName);
      request.onerror = function () {
        reject(new Error('Datebase error.'));
      };
      request.onsuccess = function () {
        resolve(request.result);
      };
    });
  }
  const db = dbInstances[dbName];
  const tableName = table.name;
  if (!db.objectStoreNames.contains(tableName)) {
    db.createObjectStore(tableName, { keyPath: '_id' });
  }
  return new Storage({db, tableName});
}

export async function fileSync() {
  // keep empty
}

export async function flushData() {
  // keep empty
}

export async function getRecords(table, {filter, sorter, skip, limit, indexes} = {}) {
  const db = table._storage.db;


}