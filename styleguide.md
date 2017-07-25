# Parse Framework - Style Guide

## Formatting conventions
These minor conventions keep things uniform.  They aren't that important because I will occassionally run the code through a beautifier to enforce uniformity.

* Indentation is 4 spaces
* Double quotes is the primary quoting character.  I don't care if secondary quotes (such as those within a string) are escaped double quotes or single quotes.
* Code should wrap between 80 and 120 characters wide.  Wide code is harder to read and generally frustrates everybody, but I am not suggesting changing logic to accomodate this.

## Naming conventions
* References used as loop iterators can be named anything.  I often just use a single letter starting at the beginning of the alphabet.
* Other references should be short (the shorter the better) and yet vaguely describe what the reference is for.  References with a name that is too vague are bad.  References more than 12 characters long are worse.
* Function names are the only thing that follows a formal naming convention.  Every function name must be unique and must be an underscore separated list that describes its scope chain.  This ensures problematic functions can be identified during static analysis.

## Structure
The flow control of code is important.  Sometimes it is more important to know how the pieces of code come together than what those pieces of code do, especially at maintenance time.

* Functions are preferred over classes or prototypes.  Code with classes will generally be rejected unless there is a compelling justification **and** a dramatic reduction in the amount of code.
* Beyond the standard methods this code makes no use of inheritance.  This frees the code from silliness of *this*, *new*, and *Object.create*.
* The methods *bind*, *call*, and *apply* are not used in this application.
* Function nesting is required.  Functions are to be treated as local references no differently than any other reference.
* The only allowed loops are *do*/*while* loops and the array *forEach* method.  Array forEach loops are more convenient but cannot be broken early and provide no control for changing iteration, which is often necessary in large algorithms.
* Avoid repetition.  This rule is not absolute.  There are rare times when minor repetition makes more sense than reorganizing a large application.

## References
I never want to guess where references are declared.  I also never want to wrap my mind around hoisting or the terminal dead zone.  These reference rules will be enforced.

* All reference declarations in a given scope are declared using a comma separated list against a single key word whether var, let, or const.  The only except is that a scope may contain one let and one const keyword.
* Reference declarations must be at the top of the scope.
* References must be declared at the most local scope possible.  The only exception is that references can be declarated in a higher scope where reuse as closure is necessary.
* References must be assigned to a value at declaration time.  This value sets the data type for the reference.  Type recasting is absolutely forbidden.  At this time the application is written in JavaScript, but I plan to migrate the code to TypeScript in conformance to the Unibeautify code project.  If a reference for a desired data type is not present in the local scope then declare a new reference for the given data type.
* References in a lower scope cannot be of the same name as a reference higher in the scope chain.
* Functions are to be declared as assigned to a var/let/const declared reference.
* References must be declared before they are used.
* The code is much cleaner when references aren't reused for different unrelated things.  This isn't an enforced rule though.

## Functions
This code is functional.  Functions are the defining characteristic of organization.  As such this code is partially imperative in that the order and nesting of functions largely determines how the code comes together visually as well as the flow control of the logic.  This code is also partially declarative as many factory like abstractions are present to help the application scale faster at maintenance time while helping to what smaller code fragments are doing.

* Functions must be declared as assigned to a local var/let/const declared reference.
* In addition to a reference name function are required to have a function name.  Function names are used as recursive references without accessing the scope chain and displayed during static analysis.  Anonymous functions will be rejected outright.
* Functions aren't special.  They are references like any other reference and as such can and should be nested as appropriate.  A function (or any other reference) unnecessarily declared in a higher than necessary scope will be cause of rejection.

## Presentation
The visual presentation of code is important for human cognition and behavior.  For many people code is immediately intimidating, but is less so when properly formatted for faster reading.

* Be generous with white space.  A section of code that is not separated by syntax should be separated from adjacent code by empty lines.  An example is a block of code in a condition not tied to previous logic.
* Code structures that are independent from adjacent code structures should be commented.  It is ok to be verbose with comments but please do not use code examples in comments.  If a section of code is so complex that examples are necessary more formal documentation is required.

## Recommendations
These items will help with code navigation.

* Use an editor which folds code well.  Code folding almost instantly removes all intimidation from large code files.
* Any sort of editor extension that helps to identify scope boundaries or walk function hierarchies will absolutely help to make sense of this application's structure.
* Suggestions and contributions are welcome.  If you can make a compelling case about changing this styleguide I will change it.