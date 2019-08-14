# Lexer - markup

## types values
* **attribute** - A tag attribute from a regular *start* or *singular* tag type.
* **cdata** - An XML/SGML CDATA block.  Typically used to allow extraneous string content in an XML document that might otherwise break the XML syntax rules.
* **cdata_end** - When a CDATA segment terminates an enclosed grammar parsed with a different lexer.
* **cdata_start** - When a CDATA segment starts an enclosed grammar parsed with a different lexer.
* **comment** - Comment in XML or supporting template syntax.
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
* **template_attribute** - A tag attribute that conveys instructions to a template pre-parser opposed to meta data describing the markup tag.
* **template_else** - A template tag acting as the else block of a condition.
* **template_end** - A closing template tag associated with a prior template\_start tag type.
* **template_start** - A template tag that contains content or other tags not associated with the template language and expects a closing tag.
* **xml** - XML pragmas.  Typically used to declare the document for an XML interpreter, but otherwise not widely used.

## stack values
The markup lexer uses tag names, even if the tag is a template tag, as the stack values.

<!-- Everything below this line is dynamically generated! -->

## supported languages
* [Apache Velocity](https://velocity.apache.org/)
* [ASP Inline Expression](https://support.microsoft.com/en-us/help/976112/introduction-to-asp-net-inline-expressions-in-the-net-framework)
* [CFML (ColdFusion Markup Language)](https://www.adobe.com/products/coldfusion-family.html)
* [Django Inline HTML](https://docs.djangoproject.com/en/2.1/topics/forms/)
* [Dust.js](https://www.dustjs.com/)
* [EEX Elixir Templates](https://hexdocs.pm/eex/EEx.html)
* [EJS (Embedded JavaScript) Templates](https://www.ejs.co/)
* [ERB (Embedded Ruby)](https://ruby-doc.org/stdlib-1.9.3/libdoc/erb/rdoc/ERB.html)
* [FreeMarker](https://freemarker.apache.org/)
* [Genshi](https://genshi.edgewall.org/)
* [Handlebars](https://handlebarsjs.com/)
* [HTL (HTML Templating Language)](https://helpx.adobe.com/experience-manager/htl/using/getting-started.html)
* [HTML](https://www.w3.org/TR/html52/)
* [Jekyll](https://jekyllrb.com/docs/liquid/)
* [Jinja](http://jinja.pocoo.org/)
* [JSTL (Java Standard Tag Library)](https://github.com/eclipse-ee4j/jstl-api)
* [Liquid](https://shopify.github.io/liquid/)
* [Mustache](https://mustache.github.io/)
* [Nunjucks](https://mozilla.github.io/nunjucks/)
* [SGML](https://www.iso.org/standard/16387.html)
* [SilverStripe](https://docs.silverstripe.org/en/4/developer_guides/templates/syntax/)
* [Spacebars templates](http://blazejs.org/guide/spacebars.html)
* [ThymeLeaf](https://www.thymeleaf.org/doc/tutorials/3.0/usingthymeleaf.html)
* [Underscore Templates (TPL)](https://underscorejs.org/#template)
* [Twig](https://twig.symfony.com/)
* [Vapor Leaf](https://docs.vapor.codes/3.0/leaf/overview/)
* [Vash](https://github.com/kirbysayshi/vash)
* [Volt](https://phalcon-php-framework-documentation.readthedocs.io/en/latest/reference/volt.html)
* [XML](https://www.w3.org/TR/REC-xml/)
* [XSLT](https://www.w3.org/standards/xml/transformation)

## markup options
* **attribute_sort**: Alphanumerically sort markup attributes. Sorting is ignored if a given tag contains an attribute with instructions for a different language such as a template scheme, child markup tag, or start of a code structure.
   - type: boolean
   - default: false
* **attribute_sort_list**: A comma separated list of attribute names. Attributes will be sorted according to this list and then alphanumerically. This option requires 'attribute_sort' have a value of true.
   - type: string
   - default: 
* **parse_space**: Whether white space should be parsed as content tokens.
   - type: boolean
   - default: false
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