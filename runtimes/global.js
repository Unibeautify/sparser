/* creates a browser global reference similar to Node's global */
const global = {
    parseFramework: {
        language  : function () {
            "use strict";
            return;
        },
        lexer     : {},
        parse     : {},
        parseerror: "",
        parser    : function () {
            "use strict";
            return;
        }
    }
};