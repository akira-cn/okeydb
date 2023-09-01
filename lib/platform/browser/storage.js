export class Storage {
  #storage;

  constructor(storage) {
    this.#storage = storage;
  }

  transaction(type = 'readonly') {
    const name = this.#storage.tableName;
    return this.#storage.db.transaction([name], type)
      .objectStore(name);
  }

  add(records) {
    const promises = records.map((record) => {
      return new Promise((resolve, reject) => {
        const request = this.transaction('readwrite').add(record);

        request.onsuccess = function () {
          resolve(request.result);
        };
      
        request.onerror = function () {
          reject(new Error('Datebase error.'));
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
      const request = this.transition('readwrite').put(record);

      request.onsuccess = function () {
        resolve(request.result);
      };
    
      request.onerror = function () {
        reject(new Error('Datebase error.'));
      };
    });
  }

  delete(deleteMap) {
    const promises = [];
    for(const id of Object.keys(deleteMap)) {
      promises.push(new Promise((resolve, reject) => {
        const request = this.transaction('readwrite').delete(id);
        request.onsuccess = function () {
          resolve(request.result);
        };
      
        request.onerror = function () {
          reject(new Error('Datebase error.'));
        };
      }));
    }
    return Promise.all(promises);
  }
}