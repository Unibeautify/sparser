# Parse Framework

New repository.  Not much to see yet.

## Initial Plan

1. Extract the 3 parsers from Pretty Diff
2. Combine the parsers into a single function.
    a. The lexer rules will of course remain separate, as child functions, and change as little as possible.
    b. Resources will be shared for less overhead.
    c. Validate that recursively passing code between lexers, such as with JSX, while using shared resources doesn't break parsing.
3. Provide unit tests.  Pretty Diff has unit tests for beautification and not strictly for parsing.  Beautification requires parsing code, evaluating that code, and then reformatting the code so lower-level tests weren't written.  This means new tests will have to be written.
4. Evaluate options.  This will start with the Pretty Diff options used in parsing for the Pretty Diff project.
5. Add in Pretty Diff's language detection feature.

## Second Stage

Once initial working code is achieved there will be three functional areas open to evaluation:

* architecture - how the pieces come together internally
* options - define all the rules and preferences
* lexers - the heartbeat that produces the parsed output

These areas will be best served through documentation and experimental prototypes.  The primary considerations for success will be smallest code (after linting) and fastest execution.

## Other considerations

* formal documentation - This will describe the API, the architecture, and summarize what the framework does and how to test it.
* validation build - This can include all manners of different things.  It should include a lint step and unit test execution.  The unit tests must evaluate the positive and negative conditions associated with each option value.  The unit tests should be numerous and diverse enough for each enhancement as to reduce regression in production and a rough guess at performance, which means some code samples should be very large and sloppy.