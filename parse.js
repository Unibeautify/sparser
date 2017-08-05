/*
Parse Framework
*/
/*global global, location, module, require, window*/

(function parse_init() {
    "use strict";
    var parse  = {
            datanames  : [
                "begin",
                "lexer",
                "lines",
                "presv",
                "stack",
                "token",
                "types"
            ],
            lf         : "\n",
            lexer      : global.lexer,
            linesSpace : 0,
            lineNumber : 1,
            options    : {},
            parsetable : {},
            recordCount: -1,
            structure  : [
                ["global", -1]
            ]
        },
        parser = function parser_body(options) {
            parse.options = options;
            if (options.crlf === true || options.crlf === "true") {
                options.lf = "\r\n";
            }
            if (global.lexer[options.type] === "undefined") {
                parse.parseerror = "Lexer '" + options.type + "' isn't available.";
            } else {
                parse.parsetable = global.lexer[options.type](options.source + " ");
            }

            // validate that all the data arrays are the same length
            (function parser_exec_checkLengths() {
                var a    = 0,
                    b    = 0,
                    keys = Object.keys(parse.parsetable),
                    c    = keys.length;
                do {
                    b = a + 1;
                    do {
                        if (parse.parsetable[keys[a]].length !== parse.parsetable[keys[b]].length) {
                            parse.parseerror = "'" + keys[a] + "' array is of different length than '" + keys[b] +
                                    "'";
                            break;
                        }
                        b = b + 1;
                    } while (b < c);
                    a = a + 1;
                } while (a < c - 1);
            }());
            return parse.parsetable;
        };

    parse.spacer       = function parse_spacer(args) {
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
    parse.recordPop    = function parse_recordPop(data, count, length) {
        var output = {};
        parse.datanames.forEach(function parse_recordPop_datanames(value) {
            output[value] = data[value].pop();
        });
        output.length = length - 1;
        if (count === true) {
            parse.recordCount = parse.recordCount - 1;
        }
        return output;
    };
    parse.recordPush   = function parse_recordPush(data, record, count, length) {
        parse.datanames.forEach(function parse_recordPush_datanames(value) {
            data[value].push(record[value]);
        });
        if (count === true) {
            parse.recordCount = parse.recordCount + 1;
        }
        return length + 1;
    };
    parse.recordSplice = function parse_splice(spliceData) {
        // * data - The data object to alter
        // * index - The index where to start
        // * howmany - How many indexes to remove
        // * record - A new record to insert
        // * length - The length counter
        if (spliceData.record !== undefined && typeof spliceData.record.token === "string") {
            parse.datanames.forEach(function parse_recordSplice_datanames(value) {
                spliceData
                    .data[value]
                    .splice(spliceData.index, spliceData.howmany, spliceData.record[value]);
            });
            parse.recordCount = (parse.recordCount - spliceData.howmany) + 1;
            return (spliceData.length - spliceData.howmany) + 1;
        }
        parse.datanames.forEach(function parse_recordSplice_datanames(value) {
            spliceData
                .data[value]
                .splice(spliceData.index, spliceData.howmany);
        });
        parse.recordCount = parse.recordCount - spliceData.howmany;
        return spliceData.length - spliceData.howmany;
    };
    parse.recordConcat = function parse_concat(data, array) {
        parse.datanames.forEach(function parse_recordConcat_datanames(value) {
            data[value] = data[value].concat(array[value]);
        });
        return data.token.length - 1;
    };
    parse.safeSort     = function parse_safeSort(array, operation, recursive) {
        var arTest  = function parse_safeSort_arTest(item) {
                if (Array.isArray(item) === true) {
                    return true;
                }
                return false;
            },
            extref  = function parse_safeSort_extref() {
                //worthless function for backwards compatibility with older versions of V8 node.
                return;
            },
            normal  = function parse_safeSort_normal(item) {
                var done    = [item[0]],
                    storeb  = item,
                    child   = function safeSort_normal_child() {
                        var a   = 0,
                            len = storeb.length;
                        if (a < len) {
                            do {
                                if (arTest(storeb[a]) === true) {
                                    storeb[a] = parse_safeSort_normal(storeb[a]);
                                }
                                a = a + 1;
                            } while (a < len);
                        }
                    },
                    recurse = function parse_safeSort_normal_recurse(x) {
                        var a      = 0,
                            storea = [],
                            len    = storeb.length;
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
            },
            descend = function parse_safeSort_descend(item) {
                var c       = 0,
                    storeb  = item,
                    len     = item.length,
                    child   = function parse_safeSort_descend_child() {
                        var a    = 0,
                            lenc = storeb.length;
                        if (a < lenc) {
                            do {
                                if (arTest(storeb[a]) === true) {
                                    storeb[a] = parse_safeSort_descend(storeb[a]);
                                }
                                a = a + 1;
                            } while (a < lenc);
                        }
                    },
                    recurse = function parse_safeSort_descend_recurse() {
                        var a      = c,
                            b      = 0,
                            d      = 0,
                            e      = 0,
                            ind    = [],
                            key    = storeb[c],
                            tstore = "",
                            tkey   = typeof key;
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
                            extref();
                        } else {
                            if (recursive === true) {
                                child();
                            }
                            item = storeb;
                        }
                    };
                extref = recurse;
                recurse();
                return item;
            },
            ascend  = function parse_safeSort_ascend(item) {
                var c       = 0,
                    storeb  = item,
                    len     = item.length,
                    child   = function parse_safeSort_ascend_child() {
                        var a    = 0,
                            lenc = storeb.length;
                        if (a < lenc) {
                            do {
                                if (arTest(storeb[a]) === true) {
                                    storeb[a] = parse_safeSort_ascend(storeb[a]);
                                }
                                a = a + 1;
                            } while (a < lenc);
                        }
                    },
                    recurse = function parse_safeSort_ascend_recurse() {
                        var a      = c,
                            b      = 0,
                            d      = 0,
                            e      = 0,
                            ind    = [],
                            key    = storeb[c],
                            tstore = "",
                            tkey   = typeof key;
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
                            extref();
                        } else {
                            if (recursive === true) {
                                child();
                            }
                            item = storeb;
                        }
                    };
                extref = recurse;
                recurse();
                return item;
            };
        if (arTest(array) === false) {
            return array;
        }
        if (recursive === "true") {
            recursive = true;
        } else if (recursive !== true) {
            recursive = false;
        }
        if (operation === "normal") {
            return normal(array);
        }
        if (operation === "descend") {
            return descend(array);
        }
        return ascend(array);
    };
    parse.objectSort   = function parse_objectSort(data, length) {
        var cc        = 0,
            dd        = 0,
            ee        = 0,
            ff        = 0,
            behind    = length,
            keys      = [],
            keylen    = 0,
            keyend    = 0,
            front     = 0,
            sort      = function parse_objectSort_sort(x, y) {
                var xx = x[0],
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
            commaTest = true,
            store     = {
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
                if (dd < 0 && cc < length) {
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
                                            parse.recordPush(store, {
                                                begin: data.begin[ee],
                                                lexer: data.lexer[ee],
                                                lines: data.lines[ee],
                                                presv: data.presv[ee],
                                                stack: data.stack[ee],
                                                token: data.token[ee],
                                                types: data.types[ee]
                                            }, false, 0);
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
                                        ee                  = ee + 1;
                                        length              = parse.recordSplice({
                                            data   : store,
                                            howmany: 0,
                                            index  : ee,
                                            length : length,
                                            record : {
                                                begin: store.begin[ee - 1],
                                                lexer: store.lexer[ee - 1],
                                                lines: store.lines[ee - 1],
                                                presv: false,
                                                stack: store.stack[ee - 1],
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
                            length = parse.recordSplice({
                                data   : data,
                                howmany: ff,
                                index  : cc + 1,
                                length : length,
                                record : {}
                            });
                            return parse.recordConcat(data, store);
                        }
                    }
                    return length;
                }
                cc = cc - 1;
            } while (cc > -1);
        }
        return length;
    };
    parse.structure.pop = function parse_exec_structure_pop() {
        var len = parse.structure.length - 1,
            arr = parse.structure[len];
        if (len > 0) {
            parse.structure.splice(len, 1);
        }
        return arr;
    };
    global.parse  = parse;
    global.parser = parser;
}());
