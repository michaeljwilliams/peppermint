const fs = require("fs");
const compilePepString = require("../index.js");

const filename = "mint";
const inputFile = `${__dirname}/${filename}.pep`;
const inputFileContents = fs.readFileSync(inputFile, "utf8");
const correctResult = fs.readFileSync(`${__dirname}/correct.html`, "utf8");

function testCompilePepString(pepfile, correctResult) {
    console.log(`\nTesting compilePepfile...\nInput file: ${inputFile}`);

    try {
        const result = compilePepString(pepfile, {"user": "Broseidon"});
        if(result === correctResult) {
            console.log("Passed.\nCompilation result:\n");
            console.log(result);

            const outputFile = `${__dirname}/${filename}.html`;
            try {
                fs.writeFileSync(outputFile, result, "utf8");
                console.log(`\nResult successfully written to ${outputFile}.`);
            } catch(e) {
                console.log(`\nFailed to write result to ${outputFile}. Error: ${e}`);
            }
        } else {
            console.log("Failed. Compiled result does not match correct result.\nCompilation result:\n");
            console.log(result);
            console.log("\n\n\nCorrect result:\n");
            console.log(correctResult);
        }
    } catch(e) {
        console.log(`Error: Compilation of file ${inputFile} failed with error: ${e}`);
    }

}

testCompilePepString(inputFileContents, correctResult);
