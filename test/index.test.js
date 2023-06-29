import {existsSync, readFileSync} from 'node:fs';
import AirDB from '../index.js';

const db = new AirDB();

test('base set find delete', async () => {
  const personTable = db.table('person');
  let res = await personTable.save({name: 'akira', score: 100});
  expect(Array.isArray(res)).toBeTruthy();
  expect(res.length).toBe(1);
  expect(res[0].name).toBe('akira');
  expect(res[0].score).toBe(100);

  res = await personTable.where({name: 'foo'}).find();
  expect(Array.isArray(res)).toBeTruthy();
  expect(res.length).toBe(0);

  res = await personTable.where({name: 'akira'}).findOne();
  expect(res.score).toBe(100);

  res = await personTable.delete(res);

  expect(res.deletedCount).toBe(1);
});

test('create table', async () => {
  const myTable = db.table('mytable');

  expect(existsSync(myTable.filepath)).toBeTruthy();
});

test('clear table', async () => {

});

test('regexp match', async () => {
  const personTable = db.table('person');
  await personTable.save({name: 'akira', score: 100});
  await personTable.save({name: 'aka', score: 90});
  await personTable.save({name: 'bob', score: 80});

  let res = await personTable.where({name: /^a/}).find();
  expect(res.length).toBe(2);

  await personTable.where().delete();
});