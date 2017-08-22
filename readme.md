# Parse Framework
**This is still early.  For status and progress please see the Github issues and follow the latest branch.**

## Contents
1. [Todo](#todo)
1. [Overview](#overview)
1. [Execution](#execution)
   1. [Supplied Runtimes](#supplied-runtimes)
      1. [Browser Runtime](#browser-runtime)
      1. [Terminal Runtime](#terminal-runtime)
   1. [Embedding](#embedding)
      1. [Browser Embedding](#browser-embedding)
      1. [Node Embedding](#node-embedding)
1. [Framework](#framework)
   1. [Definition of Terms](#definition-of-terms)
   1. [Architecture](#architecture)
   1. [global](#global)
   1. [parse Data Properties](#parse-data-properties)
   1. [parse Methods](#parse-methods)
   1. [Lexers](#lexers)
1. [Input](#input)
1. [Output](#output)
   1. [begin](#begin)
   1. [lexer](#lexer)
   1. [lines](#lines)
   1. [presv](#presv)
   1. [stack](#stack)
   1. [token](#token)
   1. [types](#types)
1. [Files](#files)
1. [Contributing](#contributing)
1. [FAQ](#faq)

## Todo
* options - define and document supported options
* convert to TypeScript
* add advanced analytics and reporting of parse errors

## Overview
A parser that is the framework.  The idea is to parse any and all languages into a normalized format that can be interpreted and consumed by anything.  **A universal parser of everything for everybody.** The parser/framework comprises a simplified data format and a couple of methods in an object.  The language specific rules are stored in separate files called *lexers* that operate in accordance to the standard format using the standard methods.

## Execution
The framework is intended for inclusion in other applications as an embedded utility.  To run the framework immediately and experiment without any configuration work some simple runtime interfaces are provided.

### Supplied Runtimes
To simply experiment with the framework some handy runtimes are provided.

#### Browser Runtime
A handy-dandy browser utility is provided to run the framework in a web browser as *runtimes/browsertest.xhtml*.  This utility can be run from any location whether on your local file system or from a webserver.  Some browsers don't play well when running pages from the local file system, so a simple Node http server runtime is included as *runtimes/httpserver.js*.

The browser utility produces output in a HTML table and color codes the output based upon the lexer used.

#### Terminal Runtime
A handy terminal utility is included but requires Node.js to run.  You can run this from the terminal as `node runtimes/nodetest.js codesample`.  The code sample can be a path to a local file or string to parse.  For proper execution with Node the first command must be `node` and the second must be the file to execute: `runtimes/nodetest.js`.

By default the terminal utility will log a formatted table to the terminal.  To generate raw parse data include the `--raw` option before or after the code sample.

### Embedding
The framework is completely environment agnostic, which means it can be embedded anywhere and run the same way and produce the same output.  Getting the framework to run in different environments requires a bit of configuration that varies by environment.

The minimum requirements for embedding into all environments is to include the *parse.js* file and included the desired lexer files from the *lexers* directory.

#### Browser Embedding
In browser applications the additional file *global.js* must be included.  This file should be referrenced before other code from the framework.

#### Node Embedding
When running the framework in a Node application the *global.js* must not be used.  You can pick and choose which lexer files to run through manual inclusion.  To efficiently include all lexers I recommend performing a `fs.readdir` on the *lexers* directory and including each file with a simple forEach loop.  Look into the bottom of *runtimes/nodetest.js* for an example.

## Framework
The application operates as a global object containing a few data properties and methods plus a collection of language specific rule files called *lexers*.

### Definition of Terms
* **record** - In the documentation the word *record* appears frequently.  This term represents a single index of data at the same index from all arrays comprising the *standard format*.
* **record format** - Record format refers to an object containing property names as defined by `parse.datanames`.  Unlike *standard format* record format has literal values assigned to its properties with the appropriate data types.
* **standard format** - The standard format describes an object with property names from `parse.datanames` where the value of each property is an array and each of those arrays contain an identical number of indexes.  These arrays will never be sparse arrays.

### Architecture
This application is written entirely in vanilla JavaScript and is completely environment agnostic.  Traditionally JavaScript did not have a native module system or IO interface, which means JavaScript code must be managed by an external means.  This further means every environment has a different way to manage input and output.  Recently JavaScript has standardized a module system, which is vaguely supported inside the browser environment and not anywhere else.

To uniformly solve the problem of IO this project writes all things to a global object simply named *global*.  A global object of that name exists natively in the Node.js runtime.  To appease other environments I conveniently include a file named *global.js* to provide that namespace without preference.  In non-Node environments the global.js file must be referenced before any other file.

### global
The *global* object contains five key references.

* **langauge** - A convenience library, from the file language.js, for guessing a code's language by analyzing the code.  This library is executed using its *auto* method and passing in a string to analyze: `global.language.auto(myCode)`.  An array of three value is returned: 
   - a generalized name of the language
   - the lexer name
   - a formal language name for human reading
* **lexer** - An object storing the various available lexers.  This object must be manually populated in your run time.  Look into the browsertest.xhtml and nodetest.js files as examples.  Auto-population of this object from the files in the lexer directory does not occur because IO operations would break the environment agnostic nature of this application.
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
* **splice** - Similar to the native array splice method in JavaScript.  This method is extended to operate on the *standard format*.  The splice method takes a single object as an argument expecting these properties:
   - **data** - The data object (in *standard format*) to modify.
   - **howmany** - The number indexes to remove.  A value of 0 is allowed.
   - **index** - The index to start the splice operation.
   - **record** - An object in *record format*.

### Lexers
The lexers are stored in the *lexers* directory and are referrenced from the global `global.lexers` object, for instance: `global.lexers.markup(source)`.  Each of the lexers receive a single argument of string data type.  This input is the string to parse.

Executing a different lexer from the starting lexer is simply a matter of calling the method and passing in the appropriate string to analyze.  This is necessary in the case of JavaScript or CSS embedded inline in HTML or with languages like JSX/TSX.  There is no need manage a return value or do anything.

Simply executing the other lexer does everything you need and the framework appropriately manages all concerns of populating data and accounting for structure and nesting conditions.  This simplicity is necessary to ensure consistency in the *standard format* without corruption to the data in the parse object even when bouncing between the lexers recursively.  The framework easily addresses all these concerns by keeping all management centralized and far removed from the logic in the lexer files.

## Input
**Not documented and under development**

The parse.js application receives various arguments in an object literal.  The most critical option is *source*, a string type, of the code to parse.  The lexers receive a single string argument.

## Output
There will be a single standard format for output that will be uniform for all operations.  The output will be an object storing 7 arrays.
 
* begin
* lexer
* lines
* presv
* stack
* token
* types

Each of these keys will store an array and all these arrays will contain the same number of indexes.  Think of this as a database table such that each array is a column, the name of the array (the object key name) is the column metadata, and finally each index of the arrays is a record in the table.  Here is an example:

Consider the code `<a><b class="cat"></b></a>`.  The parsed output will be:
```
{
    begin: [
        0, 0, 1, 1, 0
    ],
    lexer: [
        "markup", "markup", "markup", "markup", "markup"
    ],
    lines: [
        0, 0, 0, 0, 0
    ],
    presv: [
        false, false, false, false, false
    ],
    stack: [
        'global', 'a', 'b', 'b', 'a'
    ],
    token: [
        '<a>', '<b>', 'class="cat"', '</b>', '</a>'
    ],
    types: ['start', 'start', 'attribute', 'end', 'end'];
}
```

If that parsed output were arranged as a table it would look something like:

index | begin | lexer    |  lines | presv | stack    | token         | types
----- | ----- | -------- | ------ | ----- | -------- | ------------- | -----
0     | 0     | "markup" | 0      | false | 'global' | '&lt;a&gt;'   | 'start'
1     | 0     | "markup" | 0      | false | 'a'      | '&lt;b &gt;'  | 'start'
2     | 1     | "markup" | 0      | false | 'b'      | 'class="cat"' | 'attribute'
3     | 1     | "markup" | 0      | false | 'b'      | '&lt;/b&gt;'  | 'end'
4     | 0     | "markup" | 0      | false | 'a'      | '&lt;/a&gt;'  | 'end'

### begin
The *begin* array stores a number representing the index where the parent structure starts.  In markup language this value would represent the index for the parent element.  In style based langauges it would store the index where the parent block opens.  In script based langauges it would store the index where the current structure opens whether that structure is a block, parenthesis, array, or something else.

Regardless of the language or lexer used the values supplied in this array allow walking of the code's structure from any local point to the global/root location.

### lexer
The *lexer* array indicates which parsed the given record. This data is helpful working with documents that require multiple lexers, such as HTML with embedded JavaScript or CSS. It is particularly helpful when working with JSX and TSX as these documents can interchange between the markup and script lexers recursively.

### lines
The *lines* array stores a white space value.  A value of 0 means no white space preceeds the current token.  Any white space preceeding the token has a minimum value of 1 and the value increments for each instance of a new line character.  This is necessary because white space has meaning in markup, and so it must be accounted for even if doesn't contain new line characters.

**To be extra clear:**

* 0 - not preceeded by any white space
* 1 - preceeded by white space that does not contain a new line character
* 2 - preceeded by white space containing a single new line character
* 3 - preceeded by white space containing two new line characters, which looks like a single empty line

### presv
The *presv* array stores a boolean indicating if the current item should be preserved from any kind of manipulation in the beautifier.  Some examples of a preserved item would be a markup comment, certain templating tags, or a tag with the attribute *data-parse-preserve*.  Script and style code items always receive a value of false in this array.

### stack
The *stack* array stores strings that describe the current structure where the item resides from the code.  In markup code the value is the tag name for the parent element at the index in the *begin* array.  In script and style code the value is a generic description of the current structure, such as: function, object, or class.

### token
The *token* array contains a string of the current item.  Markup attributes will be a separate token immediately following their parent element and also explicitly indicated via the *begin* and *stack* data fields.

### types
The *types* array contains a string that describes the token value according to a generalized category name.  These values are lexer specific.  For details on available values and definitions please see the lexer specific documentation.

## Files
### Critical
* **parse.js** - Contains all the framework code.
* lexers - A directory of language specific rules.

### Maintenance and Support
* nodetest.js - An interface to quickly run the parser from a command line terminal using Node.js.
* browsertest.xhtml - An interface to quickly run the parser in a browser with formatted output.
* language.js - A library used in nodetest.js and browsertest.xhtml to conveniently guess at the submitted language.
* httpserver.js - In some browsers working with files from the file scheme is a pain in the ass, so let's use Node to fake it.

## Contributing
I plan to expand this section substantially as this project grows.  In the mean time run the test suite using `node test/validate.js`.

## FAQ

### Why a table instead of a tree like other parsers?
Arrays are faster to access at execution time potentially allowing consumers to write much faster applications.  Arrays are also simple to reason about and manipulate both directly in the code and at execution time.

Most importantly, though, is this allows a simplified standard format that is easy to maintain, document, and consume.  If you don't like the lexers provided in the framework then write your own that output the same standard format.

### How fast does it parse JavaScript?
#### Methodology
I ran this application against [jQuery Mobile 1.4.2 minified](http://code.jquery.com/mobile/1.4.2/jquery.mobile-1.4.2.min.js) and analyzed the execution time using the performance profiler in the browser's developer tools to isolate application timing apart from any time associated with DOM interaction or page paint.  I also ran the [Esprima Speed Comparison page](http://esprima.org/test/compare.html) in the same browser.

#### Results (all results in milliseconds)
* Firefox 54.0.1 (64 bit), Windows 10 (1703) with 64gb ram and Xeon E5-1660 3.3GHz
   - parse-framework - 144.0
   - Esprima - 142.0 ±9.0%
   - Acorn - 175.9 ±14.9%
* Opera 46.0.2597.57, Mac OSX 10.12.5 with 16gb ram and Intel i7 2.9GHz
   - parse-framework - 97.8
   - Esprima - 76.6 ±9.8%
   - Acorn - 83.5 ±7.8%
* Chrome 60.0.3112.101, Mac OSX 10.12.5 with 16gb ram and Intel i7 2.9GHz
   - parse-framework - 248.6
   - Esprima - 66.0 ±8.8%
   - Acorn - 73.5 ±7.2%
* Safari 10.1.1, Mac OSX 10.12.5 with 16gb ram and Intel i7 2.9GHz
   - parse-framework - 290.1
   - Esprima - 37.9 ±3.0%
   - Acorn - 3403 ±0.7%

#### Conclusions
* Performance is neutral in Firefox and Opera where it does not appear there is optimization by convention.
* Chrome is known for providing numerous micro-optimizations and parse-framework is not making as aggressive use of those. A minor penalty is noted for creating objects as temporary storage containres for dynamic population.
* Safari provides brutal penalties to the Array *pop* method, which is critical to parse-framework. The standard pop method appears to be a vanity method over the Array *splice* method in the compiler.

### Why is the code so big?
This parser supports many various dialects and languages.  For example, instead of just parsing for Handlebars tags inside HTML this parser will parse the entire code of handlebars tags and HTML tags in a single parse operation.  The parser supports this diversity of grammars in a way that can be easily scaled to allow more precise rules or support for additional grammars.

### Why not just use Babel.js?
Babel.js is a transpiler that contains a parser.  The primary mission of the Babel project isn't to be a parser, but rather to take the latest and greatest features of JavaScript and produce output that can be used today.  This parser doesn't transpile as it is just a parser.  That means this parser is capable of supporting a greater number of features and language dialects with far less maintenance effort.  As an example, an earlier form of this parser introduced support for TypeScript a year before Babel with far less code and effort.  In short, this parser scales faster and wider than Babel by doing less.