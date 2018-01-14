let compilePepfile = require('../peppermint.js');



let pepfile = '\n\
<div>\n\
    <ol>\n\
        {{;\n\
            let user = "Michael";\n\
            if(user) {\n\
                {{\n\
                    <p>Hello ${ user }</p>\n\
                }}\n\
            }\n\
            let users = [\n\
                "Michael"\n\
                ,"Matthew"\n\
                ,"Alexander"\n\
            ];\n\
            for(let i = 0; i < 3; i++) {\n\
                {{\n\
                    <li>\n\
                        <p>User ${i}: <strong>${ users[i] }</strong></p>\n\
                    </li>\n\
                }}\n\
            }\n\
        ;}}\n\
    </ol>\n\
    {{;\n\
        {{ <p>Goodbye ${ user }</p> }}\n\
    ;}}\n\
</div>\n\
';

let correctResult = `
<div>
    <ol>
        <p>Hello Michael</p>
                <li>
                        <p>User 0: <strong>Michael</strong></p>
                    </li>
                <li>
                        <p>User 1: <strong>Matthew</strong></p>
                    </li>
                <li>
                        <p>User 2: <strong>Alexander</strong></p>
                    </li>
                
    </ol>
    <p>Goodbye Michael</p> 
</div>
`;

function testCompilePepfile(pepfile, correctResult) {
    console.log("\nTesting compilePepfile...");

    let result = compilePepfile(pepfile);

    if(result === correctResult) {
        console.log("Passed.\n");
    } else {
        console.log("Failed.\n");
    }

    console.log("Result:\n");
    console.log(result);
}

testCompilePepfile(pepfile, correctResult);