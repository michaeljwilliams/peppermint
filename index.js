const fs = require("fs");

// /^<([^\s>]+)/gm match beginning of html tag and capture tag: "li" is captured from <li>

// Flatten an array
let flattenArr = function(arr) {
    return arr.reduce( (flat, toFlatten) => {
        return flat.concat(Array.isArray(toFlatten) ? flattenArr(toFlatten) : toFlatten);
    }, []);
};

/**
 * includeString: path to another pepfile, context, compiler options, include options (async bool)
 * Note that context and options will be inherited from the parent compiler call, but you can overwrite them.
 * You can set context or options to null if you want them to be inherited and you want to provide values for later args.
 */
let include = function(includeString, _context, _options) {
    const   args = JSON.parse(`[${includeString}]`);
    const   filePath = args[0], // Path is relative to the current working directory
            /**
             * _context and _options are the values inherited from the parent compiler call.
             * We'll use them if context and/or options args aren't provided in the include string.
             */
            context = args[1] || _context,
            options = args[2] || _options;

    const fileContents = fs.readFileSync(filePath, "utf8"); // File must be in utf8
    return compile(fileContents, context, options);
};

/**
 * Parse and compile a string of pep, given specific context and options, and return the result.
 * pepString: A string of text or code, mixed with pep
 * context: Data that is passed to the template code being compiled.
 * options: Compiler options
 */
let compile = function(pepString, context, options) {
    context = context || {};
    options = options || {};

    // Split string at double curly braces {{_ _}} into an array of pep fragments and strings of html.
    const splitString = pepString.split(/\{\{(?=\()|\{\{(?=\[)|\{\{(?=&)|\)\}\}|\]\}\}|&\}\}/gm);

    let toEval = ""; // Container for all the js that will be evaluated.
    let result = []; // Result of parsing the string.

    splitString.forEach( (stringFragment, stringIndex, arr) => {
        const stringFragmentFirstChar = stringFragment[0]; // Cache this because we'll need to check it multiple times

        switch(stringFragmentFirstChar) {

            /**
             * {{( )}} js in independent scope
             * Input: js
             * Output: js evaluated in its own scope
             * Continues to the next case because the cases are very similar.
             */
            case "(":

            /**
             * {{[ ]}} js in file/string scope
             * Input: js
             * Output: js evaluated in the scope of the current file/string
             */
            case "[": {
                stringFragment = stringFragment.substring(1); // Delete the template char
                // If true, string should be a pep fragment.
                let parsedPepFragment = [];            // Contains html expressions in the pep

                if(stringFragmentFirstChar === "(") {                // js executed in independent scope
                    // Give it its own scope by enclosing it in an immediately invoked function.
                    stringFragment = `\n(function(){\nbdcf1d20c5115a42c6ee39029562e82e[${stringIndex}] = [];\n${stringFragment}\n})();`;
                    // bdcf1d20c5115a42c6ee39029562e82e is the md5 of "peppermint". This value needs to be very unique so that
                    // it doesn't interfere with the user's code (same variable name).
                } else {    // firstChar === "["   js exected in file/string scope
                    stringFragment = `\nbdcf1d20c5115a42c6ee39029562e82e[${stringIndex}] = [];\n${stringFragment}`;
                }
                // Split pep at double curly braces {{_ _}} into an array of fragments of pure js and html-with-js.
                const splitPep = stringFragment.split(/\{\{(?=\{)|\{\{(?=!)|\}\}\}|!\}\}/gm);

                splitPep.forEach( (pepFragment, pepIndex, arr) => {
                    const pepFragmentFirstChar = pepFragment[0]; // Cache this in case we want to check it multiple times
                    switch(pepFragmentFirstChar) {

                        /**
                         * {{{ }}} Unescaped html
                         * Input: html with js expressions
                         * Output: Unescaped html with values of resolved expressions
                         */
                        case "{": {
                            pepFragment = pepFragment.substring(1); // Delete the template char
                            // Modify html into a js expression and push it into the fragment array with the other js.
                            parsedPepFragment[pepIndex] = `\nbdcf1d20c5115a42c6ee39029562e82e[${stringIndex}].push(\`${pepFragment}\`);`;
                            break;
                        }

                        /**
                         * {{! !}} Escaped html
                         * Input: html with js expressions
                         * Output: Escaped html with values of resolved expressions
                         */
                        case "!": {
                            pepFragment = pepFragment.substring(1); // Delete the template char
                            // >>> TO-DO: escape html in the string
                            // Modify html into a js expression and push it into the fragment array with the other js.
                            //parsedPepFragment[pepIndex] = `bdcf1d20c5115a42c6ee39029562e82e[${stringIndex}].push(\`${pepFragment}\`);`;
                            break;
                        }

                        /**
                         * {{& &}} Include pepfile
                         * Input: Path to another pepfile, context, options, async bool
                         * Note that context will be inherited from the parent template, but you can overwrite it.
                         * Ouput: Parsed pepfile result
                         */
                        case "&": {
                            pepFragment = pepFragment.substring(1); // Delete the template char
                            parsedPepFragment[pepIndex] = include(pepFragment, context, options);
                            break;
                        }

                        // Plain js is just pushed to the array.
                        default: {
                            parsedPepFragment[pepIndex] = pepFragment;
                            break;
                        }
                    }
                });

                toEval += parsedPepFragment.join(""); // Collect js to be evaluated
                break;
            }

            /**
             * {{& &}} Include pepfile
             * Input: Path to another pepfile, context, options
             * Note that context will be inherited from the parent template, but you can overwrite it.
             * Ouput: Parsed pepfile result
             */
            case "&": {
                stringFragment = stringFragment.substring(1); // Delete the template char
                result[stringIndex] = include(stringFragment, context, options);
                break;
            }

            // Plain html is just pushed to the array
            default: {
                result[stringIndex] = stringFragment;
                break;
            }
        }
    });

    /**
     * Prepend string with: define arr to hold result
     * Append to string: return result arr
     */
    toEval = `const bdcf1d20c5115a42c6ee39029562e82e = [];${toEval}\nreturn bdcf1d20c5115a42c6ee39029562e82e;`;

    const evaluate = new Function("__Pep", toEval); // Evaluate all the js we collected in the string.
    const evaluated = evaluate(context); // Evaluation result

    // Fill in the empty indices in result[] with the corresponding value in evaluated[]
    for(let i = 0, l = result.length; i < l; i++) {
        if(!result[i] && evaluated[i].length > 0) {
            result[i] = evaluated[i];
        }
    }

    return flattenArr(result).join(""); // The compiled string
};

module.exports = exports = compile;
