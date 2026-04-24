const VirtualMachine = require('scratch-vm');

const areEqual = (arr1, arr2) => 
    arr1.length === arr2.length && 
    arr1.every((value, index) => value === arr2[index]);

function waitForProgramEnd(vm, timeoutMs) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            resolve('TIMEOUT');
        }, timeoutMs);

        vm.once('PROJECT_RUN_STOP', () => {
            clearTimeout(timer);
            resolve('OK');
        })
    });
}

function toSafe(obj) {
    const safe = Object.create(null);
    for (const [k, v] of Object.entries(obj)) {
        safe[k] = Array.isArray(v) ? [...v] : v;
    }
    return safe;
}

async function judge(program, options, checker){
    const judgement = [];

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

    for(const test of options.tests){
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

        try{
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
                    judgement.push({ score: 0, reason: 'Invalid format'});
                    continue;
                }
            }

            inputList.value = input.list;

            if(!outputList){
                if(expected.list.length == 0){
                    outputList = {};
                    outputList.value = [];
                } else{
                    judgement.push({ score: 0, reason: 'Invalid format'});
                    continue;
                }
            }
            vm.runtime.on('SAY', onSay);
            vm.runtime.on('QUESTION', onQuestion);

            const endPromise = waitForProgramEnd(vm, options.timeout);
            vm.greenFlag();
            let result = 'OK';
            if (vm.runtime.threads.length > 0) {
                result = await endPromise;
            }
            vm.stopAll();
            vm.quit();
            if(result === 'TIMEOUT'){
                judgement.push({score: 0, reason: 'Out of time'});
                continue;
            }

            judgement.push(checker(toSafe(input), toSafe({ list: outputList.value, live: answer }), toSafe(expected)));
        } catch(err){
            throw new Error(err);
        } finally{
            vm.runtime.removeListener('SAY', onSay);
            vm.runtime.removeListener('QUESTION', onQuestion);
        }
    }
    vm.quit();

    let avgScore = 0;
    let i = 0;
    for(const test of judgement){
        avgScore += test.score;
        i++;
    }
    if(i === 0){
        avgScore = 0;
    } else{
        avgScore /= i;
    }

    return { avgScore, judgement };
}   

module.exports = { judge };