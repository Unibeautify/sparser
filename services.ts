#!/usr/bin/env node

/* This file exists to consolidate the various Node service offerings in
   this application. */

(function sevices() {
    "use strict";
    let version:string = "";
    const args:string[] = process.argv.slice(2),
        node = {
            child: require("child_process").exec,
            fs: require("fs"),
            path: require("path")
        },
        project:string = (function services_project() {
            const dirs:string[] = __dirname.split(node.path.sep);
            return dirs.slice(0, dirs.length - 1).join(node.path.sep);
        }()),
        command:string = (args[0] === undefined)
            ? ""
            : args[0].toLowerCase(),
        commandList = {
            "build"       : "Run the project's TypeScript build",
            "commands"    : "A brief list of supported commands",
            "help"        : "General information about this application",
            "inventory"   : "List the currently supplied lexers and their support language variants",
            "parse-array" : "Provides to standard output the parsed data in the default format",
            "parse-object": "Provides to standard output the parsed data in the format described the option and value: parseFormat: 'object'",
            "parse-table" : "Provides to standard output the parsed data formatted into a grid with ANSI colors",
            "server"      : "Starts a web server so that TypeScript builds will execute on file updates and the browser tool will automatically refresh upon build completion",
            "validation"  : "Run the validation build",
            "version"     : "The current version identifier according to SemVer rules" 
        },
        time = function services_time(message:string):number {
            const date:Date = new Date(),
                datearr:string[] = [];
            let hours:string = String(date.getHours()),
                minutes:string = String(date.getMinutes()),
                seconds:string = String(date.getSeconds()),
                mseconds:string = String(date.getMilliseconds());
            if (hours.length === 1) {
                hours = "0" + hours;
            }
            if (minutes.length === 1) {
                minutes = "0" + minutes;
            }
            if (seconds.length === 1) {
                seconds = "0" + seconds;
            }
            if (mseconds.length < 3) {
                do {
                    mseconds = "0" + mseconds;
                } while (mseconds.length < 3);
            }
            datearr.push(hours);
            datearr.push(minutes);
            datearr.push(seconds);
            datearr.push(mseconds);
            console.log("[\u001b[36m" + datearr.join(":") + "\u001b[39m] " + message);
            return date.valueOf();
        },
        duration = function nodemon_duration(length:number, message:string):void {
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
                list[0] = "0" + list[0];
            }
            if (length > 60000) {
                minutes = Math.floor(length / 60000);
                length = length - (minutes * 60000);
            }
            list.push(minutes.toString());
            if (list[1].length < 2) {
                list[1] = "0" + list[1];
            }
            if (length > 1000) {
                seconds = Math.floor(length / 1000);
                length = length - (seconds * 1000);
            }
            list.push(seconds.toString());
            if (list[2].length < 2) {
                list[2] = "0" + list[2];
            }
            list.push(length.toString());
            if (list[3].length < 3) {
                do {
                    list[3] = "0" + list[3];
                } while (list[3].length < 3);
            }
            console.log("[\u001b[36m" + list.join(":") + "\u001b[39m] " + message);
        },
        errout = function services_errout(message:string):void {
            let stack = new Error().stack;
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
        action = {
            build: function services_action_build():void {
                console.log("");
                const start = time("Running TypeScript build");
                node.child("tsc", {
                    cwd: project
                }, function services_action_build_callback(err, stdout, stderr):void {
                    if (err !== null) {
                        return errout(err);
                    }
                    if (stderr !== null && stderr !== "") {
                        return errout(stderr);
                    }
                    duration(time("Build complete") - start, "Total compile time");
                    console.log("");
                });
            },
            commands: function services_action_commands():void {
                let longest:number = 0;
                keys.forEach(function services_action_commands_longest(value):void {
                    if (value.length > longest) {
                        longest = value.length;
                    }
                });
                console.log(" ");
                keys.forEach(function services_action_commands_output(value):void {
                    const output:string[] = ["\u001b[31m*\u001b[39m \u001b[32m"];
                    let length:number = value.length,
                        index:number = 80,
                        lindex:number = 0;
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
                    if (longest + commandList[value].length > 80) {
                        const chars:string[] = commandList[value].split("");
                        let len:number = chars.length + longest;
                        do {
                            do {
                                if (chars[index] === " ") {
                                    chars[index] = "\n   ";
                                    do {
                                        chars[index] = chars[index] + " ";
                                        length = length - 1;
                                    } while (length > 0);
                                    break;
                                }
                                index = index - 1;
                            } while (index > lindex);
                            index = index + (77 - longest);
                            lindex = index;
                        } while (index < len);
                        output.push(chars.join(""));
                    } else {
                        output.push(commandList[value]);
                    }
                    console.log(output.join(""));
                });
                console.log(" ");
            },
            help: function services_action_help():void {
                console.log("");
                console.log("Thank you for trying the Unibeautify Parse-Framework at version \u001b[32m" + version + "\u001b[39m");
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
            },
            inventory: function services_action_inventory():void {
                console.log("\u001b[4mInventory of mentioned languages\u001b[0m");
                console.log("A list of supplied lexers and their various dedicated language support as indicated through use of logic with 'options.lang'. Other languages may be supported without dedicated logic.");
                node.fs.readdir(project + node.path.sep + "lexers", function services_action_inventory_readdir(err, files) {
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
                        node.fs.readFile(project + node.path.sep + "lexers" + node.path.sep + filename, {
                            encoding: "utf8"
                        }, function services_action_inventory_readdir_each_readfile(errf, filedata) {
                            if (errf !== null) {
                                return errout(errf);
                            }
                            langs[filename] = {
                                keys: [],
                                values: {}
                            };
                            const fragments:string[] = filedata.replace(/options\.lang\s*(((\!|=)==)|=)\s*/g, "options.lang===").split("options.lang===");
                            if (fragments.length > 1) {
                                fragments.forEach(function services_action_inventory_readdir_each_readfile_fragments(value, index, array) {
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
                                    console.log("\u001b[31m*\u001b[39m \u001b[32m" + value + "\u001b[39m");
                                    if (langs[value].keys.length > 0) {
                                        langs[value].keys.sort();
                                        langs[value].keys.forEach(function services_action_inventory_readdir_each_readfile_output_dedicated(dedval) {
                                            console.log("   \u001b[31m-\u001b[39m " + dedval);
                                        });
                                    }
                                });
                                console.log("");
                            }
                        });
                    });
                });
            },
            version: function services_action_version():void {
                console.log(version);
            }
        },
        keys:string[] = Object.keys(commandList);

    // updates the files that mention a version number
    node.fs.readFile(project + node.path.sep + "package.json", {
        encoding: "utf8"
    }, function service_version(err, file) {
        if (err !== null) {
            return errout("Error reading package.json file");
        }
        const versionFiles = [
            "readme.md",
            "runtimes" + node.path.sep + "browsertest.xhtml"
        ];
        version = JSON.parse(file).version;
        versionFiles.forEach(function service_version_each(filePath) {
            node.fs.readFile(project + node.path.sep + filePath, {
                encoding: "utf8"
            }, function service_version_each_read(erra, fileData) {
                if (erra !== null) {
                    return errout("Error reading " + filePath + " file");
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
                    node.fs.writeFile(project + node.path.sep + filePath, fileData, {
                        encoding: "utf8"
                    }, function service_version_each_read_write(errw) {
                        if (errw !== null) {
                            return errout("Error writing version update to " + filePath);
                        }
                    });
                }
            });
        });
        if (commandList[command] === undefined) {
            action.help();
        } else {
            action[command]();
        }
    });
}());