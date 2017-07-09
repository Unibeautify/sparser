# Parse Framework

**This is still early.  For status and progress please see the Github issues.**

This is slowly coming together.  The code now runs, but I am asserting this is ready.  There is still a lot I need to validate, document, and provide tests against.

## Overview

The parser will consist of three lexers named: markup, script, and style.  The markup parser will handle all markup related languages.  The script parser will parse all C like languages, but C and C++ are not yet support.  The style parser will parse languages similar to CSS, LESS, and SCSS.

There is no lexer for languages that use white space as a primary syntax mechanism, which means more than just defining comments or inserting semicolons.  As such there is no support for languages like Jade or Sass.

## Input
The input will be a single object of certain defined properties.  I haven't revised this from the Pretty Diff code but it will change drastically.  Please follow issue #3 to keep updated on this progress.

These properties will absolutely exist:

Name   | Data Type | Accepted Values       | Definition
------ | --------- | --------------------- | -----------------
lang   | string    | any                   | the name of the language, some parsing options are language specific
source | string    | any                   | the code to parse
type   | string    | markup, script, style | which lexer to start with

### lang
**optional** - This option allows passing in a specific language name.  There is some language specific logic in the parsers.  Currently these values exist in the parser logic:

* apacheVelocity - https://velocity.apache.org/
* dustjs - http://www.dustjs.com/
* html - https://w3c.github.io/html/
* jsx - https://jsx.github.io/
* qml - http://doc.qt.io/qt-5/qmlapplications.html
* twig - https://twig.sensiolabs.org/
* typescript - http://www.typescriptlang.org/

The default language values, if not specified, are:

* XML if type value is markup
* JavaScript if type value is script
* LESS/SCSS if type value is style

### source
**required** - This is the string that will be parsed.  Any string may be passed in, but the data type must be a string.

### type
**required** - This option tells the parser which lexer to start with.

## Output
There will be a single format for output that will be uniform for all operations.  The output will be an object storing 8 arrays.  Each array represents a specific type of description and, provided one exception in the token array, will contain only 1 data type.

* attrs
* begin
* jscom
* lines
* presv
* stack
* token
* types

Each of these keys will store an array and all these arrays will contain the same number of indexes.  Think of this as a database table such that each array is a column, the name of the array (the object key name) is the column metadata, and finally each index of the arrays is a record in the table.  Here is an example:

Consider the code `<a><b class="cat"></b></a>`.  The parsed output will be:
```
{
    attrs : [
        {}, {
            class: '\'cat\''
        }, {}, {}
    ],
    begin: [
        0, 0, 1, 0
    ],
    jscom: [
        false, false, false, false
    ],
    lines: [
        0, 0, 0, 0
    ],
    presv: [
        false, false, false, false
    ],
    stack: [
        'root', 'a', 'b', 'a'
    ],
    token: [
        '<a>', '<b >', '</b>', '</a>'
    ],
    types: ['start', 'start', 'end', 'end'];
}
```

If that parsed output were arranged as a table it would look something like:

index | attrs          | begin | jscom |  lines | presv | stack  | token  | types
----- | -------------- | ----- | ----- | ------ | ----- | ------ | ------ | -----
0     | {}             | 0     | false | 0      | false | 'root' | '<a>'  | 'start'
1     | {class: 'cat'} | 0     | false | 0      | false | 'a'    | '<b >' | 'start'
2     | {}             | 1     | false | 0      | false | 'b'    | '</b>' | 'end'
3     | {}             | 0     | false | 0      | false | 'a'    | '</a>' | 'end'

### Output arrays
#### attrs
The *attrs* array stores attributes from markup tags.  Every index will contain an object which is empty by default.  This object will only populate with keys if the source code passes through the markup lexer, the given item is either a start tag or a self-closing tag, and if there are attributes stored on the current item.  The key name will be attribute name and its value will be attribute's value stored as a string type.  If an attribute is present without a corresponding value, such as `<input checked>`, the value will match the attribute's name.

#### begin
The *begin* array stores a number representing the index where the parent structure starts.  In markup language this value would represent the index for the parent element.  In style based langauges it would store the index where the parent block opens.  In script based langauges it would store the index where the current structure opens whether that structure is a block, parenthesis, array, or something else.

Regardless of the language or lexer used the values supplied in this array allow walking of the code's structure from any local point to the global/root location.

#### jscom
The *jscom* array stores a boolean indicating whether the current index is a JavaScript comment as markup element's attribute.  JavaScript comments have to be parsed according their delimiters without interference to other markup code qualities.

#### lines
The *lines* array stores the number of empty lines immediately preceeding the current item.  Many developers want the empty lines in their code preserved as the whitespace indicates a visual separation for areas of code.  The values in this array allow beautifiers to know where or up to how many lines should be inserted in the beautified output.

#### presv
The *presv* array stores a boolean indicating if the current item should be preserved from any kind of manipulation in the beautifier.  Some examples of a preserved item would be a markup comment, certain templating tags, or a tag with the attribute *data-parse-preserve*.  Script and style code items always receive a value of false in this array.

#### stack
The *stack* array stores strings that describe the current structure where the item resides from the code.  In markup code the value is the tag name for the parent element at the index in the *begin* array.  In script and style code the value is a generic description of the current structure, such as: function, object, or class.

#### token
The *token* array generally contains a string of the current item.  In cases where a lexer has to hand off to a different lexer the value is a child parse table instead of a string.  One example is style and script tags in HTML documents.  In the case of JSX or TSX langauges the exchange between lexers could be recursive producing a depth of nested parse tables.  **Don't assume the value of a token index will be a string, because every once in a while it will be an array.**

#### types
The *types* array contains a string that describes the token value according to a generalized category name.

## Things to be aware of
This section will list intentional exceptions to the basic rules and parsing behavior.

* Token array values are generally strings, but can be arrays in the cases where one lexer hands off to another.
* Markup elements with the attribute named *data-parse-ignore* will be processed into a string and their corresponding types value will be *singleton*.  This prevents the element from alteration due to beautifiers and it includes are descendant artifacts within the element.  For backwards compatibility the attribute name *data-prettydiff-ignore* will continue to be accepted and will be the only mention of a beautifier in the parser logic.