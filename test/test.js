const { judge } = require('../src/index.js');
const json = require('./test.json');
const fs = require('fs');
const program = fs.readFileSync('./test/test.sb3');

checker = (input, output, expected) => {
    return { score: 50, reason: 'Partially correct answer'};
}

(async () => {
  const { avgScore, judgement } = await judge(program, json, checker);
  console.log({ avgScore, judgement });
})();