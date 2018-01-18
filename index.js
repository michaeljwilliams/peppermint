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
function compileWithPep(fileWithPep, context, options) {
    // Split pepString at double curly braces with semicolons {{; ;}} into an array of pep fragments and strings of html.
    // Pep fragments will start with ";" because we didn't capture that in the split.
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// NEGATED LOOKAHEAD FOR ESCAPE SEQUENCE. CAPTURE THE LAST CHAR IF IT'S SPECIAL. TRY CHARACTER SETS INSTEAD (PROBABLY FASTER)
    const splitFile = fileWithPep.split(/\{\{(?!%)|\}\}\)|\}\}\]|\}\}&|\}\}\}|\}\}!/gm);
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

    let toEval = "" // Container for all the js that will be evaluated.
    let result = []; // The parsed pep file.

    splitFile.forEach( (fstr, fileIndex, arr) => {
        const firstCharFileString = fstr[0]; // Cache this because we'll need to check it multiple times

        switch(firstCharFileString) {

            /* {{( )}} js in independent scope
             * Input: js
             * Output: js evaluated in its own scope
             * Continues to the next case because the cases are very similar.
             */
            case "(":

            /* {{[ ]}} js in file scope
             * Input: js
             * Output: js evaluated in the scope of the current file
             */
            case "[": {
                // If true, string should be a pep fragment.
                //result[fileIndex] = [];           // Contains the result expressions in this fragment of the file
                let parsedFragment = [];            // Contains html expressions in the pep

                if(firstCharFileString === "(") {                // js executed in independent scope
                    // Give it its own scope by enclosing it in an immediately invoked function
                    fstr = `(function(){\nbdcf1d20c5115a42c6ee39029562e82e[${fileIndex}] = [];\n${fstr}\n})();`;
                } else {    // firstChar === "["   js exected in file scope
                    fstr = `bdcf1d20c5115a42c6ee39029562e82e[${fileIndex}] = [];\n${fstr}`;
                }

                // Split pep fragment at double curly braces {{ }} into an array of fragments of pure js and html-with-js.
                // html fragments should start with "<"
                const splitPep = fstr.split(/\{\{|\}\}\}|!\}\}/gm);

                splitPep.forEach( (pstr, fragmentIndex, arr) => {
                    const firstCharPepString = pstr[0]; // Cache this in case we want to check it multiple times
                    switch(firstCharPepString) {

                        /* {{{ }}} Unescaped html
                         * Input: html with js expressions
                         * Output: Unescaped html with values of resolved expressions
                         */
                        case "{": {
                            // Modify html into a js expression and push it into the fragment array with the other js.
                            parsedFragment[fragmentIndex] = `bdcf1d20c5115a42c6ee39029562e82e[${fileIndex}].push(\`${pstr}\`);`;
                            break;
                        }

                        /* {{! !}} Escaped html
                         * Input: html with js expressions
                         * Output: Escaped html with values of resolved expressions
                         */
                        case "!": {
                            // Modify html into a js expression and push it into the fragment array with the other js.
                            // >>> TO-DO: escape html in the string below
                            //parsedFragment[fragmentIndex] = `bdcf1d20c5115a42c6ee39029562e82e[${fileIndex}].push(\`${pstr}\`);`;
                            break;
                        }

                        /* {{& &}} Include pepfile
                         * Input: Path to another pepfile, context, options
                         * Ouput: Parsed pepfile result
                         */
                        case "&": {
                            break;
                        }

                        // Plain js is just pushed to the array.
                        default: {
                            result[fileIndex] = pstr;
                            break;
                        }
                    }
                });

                toEval += parsedFragment.join(""); // Collect js to be evaluated
                break;
            }

            /* {{& &}} Include pepfile
             * Input: Path to another pepfile, context, options
             * Ouput: Parsed pepfile result
             */
            case "&": {
                break;
            }

            // Plain html is just pushed to the array
            default: {
                else result[fileIndex] = fstr;
                break;
            }
        }
    });

    /* Prepend fstr with: define arr to hold result
     * Append to fstr: return result arr
     * Finally, give it its own scope by enclosing it in an immediately invoked function
     */
    toEval = `(function(){\nconst bdcf1d20c5115a42c6ee39029562e82e = [];\n${toEval}\nreturn bdcf1d20c5115a42c6ee39029562e82e;\n}();`;

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
