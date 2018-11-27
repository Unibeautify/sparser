import { resolveTxt } from "dns";

/*jslint node:true */
/*eslint-env node*/
/*eslint no-console: 0*/

/* This file exists to consolidate the various Node service offerings in
   this application. */

const services = function services_() {
    "use strict";
    let version:string = "",
        command:string = "";
    const startTime:[number, number] = process.hrtime(),
        args:string[] = process.argv.slice(2),
        node = {
            child: require("child_process").exec,
            fs   : require("fs"),
            http : require("http"),
            os   : require("os"),
            path : require("path")
        },
        sep:string = node.path.sep,
        text:any     = {
            angry    : "\u001b[1m\u001b[31m",
            blue     : "\u001b[34m",
            bold     : "\u001b[1m",
            clear    : "\u001b[24m\u001b[22m",
            cyan     : "\u001b[36m",
            diffchar : "\u001b[1m\u001b[4m",
            green    : "\u001b[32m",
            nocolor  : "\u001b[39m",
            none     : "\u001b[0m",
            purple   : "\u001b[35m",
            red      : "\u001b[31m",
            underline: "\u001b[4m",
            yellow   : "\u001b[33m"
        },
        project:string = (function services_project() {
            const dirs:string[] = __dirname.split(sep);
            return dirs.slice(0, dirs.length - 1).join(sep) + sep;
        }()),
        js = `${project}js${sep}`,
        commandList = {
            "build"       : {
                brief: "Run the project's TypeScript build.",
                detail: "Run the project's TypeScript build and produces a single large file for use in the browser.  This command accepts no options.",
                example: "build"
            },
            "commands"    : {
                brief: "Displays a brief list of supported commands or details of a given command.",
                detail: "When no arguments are supplied the command list is printed to console.  Supply a command name as an additional argument to see details and support for additional arguments.",
                example: "commands inventory"
            },
            "help"        : {
                brief: "Displays general information about this application.",
                detail: "Displays general information about this application.  This command accepts no options.",
                example: "help"
            },
            "inventory"   : {
                brief: "List the currently supplied lexers and their language's in language specific logic.",
                detail: "The generated list is computed by scraping the code for the 'options.language' data property.  This means the specified supported languages are languages that demand unique instructions.  Other languages that aren't in this list may also be supported.  This command accepts no options.",
                example: "inventory"
            },
            "parse-array" : {
                brief: "Prints to standard output the parsed data as an object of parallel arrays.",
                detail: "Prints to standard output the parsed data as an object of parallel arrays.  Requires either a code sample or a relative path from the current working directory to a file.",
                example: `parse-array js${sep}example${sep}file.js`
            },
            "parse-object": {
                brief: "Prints to standard output the parsed data as an array of objects.",
                detail: "Prints to standard output the parsed data as an array of objects.  Requires either a code sample or a relative path from the current working directory to a file.",
                example: `parse-object js${sep}example${sep}file.js`
            },
            "parse-table" : {
                brief: "Prints to standard output the parsed data formatted into a grid with ANSI colors.",
                detail: "Prints to standard output the parsed data formatted into a grid with ANSI colors.  Requires either a code sample or a relative path from the current working directory to a file.",
                example: `parse-table js${sep}example${sep}file.js`
            },
            "performance" : {
                brief: "Test a parse operation with nanosecond precision.",
                detail: "Prints to screen a time duration in nanoseconds for a parse operation.  The raw data is acquired by running an initial operation that is discard and then averaging from 10 additional operations.  The time duration is only a measure of the actual parse operation and the timer code.  All other operations, including those related to Node.js aren't included in the timer.  A relative address to a file is required.",
                example: `performance js${sep}example${sep}file.js`
            },
            "server"      : {
                brief: "Starts a web server and opens a web socket channel.",
                detail: "Starts a web server so that TypeScript builds will execute on file updates and the browser tool will automatically refresh upon build completion.  Two consecutive ports are required for this service to work.  The first port is for the webserver and the second port is for a web sockets channel.  A port may be specified as an additional argument.",
                example: "server 3000"
            },
            "testprep": {
                brief: "Produces parsed output for validation test cases.",
                detail: "Produces the object based format of the parsed table in a way that is easier for humans to read and is the format used for validation of stored test cases.",
                example: "testprep test/sample_code/script/jsx_recurse.txt"
            },
            "validation"  : {
                brief: "Runs the validation build.",
                detail: "Runs the validation build that checks for TypeScript build defects, framework schema violations, ESLint rule violations, and finally tests the lexer files against supplied test units.  This command accepts no options.",
                example: "validation"
            },
            "version"     : {
                brief: "Prints a version number to screen.",
                detail: "Prints a version number to screen.  This command accepts no options.",
                example: "version"
            }
        },
        wrap = function services_wrap(input:string, commandlist:number):string {
            if (commandlist + input.length > 80) {
                const chars:string[] = input.split("");
                let len:number = chars.length + commandlist,
                    index:number = 77 - commandlist,
                    lindex:number = 0,
                    length:number = 0;
                
                if (commandlist < 1) {
                    chars.splice(0, 0, " ");
                    chars.splice(0, 0, " ");
                    chars.splice(0, 0, " ");
                    chars.splice(0, 0, " ");
                }

                // outer loop iterates over line segments
                do {
                    // inner loop finds the last space on a line
                    do {
                        if (chars[index] === " ") {
                            chars[index] = "\n   ";
                            if (chars[index + 1] === " ") {
                                chars.splice(index + 1, 1);
                                len = len - 1;
                            }
                            length = commandlist;
                            // applies left padding
                            do {
                                chars[index] = `${chars[index]} `;
                                length = length - 1;
                            } while (length > 0);
                            break;
                        }
                        index = index - 1;
                    } while (index > lindex);
                    index = index + (77 - commandlist);
                    lindex = index - 80;
                } while (index < len);
                return chars.join("");
            }
            return input;
        },
        humantime  = function services_humantime(finished:boolean):string {
            let minuteString:string = "",
                hourString:string   = "",
                secondString:string = "",
                finalTime:string    = "",
                finalMem:string     = "",
                strSplit:string[]     = [],
                minutes:number      = 0,
                hours:number        = 0,
                memory,
                elapsed:number      = (function services_humantime_elapsed():number {
                    const endtime:[number, number] = process.hrtime();
                    let dtime:[number, number] = [endtime[0] - startTime[0], endtime[1] - startTime[1]];
                    if (dtime[1] === 0) {
                        return dtime[0];
                    }
                    if (dtime[1] < 0) {
                        dtime[1] = ((1000000000 + endtime[1]) - startTime[1]);
                    }
                    return dtime[0] + (dtime[1] / 1000000000);
                }());
            const prettybytes  = function services_humantime_prettybytes(an_integer:number):string {
                    //find the string length of input and divide into triplets
                    let output:string = "",
                        length:number  = an_integer
                            .toString()
                            .length;
                    const triples:number = (function services_humantime_prettybytes_triples():number {
                            if (length < 22) {
                                return Math.floor((length - 1) / 3);
                            }
                            //it seems the maximum supported length of integer is 22
                            return 8;
                        }()),
                        //each triplet is worth an exponent of 1024 (2 ^ 10)
                        power:number   = (function services_humantime_prettybytes_power():number {
                            let a = triples - 1,
                                b = 1024;
                            if (triples === 0) {
                                return 0;
                            }
                            if (triples === 1) {
                                return 1024;
                            }
                            do {
                                b = b * 1024;
                                a = a - 1;
                            } while (a > 0);
                            return b;
                        }()),
                        //kilobytes, megabytes, and so forth...
                        unit    = [
                            "",
                            "KB",
                            "MB",
                            "GB",
                            "TB",
                            "PB",
                            "EB",
                            "ZB",
                            "YB"
                        ];

                    if (typeof an_integer !== "number" || Number.isNaN(an_integer) === true || an_integer < 0 || an_integer % 1 > 0) {
                        //input not a positive integer
                        output = "0.00B";
                    } else if (triples === 0) {
                        //input less than 1000
                        output = `${an_integer}B`;
                    } else {
                        //for input greater than 999
                        length = Math.floor((an_integer / power) * 100) / 100;
                        output = length.toFixed(2) + unit[triples];
                    }
                    return output;
                },
                plural       = function services_validate_proctime_plural(x:number, y:string):string {
                    if (x !== 1) {
                        if (y === " second") {
                            return `${secondFix() + y}s `; 
                        }
                        return `${x + y}s `;
                    }
                    return `${x + y} `;
                },
                minute       = function services_validate_proctime_minute():void {
                    minutes      = parseInt((elapsed / 60).toString(), 10);
                    minuteString = (finished === true)
                        ? plural(minutes, " minute")
                        : (minutes < 10)
                            ? `0${minutes}`
                            : String(minutes);
                    minutes      = elapsed - (minutes * 60);
                    secondString = (finished === true)
                        ? (minutes === 1)
                            ? " 1 second "
                            : `${minutes.toFixed(3)} seconds `
                        : minutes.toFixed(3);
                },
                secondFix     = function services_validate_proctime_secondFix():string {
                    strSplit     = String(elapsed).split(".");
                    if (strSplit[1].length < 9) {
                        do {
                            strSplit[1]  = strSplit[1] + 0;
                        } while (strSplit[1].length < 9);
                        return `${strSplit[0]}.${strSplit[1]}`;
                    }
                    if (strSplit[1].length > 9) {
                        return `${strSplit[0]}.${strSplit[1].slice(0, 9)}`;
                    }
                    return String(elapsed);
                };
            memory       = process.memoryUsage();
            finalMem     = prettybytes(memory.rss);

            //last line for additional instructions without bias to the timer
            secondString = secondFix();
            if (elapsed >= 60 && elapsed < 3600) {
                minute();
            } else if (elapsed >= 3600) {
                hours      = parseInt((elapsed / 3600).toString(), 10);
                elapsed    = elapsed - (hours * 3600);
                hourString = (finished === true)
                    ? plural(hours, " hour")
                    : (hours < 10)
                        ? `0${hours}`
                        : String(hours);
                minute();
            } else {
                secondString = (finished === true)
                    ? plural(elapsed, " second")
                    : secondString;
            }
            if (finished === true) {
                finalTime = hourString + minuteString + secondString;
                console.log(`${finalMem} of memory consumed`);
                console.log(`${finalTime}total time`);
                console.log("");
            } else {
                if (hourString === "") {
                    hourString = "00";
                }
                if (minuteString === "") {
                    minuteString = "00";
                }
                if ((/^([0-9]\.)/).test(secondString) === true) {
                    secondString = `0${secondString}`;
                }
                return `${text.cyan}[${hourString}:${minuteString}:${secondString}]${text.none} `;
            }
        },
        errout = function services_errout(message:string):void {
            let stack = new Error().stack;
            console.log("");
            console.log(`${text.angry}Script error${text.none}`);
            console.log("------------");
            if (message === "") {
                console.log(`${text.yellow}No error message supplied${text.none}`);
            } else {
                console.log(message);
            }
            console.log("");
            if (process.platform.toLowerCase() === "win32") {
                stack = stack.replace("Error", `${text.cyan}Stack trace${text.none}\r\n-----------`);
            } else {
                stack = stack.replace("Error", `${text.cyan}Stack trace${text.none}\n-----------`);
            }
            console.log(stack);
            humantime(true);
            process.exit(1);
        },
        alias = function services_alias(comms:string):string {
            if (commandList[comms] !== undefined) {
                return comms;
            }
            if (comms.charAt(0) === "b") {
                return "build";
            }
            if (comms.indexOf("c") === 0) {
                return "commands";
            }
            if (comms.charAt(0) === "i") {
                return "inventory";
            }
            if (comms.indexOf("p") === 0) {
                if (comms.indexOf("pe") === 0) {
                    return "performance";
                }
                if (comms.indexOf("parse-a") === 0) {
                    return "parse-array";
                }
                if (comms.indexOf("parse-o") === 0) {
                    return "parse-object";
                }
                return "parse-table";
            }
            if (comms.indexOf("s") > -1 || comms === "http") {
                return "server";
            }
            if (comms.charAt(0) === "v") {
                if (comms.charAt(1) === "" || comms.charAt(1) === "e") {
                    return "version";
                }
                return "validation";
            }
            return "help";
        },
        validate = function services_validate():void {
            const validation = function services_validate_validation() {
                let next       = function services_validate_validation_next() {
                        let phase = order[0];
                        const complete = function services_validate_validation_complete() {
                                console.log("\u0007");
                                console.log("All tasks complete... Exiting clean!");
                                humantime(true);
                                if (process.argv[1].indexOf("validate.js") > -1) {
                                    process.exit(0);
                                }
                            };
                        if (order.length < orderlen) {
                            console.log("________________________________________________________________________");
                            console.log("");
                        }
                        if (order.length < 1) {
                            return complete();
                        }
                        order.splice(0, 1);
                        phases[phase]();
                    },
                    parse:parse,
                    parse_options:parseOptions = {
                        correct        : false,
                        crlf           : false,
                        language       : "javascript",
                        lexer          : "script",
                        lexerOptions   : {},
                        outputFormat   : "arrays",
                        source         : "",
                        wrap           : 0
                    },
                    framework:parseFramework;
                const order      = [
                        "lint", //       - run eslint on all unexcluded JS files in the repo
                        "framework", //  - test the framework
                        "codeunits" //   - test the lexers
                    ],
                    orderlen:number   = order.length,
                    phases     = {
                        codeunits: function services_validate_validation_coreunits():void {
                            const files  = {
                                    code  : [],
                                    parsed: []
                                },
                                count  = {
                                    code  : 0,
                                    lexer : 0,
                                    parsed: 0
                                },
                                total  = {
                                    code  : 0,
                                    lexer : 0,
                                    parsed: 0
                                },
                                lexers:string[] = Object.keys(framework.lexer),
                                compare = function services_validate_validation_coreunits_compare():void {
                                    let len:number       = (files.code.length > files.parsed.length)
                                            ? files.code.length
                                            : files.parsed.length,
                                        lang:languageAuto,
                                        a:number         = 0,
                                        str:string       = "",
                                        outputObjects:recordList,
                                        filecount:number = 0,
                                        currentlex:string = "";
                                    const lexer     = function services_validate_validation_coreunits_compare_lexer():void {
                                            const lex:string = files.code[a][0].slice(0, files.code[a][0].indexOf(sep));
                                            console.log("");
                                            console.log(`Tests for lexer - ${text.cyan + lex + text.none}`);
                                            currentlex = lex;
                                        },
                                        comparePass = function services_validate_validation_coreunits_compare_comparePass():void {
                                            filecount = filecount + 1;
                                            console.log(`${humantime(false) + text.green}Pass ${filecount}:${text.none} ${files.parsed[a][0].replace(currentlex + sep, "")}`);
                                            if (a === len - 1) {
                                                console.log("");
                                                console.log(`${text.green}Test units evaluated without failure!${text.none}`);
                                                return next();
                                            }
                                        },
                                        diffFiles  = function services_validate_validation_coreunits_compare_diffFiles(sampleName:string, sampleSource:recordList, sampleDiff:recordList):boolean {
                                            let plus:string   = "",
                                                plural:string = "",
                                                report:[string, number, number],
                                                total:number  = 0;
                                            const diffview = require(`${project}test${sep}diffview.js`),
                                                beautify = function services_validate_validation_coreunits_compare_beautify(item:recordList) {
                                                    const outputString:string[] = ["["],
                                                        len:number = item.length - 1;
                                                    let x:number = 0;
                                                    if (len > 0) {
                                                        do {
                                                            outputString.push(`${JSON.stringify(item[x])},`);
                                                            x = x + 1;
                                                        } while (x < len);
                                                    }
                                                    outputString.push(JSON.stringify(item[len]));
                                                    outputString.push("]");
                                                    return outputString.join(node.os.EOL);
                                                },
                                                diff_options = {
                                                    context: 2,
                                                    diff: beautify(sampleDiff),
                                                    diff_cli: true,
                                                    language: "text",
                                                    mode: "diff",
                                                    source: beautify(sampleSource)
                                                };
                                            report          = diffview(diff_options);
                                            total           = report[1];
                                            if (total > 50) {
                                                plus = "+";
                                            }
                                            if (total !== 1) {
                                                plural = "s";
                                            }
                                            if (total < 1) {
                                                comparePass();
                                                return false;
                                            }
                                            console.log(`${humantime(false) + text.angry}Fail ${filecount + 1}:${text.none} ${files.parsed[a][0].replace(currentlex + sep, "")}`);
                                            console.log("");
                                            console.log(`${text.red}Red${text.none} = Generated from raw code file`);
                                            console.log(`${text.green}Green${text.none} = Control code from parsed file`);
                                            console.log(report[0]);
                                            console.log("");
                                            console.log(`${total + plus} ${text.green}difference${plural} counted.${text.none}`);
                                            errout(`Pretty Diff ${text.angry}failed${text.none} on file: ${text.cyan + sampleName + text.none}`);
                                            return true;
                                        };
                                    files.code   = parse.safeSort(files.code, "ascend", false);
                                    files.parsed = parse.safeSort(files.parsed, "ascend", false);
                                    lexer();
                                    do {
                                        if (files.code[a][0].indexOf(currentlex) !== 0) {
                                            lexer();
                                        }
                                        if (files.code[a] === undefined || files.parsed[a] === undefined) {
                                            if (files.code[a] === undefined) {
                                                console.log(`${text.yellow}samples_code directory is missing file:${text.none} ${files.parsed[a][0]}`);
                                                files.parsed.splice(a, 1);
                                            } else {
                                                console.log(`${text.yellow}samples_parse directory is missing file:${text.none} ${files.code[a][0]}`);
                                                files.code.splice(a, 1);
                                            }
                                            len = (files.code.length > files.parsed.length)
                                                ? files.code.length
                                                : files.parsed.length;
                                            a   = a - 1;
                                        } else if (files.code[a][0] === files.parsed[a][0]) {
                                            if (files.parsed[a][1] === "") {
                                                console.log(`${text.angry}Parsed file is empty:${text.none} ${files.parsed[a][0]}`);
                                            } else if (files.code[a][1] === "") {
                                                console.log(`${text.angry}Code file is empty:${text.none} ${files.code[a][0]}`);
                                            } else {
                                                if ((/_correct(\.|_|-)/).test(files.code[a][0]) === true) {
                                                    if ((/_correct-/).test(files.code[a][0]) === true) {
                                                        if ((/_correct-false/).test(files.code[a][0]) === true) {
                                                            parse_options.correct = false;
                                                        } else {
                                                            parse_options.correct = true;
                                                        }
                                                    } else {
                                                        parse_options.correct = true;
                                                    }
                                                } else {
                                                    parse_options.correct = false;
                                                }
                                                if ((/_noleadzero(\.|_|-)/).test(files.code[a][0]) === true) {
                                                    if ((/_noleadzero-/).test(files.code[a][0]) === true) {
                                                        if ((/_noleadzero-false/).test(files.code[a][0]) === true) {
                                                            parse_options.lexerOptions.style.no_lead_zero = false;
                                                        } else {
                                                            parse_options.lexerOptions.style.no_lead_zero = true;
                                                        }
                                                    } else {
                                                        parse_options.lexerOptions.style.no_lead_zero = true;
                                                    }
                                                } else {
                                                    parse_options.lexerOptions.style.no_lead_zero = false;
                                                }
                                                if ((/_quoteConvert-/).test(files.code[a][0]) === true) {
                                                    if ((/_quoteConvert-double/).test(files.code[a][0]) === true) {
                                                        parse_options.lexerOptions.style.quote_convert = "double";
                                                        parse_options.lexerOptions.script.quote_convert = "double";
                                                    } else if ((/_quoteConvert-single/).test(files.code[a][0]) === true) {
                                                        parse_options.lexerOptions.style.quote_convert = "single";
                                                        parse_options.lexerOptions.script.quote_convert = "single";
                                                    } else {
                                                        parse_options.lexerOptions.style.quote_convert = "none";
                                                        parse_options.lexerOptions.script.quote_convert = "none";
                                                    }
                                                } else {
                                                    parse_options.lexerOptions.style.quote_convert = "none";
                                                    parse_options.lexerOptions.script.quote_convert = "none";
                                                }
                                                if ((/_objectSort(\.|_|-)/).test(files.code[a][0]) === true) {
                                                    if ((/_objectSort-/).test(files.code[a][0]) === true) {
                                                        if ((/_objectSort-false/).test(files.code[a][0]) === true) {
                                                            parse_options.lexerOptions.style.objectSort = false;
                                                            parse_options.lexerOptions.script.objectSort = false;
                                                        } else {
                                                            parse_options.lexerOptions.style.objectSort = true;
                                                            parse_options.lexerOptions.script.objectSort = true;
                                                        }
                                                    } else {
                                                        parse_options.lexerOptions.style.objectSort = true;
                                                        parse_options.lexerOptions.script.objectSort = true;
                                                    }
                                                } else {
                                                    parse_options.lexerOptions.style.objectSort = false;
                                                    parse_options.lexerOptions.script.objectSort = false;
                                                }
                                                if ((/_tagSort(\.|_|-)/).test(files.code[a][0]) === true) {
                                                    if ((/_tagSort-/).test(files.code[a][0]) === true) {
                                                        if ((/_tagSort-false/).test(files.code[a][0]) === true) {
                                                            parse_options.lexerOptions.markup.tagSort = false;
                                                        } else {
                                                            parse_options.lexerOptions.markup.tagSort = true;
                                                        }
                                                    } else {
                                                        parse_options.lexerOptions.markup.tagSort = true;
                                                    }
                                                } else {
                                                    parse_options.lexerOptions.markup.tagSort = false;
                                                }
                                                if ((/_wrap-\d+(\.|_)/).test(files.code[a][0]) === true) {
                                                    let wrap:string = files.code[a][0].slice(files.code[a][0].indexOf("_wrap-") + 6),
                                                        numb:number = 0;
                                                    do {
                                                        numb = numb + 1;
                                                    } while ((/\d/).test(wrap.charAt(numb)) === true);
                                                    wrap = wrap.slice(0, numb);
                                                    if (isNaN(Number(wrap)) === false) {
                                                        parse_options.wrap = Number(wrap);
                                                    }
                                                } else {
                                                    parse_options.wrap = 0;
                                                }
                                                lang = framework.language.auto(files.code[a][1], "javascript");
                                                if ((/_lang-\w+(\.|_)/).test(files.code[a][0]) === true) {
                                                    parse_options.language = files.code[a][0].split("_lang-")[1];
                                                    if (parse_options.language.indexOf("_") > 0) {
                                                        parse_options.language = parse_options.language.split("_")[0];
                                                    } else {
                                                        parse_options.language = parse_options.language.split(".")[0];
                                                    }
                                                } else {
                                                    parse_options.language = lang[0];
                                                }
                                                parse_options.source = files.code[a][1];
                                                parse_options.lexer  = currentlex;
                                                outputObjects        = framework.parserObjects(parse_options);
                                                str                  = (framework.parseerror === "")
                                                    ? JSON.stringify(outputObjects)
                                                    : framework.parseerror;
                                                if (str === files.parsed[a][1]) {
                                                    comparePass();
                                                } else {
                                                    if (diffFiles(files.parsed[a][0], outputObjects, JSON.parse(files.parsed[a][1])) === true) {
                                                        return;
                                                    }
                                                }
                                            }
                                        } else {
                                            if (files.code[a][0] < files.parsed[a][0]) {
                                                console.log(`${text.yellow}Parsed samples directory is missing file:${text.none} ${files.code[a][0]}`);
                                                files.code.splice(a, 1);
                                            } else {
                                                console.log(`${text.yellow}Code samples directory is missing file:${text.none} ${files.parsed[a][0]}`);
                                                files.parsed.splice(a, 1);
                                            }
                                            len = (files.code.length > files.parsed.length)
                                                ? files.code.length
                                                : files.parsed.length;
                                            a   = a - 1;
                                            if (a === len - 1) {
                                                console.log("");
                                                console.log(`${text.green}Test units evaluated without failure!${text.none}`);
                                                return next();
                                            }
                                        }
                                        a = a + 1;
                                    } while (a < len);
                                },
                                readDir = function services_validate_validation_coreunits_readDir(type:string, lexer:string):void {
                                    const dirpath:string = `${project}test${sep}samples_${type + sep + lexer + sep}`;
                                    node.fs.readdir(dirpath, function services_validate_validation_coreunits_readDir_callback(err, list) {
                                        if (err !== null) {
                                            if (err.toString().indexOf("no such file or directory") > 0) {
                                                return errout(`The directory ${dirpath} ${text.angry}doesn't exist${text.none}. Provide the necessary test samples for ${text.cyan + lexer + text.none}.`);
                                            }
                                            console.log(`Error reading from directory ${dirpath}`);
                                            return errout(err);
                                        }
                                        if (list === undefined) {
                                            if (total[type] === 0) {
                                                return errout(`No files of type ${type} for lexer ${lexer}.`);
                                            }
                                            return errout(`undefined returned when reading files from ${dirpath}`);
                                        }
                                        const pusher = function services_validate_validation_coreunits_readDir_callback_pusher(val) {
                                            node.fs.readFile(
                                                dirpath + val,
                                                "utf8",
                                                function services_validate_validation_coreunits_readDir_callback_pusher_readFile(erra, fileData) {
                                                    count[type] = count[type] + 1;
                                                    if (erra !== null && erra !== undefined) {
                                                        errout(`Error reading file: ${project}test${sep}samples_${type + sep + lexer + sep + val}`);
                                                    } else {
                                                        files[type].push([lexer + sep + val, fileData]);
                                                    }
                                                    if (count.lexer === total.lexer && count.code === total.code && count.parsed === total.parsed) {
                                                        compare();
                                                    }
                                                }
                                            );
                                        };
                                        total[type] = total[type] + list.length;
                                        if (err !== null) {
                                            errout(`Error reading from directory: ${dirpath}`);
                                        }
                                        if (list.length === 0 && count.lexer === total.lexer && count.code === total.code && count.parsed === total.parsed) {
                                            compare();
                                        } else {
                                            list.forEach(pusher);
                                        }
                                    });
                                };
                            console.log(`${text.cyan}Core Unit Testing${text.none}`);
                            total.lexer = lexers.length;
                            lexers.forEach(function services_validate_validation_coreunits_lexers(value:string) {
                                count.lexer = count.lexer + 1;
                                readDir("code", value);
                                readDir("parsed", value);
                            });
                        },
                        framework: function services_validate_validation_framework() {
                            let keys    = [],
                                keysort = "";
                            const keylist = "concat,count,data,datanames,lineNumber,linesSpace,objectSort,parseOptions,pop,push,safeSort,spacer,splice,structure,wrapCommentBlock,wrapCommentLine";
                            console.log(`${text.cyan}Framework Testing${text.none}`);
                            console.log("");
                            framework.parserArrays({
                                correct        : false,
                                crlf           : false,
                                language       : "html",
                                lexer          : "markup",
                                lexerOptions   : {},
                                outputFormat   : "objects",
                                source         : "",
                                wrap           : 0
                            });
                            keys = Object.keys(parse);
                            keysort = parse.safeSort(keys, "ascend", false).join();
                            if (keysort !== keylist) {
                                console.log(`${text.cyan}Expected Keys${text.none}`);
                                console.log(keylist);
                                console.log(`${text.cyan}Actual Keys${text.none}`);
                                console.log(keysort);
                                return errout(`${text.angry}Parse framework failure:${text.none} The "parse" object does not match the known list of required properties.`);
                            }
                            console.log(`${humantime(false) + text.green}Object parse contains only the standard properties.${text.none}`);
                            
                            if (typeof parse.concat !== "function" || parse.concat.name !== "parse_concat") {
                                return errout(`${text.angry}Parse framework failure:${text.none} parse.concat does not point to the function named parse_concat.`);
                            }
                            console.log(`${humantime(false) + text.green}parse.concat points to function parse_concat.${text.none}`);
                            
                            if (parse.count !== -1) {
                                return errout(`${text.angry}Parse framework failure:${text.none} The default for parse.count isn't -1 or type number.`);
                            }
                            console.log(`${humantime(false) + text.green}parse.count has default value of -1 and type number.${text.none}`);
                            
                            if (
                                typeof parse.data !== "object" || JSON.stringify(parse.data) !== "{\"begin\":[],\"lexer\":[],\"lines\":[],\"presv\":[],\"stack\":[],\"token\":[],\"types\":[]}"
                            ) {
                                return errout(`${text.angry}Parse framework failure: parse.data does not contain the properties as defined by parse.datanames or their values aren't empty arrays.${text.none} `);
                            }
                            console.log(`${humantime(false) + text.green}parse.data contains properties as defined by parse.datanames and each is an empty array.${text.none}`);
                            
                            if (JSON.stringify(parse.datanames) !== "[\"begin\",\"lexer\",\"lines\",\"presv\",\"stack\",\"token\",\"types\"]") {
                                return errout(`${text.angry}Parse framework failure: parse.datanames does not contain the values: 'begin', 'lexer', 'lines', 'presv', 'stack', 'token', and 'types'.${text.none} `);
                            }
                            console.log(`${humantime(false) + text.green}parse.datanames contains only the data field names.${text.none}`);
            
                            if (parse.lineNumber !== 1) {
                                return errout("${text.angry}Parse framework failure: parse.lineNumber does not have a default value of 1 or type number.${text.none} ");
                            }
                            console.log(`${humantime(false) + text.green}parse.lineNumber has a default value of 1 and type number.${text.none}`);
                            
                            // The correct default for linesSpace is 0
                            // but the default is changed by the source of empty string.
                            if (parse.linesSpace !== 1) {
                                return errout(`${text.angry}Parse framework failure: parse.linesSpace does not have a default value of 1 or type number.${text.none} `);
                            }
                            console.log(`${humantime(false) + text.green}parse.linesSpace has a default value of 0 and type number.${text.none}`);
                            
                            if (typeof parse.objectSort !== "function" || parse.objectSort.name !== "parse_objectSort") {
                                return errout(`${text.angry}Parse framework failure: parse.objectSort is not assigned to named function parse_objectSort${text.none} `);
                            }
                            console.log(`${humantime(false) + text.green}parse.objectSort is assigned to named function parse_objectSort${text.none}`);
                            
                            if (typeof parse.pop !== "function" || parse.pop.name !== "parse_pop") {
                                return errout(`${text.angry}Parse framework failure: parse.pop is not assigned to named function parse_pop${text.none} `);
                            }
                            console.log(`${humantime(false) + text.green}parse.pop is assigned to named function parse_pop${text.none}`);
                            
                            if (typeof parse.push !== "function" || parse.push.name !== "parse_push") {
                                return errout(`${text.angry}Parse framework failure: parse.push is not assigned to named function parse_push${text.none} `);
                            }
                            console.log(`${humantime(false) + text.green}parse.push is assigned to named function parse_push${text.none}`);
                            
                            if (parse.push.toString().indexOf("parse.structure.push([structure, parse.count])") < 0 || parse.push.toString().indexOf("parse.structure.pop") < 0) {
                                return errout(`${text.angry}Parse framework failure: parse.push does not regulate parse.structure${text.none} `);
                            }
                            console.log(`${humantime(false) + text.green}parse.push contains references to push and pop parse.structure${text.none}`);
            
                            if (typeof parse.safeSort !== "function" || parse.safeSort.name !== "parse_safeSort") {
                                return errout(`${text.angry}Parse framework failure: parse.safeSort is not assigned to named function parse_safeSort${text.none} `);
                            }
                            console.log(`${humantime(false) + text.green}parse.safeSort is assigned to named function parse_safeSort${text.none}`);
                            
                            if (typeof parse.spacer !== "function" || parse.spacer.name !== "parse_spacer") {
                                return errout(`${text.angry}Parse framework failure: parse.spacer is not assigned to named function parse_spacer${text.none} `);
                            }
                            console.log(`${humantime(false) + text.green}parse.spacer is assigned to named function parse_spacer${text.none}`);
                            
                            if (typeof parse.splice !== "function" || parse.splice.name !== "parse_splice") {
                                return errout(`${text.angry}Parse framework failure: parse.splice is not assigned to named function parse_splice${text.none} `);
                            }
                            console.log(`${humantime(false) + text.green}parse.splice is assigned to named function parse_splice${text.none}`);
            
                            if (Array.isArray(parse.structure) === false || parse.structure.length !== 1 || Array.isArray(parse.structure[0]) === false || parse.structure[0][0] !== "global" || parse.structure[0][1] !== -1) {
                                return errout(`${text.angry}Parse framework failure: parse.structure is not assigned the default [["global", -1]]${text.none} `);
                            }
                            console.log(`${humantime(false) + text.green}parse.structure is assigned the default of [["global", -1]]${text.none}`);
            
                            if (parse.structure.pop.name !== "parse_structure_pop") {
                                return errout(`${text.angry}Parse framework failure: parse.structure does not have a custom 'pop' method.${text.none} `);
                            }
                            console.log(`${humantime(false) + text.green}parse.structure does have a custom 'pop' method.${text.none}`);

                            console.log("");
                            console.log(`${text.green}Framework testing complete!${text.none}`);
                            return next();
                        },
                        lint     : function services_validate_validation_lint() {
                            const ignoreDirectory = [
                                    ".git",
                                    ".vscode",
                                    "bin",
                                    "coverage",
                                    "guide",
                                    "ignore",
                                    "node_modules",
                                    "test"
                                ],
                                files:string[]           = [],
                                lintrun         = function services_validate_validation_lint_lintrun() {
                                    let filesCount:number = 0;
                                    const filesTotal = files.length,
                                        lintit = function services_validate_validation_lint_lintrun_lintit(val:string):void {
                                            node.child(`eslint ${val}`, {
                                                cwd: project
                                            }, function services_validate_validation_lint_lintrun_lintit_eslint(err, stdout, stderr) {
                                                if (stdout === "" || stdout.indexOf("0:0  warning  File ignored because of a matching ignore pattern.") > -1) {
                                                    if (err !== null) {
                                                        errout(err);
                                                        return;
                                                    }
                                                    if (stderr !== null && stderr !== "") {
                                                        errout(stderr);
                                                        return;
                                                    }
                                                    filesCount = filesCount + 1;
                                                    console.log(`${humantime(false) + text.green}Lint passed:${text.none} ${val}`);
                                                    if (filesCount === filesTotal) {
                                                        console.log("");
                                                        console.log(`${text.green}Lint complete!${text.none}`);
                                                        next();
                                                        return;
                                                    }
                                                } else {
                                                    console.log(stdout);
                                                    errout("Lint failure.");
                                                    return;
                                                }
                                            })
                                        };
                                    files.forEach(lintit);
                                };
                            console.log(`${text.cyan}Beautifying and Linting${text.none}`);
                            console.log("");
                            (function services_validate_validation_lint_getFiles():void {
                                let total:number    = 1,
                                    count:number    = 0;
                                const idLen:number    = ignoreDirectory.length,
                                    readDir  = function services_validate_validation_lint_getFiles_readDir(filepath:string):void {
                                        node.fs.readdir(
                                            filepath,
                                            function services_validate_validation_lint_getFiles_readDir_callback(erra, list) {
                                                const fileEval = function services_validate_validation_lint_getFiles_readDir_callback_fileEval(val:string):void {
                                                    const filename:string = filepath + sep + val;
                                                    node.fs.stat(
                                                        filename,
                                                        function services_validate_validation_lint_getFiles_readDir_callback_fileEval_stat(errb, stat) {
                                                            let a:number         = 0,
                                                                ignoreDir:boolean = false;
                                                            const dirtest:string   = `${filepath.replace(/\\/g, "/")}/${val}`;
                                                            if (errb !== null) {
                                                                return errout(errb);
                                                            }
                                                            count = count + 1;
                                                            if (stat.isFile() === true && (/(\.js)$/).test(val) === true) {
                                                                files.push(filename);
                                                            }
                                                            if (stat.isDirectory() === true) {
                                                                do {
                                                                    if (dirtest.indexOf(ignoreDirectory[a]) === dirtest.length - ignoreDirectory[a].length) {
                                                                        ignoreDir = true;
                                                                        break;
                                                                    }
                                                                    a = a + 1;
                                                                } while (a < idLen);
                                                                if (ignoreDir === true) {
                                                                    if (count === total) {
                                                                        lintrun();
                                                                    }
                                                                } else {
                                                                    total = total + 1;
                                                                    services_validate_validation_lint_getFiles_readDir(filename);
                                                                }
                                                            } else if (count === total) {
                                                                lintrun();
                                                            }
                                                        }
                                                    );
                                                };
                                                if (erra !== null) {
                                                    return errout(`Error reading path: ${filepath}\n${erra}`);
                                                }
                                                total = total + list.length - 1;
                                                list.forEach(fileEval);
                                            }
                                        );
                                    };
                                readDir(`${project}`);
                            }());
                        }
                    };
            
                require(`${project}js${sep}parse.js`);
                require(`${project}js${sep}language.js`);
                framework = global.parseFramework;
                framework.lexer      = {};
                framework.parseerror = "";
                parse             = framework.parse;
                require(`${project}js${sep}lexers${sep}all.js`)(parse_options);
                next();
                return "";
            };
            console.log("");
            console.log("Parse Framework - Validation Tasks");
            console.log("");
            validation();
        },
        server = function services_server():void {
            let ws:any,
                timeStore:number = 0;
            const socket   = require("ws"),
                cwd      = process.cwd(),
                port:number = (process.argv[2] === undefined)
                    ? 9999
                    : Number(process.argv[2]),
                serverError = function services_server_serverError(error) {
                    if (error.code === "EADDRINUSE") {
                        if (error.port === port + 1) {
                            console.log(`${text.angry}Error:${text.none} Web socket channel port, ${text.cyan + port + text.none}, is in use!  The web socket channel is 1 higher than the port designated for the HTTP server.`);
                        } else {
                            console.log(`${text.angry}Error:${text.none} Specified port, ${text.cyan + port + text.none}, is in use!`);
                        }
                    } else {
                        console.log(`${text.angry}Error:${text.none} ${error.Error}`);
                    }
                    return process.exit(1);
                },
                server   = node.http.createServer(function services_server_create(request, response):void {
                    let quest:number = request.url.indexOf("?"),
                        uri:string = (quest > 0)
                            ? request.url.slice(0, quest)
                            : request.url,
                        file:string = project + sep + uri.slice(1);
                    if (uri === "/") {
                        file = `${project + sep}runtimes${sep}browsertest.xhtml`;
                    }
                    if (request.url.indexOf("favicon.ico") < 0) {
                        node.fs.readFile(file, "utf8", function services_server_create_readFile(err, data):void {
                            if (err !== undefined && err !== null) {
                                if (err.toString().indexOf("no such file or directory") > 0) {
                                    response.writeHead(404, {"Content-Type": "text/plain"});
                                    if (file.indexOf("apple-touch") < 0 && file.indexOf("favicon") < 0) {
                                        console.log(`${text.angry}404${text.none} for ${file.replace(/\/|\\/g, sep)}`);
                                    }
                                    return;
                                }
                                response.write(JSON.stringify(err));
                                console.log(err);
                                return;
                            }
                            if (file.indexOf(".js") === file.length - 3) {
                                response.writeHead(200, {"Content-Type": "application/javascript"});
                            } else if (file.indexOf(".css") === file.length - 4) {
                                response.writeHead(200, {"Content-Type": "text/css"});
                            } else if (file.indexOf(".xhtml") === file.length - 6) {
                                response.writeHead(200, {"Content-Type": "application/xhtml+xml"});
                            }
                            response.write(data);
                            response.end();
                            //console.log(`Responded with ${file}`);
                        });
                    } else {
                        response.end();
                    }
                });
            if (isNaN(port) === true) {
                console.log(`${text.angry}Error:${text.none} Specified port is, ${port}, which not a number!`);
                return process.exit(1);
            }
            if (cwd.indexOf("parse-framework") < cwd.length - 15) {
                process.chdir(cwd.slice(0, cwd.indexOf("parse-framework") + 15));
            }
            ws = new socket.Server({port: port + 1});
            ws.broadcast = function socket_broadcast(data:string):void {
                ws.clients.forEach(function socket_broadcast_clients(client):void {
                    if (client.readyState === socket.OPEN) {
                        client.send(data);
                    }
                });
            };
            console.log(`HTTP server is up at: ${text.cyan}http://localhost:${port + text.none}`);
            console.log(`${text.green}Starting web server and file system watcher!${text.none}`);
            console.log("");
            node.fs.watch(project, {
                recursive: true
            }, function services_server_watch(type, filename:string):void {
                if (filename.indexOf(".git") === 0) {
                    return;
                }
                if (filename.indexOf("node_modules") === 0) {
                    return;
                }
                if (filename.indexOf("js") === 0) {
                    return;
                }
                if (filename.indexOf(`test${sep}samples_code`) === 0) {
                    return;
                }
                const extension:string = (function services_server_watch_extension() {
                        const list = filename.split(".");
                        return list[list.length - 1];
                    }());
                if (timeStore < Date.now() - 2000) {
                    let st:[number, number] = process.hrtime();
                    timeStore = Date.now();
                    startTime[0] = st[0];
                    startTime[1] = st[1];
                    if (extension === "ts") {
                        console.log(`${humantime(false)}Compiling TypeScript for ${text.green + filename + text.none}`);
                        action.build(function services_server_watch_reload():void {
                            ws.broadcast("reload");
                        });
                    } else if (extension === "css" || extension === "xhtml" || extension === "js") {
                        console.log(`${humantime(false)}Refreshing browser tab(s) - ${text.green + filename + text.none}`);
                        ws.broadcast("reload");
                        console.log("\u0007");
                    } else if (extension === "txt" && filename.indexOf("samples_parsed") > -1) {
                        console.log(`${humantime(false)}Running validation build`);
                        validate();
                    }
                }
            });
            server.on("error", serverError);
            server.listen(port);
        },
        action = {
            build: function services_action_build(callback?:Function):void {
                if (command !== "server") {
                    console.log("");
                }
                console.log(`${humantime(false)}Running TypeScript build`);
                node.child("tsc --pretty", {
                    cwd: project.slice(0, project.length - 1)
                }, function services_action_build_callback(err, stdout, stderr):void {
                    if (err !== null) {
                        return errout(err);
                    }
                    if (stderr !== null && stderr !== "") {
                        return errout(stderr);
                    }
                    let output:string = "window.parseFramework={language:function framework_language(){\"use strict\";return;},lexer:{},parse:{},parseerror:\"\",parser:function framework_parser(){\"use strict\";return;}};",
                        outputa:string = "";
                    node.fs.readFile(`${js}parse.js`, {
                        encoding: "utf8"
                    }, function services_action_build_callback_parse(errp, datap) {
                        if (errp !== null) {
                            return errout(errp);
                        }
                        datap = datap
                            .replace(/#!\/usr\/bin\/env\s+node\s+/, "")
                            .replace(/global\.parseFramework/g, "window.parseFramework");
                        datap = `${datap.slice(0, datap.indexOf("global.") - 4)}}());`;
                        output = output + datap;
                        outputa = output;
                        node.fs.readdir(`${js}lexers`, function services_action_build_callback_parse_lexers(errf, files) {
                            if (errf !== null) {
                                return errout(errf);
                            }
                            files.splice(files.indexOf("all.js"), 1);
                            files.forEach(function services_action_build_callback_parse_lexers_each(value, index, array) {
                                array[index] = `${js}lexers${sep + value}`;
                            });
                            files.push(`${js}language.js`);
                            let a = files.length,
                                b = 0,
                                c = a;
                            do {
                                node.fs.readFile(files[b], {
                                    encoding: "utf8"
                                }, function services_action_build_callback_parse_lexers_each_files(errx, filex) {
                                    if (errx !== null) {
                                        return errout(errx);
                                    }
                                    output = output + filex;
                                    c = c - 1;
                                    if (c < 1) {
                                        node.fs.writeFile(
                                            `${js}browser.js`,
                                            output.replace(/global\.parseFramework/g, "window.parseFramework"),
                                            function services_action_build_callback_parse_lexers_each_files_write(errb) {
                                                if (errb !== null) {
                                                    return errout(errb);
                                                }
                                            }
                                        );
                                        node.fs.readFile(`${js}runtimes${sep}browsertest.js`, {
                                            encoding: "utf8"
                                        }, function services_action_build_callback_parse_lexers_each_files_web(errw, filew) {
                                            if (errw !== null) {
                                                return errout(errw);
                                            }
                                            outputa = output + filew;
                                            outputa = outputa.replace(/global\.parseFramework/g, "window.parseFramework");
                                            node.fs.writeFile(`${js}browsertest.js`, outputa, function services_action_build_callback_parse_lexers_each_files_web_write(erro) {
                                                if (erro !== null) {
                                                    return errout(erro);
                                                }
                                                console.log(`${humantime(false)}Total compile time`);
                                                console.log("\u0007");
                                                if (typeof callback === "function") {
                                                    callback();
                                                }
                                            });
                                        });
                                    }
                                });
                                if (files[b].indexOf("lexers") > 0) {
                                    outputa = `${outputa}window.parseFramework.parse.parseOptions.lexerOptions.${files[b].replace(`${js}lexers${sep}`, "").replace(".js", "")}={};`
                                }
                                b = b + 1;
                            } while (b < a);
                        });
                    });
                });
            },
            commands: function services_action_commands():void {
                let longest:number = 0;
                
                console.log("");
                if (commandList[args[1]] === undefined) {
                    keys.forEach(function services_action_commands_longest(value):void {
                        if (value.length > longest) {
                            longest = value.length;
                        }
                    });
                    keys.forEach(function services_action_commands_output(value):void {
                        const output:string[] = [`${text.angry}*${text.none} ${text.green}`];
                        let length:number = value.length;
                        output.push(value);
                        output.push(text.none);
                        if (length < longest) {
                            do {
                                output.push(" ");
                                length = length + 1;
                            } while (length < longest);
                        } else {
                            length = longest;
                        }
                        output.push(" ");
                        output.push(wrap(commandList[value].brief, longest));
                        console.log(output.join(""));
                    });
                    console.log("");
                    console.log("Examples:");
                    console.log(`${text.cyan}node js${sep}services commands server${text.none}`);
                    console.log(`${text.cyan}node js${sep}services version${text.none}`);
                    console.log(`${text.cyan}node js${sep}services parse-table js/parse.js${text.none}`);
                    console.log(`${text.cyan}node js${sep}services server 3000${text.none}`);
                } else {
                    console.log(`${text.underline + args[1] + text.none}`);
                    console.log("");
                    console.log(wrap(commandList[args[1]].detail, longest));
                    console.log("");
                    console.log("Example");
                    console.log(`${text.cyan}node js${sep}services ${commandList[args[1]].example + text.none}`);
                }
                console.log("");
            },
            help: function services_action_help():void {
                console.log("");
                console.log("");
                console.log(`Thank you for experimenting with the ${text.underline}Unibeautify Parse-Framework${text.none} ${text.green + version + text.none} in Node.js`);
                console.log("");
                console.log(`${text.angry}*${text.none} For a list of commands please try: ${text.cyan}node js/service commands${text.none}`);
                console.log(`${text.angry}*${text.none} For a description of the project please read the readme.md document.`);
                console.log(`${text.angry}*${text.none} For project status please visit https://github.com/Unibeautify/parse-framework`);
                console.log(`${text.angry}*${text.none} For standard output of parse data please try: ${text.cyan}node js/service parse-table path/to/file${text.none}`);
                console.log(`    or ${text.cyan}node js/service parse-table code${text.none}`);
                console.log(`${text.angry}*${text.none} For raw unformatted parser output try: ${text.cyan}node js/service parse-array path/to/file${text.none}`);
                console.log(`    or ${text.cyan}node js/service parse-array code${text.none}`);
                console.log(`    or ${text.cyan}node js/service parse-object path/to/file${text.none}`);
                console.log(`    or ${text.cyan}node js/service parse-object code${text.none}`);
                console.log("");
                console.log(`${text.underline}About${text.none}`);
                console.log("The goal is to provide a framework for plug-and-play rules that parse");
                console.log("various languages with output in the same universal format for use by");
                console.log("any application.  To examine the supplied language rules browse the");
                console.log("code in the 'lexers' directory.");
                console.log("");
                console.log(`${text.angry}https://github.com/Unibeautify/parse-framework${text.none}`);
                console.log("");
            },
            inventory: function services_action_inventory():void {
                console.log(`${text.underline}Inventory of mentioned languages${text.none}`);
                console.log("");
                console.log(wrap("A list of supplied lexers and their various dedicated language support as indicated through use of logic with 'options.language'. Other languages may be supported without dedicated logic.", 0));
                node.fs.readdir(`${project}lexers`, function services_action_inventory_readdir(err, files) {
                    if (err !== null) {
                        return errout(err);
                    }
                    const langs = {};
                    let index:number = files.length;
                    do {
                        index = index - 1;
                        if (files[index].indexOf(".ts") !== files[index].length - 3) {
                            files.splice(index, 1);
                            index = index + 1;
                        }
                    } while (index > 0);
                    files.forEach(function services_action_inventory_readdir_each(filename) {
                        node.fs.readFile(`${project}lexers${sep + filename}`, {
                            encoding: "utf8"
                        }, function services_action_inventory_readdir_each_readfile(errf, filedata) {
                            if (errf !== null) {
                                return errout(errf);
                            }
                            langs[filename] = {
                                keys: [],
                                values: {}
                            };
                            const fragments:string[] = filedata.replace(/options\.language\s*(((!|=)==)|=)\s*/g, "options.language===").split("options.language===");
                            if (fragments.length > 1) {
                                fragments.forEach(function services_action_inventory_readdir_each_readfile_fragments(value) {
                                    if (value.charAt(0) === "\"" || value.charAt(0) === "'") {
                                        let quote:string = value.charAt(0);
                                        value = value.slice(1);
                                        value = value.slice(0, value.indexOf(quote));
                                        langs[filename].values[value] = "";
                                    }
                                });
                                langs[filename].keys = Object.keys(langs[filename].values);
                            }
                            index = index + 1;
                            if (index === files.length) {
                                const keys = Object.keys(langs).sort();
                                console.log("");
                                keys.forEach(function services_action_inventory_readdir_each_readfile_output(value) {
                                    console.log(`${text.angry}*${text.none} ${text.green + value + text.none}`);
                                    if (langs[value].keys.length > 0) {
                                        langs[value].keys.sort();
                                        langs[value].keys.forEach(function services_action_inventory_readdir_each_readfile_output_dedicated(dedval) {
                                            console.log(`   ${text.angry}-${text.none} ${dedval}`);
                                        });
                                    }
                                });
                                console.log("");
                            }
                        });
                    });
                });
            },
            parse: function services_action_parse():void {
                const nodetest = require(`${js}runtimes${sep}nodetest`);
                process.argv.splice(0, 1);
                if (process.argv[2] === undefined) {
                    return errout(`No code sample or file path. The ${text.angry + command + text.none} command requires an additional argument.`);
                }
                if (command === "parse-table") {
                    return nodetest();
                }
                process.argv.push("--testprep");
                if (command === "parse-object") {
                    process.argv.push("--outputFormat");
                }
                nodetest();
            },
            performance: function services_action_performance():void {
                if (args[1] === undefined) {
                    return errout(`The ${text.angry}performance${text.none} command requires a relative path to a file`);
                }
                const optionValue = function services_action_performance_optionValue(name:string, defaultValue:string|number|boolean, ):any {
                        if (args.join("").indexOf(`${name}:`) > -1) {
                            let argNumb:number = args.length;
                            do {
                                argNumb = argNumb - 1;
                                if (args[argNumb].indexOf(`${name}:`) === 0) {
                                    if (defaultValue === true || defaultValue === false) {
                                        return args[argNumb].replace(`${name}:`, "") === "true";
                                    }
                                    if (typeof defaultValue === "number") {
                                        return Number(args[argNumb].replace(`${name}:`, ""));
                                    }
                                    return args[argNumb].replace(`${name}:`, "");
                                }
                            } while (argNumb > 0);
                            if (defaultValue === true || defaultValue === false) {
                                return args[argNumb].replace(`${name}:`, "") === "true";
                            }
                            if (typeof defaultValue === "number") {
                                return Number(args[argNumb].replace(`${name}:`, ""));
                            }
                            return args[argNumb].replace(`${name}:`, "");
                        }
                        return defaultValue;
                    },
                    sourcePath:string = node.path.normalize(optionValue("source", process.argv[3]));
                node.fs.readFile(sourcePath, {
                    encoding: "utf8"
                }, function services_action_performance_readFile(errfile, filedata) {
                    if (errfile !== null) {
                        const errstring = errfile.toString();
                        if (errstring.indexOf("no such file or directory") > 0) {
                            return errout(`No file exists as the path specified: ${args[1]}`);
                        }
                        return errout(errfile);
                    }
                    require(`${js}parse`);
                    require(`${js}language`);
                    const framework = global.parseFramework,
                        lang = framework.language.auto(filedata, "javascript"),
                        options:parseOptions = {
                            correct: optionValue("correct", false),
                            crlf: optionValue("crlf", false),
                            language: lang[0],
                            lexer: lang[1],
                            lexerOptions: {},
                            outputFormat: "arrays",
                            source: filedata,
                            wrap: optionValue("wrap", 0)
                        };
                    require(`${js}lexers${sep}all`)(options, function services_action_performance_readFile_lexers() {
                        let index:number = 11,
                            total:number = 0,
                            low:number = 0,
                            high:number = 0,
                            start:[number, number],
                            end:[number, number];
                        const store:number[] = [],
                            output:data = framework.parserArrays(options),
                            comma = function services_action_performance_readFile_readdir_comma(input:number):string {
                                const arr = input.toString().split("").reverse(),
                                    len = arr.length - 1;
                                let ind:number = 0;
                                if (len > 2) {
                                    do {
                                        ind = ind + 3;
                                        if (ind < len) {
                                            arr[ind - 1] = `,${arr[ind - 1]}`;
                                        }
                                    } while (ind < len);
                                }
                                return arr.reverse().join("");
                            },
                            interval = function services_action_performance_readFile_readdir_interval():void {
                                index = index - 1;
                                if (index > -1) {
                                    start = process.hrtime();
                                    framework.parserArrays(options);
                                    end = process.hrtime(start);
                                    store.push((end[0] * 1e9) + end[1]);
                                    // specifying a delay between intervals allows for garbage collection without interference to the performance testing
                                    setTimeout(services_action_performance_readFile_readdir_interval, 400);
                                } else {
                                    console.log("");
                                    store.forEach(function services_action_performance_readFile_readdir_total(value:number, index:number) {
                                        if (index > 0) {
                                            console.log(`${text.yellow + index + text.none}: ${value}`);
                                            total = total + value;
                                            if (value > high) {
                                                high = value;
                                            } else if (value < low) {
                                                low = value;
                                            }
                                        } else {
                                            console.log(`${text.yellow}0:${text.none} ${value} ${text.red}(first run is ignored)${text.none}`);
                                        }
                                    });
                                    console.log("");
                                    console.log(`[${text.bold + text.green + (total / 1e7) + text.none}] Milliseconds, \u00b1${text.cyan + ((((high - low) / total) / 2) * 100).toFixed(2) + text.none}%`);
                                    console.log(`[${text.cyan + comma(filedata.length) + text.none}] Character size`);
                                    console.log(`[${text.cyan + comma(output.token.length) + text.none}] Token length`);
                                    console.log(`Parsed as ${text.cyan + lang[2] + text.none} with lexer ${text.cyan + lang[1] + text.none}.`);
                                    console.log("");
                                }
                            };
                        interval();
                    });
                });
            },
            server: function services_action_server():void {
                process.argv.splice(0, 1);
                server();
            },
            testprep: function services_action_testprep():void {
                process.argv.push("--testprep");
                process.argv.splice(0, 1);
                require(`${js}runtimes${sep}nodetest`)();
            },
            validation: validate,
            version: function services_action_version():void {
                console.log(version);
            }
        },
        keys:string[] = Object.keys(commandList);
    
    command = (args[0] === undefined)
        ? ""
        : args[0].toLowerCase();
    
    command = alias(command);
    if (command === "commands" && args[1] !== undefined) {
        args[1] = alias(args[1]);
    }

    // updates the files that mention a version number
    node.fs.readFile(`${project}package.json`, {
        encoding: "utf8"
    }, function service_version(err, file) {
        if (err !== null) {
            return errout("Error reading package.json file");
        }
        const versionFiles = [
            "readme.md",
            `runtimes${sep}browsertest.xhtml`
        ];
        version = JSON.parse(file).version;
        versionFiles.forEach(function service_version_each(filePath) {
            node.fs.readFile(project + filePath, {
                encoding: "utf8"
            }, function service_version_each_read(erra, fileData) {
                if (erra !== null) {
                    return errout(`Error reading ${filePath} file`);
                }
                let ftest = (filePath === "readme.md")
                        ? "Version "
                        : "<span class=\"version\">",
                    ltest = (filePath === "readme.md")
                        ? "\n"
                        : "</span>",
                    index = fileData.indexOf(ftest),
                    fvers = fileData.slice(index);
                fvers  = fvers.slice(0, fvers.indexOf(ltest)).replace(ftest, "");
                if (fvers !== version) {
                    fileData = fileData.replace(ftest + fvers, ftest + version);
                    node.fs.writeFile(project + filePath, fileData, {
                        encoding: "utf8"
                    }, function service_version_each_read_write(errw) {
                        if (errw !== null) {
                            return errout(`Error writing version update to ${filePath}`);
                        }
                    });
                }
            });
        });
        if (command.indexOf("parse") === 0) {
            action.parse();
        } else {
            action[command]();
        }
    });
};
module.exports = services;
if (process.argv[1].replace(/\\/g, "/").indexOf("js/services") > -1) {
    services();
}