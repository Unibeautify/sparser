# Sparser - Technical Documentation

## License: [Creative Commons Zero v1.0 Universal (cc0-1.0)](../license)

## Contents
1. [Execution](#execution)
   1. [Supplied Run Times](#supplied-run-times)
      1. [Browser Runtime](#browser-runtime)
      1. [Terminal Runtime](#terminal-runtime)
   1. [Embedding](#embedding)
      1. [Browser Embedding](#browser-embedding)
      1. [Node Embedding](#node-embedding)
1. [Ignore Code](#ignore-code)
1. [Universal Parse Model](#universal-parse-model)

### See Also
1. [Architecture](architecture.md)
1. [Automation](automation.md)
1. [Demo Tool](demo.md)
1. [Project Files](files.md)
1. [Language Support](language-support.md)
1. [Options](options.md)
1. [Introduction to Parsers](parsers.md)

For [lexer specific documentation](lexers) please review the markdown files in the lexer directory.

## Execution
```javascript
global.sparser.options.source = "my code";
global.sparser.parser();
```

Execute the application by simply running this instruction, where the options are an object described in [Options](options.md).

### Supplied Run Times
Sparser is intended for inclusion in other applications as an embedded utility.  To run Sparser immediately and experiment without any configuration some simple runtime interfaces are provided.

#### Browser Runtime
A handy-dandy browser utility is provided to run Sparser in a web browser as *demo/index.xhtml*.  This utility can be run from any location whether on your local file system or from a webserver.  First, run the build, `node js/services build`, to create the necessary JavaScript file.  To run the web server simply execute `node js/services server` on the command line.  The server provides a local webserver and a web socket channel so that the provided HTML tool automatically refreshes when the application rebuilds.

The browser utility produces output in a HTML table and color codes the output based upon the lexer used.

#### Terminal Runtime
All Node.js support is consolidated into a single location.  To examine available features run this command: `node js/services command`

### Embedding
Sparser is completely environment agnostic, which means it can be embedded anywhere and run the same way and produce the same output.

#### Browser Embedding
The browser environment makes use of a single dynamically created file: *js/browser.js*.  Just simply install from NPM (`npm install sparser`) or run the build `node js/services build` to compile the TypeScript and generate this file.  This file is actually API agnostic except that it builds out the application and attaches it as a property of the *window* object.  The file also contains every available lexer.

Include the js/browser.js file in your HTML:
```html
<script src="node_modules/sparser/js/browser.js" type="application/javascript"></script>
```

Inside your browser-based JavaScript application simply call Sparser.
```javascript
window.sparser.options.source = "my code";
window.sparser.parser();
```

#### Node Embedding
The file for embedding into Node, *js/parser.js* is identical to the file for embedding into the browser except the one reference to the *window* object instead refers to Node's *global* object.  Simply include this file into your application by any means, example: `require ("sparser");`

```javascript
global.sparser.options.source = "my code";
global.sparser.parser();
```

## Ignore Code
Parts of code can be ignored from parsing by sandwiching that code between two comments.  The first comment must start with `parse-ignore-start` and the second comment must contain `parse-ignore-end`.  For example:

```xml
<!-- parse-ignore-start --> some code to ignore <!-- parse-ignore-end -->
```

```javascript
// parse-ignore-start
ignore some code
// parse-ignore-end

/* parse-ignore-start */
ignore some code
// parse-ignore-end

// parse-ignore-start
ignore some code
/* parse-ignore-end */

/* parse-ignore-start */
ignore some code
/* parse-ignore-end */
```

## Universal Parse Model
Sparser supports several different formats of data structure for output as defined by the **format** option.  All these formats represent the data equally, but shape the data in a way a user may find more comfortable to access.  The following explanation will use examples in the default *arrays* format type.

### Data Types 
* **begin** - *number* - The index where the current structure begins.  For tokens of type *start* this will refer to the parent container or global scope.
* **ender** - *number* - The index where the current structure ends. Unlike the *begin* data a token of type *end* refers to itself.
* **lexer** - *string* - The type of rules use to scan and resolve the current token.
* **lines** - *number* - Describes the white space immediate prior to the token's first character.  A value of *0* means no white space.  A value of *1* means some amount of white space not containing a new line character.  Values of *2* and greater indicate the number of new lines plus 1.  For example an empty line preceding the current token would mean a value of *3*, because the white space would contain two new line characters.
* **stack** - *string* - A description of the current structure represented by the *begin* and *ender* data values.
* **token** - *string* - The atomic code fragment.
* **types** - *string* - A categorical description of the current token.  Types are defined in each markdown file accompanying a respective lexer file.

Each of those data types is an array of identical length that are populated and modified in unison.  Think of this as a database table such that each array is a column, the name of the array (the object key name) is the column metadata, and finally each index of the arrays is a record in the table.  Here is an example:

Consider the code `<a><b class="cat"></b></a>`.  The parsed output in the default format will be:
```
{
    begin: [
        -1, 0, 1, 1, 0
    ],
    ender: [
        4, 3, 3, 3, 4
    ],
    lexer: [
        "markup", "markup", "markup", "markup", "markup"
    ],
    lines: [
        0, 0, 0, 0, 0
    ],
    stack: [
        "global", "a", "b", "b", "a"
    ],
    token: [
        "<a>", "<b>", "class=\"cat\"", "</b>", "</a>"
    ],
    types: ["start", "start", "attribute", "end", "end"];
}
```

If that parsed output were arranged as a table it would look something like:

index | begin | ender | lexer    |  lines | stack    | token             | types
----- | ----- | ----- | -------- | ------ | -------- | ----------------- | -----
0     | -1    | 4     | "markup" | 0      | "global" | "&lt;a&gt;"       | "start"
1     | 0     | 3     | "markup" | 0      | "a"      | "&lt;b&gt;"       | "start"
2     | 1     | 3     | "markup" | 0      | "b"      | "class=\\"cat\\"" | "attribute"
3     | 1     | 3     | "markup" | 0      | "b"      | "&lt;/b&gt;"      | "end"
4     | 0     | 4     | "markup" | 0      | "a"      | "&lt;/a&gt;"      | "end"