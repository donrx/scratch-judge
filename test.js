function checker(input, output, expected){
    if(output.live === expected.live && areEqual(output.list, expected.list)){
        return { score: 100, reason: 'Correct answer' };
    }else{
        return { score: 0, reason: 'Wrong answer'};
    }
}

module.exports = {checker}