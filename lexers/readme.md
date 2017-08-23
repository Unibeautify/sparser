
# Lexers
The lexers each represent a classification of programming languages, or syntax grouping.  For instance the markup lexer serves the needs of XML, SGML, and HTML even though these languages have noticable differences.

This documentation describes lexers generally and how they integrate with the Parse Framework.  For details specific to a given lexer file please see that lexer's documentation.  The currently supported lexers are:

* [markup](markup.md) - ColdFusion, Dust.js, EJS, ERB, Go Language Template, Handlebars, HTML, JSTL (JSP), Liquid, SGML, Spacebars Templates, Twig Templates, XML
* [script](script.md) - JavaScript, JSON, JSX, QML, TSX, TypeScript
* [style](style.md) - CSS, LESS, SCSS, TSS

## Writing a New Lexer
This section provides guidance for getting started on a new lexer.

### Restrictions
Conformance to these restrictions ensures compliance with the framework.  This is necessary to allow any supported lexers to reference any other supported lexers without disruption.

* The lexer must ultimately push parsed records into the central `parse.data` object, which is the only allowed output of a lexer file.
* The `parse.data` object can be read directly, but must **only** be modified using the methods available from the `parse` object.  No other means of modification are authorized.
* Checking the length of arrays in `parse.data` is never allowed.  The `parse.count` number always provides one less than the length value, but does so in a way that is much faster at execution time.
* If the lexer encounters something in the code sample that breaks parsing immediately assign a string describing the error to `global.parseerror` and exit the lexer.  For more precise error reporting the line number in the code sample causing the error should be included, which is provided by the framework as `parse.lineNumber`.
* It is preferred to never refer to the `parse.data` arrays by name unless reading from a specific array or assigning to a specific array.  An example use case is creating a new temporary object with all the data array names.  For these other concerns please read the array names from `parse.datanames`.  This helps with maintenance in the rare case where the standard format may change.
* A lexer must be accompanied by documentation in markdown format.
* Unless there is a special exception data records about to be populated into `parse.data` must always look to the last index (most recently populated) for the values of the *begin* and *stack* data fields.

### Name of Lexer
The lexer's name must be a single word all lowercase. This name must be uniform and identical in all cases in both the code and file name operate correctly within the framework.

### Boilerplate
The following code example will help start a new lexer:

```javascript
/*global global*/
(function lexerName_init() {
    "use strict";
    const lexerName = function lexer_lexerName(source) {
        const parse = global.parse,
            data    = parse.data,
            options = parse.options;
    }

    global.lexer.lexerName = lexerName;
}());
```

Simply copy/paste the above code sample and change `lexerName` to the name of the language you are attempting to parse.

## Lexer Specific Options
Lexers may allow options in addition to the standard options provided to Parse Framework.  Such options will be included using this pattern: `options.lexerOptions[lexerName].optionName`.  This is the standard options object available to the lexer as **global.parse.options**, lexerName, refers to the name of the given lexer.