/*jslint browser:true */
/*eslint-env browser*/
/*global ace, performance, window*/

(function web() {
    "use strict";
    let editor:any,
        lang:[string, string, string] = ["", "", ""];
    const sparser:sparser = window.sparser,
        acetest:boolean = (location.href.toLowerCase().indexOf("ace=false") < 0 && typeof ace === "object"),
        aceControl:HTMLInputElement = <HTMLInputElement>document.getElementById("aceControl"),
        input:HTMLTextAreaElement   = document.getElementsByTagName("textarea")[0],
        dataarea:HTMLElement        = document.getElementById("data"),
        parseCode:string = (Object.keys(window).indexOf("localStorage") > -1)
            ? window.localStorage.getItem("parseCode")
            : "",
        textsize = (navigator.userAgent.indexOf("like Gecko") < 0 && navigator.userAgent.indexOf("Gecko") > 0 && navigator.userAgent.indexOf("Firefox") > 0)
            ? 13
            : 13.33,
        options:parseOptions = {
            correct         : false,
            crlf            : false,
            language        : "",
            lexer           : "script",
            lexer_options   : {},
            format          : "arrays",
            preserve_comment: false,
            source          : "",
            wrap            : 0
        },
        handler = function web_handler():void {
            let output:any,
                startTime:number = 0;
            const value:string = (acetest === true)
                    ? editor.getValue()
                    : input.value,
                checkboxes:[HTMLInputElement, HTMLInputElement] = [
                    document.getElementsByTagName("input")[1],
                    document.getElementsByTagName("input")[2]
                ],
                startTotal:number = Math.round(performance.now() * 1000),
                builder = function web_handler_builder():void {
                    let a:number         = 0,
                        body      = document.createElement("thead");
                    const len:number       = window.sparser.parse.count + 1,
                        table     = document.createElement("table"),
                        cell      = function web_handler_builder_cell(data:htmlCellBuilder):void {
                            const el = document.createElement(data.type);
                            if (data.className !== "") {
                                el.setAttribute("class", data.className);
                            }
                            el.innerHTML = data.text;
                            data.row.appendChild(el);
                        },
                        row       = function web_handler_builder_row():void {
                            const tr = document.createElement("tr");
                            cell({
                                text: a.toString(),
                                type: "th",
                                row: tr,
                                className: "numb"
                            });
                            cell({
                                text: output.begin[a].toString(),
                                type: "td",
                                row: tr,
                                className: "numb"
                            });
                            cell({
                                text: output.ender[a].toString(),
                                type: "td",
                                row: tr,
                                className: "numb"
                            });
                            cell({
                                text: output.lexer[a],
                                type: "td",
                                row: tr,
                                className: ""
                            });
                            cell({
                                text: output.lines[a].toString(),
                                type: "td",
                                row: tr,
                                className: "numb"
                            });
                            cell({
                                text: output.stack[a].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
                                type: "td",
                                row: tr,
                                className: ""
                            });
                            cell({
                                text: output.types[a],
                                type: "td",
                                row: tr,
                                className: ""
                            });
                            cell({
                                text: output.token[a].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
                                type: "td",
                                row: tr,
                                className: ""
                            });
                            if (a % 2 === 0) {
                                tr.setAttribute("class", output.lexer[a] + " even");
                            } else {
                                tr.setAttribute("class", output.lexer[a] + " odd");
                            }
                            body.appendChild(tr);
                        },
                        header    = function web_handler_builder_header(parent):void {
                            const tr   = document.createElement("tr");
                            cell({
                                text: "index",
                                type: "th",
                                row: tr,
                                className: "numb"
                            });
                            cell({
                                text: "begin",
                                type: "th",
                                row: tr,
                                className: "numb"
                            });
                            cell({
                                text: "ender",
                                type: "th",
                                row: tr,
                                className: "numb"
                            });
                            cell({
                                text: "lexer",
                                type: "th",
                                row: tr,
                                className: ""
                            });
                            cell({
                                text: "lines",
                                type: "th",
                                row: tr,
                                className: "numb"
                            });
                            cell({
                                text: "stack",
                                type: "th",
                                row: tr,
                                className: ""
                            });
                            cell({
                                text: "types",
                                type: "th",
                                row: tr,
                                className: ""
                            });
                            cell({
                                text: "token",
                                type: "th",
                                row: tr,
                                className: ""
                            });
                            tr.setAttribute("class", "header");
                            parent.appendChild(tr);
                        };
                    
                    if (sparser.lexers[options.lexer] === undefined) {
                        document.getElementById("errors").getElementsByTagName("span")[0].innerHTML = sparser.parseerror.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
                    dataarea.innerHTML = "";
                    dataarea.appendChild(table);
                };
            options.lexer_options = {};
            Object.keys(sparser.lexers).forEach(function web_handler_lexers(value):void {
                options.lexer_options[value] = {};
            });
            if (editor !== undefined && (acetest === true || lang[0] !== "")) {
                editor.getSession().setMode(`ace/mode/${lang[0]}`);
            }
            if (checkboxes[1] !== undefined) {
                options.lexer_options.script.object_sort = (checkboxes[1].checked === true);
                options.lexer_options.style.object_sort  = (checkboxes[1].checked === true);
            }
            if (checkboxes[0] !== undefined) {
                options.lexer_options.markup.tag_sort    = (checkboxes[0].checked === true);
            }
            lang = sparser.libs.language.auto(value, "javascript");
            if (options.lexer === "javascript") {
                options.lexer = "script";
            }
            if (Object.keys(window).indexOf("localStorage") > -1) {
                localStorage.setItem("parseCode", value);
            }
            {
                const params:string[] = (location.href.indexOf("?") > 0)
                    ? location.href.split("?")[1].split("&")
                    : [];
                if (params.length > 1) {
                    let aa:number = params.length,
                        name:string = "",
                        values:string = "";
                    do {
                        aa = aa - 1;
                        name = params[aa].slice(0, params[aa].indexOf("=")).toLowerCase();
                        values = (params[aa].indexOf("=") > 0)
                            ? params[aa].slice(params[aa].indexOf("=") + 1)
                            : "";
                        if (options[params[aa]] !== undefined && typeof options[params[aa]] === "boolean") {
                            options[params[aa]] = true;
                        } else if (options[name] !== undefined && values !== "") {
                            if (typeof options[name] === "boolean") {
                                if (values === "true") {
                                    options[name] = true;
                                } else if (values === "false") {
                                    options[name] = false;
                                }
                            } else if (typeof options[name] === "number" && isNaN(Number(values)) === false) {
                                options[name] = Number(values);
                            } else {
                                options[name] = values;
                                if (name === "language") {
                                    lang[0] = values;
                                    lang[2] = values;
                                } else if (name === "lexer") {
                                    lang[1] = values;
                                }
                            }
                        } else if (name === "quote_convert" || name === "quoteconvert") {
                            if (values === "single" || values === "double") {
                                options.lexer_options.markup.quote_convert = values;
                                options.lexer_options.script.quote_convert = values;
                                options.lexer_options.style.quote_convert = values;
                            }
                        } else if (name === "end_comma" || name === "endcomma") {
                            if (values === "always" || values === "never") {
                                options.lexer_options.script.end_comma = values;
                            }
                        } else if (name === "noleadzero" || name === "no_lead_zero") {
                            if (values === "true") {
                                options.lexer_options.style.no_lead_zero = true;
                            } else if (values === "false") {
                                options.lexer_options.style.no_lead_zero = false;
                            }
                        } else if (name === "objectsort" || name === "object_sort") {
                            if (values === "true") {
                                options.lexer_options.script.object_sort = true;
                                options.lexer_options.style.object_sort = true;
                            } else if (values === "false") {
                                options.lexer_options.script.object_sort = false;
                                options.lexer_options.style.object_sort = false;
                            }
                        } else if (name === "preserve_comment" || name === "preservecomment") {
                            if (values === "true") {
                                options.preserve_comment = true;
                            } else {
                                options.preserve_comment = false;
                            }
                        } else if (name === "preserve_text" || name === "preservetext") {
                            if (values === "true") {
                                options.lexer_options.markup.preserve_text = true;
                            } else {
                                options.lexer_options.markup.preserve_text = false;
                            }
                        } else if (name === "tagsort") {
                            if (values === "true") {
                                options.lexer_options.markup.tag_sort = true;
                            } else if (values === "false") {
                                options.lexer_options.markup.tag_sort = false;
                            }
                        } else if (name === "tag_merge" || name === "tagmerge") {
                            if (values === "true") {
                                options.lexer_options.markup.tag_merge = true;
                            } else if (values === "false") {
                                options.lexer_options.markup.tag_merge = false;
                            }
                        } else if (name === "variable_list" || name === "variablelist") {
                            if (values === "list" || values === "each" || values === "none") {
                                options.lexer_options.script.variable_list = values;
                            }
                        }
                    } while (aa > 0);
                }
            }
            options.language                       = lang[0];
            options.lexer                          = lang[1];
            document.getElementById("language").getElementsByTagName("span")[0].innerHTML = lang[2];
            options.source = value;
            startTime = Math.round(performance.now() * 1000);
            output = sparser.parser(options);
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
            if (sparser.parseerror !== "") {
                document.getElementById("errors").getElementsByTagName("span")[0].innerHTML = sparser.parseerror.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
        },
        height = function web_inputHeight(scale:number, offset:number):string {
            const ff = (textsize === 13) // variability for Gecko
                ? (scale === 10) // pull the output down to align to input
                    ? -0.7
                    : (offset < -4) // pull input down to eliminate a white bar
                        ? -0.4
                        : -0.6
                : 0;
            let height:number = Math.max(document.documentElement.scrollHeight, document.getElementsByTagName("body")[0].scrollHeight);
            if (height > window.innerHeight) {
                height = window.innerHeight;
            }
            height = (height / scale) - (18.975 + offset + ff);
            return `${height}em`;
        },
        aceHeight = function web_aceHeight() {
            dataarea.style.height = height(10, 0);
            document.getElementById("input").style.height = height(12, -3.2);
            editor.setStyle(`height:${height(12, -3.2)}`);
            editor.resize();
        },
        textHeight = function web_textHeight() {
            dataarea.style.height = height(10, 0);
            input.style.height = height(textsize, -4.45);
        };
        if (typeof ace === "object") {
            aceControl.onclick = function web_aceControl() {
                if (aceControl.checked === true) {
                    location.replace(location.href.replace(/ace=false&?/, "").replace(/\?$/, ""));
                } else {
                    if (location.href.indexOf("?") > 0) {
                        location.replace(location.href.replace("?", "?ace=false&"));
                    } else {
                        location.replace(`${location.href}?ace=false`);
                    }
                }
            };
            if (location.href.indexOf("ace=false") > 0) {
                aceControl.checked = false;
                input.onkeyup = handler;
                textHeight();
            } else {
                const div:HTMLDivElement        = document.createElement("div"),
                    parent:HTMLElement     = <HTMLElement>input.parentNode.parentNode,
                    attributes:NamedNodeMap = input.attributes,
                    dollar:string     = "$",
                    len:number        = attributes.length;
                let a:number          = 0,
                    edit:any       = {},
                    textarea:HTMLTextAreaElement;
                do {
                    if (attributes[a].name !== "rows" && attributes[a].name !== "cols" && attributes[a].name !== "wrap") {
                        div.setAttribute(attributes[a].name, attributes[a].value);
                    }
                    a = a + 1;
                } while (a < len);
                parent.removeChild(input.parentNode);
                parent.appendChild(div);
                edit = ace.edit(div);
                textarea = div.getElementsByTagName("textarea")[0];
                textarea.onkeyup = handler;
                edit.setTheme("ace/theme/textmate");
                edit.focus();
                edit[`${dollar}blockScrolling`] = Infinity;
                editor = edit;
                aceHeight();
            }
        } else {
            aceControl.checked = false;
            input.onkeyup = handler;
            textHeight();
        }
        window.onresize = function web_fixHeight():void {
            if (typeof ace === "object" && location.href.indexOf("ace=false") < 0) {
                aceHeight();
            } else {
                textHeight();
            }
    
        };
    document.onkeypress = backspace;
    document.onkeydown = backspace;
    window.onerror = function web_onerror(msg:string, source:string):void {
        document.getElementById("errors").getElementsByTagName("span")[0].innerHTML = msg + " " + source;
    };
    if (parseCode !== undefined && parseCode !== null && parseCode !== "") {
        if (acetest === true && editor !== undefined) {
            lang   = (options.language === "auto" || options.language === "" || options.lexer === "auto" || options.lexer === "")
                ? sparser.libs.language.auto(parseCode, "javascript")
                : [options.language, options.lexer, ""];
            editor.setValue(parseCode);
            editor.getSession().setMode(`ace/mode/${lang[0]}`);
            editor.clearSelection();
        } else {
            input.value = parseCode;
        }
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
                el = document.getElementById("data");
            handler();
            body.style.backgroundColor = "#000";
            setTimeout(function web_scrolldelay() {
                el.scrollTop = el.scrollHeight;
                body.style.backgroundColor = "#fff";
            }, 200);
        }
    }
}());