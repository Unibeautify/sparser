# Lexer - markup

## types values
* **attribute** - A tag attribute from a regular *start* or *singular* tag type.
* **cdata** - An XML/SGML CDATA block.  Typically used to allow extraneous string content in an XML document that might otherwise break the XML syntax rules.
* **cdata_end** - When a CDATA segment terminates an enclosed grammar parsed with a different lexer.
* **cdata_start** - When a CDATA segment starts an enclosed grammar parsed with a different lexer.
* **comment** - An XML comment.
* **comment_attribute** - JSX allows JavaScript style comments as tag attributes.
* **conditional** - Comments used in IE to hack references to CSS by IE version.  Follows a SGML square brace convention.
* **content** - Regular text nodes, but white space is removed from the front and end of the node as an approximate value is accounted for in the *lines* data field.
* **content_preserve** - A content type that lets consuming applications this token must not be modified.
* **end** - An end tag of a tag pair.
* **ignore** - These types are used to excuse a structure from deeper evaluation and treats the element as a singleton even if it is part of tag pair and contains descendant nodes.
* **jsx_attribute_end** - The end of an curly brace delimited escape, stated as a tag attribute, that allows JavaScript inside the markup tag of a JSX markup element.
* **jsx_attribute_end** - The start of an curly brace delimited escape, stated as a tag attribute, that allows JavaScript inside the markup tag of a JSX markup element.
* **script_start** - A curly brace indicating the contents that need to be passed to the *script* lexer for JSX language.
* **script_end** - A curly brace indicating a script string has concluded.
* **sgml** - SGML type notations, which can be deeply nested using square brace notation.
* **singleton** - A self-closing tag.
* **start** - A start tag of a tag pair.
* **style** - A tag indicating it may contain contents that need to be passed to the style lexer.
* **template** - A tag delimited by a known convention of an external template language.
* **template_attribute** - A tag attribute that conveys instructions to a template preparser opposed to meta data describing the markup tag.
* **template_else** - A template tag acting as the else block of a condition.
* **template_end** - A closing template tag associated with a prior template\_start tag type.
* **template_start** - A template tag that contains content or other tags not associated with the template language and expects a closing tag.
* **xml** - XML pragmas.  Typically used to declare the document for an XML interpreter, but otherwise not widely used.

## stack values
The markup lexer uses tag names, even if the tag is a template tag, as the stack values.

## markup options
* **preserve_text**: Whether text content should be preserved from manipulation, such as word wrap.
   - type: boolean
   - default: false
* **quote_convert**: If quote characters should be converted from single quotes to double quotes or the opposite. This option does take into account escaped quote characters.
   - type: string
   - default: none
   - values:
      * *double*: Converts single quote characters to double quote characters.
      * *none*: Ignores this option.
      * *single*: Converts double quote characters to single quote characters.
* **tag_merge**: If adjacent start and end tags in markup should be merged into one singleton tag.
   - type: boolean
   - default: false
* **tag_sort**: Whether markup tags should be alphabetically sorted amonst their siblings.
   - type: boolean
   - default: false
* **unformatted**: If tags in markup code should be preserved from any manner of alteration.
   - type: boolean
   - default: false