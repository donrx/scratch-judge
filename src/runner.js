const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { fork } = require('child_process');
const process = require('process');

const runProcess = (programPath, test, checker) => {
    return new Promise((resolve, reject) => {
        const subProcess = fork(path.resolve(process.cwd(), 'src/core.js'), {
            timeout: 5000
        });
        subProcess.send({programPath: programPath, test: test, checker: checker});
        subProcess.once('exit', (code, signal) => {
            if(code !== 0){
                return reject(new Error(`Child process exited with code ${code}`));
            }
        })
        subProcess.once('message', (message) => {
            if(message.error != null){
                return reject(new Error(message.error));
            }

            resolve(message.result);

            subProcess.kill('SIGKILL');
            subProcess.disconnect();
        });
    })
}

async function main() {
    const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));

    let checker = null;
    if (input.checkerCode){
        const script = new vm.Script(`(${input.checkerCode})`);
        const ctx = vm.createContext({});
        checker = script.runInContext(ctx);
    }

    const judgement = [];
    let avgScore = 0;
    let i = 0;
    for(const test of input.options.tests){
        await runProcess(input.programPath, test, checker)
        .then(result => {
            judgement.push(result);
            avgScore += result.score;
            i++;
        });
    }

    avgScore /= i > 0 ? i : 0;

    process.stdout.write(JSON.stringify({avgScore: avgScore, judgement: judgement}));
}

(async () => {
    await main().catch(err => {
        process.stdout.write(JSON.stringify({ error: err.stack ?? err }));
        process.exit(1);
    });
})();