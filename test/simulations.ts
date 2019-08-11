
// tests structure
// * artifact - the address of anything written to disk, so that it can be removed
// * command - the command to execute minus the `node js/services` part
// * file - a file system address to open
// * qualifier - how to test, see simulationItem in index.d.ts for appropriate values
// * test - the value to compare against

(function simulations() {
    "use strict";
    const sep:string = require("path").sep,
        projectPath:string = (function node_project() {
            const dirs:string[] = __dirname.split(sep);
            return dirs.slice(0, dirs.length - 2).join(sep) + sep;
        }()),
        supersep:string = (sep === "\\")
            ? "\\\\"
            : sep,
        text:any     = {
            angry    : "\u001b[1m\u001b[31m",
            blue     : "\u001b[34m",
            bold     : "\u001b[1m",
            clear    : "\u001b[24m\u001b[22m",
            cyan     : "\u001b[36m",
            diffchar : "\u001b[1m\u001b[4m",
            green    : "\u001b[32m",
            nocolor  : "\u001b[39m",
            none     : "\u001b[0m",
            purple   : "\u001b[35m",
            red      : "\u001b[31m",
            underline: "\u001b[4m",
            yellow   : "\u001b[33m"
        },
        tests:simulationItem[] = [
            {
                command: "asdf",
                qualifier: "contains",
                test: `${text.angry}*${text.none} locally installed  - ${text.cyan}node js/services commands${text.none}`
            },
            {
                command: "comm version",
                qualifier: "contains",
                test: "Prints the current version number and date to the shell."
            },
            {
                command: "commands",
                qualifier: "contains",
                test: `Commands are tested using the ${text.green}simulation${text.none} command.`
            },
            {
                command: "commands testprep",
                qualifier: "contains",
                test: `   ${text.cyan}sparser testprep test/sample_code/script/jsx_recurse.txt${text.none}`
            },
            {
                command: "commands version",
                qualifier: "contains",
                test: "Prints the current version number and date to the shell."
            },
            {
                command: "directory",
                qualifier: "contains",
                test: "No path supplied for the directory command."
            },
            {
                command: `directory ".${supersep}" ignore ["node_modules", ".git", ".DS_Store", "2", "3", "beta", "ignore", "sparser"] --verbose`,
                qualifier: "contains",
                test: ` matching items from address `
            },
            {
                command: `directory ${projectPath}js`,
                qualifier: "contains",
                test: `js${supersep}libs${supersep}language.js","file"`
            },
            {
                command: `directory ${projectPath}js 2`,
                qualifier: "contains",
                test: `,"ctime":`
            },
            {
                command: `directory ${projectPath}js ignore ["test"]`,
                qualifier: "not contains",
                test: `js${supersep}test${supersep}simulations.js"`
            },
            {
                command: `directory ${projectPath}js listonly`,
                qualifier: "not contains",
                test: `,"ctime":`
            },
            {
                command: `directory ${projectPath}js typeof`,
                qualifier: "is",
                test: "directory"
            },
            {
                command: `directory typeof ${projectPath}js`,
                qualifier: "is",
                test: "directory"
            },
            {
                command: `directory typeof ${projectPath}js${sep}lexers${sep}style.js`,
                qualifier: "is",
                test: "file"
            },
            {
                command: "get https://duckduckgo.com/",
                qualifier: "contains",
                test: `DDG.page = new DDG.Pages.Home();`
            },
            {
                command: "help",
                qualifier: "contains",
                test: "To see all the supported features try:"
            },
            {
                command: "help 2",
                qualifier: "contains",
                test: "To see more detailed documentation for specific command supply the command name:"
            },
            {
                command: "opts",
                qualifier: "contains",
                test: `${text.angry}* ${text.none + text.cyan}unformatted        ${text.none}: If tags in markup code should be preserved from any manner of`
            },
            {
                command: "opts 2",
                qualifier: "contains",
                test: `${text.green}20${text.none} matching options.`
            },
            {
                command: "opts type:boolean",
                qualifier: "not contains",
                test: `quote_convert`
            },
            {
                command: "opts lexer:script",
                qualifier: "not contains",
                test: "wrap"
            },
            {
                command: "opts format",
                qualifier: "contains",
                test: `${text.angry}* ${text.none + text.cyan}type      ${text.none}: string`
            },
            {
                command: "opts format 2",
                qualifier: "contains",
                test: `   ${text.angry}- ${text.none + text.cyan}markdown${text.none}: Generates the output in a markdown table.`
            },
            {
                command: "opts tag_merge",
                qualifier: "contains",
                test: `${text.angry}* ${text.none + text.cyan}definition${text.none}: If adjacent start and end tags in markup should be merged into one singleton tag.`
            },
            {
                command: "options lexer:script type:number",
                qualifier: "contains",
                test: `${text.angry}Sparser has no options matching the query criteria.${text.none}`
            },
            {
                command: "options lexer:script type:boolean",
                qualifier: "contains",
                test: `${text.angry}* ${text.none + text.cyan}object_sort${text.none}: Where style properties should be sorted`
            },
            {
                command: "parse tsconfig.json",
                qualifier: "is",
                test: `{"begin":[-1,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0,15,15,15,15,0,0,0,0,23,23,23,23,0],"ender":[28,28,28,11,11,11,11,11,11,11,11,11,28,28,28,19,19,19,19,19,28,28,28,27,27,27,27,27,28],"lexer":["script","script","script","script","script","script","script","script","script","script","script","script","script","script","script","script","script","script","script","script","script","script","script","script","script","script","script","script","script"],"lines":[0,2,0,1,2,0,1,0,2,0,1,2,0,2,0,1,2,0,2,2,0,2,0,1,2,0,2,2,2],"stack":["global","object","object","object","object","object","object","object","object","object","object","object","object","object","object","object","array","array","array","array","object","object","object","object","array","array","array","array","object"],"token":["{","\\"compilerOptions\\"",":","{","\\"target\\"",":","\\"ES6\\"",",","\\"outDir\\"",":","\\"js\\"","}",",","\\"include\\"",":","[","\\"*.ts\\"",",","\\"**/*.ts\\"","]",",","\\"exclude\\"",":","[","\\"js\\"",",","\\"node_modules\\"","]","}"],"types":["start","string","operator","start","string","operator","string","separator","string","operator","string","end","separator","string","operator","start","string","separator","string","end","separator","string","operator","start","string","separator","string","end","end"]}`
            },
            {
                command: "parse tsconfig.json format:csv",
                qualifier: "is",
                test: "index,begin,ender,lexer,lines,stack,token,types\r\n0,-1,28,\"script\",0,\"global\",\"{\",\"start\"\r\n1,0,28,\"script\",2,\"object\",\"\"\"compilerOptions\"\"\",\"string\"\r\n2,0,28,\"script\",0,\"object\",\":\",\"operator\"\r\n3,0,11,\"script\",1,\"object\",\"{\",\"start\"\r\n4,3,11,\"script\",2,\"object\",\"\"\"target\"\"\",\"string\"\r\n5,3,11,\"script\",0,\"object\",\":\",\"operator\"\r\n6,3,11,\"script\",1,\"object\",\"\"\"ES6\"\"\",\"string\"\r\n7,3,11,\"script\",0,\"object\",\",\",\"separator\"\r\n8,3,11,\"script\",2,\"object\",\"\"\"outDir\"\"\",\"string\"\r\n9,3,11,\"script\",0,\"object\",\":\",\"operator\"\r\n10,3,11,\"script\",1,\"object\",\"\"\"js\"\"\",\"string\"\r\n11,3,11,\"script\",2,\"object\",\"}\",\"end\"\r\n12,0,28,\"script\",0,\"object\",\",\",\"separator\"\r\n13,0,28,\"script\",2,\"object\",\"\"\"include\"\"\",\"string\"\r\n14,0,28,\"script\",0,\"object\",\":\",\"operator\"\r\n15,0,19,\"script\",1,\"object\",\"[\",\"start\"\r\n16,15,19,\"script\",2,\"array\",\"\"\"*.ts\"\"\",\"string\"\r\n17,15,19,\"script\",0,\"array\",\",\",\"separator\"\r\n18,15,19,\"script\",2,\"array\",\"\"\"**/*.ts\"\"\",\"string\"\r\n19,15,19,\"script\",2,\"array\",\"]\",\"end\"\r\n20,0,28,\"script\",0,\"object\",\",\",\"separator\"\r\n21,0,28,\"script\",2,\"object\",\"\"\"exclude\"\"\",\"string\"\r\n22,0,28,\"script\",0,\"object\",\":\",\"operator\"\r\n23,0,27,\"script\",1,\"object\",\"[\",\"start\"\r\n24,23,27,\"script\",2,\"array\",\"\"\"js\"\"\",\"string\"\r\n25,23,27,\"script\",0,\"array\",\",\",\"separator\"\r\n26,23,27,\"script\",2,\"array\",\"\"\"node_modules\"\"\",\"string\"\r\n27,23,27,\"script\",2,\"array\",\"]\",\"end\"\r\n28,0,28,\"script\",2,\"object\",\"}\",\"end\""
            },
            {
                command: "parse tsconfig.json format:markdown",
                qualifier: "is",
                test: `index|begin|ender|lexer |lines|stack |token            |types    \r\n-----|-----|-----|------|-----|------|-----------------|---------\r\n0    |-1   |28   |script|0    |global|{                |start    \r\n1    |0    |28   |script|2    |object|"compilerOptions"|string   \r\n2    |0    |28   |script|0    |object|:                |operator \r\n3    |0    |11   |script|1    |object|{                |start    \r\n4    |3    |11   |script|2    |object|"target"         |string   \r\n5    |3    |11   |script|0    |object|:                |operator \r\n6    |3    |11   |script|1    |object|"ES6"            |string   \r\n7    |3    |11   |script|0    |object|,                |separator\r\n8    |3    |11   |script|2    |object|"outDir"         |string   \r\n9    |3    |11   |script|0    |object|:                |operator \r\n10   |3    |11   |script|1    |object|"js"             |string   \r\n11   |3    |11   |script|2    |object|}                |end      \r\n12   |0    |28   |script|0    |object|,                |separator\r\n13   |0    |28   |script|2    |object|"include"        |string   \r\n14   |0    |28   |script|0    |object|:                |operator \r\n15   |0    |19   |script|1    |object|[                |start    \r\n16   |15   |19   |script|2    |array |"*.ts"           |string   \r\n17   |15   |19   |script|0    |array |,                |separator\r\n18   |15   |19   |script|2    |array |"**/*.ts"        |string   \r\n19   |15   |19   |script|2    |array |]                |end      \r\n20   |0    |28   |script|0    |object|,                |separator\r\n21   |0    |28   |script|2    |object|"exclude"        |string   \r\n22   |0    |28   |script|0    |object|:                |operator \r\n23   |0    |27   |script|1    |object|[                |start    \r\n24   |23   |27   |script|2    |array |"js"             |string   \r\n25   |23   |27   |script|0    |array |,                |separator\r\n26   |23   |27   |script|2    |array |"node_modules"   |string   \r\n27   |23   |27   |script|2    |array |]                |end      \r\n28   |0    |28   |script|2    |object|}                |end`
            },
            {
                command: "parse tsconfig.json format:minimal",
                qualifier: "is",
                test: `[[-1,28,"script",0,"global","{","start"],[0,28,"script",2,"object","\\"compilerOptions\\"","string"],[0,28,"script",0,"object",":","operator"],[0,11,"script",1,"object","{","start"],[3,11,"script",2,"object","\\"target\\"","string"],[3,11,"script",0,"object",":","operator"],[3,11,"script",1,"object","\\"ES6\\"","string"],[3,11,"script",0,"object",",","separator"],[3,11,"script",2,"object","\\"outDir\\"","string"],[3,11,"script",0,"object",":","operator"],[3,11,"script",1,"object","\\"js\\"","string"],[3,11,"script",2,"object","}","end"],[0,28,"script",0,"object",",","separator"],[0,28,"script",2,"object","\\"include\\"","string"],[0,28,"script",0,"object",":","operator"],[0,19,"script",1,"object","[","start"],[15,19,"script",2,"array","\\"*.ts\\"","string"],[15,19,"script",0,"array",",","separator"],[15,19,"script",2,"array","\\"**/*.ts\\"","string"],[15,19,"script",2,"array","]","end"],[0,28,"script",0,"object",",","separator"],[0,28,"script",2,"object","\\"exclude\\"","string"],[0,28,"script",0,"object",":","operator"],[0,27,"script",1,"object","[","start"],[23,27,"script",2,"array","\\"js\\"","string"],[23,27,"script",0,"array",",","separator"],[23,27,"script",2,"array","\\"node_modules\\"","string"],[23,27,"script",2,"array","]","end"],[0,28,"script",2,"object","}","end"]]`
            },
            {
                command: "parse libs",
                qualifier: "contains",
                test: `"${projectPath.replace(/\\/g, "\\\\")}libs${sep.replace(/\\/g, "\\\\")}language.ts":{`
            },
            {
                command: "parse libs 2",
                qualifier: "contains",
                test: `"${projectPath.replace(/\\/g, "\\\\")}libs${sep.replace(/\\/g, "\\\\")}options.ts":{`
            },
            {
                command: "parse demo no_lead_zero:true",
                qualifier: "contains",
                test: `".title","{","margin",":","0 XXXX 0.5em",";","min-width",":","35em","x;","}"`
            },
            {
                artifact: `${projectPath}libstest.txt`,
                command: `parse libs output:"libstest.txt"`,
                file: `${projectPath}libstest.txt`,
                qualifier: "file contains",
                test: `"${projectPath.replace(/\\/g, "\\\\")}libs${sep.replace(/\\/g, "\\\\")}options.ts":{`
            },
            {
                command: "performance parse tsconfig.json",
                qualifier: "contains",
                test: "] Character size"
            },
            {
                command: "performance parse jsconfig.json",
                qualifier: "contains",
                test: "is not a file or directory."
            },
            {
                command: "performance parse parsefile.ts",
                qualifier: "contains",
                test: "] Milliseconds, \u00b1"
            },
            {
                command: "performance version",
                qualifier: "contains",
                test: "Sparser version"
            },
            {
                command: "performance build",
                qualifier: "contains",
                test: "The performance tool cannot test the build command."
            },
            {
                command: "performance performance",
                qualifier: "contains",
                test: "The performance tool cannot test itself."
            },
            {
                command: "sparser_debug",
                qualifier: "contains",
                test: `${text.green}## Command Line Instruction${text.none}`
            },
            {
                command: "testprep tsconfig.json",
                qualifier: "begins",
                test: `[\n{"begin":-1,"ender":28,"lexer":"script","lines":0,"stack":"global","token":"{","types":"start"},\n{"begin":0,"ender":28,"lexer":"script","lines":2,"stack":"object","token":"\\"compilerOptions\\"","types":"string"},\n{"begin":0,"ender":28,"lexer":"script","lines":0,"stack":"object","token":":","types":"operator"},\n{"begin":0,"ender":11,"lexer":"script","lines":1,"stack":"object","token":"{","types":"start"},\n{"begin":3,"ender":11,"lexer":"script","lines":2,"stack":"object","token":"\\"target\\"","types":"string"},\n{"begin":3,"ender":11,"lexer":"script","lines":0,"stack":"object","token":":","types":"operator"},\n{"begin":3,"ender":11,"lexer":"script","lines":1,"stack":"object","token":"\\"ES6\\"","types":"string"},\n{"begin":3,"ender":11,"lexer":"script","lines":0,"stack":"object","token":",","types":"separator"},\n{"begin":3,"ender":11,"lexer":"script","lines":2,"stack":"object","token":"\\"outDir\\"","types":"string"},\n{"begin":3,"ender":11,"lexer":"script","lines":0,"stack":"object","token":":","types":"operator"},\n{"begin":3,"ender":11,"lexer":"script","lines":1,"stack":"object","token":"\\"js\\"","types":"string"},\n{"begin":3,"ender":11,"lexer":"script","lines":2,"stack":"object","token":"}","types":"end"},\n{"begin":0,"ender":28,"lexer":"script","lines":0,"stack":"object","token":",","types":"separator"},\n{"begin":0,"ender":28,"lexer":"script","lines":2,"stack":"object","token":"\\"include\\"","types":"string"},\n{"begin":0,"ender":28,"lexer":"script","lines":0,"stack":"object","token":":","types":"operator"},\n{"begin":0,"ender":19,"lexer":"script","lines":1,"stack":"object","token":"[","types":"start"},\n{"begin":15,"ender":19,"lexer":"script","lines":2,"stack":"array","token":"\\"*.ts\\"","types":"string"},\n{"begin":15,"ender":19,"lexer":"script","lines":0,"stack":"array","token":",","types":"separator"},\n{"begin":15,"ender":19,"lexer":"script","lines":2,"stack":"array","token":"\\"**/*.ts\\"","types":"string"},\n{"begin":15,"ender":19,"lexer":"script","lines":2,"stack":"array","token":"]","types":"end"},\n{"begin":0,"ender":28,"lexer":"script","lines":0,"stack":"object","token":",","types":"separator"},\n{"begin":0,"ender":28,"lexer":"script","lines":2,"stack":"object","token":"\\"exclude\\"","types":"string"},\n{"begin":0,"ender":28,"lexer":"script","lines":0,"stack":"object","token":":","types":"operator"},\n{"begin":0,"ender":27,"lexer":"script","lines":1,"stack":"object","token":"[","types":"start"},\n{"begin":23,"ender":27,"lexer":"script","lines":2,"stack":"array","token":"\\"js\\"","types":"string"},\n{"begin":23,"ender":27,"lexer":"script","lines":0,"stack":"array","token":",","types":"separator"},\n{"begin":23,"ender":27,"lexer":"script","lines":2,"stack":"array","token":"\\"node_modules\\"","types":"string"},\n{"begin":23,"ender":27,"lexer":"script","lines":2,"stack":"array","token":"]","types":"end"},\n{"begin":0,"ender":28,"lexer":"script","lines":2,"stack":"object","token":"}","types":"end"}\n]`
            },
            {
                command: "version",
                qualifier: "ends",
                test: " seconds total time"
            },
            {
                command: "version 2",
                qualifier: "begins",
                test: `Sparser version ${text.angry}`
            }
        ];
    module.exports = tests;
}());