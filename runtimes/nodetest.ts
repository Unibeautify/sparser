/*jslint node:true */
/*eslint-env node*/
/*eslint no-console: 0*/
/*global global */

/*
    A simple test script to run the parser.
    This code is not a formal part of the project at this time.
*/

(function nodetest() {
    "use strict";
    let duration:string,
        lang: [string, string, string],
        startTime: [number, number],
        framework: parseFramework;
    const node      = {
            fs  : require("fs"),
            path: require("path")
        },
        color     = function nodetest_color(numb: string): string {
            return "\u001b[1m\u001b[" + numb + "m";
        },
        clear:string     = "\u001b[39m\u001b[0m",
        directory:string = __dirname.replace(/runtimes(\/|\\)?/, "") + node.path.sep,
        raw:boolean       = (function nodetest_raw():boolean {
            const index:number = process.argv.indexOf("--raw");
            if (index < 0) {
                return false;
            }
            process.argv.splice(index, 1);
            return true;
        }()),
        options:options   = {
            correct: false,
            crlf: false,
            lang: "",
            lexer     : "script",
            lexerOptions: {},
            source    : ""
        },
        timespan  = function nodetest_timespan():string {
            const dec = function nodetest_timespan_dec(time: [number, number]): number {
                    time[0] = time[0] * 1000000000;
                    return time[0] + time[1];
                },
                end:number = dec(process.hrtime()),
                sta:number = dec(startTime),
                dur:number = (end - sta) / 1000000;
            return "Parser executed in " + color("32") + dur + clear + " milliseconds.";
        },
        source:string    = (process.argv.length > 3 && process.argv[2].indexOf("samples_code") === process.argv[2].length - 13)
            ? process.argv[2] + process.argv[3]
            : process.argv[2],
        display   = function nodetest_display(output):void {
            let a:number   = 0,
                str:string[] = [];
            const b:number = output.token.length,
                pad = function nodetest_display_pad(x:string, y:number):void {
                    const cc:string = x
                            .toString()
                            .replace(/\s/g, " ");
                    let dd:number = y - cc.length;
                    str.push(cc);
                    if (dd > 0) {
                        do {
                            str.push(" ");
                            dd = dd - 1;
                        } while (dd > 0);
                    }
                    str.push(" | ");
                },
                heading:string = "index | begin | lexer  | lines | presv | stack       | types       | token",
                bar:string     = "------|-------|--------|-------|-------|-------------|-------------|------";
            console.log("");
            console.log(heading);
            console.log(bar);
            do {
                if (a % 100 === 0 && a > 0) {
                    console.log("");
                    console.log(heading);
                    console.log(bar);
                }
                str = [];
                if (output.lexer[a] === "markup") {
                    str.push("\u001b[31m");
                } else if (output.lexer[a] === "script") {
                    str.push("\u001b[32m");
                } else if (output.lexer[a] === "style") {
                    str.push("\u001b[33m");
                }
                pad(a.toString(), 5);
                pad(output.begin[a].toString(), 5);
                pad(output.lexer[a].toString(), 5);
                pad(output.lines[a].toString(), 5);
                pad(output.presv[a].toString(), 5);
                pad(output.stack[a].toString(), 11);
                pad(output.types[a].toString(), 11);
                str.push(output.token[a].replace(/\s/g, " "));
                str.push("\u001b[39m");
                console.log(str.join(""));
                a = a + 1;
            } while (a < b);
            console.log("");
            console.log(duration);
            console.log("Presumed language is " + color("33") + lang[2] + clear);
            if (framework.parseerror !== "") {
                console.log(color("31") + "Error:" + clear + " " + framework.parseerror);
            }
        },
        execute   = function nodetest_execute(sourcetext) {
            let output = {};
            lang           = framework.language.auto(sourcetext, "javascript");
            options.lexer  = lang[1];
            options.source = sourcetext;
            if (raw === true) {
                if (sourcetext !== source) {
                    if ((/_correct(\.|_)/).test(source) === true) {
                        options.correct = true;
                    } else {
                        options.correct = false;
                    }
                    if ((/_objectSort(\.|_)/).test(source) === true) {
                        options.lexerOptions.style.objectSort = true;
                        options.lexerOptions.script.objectSort = true;
                    } else {
                        options.lexerOptions.style.objectSort = false;
                        options.lexerOptions.script.objectSort = false;
                    }
                    if ((/_tagSort(\.|_)/).test(source) === true) {
                        options.lexerOptions.markup.tagSort = true;
                    } else {
                        options.lexerOptions.markup.tagSort = false;
                    }
                    if ((/_lang-\w+(\.|_)/).test(source) === true) {
                        options.lang = source.split("_lang-")[1];
                        if (options.lang.indexOf("_") > 0) {
                            options.lang = options.lang.split("_")[0];
                        } else {
                            options.lang = options.lang.split(".")[0];
                        }
                    } else {
                        options.lang   = lang[0];
                    }
                } else {
                    options.lang   = lang[0];
                }
                output = framework.parser(options);
                if (framework.parseerror === "") {
                    console.log(JSON.stringify(output));
                } else {
                    console.log(framework.parseerror);
                }
            } else {
                options.correct = true;
                options.lang    = lang[0];
                startTime       = process.hrtime();
                output          = framework.parser(options);
                duration        = timespan();
                display(output);
                //console.log(output);
            }
        };
    require(directory + "parse.js");
    require(directory + "language.js");
    framework = global.parseFramework;
    framework.lexer = {};
    framework.parseerror = "";
    options.lexerOptions = {};
    node.fs.readdir(directory + "lexers", function nodetest_readdir(err, files) {
        if (err !== null) {
            console.log(err);
            return process.exit(1);
        }
        files.forEach(function nodetest_readdir_each(value) {
            if ((/(\.js)$/).test(value) === true) {
                require(directory + "lexers" + node.path.sep + value);
                options.lexerOptions[value] = {};
            }
        });
        if ((/([a-zA-Z0-9]+\.[a-zA-Z0-9]+)$/).test(source) === true) {
            node.fs.stat(source, function nodetest_readdir_stat(err, stats) {
                if (err !== null) {
                    if (err.toString().indexOf("no such file or directory") > 0) {
                        return console.log(
                            "Presumed input is a file but such a " + color("31") + "file name does not exist" +
                            clear + " as " + node.path.resolve(source)
                        );
                    }
                    return console.log(err);
                }
                if (stats.isFile() === false) {
                    return console.log("Specified path exists, but is not a file.");
                }
                node.fs.readFile(source, "utf8", function nodetest_readdir_stat_readFile(errf, data) {
                    if (errf !== null) {
                        return console.log(errf);
                    }
                    execute(data);
                });
            });
        } else {
            execute(source);
        }
    });
}());