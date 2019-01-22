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
            concat: function parse_concat_init():void {},
            count: -1,
            data: {
                begin: [],
                ender: [],
                lexer: [],
                lines: [],
                stack: [],
                token: [],
                types: []
            },
            datanames: ["begin", "ender", "lexer", "lines", "stack", "token", "types"],
            lineNumber: 1,
            linesSpace: 0,
            objectSort: function parse_objectSort_init():void {},
            parseOptions: {
                correct: false,
                crlf: false,
                language: "auto",
                lexer: "auto",
                lexerOptions: {
                    script: {}
                },
                outputFormat: "arrays",
                preserve_comment: false,
                source: "",
                wrap: 0
            },
            pop: function parse_pop_init():record {
                return {
                    begin: 0,
                    ender: 0,
                    lexer: "",
                    lines: 0,
                    stack: "",
                    token: "",
                    types: ""
                };
            },
            push: function parse_push_init():void {},
            references: [[]],
            safeSort: function parse_safeSort_init(): any[] {
                return [];
            },
            sortCorrection: function parse_sortCorrection_init():void {},
            spacer: function parse_spacer_init():number {
                return 0;
            },
            splice: function parse_splice_init():void {},
            structure: [["global", -1]],
            wrapCommentBlock: function parse_wrapCommentBlock_init():[string, number] {
                return ["", 0];
            },
            wrapCommentLine: function parse_wrapCommentLint_init():[string, number] {
                return ["", 0];
            }
        },
        parser  = function parser_(parseOptions: parseOptions): void {
            parse.count      = -1;
            parse.data       = {
                begin: [],
                ender: [],
                lexer: [],
                lines: [],
                stack: [],
                token: [],
                types: []
            };
            parse.datanames  = [
                "begin",
                "ender",
                "lexer",
                "lines",
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
                framework.parseerror = `Lexer "${parseOptions.lexer}" isn't available.`;
            }
            if (typeof framework.lexer[parseOptions.lexer] === "function") {
                framework.parseerror = "";
                // reset references data if framework is used on multiple files
                parse.references = [[]];
                parseOptions.lexerOptions = (parseOptions.lexerOptions || {});
                Object.keys(framework.lexer).forEach(function parse_lexers(value) {
                    parseOptions.lexerOptions[value] = (parseOptions.lexerOptions[value] || {});
                });
                // This line parses the code using a lexer file
                framework.lexer[parseOptions.lexer](`${parseOptions.source} `);
            } else {
                framework.parseerror = `Specified lexer, ${parseOptions.lexer}, is not a function.`;
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
                            framework.parseerror = `"${keys[a]}" array is of different length than "${keys[b]}"`;
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
            
            // fix begin values.  They must be reconsidered after reordering from object sort
            if (parse.data.begin.length > 0 && (parse.parseOptions.lexerOptions[parseOptions.lexer].objectSort === true || parse.parseOptions.lexerOptions.markup.tagSort === true)) {
                parse.sortCorrection(0, parse.count + 1);
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
                    ender: parse.data.ender[a],
                    lexer: parse.data.lexer[a],
                    lines: parse.data.lines[a],
                    stack: parse.data.stack[a],
                    token: parse.data.token[a],
                    types: parse.data.types[a]
                });
                a = a + 1;
            } while (a < len);
            return data;
        };
    // an extension of Array.prototype.concat to work across the data structure.  This is an expensive operation.
    parse.concat = function parse_concat(data:data, array:data):void {
        parse
            .datanames
            .forEach(function parse_concat_datanames(value) {
                data[value] = data[value].concat(array[value]);
            });
        if (data === parse.data) {
            parse.count = data.token.length - 1;
        }
    };
    // the function that sorts object properties
    parse.objectSort = function parse_objectSort(data: data):void {
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
                ender: [],
                lexer: [],
                lines: [],
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
                    if (style === true && data.types[keyend - 1] !== "end" && data.types[keyend] === "comment" && data.types[keyend + 1] !== "comment" && dd < keylen - 1) {
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
                                    ender: data.begin[ee],
                                    lexer: data.lexer[ee],
                                    lines: data.lines[ee],
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
                                ender: parse.count,
                                lexer: store.lexer[ee - 1],
                                lines: 0,
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
                    index  : cc + 1
                });
                parse.linesSpace = lines;
                parse.concat(data, store);
                return;
            }
        }
        return;
    };
    // an extension of Array.prototype.pop to work across the data structure
    parse.pop = function parse_pop(data: data): record {
        const output = {
            begin: data.begin.pop(),
            ender: data.ender.pop(),
            lexer: data.lexer.pop(),
            lines: data.lines.pop(),
            stack: data.stack.pop(),
            token: data.token.pop(),
            types: data.types.pop()
        };
        if (data === parse.data) {
            parse.count = parse.count - 1;
        }
        return output;
    };
    // an extension of Array.prototype.push to work across the data structure
    parse.push = function parse_push(data:data, record:record, structure:string):void {
        const ender = function parse_push_ender():void {
            const begin:number = data.begin[parse.count];
            let a:number = parse.count;
            if (data.lexer[a] === "markup" && parse.parseOptions.lexerOptions.markup.tagSort === true) {
                // necessary to avoid an endless loop in the case of a singleton with an attribute sorted
                // such that the begin value is one more than the current index
                return;
            }
            do {
                if (data.begin[a] === begin || (data.begin[data.begin[a]] === begin && data.types[a].indexOf("attribute") > -1)) {
                    data.ender[a] = parse.count;
                } else {
                    a = data.begin[a];
                }
                a = a - 1;
            } while (a > begin);
            if (a > -1) {
                data.ender[a] = parse.count;
            }
        };
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
                ender();
                parse.structure.pop();
            } else if (record.types === "else" || record.types.indexOf("_else") > 0) {
                ender();
                if (structure === "") {
                    parse.structure[parse.structure.length - 1] = ["else", parse.count];
                } else {
                    parse.structure[parse.structure.length - 1] = [structure, parse.count];
                }
            }
        }
    };
    // a custom sort tool that is a bit more intelligent and multidimensional than Array.prototype.sort
    parse.safeSort = function parse_safeSort(array: any[], operation:"ascend" | "descend" | "normal", recursive:boolean): any[] {
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
    };
    // this functionality provides corrections to the "begin" and "ender" values after use of objectSort
    parse.sortCorrection = function parse_sortCorrection(start:number, end:number):void {
        let a:number = start,
            endslen:number = -1;
        const data:data    = parse.data,
            ends:number[] = [],
            structure: number[] = (parse.structure.length < 2)
                ? [-1]
                : [parse.structure[parse.structure.length - 2][1]];
        
        // this first loop solves for the begin values
        do {
            if (
                a > 0 &&
                data.types[a].indexOf("attribute") > -1 &&
                data.types[a].indexOf("end") < 0 &&
                data.types[a - 1].indexOf("start") < 0 &&
                data.types[a - 1].indexOf("attribute") < 0 &&
                data.lexer[a] === "markup"
            ) {
                structure.push(a - 1);
            }
            if (
                a > 0 &&
                data.types[a - 1].indexOf("attribute") > -1 &&
                data.types[a].indexOf("attribute") < 0 &&
                data.lexer[structure[structure.length - 1]] === "markup" &&
                data.types[structure[structure.length - 1]].indexOf("start") < 0
            ) {
                structure.pop();
            }
            if (data.begin[a] !== structure[structure.length - 1]) {
                if (structure.length > 0) {
                    data.begin[a] = structure[structure.length - 1];
                } else {
                    data.begin[a] = -1;
                }
            }
            if (data.types[a].indexOf("else") > -1) {
                if (structure.length > 0) {
                    structure[structure.length - 1] = a;
                } else {
                    structure.push(a);
                }
            }
            if (data.types[a].indexOf("end") > -1) {
                structure.pop();
            }
            if (data.types[a].indexOf("start") > -1) {
                structure.push(a);
            }
            a = a + 1;
        } while (a < end);

        // and now for the ender values
        a = end;
        do {
            a = a - 1;
            if (data.types[a].indexOf("end") > -1) {
                ends.push(a);
                endslen = endslen + 1;
            }
            if (endslen > -1) {
                data.ender[a] = ends[endslen];
            } else {
                data.ender[a] = -1;
            }
            if (data.types[a].indexOf("start") > -1) {
                ends.pop();
                endslen = endslen - 1;
            }
        } while (a > start);
    };
    // a simple tool to take note of whitespace between tokens
    parse.spacer = function parse_spacer(args:spacer): number {
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
    };
    // an extension of Array.prototype.splice to work across the data structure
    parse.splice = function parse_splice(spliceData: splice): void {
        const finalItem:[number, string] = [parse.data.begin[parse.count], parse.data.token[parse.count]];
        // * data    - The data object to alter
        // * howmany - How many indexes to remove
        // * index   - The index where to start
        // * record  - A new record to insert
        if (spliceData.record !== undefined && spliceData.record.token !== "") {
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
    };
    // parsing block comments and simultaneously applying word wrap
    parse.wrapCommentBlock = function parse_wrapCommentBlock(config: wrapConfig):[string, number] {
        let a:number = config.start,
            b:number = 0,
            c:number = 0,
            d:number = 0,
            len:number = 0,
            lines:string[] = [],
            space:string = "",
            bline:string = "",
            spaceLine:RegExp,
            emptyLine:boolean = false,
            bulletLine:boolean = false,
            numberLine:boolean = false,
            bigLine:boolean = false,
            output:string  = "",
            terml:number = config.terminator.length - 1,
            term:string = config.terminator.charAt(terml),
            twrap:number = 0;
        const build:string[] = [],
            second:string[]  = [],
            lf:"\r\n"|"\n" = (parse.parseOptions.crlf === true)
                ? "\r\n"
                : "\n",
            sanitize = function parse_wrapCommentBlock_sanitize(input:string) {
                return `\\${input}`;
            },
            regEsc:RegExp = (/(\/|\\|\||\*|\[|\]|\{|\})/g),
            regEnd:RegExp = new RegExp(`\\s*${config.terminator.replace(regEsc, sanitize)}$`),
            regIgnore:RegExp = new RegExp(`^(${config.opening.replace(regEsc, sanitize)}\\s*parse-ignore-start)`),
            regStart:RegExp = new RegExp(`(${config.opening.replace(regEsc, sanitize)}\\s*)`),
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
            if (config.chars[a] === "\n") {
                parse.lineNumber = parse.lineNumber + 1;
            }
            if (config.chars[a] === term && config.chars.slice(a - terml, a + 1).join("") === config.terminator) {
                break;
            }
            a = a + 1;
        } while (a < config.end);
        output = build.join("");
        if (regIgnore.test(output) === true) {
            let termination:string = "\n";
            a = a + 1;
            do {
                build.push(config.chars[a]);
                a = a + 1;
            } while (a < config.end && (config.chars[a - 1] !== "d" || (config.chars[a - 1] === "d" && build.slice(build.length - 16).join("") !== "parse-ignore-end")));
            b = a;
            terml = config.opening.length - 1;
            term = config.opening.charAt(terml);
            do {
                if (config.opening === "/*" && config.chars[b - 1] === "/" && (config.chars[b] === "*" || config.chars[b] === "/")) {
                    break; // for script
                }
                if (config.opening !== "/*" && config.chars[b] === term && config.chars.slice(b - terml, b + 1).join("") === config.opening) {
                    break; // for markup
                }
                b = b - 1;
            } while (b > config.start);
            if (config.opening === "/*" && config.chars[b] === "*") {
                termination = "\u002a/";
            } else if (config.opening !== "/*") {
                termination = config.terminator;
            }
            terml = termination.length - 1;
            term = termination.charAt(terml);
            if (termination !== "\n" || config.chars[a] !== "\n") {
                do {
                    build.push(config.chars[a]);
                    if (termination === "\n" && config.chars[a + 1] === "\n") {
                        break;
                    }
                    if (config.chars[a] === term && config.chars.slice(a - terml, a + 1).join("") === termination) {
                        break;
                    }
                    a = a + 1;
                } while (a < config.end);
            }
            if (config.chars[a] === "\n") {
                a = a - 1;
            }
            output = build.join("").replace(/\s+$/, "");
            return [output, a];
        }
        if (a === config.end || wrap < 1 || (output.length <= wrap && output.indexOf("\n") < 0) || parse.parseOptions.preserve_comment === true) {
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
        lines[0] = lines[0].replace(regStart, "");
        lines[len - 1] = lines[len - 1].replace(regEnd, "");
        if (len < 2) {
            lines = lines[0].split(" ");
        }
        if (lines[0] === "") {
            lines[0] = config.opening;
        } else {
            lines.splice(0, 0, config.opening);
        }
        len = lines.length;
        b = 0;
        do {
            bline = (b < len - 1)
                ? lines[b + 1].replace(/^\s+/, "")
                : "";
            if ((/^\s+$/).test(lines[b]) === true || lines[b] === "") {
                emptyLines();
            } else if (lines[b].slice(0, 4) === "    ") {
                second.push(lines[b]);
            } else if (lines[b].replace(/^\s+/, "").length > wrap && lines[b].replace(/^\s+/, "").indexOf(" ") > wrap) {
                lines[b] = lines[b].replace(/^\s+/, "");
                c = lines[b].indexOf(" ");
                second.push(lines[b].slice(0, c));
                lines[b] = lines[b].slice(c + 1);
                b = b - 1;
            } else {
                if (config.opening === "/*" && lines[b].indexOf("/*") !== 0) {
                    lines[b] = `   ${lines[b].replace(/^\s+/, "").replace(/\s+$/, "").replace(/\s+/g, " ")}`;
                } else {
                    lines[b] = `${lines[b].replace(/^\s+/, "").replace(/\s+$/, "").replace(/\s+/g, " ")}`;
                }
                twrap = (b < 1)
                    ? wrap - (config.opening.length + 1)
                    : wrap;
                c = lines[b].length;
                d = lines[b].replace(/^\s+/, "").indexOf(" ");
                if (c > twrap && d > 0 && d < twrap) {
                    c = twrap;
                    do {
                        c = c - 1;
                        if ((/\s/).test(lines[b].charAt(c)) === true && c <= wrap) {
                            break;
                        }
                    } while (c > 0);
                    if (lines[b].slice(0, 4) !== "    " && (/^\s*(\*|-)\s/).test(lines[b]) === true && (/^\s*(\*|-)\s/).test(lines[b + 1]) === false) {
                        lines.splice(b + 1, 0, "* ");
                    }
                    if (lines[b].slice(0, 4) !== "    " && (/^\s*\d+\.\s/).test(lines[b]) === true && (/^\s*\d+\.\s/).test(lines[b + 1]) === false) {
                        lines.splice(b + 1, 0, "1. ");
                    }
                    if (c < 4) {
                        second.push(lines[b]);
                        bigLine = true;
                    } else if (b === len - 1) {
                        second.push(lines[b].slice(0, c));
                        lines[b] = lines[b].slice(c + 1);
                        bigLine = true;
                        b = b - 1;
                    } else if ((/^\s+$/).test(lines[b + 1]) === true || lines[b + 1] === "") {
                        second.push(lines[b].slice(0, c));
                        lines[b] = lines[b].slice(c + 1);
                        emptyLine = true;
                        b = b - 1;
                    } else if (lines[b + 1].slice(0, 4) !== "    " && (/^\s*(\*|-)\s/).test(lines[b + 1]) === true) {
                        second.push(lines[b].slice(0, c));
                        lines[b] = lines[b].slice(c + 1);
                        bulletLine = true;
                        b = b - 1;
                    } else if (lines[b + 1].slice(0, 4) !== "    " && (/^\s*\d+\.\s/).test(lines[b + 1]) === true) {
                        second.push(lines[b].slice(0, c));
                        lines[b] = lines[b].slice(c + 1);
                        numberLine = true;
                        b = b - 1;
                    } else if (lines[b + 1].slice(0, 4) === "    ") {
                        second.push(lines[b].slice(0, c));
                        lines[b] = lines[b].slice(c + 1);
                        bigLine = true;
                        b = b - 1;
                    } else if (c + bline.length > wrap && bline.indexOf(" ") < 0) {
                        second.push(lines[b].slice(0, c));
                        lines[b] = lines[b].slice(c + 1);
                        bigLine = true;
                        b = b - 1;
                    } else if (lines[b].replace(/^\s+/, "").indexOf(" ") < wrap) {
                        if (lines[b].length > wrap) {
                            lines[b + 1] = lines[b].slice(c + 1) + lf + lines[b + 1];
                        } else {
                            lines[b + 1] = `${lines[b].slice(c + 1)} ${lines[b + 1]}`;
                        }
                    }
                    if (emptyLine === false && bulletLine === false && numberLine === false && bigLine === false) {
                        lines[b] = lines[b].slice(0, c);
                    }
                } else if (lines[b + 1] !== undefined && ((lines[b].length + bline.indexOf(" ") > wrap && bline.indexOf(" ") > 0) || (lines[b].length + bline.length > wrap && bline.indexOf(" ") < 0))) {
                    second.push(lines[b]);
                    b = b + 1;
                } else if (lines[b + 1] !== undefined && (/^\s+$/).test(lines[b + 1]) === false && lines[b + 1] !== "" && lines[b + 1].slice(0, 4) !== "    " && (/^\s*(\*|-|(\d+\.))\s/).test(lines[b + 1]) === false) {
                    lines[b + 1] = `${lines[b]} ${lines[b + 1]}`;
                    emptyLine = true;
                }
                if (bigLine === false && bulletLine === false && numberLine === false) {
                    if (emptyLine === true) {
                        emptyLine = false;
                    } else if ((/^\s*(\*|-|(\d+\.))\s*$/).test(lines[b]) === false) {
                        if (b < len - 1 && lines[b + 1] !== "" && (/^\s+$/).test(lines[b]) === false && lines[b + 1].slice(0, 4) !== "    " && (/^\s*(\*|-|(\d+\.))\s/).test(lines[b + 1]) === false) {
                            lines[b] = `${lines[b]} ${lines[b + 1]}`;
                            lines.splice(b + 1, 1);
                            len = len - 1;
                            b = b - 1;
                        } else {
                            if (config.opening === "/*" && lines[b].indexOf("/*") !== 0) {
                                second.push(`   ${lines[b].replace(/^\s+/, "").replace(/\s+$/, "").replace(/\s+/g, " ")}`);
                            } else {
                                second.push(`${lines[b].replace(/^\s+/, "").replace(/\s+$/, "").replace(/\s+/g, " ")}`);
                            }
                        }
                    }
                }
                bigLine = false;
                bulletLine = false;
                numberLine = false;
            }
            b = b + 1;
        } while (b < len);
        if (second.length > 0) {
            if (second[second.length - 1].length > wrap - (config.terminator.length + 1)) {
                second.push(config.terminator);
            } else {
                second[second.length - 1] = `${second[second.length - 1]} ${config.terminator}`;
            }
            output = second.join(lf);
        } else {
            lines[lines.length - 1] = lines[lines.length - 1] + config.terminator;
            output = lines.join(lf);
        }
        return [output, a];
    },
    // parsing line comments and simultaneously applying word wrap
    parse.wrapCommentLine = function parse_wrapCommentLine(config: wrapConfig):[string, number] {
        let a:number = config.start,
            b:number = 0,
            output:string = "",
            build:string[] = [];
        const wrap:number = parse.parseOptions.wrap,
            recurse = function parse_wrapCommentLine_recurse():void {
                let line:string = "";
                do {
                    b = b + 1;
                    if (config.chars[b + 1] === "\n") {
                        return;
                    }
                } while (b < config.end && (/\s/).test(config.chars[b]) === true);
                if (config.chars[b] + config.chars[b + 1] === "//") {
                    build = [];
                    do {
                        build.push(config.chars[b]);
                        b = b + 1;
                    } while (b < config.end && config.chars[b] !== "\n");
                    line = build.join("");
                    if ((/^\/\/ (\*|-|(\d+\.))/).test(line) === false && line.slice(0, 6) !== "//    " && (/^\/\/\s*$/).test(line) === false) {
                        output = `${output} ${line.replace(/(^\/\/\s*)/, "").replace(/\s+$/, "")}`;
                        a = b - 1;
                        parse_wrapCommentLine_recurse();
                    }
                }
            },
            wordWrap = function parse_wrapCommentLine_wordWrap():void {
                let c:number = 0,
                    d:number = 0;
                const lines:string[] = [],
                    record:record = (parse.count > -1)
                        ? {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: config.lexer,
                            lines: parse.linesSpace,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: parse.data.token[parse.count],
                            types: "comment"
                        }
                        : {
                            begin: -1,
                            ender: -1,
                            lexer: config.lexer,
                            lines: parse.linesSpace,
                            stack: "global",
                            token: "",
                            types: "comment"
                        };
                output = output.replace(/\s+/g, " ").replace(/\s+$/, "");
                d = output.length;
                if (wrap > d) {
                    return;
                }
                do {
                    c = wrap;
                    if (output.charAt(c) !== " ") {
                        do {
                            c = c - 1;
                        } while (c > 0 && output.charAt(c) !== " ");
                        if (c < 3) {
                            c = wrap;
                            do {
                                c = c + 1;
                            } while (c < d - 1 && output.charAt(c) !== " ");
                        }
                    }
                    lines.push(output.slice(0, c));
                    output = `// ${output.slice(c).replace(/^\s+/, "")}`;
                    d = output.length;
                } while (wrap < d);
                c = 0;
                d = lines.length;
                do {
                    record.token = lines[c];
                    parse.push(parse.data, record, "");
                    record.lines = 2;
                    parse.linesSpace = 2;
                    c = c + 1;
                } while (c < d);
            };
        do {
            build.push(config.chars[a]);
            a = a + 1;
        } while (a < config.end && config.chars[a] !== "\n");
        if (a === config.end) {
            // necessary because the wrapping logic expects line termination
            config.chars.push("\n");
        } else {
            a = a - 1;
        }
        output = build.join("").replace(/\s+$/, "");
        if ((/^(\/\/\s*parse-ignore\u002dstart)/).test(output) === true) {
            let termination:string = "\n";
            a = a + 1;
            do {
                build.push(config.chars[a]);
                a = a + 1;
            } while (a < config.end && (config.chars[a - 1] !== "d" || (config.chars[a - 1] === "d" && build.slice(build.length - 16).join("") !== "parse-ignore-end")));
            b = a;
            do {
                b - b - 1;
            } while (b > config.start && config.chars[b - 1] === "/" && (config.chars[b] === "*" || config.chars[b] === "/"));
            if (config.chars[b] === "*") {
                termination = "\u002a/";
            }
            if (termination !== "\n" || config.chars[a] !== "\n") {
                do {
                    build.push(config.chars[a]);
                    if (termination === "\n" && config.chars[a + 1] === "\n") {
                        break;
                    }
                    a = a + 1;
                } while (a < config.end && (termination === "\n" || (termination === "\u002a/" && (config.chars[a - 1] !== "*" || config.chars[a] !== "/"))));
            }
            if (config.chars[a] === "\n") {
                a = a - 1;
            }
            output = build.join("").replace(/\s+$/, "");
            return [output, a];
        }
        if (output === "//" || output.slice(0, 6) === "//    " || parse.parseOptions.preserve_comment === true) {
            return [output, a];
        }
        output = output.replace(/(\/\/\s*)/, "// ");
        if (wrap < 1 || (a === config.end - 1 && parse.data.begin[parse.count] < 1)) {
            return [output, a];
        }
        b = a + 1;
        recurse();
        wordWrap();
        return [output, a];
    };
    global.parseFramework = (global.parseFramework || {
        lexer: {},
        parse: parse,
        parseerror: "",
        parserArrays: parserArrays,
        parserObjects: parserObjects
    });
    framework = global.parseFramework;
    framework.parse         = parse;
    framework.parserArrays  = parserArrays;
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
