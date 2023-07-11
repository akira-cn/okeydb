# AirDB Lite

Airdb-lite is a light-weight document oriented NoSQL database based on local file storage.

**Its api is compatible with the [aircode API](https://docs.aircode.io/reference/server/database-api).**

## Features

- Use JSON file storage, no need to install any database.
- A convenient and easy-to-use chained API that returns Promises.
- Powerful combined conditional queries.

## Usage

- Create tables and insert records.

```js
import AirDB from 'airdb-lite';

const db = new AirDB();
const personTable = db.table('person');
const students = [];

function randomScore(low = 0, high = 100) {
  return low + Math.floor(Math.random() * (high - low + 1));
}

for(let i = 0; i < 1000; i++) {
  const student = {name: `student${i}`, score: randomScore()};
  students.push(student);
}
await personTable.save(students);

// find all students that score >= 60
const result = await personTable.where({score: db.gte(60)}).find();
console.log(result);
```

### Database API

- [Table](https://docs.aircode.io/reference/server/database-api#table)
  - [db.table(tableName)](https://docs.aircode.io/reference/server/database-api#db-table-tablename)
  - [Table.save(record | arrayOfRecords)](https://docs.aircode.io/reference/server/database-api#table-save-record-arrayofrecords)
  - [Table.delete(record | arrayOfRecords)](https://docs.aircode.io/reference/server/database-api#table-delete-record-arrayofrecords)
  - [Table.where([conditions])](https://docs.aircode.io/reference/server/database-api#table-where-conditions)
- [Query Commands](https://docs.aircode.io/reference/server/database-api#query-commands)
  - [Query.find()](https://docs.aircode.io/reference/server/database-api#query-find)
  - [Query.findOne()](https://docs.aircode.io/reference/server/database-api#query-findone)
  - [Query.count()](https://docs.aircode.io/reference/server/database-api#query-count)
  - [Query.save()](https://docs.aircode.io/reference/server/database-api#query-save)
  - [Query.delete()](https://docs.aircode.io/reference/server/database-api#query-delete)
- [Sort and Pagination Chain](https://docs.aircode.io/reference/server/database-api#sort-and-pagination-chain)
  - [Query.sort(conditions)](https://docs.aircode.io/reference/server/database-api#query-sort-conditions)
  - [Query.skip(n)](https://docs.aircode.io/reference/server/database-api#query-skip-n)
  - [Query.limit(n)](https://docs.aircode.io/reference/server/database-api#query-limit-n)
- [Projection Chain](https://docs.aircode.io/reference/server/database-api#projection-chain)
  - [Query.projection(conditions)](https://docs.aircode.io/reference/server/database-api#query-projection-conditions)
- [Update Chain](https://docs.aircode.io/reference/server/database-api#update-chain)
  - [Query.set(conditions)](https://docs.aircode.io/reference/server/database-api#query-set-conditions)
  - [Query.upsert([boolean=true])](https://docs.aircode.io/reference/server/database-api#query-upsert-boolean-true)
  - [Query.setOnInsert(object)](https://docs.aircode.io/reference/server/database-api#query-setoninsert-object)
- [Logical Chain](https://docs.aircode.io/reference/server/database-api#logical-chain)
  - [Query.and(...filters)](https://docs.aircode.io/reference/server/database-api#query-and-filters)
  - [Query.or(...filters)](https://docs.aircode.io/reference/server/database-api#query-or-filters)
  - [Query.nor(...filters)](https://docs.aircode.io/reference/server/database-api#query-nor-filters)
- [Comparison Operators](https://docs.aircode.io/reference/server/database-api#comparison-operators)
  - [db.gt(value)](https://docs.aircode.io/reference/server/database-api#db-gt-value)
  - [db.gte(value)](https://docs.aircode.io/reference/server/database-api#db-gte-value)
  - [db.lt(value)](https://docs.aircode.io/reference/server/database-api#db-lt-value)
  - [db.lte(value)](https://docs.aircode.io/reference/server/database-api#db-lte-value)
  - [db.ne(value)](https://docs.aircode.io/reference/server/database-api#db-ne-value)
  - [db.in(array)](https://docs.aircode.io/reference/server/database-api#db-in-array)
  - [db.nin(array)](https://docs.aircode.io/reference/server/database-api#db-nin-array)
- [Element Operators](https://docs.aircode.io/reference/server/database-api#element-operators)
  - [db.exists(boolean)](https://docs.aircode.io/reference/server/database-api#db-exists-boolean)
  - [db.type(typeString)](https://docs.aircode.io/reference/server/database-api#db-type-typestring)
- [Evaluation Operators](https://docs.aircode.io/reference/server/database-api#evaluation-operators)
  - [db.mod(divisor, remainder)](https://docs.aircode.io/reference/server/database-api#db-mod-divisor-remainder)
- [Array Operators](https://docs.aircode.io/reference/server/database-api#array-operators)
  - [db.all(array)](https://docs.aircode.io/reference/server/database-api#db-all-array)
  - [db.elemMatch(conditions)](https://docs.aircode.io/reference/server/database-api#db-elemmatch-conditions)
  - [db.size(n)](https://docs.aircode.io/reference/server/database-api#db-size-n)
- [Bitwise Operators](https://docs.aircode.io/reference/server/database-api#bitwise-operators)
  - [db.bitsAllClear(positions)](https://docs.aircode.io/reference/server/database-api#db-bitsallclear-positions)
  - [db.bitsAllSet(positions)](https://docs.aircode.io/reference/server/database-api#db-bitsallset-positions)
  - [db.bitsAnyClear(positions)](https://docs.aircode.io/reference/server/database-api#db-bitsanyclear-positions)
  - [db.bitsAnySet(positions)](https://docs.aircode.io/reference/server/database-api#db-bitsanyset-positions)
- ~~Geospatial Objects~~
  - ~~Point~~
  - ~~LineString~~
  - ~~Polygon~~
  - ~~MultiPoint~~
  - ~~MultiLineString~~
  - ~~MultiPolygon~~
  - ~~GeometryCollection~~
- ~~Geospatial Operators~~
  - ~~db.geoIntersects(conditions)~~
  - ~~db.geoWithin(conditions)~~
  - ~~db.near(conditions)~~
  - ~~db.nearSphere(conditions)~~
- [Update Operators](https://docs.aircode.io/reference/server/database-api#update-operators)
  - [db.inc(value)](https://docs.aircode.io/reference/server/database-api#db-inc-value)
  - [db.mul(value)](https://docs.aircode.io/reference/server/database-api#db-mul-value)
  - [db.min(value)](https://docs.aircode.io/reference/server/database-api#db-min-value)
  - [db.max(value)](https://docs.aircode.io/reference/server/database-api#db-max-value)
  - [db.rename(name)](https://docs.aircode.io/reference/server/database-api#db-rename-name)
  - [db.unset()](https://docs.aircode.io/reference/server/database-api#db-unset)
  - [db.currentDate()](https://docs.aircode.io/reference/server/database-api#db-currentdate)
- [Logical Operators](https://docs.aircode.io/reference/server/database-api#logical-operators)
  - [db.and(...filters)](https://docs.aircode.io/reference/server/database-api#db-and-filters)
  - [db.or(...filters)](https://docs.aircode.io/reference/server/database-api#db-or-filters)
  - [db.nor(...filters)](https://docs.aircode.io/reference/server/database-api#db-nor-filters)
  - [db.not(condition)](https://docs.aircode.io/reference/server/database-api#db-not-condition)

## Limits

- **Due to the following reasons, it is NOT recommended for use in a production environment:**
  - This is just a single-instance text database and does not have the ability to scale across multiple servers.
  - Without using schema constraints and indexes(not support yet), the storage performance is limited by the usage of JSON.parse and JSON.stringify. Additionally, the query efficiency is limited by the size of the data.  

If you want to deploy your code to a production environment, you can seamlessly migrate to [AirCode](https://aircode.io/) and use `aircode.db`.


## TODO

- Table-schema (in [dbpath]/table.meta)
  - Specifying field types can be used to serialize records in a fast way rather than use JSON.stringify.
- Indexes (in [dbpath]/table.meta)
  - Create and use indexes to fastify data querys.
- Add unit tests
- Add benchmarks
