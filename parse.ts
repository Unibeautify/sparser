/*
Parse Framework
*/
/*jslint node:true */
/*eslint-env node*/
/*eslint no-console:0*/
/*global global, location*/

(function parse_init() {
    "use strict";
    let framework:parseFramework;
    const parse: parse = {
            concat: function parse_concat(data:data, array:data):void {
                parse
                    .datanames
                    .forEach(function parse_concat_datanames(value) {
                        data[value] = data[value].concat(array[value]);
                    });
                if (data === parse.data) {
                    parse.count = data.token.length - 1;
                }
            },
            count: -1,
            data: {
                begin: [],
                lexer: [],
                lines: [],
                presv: [],
                stack: [],
                token: [],
                types: []
            },
            datanames: ["begin", "lexer", "lines", "presv", "stack", "token", "types"],
            lineNumber: 1,
            linesSpace: 0,
            objectSort: function parse_objectSort(data: data):void {
                let cc:number = parse.count,
                    global:boolean = (data.lexer[cc] === "style" && parse.structure[parse.structure.length - 1][0] === "global"),
                    dd:number = parse.structure[parse.structure.length - 1][1],
                    ee:number = 0,
                    ff:number = 0,
                    gg:number = 0,
                    behind:number = 0,
                    commaTest:boolean = true,
                    front:number = 0,
                    keyend:number = 0,
                    keylen:number = 0;
                const keys:Array<[number, number]> = [],
                    length:number = parse.count,
                    begin:number = dd,
                    stack:string = (global === true)
                        ? "global"
                        : parse.structure[parse.structure.length - 1][0],
                    style:boolean = (data.lexer[cc] === "style"),
                    delim:[string, string] = (style === true)
                        ? [";", "semi"]
                        : [",", "separator"],
                    lines:number = parse.linesSpace,
                    sort    = function parse_objectSort_sort(x:[number, number], y:[number, number]):number {
                        let xx = x[0],
                            yy = y[0];
                        if (data.types[xx] === "comment") {
                            do {
                                xx = xx + 1;
                            } while (xx < length && (data.types[xx] === "comment"));
                            if (data.token[xx] === undefined) {
                                return 1;
                            }
                        }
                        if (data.types[yy] === "comment") {
                            do {
                                yy = yy + 1;
                            } while (yy < length && (data.types[yy] === "comment"));
                            if (data.token[yy] === undefined) {
                                return 1;
                            }
                        }

                        if (style === true) {
                            if (data.token[xx].indexOf("@import") === 0 || data.token[yy].indexOf("@import") === 0) {
                                // JavaScript's standard array sort is uses implementation specific algorithms.
                                // This simple numeric trick forces conformance.
                                if (xx < yy) {
                                    return -1;
                                }
                                return 1;
                            }
                            if (data.types[xx] !== data.types[yy]) {
                                if (data.types[xx] === "variable") {
                                    return -1;
                                }
                                if (data.types[xx] === "selector") {
                                    return 1;
                                }
                                if (data.types[xx] === "property" && data.types[yy] !== "variable") {
                                    return -1;
                                }
                                if (data.types[xx] === "mixin" && data.types[yy] !== "property" && data.types[yy] !== "variable") {
                                    return -1;
                                }
                            }
                        }
                        if (data.token[xx].toLowerCase() > data.token[yy].toLowerCase()) {
                            return 1;
                        }
                        return -1;
                    },
                    store:data     = {
                        begin: [],
                        lexer: [],
                        lines: [],
                        presv: [],
                        stack: [],
                        token: [],
                        types: []
                    };
                behind = cc;
                do {
                    if (data.begin[cc] === dd || (global === true && cc < behind && data.token[cc] === "}" && data.begin[data.begin[cc]] === -1)) {
                        if (data.types[cc].indexOf("template") > -1) {
                            return;
                        }
                        if (data.token[cc] === delim[0] || (style === true && data.token[cc] === "}" && data.token[cc + 1] !== ";")) {
                            commaTest = true;
                            front = cc + 1;
                        } else if (style === true && data.token[cc - 1] === "}") {
                            commaTest = true;
                            front = cc;
                        }
                        if (front === 0 && data.types[0] === "comment") {
                            // keep top comments at the top
                            do {
                                front = front + 1;
                            } while (data.types[front] === "comment");
                        } else if (data.types[front] === "comment" && data.lines[front] < 2) {
                            // if a comment follows code on the same line then keep the comment next to the code it follows
                            front = front + 1;
                        }
                        if (commaTest === true && (data.token[cc] === delim[0] || (style === true && data.token[cc - 1] === "}")) && front <= behind) {
                            if (style === true && "};".indexOf(data.token[behind]) < 0) {
                                behind = behind + 1;
                            } else if (style === false && data.token[behind] !== ",") {
                                behind = behind + 1;
                            }
                            keys.push([front, behind]);
                            if (style === true && data.token[front] === "}") {
                                behind = front;
                            } else {
                                behind = front - 1;
                            }
                        }
                    }
                    cc = cc - 1;
                } while (cc > dd);
                if (keys.length > 0 && keys[keys.length - 1][0] > cc + 1) {
                    ee = keys[keys.length - 1][0] - 1;
                    if (data.types[ee] === "comment" && data.lines[ee] > 1) {
                        do {
                            ee = ee - 1;
                        } while (ee > 0 && data.types[ee] === "comment");
                        keys[keys.length - 1][0] = ee + 1;
                    }
                    if (data.types[cc + 1] === "comment" && cc === -1) {
                        do {
                            cc = cc + 1;
                        } while (data.types[cc + 1] === "comment");
                    }
                    keys.push([
                        cc + 1,
                        ee
                    ]);
                }
                if (keys.length > 1) {
                    if (style === true || data.token[cc - 1] === "=" || data.token[cc - 1] === ":" || data.token[cc - 1] === "(" || data.token[cc - 1] === "[" || data.token[cc - 1] === "," || data.types[cc - 1] === "word" || cc === 0) {
                        keys.sort(sort);
                        keylen    = keys.length;
                        commaTest = false;
                        dd        = 0;
                        do {
                            keyend = keys[dd][1];
                            if (style === true) {
                                gg = keyend;
                                if (data.types[gg] === "comment") {
                                    gg = gg - 1;
                                }
                                if (data.token[gg] === "}") {
                                    keyend = keyend + 1;
                                    delim[0] = "}";
                                    delim[1] = "end";
                                } else {
                                    delim[0] = ";";
                                    delim[1] = "semi"
                                }
                            }
                            if (data.lines[keys[dd][0] - 1] > 1 && store.lines.length > 0) {
                                store.lines[store.lines.length - 1] = data.lines[keys[dd][0] - 1];
                            }
                            ee = keys[dd][0];
                            if (style === true && data.types[keyend] === "comment" && data.types[keyend + 1] !== "comment" && dd < keylen - 1) {
                                // missing a terminal comment causes many problems
                                keyend = keyend + 1;
                            }
                            if (ee < keyend) {
                                do {
                                    if (style === false && dd === keylen - 1 && ee === keyend - 2 && data.token[ee] === "," && data.types[ee + 1] === "comment") {
                                        // do not include terminal commas that are followed by a comment
                                        ff = ff + 1;
                                    } else {
                                        parse.push(store, {
                                            begin: data.begin[ee],
                                            lexer: data.lexer[ee],
                                            lines: data.lines[ee],
                                            presv: data.presv[ee],
                                            stack: data.stack[ee],
                                            token: data.token[ee],
                                            types: data.types[ee]
                                        }, "");
                                        ff = ff + 1;
                                    }

                                    //remove extra commas
                                    if (data.token[ee] === delim[0] && (style === true || data.begin[ee] === data.begin[keys[dd][0]])) {
                                        commaTest = true;
                                    } else if (data.token[ee] !== delim[0] && data.types[ee] !== "comment") {
                                        commaTest = false;
                                    }
                                    ee = ee + 1;
                                } while (ee < keyend);
                            }

                            // injecting the list delimiter
                            if (commaTest === false && (style === true || dd < keylen - 1)) {
                                ee = store.types.length - 1;
                                if (store.types[ee] === "comment") {
                                    do {
                                        ee = ee - 1;
                                    } while (
                                        ee > 0 && (store.types[ee] === "comment")
                                    );
                                }
                                ee = ee + 1;
                                parse.splice({
                                    data   : store,
                                    howmany: 0,
                                    index  : ee,
                                    record : {
                                        begin: begin,
                                        lexer: store.lexer[ee - 1],
                                        lines: 0,
                                        presv: false,
                                        stack: stack,
                                        token: delim[0],
                                        types: delim[1]
                                    }
                                });
                                ff                  = ff + 1;
                            }
                            dd = dd + 1;
                        } while (dd < keylen);
                        parse.splice({
                            data   : data,
                            howmany: ff,
                            index  : cc + 1,
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
                        parse.linesSpace = lines;
                        parse.concat(data, store);
                        return;
                    }
                }
                return;
            },
            parseOptions: {
                correct: false,
                crlf: false,
                language: "javascript",
                lexer: "script",
                lexerOptions: {
                    script: {}
                },
                outputFormat: "arrays",
                source: "",
                wrap: 0
            },
            pop: function parse_pop(data: data): record {
                const output = {
                    begin: data.begin.pop(),
                    lexer: data.lexer.pop(),
                    lines: data.lines.pop(),
                    presv: data.presv.pop(),
                    stack: data.stack.pop(),
                    token: data.token.pop(),
                    types: data.types.pop()
                };
                if (data === parse.data) {
                    parse.count = parse.count - 1;
                }
                return output;
            },
            push: function parse_push(data:data, record:record, structure:string):void {
                parse
                    .datanames
                    .forEach(function parse_push_datanames(value) {
                        data[value].push(record[value]);
                    });
                if (data === parse.data) {
                    parse.count      = parse.count + 1;
                    parse.linesSpace = 0;
                    if (record.types === "start" || record.types.indexOf("_start") > 0) {
                        parse.structure.push([structure, parse.count]);
                    } else if (record.types === "end" || record.types.indexOf("_end") > 0) {
                        parse.structure.pop();
                    } else if (record.types === "else" || record.types.indexOf("_else") > 0) {
                        parse.structure[parse.structure.length - 1] = ["else", parse.count];
                    }
                }
            },
            safeSort: function parse_safeSort(array: any[], operation:"ascend" | "descend" | "normal", recursive:boolean): any[] {
                let extref  = function parse_safeSort_extref(item: any):any {
                    //worthless function for backwards compatibility with older versions of V8 node.
                    return item;
                };
                const arTest  = function parse_safeSort_arTest(item:any):boolean {
                        if (Array.isArray(item) === true) {
                            return true;
                        }
                        return false;
                    },
                    normal  = function parse_safeSort_normal(item:any[]):any[] {
                        let storeb:any = item;
                        const done:any = [item[0]],
                            child   = function safeSort_normal_child():void {
                                let a:number = 0;
                                const len:number = storeb.length;
                                if (a < len) {
                                    do {
                                        if (arTest(storeb[a]) === true) {
                                            storeb[a] = parse_safeSort_normal(storeb[a]);
                                        }
                                        a = a + 1;
                                    } while (a < len);
                                }
                            },
                            recurse = function parse_safeSort_normal_recurse(x:any) {
                                let a:number = 0;
                                const storea:any[] = [],
                                    len:number      = storeb.length;
                                if (a < len) {
                                    do {
                                        if (storeb[a] !== x) {
                                            storea.push(storeb[a]);
                                        }
                                        a = a + 1;
                                    } while (a < len);
                                }
                                storeb = storea;
                                if (storea.length > 0) {
                                    done.push(storea[0]);
                                    extref(storea[0]);
                                } else {
                                    if (recursive === true) {
                                        child();
                                    }
                                    item = storeb;
                                }
                            };
                        extref = recurse;
                        recurse(array[0]);
                        return item;
                    },
                    descend = function parse_safeSort_descend(item:any[]):any[] {
                        let c:number       = 0;
                        const len:number     = item.length,
                            storeb:any[]  = item,
                            child   = function parse_safeSort_descend_child():void {
                                let a:number = 0;
                                const lenc:number = storeb.length;
                                if (a < lenc) {
                                    do {
                                        if (arTest(storeb[a]) === true) {
                                            storeb[a] = parse_safeSort_descend(storeb[a]);
                                        }
                                        a = a + 1;
                                    } while (a < lenc);
                                }
                            },
                            recurse = function parse_safeSort_descend_recurse(value:string):string {
                                let a:number      = c,
                                    b:number      = 0,
                                    d:number      = 0,
                                    e:number      = 0,
                                    ind:any[]    = [],
                                    key:any    = storeb[c],
                                    tstore:string = "";
                                const tkey:string   = typeof key;
                                if (a < len) {
                                    do {
                                        tstore = typeof storeb[a];
                                        if (storeb[a] > key || (tstore > tkey)) {
                                            key = storeb[a];
                                            ind = [a];
                                        } else if (storeb[a] === key) {
                                            ind.push(a);
                                        }
                                        a = a + 1;
                                    } while (a < len);
                                }
                                d = ind.length;
                                a = c;
                                b = d + c;
                                if (a < b) {
                                    do {
                                        storeb[ind[e]] = storeb[a];
                                        storeb[a]      = key;
                                        e              = e + 1;
                                        a              = a + 1;
                                    } while (a < b);
                                }
                                c = c + d;
                                if (c < len) {
                                    extref("");
                                } else {
                                    if (recursive === true) {
                                        child();
                                    }
                                    item = storeb;
                                }
                                return value;
                            };
                        extref = recurse;
                        recurse("");
                        return item;
                    },
                    ascend  = function parse_safeSort_ascend(item:any[]):any[] {
                        let c:number       = 0;
                        const len:number     = item.length,
                            storeb:any[]  = item,
                            child   = function parse_safeSort_ascend_child():void {
                                let a:number = 0;
                                const lenc:number = storeb.length;
                                if (a < lenc) {
                                    do {
                                        if (arTest(storeb[a]) === true) {
                                            storeb[a] = parse_safeSort_ascend(storeb[a]);
                                        }
                                        a = a + 1;
                                    } while (a < lenc);
                                }
                            },
                            recurse = function parse_safeSort_ascend_recurse(value:string):string {
                                let a:number      = c,
                                    b:number      = 0,
                                    d:number      = 0,
                                    e:number      = 0,
                                    ind:any[]    = [],
                                    key:any    = storeb[c],
                                    tstore:string = "";
                                const tkey:string   = typeof key;
                                if (a < len) {
                                    do {
                                        tstore = typeof storeb[a];
                                        if (storeb[a] < key || tstore < tkey) {
                                            key = storeb[a];
                                            ind = [a];
                                        } else if (storeb[a] === key) {
                                            ind.push(a);
                                        }
                                        a = a + 1;
                                    } while (a < len);
                                }
                                d = ind.length;
                                a = c;
                                b = d + c;
                                if (a < b) {
                                    do {
                                        storeb[ind[e]] = storeb[a];
                                        storeb[a]      = key;
                                        e              = e + 1;
                                        a              = a + 1;
                                    } while (a < b);
                                }
                                c = c + d;
                                if (c < len) {
                                    extref("");
                                } else {
                                    if (recursive === true) {
                                        child();
                                    }
                                    item = storeb;
                                }
                                return value;
                            };
                        extref = recurse;
                        recurse("");
                        return item;
                    };
                if (arTest(array) === false) {
                    return array;
                }
                if (operation === "normal") {
                    return normal(array);
                }
                if (operation === "descend") {
                    return descend(array);
                }
                return ascend(array);
            },
            spacer: function parse_spacer(args:spacer): number {
                // * array - the characters to scan
                // * index - the index to start scanning from
                // * end   - the length of the array, to break the loop
                parse.linesSpace = 1;
                do {
                    if (args.array[args.index] === "\n") {
                        parse.linesSpace = parse.linesSpace + 1;
                        parse.lineNumber = parse.lineNumber + 1;
                    }
                    if ((/\s/).test(args.array[args.index + 1]) === false) {
                        break;
                    }
                    args.index = args.index + 1;
                } while (args.index < args.end);
                return args.index;
            },
            splice: function parse_splice(spliceData: splice): void {
                const finalItem:[number, string] = [parse.data.begin[parse.count], parse.data.token[parse.count]];
                // * data    - The data object to alter
                // * howmany - How many indexes to remove
                // * index   - The index where to start
                // * record  - A new record to insert
                if (spliceData.record.token !== "") {
                    parse
                        .datanames
                        .forEach(function parse_splice_datanames(value) {
                            spliceData
                                .data[value]
                                .splice(spliceData.index, spliceData.howmany, spliceData.record[value]);
                        });
                    if (spliceData.data === parse.data) {
                        parse.count      = (parse.count - spliceData.howmany) + 1;
                        if (finalItem[0] !== parse.data.begin[parse.count] || finalItem[1] !== parse.data.token[parse.count]) {
                            parse.linesSpace = 0;
                        }
                    }
                    return;
                }
                parse
                    .datanames
                    .forEach(function parse_splice_datanames(value) {
                        spliceData
                            .data[value]
                            .splice(spliceData.index, spliceData.howmany);
                    });
                if (spliceData.data === parse.data) {
                    parse.count      = parse.count - spliceData.howmany;
                    parse.linesSpace = 0;
                }
            },
            structure: [["global", -1]],
            wrapCommentBlock: function parse_wrapCommentBlock_init():[string, number] {
                return ["", 0];
            },
            wrapCommentLine: function parse_wrapCommentLine_init():[string, number] {
                return ["", 0];
            }
        },
        parser  = function parser_(parseOptions: parseOptions): void {
            parse.count      = -1;
            parse.data       = {
                begin: [],
                lexer: [],
                lines: [],
                presv: [],
                stack: [],
                token: [],
                types: []
            };
            parse.datanames  = [
                "begin",
                "lexer",
                "lines",
                "presv",
                "stack",
                "token",
                "types"
            ];
            parse.linesSpace = 0;
            parse.lineNumber = 1;
            parse.structure  = [
                ["global", -1]
            ];
            parse.parseOptions    = parseOptions;

            parse.structure.pop = function parse_structure_pop(): [string, number] {
                const len:number = parse.structure.length - 1,
                    arr: [string, number] = parse.structure[len];
                if (len > 0) {
                    parse
                        .structure
                        .splice(len, 1);
                }
                return arr;
            };
            if (framework.lexer[parseOptions.lexer] === undefined) {
                framework.parseerror = "Lexer '" + parseOptions.lexer + "' isn't available.";
            }
            if (typeof framework.lexer[parseOptions.lexer] === "function") {
                framework.parseerror = "";
                parseOptions.lexerOptions = (parseOptions.lexerOptions || {});
                Object.keys(framework.lexer).forEach(function parse_lexers(value) {
                    parseOptions.lexerOptions[value] = (parseOptions.lexerOptions[value] || {});
                });
                // This line parses the code using a lexer file
                framework.lexer[parseOptions.lexer](parseOptions.source + " ");
            } else {
                framework.parseerror = "Specified lexer, " + parseOptions.lexer + ", is not a function.";
            }

            // validate that all the data arrays are the same length
            (function parser_checkLengths(): void {
                let a:number    = 0,
                    b:number    = 0;
                const keys: string[] = Object.keys(parse.data),
                    c: number      = keys.length;
                do {
                    b = a + 1;
                    do {
                        if (parse.data[keys[a]].length !== parse.data[keys[b]].length) {
                            framework.parseerror = "'" + keys[a] + "' array is of different length than '" +
                                    keys[b] + "'";
                            break;
                        }
                        b = b + 1;
                    } while (b < c);
                    a = a + 1;
                } while (a < c - 1);
            }());

            if (parse.parseOptions.lexerOptions === undefined) {
                parse.parseOptions.lexerOptions = {};
                parse.parseOptions.lexerOptions[parseOptions.lexer] = {};
                parse.parseOptions.lexerOptions.markup = {};
            }
            if (parse.parseOptions.lexerOptions[parseOptions.lexer] === undefined) {
                parse.parseOptions.lexerOptions[parseOptions.lexer] = {};
            }
            if (parse.parseOptions.lexerOptions.markup === undefined) {
                parse.parseOptions.lexerOptions.markup = {};
            }
            
            if (parse.parseOptions.lexerOptions[parseOptions.lexer].objectSort === true || parse.parseOptions.lexerOptions.markup.tagSort === true) {
                let a:number = 0,
                    jsx:number = 0,
                    jsx_offset:number = 0;
                const data:data    = parse.data,
                    b:number         = data.begin.length,
                    structure: number[] = [-1],
                    struct = function parser_struct() {
                        if (data.types[a] === "start" || data.types[a] === "template_start" || (data.types[a] === "cdata" && data.token[data.begin[a - 1]].toLowerCase().indexOf("<script") === 0)) {
                            structure.push(a);
                        } else if (structure.length > 1 && (data.types[a] === "end" || data.types[a] === "template_end")) {
                            structure.pop();
                        } else if (data.types[a] === "template_else") {
                            structure[structure.length - 1] = a;
                        } else if (data.types[a] === "attribute" && data.lexer[a] === "markup" && (data.types[a - 1] === "start" || data.types[a - 1] === "singleton")) {
                            structure.push(a - 1);
                        } else if (data.lexer[a] === "markup" && data.types[a] !== "attribute" && data.types[structure[structure.length - 1] + 1] === "attribute") {
                            structure.pop();
                        }
                    };
                do {
                    if ((data.types[a - 1] === "attribute" || data.types[a - 1] === "jsx_attribute_end") && data.types[a] !== "attribute" && data.types[a] !== "jsx_attribute_start" && data.lexer[a - 1] === "markup" && data.types[data.begin[a - 1]] === "singleton") {
                        structure.pop();
                    }
                    if (data.begin[a] !== structure[structure.length - 1]) {
                        if (parse.parseOptions.lexerOptions[parseOptions.lexer].objectSort === true) {
                            if (data.stack[a] !== "jsx_attribute" && (data.lexer[a] === "script" || data.lexer[a] === "style")) {
                                data.begin[a] = structure[structure.length - 1];
                            } else if (data.lexer[a] === "markup" && data.lexer[a - 1] === "script") {
                                jsx = data.begin[a - 1];
                                jsx_offset = jsx - data.begin[a];
                                do {
                                    if (data.begin[a] + jsx_offset > 0) {
                                        data.begin[a] = data.begin[a] + jsx_offset;
                                    } else {
                                        data.begin[a] = structure[structure.length - 1];
                                    }
                                    struct();
                                    if (data.lexer[a + 1] === "script" && data.begin[a + 1] === jsx) {
                                        break;
                                    }
                                    a = a + 1;
                                } while(a < b);
                            }
                        } else if (parse.parseOptions.lexerOptions.markup.tagSort === true && data.lexer[a] === "markup") {
                            data.begin[a] = structure[structure.length - 1];
                        }
                    }
                    struct();
                    a = a + 1;
                } while (a < b);
            }
        },
        parserArrays = function parserArrays(parseOptions: parseOptions):data {
            parser(parseOptions);
            return parse.data;
        },
        parserObjects = function parserObjects(parseOptions: parseOptions): record[] {
            let a:number = 0,
                len:number = 0;
            const data:record[] = [];
            parser(parseOptions);
            len = parse.count + 1;
            do {
                data.push({
                    begin: parse.data.begin[a],
                    lexer: parse.data.lexer[a],
                    lines: parse.data.lines[a],
                    presv: parse.data.presv[a],
                    stack: parse.data.stack[a],
                    token: parse.data.token[a],
                    types: parse.data.types[a]
                });
                a = a + 1;
            } while (a < len);
            return data;
        };
        // parsing block comments and simultaneously applying word wrap
        parse.wrapCommentBlock = function parse_wrapCommentBlock(config: wrapConfig):[string, number] {
            let a:number = config.start,
                b:number = 0,
                c:number = 0,
                len:number = 0,
                lines:string[] = [],
                space:string = "",
                spaceLine:RegExp,
                emptyLine:boolean = false,
                output:string  = "";
            const build:string[] = [],
                second:string[]  = [],
                lf:"\r\n"|"\n" = (parse.parseOptions.crlf === true)
                    ? "\r\n"
                    : "\n",
                wrap:number = parse.parseOptions.wrap,
                emptyLines = function parse_wrapCommentBlock_emptyLines() {
                    if ((/^\s+$/).test(lines[b + 1]) === true || lines[b + 1] === "") {
                        do {
                            b = b + 1;
                        } while (b < len && ((/^\s+$/).test(lines[b + 1]) === true || lines[b + 1] === ""));
                    }
                    if (b < len - 1) {
                        second.push("");
                    }
                };
            do {
                build.push(config.chars[a]);
                if (config.chars[a - 1] === "*" && config.chars[a] === "/") {
                    break;
                }
                a = a + 1;
            } while (a < config.end);
            output = build.join("");
            if ((/^(\/\*\s*parse-ignore-start)/).test(output) === true || wrap < 1 || output.length <= wrap) {
                return [output, a];
            }
            b = config.start;
            if (b > 0 && config.chars[b - 1] !== "\n" && (/\s/).test(config.chars[b - 1]) === true) {
                do {
                    b = b - 1;
                } while (b > 0 && config.chars[b - 1] !== "\n" && (/\s/).test(config.chars[b - 1]) === true);
            }
            space = config.chars.slice(b, config.start).join("");
            spaceLine = new RegExp(`\n${space}`, "g");
            lines = output.replace(/\r\n/g, "\n").replace(spaceLine, "\n").split("\n");
            len = lines.length;
            lines[0] = lines[0].replace(/(\/\*\s*)/, "");
            lines[len - 1] = lines[len - 1].replace(/\s*\*\/$/, "");
            b = 0;
            do {
                if ((/^\s+$/).test(lines[b]) === true || lines[b] === "") {
                    emptyLines();
                } else if (lines[b].slice(0, 4) === "    ") {
                    second.push(lines[b]);
                } else {
                    lines[b] = `   ${lines[b].replace(/^\s+/, "").replace(/\s+$/, "").replace(/\s+/g, " ")}`;
                    c = lines[b].length;
                    if (c > wrap) {
                        do {
                            c = c - 1;
                            if ((/\s/).test(lines[b].charAt(c)) === true && c <= wrap) {
                                break;
                            }
                        } while (c > 0);
                        if (b === len - 1) {
                            lines.push(lines[b].slice(c + 1));
                            len = len + 1;
                        } else if ((/^\s+$/).test(lines[b + 1]) === true || lines[b + 1] === "") {
                            second.push(lines[b].slice(0, c));
                            lines[b] = lines[b].slice(c + 1);
                            emptyLine = true;
                            b = b - 1;
                        } else if (lines[b + 1].slice(0, 4) === "    ") {
                            lines.splice(b, 0, lines[b].slice(c + 1));
                            len = len + 1;
                        } else {
                            lines[b + 1] = `${lines[b].slice(c + 1)} ${lines[b + 1]}`;
                        }
                        if (emptyLine === false) {
                            lines[b] = lines[b].slice(0, c);
                        }
                    }
                    if (emptyLine === true) {
                        emptyLine = false;
                    } else {
                        second.push(lines[b]);
                    }
                }
                b = b + 1;
            } while (b < len);
            output = `${second.join(lf).replace("  ", "/*")} \u002a/`;
            return [output, a];
            /*let ee:number = config.start,
                ff:number = 0,
                gg:number = 0,
                lastspace:number = 0,
                space:string[] = [],
                codeflag:boolean = false,
                slice:string = "",
                build:string[] = [];
            const wrap:number = parse.parseOptions.wrap,
                lf:"\r\n"|"\n" = (parse.parseOptions.crlf === true)
                    ? "\r\n"
                    : "\n",
                spacegen = function parse_wrapCommentBlock_spacegen():string[] {
                    gg = ee;
                    do {
                        ee = ee + 1;
                    } while (ee < config.end && (/\s/).test(config.chars[ee]) === true);
                    return config.chars.slice(gg, ee).join("").split("\n");
                },
                fixStarEnd = function parse_fixStarEnd(input:string):string {
                    return parse.parseOptions.crlf + input.replace(/\s+/g, "");
                },
                insertSpace = function parse_wrapCommentBlock_insertSpace():void {
                    if (build.length > 0 && build[build.length - 1].indexOf("\n") < 0 && (/\s/).test(build[build.length - 1]) === false) {
                        build.push(" ");
                        lastspace = build.length - 1;
                        ff = ff + 1;
                    }
                },
                code = function parse_wrapCommentBlock_code():void {
                    if ((/^(\u0020{4}|\t)/).test(space[space.length - 1]) === true) {
                        ff = 0;
                        if (space.length > 2) {
                            build.push(lf);
                        }
                        build.push(lf);
                        build.push(space[space.length - 1]);
                        do {
                            if (config.chars[ee + 1] === "*" && config.chars[ee + 2] === "/") {
                                return;
                            }
                            build.push(config.chars[ee]);
                            ee = ee + 1;
                        } while (ee < config.end && config.chars[ee] !== "\n");

                        space = spacegen();
                        if ((/^(\u0020{4}|\t)/).test(space[space.length - 1]) === true) {
                            codeflag = true;
                            parse_wrapCommentBlock_code();
                        } else {
                            ee = ee - 1;
                            if (space.length > 2) {
                                build.push(lf);
                            }
                            build.push(lf);
                            build.push("   ");
                            codeflag = false;
                        }
                        return;
                    }
                    if (space.length > 2) {
                        ff = 0;
                        build.push(lf);
                        build.push(lf);
                        build.push("   ");
                    }
                    if (space.length > 1) {
                        codeflag = false;
                    }
                    ee = ee - 1;
                };
            // bypass space at the start
            if ((/\s/).test(config.chars[ee]) === true && wrap > 0) {
                do {
                    ee = ee + 1;
                } while ((/\s/).test(config.chars[ee]) === true);
            }
            do {
                if (config.chars[ee] === "*" && config.chars[ee + 1] === "/") {
                    break;
                }
                if ((/\s/).test(config.chars[ee]) === true && wrap > 0) {
                    // check for blank lines and code sections
                    if ((/\s/).test(config.chars[ee + 1]) === true) {
                        if ((/\s/).test(config.chars[ee - 1]) === true) {
                            do {
                                ee = ee - 1;
                            } while (ee > config.end && (/\s/).test(config.chars[ee - 1]) === true);
                        }
                        space = spacegen();
                        code();
                        if (ff > wrap - 3) {
                            ff = 0;
                            build.push(lf);
                            build.push("   ");
                        } else {
                            insertSpace();
                        }
                    } else {
                        // remove the word that crosses the wrap boundary and insert at newline
                        gg = build.length;
                        if ((gg > wrap && ff >= wrap - 3) || (gg <= wrap && ff > wrap)) {
                            space = [];
                            do {
                                space.push(build.pop());
                                gg = gg - 1;
                            } while (gg > 0 && build[gg - 1] !== " ");
                            build.pop();
                            ff = space.length + 1;
                            build.push(`${lf}   `);
                            build.push(space.reverse().join(""));
                            build.push(" ");
                        } else {
                            insertSpace();
                        }
                    }
                } else {
                    build.push(config.chars[ee]);
                    if (wrap > 0) {
                        if (ff > wrap - 3) {
                            ff = 0;
                            build[lastspace] = `${lf}   `;
                        } else {
                            ff = ff + 1;
                        }
                    }
                }
                ee = ee + 1;
            } while (ee < config.end);
            slice = config.chars.slice(config.start, ee + 1).join("");
            gg = ee + 1;
            ee = build.length - 1;
            if (wrap > 0) {
                // trim off extra white space from the end
                if ((/^(\s+)$/).test(build[ee]) === true) {
                    do {
                        build[ee] = "";
                        ee = ee - 1;
                    } while (ee > 0 && (/^(\s+)$/).test(build[ee]) === true);
                }
                if (codeflag === false && ff < wrap - 6 && ff > 0) {
                    build.push(" ");
                } else if ((build.indexOf(lf) < 0 && build.length > wrap) || (build.indexOf(lf) > 0 && build.slice(build.lastIndexOf("\n")).length > wrap - 3)) {
                    build.push(lf);
                }
            }
            build.push("\u002a/");
            slice = build.join("");
            if (wrap < 1) {
                //slice = slice.replace(/(^\s*)/, "/* ").replace(/\s*\*\/$/, " \u002a/");
            }
            if (slice.indexOf("\n") < 0 && (/\/\*\w/).test(slice.slice(0,3)) === true && parse.data.types.indexOf("word") < 0) {
                // Sometimes block comments convey application directives and some applications are picky about the formatting of those comments. This section transforms comments into white space conservative units under the conditions:
                // * the original comment was on a single line of code
                // * the original comment did not contain any white space at the start of the comment
                // * the comment exists before any references or keywords
                slice = slice.replace(/\s+/g, " ").replace("/\u002a ", "/\u002a").replace(" \u002a/", "\u002a/");
            } else {
                if ((/^\/\u002a\u0020\*+\r?\n/).test(slice) === true) {
                    slice = slice.replace(" ", "");
                }
                if ((/\n\u0020{3}\*+\s+\u002a\/$/).test(slice) === true) {
                    slice = slice.replace(/\n\u0020{3}\*+\s+\u002a\/$/, fixStarEnd);
                }
            }
            if ((/^(\/\*\s*parse-ignore-start)/).test(slice) === true && ee < config.end) {
                let ignorecom:string[] = [];
                do {
                    if (config.chars[ee] === "*" && config.chars[ee - 1] === "/") {
                        ignorecom.push(config.chars[ee - 1]);
                    } else if (config.chars[ee] === "/" && config.chars[ee - 1] === "*") {
                        if ((/^(\/\*\s*parse-ignore-end)/).test(ignorecom.join("")) === true) {
                            gg = ee - 1;
                            slice = build.join("");
                            break;
                        }
                        ignorecom = [];
                        space = [];
                    }
                    if (space[0] !== undefined) {
                        ignorecom.push(config.chars[ee]);
                    }
                    build.push(config.chars[ee]);
                    ee = ee + 1;
                } while (ee < config.end);
                if (ee === config.end) {
                    slice = build.join("");
                    gg = ee;
                }
            } else {
                build = slice.split(lf);
                ee    = build.length - 1;
                do {
                    build[ee] = build[ee].replace(/(\s+)$/, "");
                    ee        = ee - 1;
                } while (ee > -1);
                slice = build.join(lf);
                if (slice.indexOf("#region") === 0 || slice.indexOf("#endregion") === 0) {
                    slice = slice.replace(/(\s+)$/, "");
                }
            }
            return [slice, gg];*/
        },
        // parsing line comments and simultaneously applying word wrap
        parse.wrapCommentLine = function parse_wrapCommentLine(config: wrapConfig):[string, number] {
            let ee:number     = 0,
                ff:number     = 0,
                output:string = "",
                ignorecom:string[] = [],
                line:boolean    = false,
                ltoke:string = "",
                build:string[]  = (parse.parseOptions.wrap !== 0)
                    ? []
                    : ["//"],
                wrapignore:boolean = (parse.parseOptions.wrap !== 0 && (config.chars[config.start + 2] === "\t" || config.chars.slice(config.start + 2, config.start + 6).join("") === "    "));
            const base:number   = config.start + 2,
                wrap:number = parse.parseOptions.wrap,
                lineTest = function parse_wrapCommentLine_lineTest():boolean {
                    let xx:number = ee;
                    if ((/\/\/\s+\/\//).test(config.chars.slice(config.start, xx).join("")) === true) {
                        const ls:number = parse.linesSpace;
                        if (parse.linesSpace < 2 && parse.data.token[parse.count].slice(0, 2) === "//") {
                            parse.linesSpace = 2;
                        }
                        parse.push(
                            parse.data,
                            {
                                begin: parse.data.begin[parse.count],
                                lexer: parse.data.lexer[parse.count],
                                lines: parse.data.lines[parse.linesSpace],
                                presv: parse.data.presv[parse.count],
                                stack: parse.data.stack[parse.count],
                                token: "//",
                                types: "comment"
                            },
                            parse.data.stack[parse.count]
                        );
                        parse.linesSpace = ls;
                        config.start = config.start + 3;
                    }
                    do {
                        if (config.chars[xx] === "\n" && xx > ee) {
                            break;
                        }
                        xx = xx + 1;
                    } while ((/\s/).test(config.start[xx]) === true && xx < config.end);
                    if (config.start[xx] === "/" && config.start[xx + 1] === "/") {
                        if (config.start[xx + 2] === "\t" || config.chars.slice(xx + 2, xx + 6).join("") === "    ") {
                            return true;
                        }
                        ee = xx + 2;
                        if ((/\s/).test(config.chars[ee]) === true) {
                            do {
                                if (config.chars[ee] === "\n") {
                                    if ((/\n\s*\/\/\s*$/).test(config.chars.slice(config.start, ee).join("")) === true) {
                                        do {
                                            ee = ee - 1;
                                            if (config.chars[ee + 1] === "/" && config.chars[ee + 2] === "/") {
                                                break;
                                            }
                                        } while (ee > 0);
                                    }
                                    return true;
                                }
                                ee = ee + 1;
                            } while ((/\s/).test(config.chars[ee]) === true && ee < config.end);
                        }
                        if ((config.chars[ee] === "-" || config.chars[ee] === "*") && (/\s/).test(config.chars[ee + 1]) ===  true) {
                            ee = xx;
                            return true;
                        }
                        if ((/\d/).test(config.chars[ee]) === true) {
                            if ((/\d/).test(config.chars[ee + 1]) === true) {
                                do {
                                    ee = ee + 1;
                                } while ((/\d/).test(config.chars[ee + 1]) === true && ee < config.end);
                            }
                            if (config.chars[ee + 1] === "." && (/\s/).test(config.chars[ee + 2]) ===  true) {
                                ee = xx;
                                return true;
                            }
                        }
                        ee = ee - 1;
                        return false;
                    }
                    return true;
                },
                slashes        = function parse_wrapCommentLine_slashes(index:number):boolean {
                    let slashy:number = index;
                    do {
                        slashy = slashy - 1;
                    } while (config.chars[slashy] === "\\" && slashy > 0);
                    if ((index - slashy) % 2 === 1) {
                        return true;
                    }
                    return false;
                };
            ee = base;
            if (ee < config.end) {
                do {
                    if (wrapignore === true && config.chars[ee] === "\n") {
                        break;
                    }
                    if (config.chars[ee] === "\n" && wrapignore === false && (config.chars[ee - 1] !== "\\" || slashes(ee - 1) === false)) {
                        if (wrap !== 0) {
                            if (config.chars[config.start + 2] === "\t" || config.chars.slice(config.start + 2, config.start + 6).join("") === "    ") {
                                break;
                            }
                            if (lineTest() === true) {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                    if (ee > config.start + 1) {
                        if (wrap !== 0 && (/\s/).test(config.chars[ee]) === true && wrapignore === false) {
                            build.push(" ");
                            line = (config.chars[ee] === "\n" || config.chars[ee] === "\r");
                            if ((/\s/).test(config.chars[ee + 1]) === true) {
                                do {
                                    if (config.chars[ee] === "\n") {
                                        line = true;
                                    }
                                    ee = ee + 1;
                                } while (ee < config.end && (/\s/).test(config.chars[ee + 1]) === true);
                                if (line === true && config.chars[ee] + config.chars[ee + 1] !== "//") {
                                    break;
                                }
                            }
                        } else {
                            build.push(config.chars[ee]);
                        }
                    } else {
                        build.push(config.chars[ee]);
                    }
                    ee = ee + 1;
                } while (ee < config.end);
            }
            ff = ee;
            output = build.join("");
            if ((/^(\/\/\s*parse-ignore-start)/).test(output) === true && ee < config.end - 1) {
                do {
                    if (config.chars[ee] === "/" && config.chars[ee - 1] === "/") {
                        ignorecom.push(config.chars[ee - 1]);
                    } else if (config.chars[ee - 1] === "\n") {
                        if ((/^(\/\/\s*parse-ignore-end)/).test(ignorecom.join("")) === true) {
                            output = build.join("");
                            break;
                        }
                        ignorecom = [];
                    }
                    ignorecom.push(config.chars[ee]);
                    build.push(config.chars[ee]);
                    ee = ee + 1;
                } while (ee < config.end);
                if (ee === config.end) {
                    output = build.join("");
                }
            } else {
                // the value of parse.linesSpace is corrupted by comment wrapping, so this is a hacky fix
                if ((/\s/).test(config.chars[ff]) === true) {
                    do {
                        if ((/\s/).test(config.chars[ff]) === false) {
                            break;
                        }
                        ff = ff - 1;
                    } while (ff > 0);
                }

                if ((/^\s+$/).test(output) === true || output === "") {
                    return ["//", ee];
                }
                if (wrapignore === true) {
                    return ["//" + output, ee];
                }
                output = output.replace(/(\s+)$/, "").replace(/^(\s+)/, "");
                if (output === "//" && parse.data.token[parse.count] === "//") {
                    return ["", ee];
                }
                if (parse.data.token[parse.count].indexOf("//") === 0 && parse.linesSpace < 2) {
                    parse.linesSpace = 2;
                }
                if (wrap > 0 && (/^\/\/(\t|\u0020{4})/).test(output) === false) {
                    output = output.replace(/(^\/\/\s*)/, "").replace(/\s+/g, " ");
                    if (output.length > wrap - 3) {
                        do {
                            ee = wrap - 3;
                            do {
                                if ((/\s/).test(output.charAt(ee)) === true) {
                                    break;
                                }
                                ee = ee - 1;
                            } while (ee > 0);
                            ltoke =  `// ${output.slice(0, ee)}`;
                            parse.push(
                                parse.data,
                                {
                                    begin: parse.data.begin[parse.count],
                                    lexer: parse.data.lexer[parse.count],
                                    lines: parse.linesSpace,
                                    presv: parse.data.presv[parse.count],
                                    stack: parse.data.stack[parse.count],
                                    token: ltoke,
                                    types: "comment"
                                },
                                parse.data.stack[parse.count]
                            );
                            output = output.slice(ee + 1);
                            parse.linesSpace = 2;
                        } while (output.length > wrap - 3);
                        output = `// ${output.replace(/^\s+/, "")}`;
                        if (parse.linesSpace < 2 && ltoke.slice(0, 2) === "//") {
                            parse.linesSpace = 2;
                        }
                    } else {
                        output = output.replace(/\/\/\s+/, "// ");
                    }
                }
                if (output.indexOf("// ") !== 0) {
                    output = `// ${output.replace(/^\/\//, "")}`;
                }
                if ((/\s/).test(config.chars[ee]) === true) {
                    do {
                        ee = ee - 1;
                    } while (ee > 0 && (/\s/).test(config.chars[ee]) === true);
                }
                if (output.indexOf("#region") === 0 || output.indexOf("#endregion") === 0) {
                    output = output.replace(/(\s+)$/, "");
                }
            }
            return [output, ff];
        };
    global.parseFramework = (global.parseFramework || {
        lexer: {},
        parse: parse,
        parseerror: "",
        parserArrays: parserArrays,
        parserObjects: parserObjects
    });
    framework = global.parseFramework;
    framework.parse        = parse;
    framework.parserArrays = parserArrays;
    framework.parserObjects = parserObjects;
    
    if (
        global.process !== undefined &&
        global.process.argv !== undefined &&
        global.process.argv.length > 1 &&
        global.process.argv[1].indexOf("nodetest") < 0 &&
        global.process.argv[1].indexOf("validate") < 0 &&
        global.process.argv[0].indexOf("services") < 0 &&
        global.process.argv[1].indexOf("services") < 0 &&
        global.process.cwd().indexOf("parse-framework") > -1
    ) {
        const path = require("path");
        require(`${__dirname + path.sep}services`)();
    } else if (global.process === undefined && location !== undefined && location.href.indexOf("nocomment") < 0) {
        console.log("");
        console.log("Welcome to the Parse Framework.");
        console.log("");
        console.log("To see all the support features for Node.js:");
        console.log("node js/services commands");
        console.log("");
        console.log("* Read the documentation             - cat readme.md");
        console.log("* Read about the lexers              - cat lexers/readme.md");
        console.log("");
    }
}());
