WIP

---

Airdb-lite is a document oriented database based on local file storage and it is compatible with the [aircode API](https://docs.aircode.io/reference/server/database-api).

```js
import AirDB from 'airdb-lite';

const db = new AirDB();
const personTable = db.table('person');
await personTable.save({name: 'akira', score: 100});
const result = await personTable.where({score: db.gt(60)}).find();
console.log(result);
```