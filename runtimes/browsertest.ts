/*jslint browser:true */
/*eslint-env browser*/
/*global global, performance, window*/

(function web() {
    "use strict";
    const framework:parseFramework = global.parseFramework,
        input   = document.getElementsByTagName("textarea")[0],
        options:parseOptions = {
            correct        : false,
            crlf           : false,
            lang           : "",
            lexer          : "script",
            lexerOptions   : {},
            outputFormat   : "arrays",
            source         : ""
        },
        handler = function web_handler():void {
            let outputArrays:data,
                outputObjects:record[],
                startTime:number = 0;
            const value:string = input.value,
                checkboxes:[HTMLInputElement, HTMLInputElement] = [
                    document.getElementsByTagName("input")[0],
                    document.getElementsByTagName("input")[1]
                ],
                startTotal:number = Math.round(performance.now() * 1000),
                lang:[string, string, string]   = framework.language.auto(value, "javascript"),
                builder = function web_handler_builder():void {
                    let a:number         = 0,
                        body      = document.createElement("thead");
                    const len:number       = global.parseFramework.parse.count + 1,
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
                            if (options.outputFormat === "objects") {
                                cell(outputObjects[a].begin.toString(), "td", tr, "numb");
                                cell(outputObjects[a].lexer, "td", tr, "");
                                cell(outputObjects[a].lines.toString(), "td", tr, "numb");
                                cell(outputObjects[a].presv.toString(), "td", tr, "");
                                cell(outputObjects[a].stack.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), "td", tr, "");
                                cell(outputObjects[a].types, "td", tr, "");
                                cell(outputObjects[a].token.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), "td", tr, "");
                                if (a % 2 === 0) {
                                    tr.setAttribute("class", outputObjects[a].lexer + " even");
                                } else {
                                    tr.setAttribute("class", outputObjects[a].lexer + " odd");
                                }
                            } else {
                                cell(outputArrays.begin[a].toString(), "td", tr, "numb");
                                cell(outputArrays.lexer[a], "td", tr, "");
                                cell(outputArrays.lines[a].toString(), "td", tr, "numb");
                                cell(outputArrays.presv[a].toString(), "td", tr, "");
                                cell(outputArrays.stack[a].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), "td", tr, "");
                                cell(outputArrays.types[a], "td", tr, "");
                                cell(outputArrays.token[a].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), "td", tr, "");
                                if (a % 2 === 0) {
                                    tr.setAttribute("class", outputArrays.lexer[a] + " even");
                                } else {
                                    tr.setAttribute("class", outputArrays.lexer[a] + " odd");
                                }
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
                    
                    if (framework.lexer[options.lexer] === undefined) {
                        document.getElementById("errors").getElementsByTagName("span")[0].innerHTML = framework.parseerror.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        return;
                    }
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
            if (options.outputFormat === "arrays") {
                outputArrays = framework.parserArrays(options);
            } else {
                outputObjects = framework.parserObjects(options);
            }
            (function web_handler_perfParse() {
                const endTime = Math.round(performance.now() * 1000),
                    time = (endTime - startTime) / 1000;
                document.getElementById("timeparse").getElementsByTagName("span")[0].innerHTML = time + " milliseconds.";
            }());
            builder();
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
    window.onerror = function web_onerror(msg:string, source:string):void {
        document.getElementById("errors").getElementsByTagName("span")[0].innerHTML = msg + " " + source;
    };
    if (Object.keys(window).indexOf("localStorage") > -1 && window.localStorage.parseCode !== undefined) {
        input.value = localStorage.parseCode;
    }
    if (location.href.indexOf("//localhost:") > 0) {
        let port:number = (function port():number {
            const uri = location.href;
            let str:string = uri.slice(location.href.indexOf("host:") + 5),
                ind:number = str.indexOf("/");
            if (ind > 0) {
                str = str.slice(0, ind);
            }
            ind = str.indexOf("?");
            if (ind > 0) {
                str = str.slice(0, ind);
            }
            ind = str.indexOf("#");
            if (ind > 0) {
                str = str.slice(0, ind);
            }
            ind = Number(str);
            if (isNaN(ind) === true) {
                return 8080;
            }
            return ind;
        }()),
        ws = new WebSocket("ws://localhost:" + (port + 1));
        ws.addEventListener("message", function web_sockets(event) {
            if (event.data === "reload") {
                location.reload();
            }
        });
        if (location.href.indexOf("scrolldown") > 0) {
            const body = document.getElementsByTagName("body")[0],
                el = (document.documentElement.clientHeight > body.clientHeight)
                    ? document.documentElement
                    : body;
            handler();
            body.style.backgroundColor = "#000";
            setTimeout(function web_scrolldelay() {
                el.scrollTop = el.scrollHeight;
                body.style.backgroundColor = "#fff";
            }, 200);
        }
    }
}());