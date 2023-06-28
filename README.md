WIP

---

Airdb-lite is a local file database that is compatible with the [aircode](https://aircode.io/) API.

```js
import AirDB from 'airdb-lite';

const db = new AirDB();
const personTable = db.table('person');
await personTable.save({name: 'akira', score: 100});
const result = await personTable.where({score: db.gt(60)}).find();
console.log(result);
```