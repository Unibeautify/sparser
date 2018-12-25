/*jslint node:true */
/*eslint-env node*/
/*eslint no-console: 0*/
/*global global */

/*
    A simple test script to run the parser.
    This code is not a formal part of the project at this time.
*/

const nodetest = function nodetest_() {
    "use strict";
    let duration:string,
        lang: [string, string, string],
        startTime: [number, number],
        framework: parseFramework,
        outputArrays:data,
        outputObjects:record[];
    const node      = {
            fs  : require("fs"),
            path: require("path")
        },
        color     = function nodetest_color(numb: string): string {
            return `\u001b[1m\u001b[${numb}m`;
        },
        clear:string     = "\u001b[39m\u001b[0m",
        directory:string = __dirname.replace(/runtimes(\/|\\)?/, "") + node.path.sep,
        testprep:boolean       = (function nodetest_testprep():boolean {
            const index:number = process.argv.indexOf("--testprep");
            if (index < 0) {
                return false;
            }
            process.argv.splice(index, 1);
            return true;
        }()),
        options:parseOptions   = {
            correct: false,
            crlf: false,
            language: "",
            lexer: "script",
            lexerOptions: {},
            outputFormat:  (function nodetest_outputFormat():"objects"|"arrays" {
                const index:number = process.argv.indexOf("--outputFormat");
                if (index < 0) {
                    return "arrays";
                }
                process.argv.splice(index, 1);
                return "objects";
            }()),
            preserve_comment: false,
            source: "",
            wrap: 0
        },
        timespan  = function nodetest_timespan():string {
            const dec = function nodetest_timespan_dec(time: [number, number]):number {
                    return (time[0] * 1e9) + time[1];
                },
                end:number = dec(process.hrtime()),
                sta:number = dec(startTime),
                dur:number = (end - sta) / 1000000;
            return `Parser executed in ${color("32") + dur + clear} milliseconds.`;
        },
        source:string    = (process.argv.length > 3 && process.argv[2].indexOf("samples_code") === process.argv[2].length - 13)
            ? process.argv[2] + process.argv[3]
            : process.argv[2],
        display   = function nodetest_display():void {
            let a:number   = 0,
                str:string[] = [];
            const b:number = (options.outputFormat === "arrays")
                    ? outputArrays.token.length
                    : outputObjects.length,
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
                if (options.outputFormat === "arrays") {
                    if (outputArrays.lexer[a] === "markup") {
                        str.push("\u001b[31m");
                    } else if (outputArrays.lexer[a] === "script") {
                        str.push("\u001b[32m");
                    } else if (outputArrays.lexer[a] === "style") {
                        str.push("\u001b[33m");
                    }
                    pad(a.toString(), 5);
                    pad(outputArrays.begin[a].toString(), 5);
                    pad(outputArrays.lexer[a].toString(), 5);
                    pad(outputArrays.lines[a].toString(), 5);
                    pad(outputArrays.presv[a].toString(), 5);
                    pad(outputArrays.stack[a].toString(), 11);
                    pad(outputArrays.types[a].toString(), 11);
                    str.push(outputArrays.token[a].replace(/\s/g, " "));
                    str.push("\u001b[39m");
                    console.log(str.join(""));
                } else {
                    if (outputObjects[a].lexer === "markup") {
                        str.push("\u001b[31m");
                    } else if (outputObjects[a].lexer === "script") {
                        str.push("\u001b[32m");
                    } else if (outputObjects[a].lexer === "style") {
                        str.push("\u001b[33m");
                    }
                    pad(a.toString(), 5);
                    pad(outputObjects[a].begin.toString(), 5);
                    pad(outputObjects[a].lexer.toString(), 5);
                    pad(outputObjects[a].lines.toString(), 5);
                    pad(outputObjects[a].presv.toString(), 5);
                    pad(outputObjects[a].stack.toString(), 11);
                    pad(outputObjects[a].types.toString(), 11);
                    str.push(outputObjects[a].token.replace(/\s/g, " "));
                    str.push("\u001b[39m");
                    console.log(str.join(""));
                }
                a = a + 1;
            } while (a < b);
            console.log("");
            console.log(duration);
            console.log(`Presumed language is ${color("33") + lang[2] + clear}`);
            if (framework.parseerror !== "") {
                console.log(`${color("31")}Error:${clear} ${framework.parseerror}`);
            }
        },
        execute   = function nodetest_execute(sourcetext) {
            lang           = framework.language.auto(sourcetext, "javascript");
            options.lexer  = lang[1];
            options.source = sourcetext;
            options.outputFormat = (process.argv.indexOf("outputFormat:arrays") > -1)
                ? "arrays"
                : "objects";
            if (testprep === true) {
                if (sourcetext !== source) {
                    const sourcepath:string = source.replace(/\\|\//g, "/");
                    if (sourcepath.indexOf(`test/samples_code/`) > -1) {
                        options.lexer = (function nodetest_execute_lexer() {
                            const str = sourcepath.split(`samples_code/`)[1];
                            return str.slice(0, str.indexOf("/"));
                        }());
                    }
                    if ((/_correct(\.|_|-)/).test(sourcepath) === true) {
                        if ((/_correct-/).test(sourcepath) === true) {
                            if ((/_correct-false/).test(sourcepath) === true) {
                                options.correct = false;
                            } else {
                                options.correct = true;
                            }
                        } else {
                            options.correct = true;
                        }
                    } else {
                        options.correct = false;
                    }
                    if ((/_endComma-/).test(sourcepath) === true) {
                        if ((/_endComma-always/).test(sourcepath) === true) {
                            options.lexerOptions.script.end_comma = "always";
                        } else if ((/_endComma-never/).test(sourcepath) === true) {
                            options.lexerOptions.script.end_comma = "never";
                        } else {
                            options.lexerOptions.script.end_comma = "none";
                        }
                    } else {
                        options.lexerOptions.script.end_comma = "none";
                    }
                    if ((/_noleadzero(\.|_|-)/).test(sourcepath) === true) {
                        if ((/_noleadzero-/).test(sourcepath) === true) {
                            if ((/_noleadzero-false/).test(sourcepath) === true) {
                                options.lexerOptions.style.no_lead_zero = false;
                            } else {
                                options.lexerOptions.style.no_lead_zero = true;
                            }
                        } else {
                            options.lexerOptions.style.no_lead_zero = true;
                        }
                    } else {
                        options.lexerOptions.style.no_lead_zero = false;
                    }
                    if ((/_quoteConvert-/).test(sourcepath) === true) {
                        if ((/_quoteConvert-double/).test(sourcepath) === true) {
                            options.lexerOptions.style.quote_convert = "double";
                            options.lexerOptions.script.quote_convert = "double";
                        } else if ((/_quoteConvert-single/).test(sourcepath) === true) {
                            options.lexerOptions.style.quote_convert = "single";
                            options.lexerOptions.script.quote_convert = "single";
                        } else {
                            options.lexerOptions.style.quote_convert = "none";
                            options.lexerOptions.script.quote_convert = "none";
                        }
                    } else {
                        options.lexerOptions.style.quote_convert = "none";
                        options.lexerOptions.script.quote_convert = "none";
                    }
                    if ((/_objectSort(\.|_|-)/).test(sourcepath) === true) {
                        if ((/_objectSort-/).test(sourcepath) === true) {
                            if ((/_objectSort-false/).test(sourcepath) === true) {
                                options.lexerOptions.style.objectSort = false;
                                options.lexerOptions.script.objectSort = false;
                            } else {
                                options.lexerOptions.style.objectSort = true;
                                options.lexerOptions.script.objectSort = true;
                            }
                        } else {
                            options.lexerOptions.style.objectSort = true;
                            options.lexerOptions.script.objectSort = true;
                        }
                    } else {
                        options.lexerOptions.style.objectSort = false;
                        options.lexerOptions.script.objectSort = false;
                    }
                    if ((/_preserveComment(\.|_|-)/).test(sourcepath) === true) {
                        if ((/_preserveComment-/).test(sourcepath) === true) {
                            if ((/_preserveComment-false/).test(sourcepath) === true) {
                                options.preserve_comment = false;
                            } else {
                                options.preserve_comment = true;
                            }
                        } else {
                            options.preserve_comment = true;
                        }
                    } else {
                        options.preserve_comment = false;
                    }
                    if ((/_preserveText(\.|_|-)/).test(sourcepath) === true) {
                        if ((/_preserveText-/).test(sourcepath) === true) {
                            if ((/_preserveText-false/).test(sourcepath) === true) {
                                options.lexerOptions.markup.preserve_text = false;
                            } else {
                                options.lexerOptions.markup.preserve_text = true;
                            }
                        } else {
                            options.lexerOptions.markup.preserve_text = true;
                        }
                    } else {
                        options.lexerOptions.markup.preserve_text = false;
                    }
                    if ((/_tagSort(\.|_|-)/).test(sourcepath) === true) {
                        if ((/_tagSort-/).test(sourcepath) === true) {
                            if ((/_tagSort-false/).test(sourcepath) === true) {
                                options.lexerOptions.markup.tagSort = false;
                            } else {
                                options.lexerOptions.markup.tagSort = true;
                            }
                        } else {
                            options.lexerOptions.markup.tagSort = true;
                        }
                    } else {
                        options.lexerOptions.markup.tagSort = false;
                    }
                    if ((/_tagMerge(\.|_|-)/).test(sourcepath) === true) {
                        if ((/_tagMerge-/).test(sourcepath) === true) {
                            if ((/_tagMerge-false/).test(sourcepath) === true) {
                                options.lexerOptions.markup.tag_merge = false;
                            } else {
                                options.lexerOptions.markup.tag_merge = true;
                            }
                        } else {
                            options.lexerOptions.markup.tag_merge = true;
                        }
                    } else {
                        options.lexerOptions.markup.tag_merge = false;
                    }
                    if ((/_wrap-\d+(\.|_)/).test(sourcepath) === true) {
                        let wrap:string = sourcepath.slice(sourcepath.indexOf("_wrap-") + 6),
                            numb:number = 0;
                        do {
                            numb = numb + 1;
                        } while ((/\d/).test(wrap.charAt(numb)) === true);
                        wrap = wrap.slice(0, numb);
                        if (isNaN(Number(wrap)) === false) {
                            options.wrap = Number(wrap);
                        }
                    }
                    if ((/_lang-\w+(\.|_)/).test(sourcepath) === true) {
                        options.language = sourcepath.split("_lang-")[1];
                        if (options.language.indexOf("_") > 0) {
                            options.language = options.language.split("_")[0];
                        } else {
                            options.language = options.language.split(".")[0];
                        }
                    } else {
                        options.language   = lang[0];
                    }
                } else {
                    options.language   = lang[0];
                }
                if (options.outputFormat === "arrays") {
                    outputArrays = framework.parserArrays(options);
                } else {
                    outputObjects = framework.parserObjects(options);
                }
                if (framework.parseerror === "") {
                    if (options.outputFormat === "arrays") {
                        console.log(JSON.stringify(outputArrays));
                    } else {
                        let x:number = 0;
                        const len:number = outputObjects.length - 1;
                        console.log("[");
                        if (len > 0) {
                            do {
                                console.log(`${JSON.stringify(outputObjects[x])},`);
                                x = x + 1;
                            } while (x < len);
                        }
                        console.log(JSON.stringify(outputObjects[len]));
                        console.log("]");
                    }
                } else {
                    console.log(framework.parseerror);
                }
            } else {
                options.correct = true;
                options.language    = lang[0];
                startTime       = process.hrtime();
                if (options.outputFormat === "arrays") {
                    outputArrays = framework.parserArrays(options);
                } else {
                    outputObjects = framework.parserObjects(options);
                }
                duration        = timespan();
                display();
            }
        };
    
    require(`${directory}parse.js`);
    require(`${directory}language.js`);
    framework = global.parseFramework;
    framework.lexer = {};
    framework.parseerror = "";
    require(`${directory}lexers${node.path.sep}all.js`)(options, function nodetest_lexers() {
        if ((/([a-zA-Z0-9]+\.[a-zA-Z0-9]+)$/).test(source) === true) {
            node.fs.stat(source, function nodetest_readdir_stat(err, stats) {
                if (err !== null) {
                    if (err.toString().indexOf("no such file or directory") > 0) {
                        return console.log(`Presumed input is a file but such a ${color("31")}file name does not exist${clear} as ${node.path.resolve(source)}`);
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
};
module.exports = nodetest;
if (process.argv[1].replace(/\\/g, "/").indexOf("js/runtimes/nodetest") > -1) {
    nodetest();
}