(function web() {
    "use strict";
    var input   = document.getElementById("input"),
        options = {
            correct   : false,
            objectSort: false,
            source    : "",
            tagSort   : false,
            type      : "script"
        },
        handler = function web_handler(e) {
            var value = input.value,
                startTime = 0,
                startTotal = Math.round(performance.now() * 1000),
                lang   = global.language.auto(value, "javascript"),
                output = {},
                builder = function web_handler_builder(data) {
                    var a         = 0,
                        len       = data.token.length,
                        table     = document.createElement("table"),
                        body      = document.createElement("thead"),
                        typevalue = "",
                        cell      = function web_handler_builder_cell(text, type, row, className) {
                            var el = document.createElement(type);
                            if (className !== "") {
                                el.setAttribute("class", className);
                            }
                            el.innerHTML = text;
                            row.appendChild(el);
                        },
                        row       = function web_handler_builder_row() {
                            var tr = document.createElement("tr");
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
                            var tr   = document.createElement("tr");
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
            options.tagSort = (document.getElementById("tagSort").checked === true);
            options.lang = lang[0];
            options.type = lang[1];
            document.getElementById("language").getElementsByTagName("span")[0].innerHTML = lang[2];
            if (options.type === "javascript") {
                options.type = "script";
            }
            if (Object.keys(window).indexOf("localStorage") > -1) {
                localStorage.parseCode = value;
            }
            options.source = value;
            startTime = Math.round(performance.now() * 1000);
            output = global.parser(options);
            (function web_handler_perfParse() {
                var endTime = Math.round(performance.now() * 1000),
                    time = (endTime - startTime) / 1000;
                document.getElementById("timeparse").getElementsByTagName("span")[0].innerHTML = time + " milliseconds.";
            }());
            builder(output);
            (function web_handler_perfTotal() {
                var endTime = Math.round(performance.now() * 1000),
                    time = (endTime - startTotal) / 1000;
                document.getElementById("timetotal").getElementsByTagName("span")[0].innerHTML = time + " milliseconds.";
            }());
            if (global.parseerror !== "") {
                document.getElementById("errors").getElementsByTagName("span")[0].innerHTML = global.parseerror;
            } else {
                document.getElementById("errors").getElementsByTagName("span")[0].innerHTML = "";
            }
        },
        backspace = function web_backspace(event) {
            var e = event || window.event,
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
    if (Object.keys(window).indexOf("localStorage") > -1 && window["localStorage"].parseCode !== undefined) {
        input.value = localStorage.parseCode;
    }
}());