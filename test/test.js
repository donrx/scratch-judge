import { judge } from '../src/index.js';
import json from './test.json' with { type: 'json' };
import { readFileSync } from 'fs';

const program = readFileSync('./test/test.sb3');

const checker = (input, output, expected) => {
  return { score: 50, reason: 'Partially correct answer' };
};

const { avgScore, judgement } = await judge(program, json, checker);
console.log({ avgScore, judgement });