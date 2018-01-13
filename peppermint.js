// const gulp = require("gulp");
// const file = gulp.src("./sample.html")

function arrFlatten(arr) {
    return arr.reduce( (flat, toFlatten) => {
        return flat.concat(Array.isArray(toFlatten) ? arrFlatten(toFlatten) : toFlatten);
    }, []);
}





let pepFileResult = {
    "contents": [
    ]
}

/*
let resultOfFile = {
    "contents": [
        "html"
        ,[                      // Pep - array of js and html expressions. Test for pep - starts with ";"
            "js"
            ,"html expression"  // Test for html expression - starts with "<"
        ]
        ,"html"
    ]
};
*/

let pepfile = '\n\
<div>\n\
    <ol>\n\
        {{;\n\
            let user = "Michael";\n\
            if(user) {\n\
                _\n\
                <p>Hello ${ user }</p>\n\
                _\n\
            }\n\
            let users = [\n\
                "Michael"\n\
                ,"Matthew"\n\
                ,"Alexander"\n\
            ];\n\
            for(let i = 0; i < 3; i++) {\n\
                _\n\
                <li>\n\
                    <p>User ${i}: <strong>${ users[i] }</strong></p>\n\
                </li>\n\
                _\n\
            }\n\
        }}\n\
    </ol>\n\
    {{;\n\
        _ <p>Goodbye</p> _\n\
        \n\
    }}\n\
</div>\n\
';

function compilePepfile(stringWithPep, context, options) {
    // Split pepString at curly braces {{ }} into an array of pep fragments and strings of html.
    let splitPepInHtml = stringWithPep.split(/\{{2}|\}{2}/g);

    let toEval = "" // Container for all the js that will be evaluated.

    // The parsed pep file. md5 hash of "peppermint".
    // This variable name needs to be very unique because it will interact with the user's code.
    let bdcf1d20c5115a42c6ee39029562e82e = [];

    splitPepInHtml.forEach( (str, fileIndex, arr) => {

        if(str[0] === ";") {                // If the first char is a semicolon, it should be a pep fragment.
            bdcf1d20c5115a42c6ee39029562e82e[fileIndex] = [];  // Contains the result expressions in this fragment
            let parsedFragment = [];        // Contains all the expressions in this fragment

            let splitHtmlInPep = str.split(/\s+_\s+(?=<)|>\s+_\s+/g);
            splitHtmlInPep.forEach( (str, fragmentIndex, arr) => {
                if(str[0] === "<") {            // If the first char is a less-than, it should be a string of html.
                    // Modify html into a js expression and push it into the fragment array with the other js.
                    parsedFragment[fragmentIndex] = `bdcf1d20c5115a42c6ee39029562e82e[${fileIndex}].push(\`${str}>\`);`;
                } else parsedFragment[fragmentIndex] = str; // Plain js is just pushed to the array.
            });

            toEval += parsedFragment.join(""); // Collect js to be evaluated

        } else bdcf1d20c5115a42c6ee39029562e82e[fileIndex] = str;
    });

    console.log(toEval);
    eval(toEval); // Evaluate all the js we collected in the file.

    return arrFlatten(bdcf1d20c5115a42c6ee39029562e82e).join(""); // The compiled file
}

console.log(compilePepfile(pepfile))
