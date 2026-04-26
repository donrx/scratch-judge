const { expect, describe } = require('@jest/globals');
const { judge } = require('../src/index.js');
const fs = require('fs');
const path = require('path');
module.exports = { judge }

const fixture = (filename) =>
  path.join(__dirname, 'fixtures', filename);

const loadProgram = (filename) => fs.readFileSync(fixture(filename));
const loadJson = (filename) => JSON.parse(fs.readFileSync(fixture(filename), 'utf8'));

describe('fast', () => {
  it('returns score 100 when output matches expected, returns score 0 when output does not', async () => {
      const program = loadProgram('hello_world.sb3');
      const json = loadJson('hello_world.json');

      const result = await judge(program, json);

      expect(result.avgScore).toBe(50);
      expect(result.judgement[0]).toEqual({ score: 100, reason: 'Correct answer'});
      expect(result.judgement[1]).toEqual({ score: 0, reason: 'Wrong answer'});
  });
})