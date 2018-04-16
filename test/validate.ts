/*jslint node:true*/
/*eslint-env node*/
/*eslint no-console: 0*/
// The order array determines which tests run in which order (from last to first
// index)
const taskrunner = function taskrunner_() {
    "use strict";
    let next       = function taskrunner_nextInit() {
            return;
        },
        parse:parse,
        parse_options:parseOptions = {
            correct        : false,
            crlf           : false,
            lang           : "javascript",
            lexer          : "script",
            lexerOptions   : {},
            outputFormat   : "arrays",
            source         : "",
            wrap           : 0
        },
        framework:parseFramework;
    const order      = [
            "typescript", // - run the TypeScript build (tsc) to see if there are type erros
            "lint", //       - run eslint on all unexcluded JS files in the repo
            "framework", //  - test the framework
            "codeunits" //   - test the lexers
        ],
        startTime:[number, number]  = process.hrtime(),
        node       = {
            child: require("child_process").exec,
            fs   : require("fs"),
            path : require("path")
        },
        project:string = (function taskrunner_project() {
            const dirs:string[] = __dirname.split(node.path.sep);
            return dirs.slice(0, dirs.length - 2).join(node.path.sep) + node.path.sep;
        }()),
        orderlen:number   = order.length,
        relative:string   = __dirname.replace(/((\/|\\)js(\/|\\)test)$/, ""),
        humantime  = function taskrunner_humantime(finished:boolean):string {
            let minuteString:string = "",
                hourString:string   = "",
                secondString:string = "",
                finalTime:string    = "",
                finalMem:string     = "",
                strSplit:string[]     = [],
                minutes:number      = 0,
                hours:number        = 0,
                memory,
                elapsed:number      = (function taskrunner_humantime_elapsed():number {
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
            const prettybytes  = function taskrunner_humantime_prettybytes(an_integer:number):string {
                    //find the string length of input and divide into triplets
                    let output:string = "",
                        length:number  = an_integer
                            .toString()
                            .length;
                    const triples:number = (function taskrunner_humantime_prettybytes_triples():number {
                            if (length < 22) {
                                return Math.floor((length - 1) / 3);
                            }
                            //it seems the maximum supported length of integer is 22
                            return 8;
                        }()),
                        //each triplet is worth an exponent of 1024 (2 ^ 10)
                        power:number   = (function taskrunner_humantime_prettybytes_power():number {
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
                plural       = function taskrunner_proctime_plural(x:number, y:string):string {
                    if (x !== 1) {
                        return `${x + y}s `;
                    }
                    return `${x + y} `;
                },
                minute       = function taskrunner_proctime_minute():void {
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
                };
            memory       = process.memoryUsage();
            finalMem     = prettybytes(memory.rss);

            //last line for additional instructions without bias to the timer
            secondString = String(elapsed);
            strSplit     = secondString.split(".");
            if (strSplit[1].length < 9) {
                do {
                    strSplit[1]  = strSplit[1] + 0;
                } while (strSplit[1].length < 9);
                secondString = `${strSplit[0]}.${strSplit[1]}`;
            } else if (strSplit[1].length > 9) {
                secondString = `${strSplit[0]}.${strSplit[1].slice(0, 9)}`;
            }
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
                return `\u001b[36m[${hourString}:${minuteString}:${secondString}]\u001b[39m `;
            }
        },
        errout     = function taskrunner_errout(errtext):void {
            console.log("");
            console.error(errtext);
            console.log("");
            humantime(true);
            if (process.argv[1].indexOf("validate.js") > -1) {
                process.exit(1);
            }
        },
        phases     = {
            codeunits: function taskrunner_coreunits():void {
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
                    compare = function taskrunner_coreunits_compare():void {
                        let len:number       = (files.code.length > files.parsed.length)
                                ? files.code.length
                                : files.parsed.length,
                            lang      = [],
                            a:number         = 0,
                            str:string       = "",
                            outputArrays: data,
                            filecount:number = 0,
                            currentlex:string = "";
                        const lexer     = function taskrunner_coreunits_compare_lexer():void {
                                const lex:string = files.code[a][0].slice(0, files.code[a][0].indexOf(node.path.sep));
                                console.log("");
                                console.log(`Tests for lexer - \u001b[36m${lex}\u001b[39m`);
                                currentlex = lex;
                            },
                            diffFiles  = function taskrunner_coreunits_compare_diffFiles(sampleName:string, sampleSource:data, sampleDiff:data):void {
                                let aa:number     = 0,
                                    pdlen:number  = 0,
                                    plus:string   = "",
                                    plural:string = "",
                                    report:any[] = [],
                                    total:number  = 0;
                                const diffview = require(`${relative + node.path.sep}test${node.path.sep}diffview.js`),
                                    record = function taskrunner_coreunits_compare_diffFiles_record(data:data):record[] {
                                        let x:number = 0;
                                        const len:number = data.token.length,
                                            rec = [],
                                            dn  = function taskrunner_coreunits_compare_diffFiles_record_datanames(value) {
                                                rec[x][value] = data[value][x];
                                            };
                                        do {
                                            rec.push({});
                                            parse.datanames.forEach(dn);
                                            rec[x] = JSON.stringify(rec[x]);
                                            x = x + 1;
                                        } while (x < len);
                                        return rec;
                                    },
                                    diff_options = {
                                        context: 2,
                                        diff: record(sampleDiff),
                                        diffcli: true,
                                        lang: "text",
                                        mode: "diff",
                                        source: record(sampleSource)
                                    };
                                report          = diffview(diff_options);
                                pdlen           = report[0].length;
                                total           = report[1];
                                if (total > 50) {
                                    plus = "+";
                                }
                                if (total !== 1) {
                                    plural = "s";
                                }
                                // report indexes from diffcli feature of diffview.js 0 - source line number 1 -
                                // source code line 2 - diff line number 3 - diff code line 4 - change 5 - index
                                // of diff_options.context (not parallel) 6 - total count of differences
                                do {
                                    if (report[0][aa] === undefined) {
                                        errout(`report[0][aa] is undefined, aa = ${aa}`);
                                    }
                                    if (report[0][aa].indexOf("\u001b[36m") === 0) {
                                        console.log(`\u001b[36m${sampleName}\u001b[39m`);
                                    }
                                    if (report[0][aa].indexOf("\u001b[36mLine: ") !== 0) {
                                        if (report[0][aa].indexOf("\u001b[31m") === 0) {
                                            report[0][aa] = report[0][aa].replace(/\{/, "{\u001b[39m").replace(/(\}\u001b\[39m)$/, "\u001b[31m}\u001b[39m");
                                            report[0][aa] = report[0][aa].replace(/\u001b\[1m/g, "\u001b[31m").replace(/\u001b\[22m/g, "\u001b[39m");
                                        } else if (report[0][aa].indexOf("\u001b[32m") === 0) {
                                            report[0][aa] = report[0][aa].replace(/\{/, "{\u001b[39m").replace(/(\}\u001b\[39m)$/, "\u001b[32m}\u001b[39m");
                                            report[0][aa] = report[0][aa].replace(/\u001b\[1m/g, "\u001b[32m").replace(/\u001b\[22m/g, "\u001b[39m");
                                        }
                                        console.log(report[0][aa]);
                                    }
                                    aa = aa + 1;
                                } while (aa < pdlen);
                                console.log("");
                                console.log(`${total + plus} \u001b[32mdifference${plural} counted.\u001b[39m`);
                                errout(`Pretty Diff \u001b[31mfailed\u001b[39m on file: \u001b[36m${sampleName}\u001b[39m`);
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
                                    console.log(`\u001b[33msamples_code directory is missing file:\u001b[39m${files.parsed[a][0]}`);
                                    files.parsed.splice(a, 1);
                                } else {
                                    console.log(`\u001b[33msamples_parse directory is missing file:\u001b[39m ${files.code[a][0]}`);
                                    files.code.splice(a, 1);
                                }
                                len = (files.code.length > files.parsed.length)
                                    ? files.code.length
                                    : files.parsed.length;
                                a   = a - 1;
                            } else if (files.code[a][0] === files.parsed[a][0]) {
                                if (files.parsed[a][1] === "") {
                                    console.log(`\u001b[33mParsed file is empty:\u001b[39m ${files.parsed[a][0]}`);
                                } else if (files.code[a][1] === "") {
                                    console.log(`\u001b[33mCode file is empty:\u001b[39m ${files.code[a][0]}`);
                                } else {
                                    if ((/_correct(\.|_)/).test(files.code[a][0]) === true) {
                                        parse_options.correct = true;
                                    } else {
                                        parse_options.correct = false;
                                    }
                                    if ((/_wrap-\d+(\.|_)/).test(files.code[a][0]) === true) {
                                        let wrap:string = files.code[a][0].slice(files[a][0].indexOf("_wrap-") + 6),
                                            notnumb:number = 0;
                                        do {
                                            notnumb = notnumb + 1;
                                        } while ((/\D/).test(wrap.charAt(notnumb)) === true);
                                        wrap = wrap.slice(0, notnumb);
                                        if (isNaN(Number(wrap)) === false) {
                                            parse_options.wrap = Number(wrap);
                                        }
                                    }
                                    if ((/_objectSort(\.|_)/).test(files.code[a][0]) === true) {
                                        parse_options.lexerOptions.script.objectSort = true;
                                        parse_options.lexerOptions.style.objectSort = true;
                                    } else {
                                        parse_options.lexerOptions.script.objectSort = false;
                                        parse_options.lexerOptions.style.objectSort = false;
                                    }
                                    if ((/_tagSort(\.|_)/).test(files.code[a][0]) === true) {
                                        parse_options.lexerOptions.markup.tagSort = true;
                                    } else {
                                        parse_options.lexerOptions.markup.tagSort = false;
                                    }
                                    if ((/_lang-\w+(\.|_)/).test(files.code[a][0]) === true) {
                                        parse_options.lang = files.code[a][0].split("_lang-")[1];
                                        if (parse_options.lang.indexOf("_") > 0) {
                                            parse_options.lang = parse_options.lang.split("_")[0];
                                        } else {
                                            parse_options.lang = parse_options.lang.split(".")[0];
                                        }
                                    } else {
                                        parse_options.lang = lang[0];
                                    }
                                    parse_options.source = files.code[a][1];
                                    lang                 = framework.language.auto(files.code[a][1], "javascript");
                                    parse_options.lexer  = currentlex;
                                    outputArrays         = framework.parserArrays(parse_options);
                                    str                  = JSON.stringify(outputArrays);
                                    if (framework.parseerror === "") {
                                        if (str === files.parsed[a][1]) {
                                            filecount = filecount + 1;
                                            console.log(`${humantime(false)}\u001b[32mPass ${filecount}:\u001b[39m ${files.parsed[a][0].replace(currentlex + node.path.sep, "")}`);
                                            if (a === len - 1) {
                                                console.log("\u001b[32mCore unit testing complete!\u001b[39m");
                                                return next();
                                            }
                                        } else {
                                            diffFiles(files.parsed[a][0], outputArrays, JSON.parse(files.parsed[a][1]));
                                        }
                                    } else {
                                        console.log("");
                                        console.log("Quitting due to error:");
                                        console.log(files.code[a][0]);
                                        console.log(framework.parseerror);
                                        if (process.argv[1].indexOf("validate.js") > -1) {
                                            process.exit(1);
                                        }
                                    }
                                }
                            } else {
                                if (files.code[a][0] < files.parsed[a][0]) {
                                    console.log(`\u001b[33mParsed samples directory is missing file:\u001b[39m ${files.code[a][0]}`);
                                    files.code.splice(a, 1);
                                } else {
                                    console.log(`\u001b[33mCode samples directory is missing file:\u001b[39m ${files.parsed[a][0]}`);
                                    files.parsed.splice(a, 1);
                                }
                                len = (files.code.length > files.parsed.length)
                                    ? files.code.length
                                    : files.parsed.length;
                                a   = a - 1;
                                if (a === len - 1) {
                                    console.log("\u001b[32mCore unit testing complete!\u001b[39m");
                                    return next();
                                }
                            }
                            a = a + 1;
                        } while (a < len);
                        console.log("\u001b[32mCore unit testing complete!\u001b[39m");
                        return next();
                    },
                    readDir = function taskrunner_coreunits_readDir(type:string, lexer:string):void {
                        const dirpath:string = `${relative + node.path.sep}test${node.path.sep}samples_${type + node.path.sep + lexer + node.path.sep}`;
                        node.fs.readdir(dirpath, function taskrunner_coreunits_readDir_callback(err, list) {
                            if (err !== null) {
                                if (err.toString().indexOf("no such file or directory") > 0) {
                                    return errout(`The directory ${dirpath} \u001b[31mdoesn't exist\u001b[39m. Provide the necessary test samples for \u001b[36m${lexer}\u001b[39m.`);
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
                            const pusher = function taskrunner_coreunits_readDir_callback_pusher(val) {
                                node.fs.readFile(
                                    dirpath + val,
                                    "utf8",
                                    function taskrunner_coreunits_readDir_callback_pusher_readFile(erra, fileData) {
                                        count[type] = count[type] + 1;
                                        if (erra !== null && erra !== undefined) {
                                            errout(`Error reading file: ${relative + node.path.sep}samples_${type + node.path.sep + lexer + node.path.sep + val}`);
                                        } else {
                                            files[type].push([lexer + node.path.sep + val, fileData]);
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
                console.log("\u001b[36mCore Unit Testing\u001b[39m");
                total.lexer = lexers.length;
                lexers.forEach(function taskrunner_coreunits_lexers(value:string) {
                    count.lexer = count.lexer + 1;
                    readDir("code", value);
                    readDir("parsed", value);
                });
            },
            framework: function taskrunner_framework() {
                let keys    = [],
                    keysort = "";
                const keylist = "concat,count,data,datanames,lineNumber,linesSpace,objectSort,parseOptions,pop,push,safeSort,spacer,splice,structure";
                console.log("\u001b[36mFramework Testing\u001b[39m");
                console.log("");
                framework.parserArrays({
                    correct        : false,
                    crlf           : false,
                    lang           : "html",
                    lexer          : "markup",
                    lexerOptions   : {},
                    outputFormat   : "arrays",
                    source         : "",
                    wrap           : 0
                });
                keys = Object.keys(parse);
                keysort = parse.safeSort(keys, "ascend", false).join();
                if (keysort !== keylist) {
                    console.log("\u001b[36mExpected Keys\u001b[39m");
                    console.log(keylist);
                    console.log("\u001b[36mActual Keys\u001b[39m");
                    console.log(keysort);
                    return errout("\u001b[31mParse framework failure:\u001b[39m The \"parse\" object does not match the known list of required properties.");
                }
                console.log(`${humantime(false)}\u001b[32mObject parse contains only the standard properties.\u001b[39m`);
                
                if (typeof parse.concat !== "function" || parse.concat.name !== "parse_concat") {
                    return errout("\u001b[31mParse framework failure:\u001b[39m parse.concat does not point to the function named parse_concat.");
                }
                console.log(`${humantime(false)}\u001b[32mparse.concat points to function parse_concat.\u001b[39m`);
                
                if (parse.count !== -1) {
                    return errout("\u001b[31mParse framework failure:\u001b[39m The default for parse.count isn't -1 or type number.");
                }
                console.log(`${humantime(false)}\u001b[32mparse.count has default value of -1 and type number.\u001b[39m`);
                
                if (
                    typeof parse.data !== "object" || JSON.stringify(parse.data) !== "{\"begin\":[],\"lexer\":[],\"lines\":[],\"presv\":[],\"stack\":[],\"token\":[],\"types\":[]}"
                ) {
                    return errout("\u001b[31mParse framework failure: parse.data does not contain the properties as defined by parse.datanames or their values aren't empty arrays.\u001b[39m ");
                }
                console.log(`${humantime(false)}\u001b[32mparse.data contains properties as defined by parse.datanames and each is an empty array.\u001b[39m`);
                
                if (JSON.stringify(parse.datanames) !== "[\"begin\",\"lexer\",\"lines\",\"presv\",\"stack\",\"token\",\"types\"]") {
                    return errout("\u001b[31mParse framework failure: parse.datanames does not contain the values: 'begin', 'lexer', 'lines', 'presv', 'stack', 'token', and 'types'.\u001b[39m ");
                }
                console.log(`${humantime(false)}\u001b[32mparse.datanames contains only the data field names.\u001b[39m`);

                if (parse.lineNumber !== 1) {
                    return errout("\u001b[31mParse framework failure: parse.lineNumber does not have a default value of 1 and type number.\u001b[39m ");
                }
                console.log(`${humantime(false)}\u001b[32mparse.lineNumber has a default value of 1 and type number.\u001b[39m`);
                
                // The correct default for linesSpace is 0
                // but the default is changed by the source of empty string.
                if (parse.linesSpace !== 1) {
                    return errout("\u001b[31mParse framework failure: parse.linesSpace does not have a default value of 0 and type number.\u001b[39m ");
                }
                console.log(`${humantime(false)}\u001b[32mparse.linesSpace has a default value of 0 and type number.\u001b[39m`);
                
                if (typeof parse.objectSort !== "function" || parse.objectSort.name !== "parse_objectSort") {
                    return errout("\u001b[31mParse framework failure: parse.objectSort is not assigned to named function parse_objectSort\u001b[39m ");
                }
                console.log(`${humantime(false)}\u001b[32mparse.objectSort is assigned to named function parse_objectSort\u001b[39m`);
                
                if (typeof parse.pop !== "function" || parse.pop.name !== "parse_pop") {
                    return errout("\u001b[31mParse framework failure: parse.pop is not assigned to named function parse_pop\u001b[39m ");
                }
                console.log(`${humantime(false)}\u001b[32mparse.pop is assigned to named function parse_pop\u001b[39m`);
                
                if (typeof parse.push !== "function" || parse.push.name !== "parse_push") {
                    return errout("\u001b[31mParse framework failure: parse.push is not assigned to named function parse_push\u001b[39m ");
                }
                console.log(`${humantime(false)}\u001b[32mparse.push is assigned to named function parse_push\u001b[39m`);
                
                if (parse.push.toString().indexOf("parse.structure.push([structure, parse.count])") < 0 || parse.push.toString().indexOf("parse.structure.pop") < 0) {
                    return errout("\u001b[31mParse framework failure: parse.push does not regulate parse.structure\u001b[39m ");
                }
                console.log(`${humantime(false)}\u001b[32mparse.push contains references to push and pop parse.structure\u001b[39m`);

                if (typeof parse.safeSort !== "function" || parse.safeSort.name !== "parse_safeSort") {
                    return errout("\u001b[31mParse framework failure: parse.safeSort is not assigned to named function parse_safeSort\u001b[39m ");
                }
                console.log(`${humantime(false)}\u001b[32mparse.safeSort is assigned to named function parse_safeSort\u001b[39m`);
                
                if (typeof parse.spacer !== "function" || parse.spacer.name !== "parse_spacer") {
                    return errout("\u001b[31mParse framework failure: parse.spacer is not assigned to named function parse_spacer\u001b[39m ");
                }
                console.log(`${humantime(false)}\u001b[32mparse.spacer is assigned to named function parse_spacer\u001b[39m`);
                
                if (typeof parse.splice !== "function" || parse.splice.name !== "parse_splice") {
                    return errout("\u001b[31mParse framework failure: parse.splice is not assigned to named function parse_splice\u001b[39m ");
                }
                console.log(`${humantime(false)}\u001b[32mparse.splice is assigned to named function parse_splice\u001b[39m`);

                if (Array.isArray(parse.structure) === false || parse.structure.length !== 1 || Array.isArray(parse.structure[0]) === false || parse.structure[0][0] !== "global" || parse.structure[0][1] !== -1) {
                    return errout("\u001b[31mParse framework failure: parse.structure is not assigned the default [[\"global\", -1]]\u001b[39m ");
                }
                console.log(`${humantime(false)}\u001b[32mparse.structure is assigned the default of [[\"global\", -1]]\u001b[39m`);

                if (parse.structure.pop.name !== "parse_structure_pop") {
                    return errout("\u001b[31mParse framework failure: parse.structure does not have a custom 'pop' method.\u001b[39m ");
                }
                console.log(`${humantime(false)}\u001b[32mparse.structure does have a custom 'pop' method.\u001b[39m`);
                
                console.log("\u001b[32mFramework testing complete!\u001b[39m");
                return next();
            },
            lint     : function taskrunner_lint() {
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
                    lintrun         = function taskrunner_lint_lintrun() {
                        let filesCount:number = 0;
                        const filesTotal = files.length,
                            lintit = function taskrunner_lint_lintrun_lintit(val:string):void {
                                node.child(`eslint ${val}`, {
                                    cwd: project
                                }, function taskrunner_lint_lintrun_lintit_eslint(err, stdout, stderr) {
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
                                        console.log(`${humantime(false)}\u001b[32mLint passed:\u001b[39m ${val}`);
                                        if (filesCount === filesTotal) {
                                            console.log("\u001b[32mLint complete!\u001b[39m");
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
                console.log("\u001b[36mBeautifying and Linting\u001b[39m");
                console.log("");
                (function taskrunner_lint_getFiles():void {
                    let total:number    = 1,
                        count:number    = 0;
                    const idLen:number    = ignoreDirectory.length,
                        readDir  = function taskrunner_lint_getFiles_readDir(filepath:string):void {
                            node.fs.readdir(
                                filepath,
                                function taskrunner_lint_getFiles_readDir_callback(erra, list) {
                                    const fileEval = function taskrunner_lint_getFiles_readDir_callback_fileEval(val:string):void {
                                        const filename:string = filepath + node.path.sep + val;
                                        node.fs.stat(
                                            filename,
                                            function taskrunner_lint_getFiles_readDir_callback_fileEval_stat(errb, stat) {
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
                                                        taskrunner_lint_getFiles_readDir(filename);
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
                    readDir(relative);
                }());
            },
            typescript: function taskrunner_typescript():void {
                console.log("\u001b[36mTypeScript Compilation\u001b[39m");
                console.log("");
                node.child("tsc --pretty", {
                    cwd: project
                }, function taskrunner_typescript_callback(err, stdout, stderr):void {
                    if (err !== null) {
                        errout(err);
                        return;
                    }
                    if (stderr !== null && stderr !== "") {
                        errout(stderr);
                        return;
                    }
                    if (stdout !== "") {
                        console.log("\u001b[31mTypeScript reported warnings.\u001b[39m");
                        errout(stdout);
                        return;
                    }
                    console.log(`${humantime(false)}\u001b[32mTypeScript build completed without warnings.\u001b[39m`);
                    return next();
                });
            }
        };

    require(`${project}js${node.path.sep}parse.js`);
    require(`${project}js${node.path.sep}language.js`);
    framework = global.parseFramework;
    framework.lexer      = {};
    framework.parseerror = "";
    parse             = framework.parse;
    require(`${project}js${node.path.sep}lexers${node.path.sep}all.js`)(parse_options);

    next = function taskrunner_next() {
        let phase = order[0];
        const complete = function taskrunner_complete() {
                console.log("");
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
    };
    console.log("");
    next();
    return "";
};
module.exports = taskrunner;
if (process.argv[1].replace(/\\/g, "/").indexOf("js/test/validate") > -1) {
    taskrunner();
}