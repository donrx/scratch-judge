const ivm = require('isolated-vm');

function initChecker(checker){
    const isolate = new ivm.Isolate({
        onCatastrophicError: (message) => {
            throw(`Catastrophic error: ${message}`);
        }
    });

    //const module = isolate.compileModuleSync(checker);
}

initChecker('');