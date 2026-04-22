global.navigator = { userAgent: 'node', onLine: true };
global.window = global;
global.self = global;
global.document = {
    createElement: () => ({ getContext: () => null }),
    addEventListener: () => {},
};
global.location = { href: '' };

const { judge } = require('./core');
const fs = require('fs');
const vm = require('vm');

async function main() {
    const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
    const program = fs.readFileSync(input.programPath);

    let checker = null;
    if (input.checkerCode){
        const script = new vm.Script(`(${input.checkerCode})`);
        const ctx = vm.createContext({});
        checker = script.runInContext(ctx);
    }

    const result = await judge(program, input.options, checker);
    process.stdout.write(JSON.stringify(result));
}

main().catch(err => {
    process.stdout.write(JSON.stringify({ error: {message: err.message, stack: err.stack} }));
    process.exit(1);
})