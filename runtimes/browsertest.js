/*jslint browser:true */
/*global global, performance, window*/

(function web() {
    "use strict";
    const input   = document.getElementById("input"),
        options = {
            correct   : false,
            lexer     : "script",
            objectSort: false,
            source    : "",
            tagSort   : false
        },
        handler = function web_handler() {
            let output = {},
                startTime = 0;
            const value = input.value,
                startTotal = Math.round(performance.now() * 1000),
                lang   = global.language.auto(value, "javascript"),
                builder = function web_handler_builder(data) {
                    let a         = 0,
                        body      = document.createElement("thead");
                    const len       = data.token.length,
                        table     = document.createElement("table"),
                        cell      = function web_handler_builder_cell(text, type, row, className) {
                            const el = document.createElement(type);
                            if (className !== "") {
                                el.setAttribute("class", className);
                            }
                            el.innerHTML = text;
                            row.appendChild(el);
                        },
                        row       = function web_handler_builder_row() {
                            const tr = document.createElement("tr");
                            cell(a, "th", tr, "numb");
                            cell(data.begin[a], "td", tr, "numb");
                            cell(data.lexer[a], "td", tr, "");
                            cell(data.lines[a], "td", tr, "numb");
                            cell(data.presv[a], "td", tr, "");
                            cell(data.stack[a].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), "td", tr, "");
                            cell(data.types[a], "td", tr, "");
                            cell(data.token[a].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), "td", tr, "");
                            if (a % 2 === 0) {
                                tr.setAttribute("class", data.lexer[a] + " even");
                            } else {
                                tr.setAttribute("class", data.lexer[a] + " odd");
                            }
                            body.appendChild(tr);
                        },
                        header    = function web_handler_builder_header(parent) {
                            const tr   = document.createElement("tr");
                            cell("index", "th", tr, "numb");
                            cell("begin", "th", tr, "numb");
                            cell("lexer", "th", tr, "");
                            cell("lines", "th", tr, "numb");
                            cell("presv", "th", tr, "");
                            cell("stack", "th", tr, "");
                            cell("types", "th", tr, "");
                            cell("token", "th", tr, "");
                            tr.setAttribute("class", "header");
                            parent.appendChild(tr);
                        };
                    header(body);
                    table.appendChild(body);
                    body = document.createElement("tbody");
                    table.appendChild(body);
                    if (len === 0) {
                        return;
                    }
                    do {
                        if (a % 100 === 0 && a > 0) {
                            header(body);
                        }
                        row();
                        a = a + 1;
                    } while (a < len);
                    document.getElementById("data").innerHTML = "";
                    document.getElementById("data").appendChild(table);
                };
            options.objectSort = (document.getElementById("objectSort").checked === true);
            options.tagSort    = (document.getElementById("tagSort").checked === true);
            options.lang       = "html";//lang[0];
            options.lexer      = lang[1];
            document.getElementById("language").getElementsByTagName("span")[0].innerHTML = lang[2];
            if (options.lexer === "javascript") {
                options.lexer = "script";
            }
            if (Object.keys(window).indexOf("localStorage") > -1) {
                localStorage.parseCode = value;
            }
            options.source = value;
            startTime = Math.round(performance.now() * 1000);
            output = global.parser(options);
            (function web_handler_perfParse() {
                const endTime = Math.round(performance.now() * 1000),
                    time = (endTime - startTime) / 1000;
                document.getElementById("timeparse").getElementsByTagName("span")[0].innerHTML = time + " milliseconds.";
            }());
            builder(output);
            (function web_handler_perfTotal() {
                const endTime = Math.round(performance.now() * 1000),
                    time = (endTime - startTotal) / 1000;
                document.getElementById("timetotal").getElementsByTagName("span")[0].innerHTML = time + " milliseconds.";
            }());
            if (global.parseerror !== "") {
                document.getElementById("errors").getElementsByTagName("span")[0].innerHTML = global.parseerror.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            } else {
                document.getElementById("errors").getElementsByTagName("span")[0].innerHTML = "";
            }
        },
        backspace = function web_backspace(event) {
            const e = event || window.event,
                f = e.srcElement || e.target;
            if (e.keyCode === 8 && f.nodeName !== "textarea") {
                e.preventDefault();
                return false;
            }
        };
    input.onkeyup = handler;
    document.onkeypress = backspace;
    document.onkeydown = backspace;
    window.onerror = function (msg, source) {
        document.getElementById("errors").getElementsByTagName("span")[0].innerHTML = msg + " " + source;
    };
    if (Object.keys(window).indexOf("localStorage") > -1 && window.localStorage.parseCode !== undefined) {
        input.value = localStorage.parseCode;
    }
}());