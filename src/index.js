const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function judge(program, options, checker){
    if(options.tests.length > 20){
        throw(new Error('Too many tests'));
    }

    if (!Number.isFinite(timeout) || timeout <= 0 || timeout > 60){
        throw(new Error('Invalid timeout'));
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scratch-judge-'));
    const programPath = path.join(tmpDir, 'program.sb3');

    try {
        fs.writeFileSync(programPath, program);

        const input = {
            programPath: '/sandbox/program.sb3',
            options: options,
            checkerCode: checker ? checker.toString() : null
        };

        const result = await runInDocker(tmpDir, programPath, input);
        return result;
    } finally {
        fs.rmSync(tmpDir, { recursive: true });
    }
}

function runInDocker(tmpDir, programPath, input){
    return new Promise((resolve, reject) => {
        const args = [
            'run', '--rm',
            '--network', 'none',
            '--memory', input.options.memoryLimit ?? '256m',
            '--cpus', '1',
            '--read-only',
            '--tmpfs', '/tmp',
            '-v', `${programPath}:/sandbox/program.sb3:ro`,
            '-i',
            'scratch-judge-runner'
        ];

        const child = execFile('docker', args, {
            timeout: input.options.timeout * input.options.tests.length + 5000,
            maxBuffer: 1024 * 1024
        }, (err, stdout, stderr) => {
            try{
                if(stdout && stdout.trim() !== ''){
                    const result = JSON.parse(stdout);
                    if (result.error) {
                        return reject(new Error(
                            result.error.stack.replaceAll('/app/', '')
                        ));
                    }
                    return resolve(result);
                }
            } catch(error){
                console.error(error.message);
            }

            if (err){
                return reject(new Error(`Docker error: ${err.code}\nStderr: ${stderr}`));
            }

            reject(new Error(`Bad output: ${stdout}`));
        });

        child.stdin.write(JSON.stringify(input));
        child.stdin.end();
    });
}

module.exports = {judge};