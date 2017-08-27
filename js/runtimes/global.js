/* creates a browser global reference similar to Node's global */
/*eslint no-unused-vars:0*/
const global = {
    parseFramework: {
        language  : function framework_language() {
            "use strict";
            return;
        },
        lexer     : {},
        parse     : {},
        parseerror: "",
        parser    : function framework_parser() {
            "use strict";
            return;
        }
    }
};