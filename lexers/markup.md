# Lexer - markup

## types values
* **attribute** - A tag attribute from a regular *start* or *singular* tag type.
* **cdata** - An XML/SGML CDATA block.  Typically used to allow extraneous string content in an XML document that might otherwise break the XML syntax rules.
* **comment** - An XML comment.
* **conditional** - Comments used in IE to hack references to CSS by IE version.  Follows a SGML square brace convention.
* **content** - Regular text nodes, but white space is removed from the front and end of the node as an approximate value is accounted for in the *lines* data field.
* **content_preserve** - Allows parsing of an element but identifies the element as preserved so that its *presv* value is *true*.
* **end** - An end tag of a tag pair.
* **ignore** - These types are used to excuse a structure from deeper evaluation and treats the element as a singleton even if it is part of tag pair and contains descendant nodes.
* **jsx_attribute_end** - The end of an curly brace delimited escape, stated as a tag attribute, that allows JavaScript inside the markup tag of a JSX markup element.
* **jsx_attribute_end** - The start of an curly brace delimited escape, stated as a tag attribute, that allows JavaScript inside the markup tag of a JSX markup element.
* **script** - A tag indicating it may contain contents that need to be passed to the *script* lexer.
* **sgml** - SGML type notations, which can be deeply nested using square brace notation.
* **singleton** - A self-closing tag.
* **start** - A start tag of a tag pair.
* **style** - A tag indicating it may contain contents that need to be passed to the style lexer.
* **template** - A tag delimited by a known convention of an external template language.
* **template_else** - A template tag acting as the else block of a condition.
* **template_end** - A closing template tag associated with a prior template\_start tag type.
* **template_start** - A template tag that contains content or other tags not associated with the template language and expects a closing tag.
* **xml** - XML pragmas.  Typically used to declare the document for an XML interpreter, but otherwise not widely used.

## stack values
The markup lexer uses tag names, even if the tag is a template tag, as the stack values.

## markup options
* **tagMerge** - Merges start and end tag pairs, if these tags are adjacent or separated only by white space, into a single singleton tag.
* **tagSort** - Sorts tags by tag name alphabetically amongst siblings under the same parent.