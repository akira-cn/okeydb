import AirDB from '../index.js';

const db = new AirDB();
// const personTable = db.table('person');
// for(let i = 0; i < 10; i++) {
//   await personTable.save({name: `student${i}`, score: 30 + Math.floor(Math.random() * 70)});
// }
// await personTable.where({name: 'akira'}).delete();
// const result = await personTable.where({score: db.gt(60)}).sort({score: -1}).projection({_id: 0}).find();
// console.table(result);

function randomScore() {
  return Math.floor(100 * Math.random());
}

const bigTable = db.table('bigtable');

const students = [];
for(let i = 0; i < 1000; i++) {
  students.push({name: `student${i}`, score: randomScore()});
}

await bigTable.save(students);

const res = await bigTable.where().find();
console.log(res.length);


// await bigTable.where().delete();

const result = await bigTable.where({score: db.gt(60)}).find();
console.log(result.length);