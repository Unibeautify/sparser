# Sparser - Technical Documentation

## Contents
1. [Execution](#execution)
   1. [Supplied Runtimes](#supplied-runtimes)
      1. [Browser Runtime](#browser-runtime)
      1. [Terminal Runtime](#terminal-runtime)
   1. [Embedding](#embedding)
      1. [Browser Embedding](#browser-embedding)
      1. [Node Embedding](#node-embedding)
   1. [Including New or Custom Lexers](#including-new-or-custom-lexers)
1. [Framework](#framework)
   1. [Definition of Terms](#definition-of-terms)
   1. [Architecture](#architecture)
   1. [global](#global)
   1. [parse Data Properties](#parse-data-properties)
   1. [parse Methods](#parse-methods)
   1. [Lexers](#lexers)
1. [Ignore Code](#ignore-code)
1. [Input](#input)
   1. [Standard Options](#standard-options)
   1. [Lexer Options](#lexer-options)
1. [Output](#output)
   1. [begin](#begin)
   1. [ender](#ender)
   1. [lexer](#lexer)
   1. [lines](#lines)
   1. [stack](#stack)
   1. [token](#token)
   1. [types](#types)
1. [Files](#files)

## Execution
```javascript
global.sparser.arrays(options);
```

or

```javascript
global.sparser.objects(options);
```

Execute the application by simply running this instruction, where the options is an object described in [Input](#input).  The first code example, *arrays*, produces the default format of a single object containing 7 parallel arrays.  The second code example, *objects*, produces a single array containing objects of 7 data properties for each parsed token.

### Supplied Runtimes
Sparser is intended for inclusion in other applications as an embedded utility.  To run Sparser immediately and experiment without any configuration some simple runtime interfaces are provided.

#### Browser Runtime
A handy-dandy browser utility is provided to run Sparser in a web browser as *demo/index.xhtml*.  This utility can be run from any location whether on your local file system or from a webserver.  First, run the build, `node js/services build`, to create the necessary JavaScript file.  To run the web server simply execute `node js/services server` on the command line.  The server provides a local webserver and a web socket channel so that the provided HTML tool automatically refreshes when the application rebuilds.

The browser utility produces output in a HTML table and color codes the output based upon the lexer used.

#### Terminal Runtime
All Node.js support is consolidated into a single location.  To examine available features run this command: `node js/services command`

### Embedding
Sparser is completely environment agnostic, which means it can be embedded anywhere and run the same way and produce the same output.  Getting Sparser to run in different environments requires a bit of configuration that varies by environment.

The minimum requirements for embedding into all environments is to include the *js/parse.js* file and included the desired lexer files from the *lexers* directory.

#### Browser Embedding
The browser environment makes use of a single dynamically created file: *js/browser.js*.  Just simply run the build `node js/services build` to compile the TypeScript and generate this file.  This file is actually API agnostic except that it builds out the application and attaches it as a property of the *window* object.  The file also contains every available lexer.

Include the js/browser.js file in your HTML assuming Sparser is an NPM dependency:
```html
<script src="node_modules/sparser/js/browser.js" type="application/javascript"></script>
```

Inside your browser-based JavaScript application simply call Sparser, which returns a parse table in string format (stringified JSON):
```javascript
window.sparser.arrays(options);
```

#### Node Embedding
You can pick and choose which lexer files to run through manual inclusion.  To include all supported lexer files simply require the *lexers/all.js* file.

Here is a brief code example demonstrating how to initiate Sparser as an NPM dependency with all lexers:

1. Ensure the necessary `lexerOptions` property is present on your options object
1. Require Sparser
1. Require the *lexers/all.js* file
1. Call the function from the *lexers/all.js* file passing in options and a callback

```javascript
options.lexerOptions = {};
let sep = node.path.sep; // directory separator from node's path module
require(`${projectPath}node_modules${sep}parse-framework${sep}js${sep}parse`);
const all = require(`${projectPath}node_modules${sep}parse-framework${sep}js${sep}lexers${sep}all`);
all(options, function node_apps_mode_allLexers() {
    options.parsed = global.parseFramework.arrays(options);
    console.log(options.parsed);
});
```

### Including New or Custom Lexers
Simply drop the new lexer file into the directory named *lexers*.  Specify the name of the lexer in the *options.lexer* option.  Please see [Input](#input) for details about the options object and [lexers/readme.md](lexers/readme.md) for technical guidance on starting a new lexer file.

The two mentioned steps are all that is required to integrate new parsing rules or new language support into Sparser.  It is important to note this only works if the consuming application loads the lexer file into its application.  **I recommend always reading all lexer files in the lexers directory.** For an example please see the *fs.readdir* instruction in the [js/runtimes/nodetest.js](js/runtimes/nodetest.js) file.

## Framework
The application operates as a global object containing a few data properties and methods plus a collection of language specific rule files called *lexers*.

### Definition of Terms
* **record** - In the documentation the word *record* appears frequently.  This term represents a single index of data at the same index from all arrays comprising the *standard format*.
* **record format** - Record format refers to an object containing property names as defined by `parse.datanames`.  Unlike *standard format* record format has primitive values assigned to its properties with the appropriate data types.
* **standard format** - The standard format describes an object with property names from `parse.datanames` where the value of each property is an array and each of those arrays contain an identical number of indexes.  These arrays will never be sparse arrays.

### Architecture
The application is arranged as an object named *sparser*.  This object is attached to Node.js's *global* object.  This means of organization allows a convenient means to extend code in a module way without a module focused convention.  This also allows a code organization that is easy to extend and modify without regards for any specific environment.  In order to adapt this organization to the web browser all necessary files are combined into a single file and the *sparser* object is assigned to the *window* object instead of *global*.

### global
The *global* object contains five key references.

* **langauge** - A convenience library, from the file *js/language.js*, for guessing a code's language by analyzing the code.  This library is executed using its *auto* method and passing in a string to analyze: `global.sparser.language.auto(myCode)`.  An array of three value is returned: 
   - a generalized name of the language
   - the lexer name
   - a formal language name for human reading
* **lexer** - An object storing the various available lexers.  This object must be manually populated in your run time.  Look into the *demo/index.xhtml* and *nodetest.js* files as examples.  Auto-population of this object from the files in the lexer directory does not occur because IO operations would break the environment agnostic nature of this application.
* **parse** - An object containing various data properties and methods to reason about and populate the centralized parse data.
* **parseerror** - A string storing an empty value by default.  When a lexer produces a parse error it will write an error message to this property.
* **parser** - A small function to initiate execution of the framework.  This function is not intended to be referenced from within a lexer file.

### parse Data Properties
* **count** - A number, starting at -1, that always counts the number of data records minus one.  So long as lexers only populate or manipulate data records using the standard methods this number will always reflect an accurate number of records minus one.
* **data** - The object serving as the parsed data storage.  This what gets returned from the framework.
* **datanames** - An array of the data record names, the 7 arrays.  When dynamically building or populating a record of data it is preferred to loop through the datanames to build the data record.  Please read the `parse.push` method as an example.
* **lf** - The format for a line termination.  In Windows the default line terminator is the two text character sequence CRLF (carriage return and line feed) while in most other operating systems line termination is simply LF.  The `parse.lf` property contains the correct value, so it should always be referenced where line termination is required.
* **linesSpace** - A number of white space values between one token and the next.  This number is used to pass the appropriate value between lexers for those languages that require more than one lexer and the value ultimately populates the *lines* record value. The framework resets the value of this property to *0* each time the `parse.push` and `parse.splice` methods are called on `parse.data`.
* **options** - This is merely a placeholder for the options object that is passed into the framework so that the objects are available to the lexers.
* **structure** - An array of arrays where each child array stores two values.  The first of those two values is a categorical name that describes the current structure and the second value is the index where this structure starts.  The first index of `parse.structure` is always `[global, -1]`, which describes global scope.  The value -1 is associated with global scope since global scope starts before the first data record.  A new value is pushed into structure once a record is pushed into `parse.data` where *types* is *start*.  The final index of structure is popped out after a record with *types* *end* is added to `parse.data`.  Please be aware that this property is populated and popped from the `parse.push` method when `parse.data` is modified and the record types are *start*, *template_start*, *end* or *template_end*, which will cause interference if manually adjusting this property. **Only use the last index of structure when populating record values for begin and stack.**

### parse Methods
Only use these method to populate or modify `parse.data`.  Any other means of changing the data breaks the framework.

* **concat** - Similar to the native array *concat* method.  This takes two arguments of which both are objects in *standard format*.  The object in the second argument will be added onto the object in the first argument.
* **objectSort** - A method to sort immediate children of a given structure in certain languages.  In JavaScript this method will sort properties of an object literal (or similar storage) and just about everything in CSS like languages.
* **pop** - Takes a single object in *standard format* format as an argument pops off the last index of each array.  A *record format* object is returned as output.
* **push** - Takes three arguments where the first is a *standard format* object and the second is an object in *record format*.  The third argument must be a string that describes the current structure.  This third argument is only used if the types value of the second argument is *start*.  In all cases an empty string can be supplied for the third argument.
* **spacer** - Reasons about what whitespace between code tokens and populates the `parse.linesSpace` property.
* **safeSort** - A fast and multidimensional sort method.  The native JavaScript array sort method does not use a standard implementation to execute a sort algorithm, which can cause unexpected results.  The safeSort method always uses the same algorithm, and so it is always predictable without compromise to performance.  It is also better than the native sort method in that safeSort is multidimensional.  The safeSort is rigid in its how it sorts though, so when maximum flexibility or a custom comparator is required the native sort method is better.
* **splice** - Similar to the native array splice method in JavaScript.  This method is extended to operate on the *standard format*.  Please be aware the use of this method may corrupt the *begin* and *ender* values of existing records following the injection point.  The splice method takes a single object as an argument expecting these properties:
   - **data** - The data object (in *standard format*) to modify.
   - **howmany** - The number indexes to remove.  A value of 0 is allowed.
   - **index** - The index to start the splice operation.
   - **record** - An object in *record format*.

### Lexers
The lexers are stored in the *lexers* directory and are referrenced from the global `global.parseFramework.lexers` object, for instance: `global.parseFramework.lexers.markup(source)`.  Each of the lexers receive a single argument of string data type.  This input is the string to parse.

Executing a different lexer from the starting lexer is simply a matter of calling the method and passing in the appropriate string to analyze.  This is necessary in the case of JavaScript or CSS embedded inline in HTML or with languages like JSX/TSX.  There is no need manage a return value or do anything.

Simply executing the other lexer does everything you need and the framework appropriately manages all concerns of populating data and accounting for structure and nesting conditions.  This simplicity is necessary to ensure consistency in the *standard format* without corruption to the data in the parse object even when bouncing between the lexers recursively.  The framework easily addresses all these concerns by keeping all management centralized and far removed from the logic in the lexer files.

## Ignore Code
Parts of code can be ignored from parsing by sandwhiching that code between two comments.  The first comment must start with `parse-ignore-start` and the second comment must contain `parse-ignore-end`.  For example:

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

## Input
The *js/parse.js* file receives input from an options object.  The api is as follows:

### Standard Options
These options exist directly within the options object and exist universally to assist the framework.

Name | Type | Default | Description
---|---|---|---
**correct** | boolean | false | If code corrections to syntax should be applied... similar to ESLint's *fix* option
**crlf** | boolean | false | If true line endings will be *\\r\\n* (Windows format) otherwise line endings will be *\\n*.  This is primarily useful in building out multiline comments.
**language** | string | "javascript" | A lowercase name of a language for certain language specific features
**lexer** | string | "script" | the lexer to start scanning the code
**outputFormat** | string | "arrays" or "objects" | describes the format of the output.  The value *"arrays"* is the default which specifies an object containing 7 parallel arrays as described in the *Output* section.  The value *"objects"* instead creates an array of objects where each object property is named and described as the seven output arrays in the *Output* section.  If testing with the *nodetest.js* file on the command line the argument **--outputFormat** can be supplied to force the *"objects"* variation.
**preserve_comment** | boolean | Preserves comments from formatting or word wrapping.
**source** | string | "" (empty string) | the code to parse
**wrap** | number | the number of characters before word wrapping occurs. This option is disabled if it receives a value of less than 1.

### Lexer Options
The options are available from the specified lexer and are specified as **options.lexerOptions[lexerName][optionName]** where *lexerName* refers to the name of the lexer and *optionName* refers to the actual option, for example: `options.lexerOptions.markup.tagSort`.

Name | Type | Default | Lexers | Description
---|---|---|---|---
**end_comma** | string | script | Values: *none*, *always*, *never*.  Whether an ending comma should be added or removed from objects and arrays.  The *none* value disables this option.
**objectSort** | boolean | false | script, style | If object properties should be sorted.  Supported in the *script* and *style* lexers
**preserve_text** | boolean | false | Preserves text content from formatting or word wrapping.
**quote_convert** | string | script, style | Values: *none*, *double*, *single*.  Whether quotes should be converted to double quote or single quote characters.  The *none* value disables this option.
**tag_merge** | boolean | false | markup | If, in the markup lexer, tags pairs should be merged  into a single singleton type tag when an end tag immediately follows its start tag
**tagSort** | boolean | false | markup | If tags should be alphabetically sorted in the markup lexer
**varword** | string | script | Values: *list*, *each*, *none*. Whether variables should be declared as a list or individually each with their own respective *var*, *let*, or *const* keyword.  The value *none* disables this option.

## Universal Parse Model
The default format for output that will be uniform for all operations.  The output will be an object storing 7 arrays.  An alternate output format is available if specifying an option named **outputFormat** with the value *objects*.  This alternate format will produce an array of objects where each object contains properties named and described as arrays below.  Essentially the alternate format simply inverts the object/array structure of the standard format.
 
* begin
* ender
* lexer
* lines
* stack
* token
* types

Each of these keys will store an array and all these arrays will contain the same number of indexes.  Think of this as a database table such that each array is a column, the name of the array (the object key name) is the column metadata, and finally each index of the arrays is a record in the table.  Here is an example:

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

The output in the `outputFormat="objects"` format will be:
```
[
    {
        begin: -1,
        ender: 4,
        lexer: "markup",
        lines: 0,
        stack: "global",
        token: "<a>",
        types: "start"
    },
    {
        begin: 0,
        ender: 3,
        lexer: "markup",
        lines: 0,
        stack: "a",
        token: "<b>",
        types: "start"
    },
    {
        begin: 0,
        ender: 3,
        lexer: "markup",
        lines: 1,
        stack: "b",
        token: "class=\"cat\"",
        types: "attribute"
    },
    {
        begin: 0,
        ender: 3,
        lexer: "markup",
        lines: 1,
        stack: "global",
        token: "</b>",
        types: "end"
    },
    {
        begin: 0,
        ender: 4,
        lexer: "markup",
        lines: 0,
        stack: "global",
        token: "</a>",
        types: "end"
    }
]
```

If that parsed output were arranged as a table it would look something like:

index | begin | ender | lexer    |  lines | stack    | token         | types
----- | ----- | ----- | -------- | ------ | -------- | ------------- | -----
0     | -1    | 4     | "markup" | 0      | "global" | "&lt;a&gt;"   | "start"
1     | 0     | 3     | "markup" | 0      | "a"      | "&lt;b &gt;"  | "start"
2     | 1     | 3     | "markup" | 0      | "b"      | "class="cat"" | "attribute"
3     | 1     | 3     | "markup" | 0      | "b"      | "&lt;/b&gt;"  | "end"
4     | 0     | 4     | "markup" | 0      | "a"      | "&lt;/a&gt;"  | "end"

### begin
The *begin* array stores a number representing the index where the parent structure starts.  In markup language this value would represent the index for the parent element.  In style based langauges it would store the index where the parent block opens.  In script based langauges it would store the index where the current structure opens whether that structure is a block, parenthesis, array, or something else.

Regardless of the language or lexer used the values supplied in this array allow walking of the code's structure from any local point to the global/root location.

### ender
The *ender* array stores a number representing the index of the end of a token's containing structure.  This is the pair to the token's *begin* value.  This is a big structure difference between the *begin* and *ender* values in that an end type will use its own index as its *ender* value, but a start type's *begin* value will point to its starting parent opposed to pointing to itself. Tokens of types *else* or *template_else* will serve as the ender value for the preceeding tokens, but will take the value of their ending pair whether its types value is some form of *end* or *else*.

### lexer
The *lexer* array indicates which parsed the given record. This data is helpful working with documents that require multiple lexers, such as HTML with embedded JavaScript or CSS. It is particularly helpful when working with JSX and TSX as these documents can interchange between the markup and script lexers recursively.

### lines
The *lines* array stores a white space value.  A value of 0 means no white space preceeds the current token.  Any white space preceeding the token has a minimum value of 1 and the value increments for each instance of a new line character.  This is necessary because white space has meaning in markup, and so it must be accounted for even if doesn't contain new line characters.

**To be extra clear:**

* **0** - The current token is not preceded by any white space.  In the example `(y > 1)` the `y` token would receive a lines value of `0`.
* **1** - The current token is preceded by white space that does not contain a new line character.  In the example `(y > 1)` the `>` token would receive a lines value of `1`.
* **2** - The current token is preceded by white space containing a single new line character, such that the current token is on the next line of code compared to the previous token in the submitted code sample.
* **3** - The current token is preceded by white space containing two new line characters, which means a single empty line or a line containing only white space characters.
* **x** - The current token is preceded by white space containing (x - 2) empty lines or lines that contain only white space characters.  For example if a token follows 5 empty lines from the submitted code sample this token's *lines* value would be `7`.

### stack
The *stack* array stores strings that describe the current structure where the item resides from the code.  In markup code the value is the tag name for the parent element at the index in the *begin* array.  In script and style code the value is a generic description of the current structure, such as: function, object, or class.

### token
The *token* array contains a string of the current item.  Markup attributes will be a separate token immediately following their parent element and also explicitly indicated via the *begin* and *stack* data fields.

### types
The *types* array contains a string that describes the token value according to a generalized category name.  These values are lexer specific.  For details on available values and definitions please see the lexer specific documentation.

## Files
### Critical
* **js** - A directory containing the JavaScript code built from the TypeScript build.
* **language.ts** - A convenience utility to guess at the language of a submitted code sample. This utility is handy when executing the framework through one of the provided runtime utilities. For precision and stability I suggest **not** using this file if embedding this framework in another application or if running this application in any public facing production environment.  Instead specify the language and lexer option values manually or through some other setting from an external application.
* **lexers** - A directory of language specific rules.
* **parse.ts** - Contains all the framework code.
* **runtimes** - A directory containing the node and browser run time files plus their dependencies. For additional information on the supplied automation environment tool please see [docs/developer.md](docs/developer.md).
* **test** - A directory containing the unit test samples and the validation build file: [test/validate.ts](test/validate.ts).

### Maintenance and Support
* nodetest.ts - An interface to quickly run the parser from a command line terminal using Node.js.
* demo/index.xhtml - An interface to quickly run the parser in a browser with formatted output.
* language.ts - A library used to conveniently guess at the submitted language.