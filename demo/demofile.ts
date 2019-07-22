/*global ace*/
/*jslint browser:true */
/*eslint-env browser*/

(function web() {
    "use strict";
    let editor:any,
        options:any = window.sparser.options,
        lang:[string, string, string] = ["", "", ""],
        language:string = options.language,
        lexer:string = options.lexer;
    const sparser:sparser = window.sparser,
        def:optionDef = sparser.libs.optionDef,
        acetest:boolean = (location.href.toLowerCase().indexOf("ace=false") < 0 && typeof ace === "object"),
        aceControl:HTMLInputElement = <HTMLInputElement>document.getElementById("aceControl"),
        input:HTMLTextAreaElement   = <HTMLTextAreaElement>document.getElementById("input"),
        dataarea:HTMLElement        = document.getElementById("data"),
        datatext:HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("datatext"),
        element_language:HTMLInputElement = <HTMLInputElement>document.getElementById("option-language"),
        element_lexer:HTMLInputElement = <HTMLInputElement>document.getElementById("option-lexer"),
        textsize = (navigator.userAgent.indexOf("like Gecko") < 0 && navigator.userAgent.indexOf("Gecko") > 0 && navigator.userAgent.indexOf("Firefox") > 0)
            ? 13
            : 13.33,
        // eliminate page navigation by clicking the backspace key
        backspace = function web_backspace(event):boolean {
            const e = event || window.event,
                f = e.srcElement || e.target;
            if (e.keyCode === 8 && f.nodeName !== "textarea" && ((f.nodeName === "input" && f.type !== "text") || f.nodeName !== "input")) {
                e.preventDefault();
                return false;
            }
        },
        saveOptions = function web_saveOptions():void {
            options.language = element_language.value;
            options.lexer = element_lexer.value;
            localStorage.setItem("demo", JSON.stringify(options));
            options.language = language;
            options.lexer = lexer;
        },
        // sparser event handler
        handler = function web_handler():void {
            let output:any,
                startTime:number = 0;
            const value:string = (acetest === true)
                    ? editor.getValue()
                    : input.value,
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
                },
                lexVal = element_lexer.value.replace(/\s+/g, ""),
                langVal = element_language.value.replace(/\s+/g, "");
            options.source = value;
            language = options.language;
            lexer = options.lexer;
            saveOptions();
            lang = sparser.libs.language.auto(value, "javascript");
            options.lexer = (lexVal === "" || lexVal === "auto")
                ? lang[1]
                : lexVal;
            if (options.lexer === "javascript") {
                options.lexer = "script";
            }
            if (langVal === "" || langVal === "auto") {
                if (editor !== undefined && (acetest === true || lang[0] !== "")) {
                    if (lang[0] === "vapor" && (/^\s*#/).test(options.source) === false) {
                        editor.getSession().setMode(`ace/mode/html`);
                    } else {
                        editor.getSession().setMode(`ace/mode/${lang[0]}`);
                    }
                }
                document.getElementById("language").getElementsByTagName("span")[0].innerHTML = lang[2];
                options.language = lang[0];
                options.lexer = lang[1];
            } else {
                document.getElementById("language").getElementsByTagName("span")[0].innerHTML = "";
                options.language = langVal;
            }
            startTime = Math.round(performance.now() * 1000);
            output = sparser.parser();
            (function web_handler_perfParse() {
                const endTime = Math.round(performance.now() * 1000),
                    time = (endTime - startTime) / 1000;
                document.getElementById("timeparse").getElementsByTagName("span")[0].innerHTML = time + " milliseconds.";
            }());
            if (sparser.parseerror !== "") {
                document.getElementById("errors").getElementsByTagName("span")[0].innerHTML = sparser.parseerror.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            } else {
                document.getElementById("errors").getElementsByTagName("span")[0].innerHTML = "";
            }
            if (options.format === "html") {
                builder();
            } else {
                if (typeof output === "object") {
                    datatext.value = JSON.stringify(output);
                } else {
                    datatext.value = output;
                }
            }
            (function web_handler_perfTotal():void {
                const endTime:number = Math.round(performance.now() * 1000),
                    time:number = (endTime - startTotal) / 1000;
                document.getElementById("timetotal").getElementsByTagName("span")[0].innerHTML = time + " milliseconds.";
            }());
        },
        // toggle display of options
        toggleOptions = function web_toggleOptions():void {
            const toggle:HTMLInputElement = <HTMLInputElement>document.getElementById("toggle-options"),
                opts:HTMLElement = document.getElementById("options");
            if (toggle.checked === true) {
                opts.style.display = "block";
            } else {
                opts.style.display = "none";
            }
            localStorage.setItem("toggle-options", toggle.checked.toString());
        },
        // maintain state by centeralizing interactions and storing options in localStorage
        optControls = function web_optControls(event:Event) {
            const node:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
                sel:HTMLSelectElement = (node.nodeName.toLowerCase() === "select")
                    ? <HTMLSelectElement>node
                    : null,
                input:HTMLInputElement = (node.nodeName.toLowerCase() === "input")
                    ? <HTMLInputElement>node
                    : null,
                id:string = node.getAttribute("id").replace(/option-(((false)|(true))-)?/, ""),
                lex:string[] = def[id].lexer,
                type:string = def[id].type,
                lexlen:number = lex.length,
                value:string = (sel === null)
                    ? input.value
                    : sel[sel.selectedIndex].innerHTML;
            let a:number = 0;
            if (type === "number" && isNaN(Number(value)) === true) {
                return;
            }
            if (type === "boolean" && value !== "true" && value !== "false") {
                return;
            }
            if (def[id].values !== undefined && def[id].values[value] === undefined) {
                if (id !== "format" || (id === "format" && value !== "html")) {
                    return;
                }
            }
            if (lex[0] === "all") {
                if (type === "number") {
                    options[id] = Number(value);
                } else if (type === "boolean") {
                    if (value === "true") {
                        options[id] = true;
                    } else {
                        options[id] = false;
                    }
                } else {
                    options[id] = value;
                }
            } else {
                do {
                    if (type === "number") {
                        options.lexer_options[lex[a]][id] = Number(value);
                    } else if (type === "boolean") {
                        if (value === "true") {
                            options.lexer_options[lex[a]][id] = true;
                        } else {
                            options.lexer_options[lex[a]][id] = false;
                        }
                    } else {
                        options.lexer_options[lex[a]][id] = value;
                    }
                    a = a + 1;
                } while (a < lexlen);
            }
            if (id === "format") {
                const data:HTMLElement = document.getElementById("data"),
                    dataparent:HTMLElement = <HTMLElement>data.parentNode,
                    text:HTMLElement = document.getElementById("datatext"),
                    textparent:HTMLElement = <HTMLElement>text.parentNode;
                if (value === "html") {
                    dataparent.style.display = "block";
                    textparent.style.display = "none";
                    height.html();
                } else {
                    dataparent.style.display = "none";
                    textparent.style.display = "block";
                    height.textout();
                }
            }
            saveOptions();
        },
        // math for vertically scalling the input and output areas
        height = {
            // actives height scaling for the ace editor
            ace: function web_height_ace():void {
                document.getElementById("input").style.height = height.math(12, -3.2);
                editor.setStyle(`height:${height.math(12, -3.2)}`);
                editor.resize();
            },
            // actives height scaling for the html table output
            html: function web_height_html():void {
                dataarea.style.height = height.math(10, 0);
            },
            math: function web_height_math(scale:number, offset:number):string {
                const ff:number = (textsize === 13) // variability for Gecko
                    ? (scale === 10) // pull the output down to align to input
                        ? -0.2
                        : (offset < -4) // pull input down to eliminate a white bar
                            ? 0
                            : -0.2
                    : 0;
                let heightn:number = Math.max(document.documentElement.scrollHeight, document.getElementsByTagName("body")[0].scrollHeight);
                if (heightn > window.innerHeight) {
                    heightn = window.innerHeight;
                }
                heightn = (heightn / scale) - (18.975 + offset + ff);
                return `${heightn}em`;
            },
            // actives height scaling for the textarea input
            textin: function web_height_textin():void {
                input.style.height = height.math(textsize, -4.45);
            },
            // activates height scaling for the textarea output
            textout: function web_height_textout():void {
                datatext.style.height = height.math(textsize, -4.45);
            }
        };
    window.onresize = function web_fixHeight():void {
        if (typeof ace === "object" && location.href.indexOf("ace=false") < 0) {
            height.ace();
        } else {
            height.textin();
        }
        if (options.format === "html") {
            height.html();
        } else {
            height.textout();
        }
    };
    document.onkeypress = backspace;
    document.onkeydown = backspace;
    window.onerror = function web_onerror(msg:string, source:string):void {
        document.getElementById("errors").getElementsByTagName("span")[0].innerHTML = msg + " " + source;
    };
    { // set option defaults and event handlers
        const select:HTMLCollectionOf<HTMLSelectElement> = document.getElementsByTagName("select"),
            input:HTMLCollectionOf<HTMLInputElement> = document.getElementsByTagName("input"),
            lexkeys:string[] = Object.keys(options.lexer_options),
            lexlen:number = lexkeys.length,
            inputValues = function web_inputValues(node:HTMLInputElement):void {
                const name:string = node.getAttribute("id").replace(/option-(((false)|(true))-)?/, ""),
                    saved:string|boolean = (function web_selectValues_saved():string|boolean {
                        let c:number = 0;
                        if (options[name] !== undefined) {
                            return options[name];
                        }
                        if (options.lexer !== "auto" && options.lexer !== "" && options.lexer_options[options.lexer] !== undefined && options.lexer_options[options.lexer][name] !== undefined) {
                            return options.lexer_options[options.lexer][name];
                        }
                        do {
                            if (options.lexer_options[lexkeys[c]][name] !== undefined) {
                                return options.lexer_options[lexkeys[c]][name];
                            }
                            c = c + 1;
                        } while (c < lexlen);
                        return "";
                    }());
                if (node.type === "text") {
                    node.onkeyup = optControls;
                    node.value = String(saved);
                } else {
                    node.onclick = optControls;
                    if (saved === false && node.getAttribute("id").indexOf("option-false-") === 0) {
                        node.checked = true;
                    } else if (saved === true && node.getAttribute("id").indexOf("option-true-") === 0) {
                        node.checked = true;
                    }
                    return;
                }
            },
            selectValues = function web_selectValues(node:HTMLSelectElement):void {
                let b:number = 0;
                const opts:HTMLCollectionOf<HTMLOptionElement> = node.getElementsByTagName("option"),
                    olen:number = opts.length,
                    name:string = node.getAttribute("id").replace("option-", ""),
                    saved:string = (function web_selectValues_saved():string {
                        let c:number = 0;
                        if (name === "format") {
                            return "html";
                        }
                        if (options[name] !== undefined) {
                            return options[name];
                        }
                        if (options.lexer !== "auto" && options.lexer !== "" && options.lexer_options[options.lexer] !== undefined && options.lexer_options[options.lexer][name] !== undefined) {
                            return options.lexer_options[options.lexer][name];
                        }
                        do {
                            if (options.lexer_options[lexkeys[c]][name] !== undefined) {
                                return options.lexer_options[lexkeys[c]][name];
                            }
                            c = c + 1;
                        } while (c < lexlen);
                        return "";
                    }());
                node.onchange = optControls;
                do {
                    if (opts[b].innerHTML === saved) {
                        node.selectedIndex = b;
                        break;
                    }
                    b = b + 1;
                } while (b < olen);
                if (name === "format") {
                    const data:HTMLElement = document.getElementById("data"),
                        dataparent:HTMLElement = <HTMLElement>data.parentNode,
                        text:HTMLElement = document.getElementById("datatext"),
                        textparent:HTMLElement = <HTMLElement>text.parentNode;
                    if (saved === "html") {
                        dataparent.style.display = "block";
                        textparent.style.display = "none";
                        height.html();
                    } else {
                        dataparent.style.display = "none";
                        textparent.style.display = "block";
                        height.textout();
                    }
                }
            };
        let a:number = 0,
            len:number = select.length,
            id:string = "";
        options.format = "html";
        if (localStorage.getItem("demo") !== null) {
            options = JSON.parse(localStorage.getItem("demo"));
            window.sparser.options = options;
        }
        do {
            selectValues(select[a]);
            a = a + 1;
        } while (a < len);
        a = 0;
        len = input.length;
        do {
            id = input[a].getAttribute("id");
            if (id.indexOf("ace") !== 0 && id.indexOf("toggle-") !== 0) {
                inputValues(input[a]);
            }
            a = a + 1;
        } while (a < len);
        if (localStorage.getItem("demo") === null) {
            saveOptions();
        }
    }
    { // evaluate query string of the URI for option assignment
        const params:string[] = (location.href.indexOf("?") > 0)
                ? location.href.split("?")[1].split("&")
                : [],
            assignValue = function assignValue(object:{}, name:string, value?:string):void {
                const type = def[name].type;
                if (type === "boolean") {
                    if (value === undefined || value === "true") {
                        object[name] = true;
                    } else if (value === "false") {
                        object[name] = false;
                    }
                } else if (type === "number" && isNaN(Number(value)) === false) {
                    object[name] = Number(value);
                } else if (type === "string" && value !== undefined) {
                    if (def[name].values === undefined) {
                        object[name] = value;
                    } else if (def[name].values !== undefined) {
                        object[name] = value;
                    }
                }
            };
        if (params.length > 1) {
            let aa:number = params.length,
                bb:number = 0,
                lex:string = "",
                pair:string[] = [];
            if (params[aa - 1].indexOf("#") > 0) {
                params[aa - 1] = params[aa - 1].split("#")[0];
            }
            do {
                aa = aa - 1;
                pair = params[aa].split("=");
                if (def[pair[0]] !== undefined) {
                    if (def[pair[0]].lexer[0] === "all") {
                        assignValue(options, pair[0], pair[1]);
                    } else {
                        bb = def[pair[0]].lexer.length;
                        do {
                            bb = bb - 1;
                            lex = def[pair[0]].lexer[bb];
                            assignValue(options.lexer_options[lex][pair[0]], pair[0], pair[1]);
                        } while (bb > 0);
                    }
                }
            } while (aa > 0);
        }
    }
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
            height.textin();
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
            lang   = (options.language === "auto" || options.language === "")
                ? sparser.libs.language.auto(options.source, "javascript")
                : [options.language, options.lexer, ""];
            editor.setValue(options.source);
            if (lang[0] === "vapor" && (/^\s*#/).test(options.source) === false) {
                editor.getSession().setMode(`ace/mode/html`);
            } else {
                editor.getSession().setMode(`ace/mode/${lang[0]}`);
            }
            editor.clearSelection();
            height.ace();
        }
    } else {
        aceControl.checked = false;
        input.onkeyup = handler;
        input.value = options.source;
        height.textin();
    }
    // web sockets
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
    // toggle option display
    {
        const toggle:HTMLInputElement = <HTMLInputElement>document.getElementById("toggle-options"),
            opts:HTMLElement = document.getElementById("options");
        toggle.onclick = toggleOptions;
        if (localStorage.getItem("toggle-options") === "true" || location.href.indexOf("#options") === location.href.length - 8) {
            toggle.checked = true;
            opts.style.display = "block";
        }
    }
}());