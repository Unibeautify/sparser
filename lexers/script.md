# Lexer - script

## x tokens
When option *correct* is true missing syntax characters are inserted, which can include: curly braces, semicolons, and parenthesis.  When *correct* is set to false the characters are still inserted, but artificially so as *X* tokens.  These helps reason about code structure and normalize certain syntax ambiguities.  These tokens are recognizable as they start with a lowercase *x* as in `x;` for an inserted semicolon.

**x tokens should be removed by the consuming application or converted to regular syntax by removing the x character.**

## types values
* **comment** - Describes both block comments (`/*`) and line comments (`//`)
* **end** - Describes `}`, `]`, and `)`.
* **generic** - Java and C# styled type generics as used in TypeScript
* **operator** - JavaScript operators and other syntax characters not otherwise described here.
* **number** - Numbers.
* **property** - A named reference of an object.
* **reference** - A word token type that is declared in the code sample.
* **regex** - Regular expressions. Described as delimited by `/` characters but not in such a way that the first character could suggestion a division operator.
* **separator** - Describes `,`, `.`, and `;`.
* **string** - Strings, which includes JavaScript template strings.
* **start** - Describes `{`, `[`,  and `(`.
* **template** - Describes syntax groups that comprise a known foreign language, often a template language, and is otherwise illegal syntax in JavaScript.
* **template_else** - A template type that is used as the *else* block of a condition.
* **template_end** - A terminal token of a template body.
* **template_start** - A start token of a template body.
* **template_string_end** - A template string that terminates with `${`.
* **template_string_else** - A template string that starts with `}` and terminates with `${`.
* **template_string_start** - A template string that starts with `}`.
* **type** - A TypeScript data type declaration.
* **type_end** - Closing out a TypeScript data type.
* **type_start** - A starting structure of TypeScript data types.
* **word** - A collection of characters that comprise a JavaScript keyword or reference not explicitly declared in the code sample.  This parser is less strict than a JavaScript compiler in that it does not, at this time, trap certain extended UTF8 control characters that aren't valid in identifiers.

## stack values
The stack values are identified by either a known categorical term that describes a common structure or by a keyword that immediately describes the current block.

### Keyword based stack values
* **catch**
* **class**
* **do**
* **else**
* **finally**
* **for**
* **function**
* **if**
* **switch**
* **try**
* **while**

### Structure based stack values
* **arguments** - Function arguments at a functions declaration point. Delimited by parenthesis.
* **array** - Array, but it could also describe array notation structures referencing properties of object literals.
* **attribute** - CSharp styled data attributes
* **block** - A block not associated with a language keyword, as in a stand alone structure to provide independent block scope that cannot be referenced.
* **data_type** - A TypeScript data type structure, for example: `let x:[string, number] = 0;`
* **expression** - The logic that makes decisions, such as the logic part between an `if` keyword and its block.
* **initializer** - Execution of containment around a reference called with `new` to invoke poly-instantiation.
* **map** - A data structure that is similar to an object literal, but different.
* **method** - Function arguments at the function's reference. Delimited by parenthesis.
* **notation** - A TSX data structure.  TSX is TypeScript adapted to the syntax of JSX.
* **object** - A regular object literal.
* **paren** - Describes parenthesis groupings when other parenthesis based descriptions don't apply.  Most typically found as a grouping mechanism in statements and expressions.

## Escaping code from the parser
The parser is capable of selectively ignoring blocks of code.  This occurs when a comment is present starting with `parse-ignore-start` until a later comment is encountered starting with `parse-ignore-end`.  It does not matter whether the comments are line comments or a block comments.

Example:

```javascript
if (b[a] === "\n") {
    /* parse-ignore-start */
    if (options.lang === "apacheVelocity" && lex[0] === "#") {
        a = a - 1;
        break;
    }
    /* parse-ignore-end */
    parse.lineNumber = parse.lineNumber + 1;
}
```

Code from the opening comment to the closing comment is parsed as a single token of types value *ignore*.

<!-- Everything below this line is dynamically generated! -->

## supported languages
* [Flow](https://flow.org/)
* [JavaScript / ECMAScript](https://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf)
* [JSON](https://json.org/)
* [QML](https://doc.qt.io/qt-5/qmlfirststeps.html)
* [React JSX](https://reactjs.org/docs/introducing-jsx.html)
* [styled-components](https://www.styled-components.com/)
* [styled-jsx](https://github.com/zeit/styled-jsx#readme)
* [TSS (Titanium Style Sheets)](https://docs.appcelerator.com/platform/latest/#!/api/Titanium.UI.TextField)
* [TSX](https://www.typescriptlang.org/docs/handbook/jsx.html)
* [TypeScript](https://www.typescriptlang.org/)

## script options
* **end_comma**: Whether terminal commas in objects and arrays should be added or eliminated.
   - type: string
   - default: none
   - values:
      * *always*: Adds terminal commas if they are missing.
      * *never*: Removes terminal commas if they are present.
      * *none*: Ignores this option.
* **object_sort**: Where style properties should be sorted by type and then alphabetically and whether script object properties should be sorted alphabetically.
   - type: boolean
   - default: false
* **quote_convert**: If quote characters should be converted from single quotes to double quotes or the opposite. This option does take into account escaped quote characters.
   - type: string
   - default: none
   - values:
      * *double*: Converts single quote characters to double quote characters.
      * *none*: Ignores this option.
      * *single*: Converts double quote characters to single quote characters.
* **variable_list**: Whether consecutive variable declarations should be separate statements or a comma separated list. Use of this option respects the different types of declarations: var, const, let.
   - type: string
   - default: none
   - values:
      * *each*: Separates variable declarations into separate statements.
      * *list*: Combines consecutive variable declaration statements into a single comma separated list.
      * *none*: Ignores this option.