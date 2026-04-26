const { fork } = require('child_process');

const runVM = (program, test) => {
    return new Promise((resolve, reject) => {
        const subProcess = fork('src/runner.js', {
            timeout: 5000
        });
        subProcess.send({program: program.toString('base64'), test: test});
        subProcess.once('exit', (code, signal) => {
            if(code !== 0){
                return reject(new Error(`Child process exited with code ${code}`));
            }
        });
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

const runChecker = (input, checker) => {
    return new Promise((resolve, reject) => {
        if(!checker){
            checker = (input, output, expected) => {
                if(output.live === expected.live && areEqual(output.list, expected.list)){
                    return { score: 100, reason: 'Correct answer' };
                }else{
                    return { score: 0, reason: 'Wrong answer'};
                }
            }
        }

        const subProcess = fork('src/checker.js', {
            timeout: 5000
        });
        
        subProcess.send({input: input, checker: checker.toString()});
        subProcess.once('exit', (code, signal) => {
            if(code !== 0){
                return reject(new Error(`Child process exited with code ${code}`));
            }
        });
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
        await runVM(program, test, checker)
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