const   fs = require("fs"),
        chalk = require('chalk');

// /^<([^\s>]+)/gm match beginning of html tag and capture tag: "li" is captured from <li>

// Flatten an array
let flattenArr = function(arr) {
    return arr.reduce( (flat, toFlatten) => {
        return flat.concat(Array.isArray(toFlatten) ? flattenArr(toFlatten) : toFlatten);
    }, []);
};

/**
 * Include a pepfile. Fetch, parse and compile the file, and return the compiled string.
 * This is static site generation/server-side only right now.
 * includeString: path to another pepfile, context, compiler options, include options (async bool)
 * Note that context and options will be inherited from the parent compiler, but you can overwrite them.
 * You can set context or options to null if you want them to be inherited and you want to provide values for later args.
 */
let include = function(includeString, _context, _options) {
    const   args = JSON.parse(`[${includeString}]`);
    const   filePath = args[0], // Path is relative to the current working directory
            /**
             * _context and _options are the values inherited from the parent compiler.
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
    const splitString = pepString.split(/\{\{(?=\$)|\{\{(?=\()|\{\{(?=\[)|\{\{(?=&)|\$\}\}|\)\}\}|\]\}\}|&\}\}/gm);

    let toEval = ""; // Container for all the js that will be evaluated.
    let result = []; // Result of parsing the string.

    splitString.forEach( (stringFragment, stringIndex, arr) => {
        const stringFragmentFirstChar = stringFragment[0]; // Cache this because we'll need to check it multiple times

        switch(stringFragmentFirstChar) {

            /**
             * {{$ $}} js expression in file scope
             * Input: js expression
             * Output: js expression evaluated in file scope
             */
            case "$": {
                stringFragment = stringFragment.substring(1).trim(); // Delete the template char and trim whitespace
                toEval += `\nbdcf1d20c5115a42c6ee39029562e82e[${stringIndex}] = ${stringFragment};`;
                break;
            }

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
                let parsedPepFragment = []; // Contains html expressions in the pep

                if(stringFragmentFirstChar === "(") { // js executed in independent scope
                    // Give it its own scope by enclosing it in an immediately invoked function.
                    stringFragment = `\n(function(){\nbdcf1d20c5115a42c6ee39029562e82e[${stringIndex}] = [];\n${stringFragment}\n})();`;
                } else { // first char should be "[" - js in file/string scope
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
                         * Input: string[path to another pepfile, context, options]
                         * Note that context and options will be inherited from the parent compiler, but you can overwrite them.
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
             * Input: string[path to another pepfile, context, options]
             * Note that context and options will be inherited from the parent compiler, but you can overwrite them.
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
     * Prepend string with: define array to hold result
     * Append to string: return that array
     * bdcf1d20c5115a42c6ee39029562e82e is the md5 of "peppermint". This value needs to be
     * very unique so that it doesn't interfere with the user's code (same variable name).
     */
    toEval = `const bdcf1d20c5115a42c6ee39029562e82e = [];${toEval}\nreturn bdcf1d20c5115a42c6ee39029562e82e;`;
    const evaluate = new Function("__Pep, require", toEval); // Evaluate all the js we collected in the string.
    const evaluated = evaluate(context, require); // Evaluation result
    /**
     * We must explicitly pass require() and other non-global node tools so that they're
     * available to the evaluated code. require() is a module global.
     */

    // Fill in the empty indices in result[] with the corresponding value in evaluated[]
    for(let i = 0, l = result.length; i < l; i++) {
        try {
            if(!result[i] && evaluated[i]) {
                result[i] = evaluated[i];
            }
        } catch(err) {
            console.log(`\n${chalk.cyan("peppermint: ")} ${chalk.red("Error: " + err)}
                \nwhile compiling the following string:\n ${chalk.magenta(pepString)}\nExiting...\n`);
            return;
        }
    }

    return flattenArr(result).join(""); // The compiled string
};

module.exports = exports = compile;
