/*jslint node:true */

/*global language, parser */

/*
    A simple test script to run the parser.
    This code is not a formal part of the project at this time.
*/

(function nodetest() {
    "use strict";
    var fs        = require("fs"),
        path      = require("path"),
        startTime = [],
        color     = function (numb) {
            return "\u001b[1m\u001b[" + numb + "m";
        },
        clear     = "\u001b[39m\u001b[0m",
        lang      = [],
        duration  = "",
        raw       = (process.argv.indexOf("--raw") > 0),
        options   = {
            correct   : true,
            html      : true,
            jsx       : false,
            objectSort: true,
            source    : "",
            type      : "script"
        },
        timespan  = function () {
            var dec = function (time) {
                    time[0] = time[0] * 1000000000;
                    return time[0] + time[1];
                },
                end = dec(process.hrtime()),
                sta = dec(startTime),
                dur = (end - sta) / 1000000;
            return "Parser executed in " + color(32) + dur + clear + " milliseconds.";
        },
        source    = process.argv[2],
        display   = function (output) {
            var a   = 0,
                b   = output.token.length,
                str = [],
                pad = function (x, y) {
                    var cc = x
                            .toString()
                            .replace(/\s/g, " "),
                        dd = y - cc.length;
                    str.push(cc);
                    if (dd > 0) {
                        do {
                            str.push(" ");
                            dd = dd - 1;
                        } while (dd > 0);
                    }
                    str.push(" | ");
                },
                heading = "index | begin | lexer  | lines | presv | stack       | types       | token",
                bar     = "------|-------|--------|-------|-------|-------------|-------------|------";
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
                pad(a, 5);
                pad(output.begin[a], 5);
                pad(output.lexer[a], 5);
                pad(output.lines[a], 5);
                pad(output.presv[a], 5);
                pad(output.stack[a], 11);
                pad(output.types[a], 11);
                str.push(output.token[a].replace(/\s/g, " "));
                str.push("\u001b[39m");
                console.log(str.join(""));
                a = a + 1;
            } while (a < b);
            console.log("");
            console.log(duration);
            console.log("Presumed language is " + color(33) + lang[2] + clear);
            if (global.parseerror !== "") {
                console.log(color(31) + "Error:" + clear + " " + global.parseerror);
            }
        },
        execute   = function (sourcetext) {
            var output = {};
            lang           = language.auto(sourcetext);
            options.lang   = lang[0];
            options.type   = lang[1]; 
            options.source = sourcetext;
            if (raw === true) {
                output = parser(options);
                if (global.parseerror === "") {
                    console.log(JSON.stringify(output));
                } else {
                    console.log(global.parseerror);
                }
            } else {
                startTime      = process.hrtime();
                output         = parser(options);
                duration       = timespan();
                display(output);
                //console.log(output);
            }
        };
    global.lexer = {};
    global.parseerror = "";
    require("./lexers/markup.js");
    require("./lexers/script.js");
    require("./lexers/style.js");
    require("./parse.js");
    require("./language.js");
    if ((/([a-zA-Z0-9]+\.[a-zA-Z0-9]+)$/).test(source) === true) {
        fs.stat(source, function (err, stats) {
            if (err !== null) {
                if (err.toString().indexOf("no such file or directory") > 0) {
                    return console.log(
                        "Presumed input is a file but such a " + color("31") + "file name does not exist" +
                        clear + " as " + path.resolve(source)
                    );
                }
                return console.log(err);
            }
            if (stats.isFile() === false) {
                return console.log("Specified path exists, but is not a file.");
            }
            fs.readFile(source, "utf8", function (errf, data) {
                if (errf !== null) {
                    return console.log(errf);
                }
                execute(data);
            });
        });
    } else {
        execute(source);
    }
}());
