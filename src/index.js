const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function judge(program, json, checker){
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scratch-judge-'));
    const programPath = path.join(tmpDir, 'program.sb3');

    try {
        fs.writeFileSync(programPath, program);

        const input = JSON.stringify({
            programPath: '/sandbox/program.sb3',
            json,
            checkerCode: checker ? checker.toString() : null
        });

        const result = await runInDocker(tmpDir, programPath, input, json.timeout * json.tests.length);
        return result;
    } finally {
        fs.rmSync(tmpDir, { recursive: true });
    }
}

function runInDocker(tmpDir, programPath, input, timeout){
    return new Promise((resolve, reject) => {
        const args = [
            'run', '--rm',
            '--network', 'none',
            '--memory', '512m',
            '--cpus', '1',
            '--read-only',
            '--tmpfs', '/tmp',
            '-v', `${programPath}:/sandbox/program.sb3:ro`,
            '-i',
            'scratch-judge-runner'
        ];

        const child = execFile('docker', args, {
            timeout: timeout + 5000,
            maxBuffer: 1024 * 1024
        }, (err, stdout, stderr) => {
            try{
                if(stdout && stdout.trim() !== ''){
                    const result = JSON.parse(stdout);
                    if (result.error) {
                        console.error('[judge] runner error:', result.error);
                        return resolve({ score: 0, message: 'Internal error' });
                    }
                    return resolve(result);
                }
            } catch(parseError){

            }

            if (err){
                return reject(new Error(`Docker error: ${err.message}\nStderr: ${stderr}`));
            }

            reject(new Error(`Bad output: ${stdout}`));
        });

        child.stdin.write(input);
        child.stdin.end();
    });
}

module.exports = {judge};