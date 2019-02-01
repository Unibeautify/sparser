/*global global*/
(function options_init(): void {
    "use strict";
    const optionDef:optionDef = {
        correct      : {
            default   : false,
            definition: "Automatically correct sloppiness in code. If false missing syntax will be included starting with 'x', such as 'x;' for missing simicolons.",
            label     : "Correct",
            lexer     : ["any"],
            type      : "boolean"
        },
        crlf         : {
            default   : false,
            definition: "If line termination should be crlf (Windows) otherwise line termination is lf (Unix).",
            label     : "CRLF",
            lexer     : ["any"],
            type      : "boolean"
        },
        endcomma: {
            default: "none",
            definition: "Whether terminal commas in objects and arrays should be added or eliminated.",
            label: "End Comma",
            lexer: ["script"],
            type: "string",
            values: {
                "always": "Adds terminal commas if they are missing.",
                "never": "Removes terminal commas if they are present.",
                "none": "Ignores this option."
            }
        },
        format: {
            default: "arrays",
            definition: "Defines the output format of the parser.",
            label: "Output Format",
            lexer: ["any"],
            type: "string",
            values: {
                "arrays": "The output format is an object of arrays such that the same index of all the arrays represents one data record, for example: {begin:[],ender:[],lexer:[],lines[],stack:[],token:[],types:[]}.",
                "markdown": "Generates the output in a markdown table.",
                "minimal": "The output format is an array of arrays which is structurally similar to the objects format but without key names, for example: [[-1,-1,\"script\",0,\"global\",\"const\",\"word\"]]",
                "objects": "The output format is an array of objects such that each array index is one data record, for example: [{begin:-1,ender:-1,lexer:\"script\",lines:0,stack:\"global\",token:\"const\",types:\"word\"}].",
                "table": "Generates output that resembles a markdown table but padded for presentation in a terminal."
            }
        },
        language     : {
            default: "auto",
            definition: "The language to parse.  The value auto will result in language auto detection.",
            label: "Language",
            lexer: ["any"],
            type: "string"
        },
        lexer: {
            default: "auto",
            definition: "The lexer used to perform the parsing.  The value auto will result in language auto detection.",
            label: "Lexer",
            lexer: ["any"],
            type: "string"
        },
        object_sort: {
            default: false,
            definition: "Where style properties should be sorted by type and then alphabetically and whether script object properties should be sorted alphabetically.",
            label: "Object Sort",
            lexer: ["script", "style"],
            type: "boolean"
        },
        preserve_comment: {
            default: false,
            definition: "Whether comments should be ignored from manipulation, such as word wrap.",
            label: "Preserve Comment",
            lexer: ["any"],
            type: "boolean"
        },
        preserve_text: {
            default: false,
            definition: "Whether text content should be preserved from manipulation, such as word wrap.",
            label: "Preserve Text",
            lexer: ["markup"],
            type: "boolean"
        },
        quote_convert: {
            default: "none",
            definition: "If quote characters should be converted from single quotes to double quotes or the opposite. This option does take into account escaped quote characters.",
            label: "Quote Convert",
            lexer: ["markup", "script", "style"],
            type: "string",
            values: {
                "double": "Converts single quote characters to double quote characters.",
                "none": "Ignores this option.",
                "single": "Converts double quote characters to single quote characters."
            }
        },
        source: {
            default: "",
            definition: "The source code to parse.",
            label: "Source",
            lexer: ["any"],
            type: "string"
        },
        tag_merge: {
            default: false,
            definition: "If adjacent start and end tags in markup should be merged into one singleton tag.",
            label: "Tag Merge",
            lexer: ["markup"],
            type: "boolean"
        },
        tag_sort: {
            default: false,
            definition: "Whether markup tags should be alphabetically sorted amonst their siblings.",
            label: "Tag Sort",
            lexer: ["markup"],
            type: "boolean"
        },
        variable_list: {
            default: "none",
            definition: "Whether consecutive variable declarations should be separate statements or a comma separated list. Use of this option respects the different types of declarations: var, const, let.",
            label: "Variable List",
            lexer: ["script"],
            type: "string",
            values: {
                "each": "Separates variable declarations into separate statements.",
                "list": "Combines consecutive variable declaration statements into a single comma separated list.",
                "none": "Ignores this option."
            }
        },
        wrap: {
            default: 0,
            definition: "The character distance in which to apply word wrap. A value of less than 1 eliminates word wrap.",
            label: "Wrap",
            lexer: ["any"],
            type: "number"
        }
    };
    global.sparser.optionDef  = optionDef;
}());