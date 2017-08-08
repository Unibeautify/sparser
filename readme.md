# Parse Framework
**This is still early.  For status and progress please see the Github issues and follow the latest branch.**

Most of the bugs seem to be worked out at this point, but I am not certifying the parser as ready just yet.

## Todo
* unit tests
* options - define and document supported options
* convert to TypeScript
* add advanced analytics and reporting of parse errors
* normalize and document *type* values

## Overview
A parser that is the framework.  The idea is to parse any and all languages into a normalized format that can be interpreted and consumed by anything.  **A universal parser of everything for everybody.** The parser/framework comprises a simplified data format and a couple of methods in an object.  The language specific rules are stored in separate files called *lexers* that operate in accordance to the standard format using the standard methods.

## Files
### Critical
* **parse.js** - This is the only file that matters.
* lexers - A directory of language specific rules.

### Maintenance and Support
* nodetest.js - An interface to quickly run the parser from a command line terminal using Node.js.
* browsertest.xhtml - An interface to quickly run the parser in a browser with formatted output.
* language.js - A library used in nodetest.js and browsertest.xhtml to conveniently guess at the submitted language.
* httpserver.js - In some browsers working with files from the file scheme is a pain in the ass, so let's use Node to fake it.

## Input
The parse.js application receives various arguments in an object literal.  The most critical option is *source*, a string type, of the code to parse.  The lexers receive a single string argument.

## Output
There will be a single format for output that will be uniform for all operations.  The output will be an object storing 7 arrays.
 
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

### Output arrays
#### begin
The *begin* array stores a number representing the index where the parent structure starts.  In markup language this value would represent the index for the parent element.  In style based langauges it would store the index where the parent block opens.  In script based langauges it would store the index where the current structure opens whether that structure is a block, parenthesis, array, or something else.

Regardless of the language or lexer used the values supplied in this array allow walking of the code's structure from any local point to the global/root location.

#### lexer
The *lexer* array indicates which parsed the given record. This data is helpful working with documents that require multiple lexers, such as HTML with embedded JavaScript or CSS. It is particularly helpful when working with JSX and TSX as these documents can interchange between the markup and script lexers recursively.

#### lines
The *lines* array stores a white space value.  A value of 0 means no white space preceeds the current token.  Any white space preceeding the token has a minimum value of 1 and the value increments for each instance of a new line character.  This is necessary because white space has meaning in markup, and so it must be accounted for even if doesn't contain new line characters.

**To be extra clear:**

* 0 - not preceeded by any white space
* 1 - preceeded by white space that does not contain a new line character
* 2 - preceeded by white space containing a single new line character
* 3 - preceeded by white space containing two new line characters, which looks like a single empty line

#### presv
The *presv* array stores a boolean indicating if the current item should be preserved from any kind of manipulation in the beautifier.  Some examples of a preserved item would be a markup comment, certain templating tags, or a tag with the attribute *data-parse-preserve*.  Script and style code items always receive a value of false in this array.

#### stack
The *stack* array stores strings that describe the current structure where the item resides from the code.  In markup code the value is the tag name for the parent element at the index in the *begin* array.  In script and style code the value is a generic description of the current structure, such as: function, object, or class.

#### token
The *token* array contains a string of the current item.  Markup attributes will be a separate token immediately following their parent element and also explicitly indicated via the *begin* and *stack* data fields.

#### types
The *types* array contains a string that describes the token value according to a generalized category name.

## Things to be aware of
This section will list intentional exceptions to the basic rules and parsing behavior.

* Markup elements with the attribute named *data-parse-ignore* will be processed into a string and their corresponding types value will be *singleton*.  This prevents the element from alteration due to beautifiers and it includes are descendant artifacts within the element.  For backwards compatibility the attribute name *data-prettydiff-ignore* will continue to be accepted and will be the only mention of a beautifier in the parser logic.

## FAQ

### Why a table instead of a tree like other parsers?
Arrays are faster to access at execution time potentially allowing consumers to write much faster applications.  Arrays are also simple to reason about and manipulate both directly in the code and at execution time.

### Why is this so much slower than Esprima or Acorn?
Esprima and Acorn support a more narror set of features and languages.  While this allows those other parsers to execute faster it pushes a great deal of work down the line to consuming applications.

### Why is the code so big?
This parser supports many various dialects and languages.  For example, instead of just parsing for Handlebars tags inside HTML this parser will parse the entire code of handlebars tags and HTML tags in a single parse operation.  The parser supports this diversity of grammars in a way that can be easily scaled to allow more precise rules or support for additional grammars.

### Why not just use Babel.js?
Babel.js is a transpiler that contains a parser.  The primary mission of the Babel project isn't to be a parser, but rather to take the latest and greatest features of JavaScript and produce output that can be used today.  This parser doesn't transpile as it is just a parser.  That means this parser is capable of supporting a greater number of features and language dialects with far less maintenance effort.  As an example, an earlier form of this parser introduced support for TypeScript a year before Babel with far less code and effort.  In short, this parser scales faster and wider than Babel by doing less.