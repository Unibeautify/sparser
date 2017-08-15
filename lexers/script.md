# Lexer - script
A lexer for JavaScript and other syntax related languages.

## types values
* **comment** - Describes both block comments (`/*`) and line comments (`//`)
* **end** - Describes `}`, `]`, and `)`.
* **generic** - Java and C# styled type generics as used in TypeScript
* **operator** - JavaScript operators and other syntax characters not otherwise described here.
* **number** - Numbers.
* **regex** - Regular expressions. Described as delimited by `/` characters but not in such a way that the first character could suggestion a division operator.
* **separator** - Describes `,`, `.`, and `;`.
* **string** - Strings, which includes JavaScript template strings.
* **start** - Describes `{`, `[`,  and `(`.
* **template** - Describes syntax groups that comprise a known foreign language, often a template language, and is otherwise illegal syntax in JavaScript.
* **template_else** - A template type that is used as the *else* block of a condition.
* **template_end** - A terminal token of a template body.
* **template_start** - A start token of a template body.
* **word** - A collection of characters that comprise a JavaScript reference name or keyword.  This parser is less strict than a JavaScript compiler in that it does not, at this time, trap certain extended UTF8 control characters that aren't valid in identifiers.

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