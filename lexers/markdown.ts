/*global global*/
(function markdown_init() {console.log("asdfasdfsdaf");
    "use strict";
    const framework: parseFramework = global.parseFramework,
        markdown = function lexer_markdown(source : string): data {
            let a   : number  = 0,
                b   : number  = 0,
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
                text     = function lexer_markdown_text(item, tag) {
                    let tagend:string = tag.replace("<", "</"),
                        struct:string = tag.replace("<", "").replace(/(\/?>)$/, "");
                    // code line starting with 4 spaces
                    if (lines[a - 1] === "" && (/\u0020{4}\S/).test(item) === true) {
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markdown",
                            lines: 0,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "<code>",
                            types: "start"
                        }, "code");
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markdown",
                            lines: 0,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: item.replace(/^(\s+)/, "").replace(/(\s+)$/, ""),
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
                        return;
                    }
                    // block quote
                    if (item.charAt(0) === ">") {
                        let x:number = a;
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markdown",
                            lines: 0,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "<blockquote>",
                            types: "start"
                        }, "blockquote");
                        do {
                            x = x + 1;
                        } while (x < b && lines[x] !== "");
                        a = x;
                        item = lines.slice(a, x).join("");
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markdown",
                            lines: 0,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: item,
                            types: "content"
                        }, "");
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
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: item.replace(/^(\s+)/, "").replace(/(\s+)$/, ""),
                        types: "content"
                    }, "");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "markdown",
                        lines: 0,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: tagend,
                        types: "end"
                    }, "");
                    /*if (listitem === true) {
                        item = item.replace(/^\s+/, "");
                    }
                    chars = item
                        .replace(/^(\s*>\s*)/, ind + "| ")
                        .replace(/`/g, "bix~")
                        .split("");
                    final = chars.length;
                    if (cell === true) {
                        start = 0;
                    } else {
                        if (block === true) {
                            chars.splice(0, 0, "  ");
                        }
                        if (listitem === true || block === true) {
                            x = listly.length;
                            do {
                                x   = x - 1;
                                y   = y + 4;
                                ind = ind + "  ";
                            } while (x > 0);
                        }
                        if (block === false) {
                            if (listitem === true) {
                                chars.splice(0, 0, ind.slice(2));
                            } else {
                                chars.splice(0, 0, ind);
                            }
                        }
                        if (listitem === true) {
                            start = 2;
                        } else {
                            start = y - 1;
                        }
                    }
                    y = ind.length + 4;
                    if (listitem === true) {
                        math = y + 8;
                    } else {
                        math = y;
                    }
                    for (x = start; x < final; x = x + 1) {
                        if (quote === "") {
                            if (chars[x] === "*" && chars[x + 1] === "*") {
                                quote = "**";
                                chars.splice(x, 2);
                                chars[x] = text.bold + chars[x];
                                final    = final - 2;
                            } else if (chars[x] === "_" && chars[x + 1] === "_") {
                                quote = "__";
                                chars.splice(x, 2);
                                chars[x] = text.bold + chars[x];
                                final    = final - 2;
                            } else if (chars[x] === "*" && ((x === start && chars[x + 1] !== " ") || x > start)) {
                                quote = "*";
                                chars.splice(x, 1);
                                chars[x] = text.yellow + chars[x];
                                final    = final - 1;
                            } else if ((x === start || (/\s/).test(chars[x - 1]) === true) && chars[x] === "_" && ((x === start && chars[x + 1] !== " ") || x > start)) {
                                quote = "_";
                                chars.splice(x, 1);
                                chars[x] = text.yellow + chars[x];
                                final    = final - 1;
                            } else if (chars[x] === "b" && chars[x + 1] === "i" && chars[x + 2] === "x" && chars[x + 3] === "~") {
                                quote = "`";
                                chars.splice(x, 4);
                                chars[x] = text.green + chars[x];
                                final    = final - 4;
                            } else if (chars[x - 2] === "," && chars[x - 1] === " " && chars[x] === "(") {
                                quote    = ")";
                                chars[x] = chars[x] + text.cyan;
                            }
                        } else if (chars[x] === "b" && chars[x + 1] === "i" && chars[x + 2] === "x" && chars[x + 3] === "~" && quote === "`") {
                            quote = "";
                            chars.splice(x, 4);
                            if (chars[x] === undefined) {
                                x = chars.length - 1;
                            }
                            chars[x] = chars[x] + text.nocolor;
                            final    = final - 4;
                            if (math > size && chars[x + 1] === " ") {
                                x = x + 1;
                            }
                        } else if (chars[x] === ")" && quote === ")") {
                            quote    = "";
                            chars[x] = text.nocolor + chars[x];
                            if (math > size && chars[x + 1] === " ") {
                                x = x + 1;
                            }
                        } else if (chars[x] === "*" && chars[x + 1] === "*" && quote === "**") {
                            quote = "";
                            chars.splice(x, 2);
                            chars[x - 1] = chars[x - 1] + text.normal;
                            final        = final - 2;
                        } else if (chars[x] === "*" && quote === "*") {
                            quote = "";
                            chars.splice(x, 1);
                            chars[x - 1] = chars[x - 1] + text.nocolor;
                            final        = final - 1;
                        } else if (chars[x] === "_" && chars[x + 1] === "_" && quote === "__") {
                            quote = "";
                            chars.splice(x, 2);
                            chars[x - 1] = chars[x - 1] + text.normal;
                            final        = final - 2;
                        } else if (chars[x] === "_" && (x + 1 === final || (/\s/).test(chars[x + 1]) === true) && quote === "_") {
                            quote = "";
                            chars.splice(x, 1);
                            chars[x - 1] = chars[x - 1] + text.nocolor;
                            final        = final - 1;
                        }
                        if (chars[x + 1] === undefined) {
                            break;
                        }
                        math = math + 1;
                    }
                    if (quote === "**") {
                        chars.pop();
                        chars[x - 1] = chars[x - 1] + text.normal;
                    } else if (quote === "*") {
                        chars.pop();
                        chars[x - 1] = chars[x - 1] + text.none;
                    } else if (quote === ")") {
                        chars[x - 1] = chars[x - 1] + text.nocolor;
                    } else if (quote === "`") {
                        chars.pop();
                        chars[x - 4] = chars[x - 4] + text.nocolor;
                        chars[x - 3] = "";
                        chars[x - 2] = "";
                        chars[x - 1] = "";
                        chars[x]     = "";
                    }
                    item = chars.join("");
                    if (block === true) {
                        ind = ind.slice(2);
                    } else if (listitem === true) {
                        ind = ind.slice(listly.length * 2);
                    }
                    return item;*/
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
                        text(line[c], "<th>");
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
                            text(line[c], "<td>");
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
                    /*if (line.indexOf("|") > -1) {
                        do {
                            rows.push(line.split("|").slice(0, lens));
                            d = 0;
                            do {
                                rows[rows.length - 1][d] = text(
                                    rows[rows.length - 1][d].replace(/\s+/g, " ").replace(
                                        /^\s/,
                                        ""
                                    ).replace(/\s$/, ""),
                                    false,
                                    true
                                );
                                lend                     = rows[rows.length - 1][d]
                                    .replace(/\u001b\[\d+m/g, "")
                                    .length;
                                if (lend > cols[d]) {
                                    cols[d] = lend;
                                }
                                if (rows[rows.length - 1][d] === "\u2713") {
                                    rows[rows.length - 1][d] = text.bold + text.green + "\u2713" + text.none;
                                } else if (rows[rows.length - 1][d] === "X") {
                                    rows[rows.length - 1][d] = text.bold + text.red + "X" + text.none;
                                } else if (rows[rows.length - 1][d] === "?") {
                                    rows[rows.length - 1][d] = text.bold + text.yellow + "?" + text.none;
                                }
                                d = d + 1;
                            } while (d < lens);
                            c = c + 1;
                            if (c === len) {
                                break;
                            }
                            line = lines[c]
                                .replace(/^\|/, "")
                                .replace(/\|$/, "");
                        } while (line.indexOf("|") > -1);
                    }
                    c    = 0;
                    lend = rows.length;
                    do {
                        d = 0;
                        do {
                            e = rows[c][d]
                                .replace(/\u001b\[\d+m/g, "")
                                .length;
                            if (d === lens - 1 && rows[c][d].length < cols[d]) {
                                do {
                                    e          = e + 1;
                                    rows[c][d] = rows[c][d] + " ";
                                } while (e < cols[d]);
                            } else {
                                do {
                                    e          = e + 1;
                                    rows[c][d] = rows[c][d] + " ";
                                } while (e < cols[d] + 1);
                            }
                            if (c === 0) {
                                if (d > 0) {
                                    rows[c][d] = text.underline + " " + rows[c][d] + text.normal;
                                } else {
                                    rows[c][d] = ind + text.underline + rows[c][d] + text.normal;
                                }
                            } else {
                                if (d > 0) {
                                    rows[c][d] = " " + rows[c][d];
                                } else {
                                    rows[c][d] = ind + rows[c][d];
                                }
                            }
                            d = d + 1;
                        } while (d < lens);
                        output.push(rows[c].join(""));
                        c = c + 1;
                        b = b + 1;
                    } while (c < lend);
                    b    = b + 1;
                    para = false;*/
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
                if ((/^(\s*)$/).test(lines[a]) === true) {
                    lines[a] = "";
                    para     = false;
                } else if ((/^((\*|-|_){3})$/).test(lines[a].replace(/\s+/g, "")) === true && (/^(\s{0,3})/).test(lines[a]) === true && (lines[a].indexOf("-") < 0 || lines[a - 1].length < 1)) {
                    hr();
                } else if ((/-{3,}\s*\|\s*-{3,}/).test(lines[a + 1]) === true) {
                    table();
                } else if ((/^(\s*((`{3,})|(~{3,}))+)/).test(lines[a]) === true) {
                    codeblock();
                } else if ((/^(\s{0,3}#{6,6}\s)/).test(lines[a]) === true) {
                    text(lines[a].replace(/^(\s*#+)\s+/, ""), "<h6>");
                } else if ((/^(\s{0,3}#{5,5}\s)/).test(lines[a]) === true) {
                    text(lines[a].replace(/^(\s*#+)\s+/, ""), "<h5>");
                } else if ((/^(\s{0,3}#{4,4}\s)/).test(lines[a]) === true) {
                    text(lines[a].replace(/^(\s*#+)\s+/, ""), "<h4>");
                } else if ((/^(\s{0,3}#{3,3}\s)/).test(lines[a]) === true) {
                    text(lines[a].replace(/^(\s*#+)\s+/, ""), "<h3>");
                } else if ((/^(\s{0,3}#{2,2}\s)/).test(lines[a]) === true) {
                    text(lines[a].replace(/^(\s*#+)\s+/, ""), "<h2>");
                } else if ((/^(\s{0,3}#\s)/).test(lines[a]) === true) {
                    text(lines[a].replace(/^(\s*#+)\s+/, ""), "<h1>");
                } else if ((/^(\s{0,3}((=+)|(-+))\s*)$/).test(lines[a + 1]) === true && (/^(\s{0,3}>)/).test(lines[a]) === false && (/^(\s*)$/).test(lines[a]) === false) {
                    if ((/^(\s{0,3}=+\s*)$/).test(lines[a + 1]) === true) {
                        text(lines[a], "<h1>");
                    } else {
                        text(lines[a], "<h2>");
                    }
                    a = a + 1;
                }/* else if ((/^(\s*(\*|-)\s)/).test(lines[a]) === true) {
                    listr = (/^(\s*)/).exec(lines[a])[0];
                    if (listly.length === 0 || listly[listly.length - 1] < listr.length) {
                        if ((/\s/).test(listr.charAt(0)) === true) {
                            listly.push(listr.length);
                        } else {
                            listly = [listr.length];
                        }
                    } else if (listly.length > 1 && listr.length < listly[listly.length - 1]) {
                        do {
                            listly.pop();
                        } while (listly.length > 1 && listr.length < listly[listly.length - 1]);
                    }
                    if (listly.length % 2 > 0) {
                        bullet = "*";
                    } else {
                        bullet = "-";
                    }
                    lines[a] = text(lines[a], true, false).replace(
                        /\*|-/,
                        text.bold + text.red + bullet + text.none
                    );
                    para     = true;
                }*/ else if (lines[a].indexOf("    ") === 0) {
                    code(lines[a].replace(/^(\u0020{4})/, "").replace(/(\s+)$/, ""), "");
                }/* else if ((/^\s*>/).test(lines[a]) === true) {
                    listly   = [];
                    lines[a] = text(lines[a], false, false);
                    if (a < b - 1 && (/^(\s*)$/).test(lines[a + 1]) === false) {
                        lines[a + 1] = ">" + lines[a + 1];
                    }
                    para = true;
                } else if (para === true) {
                    listly = [];
                    b      = b - 1;
                    a      = a - 1;
                    output.pop();
                    lines[a] = lines[a] + lines[a + 1];
                    lines.splice(a + 1, 1);
                    lines[a] = text(
                        lines[a].replace(/\s+/g, " ").replace(/^\s/, ""),
                        false,
                        false
                    );
                    para     = true;
                } else {
                    para     = true;
                    listly   = [];
                    lines[a] = text(lines[a], false, false);
                }*/
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
    /*function biddle_markdown() {
        var file = data.abspath + "readme.md",
            size = data.input[2];
        if (data.command === "markdown") {
            file = data.input[2];
            size = data.input[3];
        }
        node
            .fs
            .readFile(file, "utf8", function biddle_markdown_readfile(err, readme) {
                var lines     = [],
                    listly    = [],
                    output    = [],
                    para      = false,
                    ind       = "",
                    listr     = "",
                    b         = 0,
                    len       = 0,
                    bullet    = "",
                    codeblock = function biddle_markdown_readfile_blockcode() {
                        var blocks       = "",
                            spaces       = "nospace",
                            removespaces = function biddle_markdown_readfile_removespaces(x) {
                                if (spaces === "nospace") {
                                    spaces = x;
                                }
                                return x.slice(spaces.length);
                            },
                            blockstart   = function biddle_markdown_readfile_blockstart() {
                                var bs    = lines[b].replace(/\s+/g, ""),
                                    bsout = function biddle_markdown_readfile_blockstart_bsout(x) {
                                        return x;
                                    };
                                return bs.replace(/((~+)|(`+))/, bsout);
                            };
                        lines[b].replace(/^(\s+)/, removespaces);
                        if (spaces === "nospace") {
                            spaces = "";
                        }
                        blocks = blockstart();
                        output.push("");
                        b = b + 1;
                        if (b < len) {
                            if (lines[b].replace(/^(\s+)/, "").indexOf(blocks) === 0 && (/^(\s*((`{3,})|(~{3,}))+)/).test(lines[b]) === true) {
                                output.push("");
                            } else {
                                lines[b] = text.green + lines[b].replace(/^(\s+)/, removespaces) + text.nocolor;
                                do {
                                    if (lines[b].indexOf(blocks) > -1 && (/(((`{3,})|(~{3,}))+\s*)$/).test(lines[b]) === true) {
                                        lines[b] = "";
                                        output.push("");
                                        break;
                                    }
                                    output.push(
                                        ind + text.green + lines[b].replace(/^(\s+)/, removespaces) + text.nocolor
                                    );
                                    b = b + 1;
                                } while (b < len);
                                spaces = "nospace";
                            }
                        }
                    },
                    hr        = function biddle_markdown_readfile_hr(block) {
                        var item = lines[b]
                                .replace(/\s+/, "")
                                .charAt(0),
                            out  = "",
                            maxx = size - block.length,
                            inc  = 0;
                        do {
                            inc = inc + 1;
                            out = out + item;
                        } while (inc < maxx);
                        lines[b] = block + out;
                        para     = false;
                    },
                    parse     = function biddle_markdown_readfile_parse(item, listitem, cell) {
                        var block = false,
                            chars = [],
                            final = 0,
                            s     = (/\s/),
                            x     = 0,
                            y     = ind.length,
                            start = 0,
                            index = 0,
                            math  = 0,
                            quote = "",
                            wrap  = function biddle_markdown_readfile_parse_wrap(tick) {
                                var z      = x,
                                    format = function biddle_markdown_readfile_parse_wrap_format(eol) {
                                        if (block === true) {
                                            chars[eol] = "\n" + ind + "| ";
                                        } else {
                                            chars[eol] = "\n" + ind;
                                        }
                                        index = y + eol;
                                        if (chars[eol - 1] === " ") {
                                            chars[eol - 1] = "";
                                        } else if (chars[eol + 1] === " ") {
                                            chars.splice(eol + 1, 1);
                                            final = final - 1;
                                        }
                                    };
                                math = y + 2;
                                if (cell === true) {
                                    return;
                                }
                                if (tick === true) {
                                    do {
                                        z = z - 1;
                                    } while (chars[z + 1].indexOf(text.green) < 0 && z > index);
                                    if (z > index) {
                                        format(z);
                                    }
                                } else if (s.test(chars[x]) === true) {
                                    format(x);
                                } else {
                                    do {
                                        z = z - 1;
                                    } while (s.test(chars[z]) === false && z > index);
                                    if (z > index) {
                                        format(z);
                                    }
                                }
                            };
                        if (lines[b - 1] === "" && (/\u0020{4}\S/).test(item) === true && listitem === false) {
                            item = text.green + item + text.nocolor;
                            return item;
                        }
                        if (item.charAt(0) === ">") {
                            block = true;
                        }
                        if (listitem === true) {
                            item = item.replace(/^\s+/, "");
                        }
                        if ((/^(\s*>-+\s*)$/).test(item) === true) {
                            lines[b] = item.replace(/^(\s*>\s*)/, "");
                            hr(ind + "  | ");
                            return lines[b];
                        }
                        chars = item
                            .replace(/^(\s*>\s*)/, ind + "| ")
                            .replace(/`/g, "bix~")
                            .split("");
                        final = chars.length;
                        if (cell === true) {
                            start = 0;
                        } else {
                            if (block === true) {
                                chars.splice(0, 0, "  ");
                            }
                            if (listitem === true || block === true) {
                                x = listly.length;
                                do {
                                    x   = x - 1;
                                    y   = y + 4;
                                    ind = ind + "  ";
                                } while (x > 0);
                            }
                            if (block === false) {
                                if (listitem === true) {
                                    chars.splice(0, 0, ind.slice(2));
                                } else {
                                    chars.splice(0, 0, ind);
                                }
                            }
                            if (listitem === true) {
                                start = 2;
                            } else {
                                start = y - 1;
                            }
                        }
                        y = ind.length + 4;
                        if (listitem === true) {
                            math = y + 8;
                        } else {
                            math = y;
                        }
                        for (x = start; x < final; x = x + 1) {
                            if (quote === "") {
                                if (chars[x] === "*" && chars[x + 1] === "*") {
                                    quote = "**";
                                    chars.splice(x, 2);
                                    chars[x] = text.bold + chars[x];
                                    final    = final - 2;
                                } else if (chars[x] === "_" && chars[x + 1] === "_") {
                                    quote = "__";
                                    chars.splice(x, 2);
                                    chars[x] = text.bold + chars[x];
                                    final    = final - 2;
                                } else if (chars[x] === "*" && ((x === start && chars[x + 1] !== " ") || x > start)) {
                                    quote = "*";
                                    chars.splice(x, 1);
                                    chars[x] = text.yellow + chars[x];
                                    final    = final - 1;
                                } else if ((x === start || (/\s/).test(chars[x - 1]) === true) && chars[x] === "_" && ((x === start && chars[x + 1] !== " ") || x > start)) {
                                    quote = "_";
                                    chars.splice(x, 1);
                                    chars[x] = text.yellow + chars[x];
                                    final    = final - 1;
                                } else if (chars[x] === "b" && chars[x + 1] === "i" && chars[x + 2] === "x" && chars[x + 3] === "~") {
                                    quote = "`";
                                    chars.splice(x, 4);
                                    chars[x] = text.green + chars[x];
                                    final    = final - 4;
                                } else if (chars[x - 2] === "," && chars[x - 1] === " " && chars[x] === "(") {
                                    quote    = ")";
                                    chars[x] = chars[x] + text.cyan;
                                }
                            } else if (chars[x] === "b" && chars[x + 1] === "i" && chars[x + 2] === "x" && chars[x + 3] === "~" && quote === "`") {
                                quote = "";
                                chars.splice(x, 4);
                                if (chars[x] === undefined) {
                                    x = chars.length - 1;
                                }
                                chars[x] = chars[x] + text.nocolor;
                                final    = final - 4;
                                if (math > size && chars[x + 1] === " ") {
                                    x = x + 1;
                                    wrap(false);
                                }
                            } else if (chars[x] === ")" && quote === ")") {
                                quote    = "";
                                chars[x] = text.nocolor + chars[x];
                                if (math > size && chars[x + 1] === " ") {
                                    x = x + 1;
                                    wrap(false);
                                }
                            } else if (chars[x] === "*" && chars[x + 1] === "*" && quote === "**") {
                                quote = "";
                                chars.splice(x, 2);
                                chars[x - 1] = chars[x - 1] + text.normal;
                                final        = final - 2;
                            } else if (chars[x] === "*" && quote === "*") {
                                quote = "";
                                chars.splice(x, 1);
                                chars[x - 1] = chars[x - 1] + text.nocolor;
                                final        = final - 1;
                            } else if (chars[x] === "_" && chars[x + 1] === "_" && quote === "__") {
                                quote = "";
                                chars.splice(x, 2);
                                chars[x - 1] = chars[x - 1] + text.normal;
                                final        = final - 2;
                            } else if (chars[x] === "_" && (x + 1 === final || (/\s/).test(chars[x + 1]) === true) && quote === "_") {
                                quote = "";
                                chars.splice(x, 1);
                                chars[x - 1] = chars[x - 1] + text.nocolor;
                                final        = final - 1;
                            }
                            if (math > size) {
                                if (quote === "`") {
                                    wrap(true);
                                } else {
                                    wrap(false);
                                }
                            }
                            if (chars[x + 1] === undefined) {
                                break;
                            }
                            math = math + 1;
                        }
                        if (quote === "**") {
                            chars.pop();
                            chars[x - 1] = chars[x - 1] + text.normal;
                        } else if (quote === "*") {
                            chars.pop();
                            chars[x - 1] = chars[x - 1] + text.none;
                        } else if (quote === ")") {
                            chars[x - 1] = chars[x - 1] + text.nocolor;
                        } else if (quote === "`") {
                            chars.pop();
                            chars[x - 4] = chars[x - 4] + text.nocolor;
                            chars[x - 3] = "";
                            chars[x - 2] = "";
                            chars[x - 1] = "";
                            chars[x]     = "";
                        }
                        item = chars.join("");
                        if (block === true) {
                            ind = ind.slice(2);
                        } else if (listitem === true) {
                            ind = ind.slice(listly.length * 2);
                        }
                        return item;
                    },
                    table     = function biddle_markdown_readfile_table() {
                        var rows = [
                                lines[b]
                                    .replace(/^\|/, "")
                                    .replace(/\|$/, "")
                                    .split("|")
                            ],
                            lens = rows[0].length,
                            cols = [],
                            c    = 0,
                            d    = 0,
                            e    = 0,
                            lend = 0,
                            line = "";
                        c    = b + 2;
                        line = lines[c]
                            .replace(/^\|/, "")
                            .replace(/\|$/, "");
                        d    = 0;
                        do {
                            rows[0][d] = parse(rows[0][d].replace(/\s+/g, " ").replace(/^\s/, "").replace(
                                /\s$/,
                                ""
                            ), false, true);
                            lend       = rows[0][d]
                                .replace(/\u001b\[\d+m/g, "")
                                .length;
                            cols.push(lend);
                            d = d + 1;
                        } while (d < lens);
                        if (line.indexOf("|") > -1) {
                            do {
                                rows.push(line.split("|").slice(0, lens));
                                d = 0;
                                do {
                                    rows[rows.length - 1][d] = parse(
                                        rows[rows.length - 1][d].replace(/\s+/g, " ").replace(
                                            /^\s/,
                                            ""
                                        ).replace(/\s$/, ""),
                                        false,
                                        true
                                    );
                                    lend                     = rows[rows.length - 1][d]
                                        .replace(/\u001b\[\d+m/g, "")
                                        .length;
                                    if (lend > cols[d]) {
                                        cols[d] = lend;
                                    }
                                    if (rows[rows.length - 1][d] === "\u2713") {
                                        rows[rows.length - 1][d] = text.bold + text.green + "\u2713" + text.none;
                                    } else if (rows[rows.length - 1][d] === "X") {
                                        rows[rows.length - 1][d] = text.bold + text.red + "X" + text.none;
                                    } else if (rows[rows.length - 1][d] === "?") {
                                        rows[rows.length - 1][d] = text.bold + text.yellow + "?" + text.none;
                                    }
                                    d = d + 1;
                                } while (d < lens);
                                c = c + 1;
                                if (c === len) {
                                    break;
                                }
                                line = lines[c]
                                    .replace(/^\|/, "")
                                    .replace(/\|$/, "");
                            } while (line.indexOf("|") > -1);
                        }
                        c    = 0;
                        lend = rows.length;
                        do {
                            d = 0;
                            do {
                                e = rows[c][d]
                                    .replace(/\u001b\[\d+m/g, "")
                                    .length;
                                if (d === lens - 1 && rows[c][d].length < cols[d]) {
                                    do {
                                        e          = e + 1;
                                        rows[c][d] = rows[c][d] + " ";
                                    } while (e < cols[d]);
                                } else {
                                    do {
                                        e          = e + 1;
                                        rows[c][d] = rows[c][d] + " ";
                                    } while (e < cols[d] + 1);
                                }
                                if (c === 0) {
                                    if (d > 0) {
                                        rows[c][d] = text.underline + " " + rows[c][d] + text.normal;
                                    } else {
                                        rows[c][d] = ind + text.underline + rows[c][d] + text.normal;
                                    }
                                } else {
                                    if (d > 0) {
                                        rows[c][d] = " " + rows[c][d];
                                    } else {
                                        rows[c][d] = ind + rows[c][d];
                                    }
                                }
                                d = d + 1;
                            } while (d < lens);
                            output.push(rows[c].join(""));
                            c = c + 1;
                            b = b + 1;
                        } while (c < lend);
                        b    = b + 1;
                        para = false;
                    },
                    headings  = function biddle_markdown_readfile_headings(color, level) {
                        if (level === 1) {
                            ind = "";
                        } else if (level === 2) {
                            ind = "  ";
                        } else if (level === 3) {
                            ind = "    ";
                        } else if (level === 4) {
                            ind = "      ";
                        } else if (level === 5) {
                            ind = "        ";
                        } else if (level === 6) {
                            ind = "          ";
                        }
                        listly   = [];
                        lines[b] = lines[b].replace(/^(\s*#+\s+)/, "");
                        if ((/(\\#)/).test(lines[b]) === true) {
                            lines[b] = lines[b].replace(/\\#/g, "#");
                        } else {
                            lines[b] = lines[b].replace(/(\s*#*\s*)$/, "");
                        }
                        lines[b] = ind.slice(2) + text.underline + text.bold + text[color] + lines[b] +
                                text.none;
                        para     = false;
                    };
                if (err !== null && err !== undefined) {
                    return apps.errout({error: err, name: "biddle_markdown_readfile"});
                }
                readme = (function biddle_markdown_readfile_removeImages() {
                    var readout = [],
                        j       = readme.split(""),
                        i       = 0,
                        ilen    = j.length,
                        brace   = "",
                        code    = (j[0] === " " && j[1] === " " && j[2] === " " && j[3] === " ");
                    for (i = 0; i < ilen; i = i + 1) {
                        if (brace === "") {
                            if (j[i] === "\r") {
                                if (j[i + 1] === "\n") {
                                    j[i] = "";
                                } else {
                                    j[i] = "\n";
                                }
                                if (j[i + 1] === "`" && j[i + 2] === "`" && j[i + 3] === "`") {
                                    code = true;
                                    brace = "```";
                                } else if (j[i + 1] === " " && j[i + 2] === "`" && j[i + 3] === "`" && j[i + 4] === "`") {
                                    code = true;
                                    brace = "```";
                                } else if (j[i + 1] === " " && j[i + 2] === " " && j[i + 3] === "`" && j[i + 4] === "`" && j[i + 5] === "`") {
                                    code = true;
                                    brace = "```";
                                } else if (j[i + 1] === " " && j[i + 2] === " " && j[i + 3] === " " && j[i + 4] === "`" && j[i + 5] === "`" && j[i + 6] === "`") {
                                    code = true;
                                    brace = "```";
                                } else if (j[i + 1] === " " && j[i + 2] === " " && j[i + 3] === " " && j[i + 4] === " ") {
                                    code = true;
                                } else {
                                    code = false;
                                }
                            } else if (j[i] === "\n") {
                                if (j[i + 1] === "`" && j[i + 2] === "`" && j[i + 3] === "`") {
                                    code = true;
                                    brace = "```";
                                } else if (j[i + 1] === " " && j[i + 2] === "`" && j[i + 3] === "`" && j[i + 4] === "`") {
                                    code = true;
                                    brace = "```";
                                } else if (j[i + 1] === " " && j[i + 2] === " " && j[i + 3] === "`" && j[i + 4] === "`" && j[i + 5] === "`") {
                                    code = true;
                                    brace = "```";
                                } else if (j[i + 1] === " " && j[i + 2] === " " && j[i + 3] === " " && j[i + 4] === "`" && j[i + 5] === "`" && j[i + 6] === "`") {
                                    code = true;
                                    brace = "```";
                                } else if (j[i + 1] === " " && j[i + 2] === " " && j[i + 3] === " " && j[i + 4] === " ") {
                                    code = true;
                                } else {
                                    code = false;
                                }
                            } else if (j[i] === "`") {
                                brace = "`";
                                code  = true;
                            } else if (j[i] === "!" && j[i + 1] === "[") {
                                brace    = "]";
                                j[i]     = "";
                                j[i + 1] = "";
                            } else if (j[i] === "]" && j[i + 1] === "(") {
                                j[i] = ", ";
                            } else if (j[i] === "[" && code === false) {
                                j[i] = "";
                            } else if (j[i] === ")" && j[i + 1] === " " && (/\s/).test(j[i + 2]) === false) {
                                j[i] = "),";
                            }
                        } else if (brace === j[i]) {
                            if (brace === "`") {
                                code = false;
                            } else {
                                j[i] = "";
                            }
                            if (brace === "]" && j[i + 1] === "(") {
                                brace = ")";
                            } else {
                                brace = "";
                            }
                        } else if (brace === "```" && j[i] === "`" && j[i + 1] === "`" && j[i + 2] === "`" && (/((\r|\n)(\u0020|\t)*)$/).test(j.slice(i - 4, i)) === true) {
                            code  = false;
                            brace = "";
                        }
                        if (brace !== ")") {
                            readout.push(j[i]);
                        }
                    }
                    return readout.join("");
                }());
                lines  = readme.split("\n");
                len    = lines.length;
                output.push("");
                for (b = 0; b < len; b = b + 1) {
                    if ((/^(\s*)$/).test(lines[b]) === true) {
                        lines[b] = "";
                        para     = false;
                    } else if ((/^((\*|-|_){3})$/).test(lines[b].replace(/\s+/g, "")) === true && (/^(\s{0,3})/).test(lines[b]) === true && (lines[b].indexOf("-") < 0 || lines[b - 1].length < 1)) {
                        hr("");
                    } else if ((/-{3,}\s*\|\s*-{3,}/).test(lines[b + 1]) === true) {
                        table();
                    } else if ((/^(\s*((`{3,})|(~{3,}))+)/).test(lines[b]) === true) {
                        codeblock();
                    } else if ((/^(\s{0,3}#{6,6}\s)/).test(lines[b]) === true) {
                        headings("purple", 6);
                    } else if ((/^(\s{0,3}#{5,5}\s)/).test(lines[b]) === true) {
                        headings("blue", 5);
                    } else if ((/^(\s{0,3}#{4,4}\s)/).test(lines[b]) === true) {
                        headings("yellow", 4);
                    } else if ((/^(\s{0,3}#{3,3}\s)/).test(lines[b]) === true) {
                        headings("green", 3);
                    } else if ((/^(\s{0,3}#{2,2}\s)/).test(lines[b]) === true) {
                        headings("cyan", 2);
                    } else if ((/^(\s{0,3}#\s)/).test(lines[b]) === true) {
                        headings("red", 1);
                    } else if ((/^(\s{0,3}=+\s*)$/).test(lines[b + 1]) === true && (/^(\s{0,3}>)/).test(lines[b]) === false && (/^(\s*)$/).test(lines[b]) === false) {
                        headings("red", 1);
                        lines.splice(b + 1, 1);
                        len = len - 1;
                    } else if ((/^(\s{0,3}-+\s*)$/).test(lines[b + 1]) === true && (/^(\s{0,3}>)/).test(lines[b]) === false && (/^(\s*)$/).test(lines[b]) === false) {
                        headings("cyan", 2);
                        lines.splice(b + 1, 1);
                        len = len - 1;
                    } else if ((/^(\s*(\*|-)\s)/).test(lines[b]) === true) {
                        listr = (/^(\s*)/).exec(lines[b])[0];
                        if (listly.length === 0 || listly[listly.length - 1] < listr.length) {
                            if ((/\s/).test(listr.charAt(0)) === true) {
                                listly.push(listr.length);
                            } else {
                                listly = [listr.length];
                            }
                        } else if (listly.length > 1 && listr.length < listly[listly.length - 1]) {
                            do {
                                listly.pop();
                            } while (listly.length > 1 && listr.length < listly[listly.length - 1]);
                        }
                        if (listly.length % 2 > 0) {
                            bullet = "*";
                        } else {
                            bullet = "-";
                        }
                        lines[b] = parse(lines[b], true, false).replace(
                            /\*|-/,
                            text.bold + text.red + bullet + text.none
                        );
                        para     = true;
                    } else if (lines[b].indexOf("    ") === 0) {
                        lines[b] = text.green + lines[b] + text.nocolor;
                    } else if ((/^\s*>/).test(lines[b]) === true) {
                        listly   = [];
                        lines[b] = parse(lines[b], false, false);
                        if (b < len - 1 && (/^(\s*)$/).test(lines[b + 1]) === false) {
                            lines[b + 1] = ">" + lines[b + 1];
                        }
                        para = true;
                    } else if (para === true) {
                        listly = [];
                        len    = len - 1;
                        b      = b - 1;
                        output.pop();
                        lines[b] = lines[b] + lines[b + 1];
                        lines.splice(b + 1, 1);
                        lines[b] = parse(
                            lines[b].replace(/\s+/g, " ").replace(/^\s/, ""),
                            false,
                            false
                        );
                        para     = true;
                    } else {
                        para     = true;
                        listly   = [];
                        lines[b] = parse(lines[b], false, false);
                    }
                    output.push(lines[b]);
                }
            });
    };*/