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
 * context: Data that is passed to the template code being compiled.
 * options: Compiler options
 */
function compilePepfile(fileWithPep, context, options) {
    // Split file string at double curly braces {{_ _}} into an array of pep fragments and strings of html.
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// NEGATED LOOKAHEAD FOR ESCAPE SEQUENCE. TRY CHARACTER SETS INSTEAD (PROBABLY FASTER)
    const splitFile = fileWithPep.split(/\{\{(?=\()|\{\{(?=\[)|\{\{(?=&)|\)\}\}|\]\}\}|&\}\}/gm);
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

    let toEval = ""; // Container for all the js that will be evaluated.
    let result = []; // The parsed pep file.

    splitFile.forEach( (fileFragment, fileIndex, arr) => {
        const firstCharFileFragment = fileFragment[0]; // Cache this because we'll need to check it multiple times

        switch(firstCharFileFragment) {

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
                fileFragment = fileFragment.substring(1); // Delete the template char
                // If true, string should be a pep fragment.
                let parsedFragment = [];            // Contains html expressions in the pep

                if(firstCharFileFragment === "(") {                // js executed in independent scope
                    // Give it its own scope by enclosing it in an immediately invoked function
                    fileFragment = `\n(function(){\nbdcf1d20c5115a42c6ee39029562e82e[${fileIndex}] = [];\n${fileFragment}\n})();`;
                } else {    // firstChar === "["   js exected in file scope
                    fileFragment = `\nbdcf1d20c5115a42c6ee39029562e82e[${fileIndex}] = [];\n${fileFragment}`;
                }
                // Split pep at double curly braces {{_ _}} into an array of fragments of pure js and html-with-js.
                const splitPep = fileFragment.split(/\{\{(?=\{)|\{\{(?=!)|\}\}\}|!\}\}/gm);

                splitPep.forEach( (pepFragment, pepIndex, arr) => {
                    const firstCharPepFragment = pepFragment[0]; // Cache this in case we want to check it multiple times
                    switch(firstCharPepFragment) {

                        /* {{{ }}} Unescaped html
                         * Input: html with js expressions
                         * Output: Unescaped html with values of resolved expressions
                         */
                        case "{": {
                            pepFragment = pepFragment.substring(1); // Delete the template char
                            // Modify html into a js expression and push it into the fragment array with the other js.
                            parsedFragment[pepIndex] = `\nbdcf1d20c5115a42c6ee39029562e82e[${fileIndex}].push(\`${pepFragment}\`);`;
                            break;
                        }

                        /* {{! !}} Escaped html
                         * Input: html with js expressions
                         * Output: Escaped html with values of resolved expressions
                         */
                        case "!": {
                            pepFragment = pepFragment.substring(1); // Delete the template char
                            // Modify html into a js expression and push it into the fragment array with the other js.
                            // >>> TO-DO: escape html in the string below
                            //parsedFragment[pepIndex] = `bdcf1d20c5115a42c6ee39029562e82e[${fileIndex}].push(\`${pepFragment}\`);`;
                            break;
                        }

                        /* {{& &}} Include pepfile
                         * Input: Path to another pepfile, context, options
                         * Ouput: Parsed pepfile result
                         */
                        case "&": {
                            pepFragment = pepFragment.substring(1); // Delete the template char
                            break;
                        }

                        // Plain js is just pushed to the array.
                        default: {
                            parsedFragment[pepIndex] = pepFragment;
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
                fileFragment = fileFragment.substring(1); // Delete the template char
                break;
            }

            // Plain html is just pushed to the array
            default: {
                result[fileIndex] = fileFragment;
                break;
            }
        }
    });

    /* Prepend fileFragment with: define arr to hold result
     * Append to fileFragment: return result arr
     */
    toEval = `const bdcf1d20c5115a42c6ee39029562e82e = [];${toEval}\nreturn bdcf1d20c5115a42c6ee39029562e82e;`;

    const evaluate = new Function("__Pep", toEval); // Evaluate all the js we collected in the file.
    const evaluated = evaluate(context); // Evaluation result

    // Fill in the empty indices in result[] with the corresponding value in evaluated[]
    for(let i = 0, l = result.length; i < l; i++) {
        if(!result[i] && evaluated[i].length > 0) {
            result[i] = evaluated[i];
        }
    }

    return arrFlatten(result).join(""); // The compiled file
}
