export function* pollItem(array) {
  let current = 0;
  while(true) {
    yield array[current++ % array.length];
  }
}

import AirDB from '../index.js';

const db = new AirDB();
const table = db.table('employees');

afterAll(async () => {
  await db.close();
});

describe('Where Operator', () => {
  beforeAll(async () => {
    await table.where().delete();
    const genTeam = pollItem(['juejin', 'segmentfault', 'aircode']);
    const genPosition = pollItem(['developer', 'designer', 'manager', 'intern']);

    const employees = [];
    for(let i = 0; i < 10; i++) {
      employees.push({
        id: i,
        team: genTeam.next().value, 
        position: genPosition.next().value,
        age: 20 + i * 2,
        avaliablePositions: ['developer', 'designer', 'manager', 'intern'],
      });
    }
    await table.save(employees);
  });

  it('Find many developer', async () => {
    let result = await table.where({position: 'developer'}).find();
    expect(result.length).toBe(3);
    result = await table.where({position: 'manager'}).find();
    expect(result.length).toBe(2);
  });

  it('Where.and', async () => {
    let result = await table.where({position: 'developer'}).and({team: 'segmentfault'}).find();
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(4);
    result = await table.where({position: 'developer'}).and({team: 'segmentfault'}).and({team: 'juejin'}).find();
    expect(result.length).toBe(0);
    result = await table.where({position: 'developer'}).and({team: 'segmentfault'}, {team: 'juejin'}).find();
    expect(result.length).toBe(0);
  });

  it('Where.or', async () => {
    let result = await table.where({position: 'developer'}).or({team: 'segmentfault'}).find();
    expect(result.length).toBe(5);
    expect(result[0].id).toBe(0);
    result = await table.where({position: 'developer'}).or({team: 'segmentfault'}).or({team: 'juejin'}).find();
    expect(result.length).toBe(8);
    result = await table.where({position: 'developer'}).or({team: 'segmentfault'}, {team: 'juejin'}).find();
    expect(result.length).toBe(8);
  });

  it('Where.nor', async () => {
    let result = await table.where({team: 'juejin'}).nor({team: 'segmentfault'}).find();
    expect(result.length).toBe(3);
    expect(result[0].id).toBe(2);
  
    result = await table.where().nor({team: 'juejin'}, {team: 'segmentfault'}).find();
    expect(result.length).toBe(3);
    expect(result[0].id).toBe(2);
  
    // // !(!(team === 'juejin) || (team === 'segmentfault'))
    // // -> !((team !== 'juejin') || team === 'segmentfault')
    result = await table.where().nor({team: 'juejin'}).nor({team: 'segmentfault'}).find();
    expect(result.length).toBe(4);
    expect(result.every(r => r.team === 'juejin')).toBeTruthy();
  });

  it('DB.compare', async () => {
    let result = await table.where({age: db.gt(26)}).find();
    expect(result.length).toBe(6);
    result = await table.where({age: db.gte(26)}).find();
    expect(result.length).toBe(7);
    result = await table.where({age: db.lte(26)}).find();
    expect(result.length).toBe(4);
    result = await table.where({age: db.lt(26)}).find();
    expect(result.length).toBe(3);

    result = await table.where({age: db.greaterThan(26)}).find();
    expect(result.length).toBe(6);
    result = await table.where({age: db.greaterThanOrEqual(26)}).find();
    expect(result.length).toBe(7);
    result = await table.where({age: db.lessThanOrEqual(26)}).find();
    expect(result.length).toBe(4);
    result = await table.where({age: db.lessThan(26)}).find();
    expect(result.length).toBe(3);

    result = await table.where({age: db.gt(26).lt(30)}).find();
    expect(result.length).toBe(1);
    expect(result[0].age).toBe(28);
  });

  it('DB.in and nin', async () => {
    let result = await table.where({team: db.nin(['juejin'])}).find();
    expect(result.length).toBe(6);
    expect(result.every(r => r.team !== 'juejin')).toBeTruthy();

    result = await table.where({team: db.in(['juejin', 'segmentfault'])}).find();
    expect(result.length).toBe(7);
    expect(result.every(r => ['juejin', 'segmentfault'].includes(r.team))).toBeTruthy();
  });

  it('DB.exists', async () => {
    let result = await table.where({team: db.exists(true)}).find();
    expect(result.length).toBe(10);

    result = await table.where({team: db.exists(false)}).find();
    expect(result.length).toBe(0);

    result = await table.where({team: db.not(db.exists(true))}).find();
    expect(result.length).toBe(0);

    await table.save({id: 10, team: 'juejin'});
    result = await table.where({position: db.exists(false)}).find();
    expect(result.length).toBe(1);

    await table.where({id: 10}).delete();
  });

  it('DB.type', async () => {
    let result = await table.where({age: db.type('number')}).find();
    expect(result.length).toBe(10);
    result = await table.where({team: db.type('regexp')}).find();
    expect(result.length).toBe(0);

    await table.save({id: 10, team: 'juejin', extra: /a/});
    result = await table.where({extra: db.type('regexp')}).find();
    expect(result.length).toBe(1);

    await table.where({id: 10}).delete();
  });

  it('DB.mode', async () => {
    let result = await table.where({age: db.mod(5, 1)}).find();
    expect(result.length).toBe(2);
    expect(result[0].age).toBe(26);
    expect(result[1].age).toBe(36);
  });

  it('DB.regex', async () => {
    let result = await table.where({ team: /^(air|seg)/ }).find();
    expect(result.length).toBe(6);
    expect(result.every(r => r.team !== 'juejin')).toBeTruthy();

    result = await table.where({ team: db.regex('^air') }).find();
    expect(result.length).toBe(3);

    result = await table.where({ team: /^AIR/i }).find();
    expect(result.length).toBe(3);
  });

  it('DB.all', async () => {
    let result = await table.where({ avaliablePositions: db.all(['developer', 'designer', 'manager', 'intern']) }).find();
    expect(result.length).toBe(10);
  });

  it('DB.elemMatch', async () => {
    let result = await table.where({ avaliablePositions: db.elemMatch(db.eq('developer')) }).find();
    expect(result.length).toBe(10);
  });

  it('DB.size', async () => {
    let result = await table.where({ avaliablePositions: db.size(4) }).find();
    expect(result.length).toBe(10);
  });

  it('DB.bits operation', async () => {
    await table.save({id: 10, flag: 0b01110});
    let result = await table.where({flag: db.bitsAllSet([1, 2, 3])}).find();
    expect(result.length).toBe(1);
    result = await table.where({flag: db.bitsAnySet([0, 1, 3])}).find();
    expect(result.length).toBe(1);
    await table.where({id: 10}).set({flag: 0b011000}).save();
    result = await table.where({flag: db.bitsAllClear([0, 2])}).find();
    expect(result.length).toBe(1);
    result = await table.where({flag: db.bitsAnyClear([0, 3, 4])}).find();
    expect(result.length).toBe(1);
    result = await table.where({flag: db.bitsAnyClear([3, 4])}).find();
    expect(result.length).toBe(0);
    await table.where({id: 10}).delete();
  });

  it('Nest and or', async () => {    
    let result = await table.where({team: 'juejin'}).and(db.or({position: 'developer'}, {position: 'manager'})).find();
    expect(result.length).toBe(2);
    expect(result.every(r => r.team === 'juejin')).toBeTruthy();
    expect(result.every(r => ['developer', 'manager'].includes(r.position))).toBeTruthy();
    result = await table.where({team: 'aircode'}).and(db.or({position: db.ne('developer')}), {age: db.gt(25)}).find();
    expect(result.length).toBe(1);
    expect(result[0].team).toBe('aircode');
    expect(result[0].age).toBe(30);
    result = await table.where(db.and({team: 'aircode'}, db.or({position: db.ne('developer')}), {age: db.gt(25)})).find();
    expect(result.length).toBe(1);
    expect(result[0].team).toBe('aircode');
    expect(result[0].age).toBe(30);
  });

  it('Nest nor', async () => {
    let result = await table.where(db.nor({team: 'juejin'}, {position: 'developer'})).find();
    expect(result.length).toBe(4);
    expect(result.every(r => r.team !== 'juejin' && r.position !== 'developer')).toBeTruthy();
  });

  it('in operator', async () => {
    const query = table.where({
      team: db.in(['juejin', 'segmentfault'])
    });
    const result = await query.find();
    expect(result.length).toBe(7);
  });

  it('Side effect operator', async () => {
    await table.save({id: 10, score: 100});
    await table.where({id: 10}).set({score: db.inc(10)}).save();
    let result = await table.where({id: 10}).findOne();
    expect(result.score).toBe(110);
    await table.where({id: 10}).set({score: db.mul(2)}).save();
    result = await table.where({id: 10}).findOne();
    expect(result.score).toBe(220);
    await table.where({id: 10}).set({score: db.min(200)}).save();
    result = await table.where({id: 10}).findOne();
    expect(result.score).toBe(200);
    await table.where({id: 10}).set({score: db.max(100)}).save();
    result = await table.where({id: 10}).findOne();
    expect(result.score).toBe(200);
    await table.where({id: 10}).set({score: db.rename('grade')}).save();
    result = await table.where({id: 10}).findOne();
    expect(result.score).toBe(undefined);
    expect(result.grade).toBe(200);
    await table.where({id: 10}).set({grade: db.unset()}).save();
    result = await table.where({id: 10}).findOne();
    expect(result.grade).toBe(undefined);
    await table.where({id: 10}).set({time: db.currentDate()}).save();
    result = await table.where({id: 10}).findOne();
    expect(result.time).toBeInstanceOf(Date);
    await table.where({id: 10}).delete();
  });

  afterAll(async () => {
    await table.where().delete();
  });
});