/*jslint node:true */
/*eslint-env node*/
/*eslint no-console: 0*/

/* This file exists to consolidate the various Node service offerings in
   this application. */
import { Stats, write } from "fs";
import * as http from "http";
import { totalmem } from "os";
type directoryItem = [string, "file" | "directory" | "link" | "screen", number, number, Stats];
interface directoryList extends Array<directoryItem> {
    [key:number]: directoryItem;
}
(function node() {
    "use strict";
    const startTime:[number, number]      = process.hrtime(),
        node = {
            child : require("child_process").exec,
            crypto: require("crypto"),
            fs    : require("fs"),
            http  : require("http"),
            https : require("https"),
            os    : require("os"),
            path  : require("path")
        },
        cli:string = process.argv.join(" "),
        sep:string = node.path.sep,
        projectPath:string = (function node_project() {
            const dirs:string[] = __dirname.split(sep);
            return dirs.slice(0, dirs.length - 1).join(sep) + sep;
        }()),
        js:string = `${projectPath}js${sep}`,
        libFiles:string[] = [`${js}lexers`, `${js}libs`],
        sparser:sparser = (function node_setSparser():sparser {
            require(`${js}parse.js`);
            return global.sparser;
        }()),
        options:any = sparser.options,
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
        commands:commandList = {
            build: {
                description: "Rebuilds the application.",
                example: [
                    {
                        code: "sparser build",
                        defined: "Compiles from TypeScript into JavaScript and puts librarys together."
                    }
                ]
            },
            commands: {
                description: "List all supported commands to the console or examples of a specific command.",
                example: [
                    {
                        code: "sparser commands",
                        defined: "Lists all commands and their definitions to the shell."
                    },
                    {
                        code: "sparser commands commands",
                        defined: "Details the mentioned command with code examples."
                    }
                ]
            },
            debug: {
                description: "Prepares a formal report in markdown format with information to assist in troubleshooting.",
                example: [{
                    code: "sparser debug",
                    defined: "Generates markdown format report directly to standard output."
                }]
            },
            get: {
                description: "Retrieve a resource via an absolute URI.",
                example: [
                    {
                        code: "sparser get http://example.com/file.txt",
                        defined: "Gets a resource from the web and prints the output to the shell."
                    },
                    {
                        code: "sparser get http://example.com/file.txt path/to/file",
                        defined: "Get a resource from the web and writes the resource as UTF8 to a file at the specified path."
                    }
                ]
            },
            help: {
                description: "Introductory information to Sparser on the command line.",
                example: [{
                    code: "sparser help",
                    defined: "Writes help text to shell."
                }]
            },
            inventory   : {
                description: "List the currently supplied lexers and their language's in language specific logic.",
                example: [{
                    code: "sparser inventory",
                    defined: "The generated list is computed by scraping the code for the 'options.language' data property.  This means the specified supported languages are languages that demand unique instructions.  Other languages that aren't in this list may also be supported.  This command accepts no options."
                }]
            },
            lint: {
                description: "Use ESLint against all JavaScript files in a specified directory tree.",
                example: [
                    {
                        code: "sparser lint ../tools",
                        defined: "Lints all the JavaScript files in that location and in its subdirectories."
                    },
                    {
                        code: "sparser lint",
                        defined: "Specifying no location defaults to the Sparser application directory."
                    },
                    {
                        code: "sparser lint ../tools ignore [node_modules, .git, test, units]",
                        defined: "An ignore list is also accepted if there is a list wrapped in square braces following the word 'ignore'."
                    }
                ]
            },
            options: {
                description: "List all Sparser's options to the console or gather instructions on a specific option.",
                example: [
                    {
                        code: "sparser options",
                        defined: "List all options and their definitions to the shell."
                    },
                    {
                        code: "sparser options performance",
                        defined: "Writes details about the specified option to the shell."
                    },
                    {
                        code: "sparser options api:any lexer:script values",
                        defined: "The option list can be queried against key and value (if present) names. This example will return only options that work with the script lexer, takes specific values, and aren't limited to a certain API environment."
                    }
                ]
            },
            performance: {
                description: "Executes the Sparser application 11 times.  The first execution is dropped and the remaining 10 are averaged.  Specify a complete Sparser terminal command.",
                example: [
                        {
                        code: "sparser performance parse source:\"js/services.js\" method_chain:3",
                        defined: "Just specify the actual command to execute.  Sparser will execute the provided command as though the 'performance' command weren't there."
                    },
                    {
                        code: "sparser performance lint js/lexers",
                        defined: "The command to test may be any command supported by Sparser's terminal services."
                    }
                ]
            },
            server: {
                description: "Launches a HTTP service and web sockets so that the web tool is automatically refreshed once code changes in the local file system.",
                example: [
                    {
                        code: "sparser server",
                        defined: "Launches the server on default port 9999 and web sockets on port 10000."
                    },
                    {
                        code: "sparser server 8080",
                        defined: "If a numeric argument is supplied the web server starts on the port specified and web sockets on the following port."
                    }
                ]
            },
            simulation: {
                description: "Launches a test runner to execute the various commands of the services file.",
                example: [{
                    code: "sparser simulation",
                    defined: "Runs tests against the commands offered by the services file."
                }]
            },
            test: {
                description: "Builds the application and then runs all the test commands",
                example: [{
                    code: "sparser test",
                    defined: "After building the code, it will lint the JavaScript output, test Node.js commands as simulations, and validate the Sparser code units against test samples."
                }]
            },
            testprep: {
                description: "Produces a formatted parse table for the validation test cases.",
                example: [{
                    code: "sparser testprep test/sample_code/script/jsx_recurse.txt",
                    defined: "Produces a parse table for the specified file where each line is a record in object format."
                }]
            },
            validation: {
                description: "Runs Sparser against various code samples and compares the generated output against known good output looking for regression errors.",
                example: [{
                    code: "sparser validation",
                    defined: "Runs the unit test runner against Sparser"
                }]
            },
            version: {
                description: "Prints the current version number and date of prior modification to the console.",
                example: [{
                    code: "sparser version",
                    defined: "Prints the current version number and date to the shell."
                }]
            }
        },
        exclusions = (function node_exclusions():string[] {
            const args = process.argv.join(" "),
                match = args.match(/\signore\s*\[/);
            if (match !== null) {
                const list:string[] = [],
                    listBuilder = function node_exclusions_listBuilder():void {
                        do {
                            if (process.argv[a] === "]" || process.argv[a].charAt(process.argv[a].length - 1) === "]") {
                                if (process.argv[a] !== "]") {
                                    list.push(process.argv[a].replace(/,$/, "").slice(0, process.argv[a].length - 1));
                                }
                                process.argv.splice(igindex, (a + 1) - igindex);
                                break;
                            }
                            list.push(process.argv[a].replace(/,$/, ""));
                            a = a + 1;
                        } while (a < len);
                    };
                let a:number = 0,
                    len:number = process.argv.length,
                    igindex:number = process.argv.indexOf("ignore");
                if (igindex > -1 && igindex < len - 1 && process.argv[igindex + 1].charAt(0) === "[") {
                    a = igindex + 1;
                    if (process.argv[a] !== "[") {
                        process.argv[a] = process.argv[a].slice(1).replace(/,$/, "");
                    }
                    listBuilder();
                } else {
                    do {
                        if (process.argv[a].indexOf("ignore[") === 0) {
                            igindex = a;
                            break;
                        }
                        a = a + 1;
                    } while (a < len);
                    if (process.argv[a] !== "ignore[") {
                        process.argv[a] = process.argv[a].slice(7);
                        if (process.argv[a].charAt(process.argv[a].length - 1) === "]") {
                            list.push(process.argv[a].replace(/,$/, "").slice(0, process.argv[a].length - 1));
                        } else {
                            listBuilder();
                        }
                    }
                }
                return list;
            }
            require(`${js}parse.js`);
            return [];
        }()),
        apps:any = {};
    let verbose:boolean = false,
        errorflag:boolean = false,
        command:string = (function node_command():string {
            let comkeys:string[] = Object.keys(commands),
                filtered:string[] = [],
                a:number = 0,
                b:number = 0;
            if (process.argv[2] === undefined) {
                console.log("");
                console.log("Sparser requires a command. Try:");
                console.log(`global install - ${text.cyan}sparser help${text.none}`);
                console.log(`local install  - ${text.cyan}node js/services help${text.none}`);
                console.log("");
                console.log("To see a list of commands try:");
                console.log(`global install - ${text.cyan}sparser commands${text.none}`);
                console.log(`local install  - ${text.cyan}node js/services commands${text.none}`);
                console.log("");
                process.exit(1);
                return;
            }
            const arg:string = process.argv[2],
                boldarg:string = text.angry + arg + text.none,
                len:number = arg.length + 1,
                commandFilter = function node_command_commandFilter(item:string):boolean {
                    if (item.indexOf(arg.slice(0, a)) === 0) {
                        return true;
                    }
                    return false;
                };
            
            if (process.argv[2] === "debug") {
                process.argv = process.argv.slice(3);
                return "debug";
            }
            process.argv = process.argv.slice(3);

            // trim empty values
            b = process.argv.length;
            do {
                if (process.argv[a] === "") {
                    process.argv.splice(a, 1);
                    b = b - 1;
                }
                a = a + 1;
            } while (a < b);

            // filter available commands against incomplete input
            a = 1;
            do {
                filtered = comkeys.filter(commandFilter);
                a = a + 1;
            } while (filtered.length > 1 && a < len);

            if (filtered.length < 1 || (filtered[0] === "debug" && filtered.length < 2)) {
                console.log(`Command ${boldarg} is not a supported command.`);
                console.log("");
                console.log("Please try:");
                console.log(`  ${text.angry}*${text.none} globally installed - ${text.cyan}sparser commands${text.none}`);
                console.log(`  ${text.angry}*${text.none} locally installed  - ${text.cyan}node js/services commands${text.none}`);
                console.log("");
                process.exit(1);
                return "";
            }
            if (filtered.length > 1 && apps[arg] !== undefined) {
                console.log(`Command '${boldarg}' is ambiguous as it could refer to any of: [${text.cyan + filtered.join(", ") + text.none}]`);
                process.exit(1);
                return "";
            }
            if (arg !== filtered[0]) {
                console.log("");
                console.log(`${boldarg} is not a supported command. Sparser is assuming command ${text.bold + text.cyan + filtered[0] + text.none}.`);
                console.log("");
            }
            return filtered[0];
        }()),
        writeflag:string = ""; // location of written assets in case of an error and they need to be deleted

    (function node_args():void {
        const requireDir = function node_args_requireDir(item:string):void {
                let counts = {
                    items: 0,
                    total: 0
                };
                const dirlist:string[] = item.split(sep),
                    dirname:string = (dirlist[dirlist.length - 1] === "")
                        ? dirlist[dirlist.length - 2]
                        : dirlist[dirlist.length - 1],
                    completeTest = function node_args_requireDir_completeTest(filesLength:number):boolean {
                        counts.total = counts.total + filesLength;
                        if (counts.total === counts.items) {
                            dirs = dirs + 1;
                            if (dirs === dirstotal) {
                                if (process.argv.length > 0) {
                                    readOptions();
                                }
                                apps[command]();
                            }
                            return true;
                        }
                        return false;
                    },
                    readdir = function node_args_requireDir_dirwrapper(start:string):void {
                        node.fs.stat(start, function node_args_requireDir_dirwrapper_stat(ers:Error, stat:Stats):void {
                            if (ers !== null) {
                                console.log(ers.toString());
                                process.exit(1);
                                return;
                            }
                            if (stat.isDirectory() === true) {
                                sparser[dirname] = {};
                                node.fs.readdir(start, function node_args_requireDir_dirwrapper_stat_readdir(err:Error, files:string[]) {
                                    if (err !== null) {
                                        console.log(err.toString());
                                        process.exit(1);
                                        return;
                                    }
                                    if (completeTest(files.length) === true) {
                                        return;
                                    }
                                    files.forEach(function node_args_requireDir_dirwrapper_stat_readdir_each(value:string) {
                                        const valpath:string = start + sep + value;
                                        node.fs.stat(valpath, function node_args_requireDir_dirwrapper_stat_readdir_each_stat(errs:Error, stats:Stats):void {
                                            if (errs !== null) {
                                                console.log(errs.toString());
                                                process.exit(1);
                                                return;
                                            }
                                            if (stats.isFile() === true) {
                                                require(valpath);
                                                counts.items = counts.items + 1;
                                            } else if (stats.isDirectory() === true) {
                                                node_args_requireDir_dirwrapper(valpath);
                                            } else {
                                                counts.items = counts.items + 1;
                                            }
                                            if (completeTest(0) === true) {
                                                return;
                                            }
                                        });
                                    });
                                });
                            }
                            if (stat.isFile() === true) {
                                require(item);
                                if (completeTest(0) === true) {
                                    return;
                                }
                            }
                        });
                    };
                dirstotal = dirstotal + 1;
                readdir(item);
            },
            readOptions = function node_args_readOptions():void {
                const list:string[] = process.argv,
                    def:optionDef = sparser.libs.optionDef,
                    keys:string[] = Object.keys(def),
                    obj = options,
                    optionName = function node_args_optionName(bindArgument:boolean):void {
                        if (a === 0 || options[list[a]] === undefined) {
                            if (keys.indexOf(list[a]) < 0 && options[list[a]] === undefined) {
                                list.splice(a, 1);
                                len = len - 1;
                                a = a - 1;
                            }
                            return;
                        }
                        if (bindArgument === true && list[a + 1] !== undefined && list[a + 1].length > 0) {
                            list[a] = `${list[a]}:${list[a + 1]}`;
                            list.splice(a + 1, 1);
                            len = len - 1;
                        }
                        list.splice(0, 0, list[a]);
                        list.splice(a + 1, 1);
                    };
                let split:string = "",
                    value:string = "",
                    name:string = "",
                    a:number = 0,
                    si:number = 0,
                    len:number = list.length;
                do {
                    list[a] = list[a].replace(/^(-+)/, "");
                    if (list[a] === "verbose") {
                        verbose = true;
                        list.splice(a, 1);
                        len = len - 1;
                        a = a - 1;
                    } else {
                        si = list[a].indexOf("=");
                        if (
                            si > 0 &&
                            (list[a].indexOf("\"") < 0 || si < list[a].indexOf("\"")) &&
                            (list[a].indexOf("'") < 0 || si < list[a].indexOf("'")) &&
                            (si < list[a].indexOf(":") || list[a].indexOf(":") < 0)
                        ) {
                            split = "=";
                        } else {
                            split = ":";
                        }
                        if (list[a + 1] === undefined) {
                            si = 99;
                        } else {
                            si = list[a + 1].indexOf(split);
                        }
                        if (
                            obj[list[a]] !== undefined &&
                            list[a + 1] !== undefined &&
                            obj[list[a + 1]] === undefined &&
                            (
                                si < 0 || 
                                (si > list[a + 1].indexOf("\"") && list[a + 1].indexOf("\"") > -1) ||
                                (si > list[a + 1].indexOf("'") && list[a + 1].indexOf("'") > -1)
                            )
                        ) {
                            if (command === "options") {
                                optionName(true);
                            } else {
                                options[list[a]] = list[a + 1];
                                a = a + 1;
                            }
                        } else if (list[a].indexOf(split) > 0 || (list[a].indexOf(split) < 0 && list[a + 1] !== undefined && (list[a + 1].charAt(0) === ":" || list[a + 1].charAt(0) === "="))) {
                            if (list[a].indexOf(split) > 0) {
                                name = list[a].slice(0, list[a].indexOf(split)).toLowerCase();
                                value = list[a].slice(list[a].indexOf(split) + 1);
                            } else {
                                name = list[a].toLowerCase();
                                value = list[a + 1].slice(1);
                                list.splice(a + 1, 1);
                                len = len - 1;
                            }
                            if (command === "options") {
                                if (keys.indexOf(name) > -1) {
                                    if (value !== undefined && value.length > 0) {
                                        list[a] = `${name}:${value}`;
                                    } else {
                                        list[a] = name;
                                    }
                                } else {
                                    list.splice(a, 1);
                                    len = len - 1;
                                }
                            } else if (options[name] !== undefined) {
                                if (value === "true" && def[name].type === "boolean") {
                                    options[name] = true;
                                } else if (value === "false" && def[name].type === "boolean") {
                                    options[name] = false;
                                } else if (isNaN(Number(value)) === false && def[name].type === "number") {
                                    options[name] = Number(value);
                                } else if (def[name].values !== undefined && def[name].values[value] !== undefined) {
                                    options[name] = value;
                                } else if (def[name].values === undefined) {
                                    options[name] = value;
                                }
                            }
                        } else if (command === "options") {
                            optionName(false);
                        }
                    }
                    a = a + 1;
                } while (a < len);
                if (options.source === "" && process.argv.length > 0 && process.argv[0].indexOf("=") < 0 && process.argv[0].replace(/^[a-zA-Z]:\\/, "").indexOf(":") < 0) {
                    if (command === "performance") {
                        options.source = (process.argv.length < 1)
                            ? ""
                            : process.argv[1];
                    } else {
                        options.source = process.argv[0];
                    }
                }
            };
        let dirs:number = 0,
            dirstotal:number = 0;
        options.api = "node";
        options.binary_check = (
            // eslint-disable-next-line
            /\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u000b|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g
        );
        libFiles.forEach(function node_args_each(value:string) {
            requireDir(value);
        });
    }());

    // build system
    apps.build = function node_apps_build(test:boolean):void {
        let firstOrder:boolean = true,
            sectionTime:[number, number] = [0, 0];
        const order = {
                build: [
                    "npminstall",
                    "typescript",
                    "libraries",
                    "demo",
                    "options_markdown"
                ],
                test: [
                    "lint",
                    "simulation",
                    "validation"
                ]
            },
            type:string = (test === true)
                ? "test"
                : "build",
            orderlen:number = order[type].length,
            def:optionDef = sparser.libs.optionDef,
            optkeys:string[] = Object.keys(def),
            keyslen:number = optkeys.length,
            heading = function node_apps_build_heading(message:string):void {
                if (firstOrder === true) {
                    console.log("");
                    firstOrder = false;
                } else if (order[type].length < orderlen) {
                    console.log("________________________________________________________________________");
                    console.log("");
                }
                console.log(text.cyan + message + text.none);
                console.log("");
            },
            sectionTimer = function node_apps_build_sectionTime(input:string):void {
                let now:string[] = input.replace(`${text.cyan}[`, "").replace(`]${text.none} `, "").split(":"),
                    numb:[number, number] = [(Number(now[0]) * 3600) + (Number(now[1]) * 60) + Number(now[2].split(".")[0]), Number(now[2].split(".")[1])],
                    difference:[number, number],
                    times:string[] = [],
                    time:number = 0,
                    str:string = "";
                difference = [numb[0] - sectionTime[0], (numb[1] + 1000000000) - (sectionTime[1] + 1000000000)];
                sectionTime = numb;
                if (difference[1] < 0) {
                    difference[0] = difference[0] - 1;
                    difference[1] = difference[1] + 1000000000;
                }
                if (difference[0] < 3600) {
                    times.push("00");
                } else {
                    time = Math.floor(difference[0] / 3600);
                    difference[0] = difference[0] - (time * 3600);
                    if (time < 10) {
                        times.push(`0${time}`);
                    } else {
                        times.push(String(time));
                    }
                }
                if (difference[0] < 60) {
                    times.push("00");
                } else {
                    time = Math.floor(difference[0] / 60);
                    difference[0] = difference[0] - (time * 60);
                    if (time < 10) {
                        times.push(`0${time}`);
                    } else {
                        times.push(String(time));
                    }
                }
                if (difference[0] < 1) {
                    times.push("00");
                } else if (difference[0] < 10) {
                    times.push(`0${difference[0]}`);
                } else {
                    times.push(String(difference[0]));
                }
                str = String(difference[1]);
                if (str.length < 9) {
                    do {
                        str = `0${str}`;
                    } while (str.length < 9);
                }
                times[2] = `${times[2]}.${str}`;
                console.log(`${text.cyan + text.bold}[${times.join(":")}]${text.none} ${text.green}Total section time.${text.none}`);
            },
            next = function node_apps_build_next(message:string):void {
                let phase = order[type][0],
                    time:string = apps.humantime(false);
                if (message !== "") {
                    console.log(time + message);
                    sectionTimer(time);
                }
                if (order[type].length < 1) {
                    verbose = true;
                    heading(`${text.none}All ${text.green + text.bold + type + text.none} tasks complete... Exiting clean!\u0007`);
                    apps.log([""], "");
                    process.exit(0);
                    return;
                }
                order[type].splice(0, 1);
                phases[phase]();
            },
            injection = function node_apps_build_injection(inject:inject):string {
                const thirds:[string, string, string] = [
                    inject.file.slice(0, inject.file.indexOf(inject.start) + inject.start.length) + node.os.EOL,
                    inject.message,
                    inject.file.slice(inject.file.indexOf(inject.end))
                ];
                return thirds.join("");
            },
            // These are all the parts of the execution cycle, but their order is dictated by the 'order' object.
            phases = {
                // add version and option data to the demo tool html
                demo: function node_apps_build_demo():void {
                    heading("Adding version and options to the demo tool");
                    node.fs.readFile(`${projectPath}demo${sep}index.xhtml`, "utf8", function node_apps_build_demo_read(er:Error, html:string):void {
                        const opts:string[] = ["<ul>"];
                        let a:number = 0,
                            b:number = 0,
                            optName:string = "",
                            opt:option,
                            vals:string[] = [],
                            vallen:number = 0,
                            select:boolean = false;
                        if (er !== null) {
                            apps.errout([er.toString()]);
                            return;
                        }
                        do {
                            optName = optkeys[a];
                            if (optName !== "source") {
                                opt = def[optName];
                                opts.push(`<li id="${optName}">`);
                                if (opt.type === "boolean") {
                                    opts.push(`<h3>${opt.label}</h3>`);
                                    if (opt.default === true) {
                                        opts.push(`<span><input type="radio" id="option-false-${optName}" name="option-${optName}" value="false"/> <label for="option-false-${optName}">false</label></span>`);
                                        opts.push(`<span><input type="radio" checked="checked" id="option-true-${optName}" name="option-${optName}" value="true"/> <label for="option-true-${optName}">true</label></span>`);
                                    } else {
                                        opts.push(`<span><input type="radio" checked="checked" id="option-false-${optName}" name="option-${optName}" value="false"/> <label for="option-false-${optName}">false</label></span>`);
                                        opts.push(`<span><input type="radio" id="option-true-${optName}" name="option-${optName}" value="true"/> <label for="option-true-${optName}">true</label></span>`);
                                    }
                                    select = false;
                                } else {
                                    opts.push(`<h3><label for="option-${optName}" class="label">${opt.label}</label></h3>`);
                                    if (opt.type === "number" || (opt.type === "string" && opt.values === undefined)) {
                                        opts.push(`<input type="text" id="option-${optName}" value="${opt.default}" data-type="${opt.type}"/>`);
                                        select = false;
                                    } else {
                                        opts.push(`<select id="option-${optName}">`);
                                        if (optName === "format") {
                                            opts.push("<option data-description=\"html\" selected=\"selected\">html</option>");
                                        }
                                        vals = Object.keys(opt.values);
                                        vallen = vals.length;
                                        b = 0;
                                        do {
                                            opts.push(`<option data-description="${opt.values[vals[b]].replace(/"/g, "&quot;")}" ${
                                                (opt.default === vals[b] && optName !== "format")
                                                    ? "selected=\"selected\""
                                                    : ""
                                            }>${vals[b]}</option>`);
                                            b = b + 1;
                                        } while (b < vallen);
                                        opts.push(`</select>`);
                                        select = true;
                                    }
                                }
                                opts.push("<table><tbody>");
                                opts.push(`<tr><th>Name</th><td class="option-name">${optName}</td></tr>`);
                                opts.push(`<tr><th>Type</th><td>${def[optName].type}</td></tr>`);
                                opts.push(`<tr><th>Default</th><td>${def[optName].default.toString()}</td></tr>`);
                                opts.push("<tr><th>Usage</th><td class=\"option-usage\">");
                                if (def[optName].lexer[0] === "all") {
                                    opts.push(`options.${optName}`);
                                } else {
                                    b = 0;
                                    vallen = def[optName].lexer.length;
                                    if (vallen < 2) {
                                        opts.push(`options.lexer_options.<strong>${def[optName].lexer[b]}</strong>.${optName}`);
                                    } else {
                                        vals = [];
                                        do {
                                            vals.push(`<span>options.lexer_options.<strong>${def[optName].lexer[b]}</strong>.${optName}</span>`);
                                            b = b + 1;
                                        } while (b < vallen);
                                        opts.push(vals.join(""));
                                    }
                                }
                                opts.push("</td></tr>");
                                opts.push(`<tr><th>Description</th><td class="option-description">${opt.definition.replace(/"/g, "&quot;")}`);
                                if (select === true) {
                                    if (optName === "format") {
                                        opts.push(` <span>&bullet; <strong>html</strong> &#8212; Renders the output into an HTML table. This option value is only available in this demo tool.</span>`);
                                    } else if (opt.values[String(opt.default)].indexOf("example: ") > 0) {
                                        opts.push(` <span>&bullet; <strong>${opt.default}</strong> &#8212; ${opt.values[String(opt.default)].replace("example: ", "example: <code>").replace(/\.$/, "</code>.")}</span>`);
                                    } else {
                                        opts.push(` <span>&bullet; <strong>${opt.default}</strong> &#8212; ${opt.values[String(opt.default)]}</span>`);
                                    }
                                }
                                opts.push("</td></tr></tbody></table>");
                                opts.push(`</li>`);
                            }
                            a = a + 1;
                        } while (a < keyslen);
                        opts.push("</ul>");
                        html = injection({
                            end: "<!-- option data end -->",
                            file: html.replace(/<p\s+class="version">\d+\.\d+\.\d+<\/p>/, `<p class="version">${sparser.version.number}</p>`),
                            message: opts.join(""),
                            start: "<!-- option data start -->"
                        });
                        node.fs.writeFile(`${projectPath}demo${sep}index.xhtml`, html, {
                            encoding: "utf8"
                        }, function node_apps_build_demo_read_write(erw:Error):void {
                            if (erw !== null) {
                                apps.errout([erw.toString()]);
                                return;
                            }
                            next(`${text.green}Demo tool updated with currention options and version number.${text.none}`);
                        });
                    });
                },
                // read JS files and combine them into fewer JS files
                libraries: function node_apps_build_libraries():void {
                    const libfiles:string[] = [],
                        opts:[string, string] = (function node_apps_build_libraries_modifyFile_read_buildDefault():[string, string] {
                            const obj:any = {
                                    lexer_options: {}
                                };
                            let a:number = 0,
                                b:number = 0,
                                lexlen:number = 0;
                            do {
                                if (def[optkeys[a]].lexer[0] === "all") {
                                    obj[optkeys[a]] = def[optkeys[a]].default;
                                } else {
                                    b = 0;
                                    lexlen = def[optkeys[a]].lexer.length;
                                    do {
                                        if (obj.lexer_options[def[optkeys[a]].lexer[b]] === undefined) {
                                            obj.lexer_options[def[optkeys[a]].lexer[b]] = {};
                                        }
                                        obj.lexer_options[def[optkeys[a]].lexer[b]][optkeys[a]] = def[optkeys[a]].default;
                                        b = b + 1;
                                    } while (b < lexlen);
                                }
                                a = a + 1;
                            } while (a < keyslen);
                            return [JSON.stringify(obj), ""];
                        }()),
                        write = function node_apps_build_libraries_write():void {
                            const message:string = `${text.green}Files modified and combined for easy use.${text.none}`;
                            parsefile = parsefile + libfiles.join("");
                            node.fs.writeFile(`${js}parse.js`, `${parsefile}global.sparser=sparser;}());`, "utf8", function node_apps_build_libraries_appendFile_read_writeParse(erp:Error) {
                                const browserfile:string = `${parsefile.replace(/global\.sparser/g, "window.sparser")}window.sparser=sparser;}());`;
                                if (erp !== null) {
                                    apps.error([erp.toString()]);
                                    return;
                                }
                                node.fs.writeFile(`${js}browser.js`, browserfile, "utf8", function node_apps_build_libraries_appendFile_read_writeParse_writeBrowser(erb:Error) {
                                    if (erb !== null) {
                                        apps.error([erb.toString()]);
                                        return;
                                    }
                                    node.fs.writeFile(`${js}demo${sep}demo.js`, `${browserfile.replace(/\}\(\)\);\s*$/, "") + demofile}}());`, "utf8", function node_apps_build_libraries_appendFile_read_writeParse_writeBrowser_writeDemo(ers:Error) {
                                        if (ers !== null) {
                                            apps.error([ers.toString()]);
                                            return;
                                        }
                                        next(message);
                                    });
                                });
                            });
                        },
                        appendFile = function node_apps_build_libraries_appendFile(filePath:string):void {
                            node.fs.readFile(filePath, "utf8", function node_apps_build_libraries_appendFile_read(errr:Error, filedata:string):void {
                                const filenames:string[] = filePath.split(sep),
                                    filename:string = filenames[filenames.length - 1];
                                if (errr !== null) {
                                    apps.errout([errr.toString()]);
                                    return;
                                }
                                if (filename !== "browser.js" && filename !== "all.js") {
                                    filedata = filedata
                                        .replace(/\/\*\s*global \w+(\s*,\s*\w+)*\s*\*\//, "")
                                        .replace(/^\s+/, "");
                                    if (filename === "demo.js") {
                                        demofile = filedata
                                            .replace(/("|')use strict("|');/g, "");
                                    } else if (filename === "parse.js") {
                                        parsefile = filedata
                                            .replace(/global\.sparser/g, "sparser")
                                            .replace(/sparser\s*=\s*sparser;?\s*\}\(\)\);\s*$/, "")
                                            .replace(/options\s*:\s*\{\},/, `options:${opts[0]},`)
                                            .replace(/version\s*:\s*\{(\s*((date)|(number))\s*:\s*("|'){2}\s*,?\s*){2}\}/, `version:${opts[1]}`);
                                    } else {
                                        libfiles.push(filedata
                                            .replace(/global\.sparser/g, "sparser")
                                            .replace(/("|')use strict("|');/g, "")
                                            .replace(/const\s+sparser\s*=\s*sparser\s*,\s*/, "const "));
                                    }
                                }
                                a = a + 1;
                                if (a === filelen) {
                                    write();
                                }
                            });
                        },
                        stat = function node_apps_build_libraries_libraryFiles_stat(pathitem:string):void {
                            node.fs.stat(pathitem, function node_apps_build_libraries_libraryFiles_stat_callback(errs:Error, stats:Stats):void {
                                if (errs !== null) {
                                    apps.errout([errs.toString()]);
                                    return;
                                }
                                if (stats.isDirectory() === true) {
                                    node.fs.readdir(pathitem, "utf8", function node_apps_build_libraries_libraryFiles_stat_callback_readdir(errd:Error, filelist:string[]):void {
                                        if (errd !== null) {
                                            apps.errout([errd.toString()]);
                                            return;
                                        }
                                        filelen = filelen + (filelist.length - 1);
                                        filelist.forEach(function node_apps_build_libraries_libraryFiles_stat_callback_readdir_each(value:string):void {
                                            node_apps_build_libraries_libraryFiles_stat(pathitem + sep + value);
                                        });
                                    });
                                } else if (stats.isFile() === true) {
                                    if (pathitem.slice(pathitem.length - 3) === ".js") {
                                        appendFile(pathitem);
                                    }
                                }
                            });
                        };
                    let a:number = 0,
                        filelen: number = 0,
                        demofile:string = "",
                        parsefile:string = "";
                    heading("Merging files for simplified application access.");
                    libFiles.push(`${js}parse.js`);
                    libFiles.push(`${js}demo${sep}demo.js`);
                    filelen = libFiles.length;
                    (function node_apps_build_libraries_versionGather():void {
                        node.child(`git log -1 --branches`, function node_apps_build_libraries_versionGather_child(err:Error, stderr:string):void {
                            if (err !== null) {
                                apps.errout([err.toString()]);
                                return;
                            }
                            const date:string[] = stderr.slice(stderr.indexOf("Date:") + 12).split(" "),
                                datestr:string = `${date[1]} ${date[0]} ${date[3]}`;
                            let number:string = "";
                            node.fs.readFile(`${projectPath}package.json`, "utf8", function node_apps_build_libraries_versionGather_child_readPackage(errp:Error, data:string):void {
                                if (errp !== null) {
                                    apps.errout([errp.toString()]);
                                    return;
                                }

                                number = JSON.parse(data).version;
                                // update information for display in current build
                                sparser.version.date = datestr;
                                sparser.version.number = number;
                                opts[1] = `{date:"${datestr}",number:"${number}"}`;
                                libFiles.forEach(function node_apps_build_libraries_libraryFiles_each(value:string) {
                                    stat(value);
                                });
                            });
                        })
                    }());
                },
                // phase lint is merely a call to apps.lint
                lint     : function node_apps_build_lint():void {
                    const callback = function node_apps_build_lint_callback(message:string):void {
                        next(message);
                    };
                    heading("Linting");
                    apps.lint(callback);
                },
                // phase npminstall checks if dependencies are absent
                npminstall: function node_apps_build_npminstall():void {
                    heading("First Time Developer Dependency Installation");
                    node.fs.stat(`${projectPath}node_modules${sep}ace-builds`, function node_apps_build_npminstall_stat(errs:Error):void {
                        if (errs !== null) {
                            if (errs.toString().indexOf("no such file or directory") > 0) {
                                node.child("npm install", {
                                    cwd: projectPath
                                }, function node_apps_build_npminstall_stat_child(err:Error, stdout:string, stderr:string) {
                                    if (err !== null) {
                                        apps.errout([err.toString()]);
                                        return;
                                    }
                                    if (stderr !== "") {
                                        apps.errout([stderr]);
                                        return;
                                    }
                                    next(`${text.green}Installed dependencies.${text.none}`);
                                });
                            } else {
                                apps.errout([errs.toString()]);
                                return;
                            }
                        } else {
                            next(`${text.green}Dependencies appear to be already installed...${text.none}`);
                        }
                    });
                },
                // phase optionsMarkdown builds a markdown file of options documentation
                options_markdown: function node_apps_build_optionsMarkdown():void {
                    const doc:string[] = ["# Sparser Options"],
                        lexers:lexerDoc = {},
                        lexerWrite = function node_apps_build_optionsMarkdown_lexerWrite():void {
                            const lexkeys:string[] = Object.keys(lexers);
                            files = lexkeys.length + 1;
                            lexkeys.forEach(function node_apps_build_optionsMarkdown_lexerWrite_each(lexname:string):void {
                                node.fs.readFile(`${projectPath}lexers${sep + lexname}.md`, {
                                    encoding: "utf8"
                                }, function node_apps_build_optionsMarkdown_lexersWrite_each_read(er:Error, filedata:string):void {
                                    if (er !== null) {
                                        apps.errout([er.toString()]);
                                        return;
                                    }
                                    const lex:string = (/# Lexer - \w+/).exec(filedata)[0].replace("# Lexer - ", ""),
                                        lenx:number = lexers[lex].length,
                                        output:string[] = [`## ${lex} options`];
                                    let aa:number = 0,
                                        bb:number = 0,
                                        vallen:number = 0,
                                        valkey:string[] = [];
                                    filedata = filedata.slice(0, filedata.indexOf(`## ${lex} options`));
                                    if (lenx > 0) {
                                        do {
                                            output.push(`* **${lexers[lex][aa]}**: ${def[lexers[lex][aa]].definition}`);
                                            output.push(`   - type: ${def[lexers[lex][aa]].type}`);
                                            output.push(`   - default: ${def[lexers[lex][aa]].default}`);
                                            if (def[lexers[lex][aa]].values !== undefined) {
                                                output.push(`   - values:`);
                                                bb = 0;
                                                valkey = Object.keys(def[lexers[lex][aa]].values);
                                                vallen = valkey.length;
                                                do {
                                                    output.push(`      * *${valkey[bb]}*: ${def[lexers[lex][aa]].values[valkey[bb]]}`);
                                                    bb = bb + 1;
                                                } while (bb < vallen);
                                            }
                                            aa = aa + 1;
                                        } while (aa < lenx);
                                    } else {
                                        output.push("This lexer does not currently support any lexer specific options.");
                                    }
                                    filedata = filedata + output.join("\n");
                                    node.fs.writeFile(`${projectPath}lexers${sep + lex}.md`, filedata, "utf8", function node_apps_build_optionsMarkdown_lexersWrite_each_read_write(erw:Error):void {
                                        if (erw !== null) {
                                            apps.errout([erw.toString()]);
                                            return;
                                        }
                                        files = files - 1;
                                        if (files < 1) {
                                            next(`${text.green}Options documentation successfully written to markdown file.${text.none}`);
                                        }
                                    });
                                });
                            });
                        };
                    let a:number = 0,
                        b:number = 0,
                        files:number = 0,
                        lenv:number = 0,
                        vals:string[] = [],
                        valstring:string[] = [];
                    heading("Writing options documentation in markdown format.");
                    do {
                        doc.push("");
                        doc.push(`## ${optkeys[a]}`);
                        doc.push("property   | value");
                        doc.push("-----------|---");
                        doc.push(`default    | ${def[optkeys[a]].default}`);
                        doc.push(`definition | ${def[optkeys[a]].definition}`);
                        doc.push(`label      | ${def[optkeys[a]].label}`);
                        doc.push(`lexer      | ${def[optkeys[a]].lexer.join(", ")}`);
                        doc.push(`type       | ${def[optkeys[a]].type}`);
                        if (def[optkeys[a]].lexer[0] === "all") {
                            doc.push(`use        | options.${optkeys[a]}`);
                        } else {
                            vals = [];
                            b = 0;
                            lenv = def[optkeys[a]].lexer.length;
                            do {
                                vals.push(`options.lexer_options.**${def[optkeys[a]].lexer[b]}**.${optkeys[a]}`);
                                if (lexers[def[optkeys[a]].lexer[b]] === undefined) {
                                    lexers[def[optkeys[a]].lexer[b]] = [];
                                }
                                lexers[def[optkeys[a]].lexer[b]].push(optkeys[a]);
                                b = b + 1;
                            } while (b < lenv);
                            doc.push(`use        | ${vals.join(" \\| ")}`);
                        }
                        if (def[optkeys[a]].values !== undefined) {
                            vals = Object.keys(def[optkeys[a]].values);
                            valstring = [`values | ${vals[0]}`];
                            b = 1;
                            lenv = vals.length;
                            do {
                                valstring.push(vals[b]);
                                b = b + 1;
                            } while (b < lenv);
                            doc.push(valstring.join(", "));
                            b = 0;
                            doc.push("");
                            doc.push("### Value Definitions");
                            do {
                                doc.push(`* **${vals[b]}** - ${def[optkeys[a]].values[vals[b]].replace("example: ", "example: `").replace(/.$/, "`.")}`);
                                b = b + 1;
                            } while (b < lenv);
                        }
                        a = a + 1;
                    } while (a < keyslen);
                    lexerWrite();
                    node.fs.writeFile(`${projectPath}docs${sep}options.md`, doc.join("\n"), "utf8", function node_apps_build_optionsMarkdown_writeFile(err:Error) {
                        if (err !== null) {
                            apps.errout([err.toString()]);
                            return;
                        }
                        files = files - 1;
                        if (files < 1) {
                            next(`${text.green}Options documentation successfully written to markdown file.${text.none}`);
                        }
                    });
                },
                // phase simulation is merely a call to apps.simulation
                simulation: function node_apps_build_simulation():void {
                    const callback = function node_apps_build_lint_callback(message:string):void {
                        next(message);
                    };
                    heading("Simulations of Node.js commands from js/services.js");
                    apps.simulation(callback);
                },
                // phase typescript compiles the working code into JavaScript
                typescript: function node_apps_build_typescript():void {
                    const flag = {
                            services: false,
                            typescript: false
                        },
                        ts = function node_apps_build_typescript_ts() {
                            node.child("tsc --pretty", {
                                cwd: projectPath
                            }, function node_apps_build_typescript_callback(err:Error, stdout:string, stderr:string):void {
                                if (stdout !== "" && stdout.indexOf(` \u001b[91merror${text.none} `) > -1) {
                                    console.log(`${text.red}TypeScript reported warnings.${text.none}`);
                                    apps.errout([stdout]);
                                    return;
                                }
                                if (err !== null) {
                                    apps.errout([err.toString()]);
                                    return;
                                }
                                if (stderr !== "") {
                                    apps.errout([stderr]);
                                    return;
                                }
                                next(`${text.green}TypeScript build completed without warnings.${text.none}`);
                            });
                        };
                    heading("TypeScript Compilation");
                    node.fs.stat(`${projectPath}services.ts`, function node_apps_build_typescript_services(err:Error) {
                        if (err !== null) {
                            if (err.toString().indexOf("no such file or directory") > 0) {
                                flag.services = true;
                                if (flag.typescript === true) {
                                    next(`${text.angry}TypeScript code files not present.${text.none}`);
                                }
                            } else {
                                apps.errout([err]);
                                return;
                            }
                        } else {
                            flag.services = true;
                            if (flag.typescript === true) {
                                ts();
                            }
                        }
                    });
                    node.child("tsc --version", function node_apps_build_typescript_tsc(err:Error, stdout:string, stderr:string) {
                        if (err !== null) {
                            const str = err.toString();
                            if (str.indexOf("command not found") > 0 || str.indexOf("is not recognized") > 0) {
                                console.log(`${text.angry}TypeScript does not appear to be installed.${text.none}`);
                                flag.typescript = true;
                                if (flag.services === true) {
                                    next(`${text.angry}Install TypeScript with this command: ${text.green}npm install typescript -g${text.none}`);
                                }
                            } else {
                                apps.errout([err.toString(), stdout]);
                            }
                        } else {
                            if (stderr !== "") {
                                apps.errout([stderr]);
                                return;
                            }
                            flag.typescript = true;
                            if (flag.services === true) {
                                ts();
                            }
                        }
                    });
                },
                // phase validation is merely a call to apps.validation
                validation: function node_apps_build_validation():void {
                    const callback = function node_apps_build_lint_callback(message:string):void {
                        next(message);
                    };
                    heading("Sparser validation tests");
                    apps.validation(callback);
                }
            };
        next("");
    };
    // CLI commands documentation generator
    apps.commands = function node_apps_commands():void {
        const output:string[] = [];
        verbose = true;
        if (commands[process.argv[0]] === undefined) {
            // all commands in a list
            apps.lists({
                emptyline: false,
                heading: "Commands",
                obj: commands,
                property: "description"
            });
        } else {
            // specificly mentioned option
            const comm:any = commands[process.argv[0]],
                len:number = comm.example.length,
                plural:string = (len > 1)
                    ? "s"
                    : "";
            let a:number = 0;
            output.push(`${text.bold + text.underline}Sparser - Command: ${text.green + process.argv[0] + text.none}`);
            output.push("");
            output.push(comm.description);
            output.push("");
            output.push(`${text.underline}Example${plural + text.none}`);
            do {
                apps.wrapit(output, comm.example[a].defined);
                output.push(`   ${text.cyan + comm.example[a].code + text.none}`);
                output.push("");
                a = a + 1;
            } while (a < len);
            apps.log(output, "");
        }
    };
    // converts numbers into a string of comma separated triplets
    apps.commas = function node_apps_commas(number:number):string {
        const str:string = String(number);
        let arr:string[] = [],
            a:number   = str.length;
        if (a < 4) {
            return str;
        }
        arr = String(number).split("");
        a   = arr.length;
        do {
            a      = a - 3;
            arr[a] = "," + arr[a];
        } while (a > 3);
        return arr.join("");
    };
    // for testing the debug report generation
    // * the debug report is a markdown report for posting online
    // to aid with troubleshooting a defect
    apps.debug = function node_apps_debug():void {
        process.argv.push("debug");
        apps.errout(["Debug Command"]);
    };
    // similar to node's fs.readdir, but recursive
    apps.directory = function node_apps_directory(args:readDirectory):void {
        // arguments:
        // * callback - function - the output is passed into the callback as an argument
        // * exclusions - string array - a list of items to exclude
        // * path - string - where to start in the local file system
        // * recursive - boolean - if child directories should be scanned
        // * symbolic - boolean - if symbolic links should be identified
        let dirtest:boolean = false,
            size:number = 0,
            dirs:number = 0;
        const dircount:number[] = [],
            dirnames:string[] = [],
            listonly:boolean = (command === "directory" && process.argv.indexOf("listonly") > -1),
            type:boolean = (function node_apps_directory_typeof():boolean {
                const typeindex:number = process.argv.indexOf("typeof");
                if (command === "directory" && typeindex > -1) {
                    process.argv.splice(typeindex, 1);
                    return true;
                }
                return false;
            }()),
            startPath:string = (function node_apps_directory_startPath():string {
                if (command === "directory") {
                    const len:number = process.argv.length;
                    let a:number = 0;
                    args = {
                        callback: function node_apps_directory_startPath_callback(result:string[]|directoryList) {
                            const output:string[] = [];
                            if (verbose === true) {
                                apps.wrapit(output, `Sparser found ${text.green + apps.commas(result.length) + text.none} matching items from address ${text.cyan + startPath + text.none} with a total file size of ${text.green + apps.commas(size) + text.none} bytes.`);
                            }
                            apps.log(output, JSON.stringify(result));
                        },
                        exclusions: exclusions,
                        path: "",
                        recursive: (process.argv.indexOf("shallow") > -1)
                            ? (function node_apps_directory_startPath_recursive():boolean {
                                process.argv.splice(process.argv.indexOf("shallow"), 1);
                                return false;
                            }())
                            : true,
                        symbolic: (process.argv.indexOf("symbolic") > -1)
                            ? (function node_apps_directory_startPath_symbolic():boolean {
                                process.argv.splice(process.argv.indexOf("symbolic"), 1);
                                return true;
                            }())
                            : false
                    };
                    if (process.argv.length < 1) {
                        apps.errout([
                            "No path supplied for the directory command. For an example please see:",
                            `    ${text.cyan}sparser commands directory${text.none}`
                        ]);
                        return "";
                    }
                    do {
                        if (process.argv[a].indexOf("source:") === 0) {
                            return node.path.resolve(process.argv[a].replace(/source:("|')?/, "").replace(/("|')$/, ""));
                        }
                        a = a + 1;
                    } while (a < len);
                    return node.path.resolve(process.argv[0]);
                }
                return node.path.resolve(args.path);
            }()),
            list:directoryList = [],
            filelist:string[] = [],
            method:string = (args.symbolic === true)
                ? "lstat"
                : "stat",
            dirCounter = function node_apps_directory_dirCounter(item:string):void {
                let dirlist:string[] = item.split(sep),
                    dirpath:string = "",
                    index:number = 0;
                dirlist.pop();
                dirpath = dirlist.join(sep);
                index = dirnames.indexOf(dirpath);
                dircount[index] = dircount[index] - 1;
                if (dircount[index] < 1) {
                    // dircount and dirnames are parallel arrays
                    dircount.splice(index, 1);
                    dirnames.splice(index, 1);
                    dirs = dirs - 1;
                    if (dirs < 1) {
                        if (listonly === true) {
                            args.callback(filelist.sort());
                        } else {
                            args.callback(list);
                        }
                    } else {
                        node_apps_directory_dirCounter(dirpath);
                    }
                }
            },
            statWrapper = function node_apps_directory_wrapper(filepath:string, parent:number):void {
                node.fs[method](filepath, function node_apps_directory_wrapper_stat(er:Error, stat:Stats):void {
                    const angrypath:string = `Filepath ${text.angry + filepath + text.none} is not a file or directory.`,
                        dir = function node_apps_directory_wrapper_stat_dir(item:string):void {
                            node.fs.readdir(item, {encoding: "utf8"}, function node_apps_directory_wrapper_stat_dir_readdirs(erd:Error, files:string[]):void {
                                if (erd !== null) {
                                    apps.errout([erd.toString()]);
                                    return;
                                }
                                const index:number = list.length;
                                if (listonly === true) {
                                    filelist.push(item);
                                } else {
                                    list.push([item, "directory", parent, files.length, stat]);
                                }
                                if (files.length < 1) {
                                    dirCounter(item);
                                } else {
                                    // dircount and dirnames are parallel arrays
                                    dircount.push(files.length);
                                    dirnames.push(item);
                                    dirs = dirs + 1;
                                }
                                files.forEach(function node_apps_directory_wrapper_stat_dir_readdirs_each(value:string):void {
                                    node_apps_directory_wrapper(item + sep + value, index);
                                });
                            });
                        },
                        populate = function node_apps_directory_wrapper_stat_populate(type:"link"|"file"|"directory"):void {
                            if (exclusions.indexOf(filepath.replace(startPath + sep, "")) < 0) {
                                if (listonly === true) {
                                    filelist.push(filepath);
                                } else {
                                    list.push([filepath, type, parent, 0, stat]);
                                }
                            }
                            if (dirs > 0) {
                                dirCounter(filepath);
                            } else {
                                if (listonly === true) {
                                    args.callback(filelist.sort());
                                } else {
                                    args.callback(list);
                                }
                            }
                        };
                    if (er !== null) {
                        if (er.toString().indexOf("no such file or directory") > 0) {
                            if (errorflag === true) {
                                args.callback([]);
                                return;
                            }
                            if (type === true) {
                                apps.log([`Requested artifact, ${text.cyan + startPath + text.none}, ${text.angry}is missing${text.none}.`], "");
                                return;
                            }
                            apps.errout([angrypath]);
                            return;
                        }
                        apps.errout([er.toString()]);
                        return;
                    }
                    if (stat === undefined) {
                        if (type === true) {
                            apps.log([`Requested artifact, ${text.cyan + startPath + text.none}, ${text.angry}is missing${text.none}.`], "");
                            return;
                        }
                        apps.errout([angrypath]);
                        return;
                    }
                    if (stat.isDirectory() === true) {
                        if (type === true) {
                            apps.log(["directory"], "");
                            return;
                        }
                        if ((args.recursive === true || dirtest === false) && exclusions.indexOf(filepath.replace(startPath + sep, "")) < 0) {
                            dirtest = true;
                            dir(filepath);
                        } else {
                            populate("directory");
                        }
                    } else if (stat.isSymbolicLink() === true) {
                        if (type === true) {
                            apps.log(["symbolicLink"], "");
                            return;
                        }
                        populate("link");
                    } else if (stat.isFile() === true || stat.isBlockDevice() === true || stat.isCharacterDevice() === true) {
                        if (type === true) {
                            if (stat.isBlockDevice() === true) {
                                apps.log(["blockDevice"], "");
                            } else if (stat.isCharacterDevice() === true) {
                                apps.log(["characterDevice"], "");
                            } else {
                                apps.log(["file"], "");
                            }
                            return;
                        }
                        size = size + stat.size;
                        populate("file");
                    } else {
                        if (type === true) {
                            if (stat.isFIFO() === true) {
                                apps.log(["FIFO"], "");
                            } else if (stat.isSocket() === true) {
                                apps.log(["socket"], "");
                            } else {
                                apps.log(["unknown"], "");
                            }
                            return;
                        }
                        list[parent][3] = list[parent][3] - 1;
                    }
                });
            };
        statWrapper(startPath, 0);
    };
    // uniform error formatting
    apps.errout = function node_apps_errout(errtext:string[]):void {
        const bell = function node_apps_errout_bell():void {
                apps.humantime(true);
                if (command === "build" || command === "simulation" || command === "validation") {
                    console.log("\u0007"); // bell sound
                } else {
                    console.log("");
                }
                if (command !== "debug") {
                    process.exit(1);
                }
            },
            error = function node_apps_errout_error():void {
                const stack:string = new Error().stack.replace("Error", `${text.cyan}Stack trace${text.none + node.os.EOL}-----------`);
                console.log("");
                console.log(stack);
                console.log("");
                console.log(`${text.angry}Error Message${text.none}`);
                console.log("------------");
                if (errtext[0] === "" && errtext.length < 2) {
                    console.log(`${text.yellow}No error message supplied${text.none}`);
                } else {
                    errtext.forEach(function node_apps_errout_each(value:string):void {
                        console.log(value);
                    });
                }
                console.log("");
                bell();
            },
            debug = function node_apps_errout_debug():void {
                const stack:string = new Error().stack,
                    source:string = options.source,
                    totalmem:number = node.os.totalmem(),
                    freemem:number = node.os.freemem();
                delete options.source;
                console.log("");
                console.log("---");
                console.log("");
                console.log("");
                console.log("# Sparser - Debug Report");
                console.log("");
                console.log(`${text.green}## Error Message${text.none}`);
                if (errtext[0] === "" && errtext.length < 2) {
                    console.log(`${text.yellow}No error message supplied${text.none}`);
                } else {
                    console.log("```");
                    errtext.forEach(function node_apps_errout_each(value:string):void {
                        // eslint-disable-next-line
                        console.log(value.replace(/\u001b/g, "\\u001b"));
                    });
                    console.log("```");
                }
                console.log("");
                console.log(`${text.green}## Stack Trace${text.none}`);
                console.log("```");
                console.log(stack.replace(/\s*Error\s+/, "    "));
                console.log("```");
                console.log("");
                console.log(`${text.green}## Environment${text.none}`);
                console.log(`* OS - **${node.os.platform()} ${node.os.release()}**`);
                console.log(`* Mem - ${apps.commas(totalmem)} - ${apps.commas(freemem)} = **${apps.commas(totalmem - freemem)}**`);
                console.log(`* CPU - ${node.os.arch()} ${node.os.cpus().length} cores`);
                console.log("");
                console.log(`${text.green}## Command Line Instruction${text.none}`);
                console.log("```");
                console.log(cli);
                console.log("```");
                console.log("");
                console.log(`${text.green}## Source Sample${text.none}`);
                console.log("```");
                console.log(source);
                console.log("```");
                console.log("");
                console.log(`${text.green}## Options${text.none}`);
                console.log("```");
                console.log(options);
                console.log("```");
                console.log("");
                console.log(`${text.green}## Time${text.none}`);
                bell();
            };
        errorflag = true;
        if (writeflag !== "") {
            apps.remove(writeflag, error);
            writeflag = "";
        } else if (process.argv.indexOf("debug") > -1) {
            debug();
        } else {
            error();
        }
    };
    // set options from conventions on the file name
    apps.fileOptions = function node_apps_fileOptions(filename:string):void {
        const notes:string[] = filename.split("_"),
            noteslen:number = notes.length,
            lang:[string, string, string] = sparser.libs.language.auto(options.source, "javascript");
        let value:string = "",
            numb:number = 0,
            name:string = "",
            a:number = 0,
            b:number = 1;
        {
            const defkeys:string[] = Object.keys(sparser.libs.optionDef);
            let keylen:number = defkeys.length;
            do {
                keylen = keylen - 1;
                if (defkeys[keylen] !== "source") {
                    if (sparser.libs.optionDef[defkeys[keylen]].lexer[0] === "all") {
                        options[defkeys[keylen]] = sparser.libs.optionDef[defkeys[keylen]].default;
                    } else {
                        a = sparser.libs.optionDef[defkeys[keylen]].lexer.length;
                        do {
                            a = a - 1;
                            options.lexer_options[sparser.libs.optionDef[defkeys[keylen]].lexer[a]][defkeys[keylen]] = sparser.libs.optionDef[defkeys[keylen]].default;
                        } while (a > 0);
                    }
                }
            } while (keylen > 0);
        }
        if (noteslen > 1) {
            do {
                if (b < noteslen - 2 && notes[b].indexOf("-") < 0 && notes[b + 1].indexOf("-") < 0) {
                    name = `${notes[b]}_${notes[b + 1]}_${notes[b + 2].replace(".txt", "")}`;
                    if (name.indexOf("-") > 0) {
                        name = name.slice(0, name.indexOf("-"));
                    }
                    if (sparser.libs.optionDef[name] !== undefined) {
                        notes[b + 2] = `${notes[b]}_${notes[b + 1]}_${notes[b + 2]}`;
                        b = b + 2;
                    } else if (b < noteslen - 1 && notes[b].indexOf("-") < 0) {
                        name = `${notes[b]}_${notes[b + 1].replace(".txt", "")}`;
                        if (name.indexOf("-") > 0) {
                            name = name.slice(0, name.indexOf("-"));
                        }
                        if (sparser.libs.optionDef[name] !== undefined) {
                            notes[b + 1] = `${notes[b]}_${notes[b + 1]}`;
                            b = b + 1;
                        }
                    }
                } else if (b < noteslen - 1 && notes[b].indexOf("-") < 0) {
                    name = `${notes[b]}_${notes[b + 1].replace(".txt", "")}`;
                    if (name.indexOf("-") > 0) {
                        name = name.slice(0, name.indexOf("-"));
                    }
                    if (sparser.libs.optionDef[name] !== undefined) {
                        notes[b + 1] = `${notes[b]}_${notes[b + 1]}`;
                        b = b + 1;
                    }
                }
                notes[b] = notes[b].replace(".txt", "");
                if (notes[b].indexOf("-") > 0 && sparser.libs.optionDef[notes[b].slice(0, notes[b].indexOf("-"))] !== undefined) {
                    value = notes[b].slice(notes[b].indexOf("-") + 1);
                    notes[b] = notes[b].slice(0, notes[b].indexOf("-"));
                    numb = Number(value);
                    if (value === "true" && sparser.libs.optionDef[notes[b]].type === "boolean") {
                        if (sparser.libs.optionDef[notes[b]].lexer[0] === "all") {
                            options[notes[b]] = true;
                        } else {
                            a = sparser.libs.optionDef[notes[b]].lexer.length;
                            do {
                                a = a - 1;
                                options.lexer_options[sparser.libs.optionDef[notes[b]].lexer[a]][notes[b]] = true;
                            } while (a > 0);
                        }
                    } else if (value === "false" && sparser.libs.optionDef[notes[b]].type === "boolean") {
                        if (sparser.libs.optionDef[notes[b]].lexer[0] === "all") {
                            options[notes[b]] = false;
                        } else {
                            a = sparser.libs.optionDef[notes[b]].lexer.length;
                            do {
                                a = a - 1;
                                options.lexer_options[sparser.libs.optionDef[notes[b]].lexer[a]][notes[b]] = false;
                            } while (a > 0);
                        }
                    } else if (isNaN(numb) === true) {
                        if (sparser.libs.optionDef[notes[b]].lexer[0] === "all") {
                            options[notes[b]] = value;
                        } else {
                            a = sparser.libs.optionDef[notes[b]].lexer.length;
                            do {
                                a = a - 1;
                                options.lexer_options[sparser.libs.optionDef[notes[b]].lexer[a]][notes[b]] = value;
                            } while (a > 0);
                        }
                    } else {
                        if (sparser.libs.optionDef[notes[b]].lexer[0] === "all") {
                            options[notes[b]] = numb;
                        } else {
                            a = sparser.libs.optionDef[notes[b]].lexer.length;
                            do {
                                a = a - 1;
                                options.lexer_options[sparser.libs.optionDef[notes[b]].lexer[a]][notes[b]] = numb;
                            } while (a > 0);
                        }
                    }
                } else if (sparser.libs.optionDef[notes[b]] !== undefined && sparser.libs.optionDef[notes[b]].type === "boolean") {
                    if (sparser.libs.optionDef[notes[b]].lexer[0] === "all") {
                        options[notes[b]] = true;
                    } else {
                        a = sparser.libs.optionDef[notes[b]].lexer.length;
                        do {
                            a = a - 1;
                            options.lexer_options[sparser.libs.optionDef[notes[b]].lexer[a]][notes[b]] = true;
                        } while (a > 0);
                    }
                }
                b = b + 1;
            } while (b < noteslen);
        }
        if (options.language === "auto") {
            options.language = lang[0];
        }
        if (options.lexer === "auto") {
            options.lexer = lang[1];
        }
    };
    // http(s) get function
    apps.get = function node_apps_get(address:string, callback:Function|null):void {
        if (command === "get") {
            address = process.argv[0];
        }
        if (address === undefined) {
            apps.errout([
                "The get command requires an address in http/https scheme.",
                `Please execute ${text.cyan}sparser commands get${text.none} for examples.`
            ]);
            return;
        }
        let file:string = "";
        const scheme:string = (address.indexOf("https") === 0)
                ? "https"
                : "http";
        if ((/^(https?:\/\/)/).test(address) === false) {
            apps.errout([
                `Address: ${text.angry + address + text.none}`,
                "The get command requires an address in http/https scheme.",
                `Please execute ${text.cyan}sparser commands get${text.none} for examples.`
            ]);
            return;
        }
        node[scheme].get(address, function node_apps_get_callback(res:http.IncomingMessage) {
            res.on("data", function node_apps_get_callback_data(chunk:string):void {
                file = file + chunk;
            });
            res.on("end", function node_apps_get_callback_end() {
                if (res.statusCode !== 200) {
                    if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307 || res.statusCode === 308) {
                        if (verbose === true) {
                            console.log(`${res.statusCode} ${node.http.STATUS_CODES[res.statusCode]} - ${address}`);
                        }
                        process.argv[0] = res.headers.location;
                        address = process.argv[0];
                        apps.get(address, callback);
                        return;
                    }
                    apps.errout([`${scheme}.get failed with status code ${res.statusCode}`]);
                    return;
                }
                if (command === "get") {
                    apps.log([""], file.toString());
                } else if (callback !== null) {
                    callback(file);
                }
            });
        });
    };
    // help text
    apps.help = function node_apps_help():void {
        apps.log([
            "",
            "Welcome to Sparser.",
            "",
            "To see all the supported features try:",
            "node js/services commands",
            "",
            "To see more detailed documentation for specific command supply the command name:",
            "node js/services commands performance",
            "",
            "* Read the documentation             - cat readme.md",
            "* Read about the lexers              - cat lexers/readme.md",
        ], "");
    };
    // converting time durations into something people read
    apps.humantime = function node_apps_humantime(finished:boolean):string {
        let minuteString:string = "",
            hourString:string   = "",
            secondString:string = "",
            finalTime:string    = "",
            finalMem:string     = "",
            minutes:number      = 0,
            hours:number        = 0,
            memory,
            elapsed:number      = (function node_apps_humantime_elapsed():number {
                const big:number = 1e9,
                    dtime:[number, number] = process.hrtime(startTime);
                if (dtime[1] === 0) {
                    return dtime[0];
                }
                return dtime[0] + (dtime[1] / big);
            }());
        const numberString = function node_apps_humantime_numberString(numb:number):string {
                const strSplit:string[] = String(numb).split(".");
                if (strSplit.length > 1) {
                    if (strSplit[1].length < 9) {
                        do {
                            strSplit[1]  = strSplit[1] + 0;
                        } while (strSplit[1].length < 9);
                        return `${strSplit[0]}.${strSplit[1]}`;
                    }
                    if (strSplit[1].length > 9) {
                        return `${strSplit[0]}.${strSplit[1].slice(0, 9)}`;
                    }
                    return `${strSplit[0]}.${strSplit[1]}`;
                }
                return `${strSplit[0]}`;
            },
            prettybytes  = function node_apps_humantime_prettybytes(an_integer:number):string {
                //find the string length of input and divide into triplets
                let output:string = "",
                    length:number  = an_integer
                        .toString()
                        .length;
                const triples:number = (function node_apps_humantime_prettybytes_triples():number {
                        if (length < 22) {
                            return Math.floor((length - 1) / 3);
                        }
                        //it seems the maximum supported length of integer is 22
                        return 8;
                    }()),
                    //each triplet is worth an exponent of 1024 (2 ^ 10)
                    power:number   = (function node_apps_humantime_prettybytes_power():number {
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
            plural       = function node_proctime_plural(x:number, y:string):string {
                if (x !== 1) {
                    return `${numberString(x) + y}s `;
                }
                return `${numberString(x) + y} `;
            },
            minute       = function node_proctime_minute():void {
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
                        : `${numberString(minutes)} seconds `
                    : numberString(minutes);
            };
        memory       = process.memoryUsage();
        finalMem     = prettybytes(memory.rss);

        //last line for additional instructions without bias to the timer
        secondString = numberString(elapsed);
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
            console.log("");
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
            // pad single digit seconds with a 0
            if ((/^([0-9]\.)/).test(secondString) === true) {
                secondString = `0${secondString}`;
            }
        }
        return `${text.cyan}[${hourString}:${minuteString}:${secondString}]${text.none} `;
    };
    // provides a detailed list of supported languages by available lexer
    apps.inventory = function node_apps_inventory():void {
        const textwrap:string[] = [];
        console.log("");
        console.log(`${text.underline}Inventory of mentioned languages${text.none}`);
        console.log("");
        apps.wrapit(textwrap,"A list of supplied lexers and their various dedicated language support as indicated through use of logic with 'options.language'. Other languages may be supported without dedicated logic.");
        textwrap.forEach(function node_apps_inventory(value:string):void {
            console.log(value);
        });
        if (command === "inventory") {
            verbose = true;
        }
        node.fs.readdir(`${projectPath}lexers`, function node_app_inventory_readdir(err:Error, filelist:string[]):void {
            if (err !== null) {
                return apps.errout([err.toString()]);
            }
            const list:{} = {},
                files:string[] = [],
                len:number = filelist.length;
            let index:number = 0,
                longest:number = 0,
                total:number = 0;
            do {
                if (filelist[index].indexOf(".md") === filelist[index].length - 3 && filelist[index] !== "readme.md") {
                    files.push(filelist[index]);
                }
                index = index + 1;
            } while (index < len);
            index = 0;
            files.forEach(function node_app_inventory_readdir_each(filename:string):void {
                node.fs.readFile(`${projectPath}lexers${sep + filename}`, {
                    encoding: "utf8"
                }, function node_app_inventory_readdir_each_readfile(errf:Error, filedata:string):void {
                    if (errf !== null) {
                        return apps.errout([errf.toString()]);
                    }
                    const lex:string = (/# Lexer - \w+/).exec(filedata)[0].replace("# Lexer - ", ""),
                        fragments:string[] = (function node_app_inventory_readdir_each_readfile_fragments():string[] {
                            filedata = filedata.replace(/\r\n/g, "\n");
                            filedata = filedata.slice(filedata.indexOf("## supported languages") + 22);
                            filedata = filedata.replace(/\s+/, "");
                            filedata = filedata.slice(0, filedata.indexOf("\n\n"));
                            return filedata.split("\n");
                        }());
                    let a:number = 0;
                    list[lex] = [];
                    total = total + fragments.length;
                    fragments.forEach(function node_app_inventory_readdir_each_readfile_fragments_each(lang:string):void {
                        const name:string = lang.slice(lang.indexOf("[") + 1, lang.indexOf("](")),
                            addy:string = lang.slice(lang.indexOf("](") + 2, lang.length - 1);
                        if (name.length > longest) {
                            longest = name.length;
                        }
                        list[lex].push([name, addy]);
                    });
                    index = index + 1;
                    if (index === files.length) {
                        const keys:string[] = Object.keys(list),
                            keylen:number = keys.length,
                            output:string[] = [],
                            pad = function node_app_inventory_readdir_each_readfile_fragments_each_pad(str:string, title:boolean, numb:boolean):string {
                                const distance:number = (title === true)
                                    ? longest + 3
                                    : (numb === true)
                                        ? total.toString().length
                                        : longest;
                                let c:number = 0,
                                    namelen:number = 0,
                                    space:string[] = [];
                                namelen = str.length;
                                if (namelen < distance) {
                                    c = namelen;
                                    space = [];
                                    do {
                                        space.push(" ");
                                        c = c + 1;
                                    } while (c < distance);
                                    if (numb === true) {
                                        return space.join(" ") + str;
                                    }
                                    return str + space.join("");
                                }
                                return str;
                            };
                        let b:number = 0,
                            langlen:number = 0,
                            count:number = 0;
                        keys.sort();
                        a = 0;
                        do {
                            output.push(`${text.angry}*${text.none} ${text.green + text.underline + pad(keys[a] + ".ts", true, false)}${text.none}`);
                            b = 0;
                            langlen = list[keys[a]].length;
                            do {
                                count = count + 1;
                                output.push(`  ${text.angry + pad(count.toString(), false, true) + text.none} ${pad(list[keys[a]][b][0], false, false)} ${text.cyan + list[keys[a]][b][1] + text.none}`);
                                b = b + 1;
                            } while (b < langlen);
                            a = a + 1;
                        } while (a < keylen);
                        apps.log(output, "");
                    }
                });
            });
        });
    };
    // wrapper for ESLint usage
    apps.lint = function node_apps_lint(callback:Function):void {
        node.child("eslint", function node_apps_build_lint_eslintCheck(eserr:Error) {
            const lintpath:string = (command === "lint" && process.argv[0] !== undefined)
                ? node.path.resolve(process.argv[0])
                : js;
            if (eserr !== null) {
                console.log("ESLint is not globally installed or is corrupt.");
                console.log(`Install ESLint using the command: ${text.green}npm install eslint -g${text.none}`);
                console.log("");
                if (callback !== undefined) {
                    callback("Skipping code validation...");
                } else {
                    console.log("Skipping code validation...");
                }
                return;
            }
            if (command === "lint") {
                verbose = true;
                callback = function node_apps_lint_callback():void {
                    apps.log([`Lint complete for ${lintpath}`], "");
                };
            }
            (function node_apps_build_lint_getFiles():void {
                const lintrun         = function node_apps_build_lint_lintrun(list:directoryList) {
                    let filesRead:number = 0,
                        filesLinted:number = 0,
                        a:number = 0,
                        first:boolean = false;
                    const len = list.length,
                        lintit = function node_apps_build_lint_lintrun_lintit(val:string):void {
                            console.log(`${apps.humantime(false)}Starting lint: ${val}`);
                            filesRead = filesRead + 1;
                            node.child(`eslint ${val}`, {
                                cwd: projectPath
                            }, function node_apps_build_lint_lintrun_lintit_eslint(err:Error, stdout:string, stderr:string) {
                                if (stdout === "" || stdout.indexOf("0:0  warning  File ignored because of a matching ignore pattern.") > -1) {
                                    if (err !== null) {
                                        apps.errout([err.toString()]);
                                        return;
                                    }
                                    if (stderr !== null && stderr !== "") {
                                        apps.errout([stderr]);
                                        return;
                                    }
                                    filesLinted = filesLinted + 1;
                                    if (first === false) {
                                        first = true;
                                        console.log("");
                                    }
                                    console.log(`${apps.humantime(false) + text.green}Lint ${filesLinted} passed:${text.none} ${val}`);
                                    if (filesRead === filesLinted) {
                                        console.log("");
                                        if (callback !== undefined) {
                                            callback(`${text.green}Lint complete for ${filesLinted} files!${text.none}`);
                                        } else {
                                            console.log(`${text.green}Lint complete for ${filesLinted} files!${text.none}`);
                                        }
                                        return;
                                    }
                                } else {
                                    console.log(stdout);
                                    apps.errout(["Lint failure."]);
                                    return;
                                }
                            })
                        };
                    console.log(`${apps.humantime(false)}Linting files...`);
                    console.log("");
                    do {
                        if (list[a][1] === "file" && (/\.js$/).test(list[a][0]) === true) {
                            lintit(list[a][0]);
                        }
                        a = a + 1;
                    } while (a < len);
                };
                console.log(`${apps.humantime(false)}Gathering JavaScript files from directory: ${text.green + lintpath + text.none}`);
                apps.directory({
                    callback: lintrun,
                    exclusions: (command === "lint" && process.argv[0] !== undefined)
                        ? exclusions
                        : [],
                    path      : lintpath,
                    recursive: true,
                    symbolic: false
                });
            }());
        });
    };
    // CLI string output formatting for lists of items
    apps.lists = function node_apps_lists(lists:nodeLists):void {
        // * lists.emptyline - boolean - if each key should be separated by an empty line
        // * lists.heading   - string  - a text heading to precede the list
        // * lists.obj       - object  - an object to traverse
        // * lists.property  - string  - The child property to read from or "eachkey" to
        // access a directly assigned primitive
        const keys:string[] = Object.keys(lists.obj).sort(),
            output:string[] = [],
            lenn:number = keys.length,
            plural = (lenn === 1)
                ? ""
                : "s",
            displayKeys = function node_apps_lists_displayKeys(item:string, keylist:string[]):void {
                const len:number = keylist.length;
                let a:number = 0,
                    b:number = 0,
                    c:number = 0,
                    lens:number = 0,
                    comm:string = "";
                if (len < 1) {
                    apps.errout([`Please run the build: ${text.cyan}sparser build${text.none}`]);
                    return;
                }
                do {
                    if (keylist[a].length > lens) {
                        lens = keylist[a].length;
                    }
                    a = a + 1;
                } while (a < len);
                do {
                    comm = keylist[b];
                    c    = comm.length;
                    if (c < lens) {
                        do {
                            comm = comm + " ";
                            c    = c + 1;
                        } while (c < lens);
                    }
                    if (item !== "") {
                        // each of the "values" keys
                        apps.wrapit(output, `   ${text.angry}- ${text.none + text.cyan + comm + text.none}: ${lists.obj.values[keylist[b]]}`);
                    } else {
                        // list all items
                        if (lists.property === "eachkey") {
                            if (command === "options" && keylist[b] === "values") {
                                // "values" keyname of options
                                output.push(`${text.angry}* ${text.none + text.cyan + comm + text.none}:`);
                                node_apps_lists_displayKeys(command, Object.keys(lists.obj.values).sort());
                            } else {
                                // all items keys and their primitive value
                                apps.wrapit(output, `${text.angry}* ${text.none + text.cyan + comm + text.none}: ${lists.obj[keylist[b]]}`);
                            }
                        } else {
                            // a list by key and specified property
                            apps.wrapit(output, `${text.angry}* ${text.none + text.cyan + comm + text.none}: ${lists.obj[keylist[b]][lists.property]}`);
                        }
                        if (lists.emptyline === true) {
                            output.push("");
                        }
                    }
                    b = b + 1;
                } while (b < len);
            };
        output.push(`${text.underline + text.bold}Sparser - ${lists.heading + text.none}`);
        output.push("");
        displayKeys("", keys);
        if (command === "commands") {
            output.push("");
            output.push("For examples and usage instructions specify a command name, for example:");
            output.push(`globally installed - ${text.green}sparser commands hash${text.none}`);
            output.push(`locally installed - ${text.green}node js/services commands hash${text.none}`);
            output.push("");
            output.push(`Commands are tested using the ${text.green}simulation${text.none} command.`);
        } else if (command === "options") {
            output.push(`${text.green + lenn + text.none} matching option${plural}.`);
        }
        apps.log(output, "");
    };
    // verbose metadata printed to the shell about Sparser
    apps.log = function node_apps_log(output:string[], code:string):void {
        const conclusion = function node_apps_log_conclusion():void {
            if (process.argv.indexOf("debug") > -1 || process.argv.indexOf("debug") > -1) {
                process.argv[2] = "debug";
                return apps.errout(["Debug statement requested."]);
            }
            if (verbose === true && (output.length > 1 || output[0] !== "")) {
                console.log("");
            }
            if (output[output.length - 1] === "") {
                output.pop();
            }
            output.forEach(function node_apps_log_each(value:string) {
                console.log(value);
            });
            if (verbose === true) {
                console.log("");
                console.log(`Sparser version ${text.angry + sparser.version.number + text.none}`);
                apps.humantime(true);
            }
        };
        if (code !== "") {
            if (options.output === "" || options.output === undefined) {
                console.log(code);
                conclusion();
            } else {
                const out:string = node.path.resolve(options.output);
                node.fs.writeFile(out, code, function node_apps_output_writeFile(err:Error):void {
                    if (err !== null) {
                        apps.errout([err.toString()]);
                        return;
                    }
                    output.push(`Wrote output to ${text.green + out + text.none} at ${text.green + apps.commas(code.length) + text.none} characters.`);
                    conclusion();
                });
            }
        } else if (code === "" || options.output === "") {
            conclusion();
        }
    };
    // CLI documentation for supported Sparser options
    apps.options = function node_apps_options():void {
        const def:optionDef = sparser.libs.optionDef;
        if (def[process.argv[0]] === undefined) {
            if (process.argv.length < 1) {
                // all options in a list
                apps.lists({
                    emptyline: true,
                    heading: "Options",
                    obj: def,
                    property: "definition"
                });
            } else {
                // queried list of options
                const keys:string[] = Object.keys(def),
                    arglen:number = process.argv.length,
                    output:any = {},
                    namevalue = function node_apps_options_namevalue(item:string):void {
                        const si:number = item.indexOf(":");
                        if (si < 1) {
                            name = item;
                            value = "";
                            return;
                        }
                        if (
                            (si < item.indexOf("\"") && item.indexOf("\"") > -1) ||
                            (si < item.indexOf("'") && item.indexOf("'") > -1) ||
                            (item.indexOf("\"") < 0 && item.indexOf("'") < 0)
                        ) {
                            name = item.slice(0, si);
                            value = item.slice(si + 1);
                            return;
                        }
                        name = item;
                        value = "";
                    };
                let keylen:number = keys.length,
                    a:number = 0,
                    b:number = 0,
                    name:string = "",
                    value:string = "";
                do {
                    namevalue(process.argv[a]);
                    b = 0;
                    do {
                        if (def[keys[b]][name] === undefined || (value !== "" && def[keys[b]][name] !== value)) {
                            keys.splice(b, 1);
                            b = b - 1;
                            keylen = keylen - 1;
                        }
                        b = b + 1;
                    } while (b < keylen);
                    if (keylen < 1) {
                        break;
                    }
                    a = a + 1;
                } while (a < arglen);
                a = 0;
                do {
                    output[keys[a]] = def[keys[a]];
                    a = a + 1;
                } while (a < keylen);
                if (keylen < 1) {
                    apps.log([`${text.angry}Sparser has no options matching the query criteria.${text.none}`], "");
                } else {
                    apps.lists({
                        emptyline: true,
                        heading: "Options",
                        obj: output,
                        property: "definition"
                    });
                }
            }
        } else {
            // specificly mentioned option
            apps.lists({
                emptyLine: false,
                heading: `Option: ${text.green + process.argv[0] + text.none}`,
                obj: def[process.argv[0]],
                property: "eachkey"
            });
        }
    };
    // a performance application for testing the speed of the parser
    apps.performance = function node_apps_performance():void {
        if (process.argv[0] === undefined) {
            return apps.errout([`The ${text.angry}performance${text.none} command requires a relative path to a file`]);
        }
        const sourcePath:string = (process.argv.length > 1)
            ? node.path.normalize(process.argv[1])
            : "";
        apps.fileOptions(sourcePath);
        node.fs.readFile(sourcePath, {
            encoding: "utf8"
        }, function node_apps_performance_readFile(errfile, filedata) {
            if (errfile !== null) {
                const errstring = errfile.toString();
                if (errstring.indexOf("no such file or directory") > 0) {
                    return apps.errout([`No file exists as the path specified: ${process.argv[1]}`]);
                }
                return apps.errout([errfile]);
            }
            let index:number = 11,
                total:number = 0,
                low:number = 0,
                high:number = 0,
                start:[number, number],
                end:[number, number];
            const lang = sparser.libs.language.auto(filedata, "javascript"),
                store:number[] = [],
                output:data = sparser.parser(),
                interval = function node_apps_performance_readFile_readdir_interval():void {
                    index = index - 1;
                    if (index > -1) {
                        start = process.hrtime();
                        sparser.parser();
                        end = process.hrtime(start);
                        store.push((end[0] * 1e9) + end[1]);
                        // specifying a delay between intervals allows for garbage collection without interference to the performance testing
                        setTimeout(node_apps_performance_readFile_readdir_interval, 400);
                    } else {
                        console.log("");
                        store.forEach(function node_apps_performance_readFile_readdir_total(value:number, index:number) {
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
                        console.log(`[${text.cyan + apps.commas(filedata.length) + text.none}] Character size`);
                        console.log(`[${text.cyan + apps.commas(output.token.length) + text.none}] Token length`);
                        console.log(`Parsed as ${text.cyan + lang[2] + text.none} with lexer ${text.cyan + lang[1] + text.none}.`);
                        console.log("");
                    }
                };
            interval();
        });
    };
    // runs services: http, web sockets, and file system watch.  Allows rapid testing with automated rebuilds
    apps.server = function node_apps_server():void {
        if (process.argv[0] !== undefined && isNaN(Number(process.argv[0])) === true) {
            apps.errout([`Specified port, ${text.angry + process.argv[0] + text.none}, is not a number.`]);
            return;
        }
        let timeStore:number = 0;
        const port:number = (isNaN(Number(process.argv[0])))
                ? 9999
                : Number(process.argv[0]),
            server = node.http.createServer(function node_apps_server_create(request, response):void {
                let quest:number = request.url.indexOf("?"),
                    uri:string = (quest > 0)
                        ? request.url.slice(0, quest)
                        : request.url,
                    file:string = projectPath + uri.slice(1).replace(/\//g, sep);
                if (uri === "/") {
                    file = `${projectPath}index.xhtml`;
                } else if (uri === "/demo/") {
                    file = `${projectPath}demo${sep}index.xhtml`;
                }
                if (request.url.indexOf("favicon.ico") < 0 && request.url.indexOf("images/apple") < 0) {
                    node.fs.readFile(file, "utf8", function node_apps_server_create_readFile(err:Error, data:string):void {
                        if (err !== undefined && err !== null) {
                            if (err.toString().indexOf("no such file or directory") > 0) {
                                response.writeHead(404, {"Content-Type": "text/plain"});
                                if (file.indexOf("apple-touch") < 0 && file.indexOf("favicon") < 0) {
                                    console.log(`${text.angry}404${text.none} for ${file}`);
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
                    });
                } else {
                    response.end();
                }
            }),
            serverError = function node_apps_server_serverError(error):void {
                if (error.code === "EADDRINUSE") {
                    if (error.port === port + 1) {
                        apps.errout([`Web socket channel port, ${text.cyan + port + text.none}, is in use!  The web socket channel is 1 higher than the port designated for the HTTP server.`]);
                    } else {
                        apps.errout([`Specified port, ${text.cyan + port + text.none}, is in use!`]);
                    }
                } else {
                    apps.errout([`${error.Error}`]);
                }
                return
            },
            ignore   = function node_apps_server_ignore(input:string|null):boolean {
                if (input.indexOf(".git") === 0) {
                    return true;
                }
                if (input.indexOf("node_modules") === 0) {
                    return true;
                }
                if (input.indexOf("js") === 0) {
                    return true;
                }
                return false;
            },
            socket = require("ws"),
            ws = new socket.Server({port: port + 1});
        if (process.cwd() !== projectPath) {
            process.chdir(projectPath);
        }
        ws.broadcast = function node_apps_server_broadcast(data:string):void {
            ws.clients.forEach(function node_apps_server_broadcast_clients(client):void {
                if (client.readyState === socket.OPEN) {
                    client.send(data);
                }
            });
        };
        console.log(`HTTP server is up at: ${text.bold + text.green}http://localhost:${port + text.none}`);
        console.log(`${text.green}Starting web server and file system watcher!${text.none}`);
        node.fs.watch(projectPath, {
            recursive: true
        }, function node_apps_server_watch(type:"rename"|"change", filename:string|null):void {
            if (filename === null || ignore(filename) === true) {
                return;
            }
            const extension:string = (function node_apps_server_watch_extension():string {
                    const list = filename.split(".");
                    return list[list.length - 1];
                }()),
                time = function node_apps_server_watch_time(message:string):number {
                    const date:Date = new Date(),
                        datearr:string[] = [];
                    let hours:string = String(date.getHours()),
                        minutes:string = String(date.getMinutes()),
                        seconds:string = String(date.getSeconds()),
                        mseconds:string = String(date.getMilliseconds());
                    if (hours.length === 1) {
                        hours = `0${hours}`;
                    }
                    if (minutes.length === 1) {
                        minutes = `0${minutes}`;
                    }
                    if (seconds.length === 1) {
                        seconds = `0${seconds}`;
                    }
                    if (mseconds.length < 3) {
                        do {
                            mseconds = `0${mseconds}`;
                        } while (mseconds.length < 3);
                    }
                    datearr.push(hours);
                    datearr.push(minutes);
                    datearr.push(seconds);
                    datearr.push(mseconds);
                    console.log(`[${text.cyan + datearr.join(":") + text.none}] ${message}`);
                    timeStore = date.valueOf();
                    return timeStore;
                };
            if (extension === "ts" && timeStore < Date.now() - 1000) {
                let start:number,
                    compile:number,
                    duration = function node_apps_server_watch_duration(length:number):void {
                        let hours:number = 0,
                            minutes:number = 0,
                            seconds:number = 0,
                            list:string[] = [];
                        if (length > 3600000) {
                            hours = Math.floor(length / 3600000);
                            length = length - (hours * 3600000);
                        }
                        list.push(hours.toString());
                        if (list[0].length < 2) {
                            list[0] = `0${list[0]}`;
                        }
                        if (length > 60000) {
                            minutes = Math.floor(length / 60000);
                            length = length - (minutes * 60000);
                        }
                        list.push(minutes.toString());
                        if (list[1].length < 2) {
                            list[1] = `0${list[1]}`;
                        }
                        if (length > 1000) {
                            seconds = Math.floor(length / 1000);
                            length = length - (seconds * 1000);
                        }
                        list.push(seconds.toString());
                        if (list[2].length < 2) {
                            list[2] = `0${list[2]}`;
                        }
                        list.push(length.toString());
                        if (list[3].length < 3) {
                            do {
                                list[3] = `0${list[3]}`;
                            } while (list[3].length < 3);
                        }
                        console.log(`[${text.bold + text.purple + list.join(":") + text.none}] Total compile time.\u0007`);
                    };
                console.log("");
                start = time(`Compiling for ${text.green + filename + text.none}`);
                node.child(`node js/services build`, {
                    cwd: projectPath
                }, function node_apps_server_watch_child(err:Error, stdout:string, stderr:string):void {
                    if (err !== null) {
                        apps.errout([err.toString()]);
                        return;
                    }
                    if (stderr !== "") {
                        apps.errout([stderr]);
                        return;
                    }
                    compile = time("TypeScript Compiled") - start;
                    duration(compile);
                    ws.broadcast("reload");
                    return;
                });
            } else if (extension === "css" || extension === "xhtml") {
                ws.broadcast("reload");
            }
        });
        server.on("error", serverError);
        server.listen(port);
    };
    apps.test = function node_apps_test():void {
        apps.build(true);
    };
    apps.testprep = function node_apps_testprep():void {
        verbose = true;
        apps.fileOptions(process.argv[0]);
        node.fs.readFile(node.path.resolve(process.argv[0]), {
            encoding: "utf8"
        }, function node_apps_testprep_read(er:Error, filedata:string):void {
            if (er !== null) {
                apps.errout([er.toString()]);
                return;
            }
            const auto:[string, string, string] = sparser.libs.language.auto(filedata, "javascript");
            options.source = filedata;
            options.language = auto[0];
            options.lexer = (function node_apps_testprep_lexer():string {
                const sample:number = process.argv[0].indexOf("samples_code");
                let addy:string = process.argv[0].replace(/\\/g, "/");
                if (sample > 0) {
                    addy = addy.slice(sample + 13);
                    addy = addy.slice(0, addy.indexOf("/"));
                    return addy;
                }
                return auto[1];
            }());
            options.format = "testprep";
            console.log(sparser.parser());
            apps.log([`${text.green}Test case generated!${text.none}`], "");
        });
    };
    // unit test validation runner for Sparser code units
    apps.validation = function node_apps_validation(callback:Function):void {
        require(`${js}parse`);
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
            lexers:string[] = Object.keys(sparser.lexers),
            compare = function node_apps_validation_compare():void {
                let len:number       = (files.code.length > files.parsed.length)
                        ? files.code.length
                        : files.parsed.length,
                    a:number         = 0,
                    str:string       = "",
                    output:any,
                    filecount:number = 0,
                    currentlex:string = "",
                    empty:number = 0,
                    missing:number = 0;
                const lexer     = function node_apps_validation_compare_lexer():void {
                        const lex:string = files.code[a][0].slice(0, files.code[a][0].indexOf(sep));
                        console.log("");
                        console.log(`Tests for lexer - ${text.cyan + lex + text.none}`);
                        currentlex = lex;
                    },
                    completeText = function node_apps_validation_compare_completeText():void {
                        console.log("");
                        if (missing < 1 && empty < 1) {
                            console.log(`${text.green}Test units evaluated without failure!${text.none}`);
                        } else {
                            let pe:string = (empty > 1)
                                    ? "s are"
                                    : " is",
                                pm:string = (missing > 1)
                                    ? "s"
                                    : "";
                            if (missing < 1) {
                                console.log(`${text.green}Test units passed, but ${text.angry + empty} file${pe} empty.${text.none}`);
                            } else if (empty < 1) {
                                console.log(`${text.green}Test units passed, but ${text.angry}missing ${missing} file${pm}.${text.none}`);
                            } else {
                                console.log(`${text.green}Test units passed, but ${text.angry}missing ${missing} file${pm} and ${empty} file${pe} empty.${text.none}`);
                            }
                        }
                        callback();
                    },
                    comparePass = function node_apps_validation_compare_comparePass():void {
                        filecount = filecount + 1;
                        console.log(`${apps.humantime(false) + text.green}Pass ${filecount}:${text.none} ${files.parsed[a][0].replace(currentlex + sep, "")}`);
                        if (a === len - 1) {
                            completeText();
                            return;
                        }
                    },
                    diffFiles  = function node_apps_validation_compare_diffFiles(sampleSource:recordList, sampleDiff:recordList):boolean {
                        let report:[string, number, number],
                            total:number  = 0;
                        const beautify = function node_apps_validation_compare_beautify(item:recordList) {
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
                                diff_format: "text",
                                language: "text",
                                source: beautify(sampleSource),
                                source_label: files.code[a][1]
                            };
                        require(`${js}test${sep}diffview.js`);
                        report          = sparser.libs.diffview(diff_options);
                        total           = report[1];console.log(report);
                        if (total < 1) {
                            comparePass();
                            return false;
                        }
                        console.log(`${apps.humantime(false) + text.angry}Fail: ${text.cyan + files.code[a][0] + text.none}`);
                        console.log("");
                        console.log(`Diff output colors: ${text.angry + text.underline}red = generated${text.none} and ${text.green + text.underline}green = saved file${text.none}`);
                        diff_options.diff         = files.parsed[a][1];
                        diff_options.source       = output;
                        apps.errout([
                            sparser.libs.diffview(diff_options)[0],
                            "",
                            `${text.angry}Validation test failure${text.none}`,
                            `Failed on file ${text.cyan + text.bold + files.code[a][0] + text.none}`,
                            ""
                        ]);
                        return true;
                    };
                files.code   = sparser.parse.safeSort(files.code, "ascend", false);
                files.parsed = sparser.parse.safeSort(files.parsed, "ascend", false);
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
                        if (files.parsed[a][1].replace(/^\s+$/, "") === "") {
                            empty = empty + 1;
                            console.log(`${text.angry}Parsed file is empty:${text.none} ${files.parsed[a][0]}`);
                        } else if (files.code[a][1].replace(/^\s+$/, "") === "") {
                            empty = empty + 1;
                            console.log(`${text.angry}Code file is empty:${text.none} ${files.code[a][0]}`);
                        } else {
                            options.source = files.code[a][1];
                            apps.fileOptions(files.code[a][0]);
                            options.lexer = currentlex;
                            options.format = "testprep";
                            output        = sparser.parser();
                            str                  = (sparser.parseerror === "")
                                ? output
                                : sparser.parseerror;
                            if (str === files.parsed[a][1]) {
                                comparePass();
                            } else {
                                if (sparser.parseerror === "") {
                                    if (diffFiles(output, JSON.parse(files.parsed[a][1])) === true) {
                                        return;
                                    }
                                }
                            }
                        }
                    } else {
                        if (files.code[a][0] < files.parsed[a][0]) {
                            missing = missing + 1;
                            console.log(`${text.yellow}Parsed samples directory is missing file:${text.none} ${files.code[a][0]}`);
                            files.code.splice(a, 1);
                        } else {
                            missing = missing + 1;
                            console.log(`${text.yellow}Code samples directory is missing file:${text.none} ${files.parsed[a][0]}`);
                            files.parsed.splice(a, 1);
                        }
                        len = (files.code.length > files.parsed.length)
                            ? files.code.length
                            : files.parsed.length;
                        a   = a - 1;
                        if (a === len - 1) {
                            completeText();
                            return;
                        }
                    }
                    a = a + 1;
                } while (a < len);
            },
            readDir = function node_apps_validation_readDir(type:string, lexer:string):void {
                const dirpath:string = `${projectPath}test${sep}samples_${type + sep + lexer + sep}`;
                node.fs.readdir(dirpath, function node_apps_validation_readDir_callback(err, list) {
                    if (err !== null) {
                        if (err.toString().indexOf("no such file or directory") > 0) {
                            apps.errout([`The directory ${dirpath} ${text.angry}doesn't exist${text.none}. Provide the necessary test samples for ${text.cyan + lexer + text.none}.`]);
                            return;
                        }
                        apps.errout([`Error reading from directory ${dirpath}`, err.toString()]);
                        return;
                    }
                    if (list === undefined) {
                        if (total[type] === 0) {
                            apps.errout([`No files of type ${type} for lexer ${lexer}.`]);
                            return;
                        }
                        apps.errout([`undefined returned when reading files from ${dirpath}`]);
                        return;
                    }
                    const pusher = function node_apps_validation_readDir_callback_pusher(val) {
                        node.fs.readFile(
                            dirpath + val,
                            "utf8",
                            function node_apps_validation_readDir_callback_pusher_readFile(erra, fileData) {
                                count[type] = count[type] + 1;
                                if (erra !== null && erra !== undefined) {
                                    apps.errout([`Error reading file: ${projectPath}test${sep}samples_${type + sep + lexer + sep + val}`]);
                                    return;
                                }
                                files[type].push([lexer + sep + val, fileData.replace(/\r\n/g, "\n")]);
                                if (count.lexer === total.lexer && count.code === total.code && count.parsed === total.parsed) {
                                    compare();
                                }
                            }
                        );
                    };
                    total[type] = total[type] + list.length;
                    if (err !== null) {
                        apps.errout([`Error reading from directory: ${dirpath}`]);
                        return;
                    }
                    list.forEach(pusher);
                });
            };
        if (command === "validation") {
            callback = function node_apps_validation_callback():void {
                verbose = true;
                apps.log([""], "");
            };
        }
        total.lexer = lexers.length;
        lexers.forEach(function node_apps_validation_lexers(value:string) {
            count.lexer = count.lexer + 1;
            readDir("code", value);
            readDir("parsed", value);
        });
    };
    // runs apps.log
    apps.version = function ():void {
        verbose = true;
        apps.log([""], "");
    };
    // performs word wrap when printing text to the shell
    apps.wrapit = function node_apps_lists_wrapit(outputArray:string[], string:string):void {
        const wrap:number = 100;
        if (string.length > wrap) {
            const indent:string = (function node_apps_options_wrapit_indent():string {
                    const len:number = string.length;
                    let inc:number = 0,
                        num:number = 2,
                        str:string = "";
                    // eslint-disable-next-line
                    if ((/^(\s*((\*|-)\s*)?\w+\s*:)/).test(string.replace(/\u001b\[\d+m/g, "")) === false) {
                        return "";
                    }
                    do {
                        if (string.charAt(inc) === ":") {
                            break;
                        }
                        if (string.charAt(inc) === "\u001b") {
                            if (string.charAt(inc + 4) === "m") {
                                inc = inc + 4;
                            } else {
                                inc = inc + 3;
                            }
                        } else {
                            num = num + 1;
                        }
                        inc = inc + 1;
                    } while (inc < len);
                    inc = 0;
                    do {
                        str = str + " ";
                        inc = inc + 1;
                    } while (inc < num);
                    return str;
                }()),
                formLine = function node_apps_options_wrapit_formLine():void {
                    let inc:number = 0,
                        wrapper:number = wrap;
                    do {
                        if (string.charAt(inc) === "\u001b") {
                            if (string.charAt(inc + 4) === "m") {
                                wrapper = wrapper + 4;
                            } else {
                                wrapper = wrapper + 3;
                            }
                        }
                        inc = inc + 1;
                    } while (inc < wrapper);
                    if (string.charAt(wrapper) !== " " && string.length > wrapper) {
                        do {
                            wrapper = wrapper - 1;
                        } while (wrapper > 0 && string.charAt(wrapper) !== " ");
                        if (wrapper === 0) {
                            outputArray.push(string);
                            return;
                        }
                    }
                    outputArray.push(string.slice(0, wrapper).replace(/ $/, ""));
                    string = string.slice(wrapper + 1);
                    if (string.length + indent.length > wrap) {
                        string = indent + string;
                        node_apps_options_wrapit_formLine();
                    } else if (string !== "") {
                        outputArray.push(indent + string);
                    }
                };
            formLine();
        } else {
            outputArray.push(string);
        }
    };
}());
