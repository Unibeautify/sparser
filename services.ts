/*jslint node:true */
/*eslint-env node*/
/*eslint no-console: 0*/

/* This file exists to consolidate the various Node service offerings in
   this application. */

const services = function services_() {
    "use strict";
    let version:string = "",
        command:string = "";
    const args:string[] = process.argv.slice(2),
        node = {
            child: require("child_process").exec,
            fs: require("fs"),
            path: require("path")
        },
        project:string = (function services_project() {
            const dirs:string[] = __dirname.split(node.path.sep);
            return dirs.slice(0, dirs.length - 1).join(node.path.sep) + node.path.sep;
        }()),
        js = `${project}js${node.path.sep}`,
        commandList = {
            "build"       : {
                brief: "Run the project's TypeScript build.",
                detail: "Run the project's TypeScript build and produces a single large file for use in the browser.  This command accepts no options.",
                example: "build"
            },
            "commands"    : {
                brief: "Displays a brief list of supported commands or details of a given command.",
                detail: "When no arguments are supplied the command list is printed to console.  Supply a command name as an additional argument to see details and support for additional arguments.",
                example: "commands inventory"
            },
            "help"        : {
                brief: "Displays general information about this application.",
                detail: "Displays general information about this application.  This command accepts no options.",
                example: "help"
            },
            "inventory"   : {
                brief: "List the currently supplied lexers and their language's in language specific logic.",
                detail: "The generated list is computed by scraping the code for the 'options.lang' data property.  This means the specified supported languages are languages that demand unique instructions.  Other languages that aren't in this list may also be supported.  This command accepts no options.",
                example: "inventory"
            },
            "parse-array" : {
                brief: "Prints to standard output the parsed data as an object of parallel arrays.",
                detail: "Prints to standard output the parsed data as an object of parallel arrays.  Requires either a code sample or a relative path from the current working directory to a file.",
                example: `parse-array js${node.path.sep}example${node.path.sep}file.js`
            },
            "parse-object": {
                brief: "Prints to standard output the parsed data as an array of objects.",
                detail: "Prints to standard output the parsed data as an array of objects.  Requires either a code sample or a relative path from the current working directory to a file.",
                example: `parse-object js${node.path.sep}example${node.path.sep}file.js`
            },
            "parse-table" : {
                brief: "Prints to standard output the parsed data formatted into a grid with ANSI colors.",
                detail: "Prints to standard output the parsed data formatted into a grid with ANSI colors.  Requires either a code sample or a relative path from the current working directory to a file.",
                example: `parse-table js${node.path.sep}example${node.path.sep}file.js`
            },
            "performance" : {
                brief: "Test a parse operation with nanosecond precision.",
                detail: "Prints to screen a time duration in nanoseconds for a parse operation.  The raw data is acquired by running an initial operation that is discard and then averaging from 10 additional operations.  The time duration is only a measure of the actual parse operation and the timer code.  All other operations, including those related to Node.js aren't included in the timer.  A relative address to a file is required.",
                example: `performance js${node.path.sep}example${node.path.sep}file.js`
            },
            "server"      : {
                brief: "Starts a web server and opens a web socket channel.",
                detail: "Starts a web server so that TypeScript builds will execute on file updates and the browser tool will automatically refresh upon build completion.  Two consecutive ports are required for this service to work.  The first port is for the webserver and the second port is for a web sockets channel.  A port may be specified as an additional argument.",
                example: "server 3000"
            },
            "validation"  : {
                brief: "Runs the validation build.",
                detail: "Runs the validation build that checks for TypeScript build defects, framework schema violations, ESLint rule violations, and finally tests the lexer files against supplied test units.  This command accepts no options.",
                example: "validation"
            },
            "version"     : {
                brief: "Prints a version number to screen.",
                detail: "Prints a version number to screen.  This command accepts no options.",
                example: "version"
            }
        },
        wrap = function services_wrap(input:string, commandlist:number):string {
            if (commandlist + input.length > 80) {
                const chars:string[] = input.split("");
                let len:number = chars.length + commandlist,
                    index:number = 77 - commandlist,
                    lindex:number = 0,
                    length:number = 0;
                
                if (commandlist < 1) {
                    chars.splice(0, 0, " ");
                    chars.splice(0, 0, " ");
                    chars.splice(0, 0, " ");
                    chars.splice(0, 0, " ");
                }

                // outer loop iterates over line segments
                do {
                    // inner loop finds the last space on a line
                    do {
                        if (chars[index] === " ") {
                            chars[index] = "\n   ";
                            if (chars[index + 1] === " ") {
                                chars.splice(index + 1, 1);
                                len = len - 1;
                            }
                            length = commandlist;
                            // applies left padding
                            do {
                                chars[index] = `${chars[index]} `;
                                length = length - 1;
                            } while (length > 0);
                            break;
                        }
                        index = index - 1;
                    } while (index > lindex);
                    index = index + (77 - commandlist);
                    lindex = index - 80;
                } while (index < len);
                return chars.join("");
            }
            return input;
        },
        time = function services_time(message:string):number {
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
            console.log(`[\u001b[36m${datearr.join(":")}\u001b[39m] ${message}`);
            return date.valueOf();
        },
        duration = function services_duration(length:number, message:string):void {
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
            console.log(`[\u001b[36m${list.join(":")}\u001b[39m] ${message}`);
        },
        errout = function services_errout(message:string):void {
            let stack = new Error().stack;
            console.log("");
            console.log("\u001b[31mScript error\u001b[39m");
            console.log("------------");
            if (message === "") {
                console.log("\u001b[33mNo error message supplied\u001b[39m");
            } else {
                console.log(message);
            }
            console.log("");
            if (process.platform.toLowerCase() === "win32") {
                stack = stack.replace("Error", "\u001b[36mStack trace\u001b[39m\r\n-----------");
            } else {
                stack = stack.replace("Error", "\u001b[36mStack trace\u001b[39m\n-----------");
            }
            console.log(stack);
            process.exit(1);
        },
        alias = function services_alias(comms:string):string {
            if (commandList[comms] !== undefined) {
                return comms;
            }
            if (comms.charAt(0) === "b") {
                return "build";
            }
            if (comms.indexOf("c") === 0) {
                return "commands";
            }
            if (comms.charAt(0) === "i") {
                return "inventory";
            }
            if (comms.indexOf("p") === 0) {
                if (comms.indexOf("pe") === 0) {
                    return "performance";
                }
                if (comms.indexOf("parse-a") === 0) {
                    return "parse-array";
                }
                if (comms.indexOf("parse-o") === 0) {
                    return "parse-object";
                }
                return "parse-table";
            }
            if (comms.indexOf("s") > -1 || comms === "http") {
                return "server";
            }
            if (comms.charAt(0) === "v") {
                if (comms.charAt(1) === "" || comms.charAt(1) === "e") {
                    return "version";
                }
                return "validation";
            }
            return "help";
        },
        action = {
            build: function services_action_build():void {
                console.log("");
                const start = time("Running TypeScript build");
                node.child("tsc --pretty", {
                    cwd: project.slice(0, project.length - 1)
                }, function services_action_build_callback(err, stdout, stderr):void {
                    if (err !== null) {
                        return errout(err);
                    }
                    if (stderr !== null && stderr !== "") {
                        return errout(stderr);
                    }
                    let output:string = "window.parseFramework={language:function framework_language(){\"use strict\";return;},lexer:{},parse:{},parseerror:\"\",parser:function framework_parser(){\"use strict\";return;}};",
                        outputa:string = "";
                    node.fs.readFile(`${js}parse.js`, {
                        encoding: "utf8"
                    }, function services_action_build_callback_parse(errp, datap) {
                        if (errp !== null) {
                            return errout(errp);
                        }
                        datap = datap.replace(/global\.parseFramework/g, "window.parseFramework");
                        datap = `${datap.slice(0, datap.indexOf("global.") - 4)}}());`;
                        output = output + datap;
                        outputa = output;
                        node.fs.readdir(`${js}lexers`, function services_action_build_callback_parse_lexers(errf, files) {
                            if (errf !== null) {
                                return errout(errf);
                            }
                            files.splice(files.indexOf("all.js"), 1);
                            files.forEach(function services_action_build_callback_parse_lexers_each(value, index, array) {
                                array[index] = `${js}lexers${node.path.sep + value}`;
                            });
                            files.push(`${js}language.js`);
                            let a = files.length,
                                b = 0,
                                c = a;
                            do {
                                node.fs.readFile(files[b], {
                                    encoding: "utf8"
                                }, function services_action_build_callback_parse_lexers_each_files(errx, filex) {
                                    if (errx !== null) {
                                        return errout(errx);
                                    }
                                    output = output + filex.replace(/global\.parseFramework/g, "window.parseFramework");
                                    outputa = outputa + filex.replace(/global\.parseFramework/g, "window.parseFramework");
                                    c = c - 1;
                                    if (c < 1) {
                                        node.fs.writeFile(`${js}browser.js`, outputa, function services_action_build_callback_parse_lexers_each_files_write(errb) {
                                            if (errb !== null) {
                                                return errout(errb);
                                            }
                                        });
                                        node.fs.readFile(`${js}runtimes${node.path.sep}browsertest.js`, {
                                            encoding: "utf8"
                                        }, function services_action_build_callback_parse_lexers_each_files_web(errw, filew) {
                                            if (errw !== null) {
                                                return errout(errw);
                                            }
                                            output = output + filew.replace(/global\.parseFramework/g, "window.parseFramework");
                                            node.fs.writeFile(`${js}browsertest.js`, output, function services_action_build_callback_parse_lexers_each_files_web_write(erro) {
                                                if (erro !== null) {
                                                    return errout(erro);
                                                }
                                                duration(time("Build complete") - start, "Total compile time");
                                                console.log("");
                                            });
                                        });
                                    }
                                });
                                if (files[b].indexOf("lexers") > 0) {
                                    outputa = `${outputa}window.parseFramework.parse.options.lexerOptions.${files[b].replace(`${js}lexers${node.path.sep}`, "").replace(".js", "")}={};`
                                }
                                b = b + 1;
                            } while (b < a);
                        });
                    });
                });
            },
            commands: function services_action_commands():void {
                let longest:number = 0;
                
                console.log("");
                if (commandList[args[1]] === undefined) {
                    keys.forEach(function services_action_commands_longest(value):void {
                        if (value.length > longest) {
                            longest = value.length;
                        }
                    });
                    keys.forEach(function services_action_commands_output(value):void {
                        const output:string[] = ["\u001b[31m*\u001b[39m \u001b[32m"];
                        let length:number = value.length;
                        output.push(value);
                        output.push("\u001b[39m");
                        if (length < longest) {
                            do {
                                output.push(" ");
                                length = length + 1;
                            } while (length < longest);
                        } else {
                            length = longest;
                        }
                        output.push(" ");
                        output.push(wrap(commandList[value].brief, longest));
                        console.log(output.join(""));
                    });
                    console.log("");
                    console.log("Examples:");
                    console.log(`\u001b[36mnode js${node.path.sep}services commands server\u001b[39m`);
                    console.log(`\u001b[36mnode js${node.path.sep}services version\u001b[39m`);
                    console.log(`\u001b[36mnode js${node.path.sep}services parse-table js/parse.js\u001b[39m`);
                    console.log(`\u001b[36mnode js${node.path.sep}services server 3000\u001b[39m`);
                } else {
                    console.log(`\u001b[4m${args[1]}\u001b[0m`);
                    console.log("");
                    console.log(wrap(commandList[args[1]].detail, longest));
                    console.log("");
                    console.log("Example");
                    console.log(`\u001b[36mnode js${node.path.sep}services ${commandList[args[1]].example}\u001b[39m`);
                }
                console.log("");
            },
            help: function services_action_help():void {
                console.log("");
                console.log("");
                console.log(`Thank you for experimenting with the \u001b[4mUnibeautify Parse-Framework\u001b[0m \u001b[32m${version}\u001b[39m in Node.js`);
                console.log("");
                console.log("\u001b[31m*\u001b[39m For a list of commands please try: \u001b[36mnode js/service commands\u001b[39m");
                console.log("\u001b[31m*\u001b[39m For a description of the project please read the readme.md document.");
                console.log("\u001b[31m*\u001b[39m For project status please visit https://github.com/Unibeautify/parse-framework");
                console.log("\u001b[31m*\u001b[39m For standard output of parse data please try: \u001b[36mnode js/service parse-table path/to/file\u001b[39m");
                console.log("    or \u001b[36mnode js/service parse-table code\u001b[39m");
                console.log("\u001b[31m*\u001b[39m For raw unformatted parser output try: \u001b[36mnode js/service parse-array path/to/file\u001b[39m");
                console.log("    or \u001b[36mnode js/service parse-array code\u001b[39m");
                console.log("    or \u001b[36mnode js/service parse-object path/to/file\u001b[39m");
                console.log("    or \u001b[36mnode js/service parse-object code\u001b[39m");
                console.log("");
                console.log("\u001b[4mAbout\u001b[0m");
                console.log("The goal is to provide a framework for plug-and-play rules that parse");
                console.log("various languages with output in the same universal format for use by");
                console.log("any application.  To examine the supplied language rules browse the");
                console.log("code in the 'lexers' directory.");
                console.log("");
                console.log("\u001b[31mhttps://github.com/Unibeautify/parse-framework\u001b[39m");
                console.log("");
            },
            inventory: function services_action_inventory():void {
                console.log("\u001b[4mInventory of mentioned languages\u001b[0m");
                console.log("");
                console.log(wrap("A list of supplied lexers and their various dedicated language support as indicated through use of logic with 'options.lang'. Other languages may be supported without dedicated logic.", 0));
                node.fs.readdir(`${project}lexers`, function services_action_inventory_readdir(err, files) {
                    if (err !== null) {
                        return errout(err);
                    }
                    const langs = {};
                    let index:number = files.length;
                    do {
                        index = index - 1;
                        if (files[index].indexOf(".ts") !== files[index].length - 3) {
                            files.splice(index, 1);
                            index = index + 1;
                        }
                    } while (index > 0);
                    files.forEach(function services_action_inventory_readdir_each(filename) {
                        node.fs.readFile(`${project}lexers${node.path.sep + filename}`, {
                            encoding: "utf8"
                        }, function services_action_inventory_readdir_each_readfile(errf, filedata) {
                            if (errf !== null) {
                                return errout(errf);
                            }
                            langs[filename] = {
                                keys: [],
                                values: {}
                            };
                            const fragments:string[] = filedata.replace(/options\.lang\s*(((!|=)==)|=)\s*/g, "options.lang===").split("options.lang===");
                            if (fragments.length > 1) {
                                fragments.forEach(function services_action_inventory_readdir_each_readfile_fragments(value) {
                                    if (value.charAt(0) === "\"" || value.charAt(0) === "'") {
                                        let quote:string = value.charAt(0);
                                        value = value.slice(1);
                                        value = value.slice(0, value.indexOf(quote));
                                        langs[filename].values[value] = "";
                                    }
                                });
                                langs[filename].keys = Object.keys(langs[filename].values);
                            }
                            index = index + 1;
                            if (index === files.length) {
                                const keys = Object.keys(langs).sort();
                                console.log("");
                                keys.forEach(function services_action_inventory_readdir_each_readfile_output(value) {
                                    console.log(`\u001b[31m*\u001b[39m \u001b[32m${value}\u001b[39m`);
                                    if (langs[value].keys.length > 0) {
                                        langs[value].keys.sort();
                                        langs[value].keys.forEach(function services_action_inventory_readdir_each_readfile_output_dedicated(dedval) {
                                            console.log(`   \u001b[31m-\u001b[39m ${dedval}`);
                                        });
                                    }
                                });
                                console.log("");
                            }
                        });
                    });
                });
            },
            parse: function services_action_parse():void {
                const nodetest = require(`${js}runtimes${node.path.sep}nodetest`);
                process.argv.splice(0, 1);
                if (process.argv[2] === undefined) {
                    return errout(`No code sample or file path. The \u001b[31m${command}\u001b[39m command requires an additional argument.`);
                }
                if (command === "parse-table") {
                    return nodetest();
                }
                process.argv.push("--raw");
                if (command === "parse-object") {
                    process.argv.push("--outputFormat");
                }
                nodetest();
            },
            performance: function services_action_performance():void {
                if (args[1] === undefined) {
                    return errout("The \u001b[31mperformance\u001b[39m command requires a relative path to a file");
                }
                args[1] = node.path.normalize(project + args[1]);
                node.fs.readFile(args[1], {
                    encoding: "utf8"
                }, function services_action_performance_readFile(errfile, filedata) {
                    if (errfile !== null) {
                        const errstring = errfile.toString();
                        if (errstring.indexOf("no such file or directory") > 0) {
                            return errout(`No file exists as the path specified: ${args[1]}`);
                        }
                        return errout(errfile);
                    }
                    require(`${js}parse`);
                    require(`${js}language`);
                    const framework = global.parseFramework,
                        lang = framework.language.auto(filedata, "javascript"),
                        options:parseOptions = {
                            correct: false,
                            crlf: false,
                            lang: lang[0],
                            lexer: lang[1],
                            lexerOptions: {},
                            outputFormat: "arrays",
                            source: filedata
                        };
                    require(`${js}lexers${node.path.sep}all`)(options, function services_action_performance_readFile_lexers() {
                        const store:number[] = [],
                            output:data = framework.parserArrays(options),
                            comma = function services_action_performance_readFile_readdir_comma(input:number):string {
                                const arr = input.toString().split("").reverse(),
                                    len = arr.length - 1;
                                let ind:number = 0;
                                if (len > 2) {
                                    do {
                                        ind = ind + 3;
                                        if (ind < len) {
                                            arr[ind - 1] = `,${arr[ind - 1]}`;
                                        }
                                    } while (ind < len);
                                }
                                return arr.reverse().join("");
                            };
                        let index:number = 10,
                            total:number = 0,
                            low:number = 0,
                            high:number = 0,
                            start:[number, number],
                            end:[number, number];
                        do {
                            index = index - 1;
                            start = process.hrtime();
                            framework.parserArrays(options);
                            end = process.hrtime(start);
                            store.push((end[0] * 1e9) + end[1]);
                        } while (index > 0);
                        store.forEach(function services_action_performance_readFile_readdir_total(value) {
                            total = total + value;
                            if (value > high) {
                                high = value;
                            } else if (value < low) {
                                low = value;
                            }
                        });

                        console.log(`[\u001b[32m${(total / 1e7)}\u001b[39m] Milliseconds, \u00b1\u001b[36m${((((high - low) / total) / 2) * 100).toFixed(2)}\u001b[39m%`);
                        console.log(`[\u001b[36m${comma(filedata.length)}\u001b[39m] Character size`);
                        console.log(`[\u001b[36m${comma(output.token.length)}\u001b[39m] Token length`);
                    });
                });
            },
            server: function services_action_server():void {
                process.argv.splice(0, 1);
                require(`${js}runtimes${node.path.sep}httpserver`)();
            },
            validation: function services_action_validation():void {
                require(`${js}test${node.path.sep}validate`)();
            },
            version: function services_action_version():void {
                console.log(version);
            }
        },
        keys:string[] = Object.keys(commandList);
    
    command = (args[0] === undefined)
        ? ""
        : args[0].toLowerCase();
    
    command = alias(command);
    if (command === "commands" && args[1] !== undefined) {
        args[1] = alias(args[1]);
    }

    // updates the files that mention a version number
    node.fs.readFile(`${project}package.json`, {
        encoding: "utf8"
    }, function service_version(err, file) {
        if (err !== null) {
            return errout("Error reading package.json file");
        }
        const versionFiles = [
            "readme.md",
            `runtimes${node.path.sep}browsertest.xhtml`
        ];
        version = JSON.parse(file).version;
        versionFiles.forEach(function service_version_each(filePath) {
            node.fs.readFile(project + filePath, {
                encoding: "utf8"
            }, function service_version_each_read(erra, fileData) {
                if (erra !== null) {
                    return errout(`Error reading ${filePath} file`);
                }
                let ftest = (filePath === "readme.md")
                        ? "Version "
                        : "<span class=\"version\">",
                    ltest = (filePath === "readme.md")
                        ? "\n"
                        : "</span>",
                    index = fileData.indexOf(ftest),
                    fvers = fileData.slice(index);
                fvers  = fvers.slice(0, fvers.indexOf(ltest)).replace(ftest, "");
                if (fvers !== version) {
                    fileData = fileData.replace(ftest + fvers, ftest + version);
                    node.fs.writeFile(project + filePath, fileData, {
                        encoding: "utf8"
                    }, function service_version_each_read_write(errw) {
                        if (errw !== null) {
                            return errout(`Error writing version update to ${filePath}`);
                        }
                    });
                }
            });
        });
        if (command.indexOf("parse") === 0) {
            action.parse();
        } else {
            action[command]();
        }
    });
};
module.exports = services;
if (process.argv[1].replace(/\\/g, "/").indexOf("js/services") > -1) {
    services();
}