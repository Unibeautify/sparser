# Sparser - Automation

## List of dynamically written artifacts
This is a brief description of the automation that occurs as a part of the build process.

1. The list of supported languages is stored in the respective lexer markdown documentation.  It is gathered from these locations using the apps.inventory function and injected into the hompage and readme.md files.
1. The options data is stored in the *libs/options.ts* file.  All options availability, support, and documentation is generated using that file.  Such automation includes the *docs-markdown/options.md* file, the demo tool, and the option support by lexer in each of the lexer markdown documents.
1. All other documents in the *docs-markdown* directory are static and manually adjusted files.  The files in the *docs-html* directory are automatically created from the markdown documents.
