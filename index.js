import Table from "./lib/table.js";

const t = new Table('abc');
console.log(t.records);

const res = await t.save({foo: 'bar2'});
console.log(t.where({foo: 'bar2'}).findOne());

// const res = await t.save({foo: 'bar'});
// console.log(res, t.records);
// console.log(t.where({foo: 'bar'}));

