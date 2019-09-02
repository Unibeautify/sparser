(function script_init() {
    "use strict";
    const sparser:sparser = global.sparser,
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
            const parse:parse          = sparser.parse,
                data:data           = parse.data,
                options:any         = sparser.options,
                sourcemap:[number, string]      = [
                    0, ""
                ],
                references:string[][] = parse.references,
                b:number              = source.length,
                c:string[]              = source.split(""),
                brace:string[]          = [],
                classy:number[]         = [],
                datatype:boolean[]         = [false],
                // identify variable declarations
                vart           = {
                    count: [],
                    index: [],
                    len  : -1,
                    word : []
                },
                // automatic semicolon insertion
                asi            = function lexer_script_asi(isEnd:boolean):void {
                    let aa:number     = 0;
                    const next:string   = nextchar(1, false),
                        record:record = {
                            begin: data.begin[parse.count],
                            ender: data.begin[parse.count],
                            lexer: data.lexer[parse.count],
                            lines: data.lines[parse.count],
                            stack: data.stack[parse.count],
                            token: data.token[parse.count],
                            types: data.types[parse.count]
                        },
                        clist:string  = (parse.structure.length === 0)
                            ? ""
                            : parse.structure[parse.structure.length - 1][0];
                    if ((/^(\/(\/|\*)\s*parse-ignore\u002dstart)/).test(ltoke) === true) {
                        return;
                    }
                    if (ltype === "start" || ltype === "type_start") {
                        return;
                    }
                    if (options.language === "json" || options.language === "java" || options.language === "csharp") {
                        return;
                    }
                    if (options.language === "json" || record.token === ";" || record.token === "," || next === "{" || record.stack === "class" || record.stack === "map" || record.stack === "attribute" || clist === "initializer" || data.types[record.begin - 1] === "generic") {
                        return;
                    }
                    if (record.token === "}" && data.stack[record.begin - 1] === "global" && data.types[record.begin - 1] !== "operator" && record.stack === data.stack[parse.count - 1]) {
                        return;
                    }
                    if (record.stack === "array" && record.token !== "]") {
                        return;
                    }
                    if (data.token[data.begin[parse.count]] === "{" && record.stack === "data_type") {
                        return;
                    }
                    if (record.types !== undefined && record.types.indexOf("template") > -1 && record.types.indexOf("template_string") < 0) {
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
                        ltoke = (options.correct === true)
                            ? ";"
                            : "x;";
                        ltype = "separator";
                        recordPush("");
                        if (next !== "}") {
                            blockinsert();
                        }
                        return;
                    }
                    if (record.token === "}" && (record.stack === "function" || record.stack === "if" || record.stack === "else" || record.stack === "for" || record.stack === "do" || record.stack === "while" || record.stack === "switch" || record.stack === "class" || record.stack === "try" || record.stack === "catch" || record.stack === "finally" || record.stack === "block")) {
                        if (record.stack === "function" && (data.stack[record.begin - 1] === "data_type" || data.types[record.begin - 1] === "type")) {
                            aa = record.begin;
                            do {
                                aa = aa - 1;
                            } while (aa > 0 && data.token[aa] !== ")" && data.stack[aa] !== "arguments");
                            aa = data.begin[aa];
                        } else {
                            aa = data.begin[record.begin - 1];
                        }
                        if (data.token[aa] === "(") {
                            aa = aa - 1;
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
                    if (
                        record.types === "comment" ||
                        clist === "method" ||
                        clist === "paren" ||
                        clist === "expression" ||
                        clist === "array" ||
                        clist === "object" ||
                        (clist === "switch" && record.stack !== "method" && data.token[data.begin[parse.count]] === "(" && data.token[data.begin[parse.count] - 1] !== "return" && data.types[data.begin[parse.count] - 1] !== "operator")) {
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
                    if (options.lexer_options.script.variable_list === "list") {
                        vart.index[vart.len] = parse.count;
                    }
                    ltoke = (options.correct === true)
                         ? ";"
                         : "x;";
                    ltype = "separator";
                    aa    = parse.linesSpace;
                    parse.linesSpace = 0;
                    recordPush("");
                    parse.linesSpace = aa;
                    blockinsert();
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
                            ender: -1,
                            lexer: "script",
                            lines: parse.linesSpace,
                            stack: data.stack[aa],
                            token: ltoke,
                            types: ltype
                        }
                    });
                    recordPush("");
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
                            {data: data, howmany: 1, index: len}
                        );
                    }
                },
                // block comments
                blockComment   = function lexer_script_blockComment() {
                    asi(false);
                    if (wordTest > -1) {
                        word();
                    }
                    comment = parse.wrapCommentBlock({
                        chars: c,
                        end: b,
                        lexer: "script",
                        opening: "/*",
                        start: a,
                        terminator: "\u002a/"
                    });
                    a = comment[1];
                    if (data.token[parse.count] === "var" || data.token[parse.count] === "let" || data.token[parse.count] === "const") {
                        tempstore    = parse.pop(data);
                        recordPush("");
                        parse.push(data, tempstore, "");
                        if (data.lines[parse.count - 2] === 0) {
                            data.lines[parse.count - 2] = data.lines[parse.count];
                        }
                        data.lines[parse.count] = 0;
                    } else if (comment[0] !== "") {
                        ltoke = comment[0];
                        ltype = (/^\/\*\s*parse-ignore-start/).test(ltoke)
                            ? "ignore"
                            : "comment";
                        if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                            sourcemap[0] = parse.count + 1;
                            sourcemap[1] = ltoke;
                        }
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "script",
                            lines: parse.linesSpace,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: ltoke,
                            types: ltype
                        }, "");
                    }
                    if ((/\/\*\s*global\s+/).test(data.token[parse.count]) === true && data.types.indexOf("word") < 0) {
                        references[0] = data.token[parse.count].replace(/\/\*\s*global\s+/, "").replace("\u002a/", "").replace(/,\s+/g, ",").split(",");
                    }
                },
                // inserts ending curly brace (where absent)
                blockinsert    = function lexer_script_blockinsert():void {
                    let next:string  = nextchar(5, false),
                        name:string  = "";
                    const g:number   = parse.count,
                        lines:number = parse.linesSpace;
                    if (options.language === "json" || brace.length < 1 || brace[brace.length - 1].charAt(0) !== "x" || (/^x?(;|\}|\))$/).test(ltoke) === false) {
                        return;
                    }
                    if (data.stack[parse.count] === "do" && next === "while" && data.token[parse.count] === "}") {
                        return;
                    }
                    if (ltoke === ";" && data.token[g - 1] === "x{") {
                        name = data.token[data.begin[g - 2] - 1];
                        if (data.token[g - 2] === "do" || (data.token[g - 2] === ")" && "ifforwhilecatch".indexOf(name) > -1)) {
                            tempstore    = parse.pop(data);
                            ltoke        = (options.correct === true)
                                ? "}"
                                : "x}";
                            ltype        = "end";
                            pstack       = parse.structure[parse.structure.length - 1];
                            recordPush("");
                            brace.pop();
                            parse.linesSpace = lines;
                            return;
                        }
                        // to prevent the semicolon from inserting between the braces --> while (x) {};
                        tempstore    = parse.pop(data);
                        ltoke        = (options.correct === true)
                            ? "}"
                            : "x}";
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
                    ltoke = (options.correct === true)
                        ? "}"
                        : "x}";
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
                    if (data.stack[x] === "object" && options.lexer_options.script.object_sort === true) {
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
                                ender: -1,
                                lexer: "script",
                                lines: parse.linesSpace,
                                stack: data.stack[x],
                                token: ",",
                                types: "separator"
                            }
                        });
                        recordPush("");
                    }
                },
                // operations for end types: ), ], }
                end            = function lexer_script_end(x:string):void {
                    let insert:boolean   = false,
                        newarr:boolean = false;
                    const next:string     = nextchar(1, false),
                        count:number = (data.token[parse.count] === "(")
                            ? parse.count
                            : data.begin[parse.count],
                        newarray = function lexer_script_end_newarray():void {
                            let arraylen:number = 0;
                            const ar:boolean       = (data.token[count - 1] === "Array"),
                                startar:string  = (ar === true)
                                    ? "["
                                    : "{",
                                endar:string    = (ar === true)
                                    ? "]"
                                    : "}",
                                namear:string   = (ar === true)
                                    ? "array"
                                    : "object";
                            if (ar === true && data.types[parse.count] === "number") {
                                arraylen                        = Number(data.token[parse.count]);
                                tempstore                       = parse.pop(data);
                            }
                            tempstore                       = parse.pop(data);
                            tempstore                       = parse.pop(data);
                            tempstore                       = parse.pop(data);
                            parse.structure.pop();
                            ltoke = startar;
                            ltype = "start";
                            recordPush(namear);
                            if (arraylen > 0) {
                                ltoke                           = ",";
                                ltype                           = "separator";
                                do {
                                    recordPush("");
                                    arraylen = arraylen - 1;
                                } while (arraylen > 0);
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
                        if (x === "}" && ((options.lexer_options.script.variable_list === "list" && vart.count[vart.len] === 0) || (data.token[parse.count] === "x;" && options.lexer_options.script.variable_list === "each"))) {
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
                        if (lword.length > 0) {
                            pword = lword[lword.length - 1];
                            if (pword.length > 1 && next !== "{" && (pword[0] === "if" || pword[0] === "for" || (pword[0] === "while" && data.stack[pword[1] - 2] !== undefined && data.stack[pword[1] - 2] !== "do") || pword[0] === "with")) {
                                insert = true;
                            }
                        }
                    } else if (x === "]") {
                        ltoke = "]";
                    } else if (x === "}") {
                        if (ltoke !== "," && options.correct === true) {
                            plusplus();
                        }
                        if (parse.structure.length > 0 && parse.structure[parse.structure.length - 1][0] !== "object") {
                            asi(true);
                        }
                        if (options.lexer_options.script.object_sort === true && parse.structure[parse.structure.length - 1][0] === "object") {
                            parse.object_sort(data);
                        }
                        if (ltype === "comment") {
                            ltoke = data.token[parse.count];
                            ltype = data.types[parse.count];
                        }
                        ltoke = "}";
                    }
                    if (parse.structure[parse.structure.length - 1][0] === "data_type") {
                        ltype = "type_end";
                    } else {
                        ltype = "end";
                    }
                    lword.pop();
                    pstack = parse.structure[parse.structure.length - 1];
                    if (x === ")" && options.correct === true && count - parse.count < 2 && (data.token[parse.count] === "(" || data.types[parse.count] === "number") && (data.token[count - 1] === "Array" || data.token[count - 1] === "Object") && data.token[count - 2] === "new") {
                        newarray();
                        newarr = true;
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

                    // options.end_comma
                    if (options.lexer_options.script.end_comma !== undefined && options.lexer_options.script.end_comma !== "none" && parse.structure[parse.structure.length - 1][0] === "array" || parse.structure[parse.structure.length - 1][0] === "object" || parse.structure[parse.structure.length - 1][0] === "data_type") {
                        if (options.lexer_options.script.end_comma === "always" && data.token[parse.count] !== ",") {
                            const begin:number = parse.structure[parse.structure.length - 1][1];
                            let y:number = parse.count;
                            do {
                                if (data.begin[y] === begin) {
                                    if (data.token[y] === ",") {
                                        break;
                                    }
                                } else {
                                    y = data.begin[y];
                                }
                                y = y - 1;
                            } while (y > begin);
                            if (y > begin) {
                                const type:string = ltype,
                                    toke:string = ltoke;
                                ltoke = ",";
                                ltype = "separator";
                                recordPush("");
                                ltoke = toke;
                                ltype = type;
                            }
                        } else if (options.lexer_options.script.end_comma === "never" && data.token[parse.count] === ",") {
                            parse.pop(data);
                        }
                    }
                    if (newarr === false) {
                        recordPush("");
                        if (ltoke === "}" && data.stack[parse.count] !== "object" && data.stack[parse.count] !== "class" && data.stack[parse.count] !== "data_type") {
                            references.pop();
                            blockinsert();
                        }
                    }
                    if (insert === true) {
                        ltoke = (options.correct === true)
                            ? "{"
                            : "x{";
                        ltype = "start";
                        recordPush(pword[0]);
                        brace.push("x{");
                        pword[1] = parse.count;
                    }
                    datatype.pop();
                    if (parse.structure[parse.structure.length - 1][0] !== "data_type") {
                        datatype[datatype.length - 1] = false;
                    }
                },
                // the general function is a generic tokenizer start argument contains the
                // token's starting syntax offset argument is length of start minus control
                // chars end is how is to identify where the token ends
                general        = function lexer_script_general(starting:string, ending:string, type:string):void {
                    let ee:number     = 0,
                        escape:boolean = false,
                        ext:boolean = false,
                        build:string[]  = [starting],
                        ender:string[]  = ending.split(""),
                        temp:[string, string];
                    const endlen:number = ender.length,
                        start:number = a,
                        qc:"none"|"double"|"single" = (options.lexer_options.script.quote_convert === undefined)
                            ? "none"
                            : options.lexer_options.script.quote_convert,
                        base:number   = a + starting.length,
                        cleanUp = function lexer_script_general_cleanUp():void {
                            let linesSpace:number = 0;
                            build = [];
                            ltype = type;
                            ee = a;
                            if (type === "string" && (/\s/).test(c[ee + 1]) === true) {
                                linesSpace = 1;
                                do {
                                    ee = ee + 1;
                                    if (c[ee] === "\n") {
                                        linesSpace = linesSpace + 1;
                                    }
                                } while (ee < b && (/\s/).test(c[ee + 1]) === true);
                                parse.linesSpace = linesSpace;
                            }
                        },
                        finish = function lexer_script_general_finish():void {
                            let str:string = "";
                            //pads certain template tag delimiters with a space
                            const bracketSpace = function lexer_script_general_finish_bracketSpace(input:string):string {
                                if (options.language !== "javascript" && options.language !== "typescript" && options.language !== "jsx" && options.language !== "tsx") {
                                    const spaceStart = function lexer_script_general_finish_bracketSpace_spaceStart(start:string):string {
                                            return start.replace(/\s*$/, " ");
                                        },
                                        spaceEnd = function lexer_script_general_finish_bracketSpace_spaceStart(end:string):string {
                                            return end.replace(/^\s*/, " ");
                                        };
                                    if ((/\{(#|\/|(%>)|(%\]))/).test(input) === true || (/\}%(>|\])/).test(input) === true) {
                                        return input;
                                    }
                                    input = input.replace(/\{((\{+)|%-?)\s*/g, spaceStart);
                                    input = input.replace(/\s*((\}\}+)|(-?%\}))/g, spaceEnd);
                                    return input;
                                }
                                return input;
                            };
                            if (starting === "\"" && qc === "single") {
                                build[0] = "'";
                                build[build.length - 1] = "'";
                            } else if (starting === "'" && qc === "double") {
                                build[0] = "\"";
                                build[build.length - 1] = "\"";
                            } else if (escape === true) {
                                str = build[build.length - 1];
                                build.pop();
                                build.pop();
                                build.push(str);
                            }
                            a = ee;
                            if (ending === "\n") {
                                a = a - 1;
                                build.pop();
                            }
                            ltoke = build.join("");
                            if (starting === "\"" || starting === "'" || starting === "{{" || starting === "{%" || starting === "{{{") {
                                ltoke = bracketSpace(ltoke);
                            }
                            if (starting === "{%" || starting === "{{") {
                                temp = tname(ltoke);
                                ltype = temp[0];
                                recordPush(temp[1]);
                                return;
                            }
                            if (type === "string") {
                                ltype = "string";
                                if (options.language === "json") {
                                    ltoke = ltoke
                                        .replace(/\u0000/g, "\\u0000")
                                        .replace(/\u0001/g, "\\u0001")
                                        .replace(/\u0002/g, "\\u0002")
                                        .replace(/\u0003/g, "\\u0003")
                                        .replace(/\u0004/g, "\\u0004")
                                        .replace(/\u0005/g, "\\u0005")
                                        .replace(/\u0006/g, "\\u0006")
                                        .replace(/\u0007/g, "\\u0007")
                                        .replace(/\u0008/g, "\\u0008")
                                        .replace(/\u0009/g, "\\u0009")
                                        .replace(/\u000a/g, "\\u000a")
                                        .replace(/\u000b/g, "\\u000b")
                                        .replace(/\u000c/g, "\\u000c")
                                        .replace(/\u000d/g, "\\u000d")
                                        .replace(/\u000e/g, "\\u000e")
                                        .replace(/\u000f/g, "\\u000f")
                                        .replace(/\u0010/g, "\\u0010")
                                        .replace(/\u0011/g, "\\u0011")
                                        .replace(/\u0012/g, "\\u0012")
                                        .replace(/\u0013/g, "\\u0013")
                                        .replace(/\u0014/g, "\\u0014")
                                        .replace(/\u0015/g, "\\u0015")
                                        .replace(/\u0016/g, "\\u0016")
                                        .replace(/\u0017/g, "\\u0017")
                                        .replace(/\u0018/g, "\\u0018")
                                        .replace(/\u0019/g, "\\u0019")
                                        .replace(/\u001a/g, "\\u001a")
                                        .replace(/\u001b/g, "\\u001b")
                                        .replace(/\u001c/g, "\\u001c")
                                        .replace(/\u001d/g, "\\u001d")
                                        .replace(/\u001e/g, "\\u001e")
                                        .replace(/\u001f/g, "\\u001f");
                                } else if (starting.indexOf("#!") === 0) {
                                    ltoke = ltoke.slice(0, ltoke.length - 1);
                                    parse.linesSpace = 2;
                                } else if (parse.structure[parse.structure.length - 1][0] !== "object" || (parse.structure[parse.structure.length - 1][0] === "object" && nextchar(1, false) !== ":" && data.token[parse.count] !== "," && data.token[parse.count] !== "{")) {
                                    if ((ltoke.length > options.wrap && options.wrap > 0) || (options.wrap !== 0 && data.token[parse.count] === "+" && (data.token[parse.count - 1].charAt(0) === "\"" || data.token[parse.count - 1].charAt(0) === "'"))) {
                                        let item:string = ltoke,
                                            q:string = (qc === "double")
                                                ? "\""
                                                : (qc === "single")
                                                    ? "'"
                                                    : item.charAt(0),
                                            segment:string = "";
                                        const limit:number = options.wrap,
                                            uchar:RegExp     = (/u[0-9a-fA-F]{4}/),
                                            xchar:RegExp     = (/x[0-9a-fA-F]{2}/);
                                        item = item.slice(1, item.length - 1);
                                        if (data.token[parse.count] === "+" && (data.token[parse.count - 1].charAt(0) === "\"" || data.token[parse.count - 1].charAt(0) === "'")) {
                                            parse.pop(data);
                                            q = data.token[parse.count].charAt(0);
                                            item = data.token[parse.count].slice(1, data.token[parse.count].length - 1) + item;
                                            parse.pop(data);
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
                                    }
                                }
                            } else if ((/\{\s*\?>$/).test(ltoke) === true) {
                                if ((/^<\?(=|(php))\s*\}\s*else/).test(ltoke) === true) {
                                    ltype = "template_else";
                                } else {
                                    ltype = "template_start";
                                }
                            } else if ((/^<\?(=|(php))\s*\}/).test(ltoke) === true) {
                                if ((/^<\?(=|(php))\s*\}\s*else/).test(ltoke) === true) {
                                    ltype = "template_else";
                                } else {
                                    ltype = "template_end";
                                }
                            } else {
                                ltype = type;
                            }
                            if (ltoke.length > 0) {
                                recordPush("");
                            }
                        };
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
                                build = ["\\\""];
                                finish();
                                return;
                            }
                            build = ["\\'"];
                            finish();
                            return;
                        }
                    }
                    ee = base;
                    if (ee < b) {
                        do {
                            if (data.token[0] !== "{" && data.token[0] !== "[" && qc !== "none" && (c[ee] === "\"" || c[ee] === "'")) {
                                if (c[ee - 1] === "\\") {
                                    if (slashes(ee - 1) === true) {
                                        if (qc === "double" && c[ee] === "'") {
                                            build.pop();
                                        } else if (qc === "single" && c[ee] === "\"") {
                                            build.pop();
                                        }
                                    }
                                } else if (qc === "double" && c[ee] === "\"" && c[a] === "'") {
                                    c[ee] = "\\\"";
                                } else if (qc === "single" && c[ee] === "'" && c[a] === "\"") {
                                    c[ee] = "\\'";
                                }
                                build.push(c[ee]);
                            } else if (ee > start) {
                                ext = true;
                                if (c[ee] === "<" && c[ee + 1] === "?" && c[ee + 2] === "p" && c[ee + 3] === "h" && c[ee + 4] === "p" && c[ee + 5] !== starting) {
                                    finish();
                                    // php
                                    lexer_script_general("<?php", "?>", "template");
                                    cleanUp();
                                } else if (c[ee] === "<" && c[ee + 1] === "?" && c[ee + 2] === "=" && c[ee + 3] !== starting) {
                                    finish();
                                    // php
                                    lexer_script_general("<?=", "?>", "template");
                                    cleanUp();
                                } else if (c[ee] === "<" && c[ee + 1] === "%" && c[ee + 2] !== starting) {
                                    finish();
                                    // asp
                                    lexer_script_general("<%", "%>", "template");
                                    cleanUp();
                                } else if (c[ee] === "{" && c[ee + 1] === "%" && c[ee + 2] !== starting) {
                                    finish();
                                    // twig
                                    lexer_script_general("{%", "%}", "template");
                                    cleanUp();
                                } else if (c[ee] === "{" && c[ee + 1] === "{" && c[ee + 2] === "{" && c[ee + 3] !== starting) {
                                    finish();
                                    // mustache
                                    lexer_script_general("{{{", "}}}", "template");
                                    cleanUp();
                                } else if (c[ee] === "{" && c[ee + 1] === "{" && c[ee + 2] !== starting) {
                                    finish();
                                    // handlebars
                                    lexer_script_general("{{", "}}", "template");
                                    cleanUp();
                                } else if (c[ee] === "<" && c[ee + 1] === "!" && c[ee + 2] === "-" && c[ee + 3] === "-" && c[ee + 4] === "#" && c[ee + 5] !== starting) {
                                    finish();
                                    // ssi
                                    lexer_script_general("<!--#", "-->", "template");
                                    cleanUp();
                                } else {
                                    ext = false;
                                    build.push(c[ee]);
                                }
                            } else {
                                build.push(c[ee]);
                            }
                            if ((starting === "\"" || starting === "'") && (ext === true || ee > start) && options.language !== "json" && c[ee - 1] !== "\\" && c[ee] !== "\"" && c[ee] !== "'" && (c[ee] === "\n" || ee === b - 1)) {
                                sparser.parseerror = "Unterminated string in script on line number " + parse.lineNumber;
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
                    finish();
                },
                // line comments
                lineComment    = function lexer_script_lineComment() {
                    asi(false);
                    blockinsert();
                    if (wordTest > -1) {
                        word();
                    }
                    comment = parse.wrapCommentLine({
                        chars: c,
                        end: b,
                        lexer: "script",
                        opening: "//",
                        start: a,
                        terminator: "\n"
                    });
                    a = comment[1];
                    if (comment[0] !== "") {
                        ltoke = comment[0];
                        ltype = (/^(\/\/\s*parse-ignore-start)/).test(ltoke)
                            ? "ignore"
                            : "comment";
                        if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                            sourcemap[0] = parse.count + 1;
                            sourcemap[1] = ltoke;
                        }
                        parse.push(data, {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "script",
                            lines: parse.linesSpace,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: ltoke,
                            types: ltype
                        }, "");
                    }
                },
                // Identifies blocks of markup embedded within JavaScript for language super sets
                // like React JSX.
                markup         = function lexer_script_markup():void {
                    let curlytest:boolean  = false,
                        endtag:boolean     = false,
                        anglecount:number  = 0,
                        curlycount:number  = 0,
                        tagcount:number    = 0,
                        d:number           = 0,
                        next:string        = "",
                        priorToken:string  = "",
                        priorType:string   = "",
                        output:string[]    = [];
                    const dt:boolean = datatype[datatype.length - 1],
                        syntaxnum:string   = "0123456789=<>+-*?|^:&.,;%(){}[]~",
                        applyMarkup = function lexer_script_markup_applyMarkup():void {
                            if (ltoke === "(") {
                                parse.structure[parse.structure.length - 1] = ["paren", parse.count];
                            }
                            sparser.lexers.markup(output.join(""));
                        };
                    if (wordTest > -1) {
                        word();
                    }
                    
                    // type generics tokenizer
                    priorToken = (parse.count > 0)
                    ? data.token[parse.count - 1]
                    : "";
                    priorType = (parse.count > 0)
                        ? data.types[parse.count - 1]
                        : "";
                    next = nextchar(1, false);
                    if (options.language !== "jsx" && options.language !== "tsx" && (/\d/).test(next) === false && (
                        ltoke === "function" ||
                        priorToken === "=>" ||
                        priorToken === "void" ||
                        priorToken === "." ||
                        data.stack[parse.count] === "arguments" ||
                        ((options.language === "csharp" || options.language === "java") && priorToken === "public" || priorToken === "private" || priorToken === "final" || priorToken === "static") ||
                        (ltype === "type" && priorToken === "type") ||
                        (ltype === "reference" && (priorType === "operator" || priorToken === "function" || priorToken === "class" || priorToken === "new")) ||
                        (ltype === "type" && priorType === "operator") ||
                        ltoke === "return" ||
                        ltype === "operator"
                    )) {
                        let inc:number = 0,
                            e:number = 0;
                        const build:string[] = [];
                        d = a;
                        do {
                            build.push(c[d]);
                            if (c[d] === "<") {
                                inc = inc + 1;
                            } else if (c[d] === ">") {
                                inc = inc - 1;
                                if (inc < 1) {
                                    break;
                                }
                            }
                            d = d + 1;
                        } while (d < b);
                        e = a;
                        a = d;
                        next = nextchar(1, false);
                        if (c[d] === ">" && (dt === true || priorToken === "=>" || priorToken === "." || priorType !== "operator" || (priorType === "operator" && (next === "(" || next === "=")))) {
                            ltype = "generic";
                            ltoke = build.join("").replace(/^<\s+/, "<").replace(/\s+>$/, ">").replace(/,\s*/g, ", ");
                            recordPush("");
                            return;
                        }
                        a = e;
                    }

                    d = parse.count;
                    if (data.types[d] === "comment") {
                        do {
                            d = d - 1;
                        } while (
                            d > 0 && data.types[d] === "comment"
                        );
                    }
                    if (
                        dt === false &&
                        nextchar(1, false) !== ">" && (
                        (c[a] !== "<" && syntaxnum.indexOf(c[a + 1]) > -1) ||
                        data.token[d] === "++" ||
                        data.token[d] === "--" ||
                        (/\s/).test(c[a + 1]) === true ||
                        (
                            (/\d/).test(c[a + 1]) === true &&
                            (
                                ltype === "operator" ||
                                ltype === "string" ||
                                ltype === "number" ||
                                ltype === "reference" ||
                                (ltype === "word" && ltoke !== "return")
                            )
                        ))
                    ) {
                        ltype = "operator";
                        ltoke = operator();
                        return recordPush("");
                    }
                    if (options.language !== "typescript" && options.language !== "flow" && (data.token[d] === "return" || data.types[d] === "operator" || data.types[d] === "start" || data.types[d] === "separator" || data.types[d] === "jsx_attribute_start" || (data.token[d] === "}" && parse.structure[parse.structure.length - 1][0] === "global"))) {
                        ltype        = "markup";
                        options.language = "jsx";
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
                                if (nextchar(1, false) === "/") {
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
                    }
                    ltype = "operator";
                    ltoke = operator();
                    recordPush("");
                    return;
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
                                if (dd === "" && c[cc - 1] + c[cc] !== "\u002a/") {
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
                        synlen = syntax.length;
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
                    if (c[a] === "?" && ("+-\u002a/.?".indexOf(c[a + 1]) > -1 || (c[a + 1] === ":" && syntax.join("").indexOf(c[a + 2]) < 0))) {
                        if (c[a + 1] === "." && (/\d/).test(c[a + 2]) === false) {
                            output = "?.";
                        } else if (c[a + 1] === "?") {
                            output = "??";
                        }
                        if (output === "") {
                            return "?";
                        }
                    }
                    if (c[a] === ":" && "+-\u002a/".indexOf(c[a + 1]) > -1) {
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
                            datatype[datatype.length - 1] = false;
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
                            datatype[datatype.length - 1] = false;
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
                            datatype[datatype.length - 1] = false;
                            return "=";
                        }
                    }
                    if (c[a] === ":") {
                        if (options.language === "typescript" || options.language === "flow") {
                            if (data.stack[parse.count] === "arguments") {
                                if (data.token[parse.count] === "?") {
                                    parse.pop(data);
                                    output = "?:";
                                    a = a - 1;
                                }
                                datatype[datatype.length - 1] = true;
                            } else if (ltoke === ")" && (data.token[data.begin[parse.count] - 1] === "function" || data.token[data.begin[parse.count] - 2] === "function")) {
                                datatype[datatype.length - 1] = true;
                            } else if (ltype === "reference") {
                                g = parse.count;
                                let colon:boolean = false;
                                do {
                                    if (data.begin[g] === data.begin[parse.count]) {
                                        if (g < parse.count && data.token[g] === ":" && data.types[g + 1] !== "type") {
                                            colon = true;
                                        }
                                        if (data.token[g] === "?" && colon === false) {
                                            break;
                                        }
                                        if (data.token[g] === ";" || data.token[g] === "x;") {
                                            break;
                                        }
                                        if (data.token[g] === "var" || data.token[g] === "let" || data.token[g] === "const" || data.types[g] === "type") {
                                            datatype[datatype.length - 1] = true;
                                            break;
                                        }
                                    } else {
                                        if (data.types[g] === "type_end") {
                                            datatype[datatype.length - 1] = true;
                                            break;
                                        }
                                        g = data.begin[g];
                                    }
                                    g = g - 1;
                                } while (g > data.begin[parse.count]);
                            }
                        } else if ((data.types[parse.count] === "word" || data.types[parse.count] === "reference") && data.token[parse.count - 1] === "[") {
                            parse.structure[parse.structure.length - 1][0] = "attribute";
                            data.stack[parse.count] = "attribute";
                        }
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
                    return output;
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
                                ender: data.ender[index],
                                lexer: data.lexer[index],
                                lines: data.lines[index],
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
                                index  : walk
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
                            index  : walk - 1
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
                // determine the definition of containment by stack
                recordPush     = function lexer_script_recordPush(structure: string):void {
                    const record:record = {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "script",
                        lines: parse.linesSpace,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: ltoke,
                        types: ltype
                    };
                    parse.push(data, record, structure);
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
                // determines if a slash comprises a valid escape or if it is escaped itself
                slashes        = function lexer_script_slashes(index:number):boolean {
                    const slashy:number = index;
                    do {
                        index = index - 1;
                    } while (c[index] === "\\" && index > 0);
                    if ((slashy - index) % 2 === 1) {
                        return true;
                    }
                    return false;
                },
                // operations for start types: (, [, {
                start          = function lexer_script_start(x:string):void {
                    let aa:number    = parse.count,
                        wordx:string = "",
                        wordy:string = "",
                        stack:string = "",
                        func:boolean = false;
                    brace.push(x);
                if (x === "{" && (data.types[parse.count] === "type" || data.types[parse.count] === "type_end" || data.types[parse.count] === "generic")) {
                        // this block determines if a function body follows a type annotation
                        let begin:number = 0;
                        if (data.types[parse.count] === "type_end") {
                            aa = data.begin[parse.count];
                        }
                        begin = aa;
                        do {
                            aa = aa - 1;
                            if (data.begin[aa] !== begin && data.begin[aa] !== -1) {
                                break;
                            }
                            if (data.token[aa] === ":") {
                                break;
                            }
                        } while (aa > data.begin[aa]);
                        if (data.token[aa] === ":" && data.stack[aa - 1] === "arguments") {
                            datatype.push(false);
                            func = true;
                        } else {
                            datatype.push(datatype[datatype.length - 1]);
                        }
                        aa = parse.count;
                    
                    } else if (x === "[" && data.types[parse.count] === "type_end") {
                        datatype.push(true);
                    } else {
                        datatype.push(datatype[datatype.length - 1]);
                    }
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
                    if (datatype[datatype.length - 1] === true) {
                        ltype = "type_start";
                    } else {
                        ltype = "start";
                    }
                    if (x === "(" || x === "x(") {
                        asifix();
                    } else if (x === "{") {
                        if (paren > -1) {
                            if (data.begin[paren - 1] === data.begin[data.begin[aa] - 1] || data.token[data.begin[aa]] === "x(") {
                                paren = -1;
                                if (options.correct === true) {
                                    end(")");
                                } else {
                                    end("x)");
                                }
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
                    if (ltoke === "{" && (data.types[aa] === "word" || data.token[aa] === "]")) {
                        let bb:number = aa;
                        if (data.token[bb] === "]") {
                            do {
                                bb = data.begin[bb] - 1;
                            } while (data.token[bb] === "]");
                        }
                        do {
                            if (data.types[bb] === "start" || data.types[bb] === "end" || data.types[bb] === "operator") {
                                break;
                            }
                            bb = bb - 1;
                        } while (bb > 0);
                        if (data.token[bb] === ":" && data.stack[bb - 1] === "arguments") {
                            stack = "function";
                            references.push(funreferences);
                            funreferences = [];
                        }
                    }
                    if (ltype === "type_start") {
                        stack = "data_type";
                    } else if (stack === "" && (ltoke === "{" || ltoke === "x{")) {
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
                        } else if (func === true || (data.types[parse.count] === "type_end" && data.stack[data.begin[parse.count] - 2] === "arguments")) {
                            // working around typescript inline interface
                            stack = "function";
                        } else if (
                            wordx === ")" &&
                            data.stack[aa] === "method" &&
                            (data.types[data.begin[aa] - 1] === "word" || data.types[data.begin[aa] - 1] === "property" || data.types[data.begin[aa] - 1] === "reference")
                        ) {
                            stack = "function";
                        } else if (data.types[aa] === "word" && ltoke === "{" && data.token[aa] !== "return" && data.token[aa] !== "in" && data.token[aa] !== "import" && data.token[aa] !== "const" && data.token[aa] !== "let" && data.token[aa] !== "") {
                            // ES6 block
                            stack = "block";
                        } else if (ltoke === "{" && (data.token[aa] === "x}" || data.token[aa] === "}") && "if|else|for|while|function|class|switch|catch|finally".indexOf(data.stack[aa]) > -1) {
                            // ES6 block
                            stack = "block";
                        } else if (data.stack[aa] === "arguments") {
                            stack = "function";
                        } else if (data.types[aa] === "generic") {
                            do {
                                aa = aa - 1;
                                if (data.token[aa] === "function" || data.stack[aa] === "arguments") {
                                    stack = "function";
                                    break;
                                }
                                if (data.token[aa] === "interface") {
                                    stack = "map";
                                    break;
                                }
                                if (data.token[aa] === ";") {
                                    stack = "object";
                                    break;
                                }
                            } while (aa > data.begin[parse.count]);
                        } else if ((options.language === "java" || options.language === "csharp") && data.types[parse.count - 1] === "reference" && data.token[parse.count - 2] === "]") {
                            stack = "array";
                        } else {
                            stack = "object";
                        }
                        if (stack !== "object" && stack !== "class") {
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
                        if (wordx === "function" || data.token[aa - 1] === "function" || data.token[aa - 1] === "function*" || data.token[aa - 2] === "function") {
                            stack = "arguments";
                        } else if (data.token[aa - 1] === "." || data.token[data.begin[aa] - 2] === ".") {
                            stack = "method";
                        } else if (data.types[aa] === "generic") {
                            stack = "method";
                        } else if (data.token[aa] === "}" && data.stack[aa] === "function") {
                            stack = "method";
                        } else if (wordx === "if" || wordx === "for" || wordx === "class" || wordx === "while" || wordx === "catch" || wordx === "finally" || wordx === "switch" || wordx === "with") {
                            stack = "expression";
                        } else if (data.types[aa] === "word" || data.types[aa] === "property" || data.types[aa] === "reference") {
                            stack = "method";
                        } else {
                            stack = "paren";
                        }
                    }
                    recordPush(stack);
                    if (classy.length > 0) {
                        classy[classy.length - 1] = classy[classy.length - 1] + 1;
                    }
                },
                // ES6 template string support
                tempstring     = function lexer_script_tempstring():string {
                    const output:string[] = [c[a]];
                    a = a + 1;
                    if (a < b) {
                        do {
                            output.push(c[a]);
                            if (c[a] === "`" && (c[a - 1] !== "\\" || slashes(a - 1) === false)) {
                                break;
                            }
                            if (c[a - 1] === "$" && c[a] === "{" && (c[a - 2] !== "\\" || slashes(a - 2) === false)) {
                                break;
                            }
                            a = a + 1;
                        } while (a < b);
                    }
                    return output.join("");
                },
                // determines tag names for {% %} based template tags and returns a type
                tname          = function lexer_script_tname(x:string):[string, string] {
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
                        return ["template_else", `template_${name}`];
                    }
                    if (st === "{{") {
                        if (name === "end") {
                            return ["template_end", ""];
                        }
                        if ((name === "block" && (/\{%\s*\w/).test(source) === false) || name === "define" || name === "form" || name === "if" || name === "range" || name === "with") {
                            return ["template_start", `template_${name}`];
                        }
                        return ["template", ""];
                    }
                    en = namelist.length - 1;
                    if (en > -1) {
                        do {
                            if (name === namelist[en] && (name !== "block" || (/\{%\s*\w/).test(source) === false)) {
                                return ["template_start", `template_${name}`];
                            }
                            if (name === "end" + namelist[en]) {
                                return ["template_end", ""];
                            }
                            en = en - 1;
                        } while (en > -1);
                    }
                    return ["template", ""];
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
                                index  : parse.count - 3
                            });
                        },
                        hoisting = function lexer_script_word_hoisting(index:number, ref:string, samescope:boolean):void {
                            const begin:number = data.begin[index];
                            let parent:number = 0;
                            do {
                                if (data.token[index] === ref && data.types[index] === "word") {
                                    if (samescope === true) {
                                        // the simple state is for hoisted references, var and function declarations
                                        data.types[index] = "reference";
                                    } else if (data.begin[index] > begin && data.token[data.begin[index]] === "{" && data.stack[index] !== "object" && data.stack[index] !== "class" && data.stack[index] !== "data_type") {
                                        // the complex state is for non-hoisted references living in prior functions of the same parent scope
                                        if (data.stack[index] === "function") {
                                            data.types[index] = "reference";
                                        } else {
                                            // this looping is necessary to determine if there is a function between the reference and the declared scope
                                            parent = data.begin[index];
                                            do {
                                                if (data.stack[parent] === "function") {
                                                    data.types[index] = "reference";
                                                    break;
                                                }
                                                parent = data.begin[parent];
                                            } while (parent > begin);
                                        }
                                    }
                                }
                                index = index - 1;
                            } while (index > begin);
                        };
                    do {
                        lex.push(c[f]);
                        if (c[f] === "\\") {
                            sparser.parseerror = `Illegal escape in JavaScript on line number ${parse.lineNumber}`;
                        }
                        f = f + 1;
                    } while (f < a);
                    if (ltoke.charAt(0) === "\u201c") {
                        sparser.parseerror = `Quote looking character (\u201c, \\u201c) used instead of actual quotes on line number ${parse.lineNumber}`;
                    } else if (ltoke.charAt(0) === "\u201d") {
                        sparser.parseerror = `Quote looking character (\u201d, \\u201d) used instead of actual quotes on line number ${parse.lineNumber}`;
                    }
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
                        if (options.lexer_options.script.variable_list !== "none" && (output === "var" || output === "let" || output === "const")) {
                            if (data.types[g] === "comment") {
                                do {
                                    g = g - 1;
                                } while (
                                    g > 0 && (data.types[g] === "comment")
                                );
                            }
                            if (options.lexer_options.script.variable_list === "list" && vart.len > -1 && vart.index[vart.len] === g && output === vart.word[vart.len]) {
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
                        } else if (vart.len > -1 && output !== vart.word[vart.len] && parse.count === vart.index[vart.len] && data.token[vart.index[vart.len]] === ";" && ltoke !== vart.word[vart.len] && options.lexer_options.script.variable_list === "list") {
                            vartpop();
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
                        nextitem = nextchar(2, false);
                        if (output === "void") {
                            if (tokel === ":" && data.stack[parse.count - 1] === "arguments") {
                                ltype = "type";
                            } else {
                                ltype = "word";
                            }
                        } else if ((options.language === "java" || options.language === "csharp") && output === "static") {
                            ltype = "word";
                        } else if (
                            (
                                parse.structure[parse.structure.length - 1][0] === "object" ||
                                parse.structure[parse.structure.length - 1][0] === "class" ||
                                parse.structure[parse.structure.length - 1][0] === "data_type"
                            ) && (
                                data.token[parse.count] === "{" ||
                                (data.token[data.begin[parse.count]] === "{" && data.token[parse.count] === ",") ||
                                (data.types[parse.count] === "template_end" && (data.token[data.begin[parse.count] - 1] === "{" || data.token[data.begin[parse.count] - 1] === ","))
                            )
                        ) {
                            if (output === "return" || output === "break") {
                                ltype = "word";
                            } else {
                                ltype = "property";
                            }
                        } else if (datatype[datatype.length - 1] === true  || ((options.language === "typescript" || options.language === "flow") && tokel === "type")) {
                            ltype = "type";
                        } else if ((options.language === "java" || options.language === "csharp") && (tokel === "public" || tokel === "private" || tokel === "static" || tokel === "final")) {
                            ltype = "reference";
                        } else if ((options.language === "java" || options.language === "csharp") && ltoke !== "var" && (ltype === "end" || ltype === "word") && nextitem.charAt(0) === "=" && nextitem.charAt(1) !== "=") {
                            ltype = "reference";
                        } else if (references.length > 0 && (tokel === "function" || tokel === "class" || tokel === "const" || tokel === "let" || tokel === "var" || tokel === "new" || tokel === "void")) {
                            ltype = "reference";
                            references[references.length - 1].push(output);
                            if (options.language === "javascript" || options.language === "jsx" || options.language === "typescript" || options.language === "flow") {
                                if (tokel === "var" || (tokel === "function" && data.types[parse.count - 1] !== "operator" && data.types[parse.count - 1] !== "start" && data.types[parse.count - 1] !== "end")) {
                                    hoisting(parse.count, output, true);
                                } else {
                                    hoisting(parse.count, output, false);
                                }
                            } else {
                                hoisting(parse.count, output, false);
                            }
                        } else if (parse.structure[parse.structure.length - 1][0] === "arguments" && ltype !== "operator") {
                            ltype = "reference";
                            funreferences.push(output);
                        } else if (tokel === "," && data.stack[parse.count] !== "method" &&  (data.stack[parse.count] !== "expression" || data.token[data.begin[parse.count] - 1] === "for")) {
                            let d:number = parse.count;
                            const e:number = parse.structure[parse.structure.length - 1][1];
                            do {
                                if (data.begin[d] === e) {
                                    if (data.token[d] === ";") {
                                        break;
                                    }
                                    if (data.token[d] === "var" || data.token[d] === "let" || data.token[d] === "const" || data.token[d] === "type") {
                                        break;
                                    }
                                } else if (data.types[d] === "end") {
                                    d = data.begin[d];
                                }
                                d = d - 1;
                            } while (d > e);
                            if (references.length > 0 && data.token[d] === "var") {
                                ltype = "reference";
                                references[references.length - 1].push(output);
                                if (options.language === "javascript" || options.language === "jsx" || options.language === "typescript" || options.language === "flow") {
                                    hoisting(d, output, true);
                                } else {
                                    hoisting(d, output, false);
                                }
                            } else if (references.length > 0 && (data.token[d] === "let" || data.token[d] === "const" || (data.token[d] === "type" && (options.language === "typescript" || options.language === "flow")))) {
                                ltype = "reference";
                                references[references.length - 1].push(output);
                                hoisting(d, output, false);
                            } else {
                                ltype = "word";
                            }
                        } else if (parse.structure[parse.structure.length - 1][0] !== "object" || (parse.structure[parse.structure.length - 1][0] === "object" && ltoke !== "," && ltoke !== "{")) {
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
                            } else {
                                ltype = "word";
                            }
                        } else {
                            ltype = "word";
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
                            ltoke = (options.correct === true)
                                ? "{"
                                : "x{";
                            ltype = "start";
                            brace.push("x{");
                            recordPush("do");
                        }
                    }
                    if (output === "else") {
                        nextitem = nextchar(2, true);
                        let x:number = parse.count - 1;
                        if (data.types[x] === "comment") {
                            do {
                                x = x - 1;
                            } while (x > 0 && data.types[x] === "comment");
                        }
                        if (data.token[x] === "x}") {
                            if (data.token[parse.count] === "else") {
                                if (data.stack[parse.count - 1] !== "if" && data.types[parse.count - 1] !== "comment" && data.stack[parse.count - 1] !== "else") {
                                    brace.pop();
                                    parse.splice({
                                        data   : data,
                                        howmany: 0,
                                        index  : parse.count - 1,
                                        record : {
                                            begin: data.begin[data.begin[data.begin[parse.count - 1] - 1] - 1],
                                            ender: -1,
                                            lexer: "script",
                                            lines: 0,
                                            stack: "if",
                                            token: (options.correct === true)
                                                ? "}"
                                                : "x}",
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
                            ltoke = (options.correct === true)
                                ? "{"
                                : "x{";
                            ltype = "start";
                            brace.push("x{");
                            recordPush("else");
                        }
                    }
                    if ((output === "for" || output === "if" || output === "switch" || output === "catch") && options.language !== "twig" && data.token[parse.count - 1] !== ".") {
                        nextitem = nextchar(1, true);
                        if (nextitem !== "(") {
                            paren = parse.count;
                            if (options.correct === true) {
                                start("(");
                            } else {
                                start("x(");
                            }
                        }
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
                    general("<?php", "?>", "template");
                } else if (c[a] === "<" && c[a + 1] === "?" && c[a + 2] === "=") {
                    // php
                    general("<?=", "?>", "template");
                } else if (c[a] === "<" && c[a + 1] === "%") {
                    // asp
                    general("<%", "%>", "template");
                } else if (c[a] === "{" && c[a + 1] === "%") {
                    // twig
                    general("{%", "%}", "template");
                } else if (c[a] === "{" && c[a + 1] === "{" && c[a + 2] === "{") {
                    // mustache
                    general("{{{", "}}}", "template");
                } else if (c[a] === "{" && c[a + 1] === "{") {
                    // handlebars
                    general("{{", "}}", "template");
                } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-" && c[a + 4] === "#") {
                    // ssi
                    general("<!--#", "-->", "template");
                } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-") {
                    // markup comment
                    general("<!--", "-->", "comment");
                } else if (c[a] === "<") {
                    // markup
                    markup();
                } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "*")) {
                    // comment block
                    blockComment();
                } else if ((parse.count < 0 || data.lines[parse.count] > 0) && c[a] === "#" && c[a + 1] === "!" && (c[a + 2] === "/" || c[a + 2] === "[")) {
                    // shebang
                    general("#!" + c[a + 2], "\n", "string");
                } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "/")) {
                    // comment line
                    lineComment();
                } else if (c[a] === "#" && c[a + 1] === "r" && c[a + 2] === "e" && c[a + 3] === "g" && c[a + 4] === "i" && c[a + 5] === "o" && c[a + 6] === "n" && (/\s/).test(c[a + 7]) === true) {
                    // comment line
                    asi(false);
                    general("#region", "\n", "comment");
                } else if (c[a] === "#" && c[a + 1] === "e" && c[a + 2] === "n" && c[a + 3] === "d" && c[a + 4] === "r" && c[a + 5] === "e" && c[a + 6] === "g" && c[a + 7] === "i" && c[a + 8] === "o" && c[a + 9] === "n") {
                    // comment line
                    asi(false);
                    general("#endregion", "\n", "comment");
                } else if (c[a] === "`" || (c[a] === "}" && parse.structure[parse.structure.length - 1][0] === "template_string")) {
                    // template string
                    if (wordTest > -1) {
                        word();
                    }
                    ltoke = tempstring();
                    if (ltoke.charAt(0) === "}" && ltoke.slice(ltoke.length - 2) === "${") {
                        ltype = "template_string_else";
                        recordPush("template_string");
                    } else if (ltoke.slice(ltoke.length - 2) === "${") {
                        ltype = "template_string_start";
                        recordPush("template_string");
                    } else if (ltoke.charAt(0) === "}") {
                        ltype = "template_string_end";
                        recordPush("");
                    } else {
                        ltype = "string";
                        recordPush("");
                    }
                } else if (c[a] === "\"" || c[a] === "'") {
                    // string
                    general(c[a], c[a], "string");
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
                    if (datatype[datatype.length - 1] === true && data.stack[parse.count].indexOf("type") < 0) {
                        datatype[datatype.length - 1] = false;
                    }
                    if (ltype === "comment") {
                        commaComment();
                    } else if (vart.len > -1 && vart.count[vart.len] === 0 && options.lexer_options.script.variable_list === "each") {
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
                    // period
                    if (wordTest > -1) {
                        word();
                    }
                    datatype[datatype.length - 1] = false;
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
                    if (datatype[datatype.length - 1] === true && data.stack[parse.count].indexOf("type") < 0) {
                        datatype[datatype.length - 1] = false;
                    }
                    if (options.language === "qml") {
                        ltoke = (options.correct === true)
                            ? ";"
                            : "x;";
                        ltype = "separator";
                        recordPush("");
                    } else {
                        if (classy[classy.length - 1] === 0) {
                            classy.pop();
                        }
                        if (vart.len > -1 && vart.count[vart.len] === 0) {
                            if (options.lexer_options.script.variable_list === "each") {
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
                    blockinsert();
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
                    } else if (ltoke === "*" && data.token[parse.count] === "function") {
                        data.token[parse.count] = "function*";
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
                if (vart.len > -1 && parse.count === vart.index[vart.len] + 1 && data.token[vart.index[vart.len]] === ";" && ltoke !== vart.word[vart.len] && ltype !== "comment" && options.lexer_options.script.variable_list === "list") {
                    vartpop();
                }
                a = a + 1;
            } while (a < b);
            if (wordTest > -1) {
                word();
            }
            if (((data.token[parse.count] !== "}" && data.token[0] === "{") || data.token[0] !== "{") && ((data.token[parse.count] !== "]" && data.token[0] === "[") || data.token[0] !== "[")) {
                asi(false);
            }
            if (sourcemap[0] === parse.count) {
                ltoke = "\n" + sourcemap[1];
                ltype = "string";
                recordPush("");
            }
            if (data.token[parse.count] === "x;" && (data.token[parse.count - 1] === "}" || data.token[parse.count - 1] === "]") && data.begin[parse.count - 1] === 0) {
                parse.pop(data);
            }
            return data;
        };
    
    sparser.lexers.script = script;
}());
