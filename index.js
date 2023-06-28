import Database from "./lib/db.js";

const d = new Database();
const t = d.table('abc');
console.log(await t.getRecords());

// const res = await t.save({foo: 'bar2', score: 100, y : new Date(), z: [1, 2, 3], x: null, w: /a/g});
const rec = await t.where({foo: 'bar2'}).sort({score: -1, createdAt: 1}).projection({score:1, y:1}).findOne();
console.log(rec);

const res = await t.where({foo: 'bar333'}).upsert(true).set({score: v => v+1}).setOnInsert({score: 333}).save();
console.log(res);

// const res = await t.save({foo: 'bar'});
// console.log(res, t.records);
// console.log(t.where({foo: 'bar'}));

