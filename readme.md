# Parse Framework

## Version 1.1.0
Play around with this application [in your browser](http://prettydiff.com/parse-framework/runtimes/browsertest.xhtml).

### Todo
* add advanced analytics and reporting of parse errors

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
A parser that is the framework.  The idea is to parse any and all languages into a normalized format that can be interpreted and consumed by anything. **A universal parser of everything for everybody.** The parser/framework comprises a simplified data format and a couple of methods in an object.  The language specific rules are stored in separate files called *lexers* that operate in accordance to the standard format using the standard methods.

Before diving into this application it might help to have a quick background in [what parsers are and their related terminology](docs/parsers.md).

## Technical Documentation
Please review the [technical documentation](docs/tech-documentation.md) to learn how to execute, embed, format input, and interpret output.

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
git clone git@github.com:Unibeautify/parse-framework.git
cd parse-framework
```

Or, we can get the code from NPM:

```bash
npm install parse-framework
cd node_modules/parse-framework
```

### TypeScript Build
Finally, we need to run the TypeScript build to convert the code from TypeScript to JavaScript:

```bash
tsc
```

### Validation Build
If you wish to run the optional validation build it can be run this way:

```bash
node js/test/validate.js
```

Or simply:

```bash
npm test
```

## Contributing
Contributing is simple and this project needs lots of help.  Here are some suggestions to get you started:

* If contributing code ensure that you provide a healthy serving of unit test code samples and pass the validation build.  I am not emotionally tied to code style concerns.  I tried to add as many of my preferred code style opinions to the ESLint validation rules, so as long as contributing code passes the validation build and includes enough coverage from unit test samples I will accept it.
* If you wish to contribute new language support or write a new lexer file please see the [lexer readme](lexers/readme.md) to get started.
* QA and user acceptance is always a huge concern.  If you notice a defect please open a [github issue](github.com/Unibeautify/parse-framework/issues/).  I cannot be aware of all user concerns or edge cases and so feedback from users is absolutely critical to building a quality application.

## FAQ

### Why a table instead of a tree like other parsers?
Arrays are faster to access at execution time potentially allowing consumers to write much faster applications.  Arrays are also simple to reason about and manipulate both directly in the code and at execution time.

Most importantly, though, is this allows a simplified standard format that is easy to maintain, document, and consume.  If you don't like the lexers provided in the framework then write your own and submit a pull request.

### How fast does it parse JavaScript?
#### Methodology
I ran this application against [jQuery Mobile 1.4.2 minified](http://code.jquery.com/mobile/1.4.2/jquery.mobile-1.4.2.min.js) and analyzed the execution time using the performance profiler in the browser's developer tools to isolate application timing apart from any time associated with DOM interaction or page paint.  I also ran the [Esprima Speed Comparison page](http://esprima.org/test/compare.html) in the same browser.

#### Results (all results in milliseconds)
* Firefox 54.0.1 (64 bit), Windows 10 (1703) with 64gb ram and Xeon E5-1660 3.3GHz
   - parse-framework - 144.0
   - Esprima - 142.0 ±9.0%
   - Acorn - 175.9 ±14.9%
* Opera 46.0.2597.57, Mac OSX 10.12.5 with 16gb ram and Intel i7 2.9GHz
   - parse-framework - 97.8
   - Esprima - 76.6 ±9.8%
   - Acorn - 83.5 ±7.8%
* Chrome 60.0.3112.101, Mac OSX 10.12.5 with 16gb ram and Intel i7 2.9GHz
   - parse-framework - 248.6
   - Esprima - 66.0 ±8.8%
   - Acorn - 73.5 ±7.2%
* Safari 10.1.1, Mac OSX 10.12.5 with 16gb ram and Intel i7 2.9GHz
   - parse-framework - 290.1
   - Esprima - 37.9 ±3.0%
   - Acorn - 3403 ±0.7%

#### Conclusions
* Performance is neutral in Firefox and Opera where it does not appear there is optimization by convention.
* Chrome is known for providing numerous micro-optimizations and parse-framework is not making as aggressive use of those. A minor penalty is noted for creating objects as temporary storage containers for dynamic population and for performing automatic semicolon insertion logic.
* Safari provides brutal penalties to the Array *pop* method, which is critical to parse-framework. The standard pop method appears to be a vanity method over the Array *splice* method in the compiler. Take note of the wide performance differences between Esprima and Acorn in Safari.

### Why is the code so big?
This parser supports many various dialects and languages.  For example, instead of just parsing for Handlebars tags inside HTML this parser will parse the entire code of handlebars tags and HTML tags in a single parse operation.  The parser supports this diversity of grammars in a way that can be easily scaled to allow more precise rules or support for additional grammars.

### Why not just use Babel.js, Esprima, Acorn, or one of the various other parsers written in JavaScript?
Babel.js is a transpiler that contains a parser.  The primary mission of the Babel project isn't to be a parser, but rather to take the latest and greatest features of JavaScript and produce output that can be used today.  The mission of this project it to parse every language for every environment, which is more than the JavaScript, JSX, and TypeScript supported by Babel.js and other parsers.  This parser doesn't transpile as it is just a parser.  That means this parser is capable of supporting a greater number of features and language dialects with far less maintenance effort due to a narrowed focus.  As an example, an earlier form of this parser introduced support for TypeScript a year before Babel with far less code and effort, because this project stops at being a parser.  In short, this parser scales faster and wider than many other parsers by doing less and providing an open framework.