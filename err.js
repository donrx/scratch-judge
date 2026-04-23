const promise = () => {
    return new Promise((resolve, reject) => {
        reject('Error');
    })
}

async function main() {
    await promise()
    .catch(err => {
        throw(new Error(err));
    })
}

(async () => {
    try{
        await main();
    }catch(err){
        console.error('Test: ' + err.message);
    }
})();