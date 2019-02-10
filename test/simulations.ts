
// tests structure
// * artifact - the address of anything written to disk, so that it can be removed
// * command - the command to execute minus the `node js/services` part
// * file - a file system address to open
// * qualifier - how to test, see simulationItem in index.d.ts for appropriate values
// * test - the value to compare against

(function simulations() {
    "use strict";
    const eol = require("os").EOL,
        sep:string = require("path").sep,
        projectPath:string = (function node_project() {
            const dirs:string[] = __dirname.split(sep);
            return dirs.slice(0, dirs.length - 2).join(sep) + sep;
        }()),
        supersep:string = (sep === "\\")
            ? "\\\\"
            : sep,
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
        tests:simulationItem[] = [
            {
                command: "asdf",
                qualifier: "contains",
                test: `${text.angry}*${text.none} locally installed  - ${text.cyan}node js/services commands${text.none}`
            },
            {
                command: "comm version",
                qualifier: "contains",
                test: "Prints the current version number and date to the shell."
            },
            {
                command: "commands",
                qualifier: "contains",
                test: `Commands are tested using the ${text.green}simulation${text.none} command.`
            },
            {
                command: "commands testprep",
                qualifier: "contains",
                test: `   ${text.cyan}sparser testprep test/sample_code/script/jsx_recurse.txt${text.none}`
            },
            {
                command: "commands version",
                qualifier: "contains",
                test: "Prints the current version number and date to the shell."
            },
            {
                command: "directory",
                qualifier: "contains",
                test: "No path supplied for the directory command."
            },
            {
                command: `directory ".${supersep}" ignore ["node_modules", ".git", ".DS_Store", "2", "3", "beta", "ignore", "sparser"] --verbose`,
                qualifier: "contains",
                test: ` matching items from address `
            },
            {
                command: `directory ${projectPath}js`,
                qualifier: "contains",
                test: `js${supersep}libs${supersep}language.js","file"`
            },
            {
                command: `directory ${projectPath}js 2`,
                qualifier: "contains",
                test: `,"ctime":`
            },
            {
                command: `directory ${projectPath}js ignore ["test"]`,
                qualifier: "not contains",
                test: `js${supersep}test${supersep}simulations.js"`
            },
            {
                command: `directory ${projectPath}js listonly`,
                qualifier: "not contains",
                test: `,"ctime":`
            },
            {
                command: `directory ${projectPath}js typeof`,
                qualifier: "is",
                test: "directory"
            },
            {
                command: `directory typeof ${projectPath}js`,
                qualifier: "is",
                test: "directory"
            },
            {
                command: `directory typeof ${projectPath}js${sep}lexers${sep}style.js`,
                qualifier: "is",
                test: "file"
            },
            {
                command: "get https://duckduckgo.com/",
                qualifier: "contains",
                test: `DDG.page = new DDG.Pages.Home();`
            },
            {
                command: "help",
                qualifier: "contains",
                test: "To see all the supported features try:"
            },
            {
                command: "help 2",
                qualifier: "contains",
                test: "To see more detailed documentation for specific command supply the command name:"
            },
            {
                command: "opts",
                qualifier: "contains",
                test: `${text.angry}* ${text.none + text.cyan}unformatted     ${text.none}: If tags in markup code should be preserved from any manner of alteration.`
            },
            {
                command: "opts 2",
                qualifier: "contains",
                test: `${text.green}17${text.none} matching options.`
            },
            {
                command: "opts type:boolean",
                qualifier: "not contains",
                test: `quote_convert`
            },
            {
                command: "opts lexer:script",
                qualifier: "not contains",
                test: "wrap"
            },
            {
                command: "opts format",
                qualifier: "contains",
                test: `${text.angry}* ${text.none + text.cyan}type      ${text.none}: string`
            },
            {
                command: "opts format 2",
                qualifier: "contains",
                test: `   ${text.angry}- ${text.none + text.cyan}markdown${text.none}: Generates the output in a markdown table.`
            },
            {
                command: "opts tag_merge",
                qualifier: "contains",
                test: `${text.angry}* ${text.none + text.cyan}definition${text.none}: If adjacent start and end tags in markup should be merged into one singleton tag.`
            },
            {
                command: "options lexer:script type:number",
                qualifier: "contains",
                test: `${text.angry}Sparser has no options matching the query criteria.${text.none}`
            },
            {
                command: "options lexer:script type:boolean",
                qualifier: "contains",
                test: `${text.angry}* ${text.none + text.cyan}object_sort${text.none}: Where style properties should be sorted`
            },
            {
                command: "performance hash browser-demo.js",
                qualifier: "contains",
                test: "] Character size"
            },
            {
                command: "performance base64 browser-demo.js",
                qualifier: "contains",
                test: "] Milliseconds, \u00b1"
            },
            {
                command: "performance beautify browser-demo.js",
                qualifier: "contains",
                test: "Pretty Diff version"
            },
            {
                command: "performance build browser-demo.js",
                qualifier: "contains",
                test: "The performance tool cannot test the build command."
            },
            {
                command: "performance performance browser-demo.js",
                qualifier: "contains",
                test: "The performance tool cannot test itself."
            },
            {
                command: "sparser_debug",
                qualifier: "contains",
                test: `${text.green}## Command Line Instruction${text.none}`
            },
            {
                command: "version",
                qualifier: "ends",
                test: " seconds total time"
            },
            {
                command: "version 2",
                qualifier: "begins",
                test: `Sparser version ${text.angry}`
            }
        ];
    module.exports = tests;
}());