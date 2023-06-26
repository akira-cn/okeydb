import Database from "./lib/db.js";

const d = new Database();
const t = d.table('abc');
console.log(t.records);

// const res = await t.save({foo: 'bar3', score: 100});
console.log(t.where({foo: 'bar3', score: d.not(d.lt(90))}).findOne());

// const res = await t.save({foo: 'bar'});
// console.log(res, t.records);
// console.log(t.where({foo: 'bar'}));

