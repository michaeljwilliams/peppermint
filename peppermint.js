// {{; js ;}}
// {{ html in js }}

// const gulp = require("gulp");
// const file = gulp.src("./sample.html")

function arrFlatten(arr) {
    return arr.reduce( (flat, toFlatten) => {
        return flat.concat(Array.isArray(toFlatten) ? arrFlatten(toFlatten) : toFlatten);
    }, []);
}

function compilePepfile(stringWithPep, context, options) {
    // Split pepString at double curly braces with semicolons {{; ;}} into an array of pep fragments and strings of html.
    // Pep fragments will start with ";" because we didn't capture that in the split.
    let splitPepInHtml = stringWithPep.split(/\{{2}(?=;)|;\}{2}/gm);

    let toEval = "" // Container for all the js that will be evaluated.

    // The parsed pep file. md5 hash of "peppermint".
    // This variable name needs to be very unique because it will interact with the user's code.
    let bdcf1d20c5115a42c6ee39029562e82e = [];

    splitPepInHtml.forEach( (str, fileIndex, arr) => {

        if(str[0] === ";") {                // If the first char is a semicolon, it should be a pep fragment.
            bdcf1d20c5115a42c6ee39029562e82e[fileIndex] = [];  // Contains the result expressions in this fragment
            let parsedFragment = [];        // Contains all the expressions in this fragment

            // Split pep fragment at double curly braces {{ }} into an array of fragments of pure js and html-with-js.
            // html fragments should start with "<"
            let splitHtmlInPep = str.split(/\{{2}\s+|\}{2}/gm);

            splitHtmlInPep.forEach( (str, fragmentIndex, arr) => {
                if(str[0] === "<") {            // If the first char is a less-than, it should be a string of html.
                    // Modify html into a js expression and push it into the fragment array with the other js.
                    parsedFragment[fragmentIndex] = `bdcf1d20c5115a42c6ee39029562e82e[${fileIndex}].push(\`${str}\`);`;
                } else parsedFragment[fragmentIndex] = str; // Plain js is just pushed to the array.
            });

            toEval += parsedFragment.join(""); // Collect js to be evaluated

        } else bdcf1d20c5115a42c6ee39029562e82e[fileIndex] = str;
    });

    eval(toEval); // Evaluate all the js we collected in the file.

    return arrFlatten(bdcf1d20c5115a42c6ee39029562e82e).join(""); // The compiled file
}



module.exports = exports = compilePepfile;


// /^<([^\s>]+)/gm match beginning of html tag and capture tag: "li" is captured from <li>
// /\n{2}(?:<)|(?:>)\n{2}/gm separate at double newline and < or >
