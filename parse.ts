/*
Parse Framework
*/
/*global console, global*/

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
            crlf: "\n",
            data: {
                begin: [],
                lexer: [],
                lines: [],
                presv: [],
                stack: [],
                token: [],
                types: []
            },
            datanames: ["begin", "lexer", "lines", "presv", "stack", "token", "token"],
            lineNumber: 1,
            linesSpace: 0,
            objectSort: function parse_objectSort(data: data):void {
                let cc:number = 0,
                    dd:number = 0,
                    ee:number = 0,
                    ff:number = 0,
                    behind:number = parse.count,
                    commaTest:boolean = true,
                    front:number = 0,
                    keyend:number = 0,
                    keylen:number = 0;
                const keys:Array<[number, number]> = [],
                    length:number = parse.count,
                    lines:number = parse.linesSpace,
                    sort    = function parse_objectSort_sort(x:[number, number], y:[number, number]):number {
                        let xx = x[0],
                            yy = y[0];
                        if (data.types[xx] === "comment" || data.types[xx] === "comment-inline") {
                            do {
                                xx = xx + 1;
                            } while (
                                xx < length && (data.types[xx] === "comment" || data.types[xx] === "comment-inline")
                            );
                        }
                        if (data.types[yy] === "comment" || data.types[yy] === "comment-inline") {
                            do {
                                yy = yy + 1;
                            } while (
                                yy < length && (data.types[yy] === "comment" || data.types[yy] === "comment-inline")
                            );
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
                if (data.token[behind] === "," || data.types[behind] === "comment") {
                    do {
                        behind = behind - 1;
                    } while (
                        behind > 0 && (data.token[behind] === "," || data.types[behind] === "comment")
                    );
                }
                cc = behind;
                if (cc > -1) {
                    do {
                        if (data.types[cc] === "end") {
                            dd = dd + 1;
                        }
                        if (data.types[cc] === "start") {
                            dd = dd - 1;
                        }
                        if (dd === 0) {
                            if (data.types[cc].indexOf("template") > -1) {
                                return;
                            }
                            if (data.token[cc] === ",") {
                                commaTest = true;
                                front     = cc + 1;
                            }
                            if (commaTest === true && data.token[cc] === "," && front < behind) {
                                if (data.token[behind] !== ",") {
                                    behind = behind + 1;
                                }
                                if (data.types[front] === "comment-inline") {
                                    front = front + 1;
                                }
                                keys.push([front, behind]);
                                behind = front - 1;
                            }
                        }
                        if (dd < 0 && cc < parse.count) {
                            if (keys.length > 0 && keys[keys.length - 1][0] > cc + 1) {
                                ee = keys[keys.length - 1][0];
                                if (data.types[ee - 1] !== "comment-inline") {
                                    ee = ee - 1;
                                }
                                keys.push([
                                    cc + 1,
                                    ee
                                ]);
                            }
                            if (data.token[cc - 1] === "=" || data.token[cc - 1] === ":" || data.token[cc - 1] === "(" || data.token[cc - 1] === "[" || data.token[cc - 1] === "," || data.types[cc - 1] === "word" || cc === 0) {
                                if (keys.length > 1) {
                                    keys.sort(sort);
                                    keylen    = keys.length;
                                    commaTest = false;
                                    dd        = 0;
                                    if (dd < keylen) {
                                        do {
                                            keyend = keys[dd][1];
                                            if (data.lines[keys[dd][0] - 1] > 1 && store.lines.length > 0) {
                                                store.lines[store.lines.length - 1] = data.lines[keys[dd][0] - 1];
                                            }
                                            ee = keys[dd][0];
                                            if (ee < keyend) {
                                                do {
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

                                                    //remove extra commas
                                                    if (data.token[ee] === ",") {
                                                        commaTest = true;
                                                    } else if (data.token[ee] !== "," && data.types[ee] !== "comment" && data.types[ee] !== "comment-inline") {
                                                        commaTest = false;
                                                    }
                                                    ee = ee + 1;
                                                } while (ee < keyend);
                                            }
                                            if (commaTest === false && dd < keylen - 1) {
                                                ee = store.types.length - 1;
                                                if (store.types[ee] === "comment" || store.types[ee] === "comment-inline") {
                                                    do {
                                                        ee = ee - 1;
                                                    } while (
                                                        ee > 0 && (store.types[ee] === "comment" || store.types[ee] === "comment-inline")
                                                    );
                                                }
                                                ee = ee + 1;
                                                parse.splice({
                                                    data   : store,
                                                    howmany: 0,
                                                    index  : ee,
                                                    record : {
                                                        begin: parse.structure[parse.structure.length - 1][1],
                                                        lexer: store.lexer[ee - 1],
                                                        lines: 0,
                                                        presv: false,
                                                        stack: parse.structure[parse.structure.length - 1][0],
                                                        token: ",",
                                                        types: "separator"
                                                    }
                                                });
                                                store.lines[ee - 1] = 0;
                                                ff                  = ff + 1;
                                            }
                                            dd = dd + 1;
                                        } while (dd < keylen);
                                    }
                                    ee = store.types.length;
                                    do {
                                        ee = ee - 1;
                                    } while (
                                        ee > 0 && (store.types[ee] === "comment" || store.types[ee] === "comment-inline")
                                    );
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
                                    return parse.concat(data, store);
                                }
                            }
                            return;
                        }
                        cc = cc - 1;
                    } while (cc > -1);
                }
                return;
            },
            options: {
                correct: false,
                crlf: false,
                lang: "javascript",
                lexer: "script",
                lexerOptions: {
                    script: {}
                },
                source: ""
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
            safeSort: function parse_safeSort(array: any[], operation:string, recursive:boolean): any[] {
                let extref  = function parse_safeSort_extref(item: any) {
                    //worthless function for backwards compatibility with older versions of V8 node.
                    return;
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
            splice: function parse_splice(spliceData: splice) {
                // * data    - The data object to alter
                // * howmany - How many indexes to remove
                // * index   - The index where to start
                // * record  - A new record to insert
                if (spliceData.record !== undefined && typeof spliceData.record.token === "string") {
                    parse
                        .datanames
                        .forEach(function parse_splice_datanames(value) {
                            spliceData
                                .data[value]
                                .splice(spliceData.index, spliceData.howmany, spliceData.record[value]);
                        });
                    if (spliceData.data === parse.data) {
                        parse.count      = (parse.count - spliceData.howmany) + 1;
                        parse.linesSpace = 0;
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
        parser  = function parser_(options: options): data {
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
            parse.crlf       = (options.crlf === true)
                ? "\r\n"
                : "\n";
            parse.linesSpace = 0;
            parse.lineNumber = 1;
            parse.structure  = [
                ["global", -1]
            ];
            parse.options    = options;

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
            if (framework.lexer[options.lexer] === undefined) {
                framework.parseerror = "Lexer '" + options.lexer + "' isn't available.";
            } else if (typeof framework.lexer[options.lexer] !== "function") {
                framework.parseerror = "Specified lexer, " + options.lexer + ", is not a function.";
            } else {
                framework.parseerror = "";
                options.lexerOptions = (options.lexerOptions || {});
                Object.keys(framework.lexer).forEach(function parse_lexers(value) {
                    options.lexerOptions[value] = (options.lexerOptions[value] || {});
                });
                framework.lexer[options.lexer](options.source + " ");
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

            if (parse.options.lexerOptions[options.lexer].objectSort === true || parse.options.lexerOptions.markup.tagSort === true) {
                let a:number = 0;
                const data:data    = parse.data,
                    b:number         = data.begin.length,
                    structure: number[] = [-1];
                do {
                    if ((data.types[a - 1] === "attribute" || data.types[a - 1] === "jsx_attribute_end") && data.types[a] !== "attribute" && data.types[a] !== "jsx_attribute_start" && data.lexer[a - 1] === "markup" && data.types[data.begin[a - 1]] === "singleton") {
                        structure.pop();
                    }
                    if (data.begin[a] !== structure[structure.length - 1]) {
                        if (parse.options.lexerOptions[options.lexer].objectSort === true && (data.lexer[a] === "script" || data.lexer[a] === "style")) {
                            data.begin[a] = structure[structure.length - 1];
                        } else if (parse.options.lexerOptions.markup.tagSort === true && data.lexer[a] === "markup") {
                            data.begin[a] = structure[structure.length - 1];
                        }
                    }
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
                    a = a + 1;
                } while (a < b);
            }
            return parse.data;
        };
    global.parseFramework = (global.parseFramework || {
        lexer: {},
        parse: parse,
        parseerror: "",
        parser: parser
    });
    framework = global.parseFramework;
    framework.parse     = parse;
    framework.parser    = parser;
    
    if (global.v8debug !== undefined && global.process.argv.length > 2 && global.process.argv[2].indexOf("parse.js") > 0) {
        console.log("");
        console.log("Welcome to the \u001b[32mParse Framework\u001b[39m.");
        console.log("");
        console.log("Here are things to try:");
        console.log("\u001b[1m\u001b[31m*\u001b[39m\u001b[0m Run the unit tests                 - \u001b[33mnode test/validate.js\u001b[39m");
        console.log("\u001b[1m\u001b[31m*\u001b[39m\u001b[0m Parse some text                    - \u001b[33mnode runtimes/nodetest.js \"<a><b></b></a>\"\u001b[39m");
        console.log("\u001b[1m\u001b[31m*\u001b[39m\u001b[0m Parse a file                       - \u001b[33mnode runtimes/nodetest.js myfile.jsx\u001b[39m");
        console.log("\u001b[1m\u001b[31m*\u001b[39m\u001b[0m Produce an unformatted parse table - \u001b[33mnode runtimes/nodetest.js myfile.jsx --raw\u001b[39m");
        console.log("\u001b[1m\u001b[31m*\u001b[39m\u001b[0m Read the documentation             - \u001b[33mcat readme.md\u001b[39m");
        console.log("\u001b[1m\u001b[31m*\u001b[39m\u001b[0m Read about the lexers              - \u001b[33mcat lexers/readme.md\u001b[39m");
        console.log("");
    } else if (global.process === undefined) {
        console.log("");
        console.log("Welcome to the Parse Framework.");
        console.log("");
        console.log("Here are things to try with Node.js:");
        console.log("* Run the unit tests                 - node test/validate.js");
        console.log("* Parse some text                    - node runtimes/nodetest.js \"<a><b></b></a>\"");
        console.log("* Parse a file                       - node runtimes/nodetest.js myfile.jsx");
        console.log("* Produce an unformatted parse table - node runtimes/nodetest.js myfile.jsx --raw");
        console.log("* Read the documentation             - cat readme.md");
        console.log("* Read about the lexers              - cat lexers/readme.md");
        console.log("");
    }
}());
