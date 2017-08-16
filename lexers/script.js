/*global global*/
(function script_init() {
    "use strict";
    var lexer = global.lexer,
        script = function lexer_script(source) {
            var parse          = global.parse,
                data           = parse.data,
                options        = parse.options,
                
                sourcemap      = [
                    0, ""
                ],
                json           = (options.lang === "json"),
                scolon         = 0,
                a              = 0,
                b              = source.length,
                c              = source.split(""),
                ltoke          = "",
                ltype          = "",
                lword          = [],
                brace          = [],
                pword          = [],
                lengthb        = 0,
                wordTest       = -1,
                paren          = -1,
                classy         = [],
                tempstore      = {},
                pstack         = [],
                //depth and status of templateStrings
                templateString = [],
                //identify variable declarations
                vart           = {
                    count: [],
                    index: [],
                    len  : -1,
                    word : []
                },
                //operations for start types: (, [, {
                start          = function lexer_script_startInit() {
                    return;
                },
                //peek at whats up next
                nextchar       = function lexer_script_nextchar(len, current) {
                    var front = (current === true)
                            ? a
                            : a + 1,
                        cc    = front,
                        dd    = "";
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
                //cleans up improperly applied ASI
                asifix         = function lexer_script_asifix() {
                    var len = parse.count;
                    do {
                        len = len - 1;
                    } while (
                        len > 0 && data.types[len] === "comment"
                    );
                    if (data.token[len] === "from") {
                        len = len - 2;
                    }
                    if (data.token[len] === "x;") {
                        parse.splice(
                            {data: data, howmany: 1, index: len, record: {}}
                        );
                    }
                },
                //determine the definition of containment by stack
                recordPush      = function lexer_script_recordPush(structure) {
                    var record = {
                        begin: parse.structure[parse.structure.length - 1][1],
                        lexer: "script",
                        lines: parse.linesSpace,
                        presv: false,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: ltoke,
                        types: ltype
                    };
                    parse.push(data, record, structure);
                },
                //inserts ending curly brace (where absent)
                blockinsert    = function lexer_script_blockinsert() {
                    var next = nextchar(5, false),
                        g    = parse.count,
                        name = "";
                    if (json === true) {
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
                            recordPush("");
                            pstack = parse.structure.pop();
                            brace.pop();
                            return;
                        }
                        //to prevent the semicolon from inserting between the braces --> while (x) {};
                        tempstore    = parse.pop(data);
                        ltoke        = "x}";
                        ltype        = "end";
                        recordPush("");
                        brace.pop();
                        pstack       = parse.structure.pop();
                        ltoke        = ";";
                        ltype        = "end";
                        parse.push(data, tempstore);
                        return;
                    }
                    ltoke = "x}";
                    ltype = "end";
                    if (data.token[parse.count] === "x}") {
                        return;
                    }
                    if (data.stack[parse.count] === "if" && (data.token[parse.count] === ";" || data.token[parse.count] === "x;") && next === "else") {
                        recordPush("");
                        brace.pop();
                        pstack = parse.structure.pop();
                        return;
                    }
                    do {
                        recordPush("");
                        brace.pop();
                        pstack = parse.structure.pop();
                        if (data.stack[parse.count] === "do") {
                            break;
                        }
                    } while (brace[brace.length - 1] === "x{");
                },
                //remove "vart" object data
                vartpop        = function lexer_script_vartpop() {
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
                //A lexer for keywords, reserved words, and variables
                word           = function lexer_script_word() {
                    var f        = wordTest,
                        g        = 1,
                        lex      = [],
                        build    = {},
                        output   = "",
                        nextitem = "",
                        elsefix  = function lexer_script_word_elsefix() {
                            brace.push("x{");
                            parse.splice({
                                data   : data,
                                howmany: 1,
                                index  : parse.count - 3,
                                record : {}
                            });
                        };
                    do {
                        lex.push(c[f]);
                        if (c[f] === "\\") {
                            global.parseerror = "Illegal escape in JavaScript on line number " + parse.lineNumber;
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
                        if (options.varword !== "none" && (output === "var" || output === "let" || output === "const")) {
                            if (data.types[g] === "comment") {
                                do {
                                    g = g - 1;
                                } while (
                                    g > 0 && (data.types[g] === "comment")
                                );
                            }
                            if (options.varword === "list" && vart.len > -1 && vart.index[vart.len] === g && output === vart.word[vart.len]) {
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
                        } else if (vart.len > -1 && output !== vart.word[vart.len] && parse.count === vart.index[vart.len] && data.token[vart.index[vart.len]] === ";" && ltoke !== vart.word[vart.len] && options.varword === "list") {
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
                                    {data: data, howmany: 1, index: f, record: {}}
                                );
                                g            = g - 1;
                                f            = f - 1;
                            }
                            do {
                                build        = {
                                    begin: data.begin[g],
                                    lexer: data.lexer[g],
                                    lines: data.lines[g],
                                    presv: data.presv[g],
                                    stack: data.stack[g],
                                    token: data.token[g],
                                    types: data.types[g]
                                };
                                tempstore    = parse.pop(data);
                                parse.splice({
                                    data   : data,
                                    howmany: 0,
                                    index  : g - 3,
                                    record : build
                                });
                                f            = f + 1;
                            } while (f < g);
                        }
                        if (output === "from" && data.token[parse.count] === "x;" && data.token[parse.count - 1] === "}") {
                            asifix();
                        }
                        if (output === "while" && data.token[parse.count] === "x;" && data.token[parse.count - 1] === "}") {
                            (function lexer_script_word_whilefix() {
                                var d = 0,
                                    e = parse.count - 2;
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
                            }());
                        }
                        ltoke = output;
                        ltype = "word";
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
                                    //fixes when "else" is following a block that isn't "if"
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
                    if ((output === "for" || output === "if" || output === "switch" || output === "catch") && options.lang !== "twig" && data.token[parse.count - 1] !== ".") {
                        nextitem = nextchar(1, true);
                        if (nextitem !== "(") {
                            paren = parse.count;
                            start("x(");
                        }
                    }
                },
                //determines if a slash comprises a valid escape or if it is escaped itself
                slashes        = function lexer_script_slashes(index) {
                    var slashy = index;
                    do {
                        slashy = slashy - 1;
                    } while (c[slashy] === "\\" && slashy > 0);
                    if ((index - slashy) % 2 === 1) {
                        return true;
                    }
                    return false;
                },
                // commaComment ensures that commas immediately precede comments instead of
                // immediately follow
                commaComment   = function lexer_script_commacomment() {
                    var x = parse.count;
                    if (data.stack[x] === "object" && options.objectSort === true) {
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
                //automatic semicolon insertion
                asi            = function lexer_script_asi(isEnd) {
                    var aa     = 0,
                        next   = nextchar(1, false),
                        record = (function lexer_script_asi_record() {
                            var output = {};
                            parse.datanames.forEach(function lexer_script_asi_record_datanames(value) {
                                output[value] = data[value][parse.count];
                            });
                            return output;
                        }()),
                        clist  = (parse.structure.length === 0)
                            ? ""
                            : parse.structure[parse.structure.length - 1][0];
                    if (data.lexer[parse.count - 1] !== "script") {
                        return;
                    }
                    if (options.lang === "json" || record.token === ";" || record.token === "," || next === "{" || record.stack === "class" || record.stack === "map" || record.stack === "attribute" || clist === "initializer" || data.types[record.begin - 1] === "generic") {
                        return;
                    }
                    if (((record.stack === "global" && record.types !== "end") || (record.types === "end" && data.stack[record.begin - 1] === "global")) && (next === "" || next === "}") && record.stack === data.stack[parse.count - 1] && options.lang === "jsx") {
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
                    if (options.lang === "qml") {
                        if (record.types === "start") {
                            return;
                        }
                        ltoke = "x;";
                        ltype = "separator";
                        recordPush("");
                        if (brace[brace.length - 1] === "x{" && nextchar !== "}") {
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
                    if (options.varword === "list") {
                        vart.index[vart.len] = parse.count;
                    }
                    if (options.correct === true) {
                        ltoke = ";";
                    } else {
                        ltoke = "x;";
                    }
                    ltype = "separator";
                    aa    = parse.linesSpace;
                    recordPush("");
                    parse.linesSpace = aa;
                    if (brace[brace.length - 1] === "x{" && nextchar !== "}") {
                        blockinsert();
                    }
                },
                //convert ++ and -- into "= x +"  and "= x -" in most cases
                plusplus = function lexer_script_plusplus() {
                    var store       = [],
                        pre         = true,
                        toke        = "+",
                        tokea       = "",
                        tokeb       = "",
                        tokec       = "",
                        inc         = 0,
                        ind         = 0,
                        walk        = 0,
                        end         = function lexer_script_plusplus_endInit() {
                            return;
                        },
                        period      = function lexer_script_plusplus_periodInit() {
                            return;
                        },
                        applyStore  = function lexer_script_plusplus_applyStore() {
                            var x = 0,
                                y = store.length;
                            if (x < y) {
                                do {
                                    parse.push(data, store[x]);
                                    x            = x + 1;
                                } while (x < y);
                            }
                        },
                        recordStore = function lexer_script_plusplus_recordStore(index) {
                            var output = {};
                            parse.datanames.forEach(
                                function lexer_script_plusplus_recordStore_datanames(value) {
                                    output[value] = data[value][index];
                                }
                            );
                            return output;
                        },
                        next        = "";
                    tokea  = data.token[parse.count];
                    tokeb  = data.token[parse.count - 1];
                    tokec  = data.token[parse.count - 2];
                    end    = function lexer_script_plusplus_end() {
                        walk = data.begin[walk] - 1;
                        if (data.types[walk] === "end") {
                            lexer_script_plusplus_end();
                        } else if (data.token[walk - 1] === ".") {
                            period();
                        }
                    };
                    period = function lexer_script_plusplus_period() {
                        walk = walk - 2;
                        if (data.types[walk] === "end") {
                            end();
                        } else if (data.token[walk - 1] === ".") {
                            lexer_script_plusplus_period();
                        }
                    };
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
                                record : {}
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
                                inc > 0 && (data.token[inc] === "." || data.types[inc] === "word" || data.types[inc] === "end")
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
                            record : {}
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
                //fixes asi location if inserted after an inserted brace
                asibrace       = function lexer_script_asibrace() {
                    var aa = parse.count;
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
                // the generic function is a generic tokenizer start argument contains the
                // token's starting syntax offset argument is length of start minus control
                // chars end is how is to identify where the token ends
                generic        = function lexer_script_genericBuilder(starting, ending) {
                    var ee     = 0,
                        ender  = ending.split(""),
                        endlen = ender.length,
                        jj     = b,
                        build  = [starting],
                        base   = a + starting.length,
                        output = "",
                        escape = false;
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
                    if (ee < jj) {
                        do {
                            if (ee > a + 1) {
                                if (c[ee] === "<" && c[ee + 1] === "?" && c[ee + 2] === "p" && c[ee + 3] === "h" && c[ee + 4] === "p" && c[ee + 5] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(lexer_script_genericBuilder("<?php", "?>"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "<" && c[ee + 1] === "%" && c[ee + 2] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(lexer_script_genericBuilder("<%", "%>"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "{" && c[ee + 1] === "%" && c[ee + 2] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(lexer_script_genericBuilder("{%", "%}"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "{" && c[ee + 1] === "{" && c[ee + 2] === "{" && c[ee + 3] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(lexer_script_genericBuilder("{{{", "}}}"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "{" && c[ee + 1] === "{" && c[ee + 2] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(lexer_script_genericBuilder("{{", "}}"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "<" && c[ee + 1] === "!" && c[ee + 2] === "-" && c[ee + 3] === "-" && c[ee + 4] === "#" && c[ee + 5] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(lexer_script_genericBuilder("<!--#", "-->"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else {
                                    build.push(c[ee]);
                                }
                            } else {
                                build.push(c[ee]);
                            }
                            if ((starting === "\"" || starting === "'") && json === false && c[ee - 1] !== "\\" && (c[ee] !== c[ee - 1] || (c[ee] !== "\"" && c[ee] !== "'")) && (c[ee] === "\n" || ee === jj - 1)) {
                                global.parseerror = "Unterminated string in script on line number " + parse.lineNumber;
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
                        } while (ee < jj);
                    }
                    if (escape === true) {
                        output = build[build.length - 1];
                        build.pop();
                        build.pop();
                        build.push(output);
                    }
                    a = ee;
                    if (starting === "//") {
                        build.pop();
                    }
                    output = build.join("");
                    if (starting === "//") {
                        output = output.replace(/(\s+)$/, "");
                    } else if (starting === "/*") {
                        build = output.split(parse.lf);
                        ee    = build.length - 1;
                        if (ee > -1) {
                            do {
                                build[ee] = build[ee].replace(/(\s+)$/, "");
                                ee        = ee - 1;
                            } while (ee > -1);
                        }
                        output = build.join(parse.lf);
                    }
                    if (starting === "{%") {
                        if (output.indexOf("{%-") < 0) {
                            output = output
                                .replace(/^(\{%\s*)/, "{% ")
                                .replace(/(\s*%\})$/, " %}");
                        } else {
                            output = output
                                .replace(/^(\{%-\s*)/, "{%- ")
                                .replace(/(\s*-%\})$/, " -%}");
                        }
                    }
                    if (output.indexOf("#region") === 0 || output.indexOf("#endregion") === 0) {
                        output = output.replace(/(\s+)$/, "");
                    }
                    return output;
                },
                //a tokenizer for regular expressions
                regex          = function lexer_script_regex() {
                    var ee     = a + 1,
                        f      = b,
                        h      = 0,
                        i      = 0,
                        build  = ["/"],
                        output = "",
                        square = false;
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
                //a unique tokenizer for operator characters
                operator       = function lexer_script_operator() {
                    var syntax = [
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
                        g      = 0,
                        h      = 0,
                        jj     = b,
                        build  = [c[a]],
                        synlen = syntax.length,
                        output = "",
                        plusequal = function lexer_script_operator_plusequal(op) {
                            var toke        = op.charAt(0),
                                walk        = parse.count,
                                inc         = 0,
                                store       = [],
                                end         = function lexer_script_operator_plusequal_endInit() {
                                    return;
                                },
                                period      = function lexer_script_operator_plusequal_periodInit() {
                                    return;
                                },
                                applyStore  = function lexer_script_plusplus_applyStore() {
                                    var x = 0,
                                        y = store.length;
                                    if (x < y) {
                                        do {
                                            parse.push(data, store[x]);
                                            x            = x + 1;
                                        } while (x < y);
                                    }
                                },
                                recordStore = function lexer_script_operator_plusequal_recordStore() {
                                    var storage = {};
                                    parse.datanames.forEach(
                                        function lexer_script_operator_plusequal_recordStore_datanames(value) {
                                            storage[value] = data[value][inc];
                                        }
                                    );
                                    return storage;
                                };
                            end    = function lexer_script_operator_plusequal_end() {
                                walk = data.begin[walk] - 1;
                                if (data.types[walk] === "end") {
                                    lexer_script_operator_plusequal_end();
                                } else if (data.token[walk - 1] === ".") {
                                    period();
                                }
                            };
                            period = function lexer_script_operator_plusequal_period() {
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
                                store.push(recordStore(inc));
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
                    if (c[a] === "/" && (parse.count > -1 && (ltype !== "word" || ltoke === "typeof" || ltoke === "return" || ltoke === "else") && ltype !== "number" && ltype !== "string" && ltype !== "end")) {
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
                    if (output === "") {
                        if ((c[a + 1] === "+" && c[a + 2] === "+") || (c[a + 1] === "-" && c[a + 2] === "-")) {
                            output = c[a];
                        } else {
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
                                                build.push(syntax[h]);
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
                            output = build.join("");
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
                //ES6 template string support
                tempstring     = function lexer_script_tempstring() {
                    var output = [c[a]];
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
                //a tokenizer for numbers
                numb           = function lexer_script_number() {
                    var ee    = 0,
                        f     = b,
                        build = [c[a]],
                        test  = /zz/,
                        dot   = (build[0] === ".");
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
                markup         = function lexer_script_markup() {
                    var output      = [],
                        curlytest   = false,
                        endtag      = false,
                        anglecount  = 0,
                        curlycount  = 0,
                        tagcount    = 0,
                        d           = 0,
                        next        = "",
                        syntaxnum   = "0123456789=<>+-*?|^:&.,;%(){}[]~",
                        syntax      = "=<>+-*?|^:&.,;%(){}[]~",
                        applyMarkup = function lexer_script_markup_applyMarkup() {
                            if (ltoke === "(") {
                                parse.structure[parse.structure.length - 1] = ["paren", parse.count];
                            }
                            lexer.markup(output.join(""));
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
                    }
                    if ((c[a] !== "<" && syntaxnum.indexOf(c[a + 1]) > -1) || data.token[d] === "++" || data.token[d] === "--" || (/\s/).test(c[a + 1]) === true || ((/\d/).test(c[a + 1]) === true && (ltype === "operator" || ltype === "string" || ltype === "number" || (ltype === "word" && ltoke !== "return")))) {
                        ltype = "operator";
                        ltoke = operator();
                        return recordPush("");
                    }
                    if (options.lang !== "typesscript" && (data.token[d] === "return" || data.types[d] === "operator" || data.types[d] === "start" || data.types[d] === "separator" || (data.token[d] === "}" && parse.structure[parse.structure.length - 1][0] === "global"))) {
                        ltype        = "markup";
                        options.lang = "jsx";
                    } else if (options.lang === "typescript" || data.token[parse.count] === "#include" || (((/\s/).test(c[a - 1]) === false || ltoke === "public" || ltoke === "private" || ltoke === "static" || ltoke === "final" || ltoke === "implements" || ltoke === "class" || ltoke === "void" || ltoke === "Promise") && syntaxnum.indexOf(c[a + 1]) < 0)) {
                        //Java type generics
                        return (function lexer_script_markup_generic() {
                            var generics = [
                                    "<",
                                    c[a + 1]
                                ],
                                comma    = false,
                                e        = 1,
                                f        = 0;
                            if (c[a + 1] === "<") {
                                e = 2;
                            }
                            d = a + 2;
                            if (d < b) {
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
                                                return operator();
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
                                        return operator();
                                    }
                                    d = d + 1;
                                } while (d < b);
                            }
                        }());
                    } else {
                        ltype = "operator";
                        ltoke = operator();
                        return recordPush("");
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
                //operations for end types: ), ], }
                end            = function lexer_script_end(x) {
                    var insert   = false,
                        next     = nextchar(1, false),
                        newarray = function lexer_script_end_newarray() {
                            var aa       = data.begin[parse.count],
                                bb       = 0,
                                cc       = 0,
                                ar       = (data.token[data.begin[parse.count] - 1] === "Array"),
                                startar  = (ar === true)
                                    ? "["
                                    : "{",
                                endar    = (ar === true)
                                    ? "]"
                                    : "}",
                                namear   = (ar === true)
                                    ? "array"
                                    : "object",
                                arraylen = 0;
                            tempstore    = parse.pop(data);
                            if (ar === true && data.token[parse.count - 1] === "(" && data.types[parse.count] === "number") {
                                arraylen                        = data.token[data.begin[parse.count]] - 1;
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
                                    record : {}
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
                        if (x === "}" && ((options.varword === "list" && vart.count[vart.len] === 0) || (data.token[parse.count] === "x;" && options.varword === "each"))) {
                            vartpop();
                        }
                        vart.count[vart.len] = vart.count[vart.len] - 1;
                        if (vart.count[vart.len] < 0) {
                            vartpop();
                        }
                    }
                    if (ltoke === "," && data.stack[parse.count] !== "initializer" && ((x === "]" && (options.endcomma === "never" || options.endcomma === "multiline" || data.token[parse.count - 1] === "[")) || x === "}")) {
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
                        pword = [];
                    } else if (x === "}") {
                        if (ltoke !== "," || options.endcomma === "always") {
                            if (options.correct === true) {
                                plusplus();
                            }
                        }
                        if (parse.structure.length > 0 && parse.structure[parse.structure.length - 1][0] !== "object") {
                            asi(true);
                        } else if (options.objectSort === true) {
                            parse.objectSort(data);
                        }
                        if (ltype === "comment") {
                            ltoke = data.token[parse.count];
                            ltype = data.types[parse.count];
                        }
                        if (options.braceline === true) {
                            data.lines[parse.count] = 2;
                        }
                        ltoke = "}";
                        ltype = "end";
                        pword = [];
                    }
                    lword.pop();
                    pstack = parse.structure[parse.structure.length - 1];
                    recordPush("");
                    if (x === ")" && options.correct === true && (data.token[data.begin[parse.count] - 1] === "Array" || data.token[data.begin[parse.count] - 1] === "Object") && data.token[data.begin[parse.count] - 2] === "new") {
                        newarray();
                    }
                    if (brace[brace.length - 1] === "x{" && x === "}") {
                        blockinsert();
                    }
                    brace.pop();
                    if (brace[brace.length - 1] === "x{" && x === "}" && data.stack[parse.count] !== "try") {
                        if (next !== ":" && next !== ";" && data.token[data.begin[a] - 1] !== "?") {
                            blockinsert();
                        }
                    }
                    if (insert === true) {
                        ltoke = "x{";
                        ltype = "start";
                        recordPush(pword[0]);
                        brace.push("x{");
                        pword[1] = parse.count;
                    }
                },
                //determines tag names for {% %} based template tags and returns a type
                tname          = function lexer_script_tname(x) {
                    var sn       = 2,
                        en       = 0,
                        st       = x.slice(0, 2),
                        len      = x.length,
                        name     = "",
                        namelist = [
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
                };
            start = function lexer_script_start(x) {
                var aa    = parse.count,
                    wordx = "",
                    wordy = "",
                    stack = "";
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
                if (options.braceline === true && x === "{") {
                    parse.linesSpace = 2;
                }
                wordx = data.token[aa];
                wordy = (data.stack[aa] === undefined)
                    ? ""
                    : data.token[data.begin[aa] - 1];
                if (ltoke === "{" || ltoke === "x{") {
                    if ((wordx === "else" && ltoke !== "if") || wordx === "do" || wordx === "try" || wordx === "finally" || wordx === "switch") {
                        stack = wordx;
                    } else if (classy[classy.length - 1] === 0 && wordx !== "return") {
                        classy.pop();
                        stack = "class";
                    } else if (data.token[aa - 1] === "class") {
                        stack = "class";
                    } else if (data.token[aa] === "]" && data.token[aa - 1] === "[") {
                        stack = "array";
                    } else if (data.types[aa] === "word" && (data.types[aa - 1] === "word" || (data.token[aa - 1] === "?" && data.types[aa - 2] === "word")) && data.token[aa] !== "in" && data.token[aa - 1] !== "export" && data.token[aa - 1] !== "import") {
                        stack = "map";
                    } else if (data.stack[aa] === "method" && data.types[aa] === "end" && data.types[data.begin[aa] - 1] === "word" && data.token[data.begin[aa] - 2] === "new") {
                        stack = "initializer";
                    } else if (ltoke === "{" && (wordx === ")" || wordx === "x)") && (data.types[data.begin[aa] - 1] === "word" || data.token[data.begin[aa] - 1] === "]")) {
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
                        //ES6 block
                        stack = "block";
                    } else if (ltoke === "{" && data.token[aa] === ":" && data.stack[aa] === "switch") {
                        //ES6 block
                        stack = "block";
                    } else if (data.token[aa - 1] === "import" || data.token[aa - 2] === "import" || data.token[aa - 1] === "export" || data.token[aa - 2] === "export") {
                        stack = "object";
                    } else if (wordx === ")" && (pword[0] === "function" || pword[0] === "if" || pword[0] === "for" || pword[0] === "class" || pword[0] === "while" || pword[0] === "switch" || pword[0] === "catch")) {
                        // if preceeded by a paren the prior containment is preceeded by a keyword if
                        // (...) {
                        stack = pword[0];
                    } else if (data.stack[aa] === "notation") {
                        //if following a TSX array type declaration
                        stack = "function";
                    } else if ((data.types[aa] === "number" || data.types[aa] === "string" || data.types[aa] === "word") && data.types[aa - 1] === "word" && data.token[data.begin[aa] - 1] !== "for") {
                        //if preceed by a word and either string or word public class {
                        stack = "function";
                    } else if (parse.structure.length > 0 && data.token[aa] !== ":" && parse.structure[parse.structure.length - 1][0] === "object" && (
                        data.token[data.begin[aa] - 2] === "{" || data.token[data.begin[aa] - 2] === ","
                    )) {
                        // if an object wrapped in some containment which is itself preceeded by a curly
                        // brace or comma var a={({b:{cat:"meow"}})};
                        stack = "function";
                    } else if (data.types[pword[1] - 1] === "markup" && data.token[pword[1] - 3] === "function") {
                        //checking for TSX function using an angle brace name
                        stack = "function";
                    } else if (wordx === "=>") {
                        //checking for fat arrow assignment
                        stack = "function";
                    } else if (wordx === ")" && data.stack[aa] === "method" && data.types[data.begin[aa] - 1] === "word") {
                        stack = "function";
                    } else if (data.types[aa] === "word" && ltoke === "{" && data.token[aa] !== "return" && data.token[aa] !== "in" && data.token[aa] !== "import" && data.token[aa] !== "const" && data.token[aa] !== "let" && data.token[aa] !== "") {
                        //ES6 block
                        stack = "block";
                    } else {
                        stack = "object";
                    }
                } else if (ltoke === "[") {
                    if ((/\s/).test(c[a - 1]) === true && data.types[aa] === "word" && wordx !== "return" && options.lang !== "twig") {
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
                    } else {
                        stack = "paren";
                    }
                } else if (ltoke === ":" && data.types[aa] === "word" && data.token[aa - 1] === "[") {
                    stack = "attribute";
                }
                recordPush(stack);
                if (classy.length > 0) {
                    classy[classy.length - 1] = classy[classy.length - 1] + 1;
                }
            };
            do {
                if ((/\s/).test(c[a])) {
                    if (wordTest > -1) {
                        word();
                    }
                    a = parse.spacer({array: c, end: b, index: a});
                    if (parse.linesSpace > 1 && ltoke !== ";" && lengthb < parse.count && c[a + 1] !== "}") {
                        asi(false);
                        lengthb = parse.count;
                    }
                } else if (c[a] === "<" && c[a + 1] === "?" && c[a + 2] === "p" && c[a + 3] === "h" && c[a + 4] === "p") {
                    //php
                    ltoke = generic("<?php", "?>");
                    ltype = "template";
                    recordPush("");
                } else if (c[a] === "<" && c[a + 1] === "%") {
                    //asp
                    ltoke = generic("<%", "%>");
                    ltype = "template";
                    recordPush("");
                } else if (c[a] === "{" && c[a + 1] === "%") {
                    //twig
                    ltoke = generic("{%", "%}");
                    ltype = tname(ltoke);
                    recordPush("");
                } else if (c[a] === "{" && c[a + 1] === "{" && c[a + 2] === "{") {
                    //mustache
                    ltoke = generic("{{{", "}}}");
                    ltype = "template";
                    recordPush("");
                } else if (c[a] === "{" && c[a + 1] === "{") {
                    //handlebars
                    ltoke = generic("{{", "}}");
                    ltype = tname(ltoke);
                    recordPush("");
                } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-" && c[a + 4] === "#") {
                    //ssi
                    ltoke = generic("<!--#", "-->");
                    ltype = "template";
                    recordPush("");
                } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-") {
                    //markup comment
                    ltoke = generic("<!--", "-->");
                    ltype = "comment";
                    recordPush("");
                } else if (c[a] === "<") {
                    //markup
                    markup();
                } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "*")) {
                    //comment block
                    ltoke = generic("/*", "*\/");
                    if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                        sourcemap[0] = parse.count + 1;
                        sourcemap[1] = ltoke;
                    }
                    if (options.comments !== "nocomment") {
                        ltype = "comment";
                        if (data.token[parse.count] === "var" || data.token[parse.count] === "let" || data.token[parse.count] === "const") {
                            tempstore    = parse.pop(data);
                            recordPush("");
                            parse.push(data, tempstore);
                            if (data.lines[parse.count - 2] === 0) {
                                data.lines[parse.count - 2] = data.lines[parse.count];
                            }
                            data.lines[parse.count] = 0;
                        } else {
                            recordPush("");
                        }
                    }
                } else if ((parse.count < 0 || data.lines[parse.count] > 0) && c[a] === "#" && c[a + 1] === "!" && (c[a + 2] === "/" || c[a + 2] === "[")) {
                    //shebang
                    ltoke      = generic("#!" + c[a + 2], "\n");
                    ltoke      = ltoke.slice(0, ltoke.length - 1);
                    ltype      = "string";
                    parse.linesSpace = 2;
                    recordPush("");
                } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "/")) {
                    //comment line
                    asi(false);
                    ltoke = generic("//", "\n");
                    if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                        sourcemap[0] = parse.count + 1;
                        sourcemap[1] = ltoke;
                    }
                    if (options.comments !== "nocomment") {
                        recordPush("");
                    }
                } else if (c[a] === "#" && c[a + 1] === "r" && c[a + 2] === "e" && c[a + 3] === "g" && c[a + 4] === "i" && c[a + 5] === "o" && c[a + 6] === "n" && (/\s/).test(c[a + 7]) === true) {
                    //comment line
                    asi(false);
                    ltoke = generic("#region", "\n");
                    ltype = "comment";
                    recordPush("");
                } else if (c[a] === "#" && c[a + 1] === "e" && c[a + 2] === "n" && c[a + 3] === "d" && c[a + 4] === "r" && c[a + 5] === "e" && c[a + 6] === "g" && c[a + 7] === "i" && c[a + 8] === "o" && c[a + 9] === "n") {
                    //comment line
                    asi(false);
                    ltoke = generic("#endregion", "\n");
                    ltype = "comment";
                    recordPush("");
                } else if (c[a] === "`" || (c[a] === "}" && templateString[templateString.length - 1] === true)) {
                    //template string
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
                    //string
                    ltoke = generic(c[a], c[a]);
                    ltype = "string";
                    recordPush("");
                } else if (c[a] === "-" && (a < b - 1 && c[a + 1] !== "=" && c[a + 1] !== "-") && (ltype === "number" || ltype === "word") && ltoke !== "return" && (ltoke === ")" || ltoke === "]" || ltype === "word" || ltype === "number")) {
                    //subtraction
                    if (wordTest > -1) {
                        word();
                    }
                    ltoke = "-";
                    ltype = "operator";
                    recordPush("");
                } else if (wordTest === -1 && (c[a] !== "0" || (c[a] === "0" && c[a + 1] !== "b")) && ((/\d/).test(c[a]) || (a !== b - 2 && c[a] === "-" && c[a + 1] === "." && (/\d/).test(c[a + 2])) || (a !== b - 1 && (c[a] === "-" || c[a] === ".") && (/\d/).test(c[a + 1])))) {
                    //number
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
                    //comma
                    if (wordTest > -1) {
                        word();
                    }
                    if (options.correct === true) {
                        plusplus();
                    }
                    if (ltype === "comment") {
                        commaComment();
                    } else if (vart.len > -1 && vart.count[vart.len] === 0 && options.varword === "each") {
                        asifix();
                        ltoke = ";";
                        ltype = "separator";
                        recordPush("");
                        ltoke = vart.word[vart.len];
                        ltype = "word";
                        recordPush("");
                        vart.index[vart.len] = parse.count;
                    } else {
                        ltoke = ",";
                        ltype = "separator";
                        asifix();
                        recordPush("");
                    }
                } else if (c[a] === ".") {
                    //period
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
                    //semicolon
                    if (wordTest > -1) {
                        word();
                    }
                    if (options.lang === "qml") {
                        ltoke = "x;";
                        ltype = "separator";
                        recordPush("");
                    } else {
                        if (classy[classy.length - 1] === 0) {
                            classy.pop();
                        }
                        if (vart.len > -1 && vart.count[vart.len] === 0) {
                            if (options.varword === "each") {
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
                    //operator
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
                if (vart.len > -1 && parse.count === vart.index[vart.len] + 1 && data.token[vart.index[vart.len]] === ";" && ltoke !== vart.word[vart.len] && ltype !== "comment" && options.varword === "list") {
                    vartpop();
                }
                a = a + 1;
            } while (a < b);
            if (wordTest > -1) {
                word();
            }
            if (options.correct === true && options.lang !== "jsx" && ((data.token[parse.count] !== "}" && data.token[0] === "{") || data.token[0] !== "{") && ((data.token[parse.count] !== "]" && data.token[0] === "[") || data.token[0] !== "[")) {
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
                (function lexer_script_correct() {
                    var aa = 0,
                        bb = parse.count + 1;
                    do {
                        if (data.token[aa] === "x;") {
                            data.token[aa] = ";";
                            scolon         = scolon + 1;
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
                }());
            }

            return data;
        };
    
    lexer.script = script;
}());
