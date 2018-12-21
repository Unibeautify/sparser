# Lexer - script
A lexer for JavaScript and other syntax related languages.

## x tokens
When option *correct* is true missing syntax characters are inserted, which can include: curly braces, semicolons, and parenthesis.  When *correct* is set to false the characters are still inserted, but artificially so as *X* tokens.  These helps reason about code structure and normalize certain syntax ambiguities.  These tokens are recognizeable as they start with a lowercase *x* as in `x;` for an inserted semicolon.

**x tokens should be removed by the consuming application or converted to regular syntax by removing the x character.**

## types values
* **comment** - Describes both block comments (`/*`) and line comments (`//`)
* **end** - Describes `}`, `]`, and `)`.
* **generic** - Java and C# styled type generics as used in TypeScript
* **operator** - JavaScript operators and other syntax characters not otherwise described here.
* **number** - Numbers.
* **reference** - A word token type that is declared in the code sample.
* **regex** - Regular expressions. Described as delimited by `/` characters but not in such a way that the first character could suggestion a division operator.
* **separator** - Describes `,`, `.`, and `;`.
* **string** - Strings, which includes JavaScript template strings.
* **start** - Describes `{`, `[`,  and `(`.
* **template** - Describes syntax groups that comprise a known foreign language, often a template language, and is otherwise illegal syntax in JavaScript.
* **template_else** - A template type that is used as the *else* block of a condition.
* **template_end** - A terminal token of a template body.
* **template_start** - A start token of a template body.
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
* **expression** - The logic that makes decisions, such as the logic part between an `if` keyword and its block.
* **initializer** - Execution of containment around a reference called with `new` to invoke polyinstantiation.
* **map** - A data structure that is similar to an object literal, but different.
* **method** - Function arguments at the function's reference. Delimited by parenthesis.
* **notation** - A TSX data structure.  TSX is TypeScript adapted to the syntax of JSX.
* **object** - A regular object literal.
* **paren** - Describes parenthsis groupings when other parenthsis based descriptions don't apply.  Most typically found as a grouping mechanism in statements and expressions.

## script options
* **end_comma** - Values: *none*, *always*, *never*.  Whether an ending comma should be added or removed from objects and arrays.  The *none* value disables this option.
* **objectSort** - Sorts the named properties (keys) of object literals alphabetically.
* **quote_convert** - Values: *none*, *double*, *single*.  Whether quotes should be converted to double quote or single quote characters.  The *none* value disables this option.
* **varword** - Whether variables should be declared as:
   - *list*: a comma separated list
   - *each*: separate declaration statements
   - *none*: or left alone

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

Code from the opening comment to the closing comment is parsed as a single token of types value *ignore* presv value *true*.