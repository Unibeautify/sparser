# Sparser - https://sparser.io

[![Greenkeeper badge](https://badges.greenkeeper.io/Unibeautify/sparser.svg)](https://greenkeeper.io/)

## License
Creative Commons Zero v1.0 Universal (cc0-1.0)

## Version 1.4.12
Play around with this application [in your browser](https://sparser/demo/).

## Contents
1. [Overview](#overview)
1. [Technical Documentation](#technical-documentation)
1. [Build](#build)
   1. [Dependencies](#dependencies)
   1. [Get the Code](#get-the-code)
   1. [TypeScript Build](#typescript-build)
   1. [Validation Build](#validation-build)
1. [Contributing](#contributing)
1. [FAQ](#faq)

## Overview
A simplified uniform parser tree capable of describing every programming language. This provides two immediate benefits:
1. All languages are described using an identical data structure.
2. An entire file can be described in a single parse tree even if comprised of various different languages.

### Standard Format
I call the standard output format the **[Universal Parse Model](docs-markdown/tech-documentation.md#universal-parse-model)**.  It is a simple means to describe any structured programming language.

Before diving into this application it might help to have a quick background in [what parsers are and their related terminology](docs-markdown/parsers.md).

### Technical Documentation
Please review the [technical documentation](docs-markdown/tech-documentation.md) to learn how to execute, embed, format input, and interpret output.

## Supported Languages
A list of supplied lexers and their various dedicated language support as indicated through use of logic with *options.language*. Other languages may be supported without dedicated logic.

* **markdown**
   - [markdown](https://spec.commonmark.org/)
* **markup**
   - [Apache Velocity](https://velocity.apache.org/)
   - [ASP Inline Expression](https://support.microsoft.com/en-us/help/976112/introduction-to-asp-net-inline-expressions-in-the-net-framework)
   - [CFML (ColdFusion Markup Language)](https://www.adobe.com/products/coldfusion-family.html)
   - [Django Inline HTML](https://docs.djangoproject.com/en/2.1/topics/forms/)
   - [Dust.js](https://www.dustjs.com/)
   - [EEX Elixir Templates](https://hexdocs.pm/eex/EEx.html)
   - [EJS (Embedded JavaScript) Templates](https://www.ejs.co/)
   - [ERB (Embedded Ruby)](https://ruby-doc.org/stdlib-1.9.3/libdoc/erb/rdoc/ERB.html)
   - [FreeMarker](https://freemarker.apache.org/)
   - [Genshi](https://genshi.edgewall.org/)
   - [Handlebars](https://handlebarsjs.com/)
   - [HTL (HTML Templating Language)](https://helpx.adobe.com/experience-manager/htl/using/getting-started.html)
   - [HTML](https://www.w3.org/TR/html52/)
   - [Jekyll](https://jekyllrb.com/docs/liquid/)
   - [Jinja](http://jinja.pocoo.org/)
   - [JSTL (Java Standard Tag Library)](https://github.com/eclipse-ee4j/jstl-api)
   - [Liquid](https://shopify.github.io/liquid/)
   - [Mustache](https://mustache.github.io/)
   - [Nunjucks](https://mozilla.github.io/nunjucks/)
   - [SGML](https://www.iso.org/standard/16387.html)
   - [SilverStripe](https://docs.silverstripe.org/en/4/developer_guides/templates/syntax/)
   - [Spacebars templates](http://blazejs.org/guide/spacebars.html)
   - [ThymeLeaf](https://www.thymeleaf.org/doc/tutorials/3.0/usingthymeleaf.html)
   - [Underscore Templates (TPL)](https://underscorejs.org/#template)
   - [Twig](https://twig.symfony.com/)
   - [Vapor Leaf](https://docs.vapor.codes/3.0/leaf/overview/)
   - [Vash](https://github.com/kirbysayshi/vash)
   - [Volt](https://phalcon-php-framework-documentation.readthedocs.io/en/latest/reference/volt.html)
   - [XML](https://www.w3.org/TR/REC-xml/)
   - [XSLT](https://www.w3.org/standards/xml/transformation)
* **script**
   - [Flow](https://flow.org/)
   - [JavaScript / ECMAScript](https://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf)
   - [JSON](https://json.org/)
   - [QML](https://doc.qt.io/qt-5/qmlfirststeps.html)
   - [React JSX](https://reactjs.org/docs/introducing-jsx.html)
   - [styled-components](https://www.styled-components.com/)
   - [styled-jsx](https://github.com/zeit/styled-jsx#readme)
   - [TSS (Titanium Style Sheets)](https://docs.appcelerator.com/platform/latest/#!/api/Titanium.UI.TextField)
   - [TSX](https://www.typescriptlang.org/docs/handbook/jsx.html)
   - [TypeScript](https://www.typescriptlang.org/)
* **style**
   - [CSS](https://www.w3.org/Style/CSS/#news)
   - [LESS](http://lesscss.org/)
   - [PostCSS](https://postcss.org/)
   - [SCSS (Sass)](https://sass-lang.com/)

*45 total languages.*

## Build
### Dependencies
This application is written in TypeScript, which requires NodeJS and a global installation of TypeScript.  The optional validation build also requires ESLint.  First, let's install these:

```bash
npm install -g typescript
npm install -g eslint
```

### Get the Code
Second, we need to get the code.  We can get this directly from Github:

```bash
git clone https://github.com/Unibeautify/sparser.git
cd sparser
```

Or, we can get the code from NPM:

```bash
npm install sparser
cd node_modules/sparser
```

Please note the NPM package contains both the TypeScript and the built JavaScript files, so it is ready to execute immediately without any additional build or compile step.

### TypeScript Build
Finally, we need to run the TypeScript build to convert the code from TypeScript to JavaScript:

```bash
tsc --pretty
node js/services build
```

### Tests
If you wish to run the test suite:

```bash
node js/services test
```

Or simply:

```bash
npm test
```
