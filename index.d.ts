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
interface lexer {
    [key:string]: (source: string) => data;
}
interface parseOptions {
    correct        : boolean;
    crlf           : boolean;
    lang           : string;
    lexer          : string;
    lexerOptions   : {
        [key: string]: {
            [key: string]: any;
        };
    };
    outputFormat: "objects" | "arrays";
    source      : string;
}
interface parse {
    concat(data : data, array : data)                               : void,
    count                                                           : number,
    data                                                            : data,
    datanames                                                       : string[],
    lineNumber                                                      : number,
    linesSpace                                                      : number,
    objectSort(data : data)                                         : void,
    parseOptions                                                    : parseOptions,
    pop(data : data)                                                : record,
    push(data : data, record : record, structure : string)          : void,
    safeSort(array : any[], operation : string, recursive : boolean): any[],
    spacer(args : spacer)                                           : number,
    splice(spliceData : splice)                                     : void,
    structure                                                       : Array <[string, number]>
}
interface parseFramework {
    language?                   : language;
    lexer                       : lexer;
    parse                       : parse;
    parseerror                  : string;
    parserArrays(obj : parseOptions) : data;
    parserObjects(obj : parseOptions): record[];
}
interface htmlCellBuilder {
    text:string;
    type:string;
    row:HTMLTableRowElement;
    className:string;
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