/*jslint node:true*/
/*eslint-env node*/
/*eslint no-console: 0*/
const all = function lexers_all(options:any, callback:Function) {
    "use strict";
    const node = {
            fs: require("fs"),
            path: require("path")
        },
        project:string = __dirname.replace(/lexers(\/|\\)?/, "") + node.path.sep;
    node.fs.readdir(`${project}lexers`, function nodetest_readdir(err:Error, files:string[]) {
        if (err !== null) {
            console.log(err);
            return process.exit(1);
        }
        if (options.lexerOptions === undefined) {
            options.lexerOptions = {};
        }
        files.forEach(function nodetest_readdir_each(value:string) {
            if ((/(\.js)$/).test(value) === true) {
                require(`${project}lexers${node.path.sep + value}`);
                options.lexerOptions[value.replace(".js", "")] = {};
            }
        });
        if (typeof callback === "function") {
            callback();
        }
    });
}
module.exports = all;