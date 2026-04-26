global.navigator = { userAgent: 'node', onLine: true };
global.window = global;
global.self = global;
global.document = {
    createElement: () => ({ getContext: () => null }),
    addEventListener: () => {},
};
global.location = { href: '' };

const VirtualMachine = require('scratch-vm');
const fs = require('fs')

const areEqual = (arr1, arr2) => 
    arr1.length === arr2.length && 
    arr1.every((value, index) => value === arr2[index]);

const run = (vm) => {
    return new Promise((resolve, reject) => {
        vm.greenFlag();

        if(vm.runtime.threads.length === 0){
            resolve();
        }

        vm.runtime.once('PROJECT_RUN_STOP', () => {
            resolve();
        })
    })
}

async function judge(program, test, checker){
    checker = null;
    if(!checker){
        checker = (input, output, expected) => {
            if(output.live === expected.live && areEqual(output.list, expected.list)){
                return { score: 100, reason: 'Correct answer' };
            }else{
                return { score: 0, reason: 'Wrong answer'};
            }
        }
    }

    const vm = new VirtualMachine();

    await vm.loadProject(program);

    vm.start();

    const input = test.input;
    const expected = test.output;

    let answer = '';
    let answered = false;
    const onSay = (target, type, message) => {
        if(type !== 'say') return;

        answer = message;
    }

    let questionIndex = 0;
    const onQuestion = (question) => {
        if(question == null) return;
        if(question !== '' && !answered){
            vm.runtime.removeListener('SAY', onSay);
            answered = true;
        }
        vm.runtime.emit('ANSWER', input.live[questionIndex] ?? '');
        questionIndex++;
    }

    const stage = vm.runtime.getTargetForStage();
    
    let inputList = Object.values(stage.variables).find(
        v => v.name === 'INPUT' && v.type === "list"
    );

    let outputList = Object.values(stage.variables).find(
        v => v.name === 'OUTPUT' && v.type === "list"
    )

    if(!inputList){
        if(input.list.length == 0){
            inputList = {};
            inputList.value = [];
        } else{
            return { score: 0, reason: 'Invalid format'};
        }
    }

    inputList.value = input.list;

    if(!outputList){
        if(expected.list.length == 0){
            outputList = {};
            outputList.value = [];
        } else{
            return { score: 0, reason: 'Invalid format'};
        }
    }
    vm.runtime.on('SAY', onSay);
    vm.runtime.on('QUESTION', onQuestion);

    await run(vm);
    vm.stopAll();

    return checker(input, { list: outputList.value, live: answer}, expected);
}   

process.once('message', (message) => {
    (async () => {
        await judge(Buffer.from(message.program, 'base64'), message.test, message.checker)
        .then(result => {
            process.send({result: result});
            process.exit(0);
        })
        .catch(err => {
            process.send({error: err.stack ?? err});
            process.exit(1);
        });
    })();
})
