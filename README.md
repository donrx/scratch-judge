# scratch-judge

A fast and secure judge engine for Scratch projects. Runs `.sb3` programs inside an isolated Docker container with no network access, capped memory, and a configurable timeout.

## Requirements

- [Node.js](https://nodejs.org/) ≥ 16
- [Docker](https://www.docker.com/) (required for sandboxed execution)

## Installation

Install as a dependency:

```bash
npm install @donrx/scratch-judge
```

Clone for development:

```bash
git clone https://github.com/donrx/scratch-judge.git
cd scratch-judge
npm install
```

## Docker setup

Before calling `judge()`, build the runner image once:

```bash
docker build -t scratch-judge-runner .
```

The image is a slim Node 20 container that executes the Scratch VM in a read-only, network-isolated environment.

## Usage

```js
import { judge } from '@donrx/scratch-judge';
import fs from 'fs';

const program = fs.readFileSync('project.sb3');

const tests = {
  timeout: 5000,
  tests: [
    {
      input:  { list: ['1', '2', '3'], live: ['hello'] },
      output: { list: ['6'],           live: 'world'   }
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
| `json` | `JudgeConfig` | Test configuration (see below) |
| `checker` | `Checker` _(optional)_ | Custom checker function (see below) |

**Returns:** `Promise<JudgeResult>`

| Field | Type | Description |
|-------|------|-------------|
| `avgScore` | `number` | Average score across all test cases (0–100) |
| `judgement` | `Array<{ score: number, reason: string }>` | Per-test result |

---

### Test configuration (`JudgeConfig`)

```js
{
  timeout: 5000,   // Max ms per test before the VM is killed
  tests: [
    {
      input: {
        list: [],    // string[] — values pre-loaded into the INPUT list variable
        live: []     // string[] — answers fed to Ask/Answer prompts, in order
      },
      output: {
        list: [],    // string[] — expected OUTPUT list variable contents
        live: ''     // string  — expected last Say message
      }
    }
  ]
}
```

The Scratch project must expose two stage list variables named **`INPUT`** and **`OUTPUT`**. If a test case uses neither (both input and expected output are empty lists with no live I/O), the test is skipped gracefully.

---

### Custom checker

By default, scratch-judge requires an exact match on both the `OUTPUT` list and the last `Say` message. You can supply your own scoring logic:

```js
const checker = (input, output, expected) => {
  // input    – the test's input object  { list: string[], live: string[] }
  // output   – what the program produced { list: string[], live: string }
  // expected – the expected output        { list: string[], live: string }

  const correct =
    output.live === expected.live &&
    output.list.join() === expected.list.join();

  return {
    score:  correct ? 100 : 0,
    reason: correct ? 'Correct answer' : 'Wrong answer'
  };
};

const result = await judge(program, tests, checker);
```

The checker must return `{ score: number, reason: string }` where `score` is 0–100.

---

## Scratch project requirements

| Variable name | Type | Purpose |
|---------------|------|---------|
| `INPUT` | List (stage) | Test input values read by the project |
| `OUTPUT` | List (stage) | Values written by the project as output |

- The project reads live input via **Ask & Answer** blocks. Answers are supplied from `input.live` in order.
- The last value passed to a **Say** block is captured as `output.live`.
- If the project runs longer than `json.timeout` milliseconds, the test is scored 0 with reason `'Out of time'`.

---

## Sandbox

Each judging call spins up a fresh Docker container with the following constraints:

| Constraint | Value |
|------------|-------|
| Network | none |
| Memory | 512 MB |
| CPUs | 1 |
| Filesystem | read-only + `/tmp` tmpfs |
| Container lifetime | one run, auto-removed |

The host only mounts the `.sb3` file into the container; the rest of your filesystem is untouched.

---

## TypeScript

Type declarations are included:

```ts
import { judge, JudgeConfig, JudgeResult, Checker } from '@donrx/scratch-judge';
```

---

## Development

Run the test suite (requires Docker and the built image):

```bash
npm test
```

Tests are written with [Jest](https://jestjs.io/) and live in `test/judge.test.js`. Fixture `.sb3` and `.json` files are in `test/fixtures/`.

---

## License

MIT