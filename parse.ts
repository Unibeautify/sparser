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
                            if (style === true && data.types[keyend] === "comment" && dd < keylen - 1) {
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
            splice: function parse_splice(spliceData: splice) {
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
            structure: [["global", -1]]
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
