# Sparser - Project Files

## File and Directory List
This just a quick description of the project organization from a file system view.

* **demo** - A directory containing the CSS, HTML, and JavaScript for the demo tool that works in a web browser.
* **docs-markdown** - A directory containing all the non-lexer specific documentation in markdown format.
* **docs-html** - A directory containing HTML documentation automatically generated from the equivalent markdown files.
* **lexers** - A directory containing every lexer file and the supporting documentation, in markdown format, for those lexers.
* **libs** - A directory containing supporting libraries.
   - **language** - A tool comprised of many regular expression rules to autodetect languages from looking at a code sample string.
   - **options** - A big data object contain the options definitions.  All options related support, configuration, and documentation is dynamically built from the object in this file.
* **parse.ts** - The heart of the application.  This file contains the externally exposed object and all internally defined conventions and data structures.
* **services.ts** - Provides the Node.js support and build task.
* **test** - A directory containing test code samples and supporting libraries used only for testing.
   - **diffview.ts** - A file for comparing strings and code samples to determine where differences are when a test fails.
   - **samples_code** - A directory containing code samples.
   - **samples_parsed** - A directory containing a known good parse output for each of the respective test samples in the *samples_code* directory.
   - **simulations.ts** - A file contain various test commands to ensure healthy support for all the Node features defined in the *services.ts* file.