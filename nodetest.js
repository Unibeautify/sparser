/*
    A simple test script to run the parser.
    This code is not a formal part of the project at this time.
*/

(function nodetest() {
    "use strict";
    var output    = {},
        parser    = require("./parse.js"),
        language  = require("./language.js"),
        fs        = require("fs"),
        path      = require("path"),
        startTime = [],
        color     = function (numb) {
            return "\u001b[1m\u001b[" + numb + "m";
        },
        clear     = "\u001b[39m\u001b[0m",
        lang      = [],
        duration  = "",
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
        duration  = "",
        display   = function () {
            var a   = 0,
                b   = output.attrs.length,
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
                };
            console.log(
                "index | begin | jscom | lines | presv | stack       | types       | attrs     " +
                "  | token"
            );
            do {
                str = [];
                pad(a, 5);
                pad(output.begin[a], 5);
                pad(output.jscom[a], 5);
                pad(output.lines[a], 5);
                pad(output.presv[a], 5);
                pad(output.stack[a], 11);
                pad(output.types[a], 11);
                pad(JSON.stringify(output.attrs[a]), 11);
                str.push(output.token[a].replace(/\s/g, " "));
                console.log(str.join(""));
                a = a + 1;
            } while (a < b);
            console.log("");
            console.log(duration);
            console.log("Presumed language is " + color(33) + lang[2] + clear);
            if (global.parseerror !== undefined && global.parseerror !== "") {
                console.log(color(31) + "Error:" + clear + " " + global.parseerror);
            }
        };
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
                lang           = language.auto(data);
                options.lang   = lang[0];
                options.type   = lang[1]; 
                options.source = data;
                startTime      = process.hrtime();
                output         = parser(options);
                duration       = timespan();
                display();
                //console.log(output);
            });
        });
    } else {
        lang           = language.auto(process.argv[2]);
        options.lang   = lang[0];
        options.type   = lang[1]; 
        options.source = source;
        startTime      = process.hrtime();
        output         = parser(options);
        duration       = timespan();
        display();
        //console.log(output);
    }
}());