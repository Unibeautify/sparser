import { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } from "constants";

/*global global*/
(function script_init() {
    "use strict";
    const framework:parseFramework = global.parseFramework,
        script = function lexer_script(source:string):data {
            let a:number = 0,
                ltoke:string          = "",
                ltype:string          = "",
                lword:Array<[string, number]> = [],
                pword:any[] = [],
                lengthb:number        = 0,
                wordTest:number       = -1,
                paren:number          = -1,
                funreferences:string[] = [],
                tempstore:record,
                pstack:[string, number],
                comment:[string, number];
            const parse:parse          = framework.parse,
                data:data           = parse.data,
                options:parseOptions        = parse.parseOptions,
                sourcemap:[number, string]      = [
                    0, ""
                ],
                references:string[][] = [[]],
                b:number              = source.length,
                c:string[]              = source.split(""),
                brace:string[]          = [],
                classy:number[]         = [],
                // depth and status of templateStrings
                templateString:boolean[] = [],
                // identify variable declarations
                vart           = {
                    count: [],
                    index: [],
                    len  : -1,
                    word : []
                },
                // peek at whats up next
                nextchar       = function lexer_script_nextchar(len:number, current:boolean):string {
                    let cc:number = (current === true)
                            ? a
                            : a + 1,
                        dd:string    = "";
                    if (typeof len !== "number" || len < 1) {
                        len = 1;
                    }
                    if (c[a] === "/") {
                        if (c[a + 1] === "/") {
                            dd = "\n";
                        } else if (c[a + 1] === "*") {
                            dd = "/";
                        }
                    }
                    if (cc < b) {
                        do {
                            if ((/\s/).test(c[cc]) === false) {
                                if (c[cc] === "/") {
                                    if (dd === "") {
                                        if (c[cc + 1] === "/") {
                                            dd = "\n";
                                        } else if (c[cc + 1] === "*") {
                                            dd = "/";
                                        }
                                    } else if (dd === "/" && c[cc - 1] === "*") {
                                        dd = "";
                                    }
                                }
                                if (dd === "" && c[cc - 1] + c[cc] !== "*/") {
                                    return c
                                        .slice(cc, cc + len)
                                        .join("");
                                }
                            } else if (dd === "\n" && c[cc] === "\n") {
                                dd = "";
                            }
                            cc = cc + 1;
                        } while (cc < b);
                    }
                    return "";
                },
                // cleans up improperly applied ASI
                asifix         = function lexer_script_asifix():void {
                    let len:number = parse.count;
                    if (data.types[len] === "comment") {
                        do {
                            len = len - 1;
                        } while (
                            len > 0 && data.types[len] === "comment"
                        );
                    }
                    if (data.token[len] === "from") {
                        len = len - 2;
                    }
                    if (data.token[len] === "x;") {
                        parse.splice(
                            {data: data, howmany: 1, index: len, record: {
                                begin: 0,
                                lexer: "",
                                lines: 0,
                                presv: false,
                                stack: "",
                                token: "",
                                types: ""
                            }}
                        );
                    }
                },
                // determine the definition of containment by stack
                recordPush     = function lexer_script_recordPush(structure: string):void {
                    const record = {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "script",
                        lines: parse.linesSpace,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: ltoke,
                        types: ltype
                    };
                    if ((/^(\/(\/|\*)\s*parse-ignore-start)/).test(ltoke) === true) {
                        record.presv = true;
                        record.types = "ignore";
                    }
                    parse.push(data, record, structure);
                },
                // remove "vart" object data
                vartpop        = function lexer_script_vartpop():void {
                    vart
                        .count
                        .pop();
                    vart
                        .index
                        .pop();
                    vart
                        .word
                        .pop();
                    vart.len = vart.len - 1;
                },
                // A lexer for keywords, reserved words, and variables
                word           = function lexer_script_word() {
                    let f:number        = wordTest,
                        g:number        = 1,
                        output:string   = "",
                        nextitem:string = "",
                        tokel:string = ltoke,
                        typel:string = ltype;
                    const lex      = [],
                        elsefix  = function lexer_script_word_elsefix():void {
                            brace.push("x{");
                            parse.splice({
                                data   : data,
                                howmany: 1,
                                index  : parse.count - 3,
                                record : {
                                    begin: 0,
                                    lexer: "",
                                    lines: 0,
                                    presv: false,
                                    stack: "",
                                    token: "",
                                    types: ""
                                }
                            });
                        },
                        builder = function lexer_script_word_builder(index:number):record {
                            return {
                                begin: data.begin[index],
                                lexer: data.lexer[index],
                                lines: data.lines[index],
                                presv: data.presv[index],
                                stack: data.stack[index],
                                token: data.token[index],
                                types: data.types[index]
                            };
                        },
                        hoisting = function lexer_script_word_hoisting(index:number, ref:string):void {
                            do {
                                if (data.token[index] === ref) {
                                    data.types[index] = "reference";
                                }
                                if (data.token[index - 1] === "{" && data.stack[index] === "function") {
                                    return;
                                }
                                index = index - 1;
                            } while (index > 0);
                        };
                    do {
                        lex.push(c[f]);
                        if (c[f] === "\\") {
                            framework.parseerror = "Illegal escape in JavaScript on line number " + parse.lineNumber;
                        }
                        f = f + 1;
                    } while (f < a);
                    output   = lex.join("");
                    wordTest = -1;
                    if (parse.count > 0 && output === "function" && data.token[parse.count] === "(" && (data.token[parse.count - 1] === "{" || data.token[parse.count - 1] === "x{")) {
                        data.types[parse.count] = "start";
                    }
                    if (parse.count > 1 && output === "function" && ltoke === "(" && (data.token[parse.count - 1] === "}" || data.token[parse.count - 1] === "x}")) {
                        if (data.token[parse.count - 1] === "}") {
                            f = parse.count - 2;
                            if (f > -1) {
                                do {
                                    if (data.types[f] === "end") {
                                        g = g + 1;
                                    } else if (data.types[f] === "start" || data.types[f] === "end") {
                                        g = g - 1;
                                    }
                                    if (g === 0) {
                                        break;
                                    }
                                    f = f - 1;
                                } while (f > -1);
                            }
                            if (data.token[f] === "{" && data.token[f - 1] === ")") {
                                g = 1;
                                f = f - 2;
                                if (f > -1) {
                                    do {
                                        if (data.types[f] === "end") {
                                            g = g + 1;
                                        } else if (data.types[f] === "start" || data.types[f] === "end") {
                                            g = g - 1;
                                        }
                                        if (g === 0) {
                                            break;
                                        }
                                        f = f - 1;
                                    } while (f > -1);
                                }
                                if (data.token[f - 1] !== "function" && data.token[f - 2] !== "function") {
                                    data.types[parse.count] = "start";
                                }
                            }
                        } else {
                            data.types[parse.count] = "start";
                        }
                    }
                    if (options.correct === true && (output === "Object" || output === "Array") && c[a + 1] === "(" && c[a + 2] === ")" && data.token[parse.count - 1] === "=" && data.token[parse.count] === "new") {
                        if (output === "Object") {
                            data.token[parse.count]           = "{";
                            ltoke                              = "}";
                            data.stack[parse.count]           = "object";
                            parse.structure[parse.structure.length - 1][0] = "object";
                        } else {
                            data.token[parse.count]           = "[";
                            ltoke                              = "]";
                            data.stack[parse.count]           = "array";
                            parse.structure[parse.structure.length - 1][0] = "array";
                        }
                        data.types[parse.count] = "start";
                        ltype                    = "end";
                        c[a + 1]                 = "";
                        c[a + 2]                 = "";
                        a                        = a + 2;
                    } else {
                        g = parse.count;
                        f = g;
                        if (options.lexerOptions.script.varword !== "none" && (output === "var" || output === "let" || output === "const")) {
                            if (data.types[g] === "comment") {
                                do {
                                    g = g - 1;
                                } while (
                                    g > 0 && (data.types[g] === "comment")
                                );
                            }
                            if (options.lexerOptions.script.varword === "list" && vart.len > -1 && vart.index[vart.len] === g && output === vart.word[vart.len]) {
                                ltoke                = ",";
                                ltype                = "separator";
                                data.token[g]        = ltoke;
                                data.types[g]        = ltype;
                                vart.count[vart.len] = 0;
                                vart.index[vart.len] = g;
                                vart.word[vart.len]  = output;
                                return;
                            }
                            vart.len = vart.len + 1;
                            vart
                                .count
                                .push(0);
                            vart
                                .index
                                .push(g);
                            vart
                                .word
                                .push(output);
                            g = f;
                        } else if (vart.len > -1 && output !== vart.word[vart.len] && parse.count === vart.index[vart.len] && data.token[vart.index[vart.len]] === ";" && ltoke !== vart.word[vart.len] && options.lexerOptions.script.varword === "list") {
                            vartpop();
                        }
                        if (output === "else" && data.types[g] === "comment") {
                            do {
                                f = f - 1;
                            } while (
                                f > -1 && data.types[f] === "comment"
                            );
                            if (data.token[f] === "x;" && (data.token[f - 1] === "}" || data.token[f - 1] === "x}")) {
                                parse.splice(
                                    {data: data, howmany: 1, index: f, record: {
                                        begin: 0,
                                        lexer: "",
                                        lines: 0,
                                        presv: false,
                                        stack: "",
                                        token: "",
                                        types: ""
                                    }}
                                );
                                g            = g - 1;
                                f            = f - 1;
                            }
                            do {
                                tempstore    = parse.pop(data);
                                parse.splice({
                                    data   : data,
                                    howmany: 0,
                                    index  : g - 3,
                                    record : builder(g)
                                });
                                f            = f + 1;
                            } while (f < g);
                        }
                        if (output === "from" && data.token[parse.count] === "x;" && data.token[parse.count - 1] === "}") {
                            asifix();
                        }
                        if (output === "while" && data.token[parse.count] === "x;" && data.token[parse.count - 1] === "}") {
                            let d:number = 0,
                                e:number = parse.count - 2;
                            if (e > -1) {
                                do {
                                    if (data.types[e] === "end") {
                                        d = d + 1;
                                    } else if (data.types[e] === "start") {
                                        d = d - 1;
                                    }
                                    if (d < 0) {
                                        if (data.token[e] === "{" && data.token[e - 1] === "do") {
                                            asifix();
                                        }
                                        return;
                                    }
                                    e = e - 1;
                                } while (e > -1);
                            }
                        }
                        if (typel === "comment") {
                            let d:number = parse.count;
                            do {
                                d = d - 1;
                            } while (d > 0 && data.types[d] === "comment");
                            typel = data.types[d];
                            tokel = data.token[d];
                        }
                        if (references.length > 0 && (tokel === "function" || tokel === "class" || tokel === "const" || tokel === "let" || tokel === "var")) {
                            ltype = "reference";
                            references[references.length - 1].push(output);
                            if (options.language === "javascript" && (tokel === "var" || (tokel === "function" && data.types[parse.count - 1] !== "operator" && data.types[parse.count - 1] !== "start" && data.types[parse.count - 1] !== "end"))) {
                                hoisting(parse.count, output);
                            }
                        } else if (parse.structure[parse.structure.length - 1][0] === "arguments" && ltype !== "operator") {
                            ltype = "reference";
                            funreferences.push(output);
                        } else if (tokel === ",") {
                            let d:number = parse.count;
                            const e:number = parse.structure[parse.structure.length - 1][1];
                            do {
                                if (data.begin[d] === e) {
                                    if (data.token[d] === ";") {
                                        break;
                                    }
                                    if (data.token[d] === "var" || data.token[d] === "let" || data.token[d] === "const") {
                                        break;
                                    }
                                } else if (data.types[d] === "end") {
                                    d = data.begin[d];
                                }
                                d = d - 1;
                            } while (d > e);
                            if (references.length > 0 && data.token[d] === "var" && options.language === "javascript") {
                                ltype = "reference";
                                references[references.length - 1].push(output);
                                hoisting(d, output);
                            } else if (references.length > 0 && data.token[d] === "let" || data.token[d] === "const") {
                                ltype = "reference";
                                references[references.length - 1].push(output);
                            } else {
                                ltype = "word";
                            }
                        } else {
                            let d:number = references.length,
                                e:number = 0;
                            if (d > 0) {
                                do {
                                    d = d - 1;
                                    e = references[d].length;
                                    if (e > 0) {
                                        do {
                                            e = e - 1;
                                            if (output === references[d][e]) {
                                                break;
                                            }
                                        } while (e > 0);
                                        if (output === references[d][e]) {
                                            break;
                                        }
                                    }
                                } while (d > 0);
                                if (references[d][e] === output && tokel !== ".") {
                                    ltype = "reference";
                                } else {
                                    ltype = "word";
                                }
                            }
                        }
                        ltoke = output;
                        if (output === "from" && data.token[parse.count] === "}") {
                            asifix();
                        }
                    }
                    recordPush("");
                    if (output === "class") {
                        classy.push(0);
                    }
                    if (output === "do") {
                        nextitem = nextchar(1, true);
                        if (nextitem !== "{") {
                            ltoke = "x{";
                            ltype = "start";
                            brace.push("x{");
                            recordPush("do");
                        }
                    }
                    if (output === "else") {
                        nextitem = nextchar(2, true);
                        if (data.token[parse.count - 1] === "x}") {
                            if (data.token[parse.count] === "else") {
                                if (data.stack[parse.count - 1] !== "if" && data.stack[parse.count - 1] !== "else") {
                                    brace.pop();
                                    parse.splice({
                                        data   : data,
                                        howmany: 0,
                                        index  : parse.count - 1,
                                        record : {
                                            begin: data.begin[data.begin[data.begin[parse.count - 1] - 1] - 1],
                                            lexer: "script",
                                            lines: 0,
                                            presv: false,
                                            stack: "if",
                                            token: "x}",
                                            types: "end"
                                        }
                                    });
                                    if (parse.structure.length > 1) {
                                        parse.structure.splice(parse.structure.length - 2, 1);
                                        parse.structure[parse.structure.length - 1][1] = parse.count;
                                    }
                                } else if (data.token[parse.count - 2] === "x}" && pstack[0] !== "if" && data.stack[parse.count] === "else") {
                                    elsefix();
                                } else if (data.token[parse.count - 2] === "}" && data.stack[parse.count - 2] === "if" && pstack[0] === "if" && data.token[pstack[1] - 1] !== "if" && data.token[data.begin[parse.count - 1]] === "x{") {
                                    // fixes when "else" is following a block that isn't "if"
                                    elsefix();
                                }
                            } else if (data.token[parse.count] === "x}" && data.stack[parse.count] === "if") {
                                elsefix();
                            }
                        }
                        if (nextitem !== "if" && nextitem.charAt(0) !== "{") {
                            ltoke = "x{";
                            ltype = "start";
                            brace.push("x{");
                            recordPush("else");
                        }
                    }
                    if ((output === "for" || output === "if" || output === "switch" || output === "catch") && options.language !== "twig" && data.token[parse.count - 1] !== ".") {
                        nextitem = nextchar(1, true);
                        if (nextitem !== "(") {
                            paren = parse.count;
                            start("x(");
                        }
                    }
                },
                // determines if a slash comprises a valid escape or if it is escaped itself
                slashes        = function lexer_script_slashes(index:number):boolean {
                    let slashy:number = index;
                    do {
                        slashy = slashy - 1;
                    } while (c[slashy] === "\\" && slashy > 0);
                    if ((index - slashy) % 2 === 1) {
                        return true;
                    }
                    return false;
                },
                // convert long strings into string concat at options.wrap
                wrapString = function lexer_script_wrapString(build:boolean, item:string) {
                    const limit:number = options.wrap,
                        q:string = item.charAt(0),
                        uchar:RegExp     = (/u[0-9a-fA-F]{4}/),
                        xchar:RegExp     = (/x[0-9a-fA-F]{2}/);
                    item = item.slice(1, item.length - 1);
                    let segment:string = "";
                    if (build === true) {
                        const space:RegExp = (/\s/);
                        let aa:number = a + 1,
                            plus:boolean = false;
                        do {
                            if (c[aa] !== "+" && space.test(c[aa]) === false && c[aa] !== "\"" && c[aa] !== "'") {
                                break;
                            }
                            if (c[aa] === "+") {
                                plus = true;
                            }
                            if (c[aa] === "\"" || c[aa] === "'") {
                                if (plus === true) {
                                    plus = false;
                                    a = aa;
                                    segment = generic(c[a], c[a]);
                                    aa = a;
                                    item = item + segment.slice(1, segment.length - 1);
                                } else {
                                    break;
                                }
                            }
                            aa = aa + 1;
                        } while (aa < b);
                    }
                    if (item.length > limit && limit > 0) {
                        do {
                            segment = item.slice(0, limit);
                            if (segment.charAt(limit - 5) === "\\" && uchar.test(item.slice(limit - 4, limit + 1)) === true) {
                                segment = segment.slice(0, limit - 5);
                            } else if (segment.charAt(limit - 4) === "\\" && uchar.test(item.slice(limit - 3, limit + 2)) === true) {
                                segment = segment.slice(0, limit - 4);
                            } else if (segment.charAt(limit - 3) === "\\" && (uchar.test(item.slice(limit - 2, limit + 3)) === true || xchar.test(item.slice(limit - 2, limit + 1)) === true)) {
                                segment = segment.slice(0, limit - 3);
                            } else if (segment.charAt(limit - 2) === "\\" && (uchar.test(item.slice(limit - 1, limit + 4)) === true || xchar.test(item.slice(limit - 1, limit + 2)) === true)) {
                                segment = segment.slice(0, limit - 2);
                            } else if (segment.charAt(limit - 1) === "\\") {
                                segment = segment.slice(0, limit - 1);
                            }
                            segment = q + segment + q;
                            item = item.slice(segment.length - 2);
                            ltoke = segment;
                            ltype = "string";
                            recordPush("");
                            parse.linesSpace = 0;
                            ltoke = "+";
                            ltype = "operator";
                            recordPush("");
                        } while (item.length > limit);
                    }
                    if (item === "") {
                        ltoke = q + q;
                    } else {
                        ltoke = q + item + q;
                    }
                    ltype = "string";
                    recordPush("");
                },
                // the generic function is a generic tokenizer start argument contains the
                // token's starting syntax offset argument is length of start minus control
                // chars end is how is to identify where the token ends
                generic        = function lexer_script_genericBuilder(starting:string, ending:string):string {
                    let ee:number     = 0,
                        output:string = "",
                        escape:boolean = false,
                        build:string[]  = [starting],
                        ender:string[]  = ending.split("");
                    const endlen:number = ender.length,
                        base:number   = a + starting.length;
                    if (wordTest > -1) {
                        word();
                    }
                    // this insanity is for JSON where all the required quote characters are
                    // escaped.
                    if (c[a - 1] === "\\" && slashes(a - 1) === true && (c[a] === "\"" || c[a] === "'")) {
                        parse.pop(data);
                        if (data.token[0] === "{") {
                            if (c[a] === "\"") {
                                starting = "\"";
                                ending   = "\\\"";
                                build    = ["\""];
                            } else {
                                starting = "'";
                                ending   = "\\'";
                                build    = ["'"];
                            }
                            escape = true;
                        } else {
                            if (c[a] === "\"") {
                                return "\\\"";
                            }
                            return "\\'";
                        }
                    }
                    ee = base;
                    if (ee < b) {
                        do {
                            if (ee > a + 1) {
                                if (c[ee] === "<" && c[ee + 1] === "?" && c[ee + 2] === "p" && c[ee + 3] === "h" && c[ee + 4] === "p" && c[ee + 5] !== starting) {
                                    a = ee;
                                    build.push(lexer_script_genericBuilder("<?php", "?>"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "<" && c[ee + 1] === "%" && c[ee + 2] !== starting) {
                                    a = ee;
                                    build.push(lexer_script_genericBuilder("<%", "%>"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "{" && c[ee + 1] === "%" && c[ee + 2] !== starting) {
                                    a = ee;
                                    build.push(lexer_script_genericBuilder("{%", "%}"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "{" && c[ee + 1] === "{" && c[ee + 2] === "{" && c[ee + 3] !== starting) {
                                    a = ee;
                                    build.push(lexer_script_genericBuilder("{{{", "}}}"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "{" && c[ee + 1] === "{" && c[ee + 2] !== starting) {
                                    a = ee;
                                    build.push(lexer_script_genericBuilder("{{", "}}"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "<" && c[ee + 1] === "!" && c[ee + 2] === "-" && c[ee + 3] === "-" && c[ee + 4] === "#" && c[ee + 5] !== starting) {
                                    a = ee;
                                    build.push(lexer_script_genericBuilder("<!--#", "-->"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else {
                                    build.push(c[ee]);
                                }
                            } else {
                                build.push(c[ee]);
                            }
                            if ((starting === "\"" || starting === "'") && options.language !== "json" && c[ee - 1] !== "\\" && (c[ee] !== c[ee - 1] || (c[ee] !== "\"" && c[ee] !== "'")) && (c[ee] === "\n" || ee === b - 1)) {
                                framework.parseerror = "Unterminated string in script on line number " + parse.lineNumber;
                                break;
                            }
                            if (c[ee] === ender[endlen - 1] && (c[ee - 1] !== "\\" || slashes(ee - 1) === false)) {
                                if (endlen === 1) {
                                    break;
                                }
                                // `ee - base` is a cheap means of computing length of build array the `ee -
                                // base` and `endlen` are both length based values, so adding two (1 for each)
                                // provides an index based number
                                if (build[ee - base] === ender[0] && build.slice(ee - base - endlen + 2).join("") === ending) {
                                    break;
                                }
                            }
                            ee = ee + 1;
                        } while (ee < b);
                    }
                    if (escape === true) {
                        output = build[build.length - 1];
                        build.pop();
                        build.pop();
                        build.push(output);
                    }
                    a = ee;
                    if (ending === "\n") {
                        a = a - 1;
                        build.pop();
                    }
                    output = build.join("");
                    return output;
                },
                // block comments
                blockComment   = function lexer_script_blockComment() {
                    if (wordTest > -1) {
                        word();
                    }
                    comment = parse.wrapCommentBlock({
                        chars: c,
                        end: b,
                        start: a
                    });
                    ltoke = comment[0];
                    if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                        sourcemap[0] = parse.count + 1;
                        sourcemap[1] = ltoke;
                    }
                    ltype = ((/^(\/\*\s*parse-ignore-start)/).test(ltoke) === true)
                        ? "ignore"
                        : "comment";
                    if (data.token[parse.count] === "var" || data.token[parse.count] === "let" || data.token[parse.count] === "const") {
                        tempstore    = parse.pop(data);
                        recordPush("");
                        parse.push(data, tempstore, "");
                        if (data.lines[parse.count - 2] === 0) {
                            data.lines[parse.count - 2] = data.lines[parse.count];
                        }
                        data.lines[parse.count] = 0;
                    } else {
                        if (data.token[parse.count] === "x}" || data.token[parse.count] === "x)") {
                            let ignore = ((/^(\/\*\s*parse-ignore-start)/).test(ltoke) === true);
                            parse.splice({
                                data: data,
                                howmany: 0,
                                index: parse.count,
                                record: {
                                    begin: data.begin[parse.count],
                                    lexer: "script",
                                    lines: parse.linesSpace,
                                    presv: (ignore === true),
                                    stack: data.stack[parse.count],
                                    token: ltoke,
                                    types: (ignore === true)
                                        ? "ignore"
                                        : "comment"
                                }
                            });
                        } else {
                            recordPush("");
                        }
                    }
                    a = comment[1];
                    if ((/\/\*\s*global\s+/).test(data.token[parse.count]) === true && data.types.indexOf("word") < 0) {
                        references[0] = data.token[parse.count].replace(/\/\*\s*global\s+/, "").replace("\u002a/", "").replace(/,\s+/g, ",").split(",");
                    }
                },
                // line comments
                lineComment    = function lexer_script_lineComment() {
                    asi(false);
                    if (wordTest > -1) {
                        word();
                    }
                    comment = parse.wrapCommentLine({
                        chars: c,
                        end: b,
                        start: a
                    });
                    ltoke = comment[0];
                    ltype = "comment";
                    a = comment[1];
                    if (options.crlf === true) {
                        if (ltoke.charAt(ltoke.length - 1) !== "\r") {
                            ltoke = ltoke + "\r";
                        }
                    } else {
                        ltoke = ltoke.replace(/\r$/, "");
                    }
                    if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                        sourcemap[0] = parse.count + 1;
                        sourcemap[1] = ltoke;
                    }
                    if (data.token[parse.count] === "x}" || data.token[parse.count] === "x)") {
                        let ignore = ((/^(\/\/\s*parse-ignore-start)/).test(ltoke) === true);
                        parse.splice({
                            data: data,
                            howmany: 0,
                            index: parse.count,
                            record: {
                                begin: data.begin[parse.count],
                                lexer: "script",
                                lines: parse.linesSpace,
                                presv: (ignore === true),
                                stack: data.stack[parse.count],
                                token: ltoke,
                                types: (ignore === true)
                                    ? "ignore"
                                    : "comment"
                            }
                        });
                    } else if (ltoke !== "") {
                        recordPush("");
                    }
                },
                // inserts ending curly brace (where absent)
                blockinsert    = function lexer_script_blockinsert():void {
                    let next:string  = nextchar(5, false),
                        name:string  = "";
                    const g:number   = parse.count,
                        lines:number = parse.linesSpace;
                    if (options.language === "json") {
                        return;
                    }
                    if (data.stack[parse.count] === "do" && next === "while" && data.token[parse.count] === "}") {
                        return;
                    }
                    next = next.slice(0, 4);
                    if (next === "else" && ltoke === "}" && data.stack[parse.count] === "if" && data.token[data.begin[parse.count]] !== "x{") {
                        return;
                    }
                    if (ltoke === ";" && data.token[g - 1] === "x{") {
                        name = data.token[data.begin[g - 2] - 1];
                        if (data.token[g - 2] === "do" || (data.token[g - 2] === ")" && "ifforwhilecatch".indexOf(name) > -1)) {
                            tempstore    = parse.pop(data);
                            ltoke        = "x}";
                            ltype        = "end";
                            pstack       = parse.structure[parse.structure.length - 1];
                            recordPush("");
                            brace.pop();
                            parse.linesSpace = lines;
                            return;
                        }
                        // to prevent the semicolon from inserting between the braces --> while (x) {};
                        tempstore    = parse.pop(data);
                        ltoke        = "x}";
                        ltype        = "end";
                        pstack       = parse.structure[parse.structure.length - 1];
                        recordPush("");
                        brace.pop();
                        ltoke        = ";";
                        ltype        = "end";
                        parse.push(data, tempstore, "");
                        parse.linesSpace = lines;
                        return;
                    }
                    ltoke = "x}";
                    ltype = "end";
                    if (data.token[parse.count] === "x}") {
                        return;
                    }
                    if (data.stack[parse.count] === "if" && (data.token[parse.count] === ";" || data.token[parse.count] === "x;") && next === "else") {
                        pstack = parse.structure[parse.structure.length - 1];
                        recordPush("");
                        brace.pop();
                        parse.linesSpace = lines;
                        return;
                    }
                    do {
                        pstack = parse.structure[parse.structure.length - 1];
                        recordPush("");
                        brace.pop();
                        if (data.stack[parse.count] === "do") {
                            break;
                        }
                    } while (brace[brace.length - 1] === "x{");
                    parse.linesSpace = lines;
                },
                // commaComment ensures that commas immediately precede comments instead of
                // immediately follow
                commaComment   = function lexer_script_commacomment():void {
                    let x:number = parse.count;
                    if (data.stack[x] === "object" && options.lexerOptions.script.objectSort === true) {
                        ltoke = ",";
                        ltype = "separator";
                        asifix();
                        recordPush("");
                    } else {
                        do {
                            x = x - 1;
                        } while (
                            x > 0 && data.types[x - 1] === "comment"
                        );
                        parse.splice({
                            data   : data,
                            howmany: 0,
                            index  : x,
                            record : {
                                begin: data.begin[x],
                                lexer: "script",
                                lines: parse.linesSpace,
                                presv: false,
                                stack: data.stack[x],
                                token: ",",
                                types: "separator"
                            }
                        });
                        recordPush("");
                    }
                },
                // automatic semicolon insertion
                asi            = function lexer_script_asi(isEnd:boolean):void {
                    let aa:number     = 0;
                    const next:string   = nextchar(1, false),
                        record:record = {
                            begin: data.begin[parse.count],
                            lexer: data.lexer[parse.count],
                            lines: data.lines[parse.count],
                            presv: data.presv[parse.count],
                            stack: data.stack[parse.count],
                            token: data.token[parse.count],
                            types: data.types[parse.count]
                        },
                        clist:string  = (parse.structure.length === 0)
                            ? ""
                            : parse.structure[parse.structure.length - 1][0];
                    if (options.language === "java" || options.language === "csharp") {
                        return;
                    }
                    if (options.language === "json" || record.token === ";" || record.token === "," || next === "{" || record.stack === "class" || record.stack === "map" || record.stack === "attribute" || clist === "initializer" || data.types[record.begin - 1] === "generic") {
                        return;
                    }
                    if (((record.stack === "global" && record.types !== "end") || (record.types === "end" && data.stack[record.begin - 1] === "global" && data.token[record.begin - 1] !== "=")) && (next === "" || next === "}") && record.stack === data.stack[parse.count - 1]) {
                        return;
                    }
                    if (record.stack === "array" && record.token !== "]") {
                        return;
                    }
                    if (record.types !== undefined && record.types.indexOf("template") > -1) {
                        return;
                    }
                    if (next === ";" && isEnd === false) {
                        return;
                    }
                    if (data.lexer[parse.count - 1] !== "script" && ((a < b && b === options.source.length - 1) || b < options.source.length - 1)) {
                        return;
                    }
                    if (options.language === "qml") {
                        if (record.types === "start") {
                            return;
                        }
                        ltoke = "x;";
                        ltype = "separator";
                        recordPush("");
                        if (brace[brace.length - 1] === "x{" && next !== "}") {
                            blockinsert();
                        }
                        return;
                    }
                    if (record.token === "}" && (record.stack === "function" || record.stack === "if" || record.stack === "else" || record.stack === "for" || record.stack === "do" || record.stack === "while" || record.stack === "switch" || record.stack === "class" || record.stack === "try" || record.stack === "catch" || record.stack === "finally" || record.stack === "block")) {
                        if (data.token[record.begin - 1] === ")") {
                            aa = data.begin[record.begin - 1] - 1;
                            if (data.token[aa - 1] === "function") {
                                aa = aa - 1;
                            }
                            if (data.stack[aa - 1] === "object" || data.stack[aa - 1] === "switch") {
                                return;
                            }
                            if (data.token[aa - 1] !== "=" && data.token[aa - 1] !== "return" && data.token[aa - 1] !== ":") {
                                return;
                            }
                        } else {
                            return;
                        }
                    }
                    if (record.types === "comment" || clist === "method" || clist === "paren" || clist === "expression" || clist === "array" || clist === "object" || (clist === "switch" && record.stack !== "method" && data.token[data.begin[parse.count]] === "(")) {
                        return;
                    }
                    if (data.stack[parse.count] === "expression" && (data.token[data.begin[parse.count] - 1] !== "while" || (data.token[data.begin[parse.count] - 1] === "while" && data.stack[data.begin[parse.count] - 2] !== "do"))) {
                        return;
                    }
                    if (next !== "" && "=<>+*?|^:&%~,.()]".indexOf(next) > -1 && isEnd === false) {
                        return;
                    }
                    if (record.types === "comment") {
                        aa = parse.count;
                        do {
                            aa = aa - 1;
                        } while (
                            aa > 0 && data.types[aa] === "comment"
                        );
                        if (aa < 1) {
                            return;
                        }
                        record.token = data.token[aa];
                        record.types = data.types[aa];
                        record.stack = data.stack[aa];
                    }
                    if (record.token === undefined || record.types === "start" || record.types === "separator" || (record.types === "operator" && record.token !== "++" && record.token !== "--") || record.token === "x}" || record.token === "var" || record.token === "let" || record.token === "const" || record.token === "else" || record.token.indexOf("#!/") === 0 || record.token === "instanceof") {
                        return;
                    }
                    if (record.stack === "method" && (data.token[record.begin - 1] === "function" || data.token[record.begin - 2] === "function")) {
                        return;
                    }
                    if (options.lexerOptions.script.varword === "list") {
                        vart.index[vart.len] = parse.count;
                    }
                    if (options.correct === true) {
                        ltoke = ";";
                    } else {
                        ltoke = "x;";
                    }
                    ltype = "separator";
                    aa    = parse.linesSpace;
                    parse.linesSpace = 0;
                    recordPush("");
                    parse.linesSpace = aa;
                    if (brace[brace.length - 1] === "x{" && next !== "}") {
                        blockinsert();
                    }
                },
                // convert ++ and -- into "= x +"  and "= x -" in most cases
                plusplus = function lexer_script_plusplus():void {
                    let pre:boolean         = true,
                        toke:string        = "+",
                        tokea:string       = "",
                        tokeb:string       = "",
                        tokec:string       = "",
                        inc:number         = 0,
                        ind:number         = 0,
                        walk:number        = 0,
                        next:string        = "";
                    const store       = [],
                        end         = function lexer_script_plusplus_end():void {
                            walk = data.begin[walk] - 1;
                            if (data.types[walk] === "end") {
                                lexer_script_plusplus_end();
                            } else if (data.token[walk - 1] === ".") {
                                period();
                            }
                        },
                        period      = function lexer_script_plusplus_period():void {
                            walk = walk - 2;
                            if (data.types[walk] === "end") {
                                end();
                            } else if (data.token[walk - 1] === ".") {
                                lexer_script_plusplus_period();
                            }
                        },
                        applyStore  = function lexer_script_plusplus_applyStore():void {
                            let x:number = 0;
                            const y:number = store.length;
                            if (x < y) {
                                do {
                                    parse.push(data, store[x], "");
                                    x            = x + 1;
                                } while (x < y);
                            }
                        },
                        recordStore = function lexer_script_plusplus_recordStore(index:number):record {
                            return {
                                begin: data.begin[index],
                                lexer: data.lexer[index],
                                lines: data.lines[index],
                                presv: data.presv[index],
                                stack: data.stack[index],
                                token: data.token[index],
                                types: data.types[index]
                            };
                        };
                    tokea  = data.token[parse.count];
                    tokeb  = data.token[parse.count - 1];
                    tokec  = data.token[parse.count - 2];
                    if (tokea !== "++" && tokea !== "--" && tokeb !== "++" && tokeb !== "--") {
                        walk = parse.count;
                        if (data.types[walk] === "end") {
                            end();
                        } else if (data.token[walk - 1] === ".") {
                            period();
                        }
                    }
                    if (data.token[walk - 1] === "++" || data.token[walk - 1] === "--") {
                        if ("startendoperator".indexOf(data.types[walk - 2]) > -1) {
                            return;
                        }
                        inc = walk;
                        if (inc < parse.count + 1) {
                            do {
                                store.push(recordStore(inc));
                                inc = inc + 1;
                            } while (inc < parse.count + 1);
                            parse.splice({
                                data   : data,
                                howmany: parse.count - walk,
                                index  : walk,
                                record : {
                                    begin: 0,
                                    lexer: "",
                                    lines: 0,
                                    presv: false,
                                    stack: "",
                                    token: "",
                                    types: ""
                                }
                            });
                        }
                    } else {
                        if (options.correct === false || (tokea !== "++" && tokea !== "--" && tokeb !== "++" && tokeb !== "--")) {
                            return;
                        }
                        next = nextchar(1, false);
                        if ((tokea === "++" || tokea === "--") && (c[a] === ";" || next === ";" || c[a] === "}" || next === "}" || c[a] === ")" || next === ")")) {
                            toke = data.stack[parse.count];
                            if (toke === "array" || toke === "method" || toke === "object" || toke === "paren" || toke === "notation" || (data.token[data.begin[parse.count] - 1] === "while" && toke !== "while")) {
                                return;
                            }
                            inc = parse.count;
                            do {
                                inc = inc - 1;
                                if (data.token[inc] === "return") {
                                    return;
                                }
                                if (data.types[inc] === "end") {
                                    do {
                                        inc = data.begin[inc] - 1;
                                    } while (data.types[inc] === "end" && inc > 0);
                                }
                            } while (
                                inc > 0 && (data.token[inc] === "." || data.types[inc] === "word" || data.types[inc] === "reference" || data.types[inc] === "end")
                            );
                            if (data.token[inc] === "," && c[a] !== ";" && next !== ";" && c[a] !== "}" && next !== "}" && c[a] !== ")" && next !== ")") {
                                return;
                            }
                            if (data.types[inc] === "operator") {
                                if (data.stack[inc] === "switch" && data.token[inc] === ":") {
                                    do {
                                        inc = inc - 1;
                                        if (data.types[inc] === "start") {
                                            ind = ind - 1;
                                            if (ind < 0) {
                                                break;
                                            }
                                        } else if (data.types[inc] === "end") {
                                            ind = ind + 1;
                                        }
                                        if (data.token[inc] === "?" && ind === 0) {
                                            return;
                                        }
                                    } while (inc > 0);
                                } else {
                                    return;
                                }
                            }
                            pre = false;
                            if (tokea === "--") {
                                toke = "-";
                            } else {
                                toke = "+";
                            }
                        } else if (tokec === "[" || tokec === ";" || tokec === "x;" || tokec === "}" || tokec === "{" || tokec === "(" || tokec === ")" || tokec === "," || tokec === "return") {
                            if (tokea === "++" || tokea === "--") {
                                if (tokec === "[" || tokec === "(" || tokec === "," || tokec === "return") {
                                    return;
                                }
                                if (tokea === "--") {
                                    toke = "-";
                                }
                                pre = false;
                            } else if (tokeb === "--" || tokea === "--") {
                                toke = "-";
                            }
                        } else {
                            return;
                        }
                        if (pre === false) {
                            tempstore    = parse.pop(data);
                        }
                        walk = parse.count;
                        if (data.types[walk] === "end") {
                            end();
                        } else if (data.token[walk - 1] === ".") {
                            period();
                        }
                        inc = walk;
                        if (inc < parse.count + 1) {
                            do {
                                store.push(recordStore(inc));
                                inc = inc + 1;
                            } while (inc < parse.count + 1);
                        }
                    }
                    if (pre === true) {
                        parse.splice({
                            data   : data,
                            howmany: 1,
                            index  : walk - 1,
                            record : {
                                begin: 0,
                                lexer: "",
                                lines: 0,
                                presv: false,
                                stack: "",
                                token: "",
                                types: ""
                            }
                        });
                        ltoke        = "=";
                        ltype        = "operator";
                        recordPush("");
                        applyStore();
                        ltoke = toke;
                        ltype = "operator";
                        recordPush("");
                        ltoke = "1";
                        ltype = "number";
                        recordPush("");
                    } else {
                        ltoke = "=";
                        ltype = "operator";
                        recordPush("");
                        applyStore();
                        ltoke = toke;
                        ltype = "operator";
                        recordPush("");
                        ltoke = "1";
                        ltype = "number";
                        recordPush("");
                    }
                    ltoke = data.token[parse.count];
                    ltype = data.types[parse.count];
                    if (next === "}" && c[a] !== ";") {
                        asi(false);
                    }
                },
                // fixes asi location if inserted after an inserted brace
                asibrace       = function lexer_script_asibrace():void {
                    let aa:number = parse.count;
                    do {
                        aa = aa - 1;
                    } while (aa > -1 && data.token[aa] === "x}");
                    if (data.stack[aa] === "else") {
                        return recordPush("");
                    }
                    aa           = aa + 1;
                    parse.splice({
                        data   : data,
                        howmany: 0,
                        index  : aa,
                        record : {
                            begin: data.begin[aa],
                            lexer: "script",
                            lines: parse.linesSpace,
                            presv: false,
                            stack: data.stack[aa],
                            token: ltoke,
                            types: ltype
                        }
                    });
                    recordPush("");
                },
                // a tokenizer for regular expressions
                regex          = function lexer_script_regex():string {
                    let ee:number     = a + 1,
                        h:number      = 0,
                        i:number      = 0,
                        output:string = "",
                        square:boolean = false;
                    const f:number      = b,
                        build:string[]  = ["/"];
                    if (ee < f) {
                        do {
                            build.push(c[ee]);
                            if (c[ee - 1] !== "\\" || c[ee - 2] === "\\") {
                                if (c[ee] === "[") {
                                    square = true;
                                }
                                if (c[ee] === "]") {
                                    square = false;
                                }
                            }
                            if (c[ee] === "/" && square === false) {
                                if (c[ee - 1] === "\\") {
                                    i = 0;
                                    h = ee - 1;
                                    if (h > 0) {
                                        do {
                                            if (c[h] === "\\") {
                                                i = i + 1;
                                            } else {
                                                break;
                                            }
                                            h = h - 1;
                                        } while (h > 0);
                                    }
                                    if (i % 2 === 0) {
                                        break;
                                    }
                                } else {
                                    break;
                                }
                            }
                            ee = ee + 1;
                        } while (ee < f);
                    }
                    if (c[ee + 1] === "g" || c[ee + 1] === "i" || c[ee + 1] === "m" || c[ee + 1] === "y" || c[ee + 1] === "u") {
                        build.push(c[ee + 1]);
                        if (c[ee + 2] !== c[ee + 1] && (c[ee + 2] === "g" || c[ee + 2] === "i" || c[ee + 2] === "m" || c[ee + 2] === "y" || c[ee + 2] === "u")) {
                            build.push(c[ee + 2]);
                            if (c[ee + 3] !== c[ee + 1] && c[ee + 3] !== c[ee + 2] && (c[ee + 3] === "g" || c[ee + 3] === "i" || c[ee + 3] === "m" || c[ee + 3] === "y" || c[ee + 3] === "u")) {
                                build.push(c[ee + 3]);
                                if (c[ee + 4] !== c[ee + 1] && c[ee + 4] !== c[ee + 2] && c[ee + 4] !== c[ee + 3] && (c[ee + 4] === "g" || c[ee + 4] === "i" || c[ee + 4] === "m" || c[ee + 4] === "y" || c[ee + 4] === "u")) {
                                    build.push(c[ee + 4]);
                                    if (c[ee + 5] !== c[ee + 1] && c[ee + 5] !== c[ee + 2] && c[ee + 5] !== c[ee + 3] && c[ee + 5] !== c[ee + 4] && (c[ee + 5] === "g" || c[ee + 5] === "i" || c[ee + 5] === "m" || c[ee + 5] === "y" || c[ee + 5] === "u")) {
                                        build.push(c[ee + 4]);
                                        a = ee + 5;
                                    } else {
                                        a = ee + 4;
                                    }
                                } else {
                                    a = ee + 3;
                                }
                            } else {
                                a = ee + 2;
                            }
                        } else {
                            a = ee + 1;
                        }
                    } else {
                        a = ee;
                    }
                    output = build.join("");
                    return output;
                },
                // a unique tokenizer for operator characters
                operator       = function lexer_script_operator():string {
                    let g:number      = 0,
                        h:number      = 0,
                        jj:number     = b,
                        output:string = "";
                    const syntax:string[] = [
                            "=",
                            "<",
                            ">",
                            "+",
                            "*",
                            "?",
                            "|",
                            "^",
                            ":",
                            "&",
                            "%",
                            "~"
                        ],
                        synlen = syntax.length,
                        plusequal = function lexer_script_operator_plusequal(op) {
                            let walk        = parse.count,
                                inc         = 0;
                            const toke        = op.charAt(0),
                                store       = [],
                                applyStore  = function lexer_script_plusplus_applyStore():void {
                                    let x:number = 0;
                                    const y:number = store.length;
                                    if (x < y) {
                                        do {
                                            parse.push(data, store[x], "");
                                            x            = x + 1;
                                        } while (x < y);
                                    }
                                },
                                end         = function lexer_script_operator_plusequal_end():void {
                                    walk = data.begin[walk] - 1;
                                    if (data.types[walk] === "end") {
                                        lexer_script_operator_plusequal_end();
                                    } else if (data.token[walk - 1] === ".") {
                                        period();
                                    }
                                },
                                period      = function lexer_script_operator_plusequal_period():void {
                                    walk = walk - 2;
                                    if (data.types[walk] === "end") {
                                        end();
                                    } else if (data.token[walk - 1] === ".") {
                                        lexer_script_operator_plusequal_period();
                                    }
                                };
                            if (data.types[walk] === "end") {
                                end();
                            } else if (data.token[walk - 1] === ".") {
                                period();
                            }
                            inc = walk;
                            do {
                                store.push({
                                    begin: data.begin[inc],
                                    lexer: data.lexer[inc],
                                    lines: data.lines[inc],
                                    presv: data.presv[inc],
                                    stack: data.stack[inc],
                                    token: data.token[inc],
                                    types: data.types[inc]
                                });
                                inc = inc + 1;
                            } while (inc < parse.count);
                            ltoke = "=";
                            ltype = "operator";
                            recordPush("");
                            applyStore();
                            return toke;
                        };
                    if (wordTest > -1) {
                        word();
                    }
                    if (c[a] === "/" && (parse.count > -1 && ((ltype !== "word" && ltype !== "reference") || ltoke === "typeof" || ltoke === "return" || ltoke === "else") && ltype !== "number" && ltype !== "string" && ltype !== "end")) {
                        if (ltoke === "return" || ltoke === "typeof" || ltoke === "else" || ltype !== "word") {
                            ltoke = regex();
                            ltype = "regex";
                        } else {
                            ltoke = "/";
                            ltype = "operator";
                        }
                        recordPush("");
                        return "regex";
                    }
                    if (c[a] === "?" && ("+-*/".indexOf(c[a + 1]) > -1 || (c[a + 1] === ":" && syntax.join("").indexOf(c[a + 2]) < 0))) {
                        return "?";
                    }
                    if (c[a] === ":" && "+-*/".indexOf(c[a + 1]) > -1) {
                        return ":";
                    }
                    if (a < b - 1) {
                        if (c[a] !== "<" && c[a + 1] === "<") {
                            return c[a];
                        }
                        if (c[a] === "!" && c[a + 1] === "/") {
                            return "!";
                        }
                        if (c[a] === "-") {
                            if (c[a + 1] === "-") {
                                output = "--";
                            } else if (c[a + 1] === "=") {
                                output = "-=";
                            } else if (c[a + 1] === ">") {
                                output = "->";
                            }
                            if (output === "") {
                                return "-";
                            }
                        }
                        if (c[a] === "+") {
                            if (c[a + 1] === "+") {
                                output = "++";
                            } else if (c[a + 1] === "=") {
                                output = "+=";
                            }
                            if (output === "") {
                                return "+";
                            }
                        }
                        if (c[a] === "=" && c[a + 1] !== "=" && c[a + 1] !== "!" && c[a + 1] !== ">") {
                            return "=";
                        }
                    }
                    if (c[a] === ":" && (data.types[parse.count] === "word" || data.types[parse.count] === "reference") && data.token[parse.count - 1] === "[") {
                        parse.structure[parse.structure.length - 1][0] = "attribute";
                        data.stack[parse.count] = "attribute";
                    }
                    if (output === "") {
                        if ((c[a + 1] === "+" && c[a + 2] === "+") || (c[a + 1] === "-" && c[a + 2] === "-")) {
                            output = c[a];
                        } else {
                            const buildout  = [c[a]];
                            g = a + 1;
                            if (g < jj) {
                                do {
                                    if ((c[g] === "+" && c[g + 1] === "+") || (c[g] === "-" && c[g + 1] === "-")) {
                                        break;
                                    }
                                    h = 0;
                                    if (h < synlen) {
                                        do {
                                            if (c[g] === syntax[h]) {
                                                buildout.push(syntax[h]);
                                                break;
                                            }
                                            h = h + 1;
                                        } while (h < synlen);
                                    }
                                    if (h === synlen) {
                                        break;
                                    }
                                    g = g + 1;
                                } while (g < jj);
                            }
                            output = buildout.join("");
                        }
                    }
                    a = a + (output.length - 1);
                    if (output === "=>" && ltoke === ")") {
                        g  = parse.count;
                        jj = data.begin[g];
                        do {
                            if (data.begin[g] === jj) {
                                data.stack[g] = "method";
                            }
                            g = g - 1;
                        } while (g > jj - 1);
                    }
                    if (output.length === 2 && output.charAt(1) === "=" && "!=<>|&?".indexOf(output.charAt(0)) < 0 && options.correct === true) {
                        return plusequal(output);
                    }
                    return output;
                },
                // ES6 template string support
                tempstring     = function lexer_script_tempstring():string {
                    const output:string[] = [c[a]];
                    a = a + 1;
                    if (a < b) {
                        do {
                            output.push(c[a]);
                            if (c[a] === "`" && (c[a - 1] !== "\\" || slashes(a - 1) === false)) {
                                templateString.pop();
                                break;
                            }
                            if (c[a - 1] === "$" && c[a] === "{" && (c[a - 2] !== "\\" || slashes(a - 2) === false)) {
                                templateString[templateString.length - 1] = true;
                                break;
                            }
                            a = a + 1;
                        } while (a < b);
                    }
                    return output.join("");
                },
                // a tokenizer for numbers
                numb           = function lexer_script_number():string {
                    const f:number     = b,
                        build:string[] = [c[a]];
                    let ee:number    = 0,
                        test:RegExp  = /zz/,
                        dot:boolean   = (build[0] === ".");
                    if (a < b - 2 && c[a] === "0") {
                        if (c[a + 1] === "x") {
                            test = /[0-9a-fA-F]/;
                        } else if (c[a + 1] === "o") {
                            test = /[0-9]/;
                        } else if (c[a + 1] === "b") {
                            test = /0|1/;
                        }
                        if (test.test(c[a + 2]) === true) {
                            build.push(c[a + 1]);
                            ee = a + 1;
                            do {
                                ee = ee + 1;
                                build.push(c[ee]);
                            } while (test.test(c[ee + 1]) === true);
                            a = ee;
                            return build.join("");
                        }
                    }
                    ee = a + 1;
                    if (ee < f) {
                        do {
                            if ((/[0-9]/).test(c[ee]) || (c[ee] === "." && dot === false)) {
                                build.push(c[ee]);
                                if (c[ee] === ".") {
                                    dot = true;
                                }
                            } else {
                                break;
                            }
                            ee = ee + 1;
                        } while (ee < f);
                    }
                    if (ee < f - 1 && ((/\d/).test(c[ee - 1]) === true || ((/\d/).test(c[ee - 2]) === true && (c[ee - 1] === "-" || c[ee - 1] === "+"))) && (c[ee] === "e" || c[ee] === "E")) {
                        build.push(c[ee]);
                        if (c[ee + 1] === "-" || c[ee + 1] === "+") {
                            build.push(c[ee + 1]);
                            ee = ee + 1;
                        }
                        dot = false;
                        ee  = ee + 1;
                        if (ee < f) {
                            do {
                                if ((/[0-9]/).test(c[ee]) || (c[ee] === "." && dot === false)) {
                                    build.push(c[ee]);
                                    if (c[ee] === ".") {
                                        dot = true;
                                    }
                                } else {
                                    break;
                                }
                                ee = ee + 1;
                            } while (ee < f);
                        }
                    }
                    a = ee - 1;
                    return build.join("");
                },
                // Identifies blocks of markup embedded within JavaScript for language supersets
                // like React JSX.
                markup         = function lexer_script_markup():void {
                    let curlytest:boolean   = false,
                        endtag:boolean      = false,
                        anglecount:number  = 0,
                        curlycount:number  = 0,
                        tagcount:number    = 0,
                        d:number           = 0,
                        next:string        = "",
                        output:string[]      = [];
                    const syntaxnum:string   = "0123456789=<>+-*?|^:&.,;%(){}[]~",
                        syntax:string      = "=<>+-*?|^:&.,;%(){}[]~",
                        applyMarkup = function lexer_script_markup_applyMarkup():void {
                            if (ltoke === "(") {
                                parse.structure[parse.structure.length - 1] = ["paren", parse.count];
                            }
                            framework.lexer.markup(output.join(""));
                        };
                    if (wordTest > -1) {
                        word();
                    }
                    d = parse.count;
                    if (data.types[d] === "comment") {
                        do {
                            d = d - 1;
                        } while (
                            d > 0 && data.types[d] === "comment"
                        );
                    }
                    if (c[a] === "<" && c[a + 1] === ">") {
                        a     = a + 1;
                        ltype = "generic";
                        ltoke = "<>";
                        return;
                    }
                    if ((c[a] !== "<" && syntaxnum.indexOf(c[a + 1]) > -1) || data.token[d] === "++" || data.token[d] === "--" || (/\s/).test(c[a + 1]) === true || ((/\d/).test(c[a + 1]) === true && (ltype === "operator" || ltype === "string" || ltype === "number" || ltype === "reference" || (ltype === "word" && ltoke !== "return")))) {
                        ltype = "operator";
                        ltoke = operator();
                        return recordPush("");
                    }
                    if (options.language !== "typescript" && (data.token[d] === "return" || data.types[d] === "operator" || data.types[d] === "start" || data.types[d] === "separator" || data.types[d] === "jsx_attribute_start" || (data.token[d] === "}" && parse.structure[parse.structure.length - 1][0] === "global"))) {
                        ltype        = "markup";
                        options.language = "jsx";
                    } else if (options.language === "typescript" || data.token[parse.count] === "#include" || (((/\s/).test(c[a - 1]) === false || ltoke === "public" || ltoke === "private" || ltoke === "static" || ltoke === "final" || ltoke === "implements" || ltoke === "class" || ltoke === "void" || ltoke === "Promise") && syntaxnum.indexOf(c[a + 1]) < 0)) {
                        // Java type generics
                        let comma:boolean    = false,
                            e:number        = 1,
                            f:number        = 0;
                        const generics:string[] = [
                                "<",
                                c[a + 1]
                            ],
                            jj:number = b;
                        if (c[a + 1] === "<") {
                            e = 2;
                        }
                        d = a + 2;
                        if (d < jj) {
                            do {
                                generics.push(c[d]);
                                if (c[d] === "?" && c[d + 1] === ">") {
                                    generics.push(">");
                                    d = d + 1;
                                }
                                if (c[d] === ",") {
                                    comma = true;
                                    if ((/\s/).test(c[d + 1]) === false) {
                                        generics.push(" ");
                                    }
                                } else if (c[d] === "[") {
                                    f = f + 1;
                                } else if (c[d] === "]") {
                                    f = f - 1;
                                } else if (c[d] === "<") {
                                    e = e + 1;
                                } else if (c[d] === ">") {
                                    e = e - 1;
                                    if (e === 0 && f === 0) {
                                        if ((/\s/).test(c[d - 1]) === true) {
                                            ltype = "operator";
                                            ltoke = operator();
                                            recordPush("");
                                            return;
                                        }
                                        ltype = "generic";
                                        a     = d;
                                        ltoke = generics
                                            .join("")
                                            .replace(/\s+/g, " ");
                                        return recordPush("");
                                    }
                                }
                                if ((syntax.indexOf(c[d]) > -1 && c[d] !== "," && c[d] !== "<" && c[d] !== ">" && c[d] !== "[" && c[d] !== "]") || (comma === false && (/\s/).test(c[d]) === true)) {
                                    ltype = "operator";
                                    ltoke = operator();
                                    recordPush("");
                                    return;
                                }
                                d = d + 1;
                            } while (d < jj);
                        }
                        return;
                    } else {
                        ltype = "operator";
                        ltoke = operator();
                        recordPush("");
                        return;
                    }
                    do {
                        output.push(c[a]);
                        if (c[a] === "{") {
                            curlycount = curlycount + 1;
                            curlytest  = true;
                        } else if (c[a] === "}") {
                            curlycount = curlycount - 1;
                            if (curlycount === 0) {
                                curlytest = false;
                            }
                        } else if (c[a] === "<" && curlytest === false) {
                            if (c[a + 1] === "<") {
                                do {
                                    output.push(c[a]);
                                    a = a + 1;
                                } while (a < b && c[a + 1] === "<");
                            }
                            anglecount = anglecount + 1;
                            if (c[a + 1] === "/") {
                                endtag = true;
                            }
                        } else if (c[a] === ">" && curlytest === false) {
                            if (c[a + 1] === ">") {
                                do {
                                    output.push(c[a]);
                                    a = a + 1;
                                } while (c[a + 1] === ">");
                            }
                            anglecount = anglecount - 1;
                            if (endtag === true) {
                                tagcount = tagcount - 1;
                            } else if (c[a - 1] !== "/") {
                                tagcount = tagcount + 1;
                            }
                            if (anglecount === 0 && curlycount === 0 && tagcount < 1) {
                                next = nextchar(2, false);
                                if (next.charAt(0) !== "<") {
                                    // if followed by nonmarkup
                                    return applyMarkup();
                                }
                                // catch additional trailing tag sets
                                if (next.charAt(0) === "<" && syntaxnum.indexOf(next.charAt(1)) < 0 && (/\s/).test(next.charAt(1)) === false) {
                                    // perform a minor safety test to verify if "<" is a tag start or a less than
                                    // operator
                                    d = a + 1;
                                    do {
                                        d = d + 1;
                                        if (c[d] === ">" || ((/\s/).test(c[d - 1]) === true && syntaxnum.indexOf(c[d]) < 0)) {
                                            break;
                                        }
                                        if (syntaxnum.indexOf(c[d]) > -1) {
                                            // if followed by additional markup tags
                                            return applyMarkup();
                                        }
                                    } while (d < b);
                                } else {
                                    // if a nonmarkup "<" follows markup
                                    return applyMarkup();
                                }
                            }
                            endtag = false;
                        }
                        a = a + 1;
                    } while (a < b);
                    return applyMarkup();
                },
                // operations for end types: ), ], }
                end            = function lexer_script_end(x:string):void {
                    let insert:boolean   = false;
                    const next:string     = nextchar(1, false),
                        newarray = function lexer_script_end_newarray():void {
                            let bb:number       = 0,
                                cc:number       = 0,
                                arraylen:number = 0;
                            const aa:number       = data.begin[parse.count],
                                ar:boolean       = (data.token[data.begin[parse.count] - 1] === "Array"),
                                startar:string  = (ar === true)
                                    ? "["
                                    : "{",
                                endar:string    = (ar === true)
                                    ? "]"
                                    : "}",
                                namear:string   = (ar === true)
                                    ? "array"
                                    : "object";
                            tempstore    = parse.pop(data);
                            if (ar === true && data.token[parse.count - 1] === "(" && data.types[parse.count] === "number") {
                                arraylen                        = data.begin[parse.count] - 1;
                                tempstore                       = parse.pop(data);
                                tempstore                       = parse.pop(data);
                                tempstore                       = parse.pop(data);
                                data.token[parse.count]        = "[";
                                data.types[parse.count]        = "start";
                                data.lines[parse.count]        = 0;
                                data.stack[parse.count]        = "array";
                                data.begin[parse.count]        = parse.count;
                                parse.structure[parse.structure.length - 1] = ["array", parse.count];
                                ltoke                           = ",";
                                ltype                           = "separator";
                                do {
                                    recordPush("");
                                    arraylen = arraylen - 1;
                                } while (arraylen > 0);
                            } else {
                                data.token[aa]                  = startar;
                                data.types[aa]                  = "start";
                                cc                              = data.begin[aa];
                                parse.splice({
                                    data   : data,
                                    howmany: 2,
                                    index  : aa - 2,
                                    record : {
                                        begin: 0,
                                        lexer: "",
                                        lines: 0,
                                        presv: false,
                                        stack: "",
                                        token: "",
                                        types: ""
                                    }
                                });
                                parse.structure[parse.structure.length - 1] = [
                                    namear, aa - 2
                                ];
                                pstack                          = [namear, aa];
                                bb                              = parse.count;
                                do {
                                    if (data.begin[bb] === cc) {
                                        data.stack[bb] = namear;
                                        data.begin[bb] = data.begin[bb] - 2;
                                    }
                                    bb = bb - 1;
                                } while (bb > aa - 3);
                            }
                            ltoke = endar;
                            ltype = "end";
                            recordPush("");
                        };
                    if (wordTest > -1) {
                        word();
                    }
                    if (classy.length > 0) {
                        if (classy[classy.length - 1] === 0) {
                            classy.pop();
                        } else {
                            classy[classy.length - 1] = classy[classy.length - 1] - 1;
                        }
                    }
                    if (x === ")" || x === "x)" || x === "]") {
                        if (options.correct === true) {
                            plusplus();
                        }
                        asifix();
                    }
                    if (x === ")" || x === "x)") {
                        asi(false);
                    }
                    if (vart.len > -1) {
                        if (x === "}" && ((options.lexerOptions.script.varword === "list" && vart.count[vart.len] === 0) || (data.token[parse.count] === "x;" && options.lexerOptions.script.varword === "each"))) {
                            vartpop();
                        }
                        vart.count[vart.len] = vart.count[vart.len] - 1;
                        if (vart.count[vart.len] < 0) {
                            vartpop();
                        }
                    }
                    if (ltoke === "," && data.stack[parse.count] !== "initializer" && ((x === "]" && data.token[parse.count - 1] === "[") || x === "}")) {
                        tempstore    = parse.pop(data);
                    }
                    if (x === ")" || x === "x)") {
                        ltoke = x;
                        ltype = "end";
                        if (lword.length > 0) {
                            pword = lword[lword.length - 1];
                            if (pword.length > 1 && next !== "{" && (pword[0] === "if" || pword[0] === "for" || (pword[0] === "while" && data.stack[pword[1] - 2] !== undefined && data.stack[pword[1] - 2] !== "do") || pword[0] === "with")) {
                                insert = true;
                            }
                        }
                    } else if (x === "]") {
                        ltoke = "]";
                        ltype = "end";
                    } else if (x === "}") {
                        if (ltoke !== "," && options.correct === true) {
                            plusplus();
                        }
                        if (parse.structure.length > 0 && parse.structure[parse.structure.length - 1][0] !== "object") {
                            asi(true);
                        }
                        if (options.lexerOptions.script.objectSort === true && parse.structure[parse.structure.length - 1][0] === "object") {
                            parse.objectSort(data);
                        }
                        if (ltype === "comment") {
                            ltoke = data.token[parse.count];
                            ltype = data.types[parse.count];
                        }
                        ltoke = "}";
                        ltype = "end";
                    }
                    lword.pop();
                    pstack = parse.structure[parse.structure.length - 1];
                    if (x === ")" && options.correct === true && (data.token[data.begin[parse.count] - 1] === "Array" || data.token[data.begin[parse.count] - 1] === "Object") && data.token[data.begin[parse.count] - 2] === "new") {
                        newarray();
                    }
                    if (brace[brace.length - 1] === "x{" && x === "}") {
                        blockinsert();
                        brace.pop();
                        if (data.stack[parse.count] !== "try") {
                            if (next !== ":" && next !== ";" && data.token[data.begin[a] - 1] !== "?") {
                                blockinsert();
                            }
                        }
                        ltoke = "}";
                    } else {
                        brace.pop();
                    }
                    recordPush("");
                    if (ltoke === "}" && data.stack[parse.count] !== "object") {
                        references.pop();
                    }
                    if (insert === true) {
                        ltoke = "x{";
                        ltype = "start";
                        recordPush(pword[0]);
                        brace.push("x{");
                        pword[1] = parse.count;
                    }
                },
                // determines tag names for {% %} based template tags and returns a type
                tname          = function lexer_script_tname(x:string):string {
                    let sn:number       = 2,
                        en:number       = 0,
                        name:string     = "";
                    const st:string       = x.slice(0, 2),
                        len:number      = x.length,
                        namelist:string[] = [
                            "autoescape",
                            "block",
                            "capture",
                            "case",
                            "comment",
                            "embed",
                            "filter",
                            "for",
                            "form",
                            "if",
                            "macro",
                            "paginate",
                            "raw",
                            "sandbox",
                            "spaceless",
                            "tablerow",
                            "unless",
                            "verbatim"
                        ];
                    if (x.charAt(2) === "-") {
                        sn = sn + 1;
                    }
                    if ((/\s/).test(x.charAt(sn)) === true) {
                        do {
                            sn = sn + 1;
                        } while ((/\s/).test(x.charAt(sn)) === true && sn < len);
                    }
                    en = sn;
                    do {
                        en = en + 1;
                    } while (
                        (/\s/).test(x.charAt(en)) === false && x.charAt(en) !== "(" && en < len
                    );
                    if (en === len) {
                        en = x.length - 2;
                    }
                    name = x.slice(sn, en);
                    if (name === "else" || (st === "{%" && (name === "elseif" || name === "when" || name === "elif"))) {
                        return "template_else";
                    }
                    if (st === "{{") {
                        if (name === "end") {
                            return "template_end";
                        }
                        if (name === "block" || name === "define" || name === "form" || name === "if" || name === "range" || name === "with") {
                            return "template_start";
                        }
                        return "template";
                    }
                    en = namelist.length - 1;
                    if (en > -1) {
                        do {
                            if (name === namelist[en]) {
                                return "template_start";
                            }
                            if (name === "end" + namelist[en]) {
                                return "template_end";
                            }
                            en = en - 1;
                        } while (en > -1);
                    }
                    return "template";
                },
                // operations for start types: (, [, {
                start          = function lexer_script_start(x:string):void {
                    let aa:number    = parse.count,
                        wordx:string = "",
                        wordy:string = "",
                        stack:string = "";
                    brace.push(x);
                    if (wordTest > -1) {
                        word();
                        aa = parse.count;
                    }
                    if (vart.len > -1) {
                        vart.count[vart.len] = vart.count[vart.len] + 1;
                    }
                    if (data.token[aa - 1] === "function") {
                        lword.push([
                            "function", aa + 1
                        ]);
                    } else {
                        lword.push([
                            ltoke, aa + 1
                        ]);
                    }
                    ltoke = x;
                    ltype = "start";
                    if (x === "(" || x === "x(") {
                        asifix();
                    } else if (x === "{") {
                        if (paren > -1) {
                            if (data.begin[paren - 1] === data.begin[data.begin[aa] - 1] || data.token[data.begin[aa]] === "x(") {
                                paren = -1;
                                end("x)");
                                asifix();
                                ltoke = "{";
                                ltype = "start";
                            }
                        } else if (ltoke === ")") {
                            asifix();
                        }
                        if (ltype === "comment" && data.token[aa - 1] === ")") {
                            ltoke                    = data.token[aa];
                            data.token[aa] = "{";
                            ltype                    = data.types[aa];
                            data.types[aa] = "start";
                        }
                    }
                    wordx = (function lexer_script_start_wordx():string {
                        let bb:number = parse.count;
                        if (data.types[bb] === "comment") {
                            do {
                                bb = bb - 1;
                            } while (bb > 0 && data.types[bb] === "comment");
                        }
                        return data.token[bb];
                    }());
                    wordy = (data.stack[aa] === undefined)
                        ? ""
                        : (function lexer_script_start_wordy():string {
                            let bb:number = parse.count;
                            if (data.types[bb] === "comment") {
                                do {
                                    bb = bb - 1;
                                } while (bb > 0 && data.types[bb] === "comment");
                            }
                            return data.token[data.begin[bb] - 1];
                        }());
                    if (ltoke === "{" || ltoke === "x{") {
                        if (wordx === "else" || wordx === "do" || wordx === "try" || wordx === "finally" || wordx === "switch") {
                            stack = wordx;
                        } else if (classy[classy.length - 1] === 0 && wordx !== "return") {
                            classy.pop();
                            stack = "class";
                        } else if (data.token[aa - 1] === "class") {
                            stack = "class";
                        } else if (data.token[aa] === "]" && data.token[aa - 1] === "[") {
                            stack = "array";
                        } else if (
                            (data.types[aa] === "word" || data.types[aa] === "reference") &&
                            (
                                data.types[aa - 1] === "word" ||
                                data.types[aa - 1] === "reference" ||
                                (data.token[aa - 1] === "?" && (data.types[aa - 2] === "word" || data.types[aa - 2] === "reference"))
                            ) &&
                            data.token[aa] !== "in" &&
                            data.token[aa - 1] !== "export" &&
                            data.token[aa - 1] !== "import"
                        ) {
                            stack = "map";
                        } else if (
                            data.stack[aa] === "method" &&
                            data.types[aa] === "end" &&
                            (data.types[data.begin[aa] - 1] === "word" || data.types[data.begin[aa] - 1] === "reference") &&
                            data.token[data.begin[aa] - 2] === "new"
                        ) {
                            stack = "initializer";
                        } else if (
                            ltoke === "{" &&
                            (wordx === ")" || wordx === "x)") &&
                            (data.types[data.begin[aa] - 1] === "word" || data.types[data.begin[aa] - 1] === "reference" || data.token[data.begin[aa] - 1] === "]")
                        ) {
                            if (wordy === "if") {
                                stack = "if";
                            } else if (wordy === "for") {
                                stack = "for";
                            } else if (wordy === "while") {
                                stack = "while";
                            } else if (wordy === "class") {
                                stack = "class";
                            } else if (wordy === "switch" || data.token[data.begin[aa] - 1] === "switch") {
                                stack = "switch";
                            } else if (wordy === "catch") {
                                stack = "catch";
                            } else {
                                stack = "function";
                            }
                        } else if (ltoke === "{" && (wordx === ";" || wordx === "x;")) {
                            // ES6 block
                            stack = "block";
                        } else if (ltoke === "{" && data.token[aa] === ":" && data.stack[aa] === "switch") {
                            // ES6 block
                            stack = "block";
                        } else if (data.token[aa - 1] === "import" || data.token[aa - 2] === "import" || data.token[aa - 1] === "export" || data.token[aa - 2] === "export") {
                            stack = "object";
                        } else if (wordx === ")" && (pword[0] === "function" || pword[0] === "if" || pword[0] === "for" || pword[0] === "class" || pword[0] === "while" || pword[0] === "switch" || pword[0] === "catch")) {
                            // if preceeded by a paren the prior containment is preceeded by a keyword if
                            // (...) {
                            stack = pword[0];
                        } else if (data.stack[aa] === "notation") {
                            // if following a TSX array type declaration
                            stack = "function";
                        } else if (
                            (
                                data.types[aa] === "number" ||
                                data.types[aa] === "string" ||
                                data.types[aa] === "word" ||
                                data.types[aa] === "reference"
                            ) &&
                            (data.types[aa - 1] === "word" || data.types[aa - 1] === "reference") &&
                            data.token[data.begin[aa] - 1] !== "for"
                        ) {
                            // if preceed by a word and either string or word public class {
                            stack = "function";
                        } else if (parse.structure.length > 0 && data.token[aa] !== ":" && parse.structure[parse.structure.length - 1][0] === "object" && (
                            data.token[data.begin[aa] - 2] === "{" || data.token[data.begin[aa] - 2] === ","
                        )) {
                            // if an object wrapped in some containment which is itself preceeded by a curly
                            // brace or comma var a={({b:{cat:"meow"}})};
                            stack = "function";
                        } else if (data.types[pword[1] - 1] === "markup" && data.token[pword[1] - 3] === "function") {
                            // checking for TSX function using an angle brace name
                            stack = "function";
                        } else if (wordx === "=>") {
                            // checking for fat arrow assignment
                            stack = "function";
                        } else if (
                            wordx === ")" &&
                            data.stack[aa] === "method" &&
                            (data.types[data.begin[aa] - 1] === "word" || data.types[data.begin[aa] - 1] === "reference")
                        ) {
                            stack = "function";
                        } else if (data.types[aa] === "word" && ltoke === "{" && data.token[aa] !== "return" && data.token[aa] !== "in" && data.token[aa] !== "import" && data.token[aa] !== "const" && data.token[aa] !== "let" && data.token[aa] !== "") {
                            // ES6 block
                            stack = "block";
                        } else {
                            stack = "object";
                        }
                        if (stack !== "object") {
                            if (stack === "function") {
                                references.push(funreferences);
                                funreferences = [];
                            } else {
                                references.push([]);
                            }
                        }
                    } else if (ltoke === "[") {
                        if ((/\s/).test(c[a - 1]) === true && (data.types[aa] === "word" || data.types[aa] === "reference") && wordx !== "return" && options.language !== "twig") {
                            stack = "notation";
                        } else {
                            stack = "array";
                        }
                    } else if (ltoke === "(" || ltoke === "x(") {
                        if (wordx === "function" || data.token[aa - 1] === "function") {
                            stack = "arguments";
                        } else if (data.token[aa - 1] === "." || data.token[data.begin[aa] - 2] === ".") {
                            stack = "method";
                        } else if (data.types[aa] === "generic") {
                            stack = "method";
                        } else if (data.token[aa] === "}" && data.stack[aa] === "function") {
                            stack = "method";
                        } else if (wordx === "if" || wordx === "for" || wordx === "class" || wordx === "while" || wordx === "catch" || wordx === "switch" || wordx === "with") {
                            stack = "expression";
                        } else if (data.types[aa] === "word" || data.types[aa] === "reference") {
                            stack = "method";
                        } else {
                            stack = "paren";
                        }
                    }
                    recordPush(stack);
                    if (classy.length > 0) {
                        classy[classy.length - 1] = classy[classy.length - 1] + 1;
                    }
                };
            do {
                if ((/\s/).test(c[a]) === true) {
                    if (wordTest > -1) {
                        word();
                    }
                    a = parse.spacer({array: c, end: b, index: a});
                    if (parse.linesSpace > 1 && ltoke !== ";" && lengthb < parse.count && c[a + 1] !== "}") {
                        asi(false);
                        lengthb = parse.count;
                    }
                } else if (c[a] === "<" && c[a + 1] === "?" && c[a + 2] === "p" && c[a + 3] === "h" && c[a + 4] === "p") {
                    // php
                    ltoke = generic("<?php", "?>");
                    ltype = "template";
                    recordPush("");
                } else if (c[a] === "<" && c[a + 1] === "%") {
                    // asp
                    ltoke = generic("<%", "%>");
                    ltype = "template";
                    recordPush("");
                } else if (c[a] === "{" && c[a + 1] === "%") {
                    // twig
                    ltoke = generic("{%", "%}");
                    ltype = tname(ltoke);
                    recordPush("");
                } else if (c[a] === "{" && c[a + 1] === "{" && c[a + 2] === "{") {
                    // mustache
                    ltoke = generic("{{{", "}}}");
                    ltype = "template";
                    recordPush("");
                } else if (c[a] === "{" && c[a + 1] === "{") {
                    // handlebars
                    ltoke = generic("{{", "}}");
                    ltype = tname(ltoke);
                    recordPush("");
                } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-" && c[a + 4] === "#") {
                    // ssi
                    ltoke = generic("<!--#", "-->");
                    ltype = "template";
                    recordPush("");
                } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-") {
                    // markup comment
                    ltoke = generic("<!--", "-->");
                    ltype = "comment";
                    recordPush("");
                } else if (c[a] === "<") {
                    // markup
                    markup();
                } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "*")) {
                    // comment block
                    blockComment();
                } else if ((parse.count < 0 || data.lines[parse.count] > 0) && c[a] === "#" && c[a + 1] === "!" && (c[a + 2] === "/" || c[a + 2] === "[")) {
                    // shebang
                    ltoke      = generic("#!" + c[a + 2], "\n");
                    ltoke      = ltoke.slice(0, ltoke.length - 1);
                    ltype      = "string";
                    parse.linesSpace = 2;
                    recordPush("");
                } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "/")) {
                    // comment line
                    lineComment();
                } else if (c[a] === "#" && c[a + 1] === "r" && c[a + 2] === "e" && c[a + 3] === "g" && c[a + 4] === "i" && c[a + 5] === "o" && c[a + 6] === "n" && (/\s/).test(c[a + 7]) === true) {
                    // comment line
                    asi(false);
                    ltoke = generic("#region", "\n");
                    ltype = "comment";
                    recordPush("");
                } else if (c[a] === "#" && c[a + 1] === "e" && c[a + 2] === "n" && c[a + 3] === "d" && c[a + 4] === "r" && c[a + 5] === "e" && c[a + 6] === "g" && c[a + 7] === "i" && c[a + 8] === "o" && c[a + 9] === "n") {
                    // comment line
                    asi(false);
                    ltoke = generic("#endregion", "\n");
                    ltype = "comment";
                    recordPush("");
                } else if (c[a] === "`" || (c[a] === "}" && templateString[templateString.length - 1] === true)) {
                    // template string
                    if (wordTest > -1) {
                        word();
                    }
                    if (c[a] === "`") {
                        templateString.push(false);
                    } else {
                        templateString[templateString.length - 1] = false;
                    }
                    ltoke = tempstring();
                    ltype = "string";
                    recordPush("");
                } else if (c[a] === "\"" || c[a] === "'") {
                    // string
                    ltoke = generic(c[a], c[a]);
                    if (options.language === "json") {
                        ltype = "string";
                        recordPush("");
                    } else if (ltoke.length > options.wrap && options.wrap > 0) {
                        wrapString(false, ltoke);
                    } else if (options.wrap !== 0 && nextchar(1, false) === "+") {
                        wrapString(true, ltoke);
                    } else {
                        ltype = "string";
                        recordPush("");
                    }
                } else if (
                    c[a] === "-" &&
                    (a < b - 1 && c[a + 1] !== "=" && c[a + 1] !== "-") &&
                    (ltype === "number" || ltype === "word" || ltype === "reference") &&
                    ltoke !== "return" &&
                    (ltoke === ")" || ltoke === "]" || ltype === "word" || ltype === "reference" || ltype === "number")
                ) {
                    // subtraction
                    if (wordTest > -1) {
                        word();
                    }
                    ltoke = "-";
                    ltype = "operator";
                    recordPush("");
                } else if (wordTest === -1 && (c[a] !== "0" || (c[a] === "0" && c[a + 1] !== "b")) && ((/\d/).test(c[a]) || (a !== b - 2 && c[a] === "-" && c[a + 1] === "." && (/\d/).test(c[a + 2])) || (a !== b - 1 && (c[a] === "-" || c[a] === ".") && (/\d/).test(c[a + 1])))) {
                    // number
                    if (wordTest > -1) {
                        word();
                    }
                    if (ltype === "end" && c[a] === "-") {
                        ltoke = "-";
                        ltype = "operator";
                    } else {
                        ltoke = numb();
                        ltype = "number";
                    }
                    recordPush("");
                } else if (c[a] === ":" && c[a + 1] === ":") {
                    if (wordTest > -1) {
                        word();
                    }
                    if (options.correct === true) {
                        plusplus();
                    }
                    asifix();
                    a     = a + 1;
                    ltoke = "::";
                    ltype = "separator";
                    recordPush("");
                } else if (c[a] === ",") {
                    // comma
                    if (wordTest > -1) {
                        word();
                    }
                    if (options.correct === true) {
                        plusplus();
                    }
                    if (ltype === "comment") {
                        commaComment();
                    } else if (vart.len > -1 && vart.count[vart.len] === 0 && options.lexerOptions.script.varword === "each") {
                        asifix();
                        ltoke = ";";
                        ltype = "separator";
                        recordPush("");
                        ltoke = vart.word[vart.len];
                        ltype = "reference";
                        recordPush("");
                        vart.index[vart.len] = parse.count;
                    } else {
                        ltoke = ",";
                        ltype = "separator";
                        asifix();
                        recordPush("");
                    }
                } else if (c[a] === ".") {
                    // period
                    if (wordTest > -1) {
                        word();
                    }
                    if (c[a + 1] === "." && c[a + 2] === ".") {
                        ltoke = "...";
                        ltype = "operator";
                        a     = a + 2;
                    } else {
                        asifix();
                        ltoke = ".";
                        ltype = "separator";
                    }
                    if ((/\s/).test(c[a - 1]) === true) {
                        parse.linesSpace = 1;
                    }
                    recordPush("");
                } else if (c[a] === ";") {
                    // semicolon
                    if (wordTest > -1) {
                        word();
                    }
                    if (options.language === "qml") {
                        ltoke = "x;";
                        ltype = "separator";
                        recordPush("");
                    } else {
                        if (classy[classy.length - 1] === 0) {
                            classy.pop();
                        }
                        if (vart.len > -1 && vart.count[vart.len] === 0) {
                            if (options.lexerOptions.script.varword === "each") {
                                vartpop();
                            } else {
                                vart.index[vart.len] = parse.count + 1;
                            }
                        }
                        if (options.correct === true) {
                            plusplus();
                        }
                        ltoke = ";";
                        ltype = "separator";
                        if (data.token[parse.count] === "x}") {
                            asibrace();
                        } else {
                            recordPush("");
                        }
                    }
                    if (brace[brace.length - 1] === "x{" && nextchar(1, false) !== "}") {
                        blockinsert();
                    }
                } else if (c[a] === "(" || c[a] === "[" || c[a] === "{") {
                    start(c[a]);
                } else if (c[a] === ")" || c[a] === "]" || c[a] === "}") {
                    end(c[a]);
                } else if (c[a] === "*" && data.stack[parse.count] === "object" && wordTest < 0 && (/\s/).test(c[a + 1]) === false && c[a + 1] !== "=" && (/\d/).test(c[a + 1]) === false) {
                    wordTest = a;
                } else if (c[a] === "=" || c[a] === "&" || c[a] === "<" || c[a] === ">" || c[a] === "+" || c[a] === "-" || c[a] === "*" || c[a] === "/" || c[a] === "!" || c[a] === "?" || c[a] === "|" || c[a] === "^" || c[a] === ":" || c[a] === "%" || c[a] === "~") {
                    // operator
                    ltoke = operator();
                    if (ltoke === "regex") {
                        ltoke = data.token[parse.count];
                    } else {
                        ltype = "operator";
                        if (ltoke !== "!" && ltoke !== "++" && ltoke !== "--") {
                            asifix();
                        }
                        recordPush("");
                    }
                } else if (wordTest < 0 && c[a] !== "") {
                    wordTest = a;
                }
                if (vart.len > -1 && parse.count === vart.index[vart.len] + 1 && data.token[vart.index[vart.len]] === ";" && ltoke !== vart.word[vart.len] && ltype !== "comment" && options.lexerOptions.script.varword === "list") {
                    vartpop();
                }
                a = a + 1;
            } while (a < b);
            if (wordTest > -1) {
                word();
            }
            if (options.correct === true && ((data.token[parse.count] !== "}" && data.token[0] === "{") || data.token[0] !== "{") && ((data.token[parse.count] !== "]" && data.token[0] === "[") || data.token[0] !== "[")) {
                asi(false);
            }
            if (sourcemap[0] === parse.count) {
                ltoke = "\n" + sourcemap[1];
                ltype = "string";
                recordPush("");
            }
            if (data.token[parse.count] === "x;" && (data.token[parse.count - 1] === "}" || data.token[parse.count - 1] === "]") && data.begin[parse.count - 1] === 0) {
                tempstore    = parse.pop(data);
            }

            if (options.correct === true) {
                let aa:number = 0;
                const bb:number = parse.count + 1;
                do {
                    if (data.token[aa] === "x;") {
                        data.token[aa] = ";";
                    } else if (data.token[aa] === "x{") {
                        data.token[aa] = "{";
                    } else if (data.token[aa] === "x}") {
                        data.token[aa] = "}";
                    } else if (data.token[aa] === "x(") {
                        data.token[aa] = "(";
                    } else if (data.token[aa] === "x)") {
                        data.token[aa] = ")";
                    }
                    aa = aa + 1;
                } while (aa < bb);
            }
            return data;
        };
    
    framework.lexer.script = script;
}());
