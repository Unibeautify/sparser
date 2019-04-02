# Lexer - style

## types values
* **colon** - Describes a `:` character. This types value exists to uniquely set colon characters apart from other types values.
* **comment** - Describes standard CSS block comments as well as line comments that exist in languages like LESS and SCSS.
* **end** - Describes the characters `}` and `)` if the parenthesis closes a structure described as *map*.
* **function** - Describes a name followed by a single set of parenthesis which is followed by either a semicolon or closing curly brace.
* **item** - This is an internally used value that should not be exposed outside the lexer unless the lexer receives an incomplete code sample.
* **selector** - Describes a CSS selector.
* **semi** - Describes a `;` character. This types value exists to uniquely set semicolon characters apart from other types values.
* **start** -  Describes `{` and `(` if the parenthesis is part of a map structure.
* **template** - Describes a token comprising an external template language that is not of start or end types.
* **template_else** - Various template languages commonly offer conditions with else branches.  Else tokens do not behave the same way as a templates start or end types.
* **template_end** - Describes the opening sequence for a third party language template tag.
* **template_start** - Describes the closing sequence for a third party language template tag.
* **value** - Describes CSS property values, which is generally anything that follows a colon, even if not a known property, but does not immediately precede some sort of structure opening.
* **variable** - Languages like LESS and SCSS allow defining and referencing from variables.

## stack values
The style lexer takes the identifier, typically a selector, preceding the start types value of the current stack as the value.

## Escaping code from the parser
The parser is capable of selectively ignoring blocks of code.  This occurs when a comment is present starting with `parse-ignore-start` until a later comment is encountered starting with `parse-ignore-end`.  It does not matter whether the comments are JavaScript-like line comments or standard block comments.

Example:

```css
a {
    color: red;
}

/* parse-ignore-start */
div {
    background: blue;
}
/* parse-ignore-end */

td {
    text-align: right;
}
```

Code from the opening comment to the closing comment is parsed as a single token of types value *ignore*.

<!-- Everything below this line is dynamically generated! -->

## supported languages
* [CSS](https://www.w3.org/Style/CSS/#news)
* [LESS](http://lesscss.org/)
* [PostCSS](https://postcss.org/)
* [SCSS (Sass)](https://sass-lang.com/)

## style options
* **no_lead_zero**: Whether the zero to the left of the decimal point should be removed from numbers between 0 and 1.
   - type: boolean
   - default: false
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