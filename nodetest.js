(function nodetest() {
    "use strict";
    var parser  = require("./parse.js"),
        fs      = require("fs"),
        options = {
            source: "",
            type  : "script"
        },
        source = process.argv[2];
    if ((/([a-zA-Z0-9]+\.[a-zA-Z0-9]+)$/).test(source) === true) {
        fs.stat(source, function (err, stats) {
            if (err !== null) {
                if (err.toString().indexOf("no such file or directory") > 0) {
                    return console.log("Presumed input is a file but such a \u001b[1m\u001b[31mfile name does not exist\u001b[0m\u001b[39m.");
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
                options.source = data;
                console.log(parser(options));
            });
        });
    } else {
        options.source = source;
        console.log(parser(options));
    }
}());