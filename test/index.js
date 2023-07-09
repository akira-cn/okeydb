import AirDB from '../index.js';

// import {sjs, attr} from 'slow-json-stringify';

const db = new AirDB();
const personTable = db.table('bigtable');

console.time('delete0');
const res = await personTable.where().delete();
console.timeEnd('delete0');
console.log(res);

const persons = [];
for(let i = 0; i < 1000000; i++) {
  persons.push({name: `student${i}`, score: 30 + Math.floor(Math.random() * 70)});
}

console.time('save0');
await personTable.save(persons);
console.timeEnd('save0');

console.time('find0');
console.log((await personTable.where().find()).length);
console.timeEnd('find0');

// console.time('save1');
// await personTable.save({name: 'akira', score: 111});
// console.timeEnd('save1');
// console.log((await personTable.where().find()).length);


// const result = await personTable.where({}).sort({score: -1}).projection({_id: 0}).find();
// console.table(result);

// function randomScore() {
//   return Math.floor(100 * Math.random());
// }

// const bigTable = db.table('bigtable');

// const students = [];
// for(let i = 0; i < 20000; i++) {
//   students.push({
//     name: `student${i}`,
//     score: randomScore(),
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     abc: /a/g,
//   });
// }

// RegExp.prototype.toJSON = function() {
//   return {type: 'RegExp', source: this.source, flags: this.flags};
// };

// const stringify = sjs({
//   students: attr('array', sjs({
//     name: attr('string'),
//     score: attr('number'),
//     createdAt: attr('string', (value) => value.toISOString()),
//     updatedAt: attr('string', (value) => value.toISOString()),
//     abc: attr('string'),
//   }))
// });

// console.time('stringify');
// JSON.stringify({students});

// // const r = stringify({students});

// console.timeEnd('stringify');

// // console.log(r);

// // await bigTable.save(students);

// // const res = await bigTable.where().find();
// // console.log(res.length);


// // // await bigTable.where().delete();

// // const result = await bigTable.where({score: db.gt(60)}).find();
// // console.log(result.length);