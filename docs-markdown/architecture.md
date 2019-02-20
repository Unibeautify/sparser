# Sparser - Architecture

## Two Objects
Sparser is arranged as two objects.  An externally exposed object named **sparser** and an internally available object named **parse**.  The *sparser* parent object provides the interface to the application while the *parse* provides a tiny framework.

## Commonly Used Data Structures
* data - An object containing arrays used as the primary parser output.
* record - An object representing a single index of the *data* type.

### data Example
    {begin: [], ender: [], lexer: [], lines: [], stack: [], token: [], types: []}

### record Example
    {begin: -1, ender: -1, lexer: "markup", lines: 0, stack: "global", token: "<!doctype html>", types: "SGML"}

## The Externally Available object - sparser
### sparser keys
* **lexers** - *object* - An object containing each lexer file.
* **libs** - *object* - An object containing the utilities stored in the *libs* directory.
* **options** - *object* - An object containing all the configuration settings.  Please see the [options documentation](options.md).
* **parse** - *object* - The internal data settings and control methods.
* **parser** - *function* - **The function that performs the parsing.**
* **parseerror** - *string* - The default value is an empty string.  If this value changes something has gone wrong, or the input is defective.
* **version** - *object* - An object containing two properties. The *data* property is a string indicating last git commit date and the *number* property is the current application version number.

The sparser object is defined in the *parse.ts* file.  It is available to Node from the *js/parse.js* file using `global.sparser` or to Windows in the *js/browser.js* file using `window.sparser`.  Those files are actually identical except for two externally facing references.

## The Internally Facing object - sparser.parse
### parse keys
* **concat** - *function* - Concats various data structures of type *data*.  Use this only as a last resort, because it is slow. This method takes the following two arguments:
   1. *data* - An object of type *data*.
   1. *array* - A second object also of type *data*.
* **count** - *number* - Stores the last index number of the last populated token.  There is never a need to check the length of the primary data arrays, because this value always available as `parse.count`.
* **data** - *data* - Contains the primary data arrays.  For more information please see the [technical documentation](tech-documentation.md#universal-parse-model).
* **datanames** - *string[]* - Contains the array names of the arrays comprising the data object.  This is present to provided as a convenience to avoid use of `Object.keys(sparse.parse.data)`.
* **lineNumber** - *number* - The current line number of the input source string.  This is helpful to populate the `sparser.parseerror` with specific information about where the error in the source string is detected.
* **linesSpace** - *number* - The white space preeceding the current token.  Use this value to populate the current token's `lines` array value and is computed by the `parse.spacer` method.
* **object_sort** - *function* - Provides object sorting for the *style* and *script* lexers if their *object_sort* options are set to true.  The sort is multidimensional.  The *markup* lexer uses different internal functionality for its *tag_sort* option.  This method takes only 1 argument of type *data*.
* **pop** - *function* - Similar to JavaScript's `Array.prototype.pop` method, but works on *data* typed data structures and returns the last record.  This method takes only 1 argument of type *data*.
* **push** - *function* - Similar to JavaScript's `Array.prototype.push` method, but works on *data* typed data structures and populates the *ender* data value and `parse.structure`.  This method takes the following three arguments.
   1. *data* - An object of type *data* that you wish to increase.
   1. *record* - An object of type *record* that you wish to add to the end of the specified data.
   1. *structure* A string that describes the *stack* name of the current start type.  Tokens of other types do not use this argument.
* **references** - *string[][]* - An array of string arrays used for storing variables according to the structure where they are declared.  This allows the *script* lexer to tell the difference between keyword and reference values when describing the *types* of a token.  HTML and XML are lexically scoped as well, but they don't need this added bit of assistance because the scoping in markup languages is inherent to the language's tag structure.
* **safeSort** - *function* - Currently JavaScript's `Array.prototype.sort` is not stable cross browser. This function solves for that inconsistency and is multidimensional.  This method takes the following three arguments:
   1. *array* - Any type of array to sort.
   1. *operation* - A string value of: *ascend*, *descend*, or *normal*.  The value *normal* will normalize an array by removing duplicate values.
   1. *recursive* - A boolean determine if the current array should be sorted only or if sort should be multidimensional.
* **sortCorrection** - *function* - The object_sort function destroys the integrity of the *begin* and *ender* data values.  This function provides the necessary correction and takes two arguments:
   1. *start* - A number of which index to start the correction.
   1. *end* - A number of which index to end the correction.
* **spacer** - *function* - Skips over consecutive white space tokens and updates `parse.linesSpace`.  This function takes an object in the following format:
   - **array** - *string[]* - An array of single characters.  The source sample input string split into an array.
   - **end** - *number* - The length of the specified character array.
   - **index** - *number* - The current index of the specified character array.
* **splice** - *function* - Similar to JavaScript's `Array.prototype.splice` method, but works on *data* typed data structures.  The splice method takes an object in this format:
   - **data** - *data* - Any object of data type *data*.
   - **howmany** - *number* - How many indexes to remove. A value of 0 is acceptable if you wish to insert a record.
   - **index** - *number* - Which index to start from.
   - **record** - *record* - Data in record format to insert.  This item is optional.
* **structure** - *[[string, number]]* - Temporary storage to describe the current stack and begin values for the current structure of tokens.
* **wrapCommentBlock** - *function* - Parses block comments in *markup*, *script*, and *style* lexers.  This function also accounts for [parse-ignore-start](tech-documentation.md#ignore-code) and word wrapping.  This method takes object as an argument in the following definition:
   * **chars** - *string[]* - The character array of the source input from the lexer.
   * **end** - *number* - The length of the specififed character array.
   * **lexer** - *string* - The name of the current lexer.
   * **opening** - *string* - The opening sequence of the current comment, for example: `<!--` or `/*`.  The markup lexer supports many different comment types.
   * **start** - *number* - The current index of the specified character array.
   * **terminator** - *string* - The termination sequence for the given comment, for example: `-->` or `*/`.
* **wrapCommentLine** - *function* - Parses line comments in *script* and *style* lexers.  It also word wraps and accounts for ignored blocks of code.  This method takes the exact same object format as the *wrapCommentBlock* method.
