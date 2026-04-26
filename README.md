# scratch-judge

Runs `.sb3` projects against test cases and returns a score.

## Install

```bash
npm install @donrx/scratch-judge
```

## Usage

```js
import { judge } from '@donrx/scratch-judge';
import fs from 'fs';

const program = fs.readFileSync('project.sb3');

const result = await judge(program, {
  timeout: 5000,
  tests: [
    {
      input:  { list: ['1', '2', '3'], live: [] },
      output: { list: ['6'],           live: '' }
    }
  ]
});

console.log(result.avgScore);   // 0–100
console.log(result.judgement);  // per-test breakdown
```

## API

### `judge(program, config, checker?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `program` | `Buffer` | `.sb3` file contents |
| `config.timeout` | `number` | Max ms per test |
| `config.tests` | `array` | Test cases |
| `checker` | `function` _(optional)_ | Custom scoring logic |

**Returns:** `Promise<{ avgScore: number, judgement: { score: number, reason: string }[] }>`

### Custom checker

```js
const checker = (input, output, expected) => ({
  score:  output.live === expected.live ? 100 : 0,
  reason: output.live === expected.live ? 'Correct' : 'Wrong'
});
```

Must return `{ score: 0–100, reason: string }`.

## Scratch requirements

The project must have two stage list variables: **`INPUT`** and **`OUTPUT`**. Live input (Ask & Answer) is fed from `input.live` in order. The last Say message is captured as `output.live`.

## License

MIT