interface data {
    begin: number[];
    lexer: string[];
    lines: number[];
    presv: boolean[];
    stack: string[];
    token: string[];
    types: string[];
}
interface language {
    auto(sample : string, defaultLang : string): [string, string, string];
    nameproper(input : string)                 : string;
    setlangmode(input : string)                : string;
}
interface options {
    correct     : boolean;
    crlf        : boolean;
    lang        : string;
    lexer       : string;
    lexerOptions: {
        [key: string]: {
            [key: string]: any;
        };
    };
    source      : string;
}
interface parse {
    concat(data : data, array : data)                               : void,
    count                                                           : number,
    crlf                                                            : "\n" | "\r\n",
    data                                                            : data,
    datanames                                                       : string[],
    lineNumber                                                      : number,
    linesSpace                                                      : number,
    objectSort(data : data)                                         : void,
    options                                                         : options,
    pop(data : data)                                                : record,
    push(data : data, record : record, structure : string)          : void,
    safeSort(array : any[], operation : string, recursive : boolean): any[],
    spacer(args : spacer)                                           : number,
    splice(spliceData : splice)                                     : void,
    structure                                                       : Array <[string, number]>
}
interface parseFramework {
    language?            : language;
    lexer                : {};
    parse                : parse;
    parseerror           : string;
    parser(obj : options): data;
}
interface record {
    begin: number;
    lexer: string;
    lines: number;
    presv: boolean;
    stack: string;
    token: string;
    types: string;
}
interface spacer {
    array: string[];
    index: number;
    end  : number;
}
interface splice {
    data   : data;
    howmany: number;
    index  : number;
    record : record;
}
declare module NodeJS {
    interface Global {
        parseFramework: parseFramework
    }
}