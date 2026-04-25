async function judge(program, options, checker){
    const judgement = [];
    let avgScore = 0;
    let i = 0;
    for(const test of input.options.tests){
        await runProcess(input.programPath, test, checker)
        .then(result => {
            judgement.push(result);
            avgScore += result.score;
            i++;
        });
    }

    avgScore /= i > 0 ? i : 0;

    return {avgScore: avgScore, judgement: judgement}
}

module.exports = {judge};