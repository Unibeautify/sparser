/*jslint node:true*/
/*jshint laxbreak: true*/
// The order array determines which tests run in which order (from last to first
// index)
module.exports = (function taskrunner() {
    "use strict";
    var order      = [
            "lint", //       - run jslint on all unexcluded files in the repo
            "codeunits" //   - run a variety of files through the application and compare the result to a known good file
        ],
        startTime  = process.hrtime(),
        node       = {
            child: require("child_process").exec,
            fs   : require("fs"),
            path : require("path")
        },
        relative   = __dirname.replace(/((\/|\\)test)$/, ""),
        humantime  = function taskrunner_humantime(finished) {
            var minuteString = "",
                hourString   = "",
                secondString = "",
                finalTime    = "",
                finalMem     = "",
                strSplit     = [],
                minutes      = 0,
                hours        = 0,
                elapsed      = (function taskrunner_humantime_elapsed() {
                    var endtime = process.hrtime(),
                        dtime = [endtime[0] - startTime[0], endtime[1] - startTime[1]];
                    if (dtime[1] === 0) {
                        return dtime[0];
                    }
                    if (dtime[1] < 0) {
                        dtime[1] = ((1000000000 + endtime[1]) - startTime[1]);
                    }
                    return dtime[0] + (dtime[1] / 1000000000);
                }()),
                memory       = {},
                prettybytes  = function taskrunner_humantime_prettybytes(an_integer) {
                    //find the string length of input and divide into triplets
                    var length  = an_integer
                            .toString()
                            .length,
                        triples = (function taskrunner_humantime_prettybytes_triples() {
                            if (length < 22) {
                                return Math.floor((length - 1) / 3);
                            }
                            //it seems the maximum supported length of integer is 22
                            return 8;
                        }()),
                        //each triplet is worth an exponent of 1024 (2 ^ 10)
                        power   = (function taskrunner_humantime_prettybytes_power() {
                            var a = triples - 1,
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
                        ],
                        output  = "";

                    if (typeof an_integer !== "number" || isNaN(an_integer) === true || an_integer < 0 || an_integer % 1 > 0) {
                        //input not a positive integer
                        output = "0.00B";
                    } else if (triples === 0) {
                        //input less than 1000
                        output = an_integer + "B";
                    } else {
                        //for input greater than 999
                        length = Math.floor((an_integer / power) * 100) / 100;
                        output = length.toFixed(2) + unit[triples];
                    }
                    return output;
                },
                plural       = function core__proctime_plural(x, y) {
                    var a = "";
                    if (x !== 1) {
                        a = x + y + "s ";
                    } else {
                        a = x + y + " ";
                    }
                    return a;
                },
                minute       = function core__proctime_minute() {
                    minutes      = parseInt((elapsed / 60), 10);
                    minuteString = (finished === true)
                        ? plural(minutes, " minute")
                        : (minutes < 10)
                            ? "0" + minutes
                            : "" + minutes;
                    minutes      = elapsed - (minutes * 60);
                    secondString = (finished === true)
                        ? (minutes === 1)
                            ? " 1 second "
                            : minutes.toFixed(3) + " seconds "
                        : minutes.toFixed(3);
                };
            memory       = process.memoryUsage();
            finalMem     = prettybytes(memory.rss);

            //last line for additional instructions without bias to the timer
            secondString = elapsed + "";
            strSplit     = secondString.split(".");
            if (strSplit[1].length < 9) {
                do {
                    strSplit[1]  = strSplit[1] + 0;
                } while (strSplit[1].length < 9);
                secondString = strSplit[0] + "." + strSplit[1];
            } else if (strSplit[1].length > 9) {
                secondString = strSplit[0] + "." + strSplit[1].slice(0, 9);
            }
            if (elapsed >= 60 && elapsed < 3600) {
                minute();
            } else if (elapsed >= 3600) {
                hours      = parseInt((elapsed / 3600), 10);
                elapsed    = elapsed - (hours * 3600);
                hourString = (finished === true)
                    ? plural(hours, " hour")
                    : (hours < 10)
                        ? "0" + hours
                        : "" + hours;
                minute();
            } else {
                secondString = (finished === true)
                    ? plural(secondString, " second")
                    : secondString;
            }
            if (finished === true) {
                finalTime = hourString + minuteString + secondString;
                console.log(finalMem + " of memory consumed");
                console.log(finalTime + "total time");
                console.log("");
            } else {
                if (hourString === "") {
                    hourString = "00";
                }
                if (minuteString === "") {
                    minuteString = "00";
                }
                if ((/^([0-9]\.)/).test(secondString) === true) {
                    secondString = "0" + secondString;
                }
                return "\u001b[36m[" + hourString + ":" + minuteString + ":" +
                        secondString + "]\u001b[39m ";
            }
        },
        prettydiff = require("." + node.path.sep + "prettydiff" + node.path.sep + "prettydiff.js"),
        options    = {},
        parse      = {},
        errout     = function taskrunner_errout(errtext) {
            console.log("");
            console.error(errtext);
            humantime(true);
            process.exit(1);
        },
        next       = function taskrunner_nextInit() {
            return;
        },
        diffFiles  = function taskrunner_diffFiles(sampleName, sampleSource, sampleDiff) {
            var aa     = 0,
                pdlen  = 0,
                plus   = "",
                plural = "",
                output = [],
                report = [],
                total  = 0,
                record = function taskrunner_diffFiles_record(data) {
                    var len = data.token.length,
                        x   = 0,
                        rec = [],
                        dn  = function taskrunner_diffFiles_record_datanames(value) {
                            rec[x][value] = data[value][x];
                        };
                    do {
                        rec.push({});
                        parse.datanames.forEach(dn);
                        x = x + 1;
                    } while (x < len);
                    return JSON.stringify(rec);
                };
            options.mode    = "diff";
            options.source  = (sampleSource === "")
                ? ""
                : record(JSON.parse(sampleSource));
            options.diff    = (sampleDiff === "")
                ? ""
                : record(JSON.parse(sampleDiff));
            options.diffcli = true;
            options.context = 2;
            options.lang    = "json";
            output          = prettydiff(options);
            report          = output;
            pdlen           = report.length;
            total           = global.prettydiff.meta.difftotal;
            if (total > 50) {
                plus = "+";
            }
            if (total !== 1) {
                plural = "s";
            }
            // report indexes from diffcli feature of diffview.js 0 - source line number 1 -
            // source code line 2 - diff line number 3 - diff code line 4 - change 5 - index
            // of options.context (not parallel) 6 - total count of differences
            do {
                if (report[aa].indexOf("\u001b[36m") === 0) {
                    console.log("\u001b[36m" + sampleName + "\u001b[36m");
                }
                console.log(report[aa]);
                aa = aa + 1;
            } while (aa < pdlen);
            if (sampleName !== "phases.simulations") {
                console.log("");
                console.log(
                    total + plus + " \u001b[32mdifference" + plural + " counted.\u001b[39m"
                );
                errout(
                    "Pretty Diff \u001b[31mfailed\u001b[39m on file: \u001b[36m" + sampleName + "" +
                    "\u001b[39m"
                );
            }
        },
        phases     = {
            codeunits  : function taskrunner_coreunits() {
                var code   = [],
                    parsed = [],
                    countr = 0,
                    countc = 0,
                    utflag = {
                        parsed: false,
                        code  : false
                    },
                    compare = function taskrunner_coreunits_compare() {
                        var len       = (code.length > parsed.length)
                                ? code.length
                                : parsed.length,
                            a         = 0,
                            str       = "",
                            output    = {},
                            filecount = 0;
                        code   = parse.safeSort(code);
                        parsed = parse.safeSort(parsed);
                        for (a = 0; a < len; a = a + 1) {
                            if (code[a] === undefined || parsed[a] === undefined) {
                                if (code[a] === undefined) {
                                    console.log(
                                        "\u001b[33msamples_code directory is missing file:\u001b[39m " + parsed[a][0]
                                    );
                                    parsed.splice(a, 1);
                                } else {
                                    console.log(
                                        "\u001b[33msamples_parse directory is missing file:\u001b[39m " + code[a][0]
                                    );
                                    code.splice(a, 1);
                                }
                                len = (code.length > parsed.length)
                                    ? code.length
                                    : parsed.length;
                                a   = a - 1;
                                if (a === len - 1) {
                                    console.log("");
                                    console.log("\u001b[32mCore Unit Testing Complete\u001b[39m");
                                    return next();
                                }
                            } else if (code[a][0] === parsed[a][0]) {
                                if (parsed[a][1] === "") {
                                    console.log("\u001b[31mParsed file is empty:\u001b[39m " + parsed[a][0]);
                                } else if (code[a][1] === "") {
                                    console.log("\u001b[31mCode file is empty:\u001b[39m " + code[a][0]);
                                } else {
                                    if ((/_correct(\.|_)/).test(code[a][0]) === true) {
                                        options.correct = true;
                                    } else {
                                        options.correct = false;
                                    }
                                    options.source = code[a][1];
                                    options.type   = global.language.auto(code[a][1], "javascript")[1];
                                    output         = global.parser(options);
                                    str            = JSON.stringify(output);
                                    if (global.parseerror === "") {
                                        if (str === parsed[a][1]) {
                                            filecount = filecount + 1;
                                            console.log(
                                                humantime(false) + "\u001b[32mPass " + filecount + ":\u001b[39m " + parsed[a][0]
                                            );
                                            if (a === len - 1) {
                                                return next();
                                            }
                                        } else {
                                            diffFiles(parsed[a][0], str, parsed[a][1]);
                                        }
                                    } else {
                                        console.log("");
                                        console.log("Quitting due to error:");
                                        console.log(global.parseerror);
                                        process.exit(1);
                                    }
                                }
                            } else {
                                if (code[a][0] < parsed[a][0]) {
                                    console.log(
                                        "\u001b[33mParsed samples directory is missing file:\u001b[39m " + code[a][0]
                                    );
                                    code.splice(a, 1);
                                } else {
                                    console.log(
                                        "\u001b[33mCode samples directory is missing file:\u001b[39m " + parsed[a][0]
                                    );
                                    parsed.splice(a, 1);
                                }
                                len = (code.length > parsed.length)
                                    ? code.length
                                    : parsed.length;
                                a   = a - 1;
                                if (a === len - 1) {
                                    return next();
                                }
                            }
                        }
                    },
                    readDir = function taskrunner_coreunits_readDir(type) {
                        var dirpath = relative + node.path.sep + "test" + node.path.sep + "samples_" + type;
                        node.fs.readdir(dirpath, function taskrunner_coreunits_readDir_callback(err, list) {
                            var pusher = function taskrunner_coreunits_readDir_callback_pusher(
                                val,
                                ind,
                                arr
                            ) {
                                node.fs.readFile(
                                    dirpath + node.path.sep + val,
                                    "utf8",
                                    function taskrunner_coreunits_readDir_callback_pusher_readFile(erra, fileData) {
                                        if (erra !== null && erra !== undefined) {
                                            errout("Error reading file: " + relative + node.path.sep + "samples_" + type + node.path.sep + val);
                                        } else if (type === "code") {
                                            code.push([val, fileData]);
                                            countr = countr + 1;
                                            if (countr === arr.length) {
                                                utflag.code = true;
                                                if (utflag.parsed === true) {
                                                    compare("");
                                                }
                                            }
                                        } else if (type === "parsed") {
                                            parsed.push([val, fileData]);
                                            countc = countc + 1;
                                            if (countc === arr.length) {
                                                utflag.parsed = true;
                                                if (utflag.code === true) {
                                                    compare("");
                                                }
                                            }
                                        }
                                        return ind;
                                    }
                                );
                            };
                            if (err !== null) {
                                errout("Error reading from directory: " + dirpath);
                            }
                            list.forEach(pusher);
                        });
                    };
                console.log("");
                console.log("");
                console.log("\u001b[36mCore Unit Testing\u001b[39m");
                readDir("code");
                readDir("parsed");
            },
            lint       : function taskrunner_lint() {
                var ignoreDirectory = [
                        ".git",
                        ".vscode",
                        "ace",
                        "biddle",
                        "bin",
                        "coverage",
                        "guide",
                        "ignore",
                        "node_modules",
                        "test/jslint",
                        "test/prettydiff",
                        "test/samples_parsed",
                        "test/samples_code"
                    ],
                    flag            = {
                        files: false,
                        items: false
                    },
                    files           = [],
                    jslint          = require("." + node.path.sep + "jslint" + node.path.sep + "jslint.js"),
                    lintrun         = function taskrunner_lint_lintrun() {
                        var lintit = function taskrunner_lint_lintrun_lintit(val, ind, arr) {
                            var result = {},
                                failed = false,
                                ecount = 0,
                                report = function taskrunner_lint_lintrun_lintit_lintOn_report(warning) {
                                    //start with an exclusion list.  There are some warnings that I don't care about
                                    if (warning === null) {
                                        return;
                                    }
                                    if (warning.message.indexOf("Unexpected dangling '_'") === 0) {
                                        return;
                                    }
                                    if ((/Bad\u0020property\u0020name\u0020'\w+_'\./).test(warning.message) === true) {
                                        return;
                                    }
                                    if (warning.message.indexOf("/*global*/ requires") === 0) {
                                        return;
                                    }
                                    failed = true;
                                    if (ecount === 0) {
                                        console.log("\u001b[31mJSLint errors on\u001b[39m " + val[0]);
                                        console.log("");
                                    }
                                    ecount = ecount + 1;
                                    console.log("On line " + warning.line + " at column: " + warning.column);
                                    console.log(warning.message);
                                    console.log("");
                                };
                            options.source = val[1];
                            result         = jslint(prettydiff(options), {"for": true});
                            if (result.ok === true) {
                                console.log(
                                    humantime(false) + "\u001b[32mLint is good for file " + (
                                        ind + 1
                                    ) + ":\u001b[39m " + val[0]
                                );
                                if (ind === arr.length - 1) {
                                    console.log("");
                                    console.log("\u001b[32mLint operation complete!\u001b[39m");
                                    console.log("");
                                    return next();
                                }
                            } else {
                                result
                                    .warnings
                                    .forEach(report);
                                if (failed === true) {
                                    errout("\u001b[31mLint fail\u001b[39m :(");
                                } else {
                                    console.log(
                                        humantime(false) + "\u001b[32mLint is good for file " + (
                                            ind + 1
                                        ) + ":\u001b[39m " + val[0]
                                    );
                                    if (ind === arr.length - 1) {
                                        console.log("");
                                        console.log("\u001b[32mLint operation complete!\u001b[39m");
                                        console.log("");
                                        return next();
                                    }
                                }
                            }
                        };
                        options = {
                            correct     : false,
                            crlf        : false,
                            html        : true,
                            inchar      : " ",
                            insize      : 4,
                            lang        : "javascript",
                            methodchain : "indent",
                            mode        : "beautify",
                            nocaseindent: false,
                            objsort     : "all",
                            preserve    : 2,
                            styleguide  : "jslint",
                            wrap        : 80
                        };
                        files.forEach(lintit);
                    };
                console.log("");
                console.log("");
                console.log("\u001b[36mBeautifying and Linting\u001b[39m");
                console.log(
                    "** Note that line numbers of error messaging reflects beautified code line."
                );
                console.log("");
                (function taskrunner_lint_getFiles() {
                    var fc       = 0,
                        ft       = 0,
                        total    = 0,
                        count    = 0,
                        idLen    = ignoreDirectory.length,
                        readFile = function taskrunner_lint_getFiles_readFile(filePath) {
                            node.fs.readFile(
                                filePath,
                                "utf8",
                                function taskrunner_lint_getFiles_readFile_callback(err, data) {
                                    if (err !== null && err !== undefined) {
                                        errout(err);
                                    }
                                    fc = fc + 1;
                                    if (ft === fc) {
                                        flag.files = true;
                                    }
                                    files.push([
                                        filePath.slice(filePath.indexOf(node.path.sep + "parse-framework" + node.path.sep) + 17),
                                        data
                                    ]);
                                    if (flag.files === true && flag.items === true) {
                                        lintrun();
                                    }
                                }
                            );
                        },
                        readDir  = function taskrunner_lint_getFiles_readDir(filepath) {
                            node.fs.readdir(
                                filepath,
                                function taskrunner_lint_getFiles_readDir_callback(erra, list) {
                                    var fileEval = function taskrunner_lint_getFiles_readDir_callback_fileEval(val) {
                                        var filename = filepath + node.path.sep + val;
                                        node.fs.stat(
                                            filename,
                                            function taskrunner_lint_getFiles_readDir_callback_fileEval_stat(errb, stat) {
                                                var a         = 0,
                                                    ignoreDir = false,
                                                    dirtest   = filepath.replace(/\\/g, "/") + "/" + val;
                                                if (errb !== null) {
                                                    return errout(errb);
                                                }
                                                count = count + 1;
                                                if (count === total) {
                                                    flag.items = true;
                                                }
                                                if (stat.isFile() === true && (/(\.js)$/).test(val) === true) {
                                                    ft = ft + 1;
                                                    readFile(filename);
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
                                                        if (flag.files === true && flag.items === true) {
                                                            lintrun();
                                                        }
                                                    } else {
                                                        taskrunner_lint_getFiles_readDir(filename);
                                                    }
                                                }
                                            }
                                        );
                                    };
                                    if (erra !== null) {
                                        return errout("Error reading path: " + filepath + "\n" + erra);
                                    }
                                    total = total + list.length;
                                    list.forEach(fileEval);
                                }
                            );
                        };
                    readDir(relative);
                }());
            }
        };

    require(".." + node.path.sep + "parse.js");
    require(".." + node.path.sep + "language.js");
    global.lexer      = {};
    global.parseerror = "";
    parse             = global.parse;

    node.fs.readdir(relative + node.path.sep + "lexers", function taskrunner_lexers(err, files) {
        if (err !== null) {
            console.log(err);
            process.exit(1);
        } else {
            files.forEach(function taskrunner_lexers_each(value) {
                if ((/(\.js)$/).test(value) === true) {
                    require(relative + node.path.sep + "lexers" + node.path.sep + value);
                }
            });
        }
    });

    next = function taskrunner_next() {
        var complete = function taskrunner_complete() {
            console.log("");
            console.log("All tasks complete... Exiting clean!");
            humantime(true);
            process.exit(0);
        };
        if (order.length < 1) {
            return complete();
        }
        phases[order[0]]();
        order.splice(0, 1);
    };
    next();
    return "";
}());