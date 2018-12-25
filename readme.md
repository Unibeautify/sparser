# Parse Framework

[![Greenkeeper badge](https://badges.greenkeeper.io/Unibeautify/parse-framework.svg)](https://greenkeeper.io/)

## Version 2.4.7
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

## Standard Format
I call the standard output format the **[Universal Parse Model](docs/tech-documentation.md#universal-parse-model)**.  It is a simple means to describe any structured programming language.

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
git clone https://github.com/Unibeautify/parse-framework.git
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
node js/services build
```

### Validation Build
If you wish to run the optional validation build it can be run this way:

```bash
node js/services validation
```

Or simply:

```bash
npm test
```

## Contributing
Contributing is simple and this project needs lots of help.  Here are some suggestions to get you started:

* If contributing code ensure that you provide a healthy serving of unit test code samples and pass the validation build.  I am not emotionally tied to code style concerns.  I tried to add as many of my preferred code style opinions to the ESLint validation rules, so as long as contributing code passes the validation build and includes enough coverage from unit test samples I will accept it.
* If you wish to contribute new language support or write a new lexer file please see the [lexer readme](lexers/readme.md) to get started.
* QA and user acceptance is always a huge concern.  If you notice a defect please open a [github issue](https://github.com/Unibeautify/parse-framework/issues/new).  I cannot be aware of all user concerns or edge cases and so feedback from users is absolutely critical to building a quality application.

## FAQ

### Why a table instead of a tree like other parsers?
Arrays are faster to access at execution time potentially allowing consumers to write much faster applications.  Arrays are also simple to reason about and manipulate both directly in the code and at execution time.

Most importantly, though, is this allows a simplified standard format that is easy to maintain, document, and consume.  If you don't like the lexers provided in the framework then write your own and submit a pull request.

### How fast does it parse JavaScript?
Try it yourself:

1. get the [jQuery Mobile 1.4.2](code.jquery.com/mobile/1.4.2/jquery.mobile-1.4.2.min.js) file and save it to your local file system.
1. Run the performance tool: `node js/services performance ../jquery.mobile-1.4.2.min.js`
1. Compare the results against other parsers on the [Esprima Comparison page](esprima.org/test/compare.html).

I find this application generally performs half as fast as the fastest JavaScript parser, Esprima, but makes up for it with wider language support and extensible tooling.

### Why is the code so big?
This parser supports many various dialects and languages.  For example, instead of just parsing for Handlebars tags inside HTML this parser will parse the entire code of handlebars tags and HTML tags in a single parse operation.  The parser supports this diversity of grammars in a way that can be easily scaled to allow more precise rules or support for additional grammars.

### Why not just use Babel.js, Esprima, Acorn, or one of the various other parsers written in JavaScript?
Babel.js is a transpiler that contains a parser.  The primary mission of the Babel project isn't to be a parser, but rather to take the latest and greatest features of JavaScript and produce output that can be used today.  The mission of this project it to parse every language for every environment, which is more than the JavaScript, JSX, and TypeScript supported by Babel.js and other parsers.  This parser doesn't transpile as it is just a parser.  That means this parser is capable of supporting a greater number of features and language dialects with far less maintenance effort due to a narrowed focus.  As an example, an earlier form of this parser introduced support for TypeScript a year before Babel with far less code and effort, because this project stops at being a parser.  In short, this parser scales faster and wider than many other parsers by doing less and providing an open framework.