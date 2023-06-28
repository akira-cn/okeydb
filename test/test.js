import AirDB from '../index.js';

const db = new AirDB();
const personTable = db.table('person');
// for(let i = 0; i < 10; i++) {
//   await personTable.save({name: `student${i}`, score: 30 + Math.floor(Math.random() * 70)});
// }
// await personTable.where({name: 'akira'}).delete();
const result = await personTable.where({score: db.gt(60)}).sort({score: -1}).projection({_id: 0}).find();
console.table(result);