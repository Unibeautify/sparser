/*global console, require */
/*eslint-env node*/
/*eslint no-console: 0*/
/*jslint node: true*/

// I don't have Firefox on my new work computer and cannot install software. I
// do have Chrome, but Chrome barfs and throws errors if sees localStorage
// referenced from the file scheme. So, I am creating a server to work on my
// local file.

(function server() {
    "use strict";
    const http   = require("http"),
        path     = require("path"),
        fs       = require("fs"),
        child    = require("child_process").exec,
        nodemon  = require("nodemon"),
        socket   = require("ws"),
        validate = require(".." + path.sep + "test" + path.sep + "validate.js"),
        cwd      = process.cwd(),
        port     = (process.argv[2] === undefined)
            ? 9999
            : Number(process.argv[2]),
        server   = http.createServer(function server_create(request, response):void {
            let quest:number = request.url.indexOf("?"),
                uri:string = (quest > 0)
                    ? request.url.slice(0, quest)
                    : request.url,
                file:string = uri.slice(1);
            if (uri === "/") {
                file = "runtimes/browsertest.xhtml";
            }
            if (request.url.indexOf("favicon.ico") < 0) {
                fs.readFile(file, "utf8", function server_create_readFile(err, data):void {
                    if (err !== undefined && err !== null) {
                        if (err.toString().indexOf("no such file or directory") > 0) {
                            response.writeHead(404, {"Content-Type": "text/plain"});
                            console.log("\u001b[31m\u001b[1m404\u001b[0m\u001b[39m for " + file);
                            return;
                        }
                        response.write(JSON.stringify(err));
                        console.log(err);
                        return;
                    }
                    response.write(data);
                    response.end();
                    //console.log("Responded with " + file);
                });
            } else {
                response.end();
            }
        });
    let ws;
    if (isNaN(port) === true) {
        console.log("\u001b[31m\u001b[1mError:\u001b[0m\u001b[39m Specified port is, " + port + ", which not a number!");
        process.exit(1);
    }
    if (cwd.indexOf("parse-framework") < cwd.length - 15) {
        process.chdir(cwd.slice(0, cwd.indexOf("parse-framework") + 15));
    }
    ws = new socket.Server({port: port + 1});
    ws.broadcast = function socket_broadcast(data:string):void {
        ws.clients.forEach(function socket_broadcast_clients(client):void {
            if (client.readyState === socket.OPEN) {
                client.send(data);
            }
        });
    };
    console.log("HTTP server is up at: \u001b[36mhttp://localhost:" + port + "\u001b[39m");
    console.log("\u001b[32mStarting nodemon!\u001b[39m");
    nodemon({
        "delay"  : "0",
        "ext" : "txt ts css xhtml",
        "ignore" : ["js", "node_modules", "test" + path.sep + "samples_code"],
        "system" : process.cwd(),
        "timeout": 0
    }).on("restart", function nodemon_restart(event) {
        const file:string = event[0].slice(event[0].indexOf("parse-framework") + 16).replace(/(\s+)$/, ""),
            extension:string = (function nodemon_start_extension() {
                const list = file.split(".");
                return list[list.length - 1];
            }()),
            time = function nodemon_time(message:string):number {
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
            };console.log(file);
        if (extension === "ts") {
            let start:number,
                compile:number,
                duration = function nodemon_duration(length:number):void {
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
                    console.log("[\u001b[36m" + list.join(":") + "\u001b[39m] Total compile time.");
                };
            console.log("");
            start = time("Compiling TypeScript for \u001b[32m" + file + "\u001b[39m");
            child("tsc", function nodemon_restart_child(err, stdout, stderr):void {
                if (err !== null) {
                    console.log(err);
                    return;
                }
                if (stderr !== null && stderr !== "") {
                    console.log(stderr);
                    return;
                }
                compile = time("TypeScript Compiled") - start;
                duration(compile);
                ws.broadcast("reload");
                return;
            });
        } else if (extension === "css" || extension === "xhtml" || extension === "js") {
            console.log("");
            time("Refreshing browser tab(s) - \u001b[32m" + file + "\u001b[39m");
            ws.broadcast("reload");
        } else if (extension === "txt" && file.indexOf("samples_parsed") > -1) {
            console.log("");
            time("Running validation build");
            validate();
        }
    });
    server.listen(port);
}());
