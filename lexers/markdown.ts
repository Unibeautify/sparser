(function markdown_init() {
    "use strict";
    const sparser: sparser = global.sparser,
        markdown = function lexer_markdown(source : string): data {
            let a   : number   = 0,
                b   : number   = 0,
                bc1 : number   = 0,
                bc2 : number   = 0,
                quote:string   = "",
                stack:string[] = [];
            const parse: parse    = sparser.parse,
                data   : data     = parse.data,
                options: any      = sparser.options,
                lines  : string[] = (options.crlf === true)
                    // eslint-disable-next-line
                    ? source.replace(/\u0000/g, "\ufffd").split("\r\n")
                    // eslint-disable-next-line
                    : source.replace(/\u0000/g, "\ufffd").split("\n"),
                frontspace = function lexer_markdown_frontspace(index:number):string {
                    const space:string[]|null = (/^\s+/).exec(lines[index]);
                    if (space === null) {
                        return "";
                    }
                    return space[0];
                },
                hr = function lexer_markdown_hr():void {
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "markdown",
                        lines: 0,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<hr/>",
                        types: "singleton"
                    }, "");
                },
                text     = function lexer_markdown_text(item:string, tag:string, listrecurse:boolean):void {
                    const headerId = function lexer_markdown_text_headerId(tag:string):string {
                        if ((/<\/h\d>/).test(tag) === false) {
                            return tag;
                        }
                        const store:string[] = [],
                            parent:[string, number] = parse.structure[parse.structure.length - 1];
                        let aa:number = parent[1] + 1,
                            id:string = "";
                        do {
                            if (data.types[aa] === "content") {
                                store.push(data.token[aa]);
                            }
                            aa = aa + 1;
                        } while (aa < parse.count);
                        if (store.length > 0) {
                            id = `id="${store.join(" ").replace(/\s+/g, "-").replace(/\.|\(|\)|:|\?|#|=|\{|\}|\[|\]/g, "").replace(/-+/g, "-").replace(/^-/, "").replace(/-$/, "").toLowerCase()}"`;
                            parse.splice({
                                data: data,
                                howmany: 0,
                                index: parent[1] + 1,
                                record: {
                                    begin: parent[1],
                                    ender: -1,
                                    lexer: "markdown",
                                    lines: 0,
                                    stack: parent[0],
                                    token: id,
                                    types: "attribute"
                                }
                            });
                        }
                        return tag;
                    };
                    let tagend:string = tag.replace("<", "</"),
                        struct:string = tag.replace("<", "").replace(/(\/?>)$/, "");
                    
                    // line containing strong, em, or inline code
                    if (item.indexOf("*") > -1 || item.indexOf("_") > -1 || item.indexOf("`") > -1 || (item.indexOf("[") > -1 && item.indexOf("](") > -1)) {
                        const esctest = function lexer_markdown_text_esctest():boolean {
                                let bb = aa - 1;
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
                            },
                            underscore = function lexer_markdown_text_underscore():boolean {
                                const numb:number = (str[aa + 1] === "_")
                                    ? 2
                                    : 1;
                                if ((/\s/).test(str[aa - 1]) === true || aa === 0 || aa === bb - numb || (/\s/).test(str[aa + numb]) === true) {
                                    return true;
                                }
                                return false;
                            },
                            gencontent = function lexer_markdown_text_gencontent():string {
                                return itemx.join("").replace(/\s+/g, " ").replace(/^\s/, "").replace(/\s$/, "").replace(/\\(?!(\\))/g, "").replace(/\\{2}/g, "\\");
                            };
                        let stray:string = "",
                            str:string[] = item.split(""),
                            content:string = "",
                            itemx:string[] = [],
                            square:number = 0,
                            aa:number = 0,
                            bb:number = str.length,
                            cc:number = 0;
                        if (tag !== "multiline") {
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                ender: -1,
                                lexer: "markdown",
                                lines: 0,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: tag,
                                types: "start"
                            }, struct);
                        }
                        do {
                            if (str[aa] === "[" && esctest() === false) {
                                cc = aa;
                                square = 0;
                                do {
                                    if (str[cc] === "[") {
                                        square = square + 1;
                                    } else if (str[cc] === "]") {
                                        square = square - 1;
                                        if (square < 1 && str[cc + 1] === "(") {
                                            content = itemx.join("").replace(/\s+/g, " ").replace(/^\s/, "").replace(/\s$/, "");
                                            if (content !== "") {
                                                parse.push(data, {
                                                    begin: parse.structure[parse.structure.length - 1][1],
                                                    ender: -1,
                                                    lexer: "markdown",
                                                    lines: 0,
                                                    stack: parse.structure[parse.structure.length - 1][0],
                                                    token: content,
                                                    types: "content"
                                                }, "");
                                            }
                                            itemx = [];
                                            stack.push("[");
                                            if (str[aa - 1] === "!") {
                                                content = "img";
                                            } else {
                                                content = "a";
                                            }
                                            if (content === "img") {
                                                if (data.token[parse.count] === "!") {
                                                    parse.pop(data);
                                                } else if (data.types[parse.count] === "content") {
                                                    data.token[parse.count] = data.token[parse.count].slice(0, data.token[parse.count].length - 1).replace(/(\s)$/, "");
                                                }
                                                parse.push(data, {
                                                    begin: parse.structure[parse.structure.length - 1][1],
                                                    ender: -1,
                                                    lexer: "markdown",
                                                    lines: 1,
                                                    stack: parse.structure[parse.structure.length - 1][0],
                                                    token: "<img/>",
                                                    types: "singleton"
                                                }, "");
                                                content = str.slice(aa + 1, cc).join("").replace(/\s+/g, " ").replace(/^\s/, "").replace(/\s$/, "")
                                                if (content !== "") {
                                                    parse.push(data, {
                                                        begin: parse.structure[parse.structure.length - 1][1],
                                                        ender: -1,
                                                        lexer: "markdown",
                                                        lines: 0,
                                                        stack: parse.structure[parse.structure.length - 1][0],
                                                        token: "alt=\"" + content + "\"",
                                                        types: "attribute"
                                                    }, "");
                                                }
                                                parse.push(data, {
                                                    begin: parse.structure[parse.structure.length - 1][1],
                                                    ender: -1,
                                                    lexer: "markdown",
                                                    lines: 1,
                                                    stack: parse.structure[parse.structure.length - 1][0],
                                                    token: "src=\"",
                                                    types: "attribute"
                                                }, "");
                                                aa = cc - 1;
                                            } else {
                                                parse.push(data, {
                                                    begin: parse.structure[parse.structure.length - 1][1],
                                                    ender: -1,
                                                    lexer: "markdown",
                                                    lines: 1,
                                                    stack: parse.structure[parse.structure.length - 1][0],
                                                    token: "<a>",
                                                    types: "start"
                                                }, "a");
                                                parse.push(data, {
                                                    begin: parse.structure[parse.structure.length - 1][1],
                                                    ender: -1,
                                                    lexer: "markdown",
                                                    lines: 0,
                                                    stack: parse.structure[parse.structure.length - 1][0],
                                                    token: "href=\"",
                                                    types: "attribute"
                                                }, "");
                                            }
                                            break;
                                        }
                                    }
                                    cc = cc + 1;
                                } while (cc < bb);
                            } else if (str[aa] === "]" && str[aa + 1] === "(" && esctest() === false && stack[stack.length - 1] === "[") {
                                content = gencontent();
                                if (content !== "" && content.length > 1 && parse.structure[parse.structure.length - 1][0] !== "img") {
                                    parse.push(data, {
                                        begin: parse.structure[parse.structure.length - 1][1],
                                        ender: -1,
                                        lexer: "markdown",
                                        lines: 0,
                                        stack: parse.structure[parse.structure.length - 1][0],
                                        token: content,
                                        types: "content"
                                    }, "");
                                }
                                cc = aa + 1;
                                square = 0;
                                do {
                                    if (str[cc] === "(") {
                                        square = square + 1;
                                    } else if (str[cc] === ")") {
                                        square = square - 1;
                                        if (square === 0) {
                                            content = str.slice(aa + 2, cc).join("").replace(/\s+/g, " ").replace(/^\s/, "").replace(/\s$/, "");
                                            aa = cc;
                                            str[cc] = "";
                                            itemx = [];
                                            cc = (parse.structure[parse.structure.length - 1][0] === "a")
                                                ? parse.structure[parse.structure.length - 1][1] + 1
                                                : parse.count;
                                            if (content === "") {
                                                data.token[cc] = data.token[cc] + "\"";
                                            } else {
                                                data.token[cc] = data.token[cc] + content + "\"";
                                            }
                                            break;
                                        }
                                    }
                                    cc = cc + 1;
                                } while (cc < bb);
                                stack.pop();
                                if (parse.structure[parse.structure.length - 1][0] === "a") {
                                    parse.push(data, {
                                        begin: parse.structure[parse.structure.length - 1][1],
                                        ender: -1,
                                        lexer: "markdown",
                                        lines: 0,
                                        stack: parse.structure[parse.structure.length - 1][0],
                                        token: "</a>",
                                        types: "end"
                                    }, "");
                                }
                            } else if (
                                (str[aa] === "*" || (str[aa] === "_" && underscore() === true) || str[aa] === "~") &&
                                esctest() === false &&
                                stack[stack.length - 1] !== "`" &&
                                (
                                    (
                                        quote === "" && (
                                            (/\s/).test(str[aa - 1]) === true ||
                                            aa === 0
                                        )
                                    ) || quote !== ""
                                )
                            ) {
                                if (str[aa] === "~") {
                                    quote = "~";
                                    do {
                                        str[aa] = "";
                                        aa = aa + 1;
                                    } while (str[aa] === "~");
                                } else if (str[aa] === "*" && str[aa + 1] === "*") {
                                    quote = "**";
                                    str[aa + 1] = "";
                                } else if (str[aa] === "_" && str[aa + 1] === "_") {
                                    quote = "__";
                                    str[aa + 1] = "";
                                } else if (str[aa] === "_") {
                                    quote = "_";
                                } else if (str[aa] !== "_") {
                                    quote = "*";
                                }
                                str[aa] = "";
                                if (quote === stack[stack.length - 1]) {
                                    let midtag = "</em>";
                                    content = gencontent();
                                    if (content !== "") {
                                        parse.push(data, {
                                            begin: parse.structure[parse.structure.length - 1][1],
                                            ender: -1,
                                            lexer: "markdown",
                                            lines: 0,
                                            stack: parse.structure[parse.structure.length - 1][0],
                                            token: content,
                                            types: "content"
                                        }, "");
                                    }
                                    itemx = [];
                                    if (quote === "~") {
                                        midtag = "</strike>";
                                    } else if (quote === "**" || quote === "__") {
                                        midtag = "</strong>";
                                    }
                                    stack.pop();
                                    parse.push(data, {
                                        begin: parse.structure[parse.structure.length - 1][1],
                                        ender: -1,
                                        lexer: "markdown",
                                        lines: 0,
                                        stack: parse.structure[parse.structure.length - 1][0],
                                        token: midtag,
                                        types: "end"
                                    }, "");
                                    quote = "";
                                    stack = [];
                                } else {
                                    let midtag = "em";
                                    content = gencontent();
                                    if (content !== "") {
                                        parse.push(data, {
                                            begin: parse.structure[parse.structure.length - 1][1],
                                            ender: -1,
                                            lexer: "markdown",
                                            lines: 0,
                                            stack: parse.structure[parse.structure.length - 1][0],
                                            token: content,
                                            types: "content"
                                        }, "");
                                    }
                                    itemx = [];
                                    if (quote === "~") {
                                        midtag = "strike";
                                    } else if (quote === "**" || quote === "__") {
                                        midtag = "strong";
                                    }
                                    stack.push(quote);
                                    parse.push(data, {
                                        begin: parse.structure[parse.structure.length - 1][1],
                                        ender: -1,
                                        lexer: "markdown",
                                        lines: 1,
                                        stack: parse.structure[parse.structure.length - 1][0],
                                        token: `<${midtag}>`,
                                        types: "start"
                                    }, midtag);
                                }
                            } else if (str[aa] === "`" && esctest() === false) {
                                content = gencontent();
                                if (content !== "") {
                                    parse.push(data, {
                                        begin: parse.structure[parse.structure.length - 1][1],
                                        ender: -1,
                                        lexer: "markdown",
                                        lines: 0,
                                        stack: parse.structure[parse.structure.length - 1][0],
                                        token: content,
                                        types: "content"
                                    }, "");
                                }
                                itemx = [];
                                if (stack[stack.length - 1] === "`") {
                                    str[aa] = "";
                                    stack.pop();
                                    parse.push(data, {
                                        begin: parse.structure[parse.structure.length - 1][1],
                                        ender: -1,
                                        lexer: "markdown",
                                        lines: 0,
                                        stack: parse.structure[parse.structure.length - 1][0],
                                        token: "</code>",
                                        types: "end"
                                    }, "");
                                    quote = "";
                                    stack = [];
                                } else {
                                    stack.push("`");
                                    parse.push(data, {
                                        begin: parse.structure[parse.structure.length - 1][1],
                                        ender: -1,
                                        lexer: "markdown",
                                        lines: 1,
                                        stack: parse.structure[parse.structure.length - 1][0],
                                        token: "<code>",
                                        types: "start"
                                    }, "code");
                                }
                            }
                            if (str[aa] !== stack[stack.length - 1] && str[aa - 1] + str[aa] !== stack[stack.length - 1]) {
                                itemx.push(str[aa]);
                            }
                            aa = aa + 1;
                        } while (aa < bb);
                        content = gencontent();
                        if (tag !== "multiline" && data.types[parse.count] === "start" && data.token[parse.count] !== tag) {
                            stray = data.token[parse.count];
                            parse.pop(data);
                            parse.structure.pop();
                            if (stray === "<code>") {
                                stray = "`";
                            } else if (stray === "<em>") {
                                stray = "*";
                            } else if (stray === "<strong>") {
                                stray = "**";
                            } else if (stray === "<strike>") {
                                stray = "~";
                            }
                            if (data.types[parse.count] === "start") {
                                content = item;
                            } else {
                                data.token[parse.count] = data.token[parse.count] + stray;
                            }
                        }
                        if (content !== "") {
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                ender: -1,
                                lexer: "markdown",
                                lines: 1,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: content,
                                types: "content"
                            }, "");
                        }
                        if (listrecurse === true) {
                            list();
                        }
                        if (tag !== "multiline") {
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                ender: -1,
                                lexer: "markdown",
                                lines: 0,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: headerId(tagend),
                                types: "end"
                            }, "");
                            quote = "";
                            stack = [];
                        }
                        return;
                    }
                    if (struct.indexOf(" ") > 0) {
                        struct = struct.slice(0, struct.indexOf(" "));
                    }
                    if (tag !== "multiline") {
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: tag,
                            types: "start"
                        }, struct);
                    }
                    if (listrecurse === true) {
                        list();
                    } else {
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: item.replace(/^(\s+)/, "").replace(/(\s+)$/, ""),
                            types: "content"
                        }, "");
                    }
                    if (tag !== "multiline") {
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: headerId(tagend),
                            types: "end"
                        }, "");
                        quote = "";
                        stack = [];
                    }
                },
                comtest  = function lexer_markdown_comtest(index:number):boolean {
                    return (/^(\s{0,3}<!--)/).test(lines[index]);
                },
                hrtest = function lexer_markdown_hrtest(index:number):boolean {
                    return (/^(\s*((-\s*){3,}|(_\s*){3,}|(\*\s*){3,})\s*)$/).test(lines[index]);
                },
                codetest = function lexer_markdown_codetest(index:number):boolean {
                    return ((/^(\u0020{4,}\s*\S)/).test(lines[index]) === true || (/^(\s*\t\s*\S)/).test(lines[index]) === true);
                },
                codeblocktest = function lexer_markdown_codeblocktest(index:number):boolean {
                    return (/^(\s{0,3}((`{3,})|(~{3,}))+(\S+)?\s*)$/).test(lines[index]);
                },
                listtest = function lexer_markdown_listtest(index:number):boolean {
                    const listy:RegExp = (/^(\s*(\*|-|\+|(\d{1,9}(\)|\.))))/);
                    if (listy.test(lines[index]) === true) {
                        const listr = lines[index].replace(listy, "");
                        if (listr === "") {
                            lines[index] = lines[index] + " ";
                        } else if ((/\s/).test(listr.charAt(0)) === false) {
                            return false;
                        }
                        return true;
                    }
                    return false;
                },
                comment  = function lexer_markdown_comment():void {
                    const com:string[] = [];
                    let comment:string = "";
                    if (lines[a].indexOf("-->") < 0) {
                        do {
                            com.push(lines[a]);
                            a = a + 1;
                        } while (a < b && lines[a].indexOf("-->") < 0);
                    } else {
                        com.push(lines[a]);
                    }
                    if (options.crlf === true) {
                        comment = com.join("\r\n").replace(/^(\s*<!--+\s*)/, "").replace(/\s*-+->/, "-->");
                    } else {
                        comment = com.join("\n").replace(/^(\s*<!--+\s*)/, "").replace(/\s*-+->/, "-->");
                    }
                    comment = comment.slice(0, comment.indexOf("-->"));
                    if (lines[a] !== undefined) {
                        lines[a] = lines[a].slice(lines[a].indexOf("-->") + 3);
                        if (lines[a].replace(/\s+/, "") !== "") {
                            a = a - 1;
                        }
                    }
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "markdown",
                        lines: 0,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: comment,
                        types: "comment"
                    }, "");
                },
                code     = function lexer_markdown_code(codetext:string, language:string, fourspace:boolean):void {
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "markdown",
                        lines: 0,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<p>",
                        types: "start"
                    }, "p");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "markdown",
                        lines: 0,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<code>",
                        types: "start"
                    }, "code");
                    if (language !== "") {
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "class=\"language-" + language + "\"",
                            types: "attribute"
                        }, "");
                    }
                    if (codetext !== "") {
                        if (fourspace === true) {
                            if (codetext.indexOf("    ") === 0) {
                                codetext = codetext.replace(/^(\u0020{4})/, "");
                            } else {
                                codetext = codetext.replace(/^(\s*\t)/, "");
                            }
                        }
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: codetext,
                            types: "content"
                        }, "");
                    }
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "markdown",
                        lines: 0,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "</code>",
                        types: "end"
                    }, "");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "markdown",
                        lines: 0,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "</p>",
                        types: "end"
                    }, "");
                },
                codeblock = function lexer_markdown_codeblock(ticks:boolean, blockyquote:boolean, fourspace:boolean):void {
                    const indentstr:number = (function lexer_markdown_codeblock() {
                            let inumb:number = (ticks === true)
                                ? (/^(\s*)/).exec(lines[a])[0].length
                                : 0;
                            if (inumb > 3) {
                                return 0;
                            }
                            return inumb;
                        }()),
                        indent:RegExp = new RegExp(`^(\\s{0,${indentstr}})`),
                        open:string = (function lexer_markdown_codeblock_open():string {
                            const op:string = lines[a].replace(/^\s*/, "");
                            let aa:number = 0;
                            do {
                                aa = aa + 1;
                            } while (op.charAt(aa) === op.charAt(0));
                            return op.slice(0, aa);
                        }()),
                        language:string = (ticks === true)
                            ? lines[a].replace(/(\s*((`+)|(~+))\s*)/, "").replace(/(\s*)/g, "")
                            : "",
                        endgate:RegExp = new RegExp(`^\\s{0,3}${open.charAt(0)}{${open.length},}\\s*$`),
                        codes:string[] = [];
                    if (ticks === true) {
                        a = a + 1;
                        if (endgate.test(lines[a]) === true) {
                            code("", language, false);
                            return;
                        }
                    }
                    do {
                        if (lines[a] === undefined) {
                            break;
                        }
                        if (ticks === true) {
                            if (endgate.test(lines[a]) === true) {
                                break;
                            }
                            codes.push(lines[a].replace(indent, ""));
                        } else if (lines[a] !== "") {
                            codes.push(lines[a].replace(/^(\u0020{4})/, "").replace(/^(\s*\t)/, ""));
                            if (lines[a + 1] !== "" && codetest(a + 1) === false) {
                                break;
                            }
                            if (lines[a + 1] === "" && codetest(a + 2) === false) {
                                a = a + 1;
                                break;
                            }
                        } else {
                            if (codetest(a + 1) === false) {
                                break;
                            }
                            codes.push("");
                        }
                        if (blockyquote === true && (/^(\s*>)/).test(lines[a + 1]) === false) {
                            break;
                        }
                        a = a + 1;
                    } while (a < b);
                    if (options.crlf === true) {
                        code(codes.join("\r\n"), language, fourspace);
                    } else {
                        code(codes.join("\n"), language, fourspace);
                    }
                },
                parabuild = function lexer_markdown_parabuild():void {
                    let x:number = a,
                        tag: string = "<p>";
                    const test = function lexer_markdown_parabuild_test(index:number): boolean {
                            if (lines[index] === undefined) {
                                return false;
                            }
                            if ((/^(\s{0,3}((=+)|(-+))\s*)$/).test(lines[index]) === true) {
                                if (lines[index].indexOf("=") > -1) {
                                    tag = "<h1>";
                                } else {
                                    tag = "<h2>";
                                }
                                return false;
                            }
                            if (hrtest(index) === true) {
                                return false;
                            }
                            if ((/^(\s*((`{3,})|(~{3,}))+(\S+)?\s*)$/).test(lines[index]) === true) {
                                return false;
                            }
                            if (lines[index] === "") {
                                return false;
                            }
                            if ((/^(\s*>)/).test(lines[index]) === true) {
                                return false;
                            }
                            if ((/^(\s*#{1,6}\s)/).test(lines[index]) === true) {
                                return false;
                            }
                            if (listtest(index) === true && parse.structure[parse.structure.length - 1][0] !== "blockquote") {
                                return false;
                            }
                            return true;
                        },
                        fixquote = function lexer_markdown_parabuild_fixquote() {
                            let key:string = "",
                                x:number = parse.count;
                            if (quote === "*" || quote === "_") {
                                key = "<em>";
                            } else if (quote === "**" || quote === "__") {
                                key = "<strong>";
                            } else if (quote === "~") {
                                key = "<strike>";
                            }
                            parse.structure.pop();
                            if (data.token[x] !== key) {
                                do {
                                    data.begin[x] = parse.structure[parse.structure.length - 1][1];
                                    data.stack[x] = parse.structure[parse.structure.length - 1][0];
                                    x = x - 1;
                                } while (x > 0 && data.token[x] !== key);
                            }
                            if (data.types[x + 1] === "content") {
                                data.token[x + 1] = `${quote} ${data.token[x + 1]}`;
                                parse.splice({
                                    data: data,
                                    howmany: 1,
                                    index: x
                                });
                            } else if (data.types[x - 1] === "content") {
                                data.token[x - 1] = data.token[x - 1] + quote;
                                parse.splice({
                                    data: data,
                                    howmany: 1,
                                    index: x
                                });
                            } else {
                                data.token[x] = quote;
                                data.types[x] = "content";
                            }
                            quote = "";
                        };
                    if (test(a + 1) === true) {
                        do {
                            x = x + 1;
                        } while (x < b && test(x) === true);
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: tag,
                            types: "start"
                        }, tag.replace("<", "").replace(">", ""));
                        if (x === a + 1) {
                            text(lines[a], tag, false);
                        } else {
                            do {
                                text(lines[a], "multiline", false);
                                parse.push(data, {
                                    begin: parse.structure[parse.structure.length - 1][1],
                                    ender: -1,
                                    lexer: "markdown",
                                    lines: 0,
                                    stack: parse.structure[parse.structure.length - 1][0],
                                    token: "<br/>",
                                    types: "singleton"
                                }, "");
                                a = a + 1;
                            } while (a < x);
                            parse.pop(data);
                            if (quote !== "") {
                                fixquote();
                            }
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                ender: -1,
                                lexer: "markdown",
                                lines: 0,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: tag.replace("<", "</"),
                                types: "end"
                            }, "");
                        }
                    } else {
                        text(lines[a], tag, false);
                        if (tag !== "<p>") {
                            a = a + 1;
                        }
                    }
                    quote = "";
                    stack = [];
                },
                heading = function lexer_markdown_heading():void {
                    let hash:string = (/^(\s*#+\s+)/).exec(lines[a])[0].replace(/\s+/g, ""),
                        hashes = function lexer_markdown_heading_hasheds(escapes:string):string {
                            return escapes.replace(/\\/g, "").replace(/\s+/g, "");
                        },
                        content = lines[a].replace(/^(\s*#+\s+)/, "").replace(/(\s+#+\s*)$/, "").replace(/((\\?#)+\s*)$/, hashes);
                    if (content === "" || (/^(#+)$/).test(content) === true) {
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "<h" + hash.length + ">",
                            types: "start"
                        }, "h" + hash.length);
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "</h" + hash.length + ">",
                            types: "end"
                        }, "");
                    } else {
                        text(content, "<h" + hash.length + ">", false);
                    }
                },
                blockquote = function lexer_markdown_blockquote():void {
                    let x:number = a;
                    bc1 = bc1 + 1;
                    bc2 = bc1;
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "markdown",
                        lines: 0,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<blockquote>",
                        types: "start"
                    }, "blockquote");
                    do {
                        lines[x] = lines[x].replace(/^(\s*>\u0020?)/, "");
                        if (listtest(x + 1) === true) {
                            break;
                        }
                        if (lines[x].replace(/\s+/, "") === "") {
                            lines[x] = "";
                            if ((/^(\s*>)/).test(lines[x + 1]) === false) {
                                break;
                            }
                        }
                        if ((/^(\s{0,3}((-{3,})|(={3,}))\s*)$/).test(lines[x + 1]) === true) {
                            break;
                        }
                        x = x + 1;
                    } while (x < b && lines[x] !== "" && codetest(x) === false && hrtest(x) === false);
                    if (x < b - 1 && x > 0) {
                        if (listtest(x) === true) {
                            lines.splice(x + 1, 0, "");
                            b = b + 1;
                        } else if (lines[x].replace(/\s+/, "") !== "") {
                            x = x - 1;
                        }
                    }
                    do {
                        if ((/^(\s*>)/).test(lines[a]) === true) {
                            blockquote();
                        } else if ((/^(\s*((`{3,})|(~{3,}))+(\S+)?\s*)$/).test(lines[a]) === true) {
                            if (a + 1 < x) {
                                parse.push(data, {
                                    begin: parse.structure[parse.structure.length - 1][1],
                                    ender: -1,
                                    lexer: "markdown",
                                    lines: 0,
                                    stack: parse.structure[parse.structure.length - 1][0],
                                    token: "<p>",
                                    types: "start"
                                }, "p");
                                parse.push(data, {
                                    begin: parse.structure[parse.structure.length - 1][1],
                                    ender: -1,
                                    lexer: "markdown",
                                    lines: 0,
                                    stack: parse.structure[parse.structure.length - 1][0],
                                    token: "<code>",
                                    types: "start"
                                }, "code");
                                parse.push(data, {
                                    begin: parse.structure[parse.structure.length - 1][1],
                                    ender: -1,
                                    lexer: "markdown",
                                    lines: 0,
                                    stack: parse.structure[parse.structure.length - 1][0],
                                    token: "</code>",
                                    types: "end"
                                }, "");
                                parse.push(data, {
                                    begin: parse.structure[parse.structure.length - 1][1],
                                    ender: -1,
                                    lexer: "markdown",
                                    lines: 0,
                                    stack: parse.structure[parse.structure.length - 1][0],
                                    token: "</p>",
                                    types: "end"
                                }, "");
                                lines[a] = "";
                                break;
                            }
                            codeblock(true, true, false);
                        } else if (codetest(a) === true) {
                            codeblock(false, true, true);
                        } else if ((/^(\s*#{1,6}\s)/).test(lines[a]) === true) {
                            heading();
                        } else if (listtest(a) === true) {
                            list();
                        } else if (a > x && (/^(\s{0,3}((-{3,})|(={3,}))\s*)$/).test(lines[a + 1]) === true) {
                            text(lines[a], "<p>", false);
                        } else if (lines[a].replace(/\s+/, "") !== "") {
                            parabuild();
                        }
                        a = a + 1;
                    } while (a < x);
                    if (lines[a - 1] === "" || lines[a] !== "" || (a > x && (/^(\s{0,3}((-{3,})|(={3,}))\s*)$/).test(lines[a]) === true)) {
                        a = a - 1;
                    }
                    bc1 = bc1 - 1;
                    if (bc1 === 0) {
                        do {
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                ender: -1,
                                lexer: "markdown",
                                lines: 0,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: "</blockquote>",
                                types: "end"
                            }, "");
                            bc2 = bc2 - 1;
                        } while (bc2 > 0);
                    }
                },
                list     = function lexer_markdown_list():void {
                    let paraForce:boolean = false,
                        ind:number = 0,
                        sym:string = lines[a].replace(/^(\s+)/, "").charAt(0),
                        record:record = {
                            begin: -1,
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: "",
                            token: "",
                            types: ""
                        },
                        numb:string = "",
                        lasttext:string = "",
                        y:number = 0,
                        z:number = 0,
                        order:boolean = false,
                        end:record;
                    const tabs = function lexer_markdown_list_tabs(spaces:string):string {
                            let output:string[] = spaces.split(""),
                                uu:number = 0;
                            const tt:number = output.length;
                            do {
                                if (output[uu] === "\t") {
                                    output[uu] = "    ";
                                }
                                uu = uu + 1;
                            } while (uu < tt);
                            return output.join("");
                        },
                        checktest = function lexer_markdown_list_checktest() {
                            return ((/^(\s*(\*|-|\+)?\s{0,3}\[( |x)\]\s*)$/).test(lines[a]) === true || (/^(\s*(\*|-|\+)?\s{0,3}\[( |x)\]\s+\S)/).test(lines[a]) === true);
                        },
                        indentation:RegExp = (/^(\s*(\*|-|\+)?\s*)/),
                        indlen = function lexer_markdown_list_indlen(index:number):number {
                            if (lines[index] === undefined) {
                                return 0;
                            }
                            return indentation.exec(lines[index].replace(indentation, tabs))[0].length;
                        },
                        space = function lexer_markdown_list_space(index:number, emptyLine:boolean):number {
                            let xind:number = indlen(index),
                                xsym:string = (lines[index] === undefined)
                                    ? ""
                                    : lines[index].replace(/^(\s+)/, "").charAt(0);
                            if (lines[index] === undefined) {
                                return 0;
                            }
                            if (order === true) {
                                xind = (/(^(\s*(\d+(\)|\.)))?\s*)/).exec(lines[index])[0].length;
                                xsym = lines[index].replace(/^(\s*\d+)/, "").charAt(0);
                            }
                            if (order === false && "*-+".indexOf(xsym) > -1 && xsym !== sym && xind - ind < 2 && (/\s/).test(lines[index].replace(/^(\s+)/, "").charAt(1)) === true) {
                                return -1;
                            }
                            if (xind - ind < 0) {
                                return xind;
                            }
                            if (xsym !== sym && listtest(index) === true && (emptyLine === false || (emptyLine === true && xind - ind < 2))) {
                                return 10;
                            }
                            return xind;
                        };
                    if ((/^(\s*\d{1,9}(\)|\.)\s)/).test(lines[a]) === true) {
                        order = true;
                        ind = (/(^(\s*(\d+(\)|\.)))?\s*)/).exec(lines[a])[0].length;
                        sym = lines[a].replace(/^(\s*\d+)/, "").charAt(0);
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "<ol>",
                            types: "start"
                        }, "ol");
                        numb = (/\d{1,9}/).exec(lines[a])[0].replace(/^(0+)/, "");
                        if (numb !== "1") {
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                ender: -1,
                                lexer: "markdown",
                                lines: 0,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: "start=\"" + numb + "\"",
                                types: "attribute"
                            }, "");
                        }
                    } else {
                        ind = indlen(a);
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "<ul>",
                            types: "start"
                        }, "ul");
                    }

                    do {
                        paraForce = false;
                        // lists do not contain comments
                        if (comtest(a) === true) {
                            a = a - 1;
                            break;
                        }
                        // an ordered list may not have unordered list items
                        if (order === true && (/^(\s{0,3}(\*|-|\+)\s)/).test(lines[a]) === true) {
                            if (frontspace(a) !== "") {
                                lexer_markdown_list();
                                record.begin = parse.structure[parse.structure.length - 1][1];
                                record.stack = parse.structure[parse.structure.length - 1][0];
                                record.token = "</li>";
                                record.types = "end";
                                parse.push(data, record, "");
                            } else {
                                lines.splice(a, 0, "");
                                b = b + 1;
                                break;
                            }
                        }
                        // an unordered list may not have ordered list items
                        if (order === false && (/^(\s{0,3}\d{1,9}(\)|\.)\s)/).test(lines[a]) === true) {
                            if (frontspace(a) !== "") {
                                lexer_markdown_list();
                                record.begin = parse.structure[parse.structure.length - 1][1];
                                record.stack = parse.structure[parse.structure.length - 1][0];
                                record.token = "</li>";
                                record.types = "end";
                                parse.push(data, record, "");
                            } else {
                                lines.splice(a, 0, "");
                                b = b + 1;
                                break;
                            }
                        }
                        numb = lines[a];
                        lines[a] = lines[a].replace(/^(\s*(\*|-|\+|(\d{1,9}\.))\s+)/, "");
                        //recursive list item
                        
                        if (listtest(a) === true) {
                            parse.structure.push(["ul", parse.count - 3]);
                            lexer_markdown_list();
                            record.begin = parse.structure[parse.structure.length - 1][1];
                            record.stack = parse.structure[parse.structure.length - 1][0];
                            record.token = "<li>";
                            record.types = "start";
                            y = parse.count - 1;
                            do {
                                data.begin[y] = data.begin[y] - 1;
                                y = y - 1;
                            } while (y > 0 && data.token[y + 1] !== "<li>");
                            parse.splice({
                                data: data,
                                howmany: 0,
                                index: y,
                                record: record
                            });
                            y = y + 1;
                            do {
                                if (data.types[y] === "start") {
                                    data.begin[y] = y - 1;
                                    data.stack[y] = data.token[y - 1].replace("<", "").replace(">", "");
                                    z = y;
                                } else {
                                    data.begin[y] = z;
                                    if (data.types[y] === "end") {
                                        z = z - 1;
                                    }
                                }
                                y = y + 1;
                            } while (y < parse.count + 1);
                            record.begin = z;
                            record.stack = "li";
                            record.token = "</li>";
                            record.types = "end";
                            parse.push(data, record, "");
                        } else if (lines[a] === "") {
                            y = space(a + 1, true) - ind;
                            if (y < 0) {
                                break;
                            }
                            if (y > 1 && a < b - 1 && lines[a + 1].replace(/\s+/, "").charAt(0) !== sym && (/^(\s{0,3}>)/).test(lines[a + 1]) === false) {
                                paraForce = true;
                            } else if (codetest(a + 1) === false && (parse.structure.join("").indexOf("blockquote") > 0 || y !== 0) && a < b - 1) {
                                break;
                            }
                        } else {
                            lines[a] = numb;
                            y = space(a, false) - ind;
                            if (y < -1 || y > 9 || hrtest(a) === true) {
                                z = (lines[a + 1] === "")
                                    ? a + 2
                                    : a + 1;
                                if (z !== b && codetest(z) === false && listtest(z) === false && (/^\s*>/).test(lines[a]) === false && lines[a + 1] !== "") {
                                    a = a - 1;
                                    break;
                                }
                            }
                            if (data.token[parse.count - 1] === "<li>") {
                                paraForce = false;
                                if (lines[a - 1] === "") {
                                    a = a - 1;
                                    break;
                                }
                            } else if (y < 1 && listtest(a) === false) {
                                paraForce = true;
                                y = 2;
                            }
                            if ((/^(\s*(\*|-|\+|(\d{1,9}(\)|\.)))\s*)$/).test(lines[a]) === true && lines[a + 1] === "") {
                                record.begin = parse.structure[parse.structure.length - 1][1];
                                record.stack = parse.structure[parse.structure.length - 1][0];
                                record.token = "<li>";
                                record.types = "start";
                                parse.push(data, record, "li");
                                record.begin = parse.structure[parse.structure.length - 1][1];
                                record.stack = parse.structure[parse.structure.length - 1][0];
                                record.token = "</li>";
                                record.types = "end";
                                parse.push(data, record, "");
                            } else if (y < -1) {
                                //different list type
                                lines.splice(a, 0, "");
                                b = b + 1;
                                break;
                            } else if (y > 1) {
                                if ((/^(\s*>)/).test(lines[a]) === true) {
                                    //blockquote in list item
                                    end = parse.pop(data);
                                    record.begin = end.begin;
                                    record.stack = end.stack;
                                    parse.structure.push([end.stack, end.begin]);
                                    blockquote();
                                    record.begin = parse.structure[parse.structure.length - 1][1];
                                    record.stack = parse.structure[parse.structure.length - 1][0];
                                    record.token = "</li>";
                                    record.types = "end";
                                    parse.push(data, record, "");
                                } else if (listtest(a) === true && (/^(\u0020{4,}\s*\S)/).test(lines[a].replace(/^(\s*(\*|-|\+|(\d{1,9}(\)|\.)))\s)/, "").replace(/^\t/, "    ")) === true) {
                                    //code line in list item
                                    record.begin = parse.structure[parse.structure.length - 1][1];
                                    record.stack = parse.structure[parse.structure.length - 1][0];
                                    record.token = "<li>";
                                    record.types = "start";
                                    parse.push(data, record, "li");
                                    lines[a] = lines[a].replace(/^(\s*(\*|-|\+|(\d{1,9}(\)|\.)))\s)/, "").replace(/^\t/, "    ");
                                    code(lines[a], "", true);
                                    record.begin = parse.structure[parse.structure.length - 1][1];
                                    record.stack = parse.structure[parse.structure.length - 1][0];
                                    record.token = "</li>";
                                    record.types = "end";
                                    parse.push(data, record, "");
                                } else if (paraForce || (codetest(a) === true && listtest(a) === false)) {
                                    end = parse.pop(data);
                                    record.begin = end.begin;
                                    record.stack = end.stack;
                                    parse.structure.push([end.stack, end.begin]);
                                    if (lines[a - 1] === "" && data.token[parse.count] !== "</p>") {
                                        lasttext = data.token[parse.count];
                                        parse.pop(data);
                                        record.token = "<p>";
                                        record.types = "start";
                                        parse.push(data, record, "p");
                                        record.begin = parse.structure[parse.structure.length - 1][1];
                                        record.stack = parse.structure[parse.structure.length - 1][0];
                                        record.token = lasttext;
                                        record.types = "content";
                                        parse.push(data, record, "");
                                        record.token = "</p>";
                                        record.types = "end";
                                        parse.push(data, record, "");
                                    }
                                    lines[a] = lines[a].replace(/^(\u0020{4})/, "").replace(/^(\s*\t)/, "");
                                    if (codetest(a) === true) {
                                        code(lines[a], "", true);
                                    } else if (data.token[parse.count] === "</p>" && lines[a - 1] !== "") {
                                        parse.pop(data);
                                        parse.structure.push(["p", data.begin[parse.count]]);
                                        record.begin = parse.structure[parse.structure.length - 1][1];
                                        record.stack = parse.structure[parse.structure.length - 1][0];
                                        record.token = "<br/>";
                                        record.types = "singleton";
                                        parse.push(data, record, "");
                                        text(lines[a].replace(/^(\s*(\*|-|\+|(\d{1,9}\.))\s+)/, ""), "multiline", false);
                                        record.token = "</p>";
                                        record.types = "end";
                                        parse.push(data, record, "");
                                    } else if (data.types[parse.count] === "content") {
                                        a = a - 1;
                                        parse.pop(data);
                                        record.token = "<p>";
                                        record.types = "start";
                                        record.begin = parse.structure[parse.structure.length - 1][1];
                                        record.stack = parse.structure[parse.structure.length - 1][0];
                                        parse.push(data, record, "p");
                                        record.begin = parse.structure[parse.structure.length - 1][1];
                                        record.stack = parse.structure[parse.structure.length - 1][0];
                                        text(lines[a].replace(/^(\s*(\*|-|\+|(\d{1,9}\.))\s+)/, ""), "multiline", false);
                                        record.token = "<br/>";
                                        record.types = "singleton";
                                        parse.push(data, record, "");
                                        a = a + 1;
                                        text(lines[a].replace(/^(\s*(\*|-|\+|(\d{1,9}\.))\s+)/, ""), "multiline", false);
                                        record.token = "</p>";
                                        record.types = "end";
                                        parse.push(data, record, "");
                                    } else {
                                        text(lines[a], "<p>", false);
                                    }
                                    parse.push(data, end, "");
                                } else if (listtest(a) === true) {
                                    lexer_markdown_list();
                                    record.begin = parse.structure[parse.structure.length - 1][1];
                                    record.stack = parse.structure[parse.structure.length - 1][0];
                                    record.token = "</li>";
                                    record.types = "end";
                                    parse.push(data, record, "");
                                }
                            } else if ((/^(\s*((`{3,})|(~{3,}))+(\S+)?\s*)$/).test(lines[a].replace(/^(\s*(\*|-|\+|(\d{1,9}(\)|\.)))\s)/, "")) === true) {
                                record.begin = parse.structure[parse.structure.length - 1][1];
                                record.stack = parse.structure[parse.structure.length - 1][0];
                                record.token = "<li>";
                                record.types = "start";
                                parse.push(data, record, "li");
                                lines[a] = lines[a].replace(/^(\s*(\*|-|\+|(\d{1,9}(\)|\.)))\s)/, "");
                                codeblock(true, false, false);
                                record.begin = parse.structure[parse.structure.length - 1][1];
                                record.stack = parse.structure[parse.structure.length - 1][0];
                                record.token = "</li>";
                                record.types = "end";
                                parse.push(data, record, "");
                            } else if (checktest() === true || (listtest(a + 1) === true && space(a + 1, false) - space(a, false) > 1)) {
                                record.begin = parse.structure[parse.structure.length - 1][1];
                                record.stack = parse.structure[parse.structure.length - 1][0];
                                record.token = "<li>";
                                record.types = "start";
                                parse.push(data, record, "li");
                                if (checktest() === true) {
                                    if (data.types[parse.structure[parse.structure.length - 2][1] + 1] !== "attribute") {
                                        const index:number = parse.structure[parse.structure.length - 2][1] + 1;
                                        parse.structure[parse.structure.length - 1][1] = parse.structure[parse.structure.length - 1][1] + 1;
                                        if (parse.count > index) {
                                            const parent:number = index - 1;
                                            let aa:number = parse.count;
                                            do {
                                                aa = aa - 1;
                                                if (data.begin[aa] !== parent) {
                                                    data.begin[aa] = data.begin[aa] + 1;
                                                }
                                                data.ender[aa] = data.ender[aa] + 1;
                                            } while (aa > index);
                                        }
                                        parse.splice({
                                            data: data,
                                            howmany: 0,
                                            index: index,
                                            record: {
                                                begin: parse.structure[parse.structure.length - 2][1],
                                                ender: -1,
                                                lexer: "markdown",
                                                lines: 0,
                                                stack: parse.structure[parse.structure.length - 2][0],
                                                token: "class=\"contains-task-list\"",
                                                types: "attribute"
                                            }
                                        });
                                    }
                                    record.begin = parse.structure[parse.structure.length - 1][1];
                                    record.stack = parse.structure[parse.structure.length - 1][0];
                                    record.token = "class=\"task-list-item\"";
                                    record.types = "attribute";
                                    parse.push(data, record, "");
                                    record.begin = parse.structure[parse.structure.length - 1][1];
                                    record.stack = parse.structure[parse.structure.length - 1][0];
                                    record.token = "<input/>";
                                    record.types = "singleton";
                                    parse.push(data, record, "");
                                    y = parse.count;
                                    record.begin = y;
                                    record.stack = "input";
                                    record.token = "class=\"task-list-item-checkbox\"";
                                    record.types = "attribute";
                                    parse.push(data, record, "");
                                    record.begin = y;
                                    record.stack = "input";
                                    record.token = "disabled=\"disabled\"";
                                    record.types = "attribute";
                                    parse.push(data, record, "");
                                    y = lines[a].indexOf("[x]");
                                    z = lines[a].indexOf("[ ]");
                                    if (y > -1 && z > -1) {
                                        if (y < z) {
                                            lines[a] = lines[a].replace(/(\[x\]\s*)/, "");
                                            record.begin = data.begin[parse.count - 1];
                                            record.stack = "input";
                                            record.token = "checked=\"checked\"";
                                            record.types = "attribute";
                                            parse.push(data, record, "");
                                        } else {
                                            lines[a] = lines[a].replace(/(\[ \]\s*)/, "");
                                        }
                                    } else if (y > -1) {
                                        lines[a] = lines[a].replace(/(\[x\]\s*)/, "");
                                        record.begin = data.begin[parse.count - 1];
                                        record.stack = "input";
                                        record.token = "checked=\"checked\"";
                                        record.types = "attribute";
                                        parse.push(data, record, "");
                                    } else {
                                        lines[a] = lines[a].replace(/(\[ \]\s*)/, "");
                                    }
                                }
                                lines[a] = lines[a].replace(/^(\s*(\*|-|\+|(\d{1,9}\.))\s+)/, "");
                                text(lines[a], "multiline", false);
                                if (listtest(a + 1) === false || a > b - 1 || frontspace(a) === frontspace(a + 1)) {
                                    record.begin = parse.structure[parse.structure.length - 1][1];
                                    record.stack = parse.structure[parse.structure.length - 1][0];
                                    record.token = "</li>";
                                    record.types = "end";
                                    parse.push(data, record, "");
                                }
                            } else {
                                lines[a] = lines[a].replace(/^(\s*(\*|-|\+|(\d{1,9}\.))\s+)/, "");
                                text(lines[a], "<li>", false);
                            }
                        }
                        a = a + 1;
                    } while (a < b);
                    if (lines[a] === "" || listtest(a + 1) === false) {
                        if (order === true) {
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                ender: -1,
                                lexer: "markdown",
                                lines: 0,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: "</ol>",
                                types: "end"
                            }, "");
                        } else {
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                ender: -1,
                                lexer: "markdown",
                                lines: 0,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: "</ul>",
                                types: "end"
                            }, "");
                        }
                    }
                },
                table     = function lexer_markdown_table():void {
                    let c:number    = 0,
                        d:number    = 0,
                        line:string[] = lines[a]
                            .replace(/^\|/, "")
                            .replace(/\|$/, "")
                            .replace(/\\\|/g, "parse\\?sep")
                            .split("|"),
                        bar:string[] = lines[a + 1]
                            .replace(/(\s*)/g, "")
                            .replace(/^\|/, "")
                            .replace(/\|$/, "")
                            .split("|");
                    if (line.length !== bar.length) {
                        return parabuild();
                    }
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "markdown",
                        lines: 0,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<table>",
                        types: "start"
                    }, "table");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "markdown",
                        lines: 0,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<thead>",
                        types: "start"
                    }, "thead");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "markdown",
                        lines: 0,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<tr>",
                        types: "start"
                    }, "tr");
                    d = line.length;
                    do {
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "<th>",
                            types: "start"
                        }, "th");
                        if ((/:-+:/).test(bar[c]) === true) {
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                ender: -1,
                                lexer: "markdown",
                                lines: 0,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: "style=\"text-align:center\"",
                                types: "attribute"
                            }, "");
                        } else if ((/:-+/).test(bar[c]) === true) {
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                ender: -1,
                                lexer: "markdown",
                                lines: 0,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: "style=\"text-align:left\"",
                                types: "attribute"
                            }, "");
                        } else if ((/-+:/).test(bar[c]) === true) {
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                ender: -1,
                                lexer: "markdown",
                                lines: 0,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: "style=\"text-align:right\"",
                                types: "attribute"
                            }, "");
                        }
                        text(line[c].replace(/parse\\\?sep/g, "|"), "multiline", false);
                        quote = "";
                        stack = [];
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "</th>",
                            types: "end"
                        }, "");
                        c = c + 1;
                    } while (c < d);
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "markdown",
                        lines: 0,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "</tr>",
                        types: "end"
                    }, "");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "markdown",
                        lines: 0,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "</thead>",
                        types: "end"
                    }, "");
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "markdown",
                        lines: 0,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "<tbody>",
                        types: "start"
                    }, "tbody");
                    a = a + 2;
                    d = bar.length;
                    do {
                        if (lines[a] === "") {
                            break;
                        }
                        if ((/^(\s*>)/).test(lines[a]) === true) {
                            if (data.token[parse.count] === "<tbody>") {
                                parse.structure.pop();
                                parse.pop(data);
                            } else {
                                parse.push(data, {
                                    begin: parse.structure[parse.structure.length - 1][1],
                                    ender: -1,
                                    lexer: "markdown",
                                    lines: 0,
                                    stack: parse.structure[parse.structure.length - 1][0],
                                    token: "</tbody>",
                                    types: "end"
                                }, "");
                            }
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                ender: -1,
                                lexer: "markdown",
                                lines: 0,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: "</table>",
                                types: "end"
                            }, "");
                            return blockquote();
                        }
                        line = lines[a]
                            .replace(/^\|/, "")
                            .replace(/\|$/, "")
                            .replace(/\\\|/g, "parse\\?sep")
                            .split("|");
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "<tr>",
                            types: "start"
                        }, "tr");
                        c = 0;
                        do {
                            if (line[c] === undefined) {
                                line[c] = "";
                            }
                            if (line[c] === " " && c === bar.length) {
                                break;
                            }
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                ender: -1,
                                lexer: "markdown",
                                lines: 0,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: "<td>",
                                types: "start"
                            }, "td");
                            if ((/:-+:/).test(bar[c]) === true) {
                                parse.push(data, {
                                    begin: parse.structure[parse.structure.length - 1][1],
                                    ender: -1,
                                    lexer: "markdown",
                                    lines: 0,
                                    stack: parse.structure[parse.structure.length - 1][0],
                                    token: "style=\"text-align:center\"",
                                    types: "attribute"
                                }, "");
                            } else if ((/:-+/).test(bar[c]) === true) {
                                parse.push(data, {
                                    begin: parse.structure[parse.structure.length - 1][1],
                                    ender: -1,
                                    lexer: "markdown",
                                    lines: 0,
                                    stack: parse.structure[parse.structure.length - 1][0],
                                    token: "style=\"text-align:left\"",
                                    types: "attribute"
                                }, "");
                            } else if ((/-+:/).test(bar[c]) === true) {
                                parse.push(data, {
                                    begin: parse.structure[parse.structure.length - 1][1],
                                    ender: -1,
                                    lexer: "markdown",
                                    lines: 0,
                                    stack: parse.structure[parse.structure.length - 1][0],
                                    token: "style=\"text-align:right\"",
                                    types: "attribute"
                                }, "");
                            }
                            if (line[c] !== "") {
                                text(line[c].replace(/parse\\\?sep/g, "|"), "multiline", false);
                            }
                            quote = "";
                            stack = [];
                            parse.push(data, {
                                begin: parse.structure[parse.structure.length - 1][1],
                                ender: -1,
                                lexer: "markdown",
                                lines: 0,
                                stack: parse.structure[parse.structure.length - 1][0],
                                token: "</td>",
                                types: "end"
                            }, "");
                            c = c + 1;
                        } while (c < d);
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "</tr>",
                            types: "end"
                        }, "");
                        a = a + 1;
                    } while (a < b);
                    if (data.token[parse.count] === "<tbody>") {
                        parse.structure.pop();
                        parse.pop(data);
                    } else {
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markdown",
                            lines: 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "</tbody>",
                            types: "end"
                        }, "");
                    }
                    parse.push(data, {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "markdown",
                        lines: 0,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: "</table>",
                        types: "end"
                    }, "");
                };
            b = lines.length;
            parse.push(data, {
                begin: parse.structure[parse.structure.length - 1][1],
                ender: -1,
                lexer: "markdown",
                lines: 0,
                stack: parse.structure[parse.structure.length - 1][0],
                token: "<body>",
                types: "start"
            }, "body");
            do {
                if ((/^(\s*)$/).test(lines[a]) === true) {
                    if (lines[a - 1] === "") {
                        lines.splice(a, 1);
                        b = b - 1;
                        a = a - 1;
                    } else {
                        lines[a] = "";
                    }
                } else if ((/^(\s*(\*|-|\+|(\d{1,9}(\)|\.))))/).test(lines[a]) === true && lines[a].replace(/^(\s*(\*|-|\+|(\d{1,9}(\)|\.)))\s*)/, "") === "") {
                    if ((/^(\u0020{2,})/).test(lines[a + 1]) === true) {
                        lines[a] = lines[a].replace(/(\s+)$/, "") + lines[a + 1].replace("  ", " ");
                        lines.splice(a + 1, 1);
                        b = b - 1;
                    } else if ((/^(\t)/).test(lines[a + 1]) === true) {
                        lines[a] = lines[a].replace(/(\s+)$/, "") + lines[a + 1].replace("\t", " ");
                        lines.splice(a + 1, 1);
                        b = b - 1;
                    }
                }
                a = a + 1;
            } while (a < b);
            a = 0;
            do {
                if (comtest(a) === true) {
                    comment();
                } else if (codetest(a) === true) {
                    if (codetest(a + 1) === true || (lines[a + 1] === "" && codetest(a + 2) === true)) {
                        codeblock(false, false, true);
                    } else {
                        code(lines[a], "", true);
                    }
                } else if (hrtest(a) === true) {
                    hr();
                } else if ((/^(\s{0,3}>)/).test(lines[a]) === true) {
                    blockquote();
                } else if ((/(((:-+)|(-+:)|(:-+:)|(-{2,}))\s*\|\s*)/).test(lines[a + 1]) === true) {
                    table();
                } else if (codeblocktest(a) === true) {
                    codeblock(true, false, false);
                } else if ((/^(\s*#{1,6}\s)/).test(lines[a]) === true) {
                    heading();
                } else if (listtest(a) === true) {
                    list();
                } else if (lines[a] !== "" && (/^(\s+)$/).test(lines[a]) === false) {
                    parabuild();
                }
                a = a + 1;
            } while (a < b);
            parse.push(data, {
                begin: parse.structure[parse.structure.length - 1][1],
                ender: -1,
                lexer: "markdown",
                lines: 0,
                stack: parse.structure[parse.structure.length - 1][0],
                token: "</body>",
                types: "end"
            }, "");
            return data;
        };
    sparser.lexers.markdown = markdown;
}());