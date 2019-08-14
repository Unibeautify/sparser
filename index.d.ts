declare var ace: any;
type codes = [string, number, number, number, number];
type languageAuto = [string, string, string];
type lexers = "markdown" | "markup" | "script" | "style";
type lexerArray = Array<lexers>;
type minimal = [number, number, string, number, string, string, string];
type qualifier = "begins" | "contains" | "ends" | "file begins" | "file contains" | "file ends" | "file is" | "file not" | "file not contains" | "filesystem contains" | "filesystem not contains" | "is" | "not" | "not contains";
interface attStore extends Array<[string, number]>{
    [index:number]: [string, number]
}
interface cftags {
    [key:string]: "optional" | "prohibited" | "required";
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
interface inject {
    end: string;
    file: string;
    message: string;
    start: string;
}
interface inventory {
    [key:string]: [[string, string]?]
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
interface nodeError extends Error {
    code: string;
}
interface nodeLists {
    emptyline: boolean;
    heading: string;
    obj: any;
    property: "eachkey" | string;
    total: boolean;
}
interface opcodes extends Array<codes> {
    [index: number]: codes;
}
interface option {
    default: boolean | number | string;
    definition: string;
    label: string;
    lexer: Array<"all"> | lexerArray;
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
    object_sort(data : data)                                        : void;
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
interface performance {
    codeLength: number;
    diff: string;
    end: [number, number];
    index: number;
    source: string;
    start: [number, number];
    store: number[];
    test: boolean;
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
interface simulationItem {
    artifact?: string;
    command: string;
    file?: string;
    qualifier: qualifier;
    test: string;
}
interface spacer {
    array: string[];
    end  : number;
    index: number;
}
interface sparser {
    lexers              : lexer;
    libs                : {
        [key:string]: any;
    };
    options             : any;
    parse               : parse;
    parser()            : data;
    parseerror          : string;
    version             : version;
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
    margin: [string, string, string, string, boolean];
    padding: [string, string, string, string, boolean]
}
interface style_properties_last {
    margin: number,
    padding: number
}
interface style_properties_removes extends Array<[number, string]> {
    [index:number]: [number, string];
}
interface version {
    date: string;
    number: string;
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