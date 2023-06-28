import AirDB from '../index.js';

const db = new AirDB();
const personTable = db.table('person');
await personTable.save({name: 'akira', score: 100});
const result = await personTable.where({score: db.gt(60)}).find();
console.log(result);