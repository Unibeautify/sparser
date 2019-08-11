# Sparser - Options
## Conventions
Options with a lexer value of *all* are assigned directly to the options object, such as `options.format`. All other options are assigned to an object named after the respective lexer under the `lexer_options` object, example: `options.lexer_options.style.no_lead_zero`.

All option names are lowercase complete English words.  An option name comprising multiple words contains a single underscore between each word, example: `end_comma`.

The options object is directly available from the *sparser* object. This means the options are centrally stored and externally available.  Here is an example in the browser, `window.sparser.options`.  The means to externally adjust options are by assigning directly to that object, such as `window.sparser.options.format = "objects"`.

## Option List

### attribute_sort
property   | value
-----------|---
default    | false
definition | Alphanumerically sort markup attributes. Sorting is ignored if a given tag contains an attribute with instructions for a different language such as a template scheme, child markup tag, or start of a code structure.
label      | Sort Attributes
lexer      | markup
type       | boolean
use        | options.lexer_options.**markup**.attribute_sort

### attribute_sort_list
property   | value
-----------|---
default    | 
definition | A comma separated list of attribute names. Attributes will be sorted according to this list and then alphanumerically. This option requires 'attribute_sort' have a value of true.
label      | Sort Attribute List
lexer      | markup
type       | string
use        | options.lexer_options.**markup**.attribute_sort_list

### correct
property   | value
-----------|---
default    | false
definition | Automatically correct sloppiness in code. If false missing syntax will be included starting with 'x', such as 'x;' for missing simicolons.
label      | Correct
lexer      | all
type       | boolean
use        | options.correct

### crlf
property   | value
-----------|---
default    | false
definition | If line termination should be crlf (Windows) otherwise line termination is lf (Unix).
label      | CRLF
lexer      | all
type       | boolean
use        | options.crlf

### end_comma
property   | value
-----------|---
default    | none
definition | Whether terminal commas in objects and arrays should be added or eliminated.
label      | End Comma
lexer      | script
type       | string
use        | options.lexer_options.**script**.end_comma
values     | always, never, none

#### Value Definitions
* **always** - Adds terminal commas if they are missing.
* **never** - Removes terminal commas if they are present.
* **none** - Ignores this option.

### format
property   | value
-----------|---
default    | arrays
definition | Defines the output format of the parser.
label      | Output Format
lexer      | all
type       | string
use        | options.format
values     | arrays, csv, markdown, minimal, objects

#### Value Definitions
* **arrays** - The output format is an object of arrays such that the same index of all the arrays represents one data record, for example: `{begin:[],ender:[],lexer:[],lines[],stack:[],token:[],types:[]}`.
* **csv** - The output format is comma separated value format.
* **markdown** - Generates the output in a markdown table.
* **minimal** - The output format is an array of arrays which is structurally similar to the objects format but without key names, for example: `[[-1,-1,"script",0,"global","const","word"]]`.
* **objects** - The output format is an array of objects such that each array index is one data record, for example: `[{begin:-1,ender:-1,lexer:"script",lines:0,stack:"global",token:"const",types:"word"}]`.

### language
property   | value
-----------|---
default    | auto
definition | The language to parse.  The value auto will result in language auto detection.
label      | Language
lexer      | all
type       | string
use        | options.language

### lexer
property   | value
-----------|---
default    | auto
definition | The lexer used to perform the parsing.  The value auto will result in language auto detection.
label      | Lexer
lexer      | all
type       | string
use        | options.lexer

### no_lead_zero
property   | value
-----------|---
default    | false
definition | Whether the zero to the left of the decimal point should be removed from numbers between 0 and 1.
label      | No Lead Zero
lexer      | style
type       | boolean
use        | options.lexer_options.**style**.no_lead_zero

### object_sort
property   | value
-----------|---
default    | false
definition | Where style properties should be sorted by type and then alphabetically and whether script object properties should be sorted alphabetically.
label      | Object Sort
lexer      | script, style
type       | boolean
use        | options.lexer_options.**script**.object_sort, options.lexer_options.**style**.object_sort

### parse_space
property   | value
-----------|---
default    | false
definition | Whether white space should be parsed as content tokens.
label      | Parse Markup White Space
lexer      | markup
type       | boolean
use        | options.lexer_options.**markup**.parse_space

### preserve_comment
property   | value
-----------|---
default    | false
definition | Whether comments should be ignored from manipulation, such as word wrap.
label      | Preserve Comment
lexer      | all
type       | boolean
use        | options.preserve_comment

### preserve_text
property   | value
-----------|---
default    | false
definition | Whether text content should be preserved from manipulation, such as word wrap.
label      | Preserve Text
lexer      | markup
type       | boolean
use        | options.lexer_options.**markup**.preserve_text

### quote_convert
property   | value
-----------|---
default    | none
definition | If quote characters should be converted from single quotes to double quotes or the opposite. This option does take into account escaped quote characters.
label      | Quote Convert
lexer      | markup, script, style
type       | string
use        | options.lexer_options.**markup**.quote_convert, options.lexer_options.**script**.quote_convert, options.lexer_options.**style**.quote_convert
values     | double, none, single

#### Value Definitions
* **double** - Converts single quote characters to double quote characters.
* **none** - Ignores this option.
* **single** - Converts double quote characters to single quote characters.

### source
property   | value
-----------|---
default    | 
definition | The source code to parse.
label      | Source
lexer      | all
type       | string
use        | options.source

### tag_merge
property   | value
-----------|---
default    | false
definition | If adjacent start and end tags in markup should be merged into one singleton tag.
label      | Tag Merge
lexer      | markup
type       | boolean
use        | options.lexer_options.**markup**.tag_merge

### tag_sort
property   | value
-----------|---
default    | false
definition | Whether markup tags should be alphabetically sorted amonst their siblings.
label      | Tag Sort
lexer      | markup
type       | boolean
use        | options.lexer_options.**markup**.tag_sort

### unformatted
property   | value
-----------|---
default    | false
definition | If tags in markup code should be preserved from any manner of alteration.
label      | Tag Unformatted
lexer      | markup
type       | boolean
use        | options.lexer_options.**markup**.unformatted

### variable_list
property   | value
-----------|---
default    | none
definition | Whether consecutive variable declarations should be separate statements or a comma separated list. Use of this option respects the different types of declarations: var, const, let.
label      | Variable List
lexer      | script
type       | string
use        | options.lexer_options.**script**.variable_list
values     | each, list, none

#### Value Definitions
* **each** - Separates variable declarations into separate statements.
* **list** - Combines consecutive variable declaration statements into a single comma separated list.
* **none** - Ignores this option.

### wrap
property   | value
-----------|---
default    | 0
definition | The character distance in which to apply word wrap. A value of less than 1 eliminates word wrap.
label      | Wrap
lexer      | all
type       | number
use        | options.wrap