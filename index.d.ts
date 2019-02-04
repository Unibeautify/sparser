declare var ace: any;
type codes = [string, number, number, number, number];
type languageAuto = [string, string, string];
type lexerValues = ["all"] | ("markdown" | "markup" | "script" | "style")[];
type minimal = [number, number, string, number, string, string, string];
interface attStore extends Array<[string, number]>{
    [index:number]: [string, number]
}
interface commandList {
    [key: string]: {
        description: string;
        example: {
            code: string;
            defined: string;
        }[];
    }
}
interface compareStore extends Array<[number, number]>{
    [index:number]: [number, number];
}
interface data {
    begin: number[];
    ender: number[];
    lexer: string[];
    lines: number[];
    stack: string[];
    token: string[];
    types: string[];
}
interface diffJSON extends Array<["+"|"-"|"=", string]|["r", string, string]> {
    [index:number]: ["+"|"-"|"=", string]|["r", string, string];
}
interface difftable {
    [key: string]: [number, number];
}
interface diffview {
    (): [string, number, number]
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
interface lexerDoc {
    [key:string]: string[];
}
interface markupCount {
    end  : number;
    index: number;
    start: number;
}
interface nodeLists {
    emptyline: boolean;
    heading: string;
    obj: any;
    property: "eachkey" | string;
}
interface opcodes extends Array<codes> {
    [index: number]: codes;
}
interface option {
    default: boolean | number | string;
    definition: string;
    label: string;
    lexer: lexerValues;
    type: "boolean" | "number" | "string";
    values?: {
        [key: string]: string;
    }
}
interface optionDef {
    [key:string]: option;
}
interface parse {
    concat(data : data, array : data)                               : void;
    count                                                           : number;
    data                                                            : data;
    datanames                                                       : string[];
    lineNumber                                                      : number;
    linesSpace                                                      : number;
    object_sort(data : data)                                         : void;
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
interface parseOptions {
    correct         : boolean;
    crlf            : boolean;
    language        : string;
    lexer           : string;
    lexer_options    : {
        [key: string]: {
            [key: string]: any;
        };
    };
    format          : "arrays" | "markdown" | "minimal" | "objects" | "table" | "testprep";
    preserve_comment: boolean;
    source          : string;
    wrap            : number;
}
interface readDirectory {
    callback: Function;
    exclusions: string[];
    path: string;
    recursive: boolean;
    symbolic: boolean;
}
interface record {
    begin: number;
    ender: number;
    lexer: string;
    lines: number;
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
interface sparser {
    defaults            : {};
    lexers              : lexer;
    libs                : {
        [key:string]: any;
    };
    parse               : parse;
    parser(parseOptions): data;
    parseerror          : string;
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
interface Window {
    sparser: any;
}
interface wrapConfig {
    chars     : string[];
    end       : number;
    lexer     : string;
    opening   : string;
    start     : number;
    terminator: string;
}
declare module NodeJS {
    interface Global {
        sparser: sparser;
    }
}