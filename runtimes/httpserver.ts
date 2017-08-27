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
        server = http.createServer(function server_create(request, response) {
            const fs   = require("fs"),
                file:string = (request.url === "/")
                    ? "browsertest.xhtml"
                    : request
                        .url
                        .slice(1);
            if (request.url.indexOf("favicon.ico") < 0) {
                fs.readFile(file, "utf8", function server_create_readFile(err, data) {
                    if (err !== undefined && err !== null) {
                        if (err.toString().indexOf("no such file or directory") > 0) {
                            response.writeHead(404, {"Content-Type": "text/plain"});
                            return console.log("404 for " + file);
                        }
                        response.write(JSON.stringify(err));
                        return console.log(err);
                    }
                    response.write(data);
                    response.end();
                    console.log("Responded with " + file);
                });
            } else {
                response.end();
            }
        });
    server.listen(9999);
    console.log("Server is up!");
}());
