# scratch-judge
A fast and secured judge engine for scratch projects

## Installation
This requires you to have Git and Node.js installed

To install as a dependency for your own application:
```bash
npm install scratch-judge
```

To setup a development environment to edit yourself:
```bash
git clone https://github.com/donrx/scratch-judge.git
cd scratch-judge
npm install
```

## Usage
```js
import { judge } from 'scratch-judge';
import fs from 'fs';

const program = fs.readFileSync('project.sb3');

const tests = {
  timeout: 5000,
  tests: [
    {
      input:  { list: [1, 2, 3], live: ['hello'] },
      output: { list: ['6'],     live: 'world'   }
    }
  ]
};

const result = await judge(program, tests);
console.log(result.avgScore);   // 0–100
console.log(result.judgement);  // per-test breakdown
```

## API

### `judge(program, json, checker?)`

Runs a Scratch project against a set of test cases and returns a score.

| Parameter | Type | Description |
|-----------|------|-------------|
| `program` | `Buffer` \| `ArrayBuffer` | The `.sb3` project file contents |
| `json` | `object` | Test configuration (see below) |
| `checker` | `function` _(optional)_ | Custom checker function (see below) |

**Returns:** `Promise<{ avgScore: number, judgement: Array }>`

| Field | Type | Description |
|-------|------|-------------|
| `avgScore` | `number` | Average score across all test cases (0–100) |
| `judgement` | `Array<{ score: number, reason: string }>` | Per-test result |

---

### Test configuration (`json`)

```js
{
  timeout: 5000,   // Max ms per test before the VM is killed
  tests: [
    {
      input: {
        list: [],    // Values pre-loaded into the INPUT list variable
        live: []     // Answers fed to ASK/ANSWER prompts in order
      },
      output: {
        list: [],    // Expected OUTPUT list variable contents
        live: ''     // Expected last SAY message
      }
    }
  ]
}
```

The Scratch project must expose two list variables named **`INPUT`** and **`OUTPUT`** on the stage. If neither list is needed for a test case (both inputs and outputs are empty), the test is skipped gracefully.

---

### Custom checker

By default, scratch-judge checks for an exact match on both the `OUTPUT` list and the last `SAY` message. You can override this with your own checker:

```js
const checker = (input, output, expected) => {
  // input    – the test's input object  { list, live }
  // output   – what the program produced { list, live }
  // expected – the expected output       { list, live }

  const correct = output.live === expected.live &&
                  output.list.join() === expected.list.join();

  return {
    score: correct ? 100 : 0,
    reason: correct ? 'Correct answer' : 'Wrong answer'
  };
};

const result = await judge(program, tests, checker);
```

The checker must return an object with:
- `score` — a number between 0 and 100
- `reason` — a human-readable string explaining the result

## Scratch project requirements

| Variable name | Type | Purpose |
|---------------|------|---------|
| `INPUT` | List (stage) | Test input values read by the project |
| `OUTPUT` | List (stage) | Values written by the project as output |

- The project reads live input via **Ask & Answer** blocks. Answers are supplied from `input.live` in order.
- The last value passed to a **Say** block is captured as `output.live`.
- If the project runs longer than `json.timeout` milliseconds, the test is scored 0 with reason `'Out of time'`.

## License
MIT