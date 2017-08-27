/*jslint browser:true */
/*global global, performance, window*/

(function web() {
    "use strict";
    const framework:parseFramework = global.parseFramework,
        input   = document.getElementsByTagName("textarea")[0],
        options:options = {
            correct     : false,
            crlf        : false,
            lang        : "",
            lexer       : "script",
            lexerOptions: {},
            source      : ""
        },
        handler = function web_handler():void {
            let output:data,
                startTime:number = 0;
            const value:string = input.value,
                checkboxes:[HTMLInputElement, HTMLInputElement] = [
                    document.getElementsByTagName("input")[0],
                    document.getElementsByTagName("input")[1]
                ],
                startTotal:number = Math.round(performance.now() * 1000),
                lang:[string, string, string]   = framework.language.auto(value, "javascript"),
                builder = function web_handler_builder(data:data):void {
                    let a:number         = 0,
                        body      = document.createElement("thead");
                    const len:number       = data.token.length,
                        table     = document.createElement("table"),
                        cell      = function web_handler_builder_cell(text:string, type:string, row, className:string):void {
                            const el = document.createElement(type);
                            if (className !== "") {
                                el.setAttribute("class", className);
                            }
                            el.innerHTML = text;
                            row.appendChild(el);
                        },
                        row       = function web_handler_builder_row():void {
                            const tr = document.createElement("tr");
                            cell(a.toString(), "th", tr, "numb");
                            cell(data.begin[a].toString(), "td", tr, "numb");
                            cell(data.lexer[a], "td", tr, "");
                            cell(data.lines[a].toString(), "td", tr, "numb");
                            cell(data.presv[a].toString(), "td", tr, "");
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
                        header    = function web_handler_builder_header(parent):void {
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
            options.lexerOptions = {};
            Object.keys(framework.lexer).forEach(function web_handler_lexers(value):void {
                options.lexerOptions[value] = {};
            });
            options.lexerOptions.script.objectSort = (checkboxes[0].checked === true);
            options.lexerOptions.style.objectSort  = (checkboxes[0].checked === true);
            options.lexerOptions.markup.tagSort    = (checkboxes[1].checked === true);
            options.lang                           = lang[0];
            options.lexer                          = lang[1];
            document.getElementById("language").getElementsByTagName("span")[0].innerHTML = lang[2];
            if (options.lexer === "javascript") {
                options.lexer = "script";
            }
            if (Object.keys(window).indexOf("localStorage") > -1) {
                localStorage.parseCode = value;
            }
            options.source = value;
            startTime = Math.round(performance.now() * 1000);
            output = framework.parser(options);
            (function web_handler_perfParse() {
                const endTime = Math.round(performance.now() * 1000),
                    time = (endTime - startTime) / 1000;
                document.getElementById("timeparse").getElementsByTagName("span")[0].innerHTML = time + " milliseconds.";
            }());
            builder(output);
            (function web_handler_perfTotal():void {
                const endTime:number = Math.round(performance.now() * 1000),
                    time:number = (endTime - startTotal) / 1000;
                document.getElementById("timetotal").getElementsByTagName("span")[0].innerHTML = time + " milliseconds.";
            }());
            if (framework.parseerror !== "") {
                document.getElementById("errors").getElementsByTagName("span")[0].innerHTML = framework.parseerror.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
    window.onerror = function (msg:string, source:string):void {
        document.getElementById("errors").getElementsByTagName("span")[0].innerHTML = msg + " " + source;
    };
    if (Object.keys(window).indexOf("localStorage") > -1 && window.localStorage.parseCode !== undefined) {
        input.value = localStorage.parseCode;
    }
}());