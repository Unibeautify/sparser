/*jslint node:true */
/*eslint-env node*/
/*eslint no-console: 0*/

/* This file exists to consolidate the various Node service offerings in
   this application. */
import { Stats } from "fs";
import * as http from "http";
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
                        defined: "Compiles from TypeScript into JavaScript and puts libraries together."
                    },
                    {
                        code: "sparser build incremental",
                        defined: "Use the TypeScript incremental build, which takes about half the time."
                    },
                    {
                        code: "sparser build local",
                        defined: "The default behavior assumes TypeScript is installed globally. Use the 'local' argument if TypeScript is locally installed in node_modules."
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
                        code: "sparser commands directory",
                        defined: "Details the mentioned command with examples."
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
            directory: {
                description: "Traverses a directory in the local file system and generates a list.",
                example: [
                    {
                        code: "sparser directory source:\"my/directory/path\"",
                        defined: "Returns an array where each index is an array of [absolute path, type, parent index, file count, stat]. Type can refer to 'file', 'directory', or 'link' for symbolic links.  The parent index identify which index in the array is the objects containing directory and the file count is the number of objects a directory type object contains."
                    },
                    {
                        code: "sparser directory source:\"my/directory/path\" shallow",
                        defined: "Does not traverse child directories."
                    },
                    {
                        code: "sparser directory source:\"my/directory/path\" listonly",
                        defined: "Returns an array of strings where each index is an absolute path"
                    },
                    {
                        code: "sparser directory source:\"my/directory/path\" symbolic",
                        defined: "Identifies symbolic links instead of the object the links point to"
                    },
                    {
                        code: "sparser directory source:\"my/directory/path\" ignore [.git, node_modules, \"program files\"]",
                        defined: "Sets an exclusion list of things to ignore"
                    },
                    {
                        code: "sparser directory source:\"my/path\" typeof",
                        defined: "returns a string describing the artifact type"
                    }
                ]
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
                        code: "sparser options type:boolean lexer:script values",
                        defined: "The option list can be queried against key and value (if present) names. This example will return only options that work with the script lexer, takes specific values, and aren't limited to a certain API environment."
                    }
                ]
            },
            parse: {
                description: "Parses a file and returns to standard output.",
                example: [
                    {
                        code: "sparser parse tsconfig.json",
                        defined: "Runs the parse job against a file system object returns to standard output."
                    },
                    {
                        code: "sparser parse libs",
                        defined: "The job can run against files in a directory."
                    },
                    {
                        code: "sparser parse libs ignore [node_modules, .git, test, units]",
                        defined: "Ignore file system objects by name using the ignore argument and a comma separated list in square braces."
                    },
                    {
                        code: "sparser parse tsconfig.json format:output quote_convert:double",
                        defined: "Options are accepted as separated arguments to the standard input."
                    },
                    {
                        code: "sparser parse tsconfig.json format:output quote_convert:double output:filepath",
                        defined: "Instead of standard output the result can be written to a file if using the 'output' argument. If there is nothing at the path specified a file will be created. If a file already exists at that location it will be overwritten. If something exists at the specified location that isn't a file an error will be thrown."
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
            sparser_debug: {
                description: "Generates a debug statement in markdown format.",
                example: [{
                    code: "sparser sparser_debug",
                    defined: "Produces a report directly to the shell that can be copied to anywhere else. This report contains environmental details."
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
            return [];
        }()),
        performance:performance = {
            codeLength: 0,
            diff: "",
            end: [0,0],
            index: 0,
            source: "",
            start: [0,0],
            store: [],
            test: false
        },
        apps:any = {},
        args = function node_args():void {
            const readOptions = function node_args_readOptions():void {
                const list:string[] = process.argv,
                    def:optionDef = sparser.libs.optionDef,
                    keys:string[] = (command === "options")
                        ? Object.keys(def.format)
                        : [],
                    obj = (command === "options")
                        ? def.format
                        : options,
                    optionName = function node_args_optionName(bindArgument:boolean):void {
                        if (a === 0 || options[list[a]] === undefined) {
                            if (keys.indexOf(list[a]) < 0 && def[list[a]] === undefined) {
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
            options = sparser.options;
            options.api = "node";
            options.binary_check = (
                // eslint-disable-next-line
                /\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u000b|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g
            );
            if (process.argv.length > 0) {
                readOptions();
            }
            apps[command]();
        };
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
            if (filtered.length > 1 && comkeys.indexOf(arg) < 0) {
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
        sparser:sparser,
        options:any = {},
        writeflag:string = ""; // location of written assets in case of an error and they need to be deleted

        (function node_sparsertest():void {
            node.fs.stat(`${js}parse.js`, function node_sparsertest_stat(ers:Error) {
                if (ers !== null) {
                    let err:string = ers.toString();
                    if (err.indexOf("no such file or directory") > 0) {
                        if (command === "build") {
                            global.sparser = (function node_sparsertest_stat_dummy():sparser {
                                let func:any = function () {};
                                    func.lexers = {};
                                    func.libs = {};
                                    func.options = {};
                                    func.parse  = {};
                                    func.parseerror = "";
                                    func.version = {
                                        date: "",
                                        number: ""
                                    };
                                return func;
                            }());
                            require(`${js}libs${sep}options.js`);
                            sparser = global.sparser;
                            args();
                        } else {
                            console.log(`The file js/parse.js has not been written.  Please run the build: ${text.cyan}node js/services build${text.none}`);
                            process.exit(1);
                            return;
                        }
                    } else {
                        console.log(err);
                        process.exit(1);
                        return;
                    }
                } else {
                    sparser = require(`${js}parse.js`);
                    args();
                }
            });
        }());

    // build/test system
    apps.build = function node_apps_build(test:boolean):void {
        let firstOrder:boolean = true,
            sectionTime:[number, number] = [0, 0],
            langlist:{} = {};
        const order = {
                build: [
                    "npminstall",
                    "typescript",
                    "libraries",
                    "inventory",
                    "demo",
                    "options_markdown",
                    "docshtml"
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
            // a short title for each build/test phase
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
            // indicates how long each phase took
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
            // the transition to the next phase or completion
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
                    apps.log([""]);
                    process.exit(0);
                    return;
                }
                order[type].splice(0, 1);
                phases[phase]();
            },
            // if content should be injected between two points of a file
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
                                        if (optName === "language" || optName === "lexer") {
                                            opts.push(`<input type="text" id="option-${optName}" value="auto" data-type="${opt.type}"/>`);
                                        } else {
                                            opts.push(`<input type="text" id="option-${optName}" value="${opt.default}" data-type="${opt.type}"/>`);
                                        }
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
                // phase documentation_html builds documentation in HTML format from the markdown files
                docshtml: function node_apps_build_docshtml():void {
                    heading("Converting documentation from markdown to HTML.");
                    node.fs.readdir(`${projectPath}docs-markdown`, "utf8", function node_apps_build_docshtml_readdir(er:Error, filelist:string[]):void {
                        let lexerLinks:string = "",
                            total:number = 0,
                            a:number = 0;
                        const list:[string, boolean][] = [],
                            newDir = function node_apps_build_docshtml_newDir(path:string, callback:Function):void {
                                node.fs.stat(path, function node_apps_build_docshtml_stat(ers:nodeError, stat:Stats):void {
                                    if (ers !== null) {
                                        if (ers.code === "ENOENT") {
                                            node.fs.mkdir(path, function node_apps_build_docshtml_stat_mkdir(erm:Error):void {
                                                if (erm !== null) {
                                                    apps.errout([erm.toString()]);
                                                    return;
                                                }
                                                callback();
                                            });
                                        } else {
                                            apps.errout([ers.toString()]);
                                        }
                                        return;
                                    }
                                    if (stat.isDirectory() === false) {
                                        apps.errout([`Path ${path + text.angry}exists but is not a directory${text.none}!`]);
                                        return;
                                    }
                                    callback();
                                });
                            },
                            lexers = function node_apps_build_docshtml_lexers():void {
                                filelist.forEach(function node_apps_build_docshtml_lexers(value:string):void {
                                    list.push([value, false]);
                                });
                                node.fs.readdir(`${projectPath}lexers`, function node_apps_build_docshtml_lexers_readdir(erd:Error, lexerList:string[]):void {
                                    if (erd !== null) {
                                        apps.errout([erd.toString()]);
                                        return;
                                    }
                                    let b:number = lexerList.length,
                                        c:number = 0;
                                    const links:string[] = ["<li>Lexers <ol>"];
                                    lexerList.sort();
                                    do {
                                        b = b - 2;
                                        c = b;
                                        if ((/\.md$/).test(lexerList[b + 1]) === true) {
                                            c = b + 1;
                                        } else if ((/\.md$/).test(lexerList[b]) === false) {
                                            apps.errout([`Lexer file ${lexerList[b]} does not have a matching markdown documentation file.`, "The markdown file must share the same file name as the corresponding lexer file except for file extension."]);
                                            return;
                                        }
                                        list.push([lexerList[c], true]);
                                        links.push(`<li><a href="lexers/${lexerList[c].replace(".md", ".xhtml")}">${lexerList[c].replace(".md", "")}</a></li>`);
                                    } while (b > 0);
                                    links.push("</ol></li>");
                                    lexerLinks = links.join("");
                                    total = list.length;
                                    convert(list[a]);
                                });
                            },
                            convert = function node_apps_build_docshtml_readdir_convert(fileitem:[string, boolean]) {
                                let fileOutput:string = "";
                                const readPath = (fileitem[1] === true)
                                        ? `${projectPath}lexers${sep + fileitem[0]}`
                                        : `${projectPath}docs-markdown${sep + fileitem[0]}`,
                                    writePath = (fileitem[1] === true)
                                        ? `${projectPath}docs-html${sep}lexers${sep + fileitem[0].replace(".md", ".xhtml")}`
                                        : `${projectPath}docs-html${sep + fileitem[0].replace(".md", ".xhtml")}`;
                                options.lexer = "markdown";
                                node.fs.readFile(readPath, "utf8", function node_apps_build_docshtml_readdir_convert_readfile(erf:Error, filedata:string):void {
                                    const doc:string[] = [],
                                        attribute = function node_apps_build_docshtml_readdir_convert_readfile_attribute():void {
                                            const index = doc.length - 1,
                                                add = function node_apps_build_docshtml_readdir_convert_readfile_attribute_add(ending:string):string {
                                                    return ` ${parse.token[b].replace(/\.md"$/, ".xhtml\"") + ending}`; 
                                                };
                                            doc[index] = doc[index].replace(/\/?>$/, add);
                                        };
                                    let parse:data,
                                        b:number = 1,
                                        len:number = 0;
                                    if (erf !== null) {
                                        apps.errout([erf.toString()]);
                                        return;
                                    }
                                    options.source = filedata;
                                    parse = sparser.parser();
                                    len = parse.token.length - 1;
                                    doc.push("<?xml version=\"1.0\" encoding=\"UTF-8\"?><!DOCTYPE html><html xml:lang=\"en\" xmlns=\"http://www.w3.org/1999/xhtml\">\n\n<!-- Automatically generated file. Do not manually alter! -->\n\n<head><title>");
                                    doc.push("Sparser");
                                    doc.push("</title> <link href=\"https://sparser.io/docs-html/");
                                    if (fileitem[1] === true) {
                                        doc.push("lexers/");
                                    }
                                    doc.push(fileitem[0].replace(".md", ".xhtml"));
                                    doc.push("\" rel=\"canonical\" type=\"application/xhtml+xml\"/> <meta content=\"width=device-width, initial-scale=1\" name=\"viewport\"/> <meta content=\"index, follow\" name=\"robots\"/> <meta content=\"Sparser - Universal Parser\" name=\"DC.title\"/> <meta content=\"#fff\" name=\"theme-color\"/> <meta content=\"Austin Cheney\" name=\"author\"/> <meta content=\"Sparser is a programming language parsing utility that can interpret many different languages using a single simple data model.\" name=\"description\"/> <meta content=\"Global\" name=\"distribution\"/> <meta content=\"en\" http-equiv=\"Content-Language\"/> <meta content=\"application/xhtml+xml;charset=UTF-8\" http-equiv=\"Content-Type\"/> <meta content=\"blendTrans(Duration=0)\" http-equiv=\"Page-Enter\"/> <meta content=\"blendTrans(Duration=0)\" http-equiv=\"Page-Exit\"/> <meta content=\"text/css\" http-equiv=\"content-style-type\"/> <meta content=\"application/javascript\" http-equiv=\"content-script-type\"/> <meta content=\"google515f7751c9f8a155\" name=\"google-site-verification\"/> <meta content=\"#bbbbff\" name=\"msapplication-TileColor\"/> <link href=\"/website.css\" media=\"all\" rel=\"stylesheet\" type=\"text/css\"/> </head><body id=\"documentation\"><div id=\"top_menu\"><h1><a href=\"/\">Sparser</a></h1>\n<ul><li class=\"donate\"><a href=\"https://liberapay.com/prettydiff/donate\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 80 80\" height=\"16\" width=\"16\" x=\"7\" y=\"7\"><g transform=\"translate(-78.37-208.06)\" fill=\"#111\"><path d=\"m104.28 271.1c-3.571 0-6.373-.466-8.41-1.396-2.037-.93-3.495-2.199-4.375-3.809-.88-1.609-1.308-3.457-1.282-5.544.025-2.086.313-4.311.868-6.675l9.579-40.05 11.69-1.81-10.484 43.44c-.202.905-.314 1.735-.339 2.489-.026.754.113 1.421.415 1.999.302.579.817 1.044 1.546 1.395.729.353 1.747.579 3.055.679l-2.263 9.278\"/><path d=\"m146.52 246.14c0 3.671-.604 7.03-1.811 10.07-1.207 3.043-2.879 5.669-5.01 7.881-2.138 2.213-4.702 3.935-7.693 5.167-2.992 1.231-6.248 1.848-9.767 1.848-1.71 0-3.42-.151-5.129-.453l-3.394 13.651h-11.162l12.52-52.19c2.01-.603 4.311-1.143 6.901-1.622 2.589-.477 5.393-.716 8.41-.716 2.815 0 5.242.428 7.278 1.282 2.037.855 3.708 2.024 5.02 3.507 1.307 1.484 2.274 3.219 2.904 5.205.627 1.987.942 4.11.942 6.373m-27.378 15.461c.854.202 1.91.302 3.167.302 1.961 0 3.746-.364 5.355-1.094 1.609-.728 2.979-1.747 4.111-3.055 1.131-1.307 2.01-2.877 2.64-4.714.628-1.835.943-3.858.943-6.071 0-2.161-.479-3.998-1.433-5.506-.956-1.508-2.615-2.263-4.978-2.263-1.61 0-3.118.151-4.525.453l-5.28 21.948\"/></g></svg> Donate</a></li> <li><a href=\"/demo/?scrolldown\">Demo</a></li> <li><a href=\"/docs-html/tech-documentation.xhtml\">Documentation</a></li> <li><a href=\"https://github.com/unibeautify/sparser\">Github</a></li> <li><a href=\"https://www.npmjs.com/package/sparser\">NPM</a></li></ul><span class=\"clear\"></span></div><div id=\"content\"><h1>");
                                    doc.push("<span>Sparser</span></h1>");
                                    do {
                                        if (parse.stack[b] === "h1" && parse.types[b] === "content" && parse.token[b].indexOf(" - ") > 0) {
                                            doc[1] = parse.token[b];
                                            if (parse.token[b].indexOf("Sparser") > -1) {
                                                doc[doc.length - 1] = `<span>Sparser</span>${parse.token[b].split(" - ")[1]}</h1>`;
                                            } else {
                                                doc[doc.length - 1] = `<span>Sparser</span>${parse.token[b]}</h1>`;
                                            }
                                        } else if (parse.token[b] === "</h1>") {
                                            b = b + 1;
                                            break;
                                        }
                                        b = b + 1;
                                    } while (b < len);
                                    doc.push("\n");
                                    do {
                                        if (parse.types[b] === "attribute") {
                                            attribute();
                                        } else if (parse.stack[b] === "code" && parse.types[b] === "content") {
                                            parse.token[b] = `<![CDATA[${parse.token[b].replace(/\s+$/, "")}]]>`;
                                            doc.push(parse.token[b]);
                                        } else if (parse.token[b] === "<h2>") {
                                            if (parse.token[b - 1] === "</h1>") {
                                                doc.push("<div class=\"section\"><h2>");
                                            } else if (fileitem[0] === "options.md") {
                                                doc.push("</div><div class=\"section\" id=\"option_list\"><h2>");
                                            } else {
                                                doc.push("</div><div class=\"section\"><h2>");
                                            }
                                        } else {
                                            if (fileitem[0] === "options.md" && parse.token[b] === "<td>" && parse.token[b - 1] === "<tr>") {
                                                doc.push("<th>");
                                            } else if (fileitem[0] === "options.md" && parse.token[b] === "</td>" && parse.token[b + 1] === "<td>") {
                                                doc.push("</th>");
                                            } else if (parse.types[b] === "start" && parse.types[b - 1] === "content" && b > 0 && "{[(".indexOf(parse.token[b - 1].charAt(parse.token[b - 1].length - 1)) < 0) {
                                                doc.push(` ${parse.token[b]}`);
                                            } else if (parse.types[b] === "end" && parse.types[b + 1] === "content" && b < len - 1 && ".,;:?!)]}".indexOf(parse.token[b + 1].charAt(0)) < 0) {
                                                doc.push(`${parse.token[b]} `);
                                            } else {
                                                doc.push(parse.token[b].replace(/\\\\"/g, "\\\""));
                                            }
                                        }
                                        if ((/<\/\w\d?>/).test(parse.token[b]) === true) {
                                            doc.push("\n");
                                        }
                                        b = b + 1;
                                    } while (b < len);
                                    doc.push(`</div></div><div id="blobs"><span id="svg_left"></span><span id="svg_right"></span><div></div></div><script src="/js/website.js" type="application/javascript"></script></body></html>`);
                                    fileOutput = doc.join("").replace(/<code>\n/g, "<code>").replace(/\n<\/code>/g, "</code>");
                                    fileOutput = fileOutput.replace(/<\/ol><p>For\s+<a\s+href="lexers">lexer\s+specific\s+documentation<\/a>\s+please\s+review\s+the\s+markdown\s+files\s+in\s+the\s+lexer\s+directory.<\/p>/, `${lexerLinks}</ol>`);
                                    node.fs.writeFile(writePath, fileOutput, "utf8", function node_apps_build_docshtml_readdir_convert_readfile_attribute_add_write(err:Error) {
                                        if (err !== null) {
                                            apps.errout([err.toString()]);
                                            return;
                                        }
                                        a = a + 1;
                                        if (a === total) {
                                            next(`${text.green}Converted ${text.cyan + text.bold + total + text.none + text.green} files from markdown to HTML.${text.none}`);
                                        } else {
                                            node_apps_build_docshtml_readdir_convert(list[a]);
                                        }
                                    });
                                });
                            };
                        if (er !== null) {
                            apps.errout([er.toString()]);
                            return;
                        }
                        newDir(`${projectPath}docs-html`, function node_apps_build_docshtml_callbackDocs():void {
                            newDir(`${projectPath}docs-html${sep}lexers`, function node_apps_build_docshtml_callbackLexers():void {
                                lexers();
                            });
                        });
                    });
                },
                // document the current inventory of supported languages
                inventory: function node_apps_build_inventory():void {
                    heading("Gathering inventory of supported languages...");
                    apps.inventory(function node_apps_build_inventory_callback(list:inventory) {
                        const keys:string[] = Object.keys(list),
                            keylen:number = keys.length,
                            index = function node_apps_build_inventory_index():void {
                                node.fs.readFile(`${projectPath}index.xhtml`, "utf8", function node_apps_build_inventory_website(erw:Error, filedata:string):void {
                                    const inv:string[] = ["<ul>"];
                                    let a:number = 0,
                                        b:number = 0,
                                        count:number = 0,
                                        langlen:number = 0;
                                    if (erw !== null) {
                                        apps.errout([erw.toString()]);
                                        return;
                                    }
                                    do {
                                        inv.push(`<li><h3>${keys[a]}</h3><ul>`);
                                        b = 0;
                                        langlen = list[keys[a]].length;
                                        do {
                                            inv.push(`<li><a href="${list[keys[a]][b][1]}">${list[keys[a]][b][0]}</a></li>`);
                                            count = count + 1;
                                            b = b + 1;
                                        } while (b < langlen);
                                        inv.push("</ul></li>");
                                        a = a + 1;
                                    } while (a < keylen);
                                    inv.push(`</ul> <p class="lang_total"><strong>${count}</strong> total languages.</p>`);
                                    node.fs.writeFile(`${projectPath}index.xhtml`, injection({
                                        end: "<!-- end html inventory -->",
                                        file: filedata.replace(/Version:\s+<span>(\d+\.\d+\.\d+)?<\/span>/, `Version: <span>${sparser.version.number}</span>`),
                                        message: inv.join(" "),
                                        start: "<h2>Currently Supported Languages by Processing Lexer</h2>"
                                    }), {
                                        encoding: "utf8"
                                    }, function node_apps_build_inventory_website_write(erh:Error) {
                                        if (erh !== null) {
                                            apps.errout([erh.toString()]);
                                            return;
                                        }
                                        next(`${text.green}Inventory of supported languages written to readme.md and html.${text.none}`);
                                    });
                                });
                            };
                        langlist = list;
                        keys.sort();
                        node.fs.readFile(`${projectPath}readme.md`, "utf8", function node_apps_build_inventory_readme(err:Error, filedata:string):void {
                            const inv:string[] = ["A list of supplied lexers and their various dedicated language support as indicated through use of logic with *options.language*. Other languages may be supported without dedicated logic."];
                            let a:number = 0,
                                b:number = 0,
                                count:number = 0,
                                langlen:number = 0;
                            if (err !== null) {
                                apps.errout([err.toString()]);
                                return;
                            }
                            inv.push("");
                            do {
                                inv.push(`* **${keys[a]}**`);
                                b = 0;
                                langlen = list[keys[a]].length;
                                do {
                                    inv.push(`   - [${list[keys[a]][b][0]}](${list[keys[a]][b][1]})`);
                                    count = count + 1;
                                    b = b + 1;
                                } while (b < langlen);
                                a = a + 1;
                            } while (a < keylen);
                            inv.push("");
                            inv.push(`*${count} total languages.*`);
                            inv.push("");
                            inv.push("");
                            node.fs.writeFile(`${projectPath}readme.md`, injection({
                                end: "## Build",
                                file: filedata,
                                message: inv.join(node.os.EOL),
                                start: "## Supported Languages"
                            }), {
                                encoding: "utf8"
                            }, function node_apps_build_inventory_readme_write(erw:Error) {
                                if (erw !== null) {
                                    apps.errout([erw.toString()]);
                                    return;
                                }
                                index();
                            });
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
                            node.fs.writeFile(`${js}parse.js`, `${parsefile}global.sparser=sparser;module.exports=sparser;return sparser;}());`, "utf8", function node_apps_build_libraries_appendFile_read_writeParse(erp:Error) {
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
                                    node.fs.writeFile(`${js}demo${sep}demo.js`, `/*global ace\u002a/${browserfile.replace(/\}\(\)\);\s*$/, "") + demofile}}());`, "utf8", function node_apps_build_libraries_appendFile_read_writeParse_writeBrowser_writeDemo(ers:Error) {
                                        if (ers !== null) {
                                            apps.error([ers.toString()]);
                                            return;
                                        }
                                        node.fs.writeFile(`${projectPath}readme.md`, readme, "utf8", function node_apps_build_libraries_appendFile_read_writeParse_writeBrowser_writeDemo_writeReadme(erm:Error) {
                                            if (erm !== null) {
                                                apps.error([erm.toString()]);
                                                return;
                                            }
                                            next(message);
                                        });
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
                                if (filename !== "all.js") {
                                    filedata = filedata
                                        .replace(/\/\*\s*global \w+(\s*,\s*\w+)*\s*\*\//, "")
                                        .replace(/^\s+/, "");
                                    if (filename === "demofile.js") {
                                        demofile = filedata.replace(/("|')use strict("|');/g, "");
                                    } else if (filename === "readme.md") {
                                        readme = filedata.replace(/##\s+Version\s+\d+\.\d+\.\d+/, `## Version ${sparser.version.number}`);
                                    } else if (filename === "parsefile.js") {
                                        parsefile = filedata
                                            .replace(/global\.sparser/g, "sparser")
                                            .replace(/sparser\s*=\s*sparser;?\s*\}\(\)\);\s*$/, "")
                                            .replace(/options\s*:\s*\{\},/, `options:${opts[0]},`)
                                            .replace(/version\s*:\s*\{\s*date\s*:\s*"(\d+\s+\w+\s+\d{4})?",\s*number\s*:\s*"(\d+\.\d+\.\d+)?"\s*\}/, `version:${opts[1]}`);
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
                                    if (pathitem.slice(pathitem.length - 3) === ".js" || pathitem === `${projectPath}readme.md`) {
                                        appendFile(pathitem);
                                    }
                                }
                            });
                        };
                    let a:number = 0,
                        filelen: number = 0,
                        demofile:string = "",
                        parsefile:string = "",
                        readme:string = "";
                    heading("Merging files for simplified application access.");
                    libFiles.push(`${js}parsefile.js`);
                    libFiles.push(`${js}demo${sep}demofile.js`);
                    libFiles.push(`${projectPath}readme.md`);
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
                                libFiles.forEach(function node_apps_build_libraries_libraryFiles_each(value:string):void {
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
                // phase options_markdown builds a markdown file of options documentation
                options_markdown: function node_apps_build_optionsMarkdown():void {
                    const doc:string[] = ["# Sparser - Options"],
                        lexers:lexerDoc = {},
                        lexerWrite = function node_apps_build_optionsMarkdown_lexerWrite():void {
                            const lexkeys:string[] = Object.keys(lexers);
                            files = lexkeys.length;
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
                                        lenl:number = langlist[lex].length,
                                        output:string[] = [];
                                    let aa:number = 0,
                                        bb:number = 0,
                                        vallen:number = 0,
                                        valkey:string[] = [];
                                    filedata = filedata.slice(0, filedata.indexOf(`<!-- Everything below this line is dynamically generated! -->`));
                                    output.push("<!-- Everything below this line is dynamically generated! -->");
                                    output.push("");
                                    output.push("## supported languages");
                                    do {
                                        output.push(`* [${langlist[lex][aa][0]}](${langlist[lex][aa][1]})`);
                                        aa = aa + 1;
                                    } while (aa < lenl);
                                    output.push("");
                                    output.push(`## ${lex} options`);
                                    if (lenx > 0) {
                                        aa = 0;
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
                                            node.fs.writeFile(`${projectPath}docs-markdown${sep}options.md`, doc.join("\n"), "utf8", function node_apps_build_optionsMarkdown_writeFile(err:Error) {
                                                if (err !== null) {
                                                    apps.errout([err.toString()]);
                                                    return;
                                                }
                                                next(`${text.green}Options documentation successfully written to markdown file.${text.none}`);
                                            });
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
                    doc.push("## Conventions");
                    doc.push("Options with a lexer value of *all* are assigned directly to the options object, such as `options.format`. All other options are assigned to an object named after the respective lexer under the `lexer_options` object, example: `options.lexer_options.style.no_lead_zero`.");
                    doc.push("");
                    doc.push("All option names are lowercase complete English words.  An option name comprising multiple words contains a single underscore between each word, example: `end_comma`.");
                    doc.push("");
                    doc.push("The options object is directly available from the *sparser* object. This means the options are centrally stored and externally available.  Here is an example in the browser, `window.sparser.options`.  The means to externally adjust options are by assigning directly to that object, such as `window.sparser.options.format = \"objects\"`.");
                    doc.push("");
                    doc.push("## Option List");
                    node.fs.readdir(`${projectPath}lexers`, function node_apps_build_optionsMarkdown_readdir(erd:Error, lexfiles:string[]):void {
                        if (erd !== null) {
                            apps.errout([erd.toString()]);
                            return;
                        }
                        a = lexfiles.length;
                        do {
                            a = a - 1;
                            if (lexfiles[a].indexOf(".ts") === lexfiles[a].length - 3) {
                                lexers[lexfiles[a].replace(".ts", "")] = [];
                            }
                        } while (a > 0);
                        a = 0;
                        do {
                            doc.push("");
                            doc.push(`### ${optkeys[a]}`);
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
                                    lexers[def[optkeys[a]].lexer[b]].push(optkeys[a]);
                                    b = b + 1;
                                } while (b < lenv);
                                doc.push(`use        | ${vals.join(", ")}`);
                            }
                            if (def[optkeys[a]].values !== undefined) {
                                vals = Object.keys(def[optkeys[a]].values);
                                valstring = [`values     | ${vals[0]}`];
                                b = 1;
                                lenv = vals.length;
                                do {
                                    valstring.push(vals[b]);
                                    b = b + 1;
                                } while (b < lenv);
                                doc.push(valstring.join(", "));
                                b = 0;
                                doc.push("");
                                doc.push("#### Value Definitions");
                                do {
                                    if (def[optkeys[a]].values[vals[b]].indexOf("example: ") > 0) {
                                        doc.push(`* **${vals[b]}** - ${def[optkeys[a]].values[vals[b]].replace("example: ", "example: `").replace(/.$/, "`.")}`);
                                    } else {
                                        doc.push(`* **${vals[b]}** - ${def[optkeys[a]].values[vals[b]]}`);
                                    }
                                    b = b + 1;
                                } while (b < lenv);
                            }
                            a = a + 1;
                        } while (a < keyslen);
                        lexerWrite();
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
                        incremental:string = (process.argv.indexOf("incremental") > -1)
                            ? "--incremental"
                            : "--pretty",
                        command:string = (process.argv.indexOf("local") > -1)
                            ? `node_modules\\.bin\\tsc ${incremental}`
                            : `tsc ${incremental}`,
                        ts = function node_apps_build_typescript_ts() {
                            node.child(command, {
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
        if (sparser.parser === undefined) {
            order.build.pop();
        }
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
                property: "description",
                total: true
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
            apps.log(output);
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
                                output.push(JSON.stringify(result));
                                output.push("");
                                apps.wrapit(output, `Pretty Diff found ${text.green + apps.commas(result.length) + text.none} matching items from address ${text.cyan + startPath + text.none} with a total file size of ${text.green + apps.commas(size) + text.none} bytes.`);
                                apps.log(output);
                            } else {
                                apps.log([JSON.stringify(result)]);
                            }
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
                                apps.log([`Requested artifact, ${text.cyan + startPath + text.none}, ${text.angry}is missing${text.none}.`]);
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
                            apps.log([`Requested artifact, ${text.cyan + startPath + text.none}, ${text.angry}is missing${text.none}.`]);
                            return;
                        }
                        apps.errout([angrypath]);
                        return;
                    }
                    if (stat.isDirectory() === true) {
                        if (type === true) {
                            apps.log(["directory"]);
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
                            apps.log(["symbolicLink"]);
                            return;
                        }
                        populate("link");
                    } else if (stat.isFile() === true || stat.isBlockDevice() === true || stat.isCharacterDevice() === true) {
                        if (type === true) {
                            if (stat.isBlockDevice() === true) {
                                apps.log(["blockDevice"]);
                            } else if (stat.isCharacterDevice() === true) {
                                apps.log(["characterDevice"]);
                            } else {
                                apps.log(["file"]);
                            }
                            return;
                        }
                        size = size + stat.size;
                        populate("file");
                    } else {
                        if (type === true) {
                            if (stat.isFIFO() === true) {
                                apps.log(["FIFO"]);
                            } else if (stat.isSocket() === true) {
                                apps.log(["socket"]);
                            } else {
                                apps.log(["unknown"]);
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
        } else if (process.argv.indexOf("sparser_debug") > -1) {
            debug();
        } else {
            error();
        }
    };
    // set options from conventions on the file name
    apps.fileNameOptions = function node_apps_fileNameOptions(filename:string):void {
        const notes:string[] = filename.split("_"),
            noteslen:number = notes.length;
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
                    if (notes[b] !== "source") {
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
                    apps.log([file.toString()]);
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
            `${text.cyan}node js/services commands${text.none}`,
            "",
            "To see more detailed documentation for specific command supply the command name:",
            `${text.cyan}node js/services commands performance${text.none}`,
            "",
            "* Read the documentation             - cat readme.md",
            "* Read about the lexers              - cat lexers/readme.md",
        ]);
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
    apps.inventory = function node_apps_inventory(callback:Function):void {
        const textwrap:string[] = [],
            list:inventory = {};
        let longest:number = 0,
            total:number = 0;
        if (command === "inventory") {
            verbose = true;
            callback = function node_apps_inventory_callback():void {
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
                let a:number = 0,
                    b:number = 0,
                    langlen:number = 0,
                    count:number = 0;
                keys.sort();
                a = 0;
                output.push(`${text.underline}Inventory of mentioned languages${text.none}`);
                output.push("");
                apps.wrapit(textwrap,"A list of supplied lexers and their various dedicated language support as indicated through use of logic with 'options.language'. Other languages may be supported without dedicated logic.");
                textwrap.forEach(function node_apps_inventory(value:string):void {
                    output.push(value);
                });
                output.push("");
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
                output.push("");
                output.push(`${count} total langauges.`);
                apps.log(output);
            };
        }
        node.fs.readFile(`${projectPath}docs-markdown${sep}language-support.md`, {
            encoding: "utf8"
        }, function node_app_inventory_readLanguages(erl:Error, langlist:string):void {
            if (erl !== null) {
                apps.errout([erl.toString()]);
                return;
            }
            const langs:string[] = langlist
                    .replace(/#\s+Sparser\s+-\s+Language\sSupport\s+Language\ssupport\sis\sorganized\sby\srespective\slexer\sfile\.\s+/, "")
                    .replace(/\r\n/g, "\n")
                    .replace(/\n+/g, "\n")
                    .split("\n"),
                len:number = langs.length;
            let a:number = 0,
                lex:string = "",
                name:string = "",
                uri:string = "";
            do {
                if (langs[a].indexOf("- ") < 3 && langs[a].indexOf("- ") > -1) {
                    lex = langs[a].replace(/^\s*-\s+/, "");
                    list[lex] = [];
                } else if (lex !== "") {
                    name = langs[a].slice(langs[a].indexOf("[") + 1, langs[a].indexOf("]"));
                    uri = langs[a].slice(langs[a].indexOf("](") + 2, langs[a].length - 1);
                    if (name.length > longest) {
                        longest = name.length;
                    }
                    list[lex].push([name, uri]);
                    total = total + 1;
                }
                a = a + 1;
            } while (a < len);
            callback(list);
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
                    apps.log([`Lint complete for ${lintpath}`]);
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
                                        if (callback === undefined) {
                                            console.log(`${text.green}Lint complete for ${text.cyan + text.bold + filesLinted + text.none + text.green} files!${text.none}`);
                                        } else {
                                            callback(`${text.green}Lint complete for ${text.cyan + text.bold + filesLinted + text.none + text.green} files!${text.none}`);
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
        // * lists.total     - number  - To display a count
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
        output.push("");
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
        } else if (command === "options" && lists.total === true) {
            output.push(`${text.green + lenn + text.none} matching option${plural}.`);
        }
        apps.log(output);
    };
    // verbose metadata printed to the shell about Sparser
    apps.log = function node_apps_log(output:string[]):void {
        if (performance.test === true) {
            performance.end = process.hrtime(performance.start);
            const time = (performance.end[0] * 1e9) + performance.end[1];
            performance.store.push(time);
            if (performance.index > 0) {
                if (performance.index < 10) {
                    console.log(`${text.yellow + performance.index + text.none}:  ${time}`);
                } else {
                    console.log(`${text.yellow + performance.index + text.none}: ${time}`);
                }
            } else {
                console.log(`${text.yellow}0:${text.none}  ${time} ${text.angry}(first run is ignored)${text.none}`);
            }
            options.diff = performance.diff;
            options.source = performance.source;
            performance.index = performance.index + 1;
            // specifying a delay between intervals allows for garbage collection without interference to the performance testing
            setTimeout(apps.performance, 400);
            return;
        }
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
    // CLI documentation for supported Sparser options
    apps.options = function node_apps_options():void {
        const def:optionDef = sparser.libs.optionDef;
        if (def[process.argv[0]] === undefined) {
            if (process.argv.length < 1) {
                // all options in a list
                apps.lists({
                    emptyline: false,
                    heading: "Options",
                    obj: def,
                    property: "definition",
                    total: true
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
                    value:string = "",
                    isArray:boolean = false;
                do {
                    namevalue(process.argv[a]);
                    b = 0;
                    do {
                        isArray = Array.isArray(def[keys[b]][name]);
                        if (def[keys[b]][name] === undefined || (isArray === true && def[keys[b]][name].indexOf(value) < 0) || (isArray === false && value !== "" && def[keys[b]][name] !== value)) {
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
                    apps.log([`${text.angry}Sparser has no options matching the query criteria.${text.none}`]);
                } else {
                    apps.lists({
                        emptyline: false,
                        heading: "Options",
                        obj: output,
                        property: "definition",
                        total: true
                    });
                }
            }
        } else {
            // specificly mentioned option
            apps.lists({
                emptyLine: false,
                heading: `Option: ${text.green + process.argv[0] + text.none}`,
                obj: def[process.argv[0]],
                property: "eachkey",
                total: false
            });
        }
        verbose = true;
        apps.log([""]);
    };
    // reads from a file and returns to standard output
    apps.parse = function node_apps_parse():void {
        if (process.argv.length < 1) {
            apps.errout([
                `The parse command requires a ${text.angry}file system path${text.none}.`,
                "Please run this command for examples:",
                `${text.cyan}node js/services commands parse${text.none}`
            ]);
            return;
        }
        const path:string = (options.source === "")
                ? process.argv[0]
                : options.source,
            files:{} = {},
            parseAll = function node_apps_parse_parseAll():void {
                const keys:string[] = Object.keys(files),
                    len:number = keys.length,
                    log:string[] = [],
                    plural:string = (fcount === 1)
                        ? ""
                        : "s";
                let a:number = 0,
                    output:string = "",
                    str:string = "";
                do {
                    options.source = files[keys[a]];
                    files[keys[a]] = sparser.parser();
                    a = a + 1;
                } while (a < len);
                a = process.argv.length;
                do {
                    a = a - 1;
                    if (process.argv[a].indexOf("output:") === 0) {
                        output = node.path.normalize(process.argv[a].slice(7));
                        break;
                    }
                } while (a > 0);
                // if there is only 1 file then just return the parse table
                if (options.format === "csv" || options.format === "markdown" || options.format === "table") {
                    str = (len === 1)
                    ? files[keys[0]]
                    : files;
                } else {
                    str = (len === 1)
                        ? JSON.stringify(files[keys[0]])
                        : JSON.stringify(files);
                }
                performance.codeLength = str.length;
                if (output === "") {
                    log.push(str);
                    if (verbose === true) {
                        log.push("");
                        log.push(`Parse complete for ${text.green + text.bold + fcount + text.none} file${plural}!`);
                    }
                    apps.log(log);
                } else {
                    node.fs.writeFile(output, str, {
                        encoding: "utf8"
                    }, function node_apps_parse_parseAll_write(erw:Error):void {
                        if (erw !== null) {
                            apps.errout([erw.toString()]);
                            return;
                        }
                        log.push("");
                        log.push(`Parse complete for ${text.green + text.bold + fcount + text.none} file${plural} and successfully written to ${text.cyan + output + text.none}!`);
                        verbose = true;
                        apps.log(log);
                    });
                }
            },
            readFile = function node_apps_parse_readFile(filepath:string):void {
                node.fs.readFile(filepath, "utf8", function node_apps_parse_readFile_read(er:Error, filedata:string):void {
                    if (er !== null) {
                        apps.errout([er.toString()]);
                        return;
                    }
                    files[filepath] = filedata;
                    count = count + 1;
                    fcount = fcount + 1;
                    if (count === total) {
                        parseAll();
                    }
                });
            };
        let total:number = 0,
            count:number = 0,
            fcount:number = 0;
        apps.directory({
            callback: function node_apps_parse_callback(filelist:directoryList):void {
                total = filelist.length;
                if (total === 1 && filelist[0][1] !== "file") {
                    apps.log([filelist[0], "Parse command received an empty directory."]);
                } else {
                    let a: number = 0;
                    do {
                        if (filelist[a][1] === "file") {
                            readFile(filelist[a][0]);
                        } else {
                            count = count + 1;
                            if (count === total) {
                                parseAll();
                            }
                        }
                        a = a + 1;
                    } while (a < total);
                }
            },
            exclusions: exclusions,
            path: node.path.normalize(path),
            recursive: true,
            symbolic: true
        });
    };
    // handler for the performance command
    apps.performance = function node_apps_performance():void {
        if (performance.test === false) {
            if (process.argv.length < 1) {
                return apps.errout([
                    `The ${text.angry}performance${text.none} command requires a Pretty Diff command to performance test.`,
                    `Example: ${text.cyan}sparser performance ${text.bold}beautify js/services.js${text.none}`,
                    "",
                    `See available commands with ${text.cyan}sparser commands${text.none}`
                ]);
            }
            command = process.argv[0];
            if (command === "build") {
                apps.errout(["The performance tool cannot test the build command.  This creates too much noise and potential for corruption."]);
                return;
            }
            if (command === "performance") {
                apps.errout(["The performance tool cannot test itself.  This creates an endless loop."]);
                return;
            }
            if (commands[command] === undefined) {
                apps.errout([`Command ${text.angry + command + text.none} is not defined.`]);
                return;
            }
            console.log("");
            console.log(`${text.bold}Pretty Diff - Performance Test Tool${text.none}`);
            console.log(`There is a ${text.cyan}400ms delay between intervals${text.none} to allow for garbage collection to complete before adversely impacting the next test cycle.`);
            console.log("");
            performance.source = options.source;
            performance.test = true;
            verbose = false;
            process.argv.splice(0, 1);
        }
        if (performance.index < 11) {
            performance.start = process.hrtime();
            apps[command]();
        } else {
            let total:number = 0,
                low:number = 0,
                high:number = 0,
                log:string[] = [];
            console.log("");
            performance.store.forEach(function node_apps_performance_total(value:number) {
                total = total + value;
                if (value > high) {
                    high = value;
                } else if (value < low) {
                    low = value;
                }
            });
            performance.test = false;
            verbose = true;
            command = "performance";
            log.push(`[${text.bold + text.green + (total / 1e7) + text.none}] Milliseconds, \u00b1${text.cyan + ((((high - low) / total) / 2) * 100).toFixed(2) + text.none}%`);
            if (performance.codeLength > 0) {
                log.push(`[${text.cyan + apps.commas(performance.codeLength) + text.none}] Character size of task's output to terminal.`);
            }
            apps.log(log);
        }
    };
    // similar to posix "rm -rf" command
    apps.remove = function node_apps_remove(filepath:string, callback:Function):void {
        const numb:any = {
                dirs: 0,
                file: 0,
                link: 0,
                size: 0
            },
            removeItems = function node_apps_remove_removeItems(filelist:directoryList):void {
                let a:number = 0;
                const len:number = filelist.length,
                    destroy = function node_apps_remove_removeItems_destroy(item:directoryItem) {
                        const type:"rmdir"|"unlink" = (item[1] === "directory")
                            ? "rmdir"
                            : "unlink";
                        node.fs[type](item[0], function node_apps_remove_removeItems_destroy_callback(er:nodeError):void {
                            if (verbose === true && er !== null && er.toString().indexOf("no such file or directory") < 0) {
                                if (er.code === "ENOTEMPTY") {
                                    node_apps_remove_removeItems_destroy(item);
                                    return;
                                }
                                apps.errout([er.toString()]);
                                return;
                            }
                            if (item[0] === filelist[0][0]) {
                                callback();
                            } else {
                                filelist[item[2]][3] = filelist[item[2]][3] - 1;
                                if (filelist[item[2]][3] < 1) {
                                    node_apps_remove_removeItems_destroy(filelist[item[2]]);
                                }
                            }
                        });
                    };
                if (filelist.length < 1) {
                    callback();
                    return;
                }
                do {
                    if (command === "remove") {
                        if (filelist[a][1] === "file") {
                            numb.file = numb.file + 1;
                            numb.size = numb.size + filelist[a][4].size;
                        } else if (filelist[a][1] === "directory") {
                            numb.dirs = numb.dirs + 1;
                        } else if (filelist[a][1] === "link") {
                            numb.link = numb.link + 1;
                        }
                    }
                    if ((filelist[a][1] === "directory" && filelist[a][3] === 0) || filelist[a][1] !== "directory") {
                        destroy(filelist[a]);
                    }
                    a = a + 1;
                } while (a < len);
            };
        if (command === "remove") {
            if (process.argv.length < 1) {
                apps.errout([
                    "Command remove requires a filepath",
                    `${text.cyan}sparser remove ../jsFiles${text.none}`
                ]);
                return;
            }
            filepath = node.path.resolve(process.argv[0]);
            callback = function node_apps_remove_callback() {
                const out = ["Pretty Diff removed "];
                verbose = true;
                console.log("");
                out.push(text.angry);
                out.push(String(numb.dirs));
                out.push(text.none);
                out.push(" director");
                if (numb.dirs === 1) {
                    out.push("y, ");
                } else {
                    out.push("ies, ");
                }
                out.push(text.angry);
                out.push(String(numb.file));
                out.push(text.none);
                out.push(" file");
                if (numb.dirs !== 1) {
                    out.push("s");
                }
                out.push(", ");
                out.push(text.angry);
                out.push(String(numb.link));
                out.push(text.none);
                out.push(" symbolic link");
                if (numb.symb !== 1) {
                    out.push("s");
                }
                out.push(" at ");
                out.push(text.angry);
                out.push(apps.commas(numb.size));
                out.push(text.none);
                out.push(" bytes.");
                apps.log([out.join(""), `Removed ${text.cyan + filepath + text.none}`], "", "");
            };
        }
        apps.directory({
            callback: removeItems,
            exclusions: [],
            path: filepath,
            recursive: true,
            symbolic: true
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
                        : request.url;
                const localpath:string = (uri === "/")
                    ? `${projectPath}index.xhtml`
                    : (uri === "/demo/")
                        ? `${projectPath}demo${sep}index.xhtml`
                        : projectPath + uri.slice(1).replace(/\/$/, "").replace(/\//g, sep);
                node.fs.stat(localpath, function node_apps_server_create_stat(ers:nodeError, stat:Stats):void {
                    const random:number = Math.random(),
                        page:string = [
                            `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xml:lang="en" xmlns="http://www.w3.org/1999/xhtml"><head><title>Sparser - Universal Parser</title><link href="https://sparser.io" rel="canonical" type="application/xhtml+xml"/><meta content="width=device-width, initial-scale=1" name="viewport"/><meta content="index, follow" name="robots"/><meta content="#fff" name="theme-color"/><meta content="en" http-equiv="Content-Language"/><meta content="application/xhtml+xml;charset=UTF-8" http-equiv="Content-Type"/><meta content="blendTrans(Duration=0)" http-equiv="Page-Enter"/><meta content="blendTrans(Duration=0)" http-equiv="Page-Exit"/><meta content="text/css" http-equiv="content-style-type"/><meta content="application/javascript" http-equiv="content-script-type"/><meta content="#bbbbff" name="msapplication-TileColor"/><link href="/website.css?${random}" media="all" rel="stylesheet" type="text/css"/></head><body>`,
                            `<div id="top_menu"><h1><a href="/">Sparser</a></h1><ul><li class="donate"><a href="https://liberapay.com/prettydiff/donate"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" height="16" width="16" x="7" y="7"><g transform="translate(-78.37-208.06)" fill="#111"><path d="m104.28 271.1c-3.571 0-6.373-.466-8.41-1.396-2.037-.93-3.495-2.199-4.375-3.809-.88-1.609-1.308-3.457-1.282-5.544.025-2.086.313-4.311.868-6.675l9.579-40.05 11.69-1.81-10.484 43.44c-.202.905-.314 1.735-.339 2.489-.026.754.113 1.421.415 1.999.302.579.817 1.044 1.546 1.395.729.353 1.747.579 3.055.679l-2.263 9.278"/><path d="m146.52 246.14c0 3.671-.604 7.03-1.811 10.07-1.207 3.043-2.879 5.669-5.01 7.881-2.138 2.213-4.702 3.935-7.693 5.167-2.992 1.231-6.248 1.848-9.767 1.848-1.71 0-3.42-.151-5.129-.453l-3.394 13.651h-11.162l12.52-52.19c2.01-.603 4.311-1.143 6.901-1.622 2.589-.477 5.393-.716 8.41-.716 2.815 0 5.242.428 7.278 1.282 2.037.855 3.708 2.024 5.02 3.507 1.307 1.484 2.274 3.219 2.904 5.205.627 1.987.942 4.11.942 6.373m-27.378 15.461c.854.202 1.91.302 3.167.302 1.961 0 3.746-.364 5.355-1.094 1.609-.728 2.979-1.747 4.111-3.055 1.131-1.307 2.01-2.877 2.64-4.714.628-1.835.943-3.858.943-6.071 0-2.161-.479-3.998-1.433-5.506-.956-1.508-2.615-2.263-4.978-2.263-1.61 0-3.118.151-4.525.453l-5.28 21.948"/></g></svg> `,
                            `Donate</a></li><li><a href="demo/?scrolldown">Demo</a></li><li><a href="/docs-html/tech-documentation.xhtml">Documentation</a></li><li><a href="https://github.com/unibeautify/sparser">Github</a></li><li><a href="https://www.npmjs.com/package/sparser">NPM</a></li></ul><span class="clear"></span></div><div id="content"><h1><span>Sparser</span>The Universal Parser</h1><div class="section">insertme</div></div><div id="blobs"><span id="svg_left">`,
                            `<svg height="758.000000pt" preserveAspectRatio="xMaxYMax meet" version="1.0" viewBox="0 0 1280.000000 758.000000" width="1280.000000pt" xmlns="http://www.w3.org/2000/svg"><g fill="#000000" stroke="none" transform="translate(0.000000,758.000000) scale(0.100000,-0.100000)"><path d="M5610 7574 c-14 -2 -52 -9 -85 -15 -141 -24 -304 -91 -435 -177 -246 -162 -420 -398 -509 -687 -46 -152 -56 -223 -56 -417 0 -97 -1 -176 -1 -175 -1 1 -27 50 -57 109 -208 404 -559 750 -973 959 -75 38 -104 58 -104 71 0 58 -98 168 -167 188 -21 6 -59 10 -84 8 l-46 -3 13 -46 c24 -81 107 -147 216 -170 97 -21 283 -130 458 -269 100 -79 300 -282 390 -396 173 -217 325 -509 384 -739 43 -171 85 -580 93 -920 5 -228 -7 -589 -24 -700 -6 -40 -6 -40 -20 30 -21 105 -81 308 -120 410 -214 551 -572 910 -1030 1032 -85 23 -118 26 -258 27 -176 1 -245 -11 -385 -65 -251 -96 -451 -320 -516 -574 -23 -91 -23 -256 -1 -348 63 -256 257 -456 508 -524 86 -23 252 -23 339 0 240 63 431 264 475 500 19 98 19 153 0 242 -17 81 -63 197 -75 190 -5 -3 2 -29 15 -58 36 -79 59 -207 51 -286 -17 -167 -66 -272 -180 -386 -130 -132 -264 -188 -451 -188 -182 -1 -325 60 -460 197 -86 87 -128 156 -167 271 -20 61 -23 89 -22 210 0 124 3 148 26 212 178 499 772 700 1299 438 404 -200 694 -609 839 -1185 163 -647 95 -1341 -189 -1936 -177 -370 -417 -687 -676 -893 -388 -308 -805 -713 -1110 -1077 -58 -69 -105 -129 -105 -134 0 -9 99 -90 109 -89 3 0 35 37 71 82 193 242 541 608 795 836 337 303 733 601 1096 826 127 79 154 90 310 124 253 57 393 72 654 72 221 0 352 -14 581 -62 194 -40 332 -86 491 -164 106 -52 144 -76 191 -123 68 -69 123 -88 217 -77 51 7 55 9 49 29 -21 73 -97 118 -203 117 -39 0 -76 -3 -81 -6 -6 -4 -47 17 -92 46 -217 139 -515 237 -853 280 -225 29 -636 11 -868 -37 -38 -8 -71 -14 -75 -14 -13 1 193 111 373 199 394 193 824 365 985 392 108 19 354 16 475 -6 524 -92 953 -416 1175 -888 55 -118 90 -224 122 -369 30 -139 32 -445 4 -583 -72 -357 -252 -621 -510 -746 -110 -53 -203 -72 -329 -67 -120 5 -197 29 -293 89 -80 51 -135 113 -180 204 -94 189 -58 393 95 546 228 227 599 201 715 -51 37 -80 36 -157 -4 -237 -96 -191 -346 -190 -447 1 -23 43 -23 160 1 205 13 24 14 32 4 29 -24 -8 -49 -98 -43 -161 21 -240 309 -331 474 -151 150 164 81 425 -138 527 -194 91 -449 40 -612 -123 -215 -215 -212 -549 5 -765 76 -75 150 -120 261 -156 101 -34 287 -34 395 0 349 109 592 412 677 846 23 114 25 463 4 570 -78 403 -248 707 -545 973 -228 204 -558 354 -861 392 -129 16 -158 21 -153 25 2 2 100 29 218 59 574 147 1078 219 1700 241 85 3 306 10 490 15 626 19 979 56 1294 136 93 24 119 26 331 27 221 1 234 0 330 -26 59 -16 149 -52 220 -87 298 -149 498 -398 587 -728 26 -100 36 -322 18 -441 -39 -267 -188 -526 -398 -693 -341 -271 -781 -321 -1167 -134 -133 65 -214 125 -320 238 -135 143 -228 332 -256 518 -47 321 113 643 386 778 137 68 310 82 454 37 355 -113 498 -536 274 -813 -45 -55 -33 -71 13 -17 83 98 131 253 119 380 -13 140 -64 245 -169 351 -334 334 -928 164 -1096 -314 -41 -116 -54 -204 -47 -334 7 -145 33 -244 102 -383 155 -313 454 -536 815 -606 98 -19 328 -16 428 5 242 51 432 153 603 325 457 457 467 1181 24 1660 -193 208 -487 349 -770 370 l-90 6 145 71 c242 118 395 222 559 379 240 231 401 515 467 825 25 119 25 363 0 480 -55 254 -164 459 -329 617 -213 204 -473 304 -752 290 -401 -21 -727 -278 -826 -652 -31 -121 -29 -290 6 -410 80 -271 271 -460 537 -527 117 -29 291 -23 400 16 84 29 168 73 168 86 0 5 -30 -6 -67 -25 -206 -103 -447 -102 -652 5 -180 94 -314 268 -366 475 -22 89 -23 256 -1 347 63 268 264 493 525 588 241 88 493 74 726 -39 554 -271 755 -962 458 -1571 -162 -330 -432 -592 -808 -782 -480 -243 -952 -326 -1955 -343 -381 -6 -777 -21 -902 -33 -43 -5 -78 -5 -77 -2 0 3 49 29 109 58 222 109 430 263 620 458 164 169 278 329 376 527 23 46 42 73 50 70 7 -2 30 5 53 16 92 47 151 125 151 200 0 67 -5 72 -56 56 -25 -7 -60 -25 -79 -39 -40 -31 -95 -136 -95 -181 0 -38 -65 -161 -148 -280 -209 -300 -552 -596 -892 -769 -193 -99 -324 -145 -472 -166 -692 -102 -1303 -275 -1998 -567 -8 -3 21 32 65 78 356 372 552 787 597 1263 9 94 15 126 25 126 24 0 82 73 104 130 24 63 20 115 -12 167 l-21 33 -26 -19 c-89 -63 -122 -166 -90 -273 23 -79 -37 -396 -112 -582 -48 -121 -182 -381 -247 -478 -78 -116 -205 -269 -301 -360 -146 -139 -225 -194 -415 -289 -266 -134 -509 -273 -756 -433 -56 -36 -104 -66 -107 -66 -3 0 10 21 29 48 197 271 382 707 456 1077 43 212 54 333 57 605 2 176 8 299 18 365 40 256 51 434 51 815 0 442 -9 550 -87 1100 -29 210 -32 535 -5 658 101 457 400 779 837 903 74 21 106 24 255 24 133 0 186 -4 245 -19 368 -92 642 -356 737 -712 23 -86 26 -118 26 -244 0 -123 -4 -160 -26 -243 -72 -271 -264 -505 -522 -635 -320 -160 -706 -113 -929 112 -198 201 -239 494 -98 711 186 289 610 298 740 16 32 -70 36 -176 8 -229 -9 -18 -15 -39 -13 -45 3 -7 15 11 28 38 33 72 32 171 -3 247 -50 108 -140 180 -263 213 -164 42 -329 -8 -462 -140 -120 -119 -170 -254 -160 -430 6 -109 25 -175 79 -278 43 -82 173 -212 263 -265 501 -293 1210 23 1398 623 76 244 59 531 -46 758 -142 306 -425 528 -770 603 -70 15 -306 27 -357 18z"/><path d="M3463 7528 c-24 -36 -28 -51 -28 -117 0 -60 5 -86 24 -125 24 -49 90 -126 108 -126 5 0 20 21 33 48 32 63 39 175 15 237 -15 41 -94 125 -116 125 -5 0 -21 -19 -36 -42z"/><path d="M3312 7094 c-70 -18 -119 -53 -153 -108 l-28 -45 50 -16 c67 -23 149 -16 213 15 44 23 146 120 146 140 0 11 -91 30 -138 29 -20 0 -61 -7 -90 -15z"/><path d="M7750 6299 c-6 -23 -9 -58 -5 -78 10 -60 61 -139 109 -169 48 -30 118 -128 161 -225 14 -32 25 -59 25 -62 0 -2 -24 20 -52 49 -93 92 -205 131 -308 106 -47 -11 -51 -15 -46 -36 21 -82 72 -140 158 -179 75 -34 233 -49 249 -24 14 23 25 -1 40 -86 19 -108 16 -243 -6 -340 l-19 -80 -8 55 c-24 157 -164 291 -321 307 l-53 5 -12 -39 c-17 -58 -15 -92 12 -148 41 -87 147 -169 265 -206 35 -10 66 -17 69 -15 2 3 -45 53 -104 113 -90 89 -208 233 -191 233 3 0 29 -33 60 -72 62 -82 137 -162 215 -230 l52 -46 -35 -68 c-20 -37 -53 -91 -75 -120 -21 -28 -36 -54 -33 -57 3 -4 31 7 62 23 55 27 59 32 105 124 26 53 58 138 71 188 13 51 24 80 24 65 1 -18 5 -26 12 -21 6 3 14 2 18 -4 10 -16 113 29 168 74 99 81 141 192 113 296 -10 35 -13 37 -43 31 -121 -22 -211 -107 -253 -238 l-13 -40 0 50 c-1 72 -18 165 -45 251 -13 40 -20 72 -16 69 4 -2 32 12 61 33 96 67 162 197 144 288 -7 39 -41 114 -51 114 -20 0 -108 -58 -129 -85 -53 -71 -74 -183 -53 -285 7 -32 6 -31 -21 16 -33 61 -66 110 -95 142 -18 20 -21 37 -21 111 0 73 -4 94 -26 136 -25 49 -79 96 -126 110 -19 5 -23 1 -33 -36z m630 -789 c-6 -11 -13 -20 -16 -20 -2 0 0 9 6 20 6 11 13 20 16 20 2 0 0 -9 -6 -20z m-140 -184 c0 -2 -8 -10 -17 -17 -16 -13 -17 -12 -4 4 13 16 21 21 21 13z"/><path d="M12203 6278 c-39 -75 -14 -183 64 -269 44 -49 87 -138 119 -248 26 -90 32 -140 9 -78 -52 141 -211 248 -341 230 l-41 -5 9 -52 c17 -92 74 -157 183 -207 68 -31 185 -50 185 -29 0 9 4 9 16 -1 15 -12 16 -32 11 -154 -16 -383 -177 -646 -523 -851 -33 -20 -9 -25 61 -13 49 8 79 20 113 46 155 116 290 297 352 470 13 35 29 68 37 74 11 10 12 8 7 -6 -7 -16 -3 -17 37 -11 69 11 164 60 217 113 55 55 82 119 82 195 l0 48 -55 0 c-94 0 -184 -50 -242 -135 l-35 -50 5 45 c6 44 -5 194 -19 258 -5 24 -3 32 7 32 30 0 116 49 157 89 80 78 109 177 80 272 -12 43 -22 46 -79 25 -101 -36 -168 -138 -178 -270 l-6 -81 -13 45 c-8 25 -32 81 -54 126 l-40 81 16 47 c37 109 1 228 -86 280 -35 21 -35 21 -55 -16z m507 -861 c0 -1 -24 -25 -52 -52 l-53 -50 50 53 c46 48 55 57 55 49z m-110 -110 c0 -2 -10 -12 -22 -23 l-23 -19 19 23 c18 21 26 27 26 19z m-80 -71 c0 -2 -8 -10 -17 -17 -16 -13 -17 -12 -4 4 13 16 21 21 21 13z"/><path d="M11984 5514 c-30 -44 -31 -143 -3 -201 30 -63 129 -160 206 -200 95 -51 95 -47 0 79 -59 79 -157 243 -157 264 0 5 26 -36 58 -91 65 -112 87 -146 152 -228 41 -52 46 -56 58 -40 9 13 12 43 10 98 -2 67 -9 92 -36 147 -46 94 -143 172 -239 192 -27 6 -34 4 -49 -20z"/><path d="M8608 4502 c-31 -80 -18 -156 40 -229 45 -56 137 -112 155 -94 7 7 11 43 11 84 -1 124 -64 225 -159 254 -34 11 -37 10 -47 -15z"/><path d="M9053 4271 c-57 -21 -137 -73 -151 -98 -24 -43 73 -79 191 -71 51 4 87 13 124 31 48 25 103 80 103 105 0 5 -19 20 -43 31 -55 27 -152 28 -224 2z"/><path d="M5712 4086 c6 -69 42 -126 106 -167 57 -36 141 -62 175 -54 23 6 24 9 15 47 -27 123 -145 228 -257 228 l-43 0 4 -54z"/><path d="M10864 4126 c-9 -24 4 -48 23 -44 12 2 18 12 18 28 0 29 -32 41 -41 16z"/><path d="M6282 4084 c-63 -31 -134 -101 -161 -160 -23 -49 -25 -58 -12 -49 5 3 12 1 16 -5 10 -17 91 -11 161 12 90 29 158 91 179 161 18 62 14 67 -71 67 -45 0 -73 -7 -112 -26z"/><path d="M10912 4063 c-17 -33 10 -72 35 -51 16 13 17 40 1 56 -16 16 -26 15 -36 -5z"/><path d="M10825 4049 c-10 -30 18 -58 40 -39 22 18 15 54 -12 58 -15 2 -23 -3 -28 -19z"/><path d="M8820 2355 c-16 -19 -3 -55 20 -55 23 0 36 36 20 55 -7 8 -16 15 -20 15 -4 0 -13 -7 -20 -15z"/><path d="M8775 2279 c-8 -26 16 -54 39 -46 19 7 21 38 4 55 -18 18 -36 14 -43 -9z"/><path d="M8866 2281 c-23 -26 -14 -53 16 -49 18 2 23 10 23 32 0 36 -16 43 -39 17z"/><path d="M6758 2071 c-67 -22 -154 -75 -169 -103 -14 -25 -13 -26 52 -38 112 -22 251 13 327 84 l44 41 -38 17 c-51 23 -143 22 -216 -1z"/><path d="M6468 1873 c-92 -95 -102 -216 -24 -275 22 -16 24 -16 58 12 75 62 91 169 38 253 -16 26 -31 47 -33 47 -2 0 -19 -17 -39 -37z"/><path d="M4867 1482 c-75 -78 -76 -195 -1 -303 21 -30 23 -40 14 -66 -6 -17 -17 -75 -24 -129 -8 -55 -14 -88 -15 -74 -2 43 -57 145 -102 190 -53 52 -111 79 -178 85 l-51 4 0 -61 c0 -104 57 -185 173 -244 58 -30 134 -46 140 -30 10 26 25 -14 41 -104 10 -53 32 -133 51 -179 l33 -83 -32 34 c-51 56 -102 89 -167 109 -68 21 -107 24 -160 9 l-37 -10 9 -41 c13 -57 31 -88 76 -132 44 -45 86 -68 162 -91 63 -19 181 -22 181 -5 0 6 7 8 16 5 12 -4 15 -2 10 9 -3 8 -9 23 -13 33 -3 9 15 -11 40 -45 53 -68 144 -157 212 -203 32 -22 60 -32 104 -37 78 -8 79 5 4 47 -78 44 -173 120 -173 138 0 8 6 12 14 9 38 -15 168 130 201 223 31 88 11 195 -48 249 l-25 23 -57 -38 c-65 -42 -117 -108 -140 -173 -22 -64 -19 -169 5 -226 11 -25 15 -43 10 -40 -26 16 -115 148 -150 220 -41 86 -87 241 -75 253 4 4 10 2 12 -5 3 -7 13 -9 32 -3 177 50 291 202 254 339 -5 21 -10 22 -47 17 -76 -12 -144 -53 -190 -115 -23 -32 -48 -77 -55 -102 -23 -77 -26 -76 -29 11 -4 110 11 191 48 264 23 45 30 72 30 117 0 69 -11 101 -49 145 l-29 32 -25 -26z m433 -868 c-21 -88 -84 -260 -102 -279 -5 -5 -2 8 7 30 37 85 83 233 96 305 8 41 15 65 17 53 2 -12 -6 -61 -18 -109z"/><path d="M9884 1103 c-34 -7 -105 -73 -125 -117 -10 -23 -19 -57 -19 -77 0 -45 -38 -132 -91 -210 -22 -32 -41 -59 -43 -59 -2 0 3 21 11 48 29 95 -4 215 -75 266 l-37 27 -32 -35 c-80 -86 -63 -235 37 -332 l39 -38 -42 -38 c-67 -61 -198 -146 -277 -178 -40 -16 -75 -30 -78 -30 -3 0 12 15 34 34 22 19 55 63 74 97 45 85 47 169 6 252 l-27 56 -51 -19 c-65 -25 -101 -59 -129 -123 -18 -44 -21 -64 -17 -142 4 -57 12 -103 23 -127 10 -21 17 -40 14 -42 -9 -9 -135 -26 -196 -26 -35 0 -63 -4 -63 -8 0 -5 24 -18 53 -30 48 -20 61 -21 123 -12 82 11 162 32 233 59 38 14 49 16 40 5 -8 -10 -8 -14 0 -14 6 0 10 -5 8 -12 -1 -6 25 -25 58 -42 48 -24 76 -31 143 -34 48 -3 100 1 126 8 44 12 139 77 140 95 2 19 -95 74 -151 85 -55 12 -141 5 -198 -15 -11 -4 5 10 35 31 30 21 87 71 126 111 67 67 94 86 94 64 0 -13 82 -31 143 -31 108 0 213 55 253 133 15 28 15 28 -32 49 -95 42 -233 11 -330 -74 l-38 -33 29 49 c16 27 38 76 50 109 19 52 27 61 57 72 72 24 130 82 149 148 11 38 2 108 -14 106 -7 -1 -22 -4 -33 -6z m-713 -484 c-11 -24 -20 -41 -20 -37 -1 12 31 89 35 85 3 -2 -4 -24 -15 -48z m-31 -86 c-11 -17 -11 -17 -6 0 3 10 6 24 7 30 0 9 2 9 5 0 3 -7 0 -20 -6 -30z m-13 -55 c-3 -8 -6 -5 -6 6 -1 11 2 17 5 13 3 -3 4 -12 1 -19z m-30 -150 c-3 -7 -5 -2 -5 12 0 14 2 19 5 13 2 -7 2 -19 0 -25z"/><path d="M3426 605 c-20 -20 -4 -58 22 -53 22 4 27 41 9 57 -12 9 -18 8 -31 -4z"/><path d="M3392 538 c-17 -17 -15 -32 7 -52 24 -22 41 -13 41 19 0 29 -31 50 -48 33z"/><path d="M3470 531 c-13 -25 -3 -51 21 -51 20 0 36 40 24 59 -10 17 -33 13 -45 -8z"/></g></svg>`,
                            `</span><span id="svg_right">`,
                            `<svg height="758.000000pt" preserveAspectRatio="xMaxYMax meet" version="1.0" viewBox="0 0 1280.000000 758.000000" width="1280.000000pt" xmlns="http://www.w3.org/2000/svg"><g fill="#000000" stroke="none" transform="translate(0.000000,758.000000) scale(0.100000,-0.100000)"><path d="M5610 7574 c-14 -2 -52 -9 -85 -15 -141 -24 -304 -91 -435 -177 -246 -162 -420 -398 -509 -687 -46 -152 -56 -223 -56 -417 0 -97 -1 -176 -1 -175 -1 1 -27 50 -57 109 -208 404 -559 750 -973 959 -75 38 -104 58 -104 71 0 58 -98 168 -167 188 -21 6 -59 10 -84 8 l-46 -3 13 -46 c24 -81 107 -147 216 -170 97 -21 283 -130 458 -269 100 -79 300 -282 390 -396 173 -217 325 -509 384 -739 43 -171 85 -580 93 -920 5 -228 -7 -589 -24 -700 -6 -40 -6 -40 -20 30 -21 105 -81 308 -120 410 -214 551 -572 910 -1030 1032 -85 23 -118 26 -258 27 -176 1 -245 -11 -385 -65 -251 -96 -451 -320 -516 -574 -23 -91 -23 -256 -1 -348 63 -256 257 -456 508 -524 86 -23 252 -23 339 0 240 63 431 264 475 500 19 98 19 153 0 242 -17 81 -63 197 -75 190 -5 -3 2 -29 15 -58 36 -79 59 -207 51 -286 -17 -167 -66 -272 -180 -386 -130 -132 -264 -188 -451 -188 -182 -1 -325 60 -460 197 -86 87 -128 156 -167 271 -20 61 -23 89 -22 210 0 124 3 148 26 212 178 499 772 700 1299 438 404 -200 694 -609 839 -1185 163 -647 95 -1341 -189 -1936 -177 -370 -417 -687 -676 -893 -388 -308 -805 -713 -1110 -1077 -58 -69 -105 -129 -105 -134 0 -9 99 -90 109 -89 3 0 35 37 71 82 193 242 541 608 795 836 337 303 733 601 1096 826 127 79 154 90 310 124 253 57 393 72 654 72 221 0 352 -14 581 -62 194 -40 332 -86 491 -164 106 -52 144 -76 191 -123 68 -69 123 -88 217 -77 51 7 55 9 49 29 -21 73 -97 118 -203 117 -39 0 -76 -3 -81 -6 -6 -4 -47 17 -92 46 -217 139 -515 237 -853 280 -225 29 -636 11 -868 -37 -38 -8 -71 -14 -75 -14 -13 1 193 111 373 199 394 193 824 365 985 392 108 19 354 16 475 -6 524 -92 953 -416 1175 -888 55 -118 90 -224 122 -369 30 -139 32 -445 4 -583 -72 -357 -252 -621 -510 -746 -110 -53 -203 -72 -329 -67 -120 5 -197 29 -293 89 -80 51 -135 113 -180 204 -94 189 -58 393 95 546 228 227 599 201 715 -51 37 -80 36 -157 -4 -237 -96 -191 -346 -190 -447 1 -23 43 -23 160 1 205 13 24 14 32 4 29 -24 -8 -49 -98 -43 -161 21 -240 309 -331 474 -151 150 164 81 425 -138 527 -194 91 -449 40 -612 -123 -215 -215 -212 -549 5 -765 76 -75 150 -120 261 -156 101 -34 287 -34 395 0 349 109 592 412 677 846 23 114 25 463 4 570 -78 403 -248 707 -545 973 -228 204 -558 354 -861 392 -129 16 -158 21 -153 25 2 2 100 29 218 59 574 147 1078 219 1700 241 85 3 306 10 490 15 626 19 979 56 1294 136 93 24 119 26 331 27 221 1 234 0 330 -26 59 -16 149 -52 220 -87 298 -149 498 -398 587 -728 26 -100 36 -322 18 -441 -39 -267 -188 -526 -398 -693 -341 -271 -781 -321 -1167 -134 -133 65 -214 125 -320 238 -135 143 -228 332 -256 518 -47 321 113 643 386 778 137 68 310 82 454 37 355 -113 498 -536 274 -813 -45 -55 -33 -71 13 -17 83 98 131 253 119 380 -13 140 -64 245 -169 351 -334 334 -928 164 -1096 -314 -41 -116 -54 -204 -47 -334 7 -145 33 -244 102 -383 155 -313 454 -536 815 -606 98 -19 328 -16 428 5 242 51 432 153 603 325 457 457 467 1181 24 1660 -193 208 -487 349 -770 370 l-90 6 145 71 c242 118 395 222 559 379 240 231 401 515 467 825 25 119 25 363 0 480 -55 254 -164 459 -329 617 -213 204 -473 304 -752 290 -401 -21 -727 -278 -826 -652 -31 -121 -29 -290 6 -410 80 -271 271 -460 537 -527 117 -29 291 -23 400 16 84 29 168 73 168 86 0 5 -30 -6 -67 -25 -206 -103 -447 -102 -652 5 -180 94 -314 268 -366 475 -22 89 -23 256 -1 347 63 268 264 493 525 588 241 88 493 74 726 -39 554 -271 755 -962 458 -1571 -162 -330 -432 -592 -808 -782 -480 -243 -952 -326 -1955 -343 -381 -6 -777 -21 -902 -33 -43 -5 -78 -5 -77 -2 0 3 49 29 109 58 222 109 430 263 620 458 164 169 278 329 376 527 23 46 42 73 50 70 7 -2 30 5 53 16 92 47 151 125 151 200 0 67 -5 72 -56 56 -25 -7 -60 -25 -79 -39 -40 -31 -95 -136 -95 -181 0 -38 -65 -161 -148 -280 -209 -300 -552 -596 -892 -769 -193 -99 -324 -145 -472 -166 -692 -102 -1303 -275 -1998 -567 -8 -3 21 32 65 78 356 372 552 787 597 1263 9 94 15 126 25 126 24 0 82 73 104 130 24 63 20 115 -12 167 l-21 33 -26 -19 c-89 -63 -122 -166 -90 -273 23 -79 -37 -396 -112 -582 -48 -121 -182 -381 -247 -478 -78 -116 -205 -269 -301 -360 -146 -139 -225 -194 -415 -289 -266 -134 -509 -273 -756 -433 -56 -36 -104 -66 -107 -66 -3 0 10 21 29 48 197 271 382 707 456 1077 43 212 54 333 57 605 2 176 8 299 18 365 40 256 51 434 51 815 0 442 -9 550 -87 1100 -29 210 -32 535 -5 658 101 457 400 779 837 903 74 21 106 24 255 24 133 0 186 -4 245 -19 368 -92 642 -356 737 -712 23 -86 26 -118 26 -244 0 -123 -4 -160 -26 -243 -72 -271 -264 -505 -522 -635 -320 -160 -706 -113 -929 112 -198 201 -239 494 -98 711 186 289 610 298 740 16 32 -70 36 -176 8 -229 -9 -18 -15 -39 -13 -45 3 -7 15 11 28 38 33 72 32 171 -3 247 -50 108 -140 180 -263 213 -164 42 -329 -8 -462 -140 -120 -119 -170 -254 -160 -430 6 -109 25 -175 79 -278 43 -82 173 -212 263 -265 501 -293 1210 23 1398 623 76 244 59 531 -46 758 -142 306 -425 528 -770 603 -70 15 -306 27 -357 18z"/><path d="M3463 7528 c-24 -36 -28 -51 -28 -117 0 -60 5 -86 24 -125 24 -49 90 -126 108 -126 5 0 20 21 33 48 32 63 39 175 15 237 -15 41 -94 125 -116 125 -5 0 -21 -19 -36 -42z"/><path d="M3312 7094 c-70 -18 -119 -53 -153 -108 l-28 -45 50 -16 c67 -23 149 -16 213 15 44 23 146 120 146 140 0 11 -91 30 -138 29 -20 0 -61 -7 -90 -15z"/><path d="M7750 6299 c-6 -23 -9 -58 -5 -78 10 -60 61 -139 109 -169 48 -30 118 -128 161 -225 14 -32 25 -59 25 -62 0 -2 -24 20 -52 49 -93 92 -205 131 -308 106 -47 -11 -51 -15 -46 -36 21 -82 72 -140 158 -179 75 -34 233 -49 249 -24 14 23 25 -1 40 -86 19 -108 16 -243 -6 -340 l-19 -80 -8 55 c-24 157 -164 291 -321 307 l-53 5 -12 -39 c-17 -58 -15 -92 12 -148 41 -87 147 -169 265 -206 35 -10 66 -17 69 -15 2 3 -45 53 -104 113 -90 89 -208 233 -191 233 3 0 29 -33 60 -72 62 -82 137 -162 215 -230 l52 -46 -35 -68 c-20 -37 -53 -91 -75 -120 -21 -28 -36 -54 -33 -57 3 -4 31 7 62 23 55 27 59 32 105 124 26 53 58 138 71 188 13 51 24 80 24 65 1 -18 5 -26 12 -21 6 3 14 2 18 -4 10 -16 113 29 168 74 99 81 141 192 113 296 -10 35 -13 37 -43 31 -121 -22 -211 -107 -253 -238 l-13 -40 0 50 c-1 72 -18 165 -45 251 -13 40 -20 72 -16 69 4 -2 32 12 61 33 96 67 162 197 144 288 -7 39 -41 114 -51 114 -20 0 -108 -58 -129 -85 -53 -71 -74 -183 -53 -285 7 -32 6 -31 -21 16 -33 61 -66 110 -95 142 -18 20 -21 37 -21 111 0 73 -4 94 -26 136 -25 49 -79 96 -126 110 -19 5 -23 1 -33 -36z m630 -789 c-6 -11 -13 -20 -16 -20 -2 0 0 9 6 20 6 11 13 20 16 20 2 0 0 -9 -6 -20z m-140 -184 c0 -2 -8 -10 -17 -17 -16 -13 -17 -12 -4 4 13 16 21 21 21 13z"/><path d="M12203 6278 c-39 -75 -14 -183 64 -269 44 -49 87 -138 119 -248 26 -90 32 -140 9 -78 -52 141 -211 248 -341 230 l-41 -5 9 -52 c17 -92 74 -157 183 -207 68 -31 185 -50 185 -29 0 9 4 9 16 -1 15 -12 16 -32 11 -154 -16 -383 -177 -646 -523 -851 -33 -20 -9 -25 61 -13 49 8 79 20 113 46 155 116 290 297 352 470 13 35 29 68 37 74 11 10 12 8 7 -6 -7 -16 -3 -17 37 -11 69 11 164 60 217 113 55 55 82 119 82 195 l0 48 -55 0 c-94 0 -184 -50 -242 -135 l-35 -50 5 45 c6 44 -5 194 -19 258 -5 24 -3 32 7 32 30 0 116 49 157 89 80 78 109 177 80 272 -12 43 -22 46 -79 25 -101 -36 -168 -138 -178 -270 l-6 -81 -13 45 c-8 25 -32 81 -54 126 l-40 81 16 47 c37 109 1 228 -86 280 -35 21 -35 21 -55 -16z m507 -861 c0 -1 -24 -25 -52 -52 l-53 -50 50 53 c46 48 55 57 55 49z m-110 -110 c0 -2 -10 -12 -22 -23 l-23 -19 19 23 c18 21 26 27 26 19z m-80 -71 c0 -2 -8 -10 -17 -17 -16 -13 -17 -12 -4 4 13 16 21 21 21 13z"/><path d="M11984 5514 c-30 -44 -31 -143 -3 -201 30 -63 129 -160 206 -200 95 -51 95 -47 0 79 -59 79 -157 243 -157 264 0 5 26 -36 58 -91 65 -112 87 -146 152 -228 41 -52 46 -56 58 -40 9 13 12 43 10 98 -2 67 -9 92 -36 147 -46 94 -143 172 -239 192 -27 6 -34 4 -49 -20z"/><path d="M8608 4502 c-31 -80 -18 -156 40 -229 45 -56 137 -112 155 -94 7 7 11 43 11 84 -1 124 -64 225 -159 254 -34 11 -37 10 -47 -15z"/><path d="M9053 4271 c-57 -21 -137 -73 -151 -98 -24 -43 73 -79 191 -71 51 4 87 13 124 31 48 25 103 80 103 105 0 5 -19 20 -43 31 -55 27 -152 28 -224 2z"/><path d="M5712 4086 c6 -69 42 -126 106 -167 57 -36 141 -62 175 -54 23 6 24 9 15 47 -27 123 -145 228 -257 228 l-43 0 4 -54z"/><path d="M10864 4126 c-9 -24 4 -48 23 -44 12 2 18 12 18 28 0 29 -32 41 -41 16z"/><path d="M6282 4084 c-63 -31 -134 -101 -161 -160 -23 -49 -25 -58 -12 -49 5 3 12 1 16 -5 10 -17 91 -11 161 12 90 29 158 91 179 161 18 62 14 67 -71 67 -45 0 -73 -7 -112 -26z"/><path d="M10912 4063 c-17 -33 10 -72 35 -51 16 13 17 40 1 56 -16 16 -26 15 -36 -5z"/><path d="M10825 4049 c-10 -30 18 -58 40 -39 22 18 15 54 -12 58 -15 2 -23 -3 -28 -19z"/><path d="M8820 2355 c-16 -19 -3 -55 20 -55 23 0 36 36 20 55 -7 8 -16 15 -20 15 -4 0 -13 -7 -20 -15z"/><path d="M8775 2279 c-8 -26 16 -54 39 -46 19 7 21 38 4 55 -18 18 -36 14 -43 -9z"/><path d="M8866 2281 c-23 -26 -14 -53 16 -49 18 2 23 10 23 32 0 36 -16 43 -39 17z"/><path d="M6758 2071 c-67 -22 -154 -75 -169 -103 -14 -25 -13 -26 52 -38 112 -22 251 13 327 84 l44 41 -38 17 c-51 23 -143 22 -216 -1z"/><path d="M6468 1873 c-92 -95 -102 -216 -24 -275 22 -16 24 -16 58 12 75 62 91 169 38 253 -16 26 -31 47 -33 47 -2 0 -19 -17 -39 -37z"/><path d="M4867 1482 c-75 -78 -76 -195 -1 -303 21 -30 23 -40 14 -66 -6 -17 -17 -75 -24 -129 -8 -55 -14 -88 -15 -74 -2 43 -57 145 -102 190 -53 52 -111 79 -178 85 l-51 4 0 -61 c0 -104 57 -185 173 -244 58 -30 134 -46 140 -30 10 26 25 -14 41 -104 10 -53 32 -133 51 -179 l33 -83 -32 34 c-51 56 -102 89 -167 109 -68 21 -107 24 -160 9 l-37 -10 9 -41 c13 -57 31 -88 76 -132 44 -45 86 -68 162 -91 63 -19 181 -22 181 -5 0 6 7 8 16 5 12 -4 15 -2 10 9 -3 8 -9 23 -13 33 -3 9 15 -11 40 -45 53 -68 144 -157 212 -203 32 -22 60 -32 104 -37 78 -8 79 5 4 47 -78 44 -173 120 -173 138 0 8 6 12 14 9 38 -15 168 130 201 223 31 88 11 195 -48 249 l-25 23 -57 -38 c-65 -42 -117 -108 -140 -173 -22 -64 -19 -169 5 -226 11 -25 15 -43 10 -40 -26 16 -115 148 -150 220 -41 86 -87 241 -75 253 4 4 10 2 12 -5 3 -7 13 -9 32 -3 177 50 291 202 254 339 -5 21 -10 22 -47 17 -76 -12 -144 -53 -190 -115 -23 -32 -48 -77 -55 -102 -23 -77 -26 -76 -29 11 -4 110 11 191 48 264 23 45 30 72 30 117 0 69 -11 101 -49 145 l-29 32 -25 -26z m433 -868 c-21 -88 -84 -260 -102 -279 -5 -5 -2 8 7 30 37 85 83 233 96 305 8 41 15 65 17 53 2 -12 -6 -61 -18 -109z"/><path d="M9884 1103 c-34 -7 -105 -73 -125 -117 -10 -23 -19 -57 -19 -77 0 -45 -38 -132 -91 -210 -22 -32 -41 -59 -43 -59 -2 0 3 21 11 48 29 95 -4 215 -75 266 l-37 27 -32 -35 c-80 -86 -63 -235 37 -332 l39 -38 -42 -38 c-67 -61 -198 -146 -277 -178 -40 -16 -75 -30 -78 -30 -3 0 12 15 34 34 22 19 55 63 74 97 45 85 47 169 6 252 l-27 56 -51 -19 c-65 -25 -101 -59 -129 -123 -18 -44 -21 -64 -17 -142 4 -57 12 -103 23 -127 10 -21 17 -40 14 -42 -9 -9 -135 -26 -196 -26 -35 0 -63 -4 -63 -8 0 -5 24 -18 53 -30 48 -20 61 -21 123 -12 82 11 162 32 233 59 38 14 49 16 40 5 -8 -10 -8 -14 0 -14 6 0 10 -5 8 -12 -1 -6 25 -25 58 -42 48 -24 76 -31 143 -34 48 -3 100 1 126 8 44 12 139 77 140 95 2 19 -95 74 -151 85 -55 12 -141 5 -198 -15 -11 -4 5 10 35 31 30 21 87 71 126 111 67 67 94 86 94 64 0 -13 82 -31 143 -31 108 0 213 55 253 133 15 28 15 28 -32 49 -95 42 -233 11 -330 -74 l-38 -33 29 49 c16 27 38 76 50 109 19 52 27 61 57 72 72 24 130 82 149 148 11 38 2 108 -14 106 -7 -1 -22 -4 -33 -6z m-713 -484 c-11 -24 -20 -41 -20 -37 -1 12 31 89 35 85 3 -2 -4 -24 -15 -48z m-31 -86 c-11 -17 -11 -17 -6 0 3 10 6 24 7 30 0 9 2 9 5 0 3 -7 0 -20 -6 -30z m-13 -55 c-3 -8 -6 -5 -6 6 -1 11 2 17 5 13 3 -3 4 -12 1 -19z m-30 -150 c-3 -7 -5 -2 -5 12 0 14 2 19 5 13 2 -7 2 -19 0 -25z"/><path d="M3426 605 c-20 -20 -4 -58 22 -53 22 4 27 41 9 57 -12 9 -18 8 -31 -4z"/><path d="M3392 538 c-17 -17 -15 -32 7 -52 24 -22 41 -13 41 19 0 29 -31 50 -48 33z"/><path d="M3470 531 c-13 -25 -3 -51 21 -51 20 0 36 40 24 59 -10 17 -33 13 -45 -8z"/></g></svg>`,
                            `</span><div></div></div><script src="/js/website.js?${random}" type="application/javascript"></script></body></html>`
                        ].join("");
                    if (request.url.indexOf("favicon.ico") < 0 && request.url.indexOf("images/apple") < 0) {
                        if (ers !== null) {
                            if (ers.code === "ENOENT") {
                                console.log(`${text.angry}404${text.none} for ${uri}`);
                                response.writeHead(200, {"Content-Type": "text/html"});
                                if (request.headers.referer.indexOf("http") === 0 && request.headers.referer.indexOf("/demo") > 0) {
                                    response.write("");
                                } else {
                                    response.write(page.replace("insertme", `<p>HTTP 404: ${uri}</p>`));
                                }
                                response.end();
                            } else {
                                apps.errout([ers.toString()]);
                            }
                            return;
                        }
                        if (stat.isDirectory() === true) {
                            node.fs.readdir(localpath, function node_apps_server_create_stat_dir(erd:Error, list:string[]) {
                                const dirlist:string[] = [`<p>directory of ${localpath}</p> <ul>`];
                                if (erd !== null) {
                                    apps.errout([erd.toString()]);
                                    return;
                                }
                                list.forEach(function node_apps_server_create_stat_dir_list(value:string) {
                                    if ((/\.x?html?$/).test(value.toLowerCase()) === true) {
                                        dirlist.push(`<li><a href="${uri.replace(/\/$/, "")}/${value}">${value}</a></li>`);
                                    } else {
                                        dirlist.push(`<li><a href="${uri.replace(/\/$/, "")}/${value}?${random}">${value}</a></li>`);
                                    }
                                });
                                dirlist.push("</ul>");
                                response.writeHead(200, {"Content-Type": "text/html"});
                                response.write(page.replace("insertme", dirlist.join("")));
                                response.end();
                            });
                            return;
                        }
                        if (stat.isFile() === true) {
                            node.fs.readFile(localpath, "utf8", function node_apps_server_create_readFile(err:Error, data:string):void {
                                if (err !== undefined && err !== null) {
                                    if (err.toString().indexOf("no such file or directory") > 0) {
                                        response.writeHead(404, {"Content-Type": "text/plain"});
                                        if (localpath.indexOf("apple-touch") < 0 && localpath.indexOf("favicon") < 0) {
                                            console.log(`${text.angry}404${text.none} for ${localpath}`);
                                        }
                                        return;
                                    }
                                    response.write(JSON.stringify(err));
                                    console.log(err);
                                    return;
                                }
                                if (localpath.indexOf(".js") === localpath.length - 3) {
                                    response.writeHead(200, {"Content-Type": "application/javascript"});
                                } else if (localpath.indexOf(".css") === localpath.length - 4) {
                                    response.writeHead(200, {"Content-Type": "text/css"});
                                } else if (localpath.indexOf(".xhtml") === localpath.length - 6) {
                                    response.writeHead(200, {"Content-Type": "application/xhtml+xml"});
                                } else if (localpath.indexOf(".html") === localpath.length - 5 || localpath.indexOf(".htm") === localpath.length - 4) {
                                    response.writeHead(200, {"Content-Type": "text/html"});
                                } else {
                                    response.writeHead(200, {"Content-Type": "text/plain"});
                                }
                                response.write(data);
                                response.end();
                            });
                        } else {
                            response.end();
                        }
                        return;
                    }
                });
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
                node.child("node js/services build incremental", {
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
    // simulates running the various commands of this services.ts file
    apps.simulation = function node_apps_simulation(callback:Function):void {
        const tests:simulationItem[] = require(`${js}test${sep}simulations.js`),
            len:number = tests.length,
            cwd:string = __dirname.replace(/(\/|\\)js$/, ""),
            increment = function node_apps_simulation_increment(irr:string):void {
                const interval = function node_apps_simulation_increment_interval():void {
                    a = a + 1;
                    if (a < len) {
                        wrapper();
                    } else {
                        console.log("");
                        if (callback === undefined) {
                            console.log(`${text.green}Successfully completed all ${text.cyan + text.bold + len + text.none + text.green} simulation tests.${text.none}`);
                        } else {
                            callback(`${text.green}Successfully completed all ${text.cyan + text.bold + len + text.none + text.green} simulation tests.${text.none}`);
                        }
                    }
                };
                if (irr !== "") {
                    console.log(`${apps.humantime(false) + text.underline}Test ${a + 1} ignored (${text.angry + irr + text.none + text.underline}):${text.none} ${tests[a].command}`);
                } else {
                    console.log(`${apps.humantime(false) + text.green}Passed simulation ${a + 1}: ${text.none + tests[a].command}`);
                }
                if (tests[a].artifact === "" || tests[a].artifact === undefined) {
                    interval();
                } else {
                    apps.remove(tests[a].artifact, function node_apps_simulation_wrapper_remove():void {
                        interval();
                    });
                }
            },
            errout = function node_apps_simulation_errout(message:string, stdout:string) {
                apps.errout([
                    `Simulation test string ${text.angry + tests[a].command + text.none} ${message}:`,
                    tests[a].test,
                    "",
                    "",
                    `${text.green}Actual output:${text.none}`,
                    stdout
                ]);
            },
            wrapper = function node_apps_simulation_wrapper():void {
                node.child(`node js/services ${tests[a].command}`, {cwd: cwd, maxBuffer: 2048 * 500}, function node_apps_simulation_wrapper_child(errs:nodeError, stdout:string, stderror:string|Buffer) {
                    if (tests[a].artifact === "" || tests[a].artifact === undefined) {
                        writeflag = "";
                    } else {
                        tests[a].artifact = node.path.resolve(tests[a].artifact);
                        writeflag = tests[a].artifact;
                    }
                    if (errs !== null) {
                        if (errs.toString().indexOf("getaddrinfo ENOTFOUND") > -1) {
                            increment("no internet connection");
                            return;
                        }
                        if (errs.toString().indexOf("certificate has expired") > -1) {
                            increment("TLS certificate expired on HTTPS request");
                            return;
                        }
                        if (stdout === "") {
                            apps.errout([errs.toString()]);
                            return;
                        }
                    }
                    if (stderror !== "") {
                        apps.errout([stderror]);
                        return;
                    }
                    if (typeof stdout === "string") {
                        stdout = stdout.replace(/\s+$/, "").replace(/^\s+/, "").replace(/\u0020-?\d+(\.\d+)*\s/g, " XXXX ").replace(/\\n-?\d+(\.\d+)*\s/g, "\\nXXXX ");
                    }
                    if (tests[a].qualifier.indexOf("file") === 0) {
                        if (tests[a].artifact === "" || tests[a].artifact === undefined) {
                            apps.errout([`Tests ${text.cyan + tests[a].command + text.none} uses ${text.angry + tests[a].qualifier + text.none} as a qualifier but does not mention an artifact to remove.`]);
                            return;
                        }
                        if (tests[a].qualifier.indexOf("file ") === 0) {
                            tests[a].file = node.path.resolve(tests[a].file);
                            node.fs.readFile(tests[a].file, "utf8", function node_apps_simulation_wrapper_file(err:Error, dump:string) {
                                if (err !== null) {
                                    apps.errout([err.toString()]);
                                    return;
                                }
                                if (tests[a].qualifier === "file begins" && dump.indexOf(tests[a].test) !== 0) {
                                    errout(`is not starting in file: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                if (tests[a].qualifier === "file contains" && dump.indexOf(tests[a].test) < 0) {
                                    errout(`is not anywhere in file: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                if (tests[a].qualifier === "file ends" && dump.indexOf(tests[a].test) === dump.length - tests[a].test.length) {
                                    errout(`is not at end of file: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                if (tests[a].qualifier === "file is" && dump !== tests[a].test) {
                                    errout(`does not match the file: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                if (tests[a].qualifier === "file not" && dump === tests[a].test) {
                                    errout(`matches this file, but shouldn't: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                if (tests[a].qualifier === "file not contains" && dump.indexOf(tests[a].test) > -1) {
                                    errout(`is contained in this file, but shouldn't be: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                increment("");
                            });
                        } else if (tests[a].qualifier.indexOf("filesystem ") === 0) {
                            tests[a].test = node.path.resolve(tests[a].test);
                            node.fs.stat(tests[a].test, function node_apps_simulation_wrapper_filesystem(ers:Error) {
                                if (ers !== null) {
                                    if (tests[a].qualifier === "filesystem contains" && ers.toString().indexOf("ENOENT") > -1) {
                                        apps.errout([
                                            `Simulation test string ${text.angry + tests[a].command + text.none} does not see this address in the local file system:`,
                                            text.cyan + tests[a].test + text.none
                                        ]);
                                        return;
                                    }
                                    apps.errout([ers.toString()]);
                                    return;
                                }
                                if (tests[a].qualifier === "filesystem not contains") {
                                    apps.errout([
                                        `Simulation test string ${text.angry + tests[a].command + text.none} sees the following address in the local file system, but shouldn't:`,
                                        text.cyan + tests[a].test + text.none
                                    ]);
                                    return;
                                }
                                increment("");
                            });
                        }
                    } else {
                        if (tests[a].qualifier === "begins" && (typeof stdout !== "string" || stdout.indexOf(tests[a].test) !== 0)) {
                            errout("does not begin with the expected output", stdout);
                            return;
                        }
                        if (tests[a].qualifier === "contains" && (typeof stdout !== "string" || stdout.indexOf(tests[a].test) < 0)) {
                            errout("does not contain the expected output", stdout);
                            return;
                        }
                        if (tests[a].qualifier === "ends" && (typeof stdout !== "string" || stdout.indexOf(tests[a].test) !== stdout.length - tests[a].test.length)) {
                            errout("does not end with the expected output", stdout);
                            return;
                        }
                        if (tests[a].qualifier === "is" && stdout !== tests[a].test) {
                            errout("does not match the expected output", stdout);
                            return;
                        }
                        if (tests[a].qualifier === "not" && stdout === tests[a].test) {
                            errout("must not be this output", stdout);
                            return;
                        }
                        if (tests[a].qualifier === "not contains" && (typeof stdout !== "string" || stdout.indexOf(tests[a].test) > -1)) {
                            errout("must not contain this output", stdout)
                            return;
                        }
                        increment("");
                    }
                });
            };

        let a:number = 0;
        if (command === "simulation") {
            callback = function node_apps_lint_callback(message:string):void {
                apps.log([message, "\u0007"]); // bell sound
            };
            verbose = true;
            console.log("");
            console.log(`${text.underline + text.bold}Pretty Diff - services.ts simulation tests${text.none}`);
            console.log("");
        }
        wrapper();
    };
    // for testing the debug report generation
    // * the debug report is a markdown report for posting online
    // to aid with troubleshooting a defect
    apps.sparser_debug = function node_apps_debug():void {
        process.argv.push("sparser_debug");
        apps.errout(["Debug Command"]);
    };
    // run the test suite using the build application
    apps.test = function node_apps_test():void {
        apps.build(true);
    };
    // runs the parser and outputs results beautified for a text comparison to the stored code unit
    apps.testprep = function node_apps_testprep():void {
        if (process.argv.length < 1) {
            apps.errout(["No file path provided."]);
            return;
        }
        verbose = true;
        apps.fileNameOptions(process.argv[0]);
        node.fs.readFile(node.path.resolve(process.argv[0]), {
            encoding: "utf8"
        }, function node_apps_testprep_read(er:Error, filedata:string):void {
            if (er !== null) {
                apps.errout([er.toString()]);
                return;
            }
            const auto:[string, string, string] = sparser.libs.language.auto(filedata, "javascript");
            let output:string = "";
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
            output = String(sparser.parser());
            if (options.lexer === "style" && (/"types":"item"\},?\r?\n/).test(output) === true) {
                console.log(`Style file ${process.argv[0]} returns a types value of ${text.angry}"item"${text.none}.`);
            } else if (output === sparser.parseerror) {
                console.log(text.angry + output + text.none);
            } else {
                console.log(output);
            }
            apps.log([`${text.green}Test case generated!${text.none}`]);
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
                    empty:[number, number] = [0, 0],
                    missing:[number, number] = [0, 0];
                const lexer     = function node_apps_validation_compare_lexer():void {
                        const lex:string = files.code[a][0].slice(0, files.code[a][0].indexOf(sep));
                        console.log("");
                        console.log(`Tests for lexer - ${text.cyan + lex + text.none}`);
                        currentlex = lex;
                    },
                    completeText = function node_apps_validation_compare_completeText():void {
                        console.log("");
                        if (missing[0] < 1 && missing[1] < 1 && empty[0] < 1 && empty[1] < 1) {
                            console.log(`${text.green}Test units evaluated without failure!${text.none}`);
                        } else {
                            let pe:string = "",
                                pa:string = "";
                            if (missing[0] > 0) {
                                pe = (missing[0] > 1)
                                    ? "s"
                                    : "";
                                console.log(`${text.green}Test units passed, but missing ${text.angry + missing[0]} code file${pe}.${text.none}`);
                            }
                            if (missing[1] > 0) {
                                pe = (missing[1] > 1)
                                    ? "s"
                                    : "";
                                console.log(`${text.green}Test units passed, but missing ${text.angry + missing[1]} parse file${pe}.${text.none}`);
                            }
                            if (empty[0] > 0) {
                                pe = (empty[0] > 1)
                                    ? "s"
                                    : "";
                                pa = (empty[0] > 1)
                                    ? "are"
                                    : "is";
                                console.log(`${text.green}Test units passed, but ${text.angry + empty[0]} code file${pe} ${pa} empty.${text.none}`);
                            }
                            if (empty[1] > 0) {
                                pe = (empty[1] > 1)
                                    ? "s"
                                    : "";
                                pa = (empty[1] > 1)
                                    ? "are"
                                    : "is";
                                console.log(`${text.green}Test units passed, but ${text.angry + empty[1]} parse file${pe} ${pa} empty.${text.none}`);
                            }
                        }
                        if (callback === undefined) {
                            console.log(`${text.green}Validation complete for ${text.cyan + text.bold + filecount + text.none + text.green} files!${text.none}`);
                        } else {
                            callback(`${text.green}Validation complete for ${text.cyan + text.bold + filecount + text.none + text.green} files!${text.none}`);
                        }
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
                        total           = report[1];
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
                            empty[1] = empty[1] + 1;
                            console.log(`${text.angry}Parsed file is empty:${text.none} ${files.parsed[a][0]}`);
                        } else if (files.code[a][1].replace(/^\s+$/, "") === "") {
                            empty[0] = empty[0] + 1;
                            console.log(`${text.angry}Code file is empty:${text.none} ${files.code[a][0]}`);
                        } else {
                            options.source = files.code[a][1];
                            apps.fileNameOptions(files.code[a][0]);
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
                                    if (currentlex === "style" && (/"types":"item"\},?\r?\n/).test(output) === true) {
                                        apps.errout([`Style file ${files.parsed[a][0]} returns a types value of ${text.angry}"item"${text.none}.`])
                                        return;
                                    }
                                    if (files.parsed[a][1].charAt(0) !== "[") {
                                        apps.errout([`Stored parsed code unit ${text.angry + files.parsed[a][0] + text.none} is incorrect format and will throw a JSON error.`]);
                                        return;
                                    }
                                    if (diffFiles(output, JSON.parse(files.parsed[a][1])) === true) {
                                        return;
                                    }
                                }
                            }
                        }
                    } else {
                        if (files.code[a][0] < files.parsed[a][0]) {
                            missing[1] = missing[1] + 1;
                            console.log(`${text.yellow}Parsed samples directory is missing file:${text.none} ${files.code[a][0]}`);
                            files.code.splice(a, 1);
                        } else {
                            missing[0] = missing[0] + 1;
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
                apps.log([""]);
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
        apps.log([""]);
    };
    // performs word wrap when printing text to the shell
    apps.wrapit = function node_apps_wrapit(outputArray:string[], string:string):void {
        const wrap:number = 100;
        if (string.length > wrap) {
            const indent:string = (function node_apps_wrapit_indent():string {
                    const len:number = string.length;
                    let inc:number = 0,
                        num:number = 2,
                        str:string = "";
                    if ((/^(\s*((\u002a|-)\s*)?\w+\s*:)/).test(string.replace(/\u001b\[\d+m/g, "")) === false) {
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
                formLine = function node_apps_wrapit_formLine():void {
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
                    inc = wrapper;
                    if (string.charAt(wrapper) !== " " && string.length > wrapper) {
                        do {
                            wrapper = wrapper - 1;
                        } while (wrapper > 0 && string.charAt(wrapper) !== " ");
                        if (wrapper === 0 || wrapper === indent.length - 1) {
                            wrapper = inc;
                            do {
                                wrapper = wrapper + 1;
                            } while (wrapper < string.length && string.charAt(wrapper) !== " ");
                        }
                    }
                    outputArray.push(string.slice(0, wrapper).replace(/\s+$/, ""));
                    string = string.slice(wrapper + 1).replace(/^\s+/, "");
                    if (string.length + indent.length > wrap) {
                        string = indent + string;
                        node_apps_wrapit_formLine();
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
