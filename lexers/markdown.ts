/*global global*/
(function markdown_init() {
    "use strict";
    const framework: parseFramework = global.parseFramework,
        markdown = function lexer_markdown(source : string): data {
            let a   : number  = 0,
                b   : number  = 0,
                bc  : number  = 0,
                para: boolean = false;
            const parse: parse    = framework.parse,
                data   : data     = parse.data,
                options: options  = parse.options,
                lines  : string[] = source.split(parse.crlf),
                hr = function lexer_markdown_hr():void {
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<hr/>",
                        types: "singleton"
                    }, "");
                },
                code     = function lexer_markdown_code(codetext:string, language:string):void {
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<p>",
                        types: "start"
                    }, "p");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<code>",
                        types: "start"
                    }, "code");
                    if (language !== "") {
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markdown",
                            lines: 0,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "class=\"" + language + "\"",
                            types: "attribute"
                        }, "");
                    }
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: codetext,
                        types: "content"
                    }, "");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "</code>",
                        types: "end"
                    }, "");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "</p>",
                        types: "end"
                    }, "");
                },
                codeblock = function lexer_markdown_codeblock():void {
                    const language:string = lines[a].replace(/\s*((`+)|(~+))\s*/, "").replace(/\s*/g, ""),
                        tilde:boolean = (/^(\s*`)/).test(lines[a]) === false,
                        codes:string[] = [];
                    a = a + 1;
                    if (tilde === true && (/^(\s*~{3})/).test(lines[a]) === true) {
                        return;
                    }
                    if (tilde === false && (/^(\s*`{3})/).test(lines[a]) === true) {
                        return;
                    }
                    do {
                        if (tilde === true && (/^(\s*~{3})/).test(lines[a]) === true) {
                            break;
                        }
                        if (tilde === false && (/^(\s*`{3})/).test(lines[a]) === true) {
                            break;
                        }
                        codes.push(lines[a]);
                        a = a + 1;
                    } while (a < b);
                    code(codes.join(parse.crlf), language);
                },
                blockquote = function lexer_markdown_blockquote():void {
                    let x:number = a,
                        item:string = "",
                        temp:number  = 0,
                        depth:number = 0,
                        block:RegExp,
                        block1:RegExp;
                    bc = bc + 1;
                    block = new RegExp("^((\\s*>\\s*){1," + bc + "})");
                    block1 = new RegExp("^((\\s*>\\s*){" + (bc + 1) + "})");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<blockquote>",
                        types: "start"
                    }, "blockquote");
                    lines[a] = lines[a].replace(block, "");
                    do {
                        if ((block1).test(lines[x]) === true) {
                            a = x;
                            if (item !== "") {
                                parse.push(data, {
                                    begin: parse.structure[parse.structure.length - 1][1],
                                    lexer: "markdown",
                                    lines: 0,
                                    presv: false,
                                    stack: parse.structure[parse.structure.length - 1][0],
                                    token: item.replace(parse.crlf, ""),
                                    types: "content"
                                }, "");
                            }
                            lexer_markdown_blockquote();
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                lexer: "markdown",
                                lines: 0,
                                presv: false,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: "</blockquote>",
                                types: "end"
                            }, "");
                            return;
                        }
                        item = item + parse.crlf + lines[x].replace(block, "");
                        x = x + 1;
                    } while (x < b && lines[x] !== "" && (/^(\s+)$/).test(lines[x]) === false);
                    a = x;
                    if (item !== "") {
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markdown",
                            lines: 0,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: item.replace(parse.crlf, ""),
                            types: "content"
                        }, "");
                    }
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "</blockquote>",
                        types: "end"
                    }, "");
                },
                text     = function lexer_markdown_text(item:string, tag:string, listrecurse:boolean):void {
                    let tagend:string = tag.replace("<", "</"),
                        struct:string = tag.replace("<", "").replace(/(\/?>)$/, "");
                    
                    // line containing strong, em, or inline code
                    if (item.indexOf("*") > -1 || item.indexOf("`") > -1) {
                        const esctest = function lexer_markdown_text_esctest():boolean {
                            let bb = aa;
                            if (str[bb] === "\\") {
                                do {
                                    bb = bb - 1;
                                } while (str[bb] === "\\");
                                if ((aa - bb) % 2 === 1) {
                                    return true;
                                }
                                return false;
                            }
                            return false;
                        };
                        let quote = "",
                            str:string[] = item.split(""),
                            content:string = "",
                            stack:string[] = [],
                            itemx:string[] = [],
                            aa:number = 0,
                            bb:number = str.length;
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markdown",
                            lines: 0,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: tag,
                            types: "start"
                        }, struct);
                        do {
                            if ((str[aa] === "*" || str[aa] === "~") && esctest() === false && stack[stack.length - 1] !== "`") {
                                if (str[aa] === "~") {
                                    quote = "~";
                                    do {
                                        aa = aa + 1;
                                    } while (str[aa + 1] === "~");
                                } else if (str[aa + 1] === "*") {
                                    quote = "**";
                                    aa = aa + 2;
                                } else {
                                    quote = "*";
                                    aa = aa + 1;
                                }
                                content = itemx.join("").replace(/\s+/g, " ").replace(/^\s/, "").replace(/\s$/, "");
                                if (content !== "") {
                                    parse.push(data, {
                                        begin: parse.structure[parse.structure.length - 1][1],
                                        lexer: "markdown",
                                        lines: 0,
                                        presv: false,
                                        stack: parse.structure[parse.structure.length - 1][0],
                                        token: content,
                                        types: "content"
                                    }, "");
                                }
                                itemx = [];
                                if (quote === stack[stack.length - 1]) {
                                    let midtag = "</strong>";
                                    if (quote === "~") {
                                        midtag = "</strike>";
                                    } else if (quote === "*") {
                                        midtag = "</em>";
                                    }
                                    stack.pop();
                                    parse.push(data, {
                                        begin: parse.structure[parse.structure.length - 1][1],
                                        lexer: "markdown",
                                        lines: 0,
                                        presv: false,
                                        stack: parse.structure[parse.structure.length - 1][0],
                                        token: midtag,
                                        types: "end"
                                    }, "");
                                } else {
                                    let midtag = "strong";
                                    if (quote === "~") {
                                        midtag = "strike";
                                    } else if (quote === "*") {
                                        midtag = "em";
                                    }
                                    stack.push(quote);
                                    parse.push(data, {
                                        begin: parse.structure[parse.structure.length - 1][1],
                                        lexer: "markdown",
                                        lines: 1,
                                        presv: false,
                                        stack: parse.structure[parse.structure.length - 1][0],
                                        token: "<" + midtag + ">",
                                        types: "start"
                                    }, midtag);
                                }
                            } else if (str[a] === "`" && esctest() === false) {
                                content = itemx.join("").replace(/\s+/g, " ").replace(/^\s/, "").replace(/\s$/, "");
                                if (content !== "") {
                                    parse.push(data, {
                                        begin: parse.structure[parse.structure.length - 1][1],
                                        lexer: "markdown",
                                        lines: 0,
                                        presv: false,
                                        stack: parse.structure[parse.structure.length - 1][0],
                                        token: content,
                                        types: "content"
                                    }, "");
                                }
                                itemx = [];
                                if (stack[stack.length - 1] === "`") {
                                    stack.pop();
                                    parse.push(data, {
                                        begin: parse.structure[parse.structure.length - 1][1],
                                        lexer: "markdown",
                                        lines: 0,
                                        presv: false,
                                        stack: parse.structure[parse.structure.length - 1][0],
                                        token: "</code>",
                                        types: "end"
                                    }, "");
                                } else {
                                    stack.push("`");
                                    parse.push(data, {
                                        begin: parse.structure[parse.structure.length - 1][1],
                                        lexer: "markdown",
                                        lines: 1,
                                        presv: false,
                                        stack: parse.structure[parse.structure.length - 1][0],
                                        token: "<code>",
                                        types: "start"
                                    }, "code");
                                }
                            }
                            itemx.push(str[aa]);
                            aa = aa + 1;
                        } while (aa < bb);
                        content = itemx.join("").replace(/\s+/g, " ").replace(/^\s/, "").replace(/\s$/, "");
                        if (content !== "") {
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                lexer: "markdown",
                                lines: 1,
                                presv: false,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: content,
                                types: "content"
                            }, "");
                        }
                        if (listrecurse === true) {
                            list();
                        }
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markdown",
                            lines: 0,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: tagend,
                            types: "end"
                        }, "");
                        return;
                    }
                    if (struct.indexOf(" ") > 0) {
                        struct = struct.slice(0, struct.indexOf(" "));
                    }
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: tag,
                        types: "start"
                    }, struct);
                    if (listrecurse === true) {
                        list();
                    } else {
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markdown",
                            lines: 0,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: item.replace(/^(\s+)/, "").replace(/(\s+)$/, ""),
                            types: "content"
                        }, "");
                    }
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: tagend,
                        types: "end"
                    }, "");
                },
                list     = function lexer_markdown_list():void {
                    let ind:number = ((/^(\s+)/).test(lines[a]) === true)
                            ? (/^(\s+)/).exec(lines[a])[0].length
                            : 0,
                        sym:string = lines[a].replace(/^(\s+)/, "").charAt(0),
                        space = function lexer_markdown_list_space():number {
                            let xind:number = ((/^(\s+)/).test(lines[a]) === true)
                                    ? (/^(\s+)/).exec(lines[a]).length
                                    : 0,
                                xsym:string = lines[a].replace(/^(\s+)/, "").charAt(0);
                            if (xind - ind > 1) {
                                return 1;
                            }
                            if (xind - ind < -1) {
                                return -1;
                            }
                            if (xsym !== sym) {
                                return 10;
                            }
                            return 0;
                        },
                        y:number = 0,
                        order:boolean = false;
                    if ((/^(\s*\d+\.\s)/).test(list[a]) === true) {
                        order = true;
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markdown",
                            lines: 0,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "<ol>",
                            types: "start"
                        }, "ol");
                    } else {
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markdown",
                            lines: 0,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "<ul>",
                            types: "start"
                        }, "ul");
                    }
                    do {
                        y = space();
                        if (y < 0 || y > 9) {
                            a = a - 1;
                            break;
                        }
                        if (y > 0) {
                            text(lines[a], "<li>", true);
                        } else {
                            text(lines[a].replace(/^(\s*(\*|-|(\d+\.))\s*)/, ""), "<li>", false);
                        }
                        a = a + 1;
                    } while (a < b);
                    if (order === true) {
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markdown",
                            lines: 0,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "</ol>",
                            types: "end"
                        }, "");
                    } else {
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markdown",
                            lines: 0,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "</ul>",
                            types: "end"
                        }, "");
                    }
                },
                table     = function lexer_markdown_table():void {
                    let c:number    = 0,
                        d:number    = 0,
                        line:string[] = [];
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<table>",
                        types: "start"
                    }, "table");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<thead>",
                        types: "start"
                    }, "thead");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<tr>",
                        types: "start"
                    }, "tr");
                    line = lines[a]
                        .replace(/^\|/, "")
                        .replace(/\|$/, "")
                        .split("|");
                    d = line.length;
                    do {
                        text(line[c], "<th>", false);
                        c = c + 1;
                    } while (c < d);
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "</tr>",
                        types: "end"
                    }, "");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "</thead>",
                        types: "end"
                    }, "");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<tbody>",
                        types: "start"
                    }, "thead");
                    a = a + 2;
                    do {
                        line = lines[a]
                            .replace(/^\|/, "")
                            .replace(/\|$/, "")
                            .split("|");
                        if (line.length < 2) {
                            break;
                        }
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markdown",
                            lines: 0,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "<tr>",
                            types: "start"
                        }, "tr");
                        c = 0;
                        d = line.length;
                        do {
                            text(line[c], "<td>", false);
                            c = c + 1;
                        } while (c < d);
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markdown",
                            lines: 0,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "</tr>",
                            types: "end"
                        }, "");
                        a = a + 1;
                    } while (a < b);
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "</tbody>",
                        types: "end"
                    }, "");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "</table>",
                        types: "end"
                    }, "");
                };
            b = lines.length;
            parse.push(data, {
                begin: parse.structure[parse.structure.length - 1][1],
                lexer: "markdown",
                lines: 0,
                presv: false,
                stack: parse.structure[parse.structure.length - 1][0],
                token: "<body>",
                types: "start"
            }, "body");
            do {
                if (lines[a - 1] === "" && (/\u0020{4}\S/).test(lines[a]) === true) {
                    code(lines[a], "");
                } else if ((/^((\*|-|_){3})$/).test(lines[a].replace(/\s+/g, "")) === true && (/^(\s{0,3})/).test(lines[a]) === true && (lines[a].indexOf("-") < 0 || lines[a - 1].length < 1)) {
                    hr();
                } else if ((/^(\s*>)/).test(lines[a]) === true) {
                    bc = 0;
                    blockquote();
                } else if ((/-{3,}\s*\|\s*-{3,}/).test(lines[a + 1]) === true) {
                    table();
                } else if ((/^(\s*((`{3,})|(~{3,}))+)/).test(lines[a]) === true) {
                    codeblock();
                } else if ((/^(\s*#{6,6}\s)/).test(lines[a]) === true) {
                    text(lines[a].replace(/^(\s*#+)\s+/, ""), "<h6>", false);
                } else if ((/^(\s*#{5,5}\s)/).test(lines[a]) === true) {
                    text(lines[a].replace(/^(\s*#+)\s+/, ""), "<h5>", false);
                } else if ((/^(\s*#{4,4}\s)/).test(lines[a]) === true) {
                    text(lines[a].replace(/^(\s*#+)\s+/, ""), "<h4>", false);
                } else if ((/^(\s*#{3,3}\s)/).test(lines[a]) === true) {
                    text(lines[a].replace(/^(\s*#+)\s+/, ""), "<h3>", false);
                } else if ((/^(\s*#{2,2}\s)/).test(lines[a]) === true) {
                    text(lines[a].replace(/^(\s*#+)\s+/, ""), "<h2>", false);
                } else if ((/^(\s*#\s)/).test(lines[a]) === true) {
                    text(lines[a].replace(/^(\s*#+)\s+/, ""), "<h1>", false);
                } else if ((/^(\s*((=+)|(-+))\s*)$/).test(lines[a + 1]) === true && (/^(\s{0,3}>)/).test(lines[a]) === false && (/^(\s*)$/).test(lines[a]) === false) {
                    if ((/^(\s*=+\s*)$/).test(lines[a + 1]) === true) {
                        text(lines[a], "<h1>", false);
                    } else {
                        text(lines[a], "<h2>", false);
                    }
                    a = a + 1;
                } else if ((/^(\s*(\*|-|(\d+\.))\s)/).test(lines[a]) === true) {
                    list();
                } else if (lines[a] !== "" && (/^(\s+)$/).test(lines[a]) === false) {
                    text(lines[a], "<p>", false);
                }
                a = a + 1;
            } while (a < b);
            parse.push(data, {
                begin: parse.structure[parse.structure.length - 1][1],
                lexer: "markdown",
                lines: 0,
                presv: false,
                stack: parse.structure[parse.structure.length - 1][0],
                token: "</body>",
                types: "end"
            }, "");
            return data;
        }
    framework.lexer.markdown = markdown;
}());