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
interface markupCount {
    end  : number;
    index: number;
    start: number;
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
    sortCorrection(start:number, end:number)                        : void;
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
    correct         : boolean;
    crlf            : boolean;
    language        : string;
    lexer           : string;
    lexerOptions    : {
        [key: string]: {
            [key: string]: any;
        };
    };
    outputFormat    : "objects" | "arrays";
    preserve_comment: boolean;
    source          : string;
    wrap            : number;
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
    record ?: record;
}
interface style_properties {
    data: style_properties_data;
    last: style_properties_last;
    removes: style_properties_removes;
}
interface style_properties_data {
    margin: [string, string, string, string];
    padding: [string, string, string, string]
}
interface style_properties_last {
    margin: number,
    padding: number
}
interface style_properties_removes extends Array<[number, string]> {
    [index:number]: [number, string];
}
interface wrapConfig {
    chars     : string[];
    end       : number;
    opening   : string;
    start     : number;
    terminator: string;
}
declare module NodeJS {
    interface Global {
        parseFramework: parseFramework
    }
}