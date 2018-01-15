// {{; js ;}}
// {{ html in js }}
// /^<([^\s>]+)/gm match beginning of html tag and capture tag: "li" is captured from <li>

// const gulp = require("gulp");
// const file = gulp.src("./sample.html")

module.exports = exports = compilePepfile;

function arrFlatten(arr) {
    return arr.reduce( (flat, toFlatten) => {
        return flat.concat(Array.isArray(toFlatten) ? arrFlatten(toFlatten) : toFlatten);
    }, []);
}





/* fileWithPep: A stringified file of html mixed with pep
 * context: Data to be used during compilation.
 * options: Compiler options
 */
function compilePepfile(fileWithPep, context, options) {
    // Split pepString at double curly braces with semicolons {{; ;}} into an array of pep fragments and strings of html.
    // Pep fragments will start with ";" because we didn't capture that in the split.
    const splitPepInHtml = fileWithPep.split(/\{{2}(?=;)|;\}{2}/gm);

    let toEval = "" // Container for all the js that will be evaluated.
    let result = []; // The parsed pep file.

    splitPepInHtml.forEach( (str, fileIndex, arr) => {

        if(str[0] === ";") {                // If the first char is a semicolon, it should be a pep fragment.
            //result[fileIndex] = [];     // Contains the result expressions in this fragment of the file
            let parsedFragment = [];    // Contains html expressions in the pep

            str = `bdcf1d20c5115a42c6ee39029562e82e[${fileIndex}] = [];\n${str}`;

            // Split pep fragment at double curly braces {{ }} into an array of fragments of pure js and html-with-js.
            // html fragments should start with "<"
            const splitHtmlInPep = str.split(/\{{2}\s+|\}{2}/gm);

            splitHtmlInPep.forEach( (str, fragmentIndex, arr) => {
                if(str[0] === "<") {            // If the first char is a less-than, it should be a string of html.
                    // Modify html into a js expression and push it into the fragment array with the other js.
                    parsedFragment[fragmentIndex] = `bdcf1d20c5115a42c6ee39029562e82e[${fileIndex}].push(\`${str}\`);`;
                } else parsedFragment[fragmentIndex] = str; // Plain js is just pushed to the array.
            });

            toEval += parsedFragment.join(""); // Collect js to be evaluated

        } else result[fileIndex] = str;
    });

    // Prepend str with: define arr to hold result
    // Append to str: return result arr
    toEval = `const bdcf1d20c5115a42c6ee39029562e82e = [];\n${toEval}\nreturn bdcf1d20c5115a42c6ee39029562e82e;`;

    const evaluate = new Function(toEval); // Evaluate all the js we collected in the file.
    const evaluated = evaluate(); // Evaluation result

    // Fill in the empty indices in result[] with the corresponding value in evaluated[]
    for(let i = 0, l = result.length; i < l; i++) {
        if(!result[i] && evaluated[i].length > 0) {
            result[i] = evaluated[i];
        }
    }

    return arrFlatten(result).join(""); // The compiled file
}
