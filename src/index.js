const { fork, execFile } = require('child_process');

const runVM = (program, test, timeoutMs) => {
    return new Promise((resolve, reject) => {
        const subProcess = fork('src/runner.js', [], { silent: true });
        const timeout = setTimeout(() => {
            subProcess.kill('SIGKILL');
            subProcess.disconnect();

            return resolve({result: {score: 0, reason: 'Out of time'}});
        }, timeoutMs);
        subProcess.send({program: program.toString('base64'), test: test});
        subProcess.once('exit', (code, signal) => {
            subProcess.removeAllListeners('message');
            clearTimeout(timeout);
            resolve({result: {score: 0, reason: 'Internal error'}});
        });
        subProcess.once('message', (message) => {
            subProcess.removeAllListeners('exit');
            clearTimeout(timeout);

            if(message.error != null){
                return resolve({result: {score: 0, reason: 'Internal error'}});
            }

            resolve(message.result);

            subProcess.kill('SIGKILL');
            subProcess.disconnect();
        });
    })
}

const runChecker = (input, output, expected, checker) => {
    return new Promise((resolve, reject) => {
        if(!checker){
            checker = (input, output, expected) => {
                const listsEqual = output.list.length === expected.list.length &&
                    output.list.every((v, i) => v === expected.list[i]);
                if(output.live === expected.live && listsEqual){
                    return { score: 100, reason: 'Correct answer' };
                } else {
                    return { score: 0, reason: 'Wrong answer' };
                }
            }
        }

        const args = [
            '--rss=134217728',
            '--cpu=5',
            'deno', 'run', '--no-prompt', '-'
        ];

        const subProcess = execFile('prlimit', args, {
            timeout: 5000,
        }, (error, stdout, stderr) => {
            try{
                if(stdout && stdout.trim()){
                    const result = JSON.parse(stdout);
                    if(
                        !Number.isSafeInteger(result.score) || result.score > 100 || result.score < 0 ||
                        !(typeof result.reason === 'string')
                    ){
                        return resolve({score: 0, reason: 'Internal error'});
                    }
                    return resolve(result);
                }
            } catch(err) {

            }
            resolve({ score: 0, reason: 'Internal error' });
        });

        subProcess.stdin.write(
            `const checker = ${checker.toString()};\n console.log(JSON.stringify(checker(${JSON.stringify(input)}, ${JSON.stringify(output)}, ${JSON.stringify(expected)})))`
        );
        subProcess.stdin.end();
    });
}

async function judge(program, options, checker){
    const judgement = [];
    let avgScore = 0;
    let i = 0;
    for(const test of options.tests){
        await runVM(program, test, options.timeout)
        .then(async result => {
            if(result.state){
                result.result = await runChecker(result.state.input, result.state.output, result.state.expected, checker);
            }

            judgement.push(result.result);
            avgScore += result.result.score;
            i++;
        });
    }

    if (i > 0) avgScore /= i;

    return {avgScore: avgScore, judgement: judgement}
}

module.exports = {judge};