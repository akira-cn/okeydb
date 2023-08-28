import AirDB from '../index.js';

const db = new AirDB();
const personTable = db.table('person');

test('base set find delete', async () => {
  let res = await personTable.save({name: 'akira', score: 100});
  expect(res.name).toBe('akira');
  expect(res.score).toBe(100);

  res = await personTable.where({name: 'foo'}).find();
  expect(Array.isArray(res)).toBeTruthy();
  expect(res.length).toBe(0);

  res = await personTable.where({name: 'akira'}).findOne();
  expect(res.score).toBe(100);

  res = await personTable.delete(res);

  expect(res.deletedCount).toBe(1);
});

// test('create table', async () => {
//   const myTable = db.table('mytable');

//   expect(existsSync(myTable.filepath)).toBeTruthy();
// });

test('filter indexes', async () => {
  // const filterIndexes = personTable.where({_id: 'akira'}).and({_id: 'foo'}).or({_id: '1'}).filterIndexes;
  // console.log(filterIndexes);
});

test('clear table', async () => {

});

test('regexp match', async () => {
  await personTable.save({name: 'akira', score: 100});
  await personTable.save({name: 'aka', score: 90});
  await personTable.save({name: 'bob', score: 80});

  let res = await personTable.where({name: /^a/}).find();
  expect(res.length).toBe(2);

  res = await personTable.where().delete();
});

afterAll(async () => {
  await personTable.where().delete();
});

// test('benchmark', async () => {
//   function randomScore() {
//     return Math.floor(100 * Math.random());
//   }

//   const bigTable = db.table('bigtable');
//   for(let i = 0; i < 100000; i++) {
//     await bigTable.save({name: `student${i}`, score: randomScore()});
//   }

//   await bigTable.where().delete();
// });