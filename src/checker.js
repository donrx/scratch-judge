function check(input, checker){
    checker
}

process.once('message', (message) => {
    (async () => {
        await check(message.input, new Function(message.checker))
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