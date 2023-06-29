import AirDB from '../index.js';

test('base set find delete', async () => {
  const db = new AirDB();
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