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

describe('judge', () => {
  describe('scoring', () => {
    it('returns score 100 when output matches expected, returns score 0 when output does not', async () => {
      const program = loadProgram('hello_world.sb3');
      const json = loadJson('hello_world.json');

      const result = await judge(program, json);

      expect(result.avgScore).toBe(50);
      expect(result.judgement[0]).toEqual({ score: 100, reason: 'Correct answer'});
      expect(result.judgement[1]).toEqual({ score: 0, reason: 'Wrong answer'});
    });
    it('returns score 100 when output matches input', async () => {
      const program = loadProgram('repeat.sb3');
      const json = loadJson('repeat.json');

      const result = await judge(program, json);

      expect(result.avgScore).toBe(100);
      expect(result.judgement[0]).toEqual({ score: 100, reason: 'Correct answer' });
      expect(result.judgement[1]).toEqual({ score: 100, reason: 'Correct answer' });
    })
    it('returns score 0 when of out time', async () => {
      const program = loadProgram('forever.sb3');
      const json = loadJson('forever.json');

      const result = await judge(program, json);

      expect(result.avgScore).toBe(0);
      expect(result.judgement[0]).toEqual({ score: 0, reason: 'Out of time'});
    });
    it('returns score = answer with custom checker', async () => {
      const program = loadProgram('score.sb3');
      const json = loadJson('score.json');

      const checker = (input, output, expected) => {
        return { score: input.live[0], reason: 'Score'};
      };

      const result = await judge(program, json, checker);

      let avgScore = 0;
      let i = 0;
      for(const test of json.tests){
        avgScore += test.input.live[0];
        i++;
      }
      avgScore /= i;

      expect(result.avgScore).toBe(avgScore);

      i = 0;
      for(const test of json.tests){
        expect(result.judgement[i]).toEqual({ score: test.input.live[0], reason: 'Score'});
        i++;
      }
    });
  });
  describe('error handling', () => {
    it('returns score 0 when input/output not exist when the checker expected it', async () => {
      const program = loadProgram('no_io.sb3');
      const json = loadJson('no_io.json');

      const result = await judge(program, json);

      expect(result.avgScore).toBe(100 / 3);
      expect(result.judgement[0]).toEqual({score: 0, reason: 'Invalid format'});
      expect(result.judgement[1]).toEqual({score: 0, reason: 'Invalid format'});
      expect(result.judgement[2]).toEqual({score: 100, reason: 'Correct answer'});
    })
  })
});