const { fork } = require('child_process');

const runProcess = (program, test, checker) => {
    return new Promise((resolve, reject) => {
        const subProcess = fork('src/core.js', {
            timeout: 5000
        });
        subProcess.send({program: program.toString('base64'), test: test, checker: checker});
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

async function judge(program, options, checker){
    const judgement = [];
    let avgScore = 0;
    let i = 0;
    for(const test of options.tests){
        await runProcess(program, test, checker)
        .then(result => {
            judgement.push(result);
            avgScore += result.score;
            i++;
        });
    }

    avgScore /= i > 0 ? i : 0;

    return {avgScore: avgScore, judgement: judgement}
}

module.exports = {judge};