declare var ace: any;
type languageAuto = [string, string, string];
interface attStore extends Array<[string, number]>{
    [index:number]: [string, number]
}
interface data {
    begin: number[];
    lexer: string[];
    lines: number[];
    presv: boolean[];
    stack: string[];
    token: string[];
    types: string[];
}
interface htmlCellBuilder {
    text:string;
    type:string;
    row:HTMLTableRowElement;
    className:string;
}
interface language {
    auto(sample : string, defaultLang : string): languageAuto;
    nameproper(input : string)                 : string;
    setlexer(input : string)                : string;
}
interface lexer {
    [key:string]: (source: string) => data;
}
interface parse {
    concat(data : data, array : data)                               : void;
    count                                                           : number;
    data                                                            : data;
    datanames                                                       : string[];
    lineNumber                                                      : number;
    linesSpace                                                      : number;
    objectSort(data : data)                                         : void;
    parseOptions                                                    : parseOptions;
    pop(data : data)                                                : record;
    push(data : data, record : record, structure : string)          : void;
    references                                                      : string[][];
    safeSort(array : any[], operation : string, recursive : boolean): any[];
    spacer(args : spacer)                                           : number;
    splice(spliceData : splice)                                     : void;
    structure                                                       : Array <[string, number]>;
    wrapCommentBlock(config: wrapConfig)                            : [string, number];
    wrapCommentLine(config: wrapConfig)                             : [string, number];
}
interface parseFramework {
    language?                        : language;
    lexer                            : lexer;
    parse                            : parse;
    parseerror                       : string;
    parserArrays(obj : parseOptions) : data;
    parserObjects(obj : parseOptions): record[];
}
interface parseOptions {
    correct        : boolean;
    crlf           : boolean;
    language       : string;
    lexer          : string;
    lexerOptions   : {
        [key: string]: {
            [key: string]: any;
        };
    };
    outputFormat: "objects" | "arrays";
    source      : string;
    wrap        : number;
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
interface recordList extends Array<record>{
    [index:number]: record;
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
interface wrapConfig {
    chars     : string[];
    end       : number;
    start     : number;
}
declare module NodeJS {
    interface Global {
        parseFramework: parseFramework
    }
}