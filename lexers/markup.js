/*global error, global, lexer, location, module, parse, window*/
(function markup_init() {
    "use strict";
    var lexer  = global.lexer,
        markup = function lexer_markup(source) {
            var parse         = global.parse,
                data          = (function lexer_markup_data() {
                    var output = {};
                    parse.datanames.forEach(function lexer_markup_data_datanames(value) {
                        output[value] = [];
                    });
                    return output;
                }()),

                a             = 0,
                b             = source.split(""),
                c             = b.length,
                lengthMarkup  = -1,
                linepreserve  = 0,
                list          = 0,
                litag         = 0,
                sgmlflag      = 0,
                minspace      = "",
                cftransaction = false,
                ext           = false,
                parseError    = [],
                // Find the lowercase tag name of the provided token.
                tagName       = function lexer_markup_markup_tagName(el) {
                    var reg   = (/^(\{((%-?)|\{-?)\s*)/),
                        space = "",
                        name  = "";
                    if (typeof el !== "string") {
                        return "";
                    }
                    space = el
                        .replace(reg, "%")
                        .replace(/\s+/, " ")
                        .indexOf(" ");
                    name  = (space < 0)
                        ? el
                            .replace(reg, " ")
                            .slice(1, el.length - 1)
                        : el
                            .replace(reg, " ")
                            .slice(1, space);
                    if (parse.options.lang === "html") {
                        name = name.toLowerCase();
                    }
                    name = name.replace(/(\}\})$/, "");
                    if (name.indexOf("(") > 0) {
                        name = name.slice(0, name.indexOf("("));
                    }
                    return name;
                },

                //parses tags, attributes, and template elements
                tag           = function lexer_markup_markup_tag(end) {

                    // markup is two smaller lexers that work together: tag - evaluates markup and
                    // template tags content - evaluates text content and code for external lexers
                    //
                    //type definitions:
                    // * start      end     type
                    // * <![CDATA[   ]]>    cdata
                    // * <!--       -->     comment
                    // * <#--       -->     comment
                    // * <%--       --%>    comment
                    // * {!         !}      comment
                    // * <!--[if    -->     conditional
                    // * text       text    content
                    // * </         >       end
                    // * <pre       </pre>  ignore (html only)
                    // * text       text    script
                    // * <!         >       sgml
                    // * <          />      singleton
                    // * <          >       start
                    // * text       text    style
                    // * <!--#      -->     template
                    // * <%         %>      template
                    // * {{{        }}}     template
                    // * {{         }}      template
                    // * {%         %}      template
                    // * [%         %]      template
                    // * {@         @}      template
                    // * {#         #}      template
                    // * {#         /}      template
                    // * {?         /}      template
                    // * {^         /}      template
                    // * {@         /}      template
                    // * {<         /}      template
                    // * {+         /}      template
                    // * {~         }       template
                    // * <?         ?>      template
                    // * {:else}            template_else
                    // * <#else     >       template_else
                    // * {@}else{@}         template_else
                    // * <%}else{%>         template_else
                    // * {{         }}      template_end
                    // * <%\s*}     %>      template_end
                    // * [%\s*}     %]      template_end
                    // * {@\s*}     @}      template_end
                    // * {          }       template_end
                    // * {{#        }}      template_start
                    // * <%         {\s*%>  template_start
                    // * [%         {\s*%]  template_start
                    // * {@         {\s*@}  template_start
                    // * {#         }       template_start
                    // * {?         }       template_start
                    // * {^         }       template_start
                    // * {@         }       template_start
                    // * {<         }       template_start
                    // * {+         }       template_start
                    // * <?xml      ?>      xml

                    var bcount          = 0,
                        e               = 0,
                        f               = 0,
                        igcount         = 0,
                        jsxcount        = 0,
                        braccount       = 0,
                        parncount       = 0,
                        quote           = "",
                        element         = "",
                        lastchar        = "",
                        jsxquote        = "",
                        ltype           = "",
                        tname           = "",
                        jscom           = false,
                        comment         = false,
                        cheat           = false,
                        endtag          = false,
                        nopush          = false,
                        nosort          = false,
                        simple          = false,
                        preserve        = false,
                        stest           = false,
                        ignoreme        = false,
                        quotetest       = false,
                        parseFail       = false,
                        singleton       = false,
                        earlyexit       = false,
                        lex             = [],
                        attribute       = [],
                        attstore        = [],
                        record          = {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markup",
                            lines: parse.linesSpace,
                            presv: false,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "",
                            types: ""
                        },
                        //cftags is a list of supported coldfusion tags
                        // * required - means must have a separate matching end tag
                        // * optional - means the tag could have a separate end tag, but is probably a
                        // singleton
                        // * prohibited - means there is not corresponding end tag
                        cftags          = {
                            "cfabort"               : "prohibited",
                            "cfajaximport"          : "optional",
                            "cfajaxproxy"           : "optional",
                            "cfapplet"              : "prohibited",
                            "cfapplication"         : "prohibited",
                            "cfargument"            : "prohibited",
                            "cfassociate"           : "prohibited",
                            "cfauthenticate"        : "prohibited",
                            "cfbreak"               : "prohibited",
                            "cfcache"               : "optional",
                            "cfcalendar"            : "optional",
                            "cfcase"                : "required",
                            "cfcatch"               : "required",
                            "cfchart"               : "optional",
                            "cfchartdata"           : "prohibited",
                            "cfchartseries"         : "optional",
                            "cfclient"              : "required",
                            "cfclientsettings"      : "optional",
                            "cfcol"                 : "prohibited",
                            "cfcollection"          : "prohibited",
                            "cfcomponent"           : "required",
                            "cfcontent"             : "optional",
                            "cfcontinue"            : "prohibited",
                            "cfcookie"              : "prohibited",
                            "cfdbinfo"              : "prohibited",
                            "cfdefaultcase"         : "required",
                            "cfdirectory"           : "prohibited",
                            "cfdiv"                 : "optional",
                            "cfdocument"            : "optional",
                            "cfdocumentitem"        : "optional",
                            "cfdocumentsection"     : "optional",
                            "cfdump"                : "optional",
                            "cfelse"                : "prohibited",
                            "cfelseif"              : "prohibited",
                            "cferror"               : "prohibited",
                            "cfexchangecalendar"    : "optional",
                            "cfexchangeconnection"  : "optional",
                            "cfexchangecontact"     : "optional",
                            "cfexchangeconversation": "optional",
                            "cfexchangefilter"      : "optional",
                            "cfexchangefolder"      : "optional",
                            "cfexchangemail"        : "optional",
                            "cfexchangetask"        : "optional",
                            "cfexecute"             : "required",
                            "cfexit"                : "prohibited",
                            "cffeed"                : "prohibited",
                            "cffile"                : "optional",
                            "cffileupload"          : "optional",
                            "cffinally"             : "required",
                            "cfflush"               : "prohibited",
                            "cfform"                : "required",
                            "cfformgroup"           : "required",
                            "cfformitem"            : "optional",
                            "cfforward"             : "prohibited",
                            "cfftp"                 : "prohibited",
                            "cffunction"            : "required",
                            "cfgraph"               : "required",
                            "cfgraphdata"           : "prohibited",
                            "cfgrid"                : "required",
                            "cfgridcolumn"          : "optional",
                            "cfgridrow"             : "optional",
                            "cfgridupdate"          : "optional",
                            "cfheader"              : "prohibited",
                            "cfhtmlbody"            : "optional",
                            "cfhtmlhead"            : "optional",
                            "cfhtmltopdf"           : "optional",
                            "cfhtmltopdfitem"       : "optional",
                            "cfhttp"                : "optional",
                            "cfhttpparam"           : "prohibited",
                            "cfif"                  : "required",
                            "cfimage"               : "prohibited",
                            "cfimap"                : "prohibited",
                            "cfimapfilter"          : "optional",
                            "cfimport"              : "prohibited",
                            "cfinclude"             : "prohibited",
                            "cfindex"               : "prohibited",
                            "cfinput"               : "prohibited",
                            "cfinsert"              : "prohibited",
                            "cfinterface"           : "required",
                            "cfinvoke"              : "optional",
                            "cfinvokeargument"      : "prohibited",
                            "cflayout"              : "optional",
                            "cflayoutarea"          : "optional",
                            "cfldap"                : "prohibited",
                            "cflocation"            : "prohibited",
                            "cflock"                : "required",
                            "cflog"                 : "prohibited",
                            "cflogic"               : "required",
                            "cfloginuser"           : "prohibited",
                            "cflogout"              : "prohibited",
                            "cfloop"                : "required",
                            "cfmail"                : "required",
                            "cfmailparam"           : "prohibited",
                            "cfmailpart"            : "required",
                            "cfmap"                 : "optional",
                            "cfmapitem"             : "optional",
                            "cfmediaplayer"         : "optional",
                            "cfmenu"                : "required",
                            "cfmenuitem"            : "optional",
                            "cfmessagebox"          : "optional",
                            "cfmodule"              : "optional",
                            "cfNTauthenticate"      : "optional",
                            "cfoauth"               : "optional",
                            "cfobject"              : "prohibited",
                            "cfobjectcache"         : "prohibited",
                            "cfoutput"              : "required",
                            "cfpageencoding"        : "optional",
                            "cfparam"               : "prohibited",
                            "cfpdf"                 : "optional",
                            "cfpdfform"             : "optional",
                            "cfpdfformparam"        : "optional",
                            "cfpdfparam"            : "prohibited",
                            "cfpdfsubform"          : "required",
                            "cfpod"                 : "optional",
                            "cfpop"                 : "prohibited",
                            "cfpresentation"        : "required",
                            "cfpresentationslide"   : "optional",
                            "cfpresenter"           : "optional",
                            "cfprint"               : "optional",
                            "cfprocessingdirective" : "optional",
                            "cfprocparam"           : "prohibited",
                            "cfprocresult"          : "prohibited",
                            "cfprogressbar"         : "optional",
                            "cfproperty"            : "prohibited",
                            "cfquery"               : "required",
                            "cfqueryparam"          : "prohibited",
                            "cfregistry"            : "prohibited",
                            "cfreport"              : "optional",
                            "cfreportparam"         : "optional",
                            "cfrethrow"             : "prohibited",
                            "cfretry"               : "prohibited",
                            "cfreturn"              : "prohibited",
                            "cfsavecontent"         : "required",
                            "cfschedule"            : "prohibited",
                            "cfscript"              : "required",
                            "cfsearch"              : "prohibited",
                            "cfselect"              : "required",
                            "cfservlet"             : "prohibited",
                            "cfservletparam"        : "prohibited",
                            "cfset"                 : "prohibited",
                            "cfsetting"             : "optional",
                            "cfsharepoint"          : "optional",
                            "cfsilent"              : "required",
                            "cfsleep"               : "prohibited",
                            "cfslider"              : "prohibited",
                            "cfspreadsheet"         : "optional",
                            "cfsprydataset"         : "optional",
                            "cfstatic"              : "required",
                            "cfstopwatch"           : "required",
                            "cfstoredproc"          : "optional",
                            "cfswitch"              : "required",
                            "cftable"               : "required",
                            "cftextarea"            : "optional",
                            "cfthread"              : "optional",
                            "cfthrow"               : "prohibited",
                            "cftimer"               : "required",
                            "cftooltip"             : "required",
                            "cftrace"               : "optional",
                            "cftransaction"         : "required",
                            "cftree"                : "required",
                            "cftreeitem"            : "optional",
                            "cftry"                 : "required",
                            "cfupdate"              : "prohibited",
                            "cfvideo"               : "prohibited",
                            "cfvideoplayer"         : "optional",
                            "cfwddx"                : "prohibited",
                            "cfwebsocket"           : "optional",
                            "cfwhile"               : "required",
                            "cfwindow"              : "optional",
                            "cfx_"                  : "prohibited",
                            "cfxml"                 : "required",
                            "cfzip"                 : "optional",
                            "cfzipparam"            : "prohibited"
                        },
                        //attribute name
                        arname          = function lexer_markup_markup_tag_name(x) {
                            var eq = x.indexOf("=");
                            if (eq > 0 && ((eq < x.indexOf("\"") && x.indexOf("\"") > 0) || (eq < x.indexOf("'") && x.indexOf("'") > 0))) {
                                return x.slice(0, eq);
                            }
                            return x;
                        },

                        //finds slash escape sequences
                        slashy          = function lexer_markup_markup_tag_slashy() {
                            var x = a;
                            do {
                                x = x - 1;
                            } while (b[x] === "\\");
                            x = a - x;
                            if (x % 2 === 1) {
                                return false;
                            }
                            return true;
                        },

                        // attribute lexer
                        attributeLexer  = function lexer_markup_markup_tag_attributeLexer(quotes) {
                            var atty = "",
                                name = "",
                                aa   = 0,
                                bb   = 0;
                            if (quotes === true) {
                                atty = attribute.join("");
                                name = arname(atty);
                                if (name === "data-parse-ignore" || name === "data-prettydiff-ignore") {
                                    ignoreme = true;
                                }
                                quote = "";
                            } else {
                                atty = attribute
                                    .join("")
                                    .replace(/\s+/g, " ");
                                name = arname(atty);
                                if (name === "data-parse-ignore" || name === "data-prettydiff-ignore") {
                                    ignoreme = true;
                                }
                                if (parse.options.lang === "jsx" && attribute[0] === "{" && attribute[attribute.length - 1] === "}") {
                                    jsxcount = 0;
                                }
                            }
                            if (atty.slice(0, 3) === "<%=" || atty.slice(0, 2) === "{%") {
                                nosort = true;
                            }
                            atty      = atty
                                .replace(/^\u0020/, "")
                                .replace(/\u0020$/, "");
                            attribute = atty
                                .replace(/\r\n/g, "\n")
                                .split("\n");
                            bb        = attribute.length;
                            aa        = 0;
                            if (aa < bb) {
                                do {
                                    attribute[aa] = attribute[aa].replace(/(\s+)$/, "");
                                    aa            = aa + 1;
                                } while (aa < bb);
                            }
                            atty = attribute.join(parse.lf);
                            if (atty === "=") {
                                attstore[attstore.length - 1] = attstore[attstore.length - 1] + "=";
                            } else if (atty.charAt(0) === "=" && attstore.length > 0 && attstore[attstore.length - 1].indexOf("=") < 0) {
                                //if an attribute starts with a `=` then adjoin it to the last attribute
                                attstore[attstore.length - 1] = attstore[attstore.length - 1] + atty;
                            } else if (atty.charAt(0) !== "=" && attstore.length > 0 && attstore[attstore.length - 1].indexOf("=") === attstore[attstore.length - 1].length - 1) {
                                // if an attribute follows an attribute ending with `=` then adjoin it to the
                                // last attribute
                                attstore[attstore.length - 1] = attstore[attstore.length - 1] + atty;
                            } else if (atty !== "" && atty !== " ") {
                                attstore.push(atty);
                            }
                            attribute = [];
                        },

                        // attribute parser
                        attributeRecord = function lexer_markup_markup_tag_attributeRecord() {
                            var ind          = 0,
                                len          = attstore.length,
                                eq           = 0,
                                dq           = 0,
                                sq           = 0,
                                syntax       = "<{\"'=/",
                                slice        = "",
                                store        = [],
                                name         = "",
                                cft          = cftags[
                                    tname
                                        .toLowerCase()
                                        .replace(/\/$/, "")
                                ],
                                jsxAttribute = function lexer_markup_markup_tag_attributeRecord_jsxAttribute(str) {
                                    if ((/\s/).test(str) === true) {
                                        record.lines = str
                                            .split("\n")
                                            .length + 1;
                                    } else {
                                        record.lines = 0;
                                    }
                                    return "";
                                };

                            if (attstore.length < 1) {
                                return;
                            }

                            // fix for singleton tags, since "/" at the end of the tag is not an attribute
                            if (attstore[attstore.length - 1] === "/") {
                                attstore.pop();
                                lex.splice(lex.length - 1, 0, "/");
                            }

                            // reconnects attribute names to their respective values if separated on "="
                            eq = attstore.length;
                            dq = 1;
                            if (dq < eq) {
                                do {
                                    name = attstore[dq - 1];
                                    if (name.charAt(name.length - 1) === "=" && attstore[dq].indexOf("=") < 0) {
                                        attstore[dq - 1] = name + attstore[dq];
                                        attstore.splice(dq, 1);
                                        eq = eq - 1;
                                        dq = dq - 1;
                                    }
                                    dq = dq + 1;
                                } while (dq < eq);
                            }

                            // sort the attributes
                            if (parse.options.tagsort === true && jscom === false && parse.options.lang !== "jsx" && nosort === false && tname !== "cfif" && tname !== "cfelseif" && tname !== "cfset") {
                                attstore     = parse.safeSort(attstore);
                                record.presv = true;
                            } else {
                                record.presv = false;
                            }

                            // preparation for a coldfusion edge case
                            if (tname.slice(0, 3).toLowerCase() === "cf_") {
                                cft = "required";
                            }

                            record.begin = parse.recordCount;
                            record.lines = 0;
                            record.stack = tname.replace(/\/$/, "");
                            record.types = "attribute";

                            if (ind < len) {
                                do {
                                    eq = attstore[ind].indexOf("=");
                                    dq = attstore[ind].indexOf("\"");
                                    sq = attstore[ind].indexOf("'");

                                    if (eq > -1 && store.length > 0) {
                                        // put certain attributes together for coldfusion
                                        record.token = store.join(" ");
                                        lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                        record.token = attstore[ind];
                                        lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                        store        = [];
                                    } else if (cft !== undefined && eq < 0 && attstore[ind].indexOf("=") < 0) {
                                        // put certain attributes together for coldfusion
                                        store.push(attstore[ind]);
                                    } else if ((cft !== undefined && eq < 0) || (dq > 0 && dq < eq) || (sq > 0 && sq < eq) || syntax.indexOf(attstore[ind].charAt(0)) > -1) {
                                        // tags stored as attributes of other tags
                                        record.token = attstore[ind];
                                        lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                    } else if (eq < 0 && cft === undefined) {
                                        // in most markup languages an attribute without an expressed value has its name
                                        // as its string value
                                        name = attstore[ind];
                                        if (parse.options.lang === "html") {
                                            name = name.toLowerCase();
                                        }
                                        record.token = name + "=\"" + attstore[ind] + "\"";
                                        lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                    } else {
                                        // separates out the attribute name from its value
                                        slice = attstore[ind].slice(eq + 1);
                                        if (syntax.indexOf(slice.charAt(0)) < 0 && cft === undefined) {
                                            slice = "\"" + slice + "\"";
                                        }
                                        name = attstore[ind].slice(0, eq);
                                        if (parse.options.lang === "html" && cft === undefined) {
                                            name = name.toLowerCase();
                                        }
                                        if (parse.options.lang === "jsx" && (/^(\s*\{)/).test(slice) === true) {
                                            if (ind === 0 && (ltype === "singleton" || ltype === "template")) {
                                                parse.structure.push([
                                                    tagName(element).replace(/\/$/, ""),
                                                    parse.recordCount
                                                ]);
                                            }
                                            record.token = name + "={";
                                            lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                            name         = slice
                                                .replace(/^(\s*\{)/, "")
                                                .replace(/(\}\s*)$/, jsxAttribute);
                                            parse.structure.push(["attribute", parse.recordCount]);
                                            lengthMarkup = parse.recordConcat(data, lexer.script(name));
                                            record.token = "}";
                                            record.begin = record.begin + 1;
                                            lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                            parse.structure.pop();
                                            if (ind === len - 1 && (ltype === "singleton" || ltype === "template")) {
                                                parse.structure.pop();
                                            }
                                        } else {
                                            record.token = name + "=" + slice;
                                            lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                        }
                                    }
                                    ind = ind + 1;
                                } while (ind < len);
                            }
                            if (store.length > 0) {
                                record.token = store.join(" ");
                                lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                            }
                        };
                    ext = false;

                    // this complex series of conditions determines an elements delimiters look to
                    // the types being pushed to quickly reason about the logic no type is pushed
                    // for start tags or singleton tags just yet some types set the `preserve` flag,
                    // which means to preserve internal white space The `nopush` flag is set when
                    // parsed tags are to be ignored and forgotten
                    (function lexer_markup_markup_types() {
                        if (end === "]>") {
                            end      = ">";
                            sgmlflag = sgmlflag - 1;
                            ltype    = "template_end";
                        } else if (end === "---") {
                            preserve = true;
                            ltype    = "comment";
                        } else if (b[a] === "<") {
                            if (b[a + 1] === "/") {
                                if (b[a + 2] === "#") {
                                    ltype = "template_end";
                                } else {
                                    ltype = "end";
                                }
                                end = ">";
                            } else if (b[a + 1] === "!") {
                                if (b[a + 2] === "-" && b[a + 3] === "-") {
                                    if (b[a + 4] === "#") {
                                        end   = "-->";
                                        ltype = "template";
                                    } else if (b[a + 4] === "[" && b[a + 5] === "i" && b[a + 6] === "f" && parse.options.conditional === true) {
                                        end   = "-->";
                                        ltype = "conditional";
                                    } else if (b[a + 4] === "-" && (/<cf[a-z]/i).test(source) === true) {
                                        preserve = true;
                                        comment  = true;
                                        end      = "--->";
                                        ltype    = "comment";
                                    } else {
                                        end = "-->";
                                        if (parse.options.comments === "nocomment") {
                                            nopush  = true;
                                            comment = true;
                                        } else {
                                            if (parse.options.preserveComment === true) {
                                                preserve = true;
                                            }
                                            comment = true;
                                            if (parse.options.commline === true) {
                                                data.lines[lengthMarkup] = 2;
                                            }
                                            ltype = "comment";
                                        }
                                    }
                                } else if (b[a + 2] === "[" && b[a + 3] === "C" && b[a + 4] === "D" && b[a + 5] === "A" && b[a + 6] === "T" && b[a + 7] === "A" && b[a + 8] === "[") {
                                    end      = "]]>";
                                    preserve = true;
                                    comment  = true;
                                    ltype    = "cdata";
                                } else {
                                    end      = ">";
                                    sgmlflag = sgmlflag + 1;
                                    ltype    = "sgml";
                                }
                            } else if (b[a + 1] === "?") {
                                end = "?>";
                                if (b[a + 2] === "x" && b[a + 3] === "m" && b[a + 4] === "l") {
                                    ltype = "xml";
                                } else {
                                    preserve = true;
                                    ltype    = "template";
                                }
                            } else if (b[a + 1] === "%") {
                                if (b[a + 2] !== "=") {
                                    preserve = true;
                                }
                                if (b[a + 2] === "-" && b[a + 3] === "-") {
                                    end     = "--%>";
                                    comment = true;
                                    if (parse.options.commline === true) {
                                        data.lines[lengthMarkup] = 2;
                                    }
                                    ltype = "comment";
                                } else if (b[a + 2] === "#") {
                                    end     = "%>";
                                    comment = true;
                                    if (parse.options.commline === true) {
                                        data.lines[lengthMarkup] = 2;
                                    }
                                    ltype = "comment";
                                } else {
                                    end   = "%>";
                                    ltype = "template";
                                }
                            } else if (b[a + 4] !== undefined && b[a + 1].toLowerCase() === "p" && b[a + 2].toLowerCase() === "r" && b[a + 3].toLowerCase() === "e" && (b[a + 4] === ">" || (/\s/).test(b[a + 4]) === true)) {
                                end      = "</pre>";
                                preserve = true;
                                ltype    = "ignore";
                            } else if (b[a + 4] !== undefined && b[a + 1].toLowerCase() === "x" && b[a + 2].toLowerCase() === "s" && b[a + 3].toLowerCase() === "l" && b[a + 4].toLowerCase() === ":" && b[a + 5].toLowerCase() === "t" && b[a + 6].toLowerCase() === "e" && b[a + 7].toLowerCase() === "x" && b[a + 8].toLowerCase() === "t" && (b[a + 9] === ">" || (/\s/).test(b[a + 9]) === true)) {
                                end      = "</xsl:text>";
                                preserve = true;
                                ltype    = "ignore";
                            } else if (b[a + 8] !== undefined && b[a + 1].toLowerCase() === "c" && b[a + 2].toLowerCase() === "f" && b[a + 3].toLowerCase() === "q" && b[a + 4].toLowerCase() === "u" && b[a + 5].toLowerCase() === "e" && b[a + 6].toLowerCase() === "r" && b[a + 7].toLowerCase() === "y" && (b[a + 8] === ">" || (/\s/).test(b[a + 8]))) {
                                end          = ">";
                                linepreserve = linepreserve + 1;
                                preserve     = true;
                                ltype        = "content_preserve";
                            } else if (b[a + 1] === "<") {
                                if (b[a + 2] === "<") {
                                    end = ">>>";
                                } else {
                                    end = ">>";
                                }
                                ltype = "template";
                            } else if (b[a + 1] === "#") {
                                if (b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e") {
                                    end   = ">";
                                    ltype = "template_else";
                                } else if (b[a + 2] === "-" && b[a + 3] === "-") {
                                    end      = "-->";
                                    ltype    = "comment";
                                    preserve = true;
                                } else {
                                    end   = ">";
                                    ltype = "template_start";
                                }
                            } else {
                                simple = true;
                                end    = ">";
                            }
                        } else if (b[a] === "{") {
                            preserve = true;
                            if (parse.options.lang === "jsx") {
                                ext          = true;
                                earlyexit    = true;
                                record.token = "{";
                                record.types = "script";
                                lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                parse.structure.push(["block", parse.recordCount]);
                                return;
                            }
                            if (parse.options.lang === "dustjs") {
                                if (b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                                    a            = a + 6;
                                    earlyexit    = true;
                                    record.presv = true;
                                    record.token = "{:else}";
                                    record.types = "template_else";
                                    lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                    return;
                                }
                                if (b[a + 1] === "!") {
                                    end     = "!}";
                                    comment = true;
                                    ltype   = "comment";
                                } else if (b[a + 1] === "/") {
                                    end   = "}";
                                    ltype = "template_end";
                                } else if (b[a + 1] === "~") {
                                    end   = "}";
                                    ltype = "singleton";
                                } else if (b[a + 1] === ">") {
                                    end   = "/}";
                                    ltype = "singleton";
                                } else if (b[a + 1] === "#" || b[a + 1] === "?" || b[a + 1] === "^" || b[a + 1] === "@" || b[a + 1] === "<" || b[a + 1] === "+") {
                                    end   = "}";
                                    ltype = "template_start";
                                } else {
                                    end   = "}";
                                    ltype = "template";
                                }
                            } else if (b[a + 1] === "{") {
                                if (b[a + 2] === "{") {
                                    end   = "}}}";
                                    ltype = "template";
                                } else if (b[a + 2] === "#") {
                                    end   = "}}";
                                    ltype = "template_start";
                                } else if (b[a + 2] === "/") {
                                    end   = "}}";
                                    ltype = "template_end";
                                } else if (b[a + 2] === "e" && b[a + 3] === "n" && b[a + 4] === "d") {
                                    end   = "}}";
                                    ltype = "template_end";
                                } else if (b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e") {
                                    end   = "}}";
                                    ltype = "template_else";
                                } else {
                                    end   = "}}";
                                    ltype = "template";
                                }
                            } else if (b[a + 1] === "%") {
                                end   = "%}";
                                ltype = "template";
                            } else if (b[a + 1] === "#") {
                                end      = "#}";
                                ltype    = "comment";
                                preserve = true;
                                comment  = true;
                            } else {
                                end   = b[a + 1] + "}";
                                ltype = "template";
                            }
                            if (b[a + 1] === "@" && b[a + 2] === "}" && b[a + 3] === "e" && b[a + 4] === "l" && b[a + 5] === "s" && b[a + 6] === "e" && b[a + 7] === "{" && b[a + 8] === "@" && b[a + 9] === "}") {
                                a            = a + 9;
                                earlyexit    = true;
                                record.presv = true;
                                record.token = "{@}else{@}";
                                record.types = "template_else";
                                lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                return;
                            }
                        } else if (b[a] === "[" && b[a + 1] === "%") {
                            end   = "%]";
                            ltype = "template";
                        } else if (b[a] === "#" && parse.options.lang === "apacheVelocity") {
                            if (b[a + 1] === "*") {
                                preserve = true;
                                comment  = true;
                                end      = "*#";
                                ltype    = "comment";
                            } else if (b[a + 1] === "[" && b[a + 2] === "[") {
                                preserve = true;
                                comment  = true;
                                end      = "]]#";
                                ltype    = "comment";
                            } else if (b[a + 1] === "#") {
                                preserve = true;
                                comment  = true;
                                end      = "\n";
                                ltype    = "comment";
                            } else if (b[a + 1] === "e" && b[a + 2] === "l" && b[a + 3] === "s" && b[a + 4] === "e" && (/\s/).test(b[a + 5]) === true) {
                                end   = "\n";
                                ltype = "template_else";
                            } else if (b[a + 1] === "i" && b[a + 2] === "f") {
                                end   = "\n";
                                ltype = "template_start";
                            } else if (b[a + 1] === "f" && b[a + 2] === "o" && b[a + 3] === "r" && b[a + 4] === "e" && b[a + 5] === "a" && b[a + 6] === "c" && b[a + 7] === "h") {
                                end   = "\n";
                                ltype = "template_start";
                            } else if (b[a + 1] === "e" && b[a + 2] === "n" && b[a + 3] === "d") {
                                end   = "\n";
                                ltype = "template_end";
                            } else {
                                end   = "\n";
                                ltype = "template";
                            }
                        } else if (b[a] === "$" && parse.options.lang === "apacheVelocity") {
                            end   = "\n";
                            ltype = "template";
                        }
                        if (parse.options.unformatted === true) {
                            preserve = true;
                        }
                    }());
                    if (earlyexit === true) {
                        return;
                    }

                    // This is the real tag lexer. Everything that follows is attribute handling and
                    // edge cases
                    lastchar = end.charAt(end.length - 1);
                    if (a < c) {
                        do {
                            if (b[a] === "\n") {
                                parse.lineNumber = parse.lineNumber + 1;
                            }
                            if (preserve === true || (/\s/).test(b[a]) === false) {
                                lex.push(b[a]);
                            }
                            if (comment === true) {
                                quote = "";
                                //comments must ignore fancy encapsulations and attribute parsing
                                if (b[a] === lastchar && lex.length > end.length + 1) {
                                    //if current character matches the last character of the tag ending sequence
                                    f = lex.length;
                                    e = end.length - 1;
                                    if (e > -1) {
                                        do {
                                            f = f - 1;
                                            if (lex[f] !== end.charAt(e)) {
                                                break;
                                            }
                                            e = e - 1;
                                        } while (e > -1);
                                    }
                                    if (e < 0) {
                                        if (end === "endcomment") {
                                            f = f - 1;
                                            if ((/\s/).test(lex[f]) === true) {
                                                do {
                                                    f = f - 1;
                                                } while ((/\s/).test(lex[f]) === true);
                                            }
                                            if (lex[f - 1] === "{" && lex[f] === "%") {
                                                end      = "%}";
                                                lastchar = "}";
                                            }
                                        } else {
                                            break;
                                        }
                                    }
                                }
                            } else {
                                if (quote === "") {
                                    if (parse.options.lang === "jsx") {
                                        if (b[a] === "{") {
                                            jsxcount = jsxcount + 1;
                                        } else if (b[a] === "}") {
                                            jsxcount = jsxcount - 1;
                                        }
                                    }
                                    if (data.types[lengthMarkup] === "sgml" && b[a] === "[" && lex.length > 4) {
                                        data.types[lengthMarkup] = "template_start";
                                        break;
                                    }
                                    if (b[a] === "<" && preserve === false && lex.length > 1 && end !== ">>" && end !== ">>>" && simple === true) {
                                        parseError.push(
                                            "Parse error on line " + parse.lineNumber + " on element: "
                                        );
                                        parseFail = true;
                                    }
                                    if (stest === true && (/\s/).test(b[a]) === false && b[a] !== lastchar) {
                                        //attribute start
                                        stest   = false;
                                        quote   = jsxquote;
                                        igcount = 0;
                                        lex.pop();
                                        if (a < c) {
                                            do {
                                                if (b[a] === "\n") {
                                                    parse.lineNumber = parse.lineNumber + 1;
                                                }
                                                if (parse.options.unformatted === true) {
                                                    lex.push(b[a]);
                                                }
                                                attribute.push(b[a]);

                                                if ((b[a] === "<" || b[a] === ">") && (quote === "" || quote === ">") && parse.options.lang !== "jsx") {
                                                    if (quote === "" && b[a] === "<") {
                                                        quote     = ">";
                                                        braccount = 1;
                                                    } else if (quote === ">") {
                                                        if (b[a] === "<") {
                                                            braccount = braccount + 1;
                                                        } else if (b[a] === ">") {
                                                            braccount = braccount - 1;
                                                            if (braccount === 0) {
                                                                // the following detects if a coldfusion tag is embedded within another markup
                                                                // tag
                                                                tname = tagName(attribute.join(""));
                                                                if (cftags[tname] === "required") {
                                                                    quote = "</" + tname + ">";
                                                                } else {
                                                                    quote   = "";
                                                                    igcount = 0;
                                                                    attributeLexer(false);
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                    }
                                                } else if (quote === "") {
                                                    if (b[a + 1] === lastchar) {
                                                        //if at end of tag
                                                        if (attribute[attribute.length - 1] === "/") {
                                                            attribute.pop();
                                                            if (preserve === true) {
                                                                lex.pop();
                                                            }
                                                            a = a - 1;
                                                        }
                                                        if (attribute.length > 0) {
                                                            attributeLexer(false);
                                                        }
                                                        break;
                                                    }
                                                    if (b[a] === "{" && b[a - 1] === "=" && parse.options.lang !== "jsx") {
                                                        quote = "}";
                                                    } else if (b[a] === "\"" || b[a] === "'") {
                                                        quote = b[a];
                                                        if (b[a - 1] === "=" && (b[a + 1] === "<" || (b[a + 1] === "{" && b[a + 2] === "%") || (/\s/).test(b[a + 1]) === true)) {
                                                            igcount = a;
                                                        }
                                                    } else if (b[a] === "(") {
                                                        quote     = ")";
                                                        parncount = 1;
                                                    } else if (parse.options.lang === "jsx") {
                                                        //jsx variable attribute
                                                        if ((b[a - 1] === "=" || (/\s/).test(b[a - 1]) === true) && b[a] === "{") {
                                                            quote  = "}";
                                                            bcount = 1;
                                                        } else if (b[a] === "/") {
                                                            //jsx comments
                                                            if (b[a + 1] === "*") {
                                                                quote = "*/";
                                                            } else if (b[a + 1] === "/") {
                                                                quote = "\n";
                                                            }
                                                        }
                                                    } else if (lex[0] !== "{" && b[a] === "{" && (parse.options.lang === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                                        //opening embedded template expression
                                                        if (b[a + 1] === "{") {
                                                            if (b[a + 2] === "{") {
                                                                quote = "}}}";
                                                            } else {
                                                                quote = "}}";
                                                            }
                                                        } else if (parse.options.lang === "dustjs") {
                                                            quote = "}";
                                                        } else {
                                                            quote = b[a + 1] + "}";
                                                        }
                                                    }
                                                    if ((/\s/).test(b[a]) === true && quote === "") {
                                                        // testing for a run of spaces between an attribute's = and a quoted value.
                                                        // Unquoted values separated by space are separate attributes
                                                        if (attribute[attribute.length - 2] === "=") {
                                                            e = a + 1;
                                                            if (e < c) {
                                                                do {
                                                                    if ((/\s/).test(b[e]) === false) {
                                                                        if (b[e] === "\"" || b[e] === "'") {
                                                                            a         = e - 1;
                                                                            quotetest = true;
                                                                            attribute.pop();
                                                                        }
                                                                        break;
                                                                    }
                                                                    e = e + 1;
                                                                } while (e < c);
                                                            }
                                                        }
                                                        if (quotetest === true) {
                                                            quotetest = false;
                                                        } else if (jsxcount === 0 || (jsxcount === 1 && attribute[0] === "{")) {
                                                            //if there is an unquoted space attribute is complete
                                                            attribute.pop();
                                                            attributeLexer(false);
                                                            stest = true;
                                                            break;
                                                        }
                                                    }
                                                } else if (b[a] === "(" && quote === ")") {
                                                    parncount = parncount + 1;
                                                } else if (b[a] === ")" && quote === ")") {
                                                    parncount = parncount - 1;
                                                    if (parncount === 0) {
                                                        quote = "";
                                                        if (b[a + 1] === end.charAt(0)) {
                                                            attributeLexer(false);
                                                            break;
                                                        }
                                                    }
                                                } else if (parse.options.lang === "jsx" && (quote === "}" || (quote === "\n" && b[a] === "\n") || (quote === "*/" && b[a - 1] === "*" && b[a] === "/"))) {
                                                    //jsx attributes
                                                    if (quote === "}") {
                                                        if (b[a] === "{") {
                                                            bcount = bcount + 1;
                                                        } else if (b[a] === quote) {
                                                            bcount = bcount - 1;
                                                            if (bcount === 0) {
                                                                jsxcount = 0;
                                                                quote    = "";
                                                                element  = attribute.join("");
                                                                if (parse.options.unformatted === false) {
                                                                    if (parse.options.lang === "jsx") {
                                                                        if ((/^(\s*)$/).test(element) === false) {
                                                                            attstore.push(element);
                                                                        }
                                                                    } else {
                                                                        element = element.replace(/\s+/g, " ");
                                                                        if (element !== " ") {
                                                                            attstore.push(element);
                                                                        }
                                                                    }
                                                                } else if ((/^(\s+)$/).test(element) === false) {
                                                                    attstore.push(element);
                                                                }
                                                                attribute = [];
                                                                break;
                                                            }
                                                        }
                                                    } else {
                                                        quote    = "";
                                                        jsxquote = "";
                                                        jscom    = true;
                                                        element  = attribute.join("");
                                                        if (element.charAt(1) === "*") {
                                                            element = element + "\n";
                                                        }
                                                        attribute = [];
                                                        if (element !== " ") {
                                                            attstore.push(element);
                                                        }
                                                        break;
                                                    }
                                                } else if (b[a] === "{" && b[a + 1] === "%" && b[igcount - 1] === "=" && (quote === "\"" || quote === "'")) {
                                                    quote   = quote + "{%";
                                                    igcount = 0;
                                                } else if (b[a - 1] === "%" && b[a] === "}" && (quote === "\"{%" || quote === "'{%")) {
                                                    quote   = quote.charAt(0);
                                                    igcount = 0;
                                                } else if (b[a] === "<" && end === ">" && b[igcount - 1] === "=" && (quote === "\"" || quote === "'")) {
                                                    quote   = quote + "<";
                                                    igcount = 0;
                                                } else if (b[a] === ">" && (quote === "\"<" || quote === "'<")) {
                                                    quote   = quote.charAt(0);
                                                    igcount = 0;
                                                } else if (igcount === 0 && quote !== ">" && (quote.length < 2 || (quote.charAt(0) !== "\"" && quote.charAt(0) !== "'"))) {
                                                    //terminate attribute at the conclusion of a quote pair
                                                    f     = 0;
                                                    tname = lex[1] + lex[2];
                                                    tname = tname.toLowerCase();
                                                    // in coldfusion quotes are escaped in a string with double the characters:
                                                    // "cat"" and dog"
                                                    if (tname === "cf" && b[a] === b[a + 1] && (b[a] === "\"" || b[a] === "'")) {
                                                        attribute.push(b[a + 1]);
                                                        a = a + 1;
                                                    } else {
                                                        e = quote.length - 1;
                                                        if (e > -1) {
                                                            do {
                                                                if (b[a - f] !== quote.charAt(e)) {
                                                                    break;
                                                                }
                                                                f = f + 1;
                                                                e = e - 1;
                                                            } while (e > -1);
                                                        }
                                                        if (e < 0) {
                                                            attributeLexer(true);
                                                            if (b[a + 1] === lastchar) {
                                                                break;
                                                            }
                                                        }
                                                    }
                                                } else if (igcount > 0 && (/\s/).test(b[a]) === false) {
                                                    igcount = 0;
                                                }
                                                a = a + 1;
                                            } while (a < c);
                                        }
                                    } else if (end !== "%>" && end !== "\n" && (b[a] === "\"" || b[a] === "'")) {
                                        //opening quote
                                        quote = b[a];
                                    } else if (comment === false && end !== "\n" && b[a] === "<" && b[a + 1] === "!" && b[a + 2] === "-" && b[a + 3] === "-" && b[a + 4] !== "#" && data.types[lengthMarkup] !== "conditional") {
                                        quote = "-->";
                                    } else if (lex[0] !== "{" && end !== "\n" && b[a] === "{" && end !== "%>" && end !== "%]" && (parse.options.lang === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                        //opening embedded template expression
                                        if (b[a + 1] === "{") {
                                            if (b[a + 2] === "{") {
                                                quote = "}}}";
                                            } else {
                                                quote = "}}";
                                            }
                                        } else if (parse.options.lang === "dustjs") {
                                            quote = "}";
                                        } else {
                                            quote = b[a + 1] + "}";
                                        }
                                        if (quote === end) {
                                            quote = "";
                                        }
                                    } else if (simple === true && end !== "\n" && (/\s/).test(b[a]) === true && b[a - 1] !== "<") {
                                        //identify a space in a regular start or singleton tag
                                        stest = true;
                                    } else if (simple === true && parse.options.lang === "jsx" && b[a] === "/" && (b[a + 1] === "*" || b[a + 1] === "/")) {
                                        //jsx comment immediately following tag name
                                        stest               = true;
                                        lex[lex.length - 1] = " ";
                                        attribute.push(b[a]);
                                        if (b[a + 1] === "*") {
                                            jsxquote = "*/";
                                        } else {
                                            jsxquote = "\n";
                                        }
                                    } else if ((b[a] === lastchar || (end === "\n" && b[a + 1] === "<")) && (lex.length > end.length + 1 || lex[0] === "]") && (parse.options.lang !== "jsx" || jsxcount === 0)) {
                                        if (end === "\n") {
                                            if ((/\s/).test(lex[lex.length - 1]) === true) {
                                                do {
                                                    lex.pop();
                                                    a = a - 1;
                                                } while ((/\s/).test(lex[lex.length - 1]) === true);
                                            }
                                            break;
                                        }
                                        if (lex[0] === "{" && lex[1] === "%" && lex.join("").replace(/\s+/g, "") === "{%comment%}") {
                                            end      = "endcomment";
                                            lastchar = "t";
                                            preserve = true;
                                            comment  = true;
                                            ltype    = "comment";
                                        } else {
                                            //if current character matches the last character of the tag ending sequence
                                            f = lex.length;
                                            e = end.length - 1;
                                            if (e > -1) {
                                                do {
                                                    f = f - 1;
                                                    if (lex[f] !== end.charAt(e)) {
                                                        break;
                                                    }
                                                    e = e - 1;
                                                } while (e > -1);
                                            }
                                            if (e < 0) {
                                                break;
                                            }
                                        }
                                    }
                                } else if (b[a] === quote.charAt(quote.length - 1) && ((parse.options.lang === "jsx" && end === "}" && (b[a - 1] !== "\\" || slashy() === false)) || parse.options.lang !== "jsx" || end !== "}")) {
                                    //find the closing quote or embedded template expression
                                    f     = 0;
                                    tname = lex[1] + lex[2];
                                    tname = tname.toLowerCase();
                                    // in coldfusion quotes are escaped in a string with double the characters:
                                    // "cat"" and dog"
                                    if (tname === "cf" && b[a] === b[a + 1] && (b[a] === "\"" || b[a] === "'")) {
                                        attribute.push(b[a + 1]);
                                        a = a + 1;
                                    } else {
                                        e = quote.length - 1;
                                        if (e > -1) {
                                            do {
                                                if (b[a - f] !== quote.charAt(e)) {
                                                    break;
                                                }
                                                f = f + 1;
                                                e = e - 1;
                                            } while (e > -1);
                                        }
                                        if (e < 0) {
                                            quote = "";
                                        }
                                    }
                                }
                            }
                            a = a + 1;
                        } while (a < c);
                    }

                    //nopush flags mean an early exit
                    if (nopush === true) {
                        return;
                    }

                    //a correction to incomplete template tags that use multiple angle braces
                    if (parse.options.correct === true) {
                        if (b[a + 1] === ">" && lex[0] === "<" && lex[1] !== "<") {
                            do {
                                a = a + 1;
                            } while (b[a + 1] === ">");
                        } else if (lex[0] === "<" && lex[1] === "<" && b[a + 1] !== ">" && lex[lex.length - 2] !== ">") {
                            do {
                                lex.splice(1, 1);
                            } while (lex[1] === "<");
                        }
                    }

                    igcount      = 0;
                    element      = lex.join("");
                    record.presv = preserve;
                    record.token = element;
                    record.types = ltype;
                    tname        = tagName(element);
                    if ((/^(\/?cf)/i).test(tname) === true) {
                        tname = tname
                            .toLowerCase()
                            .replace(/\/$/, "")
                            .replace(/^\//, "");
                    }

                    if (preserve === false && parse.options.lang !== "jsx") {
                        element = element.replace(/\s+/g, " ");
                    }

                    //a quick hack to inject records for a type of template comments
                    if (tname === "comment" && element.slice(0, 2) === "{%") {
                        element      = element
                            .replace(/^(\{%\s*comment\s*%\}\s*)/, "")
                            .replace(/(\s*\{%\s*endcomment\s*%\})$/, "");
                        record.token = "{% comment %}";
                        record.types = "template_start";
                        lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                        record.token = element;
                        record.types = "comment";
                        lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                        record.token = "{% endcomment %}";
                        record.types = "template_end";
                        lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                        return;
                    }

                    // a type correction for template tags who have variable start tag names but a
                    // consistent ending tag name
                    if (element.indexOf("{{") === 0 && element.slice(element.length - 2) === "}}") {
                        if (tname === "end") {
                            ltype = "template_end";
                        } else if (tname === "else") {
                            ltype = "template_else";
                        }
                    } else if (element.slice(0, 2) === "<%" && element.slice(element.length - 2) === "%>") {
                        if ((/^(<%\s+end\s+-?%>)$/).test(element) === true) {
                            ltype = "template_end";
                        } else if (((/\sdo\s/).test(element) === true && element.indexOf("-%>") === element.length - 3) || (/^(<%(%|-)?\s*if)/).test(element) === true) {
                            ltype = "template_start";
                        }
                    }

                    //update a flag for subatomic parsing in SGML tags
                    if (end !== "]>" && sgmlflag > 0 && element.charAt(element.length - 1) !== "[" && (element.slice(element.length - 2) === "]>" || (/^(<!((doctype)|(notation))\s)/i).test(element) === true)) {
                        sgmlflag = sgmlflag - 1;
                    }

                    //a correction for false-positive parse failures
                    if (parseFail === true) {
                        if (element.indexOf("<!--<![") === 0) {
                            parseError.pop();
                        } else {
                            parseError[parseError.length - 1] = parseError[parseError.length - 1] +
                                    element;
                            if (element.indexOf("</") > 0) {
                                record.types = "end";
                                lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                parse.structure.pop();
                                return;
                            }
                        }
                    }

                    // cheat identifies HTML singleton elements as singletons even if formatted as
                    // start tags, such as <br> (which is really <br/>)
                    cheat = (function lexer_markup_markup_tag_cheat() {
                        var cfval        = "",
                            d            = 0,
                            ee           = 1,
                            ender        = (/(\/>)$/),
                            htmlsings    = {
                                area       : "singleton",
                                base       : "singleton",
                                basefont   : "singleton",
                                br         : "singleton",
                                col        : "singleton",
                                embed      : "singleton",
                                eventsource: "singleton",
                                frame      : "singleton",
                                hr         : "singleton",
                                img        : "singleton",
                                input      : "singleton",
                                keygen     : "singleton",
                                link       : "singleton",
                                meta       : "singleton",
                                param      : "singleton",
                                progress   : "singleton",
                                source     : "singleton",
                                wbr        : "singleton"
                            },
                            fixsingleton = function lexer_markup_markup_tag_cheat_fixsingleton() {
                                var aa    = lengthMarkup,
                                    bb    = 0,
                                    vname = tname.slice(1);
                                if (aa > -1) {
                                    do {
                                        if (data.types[aa] === "end") {
                                            bb = bb + 1;
                                        } else if (data.types[aa] === "start") {
                                            bb = bb - 1;
                                            if (bb < 0) {
                                                return false;
                                            }
                                        }
                                        if (bb === 0 && data.token[aa].toLowerCase().indexOf(vname) === 1) {
                                            if (cftags[tname] !== undefined) {
                                                data.types[aa] = "template_start";
                                            } else {
                                                data.types[aa] = "start";
                                            }
                                            data.token[aa] = data
                                                .token[aa]
                                                .replace(/(\s*\/>)$/, ">");
                                            return false;
                                        }
                                        aa = aa - 1;
                                    } while (aa > -1);
                                }
                                return false;
                            };
                        if (tname === "/cfquery") {
                            linepreserve = linepreserve - 1;
                        }

                        //determine if the current tag is an HTML singleton and exit
                        if (data.types[lengthMarkup] === "end" && tname.slice(0, 3) !== "/cf") {
                            quote = data.token[lengthMarkup];
                            if (data.types[lengthMarkup - 1] === "singleton" && quote.charAt(quote.length - 2) !== "/" && "/" + tagName(quote) === tname) {
                                data.types[lengthMarkup - 1] = "start";
                            } else if (tname !== "/span" && tname !== "/div" && tname !== "/script" && tname === "/" + tagName(data.token[lengthMarkup]) && parse.options.tagmerge === true(data.types[lengthMarkup - 1] === "start" || htmlsings[tname.slice(1)] === "singleton") && (parse.options.lang !== "html" || (parse.options.lang === "html" && tname !== "/li"))) {
                                lengthMarkup = parse.recordPop(data, true, lengthMarkup).length;
                                if (data.types[lengthMarkup] === "start") {
                                    data.token[lengthMarkup] = data
                                        .token[lengthMarkup]
                                        .replace(/>$/, "/>");
                                }
                                data.types[lengthMarkup] = "singleton";
                                singleton                = true;
                                return false;
                            }
                        }

                        //renames the types value for the following two template tags
                        if (tname === "/#assign" || tname === "/#global") {
                            d = lengthMarkup - 1;
                            if (d > -1) {
                                do {
                                    if (data.types[d] === "start" || data.types[d] === "template_start") {
                                        ee = ee - 1;
                                    } else if (data.types[d] === "end" || data.types[d] === "template_end") {
                                        ee = ee + 1;
                                    }
                                    if (ee === 1) {
                                        if ((data.token[d].indexOf("<#assign") === 0 && tname === "/#assign") || (data.token[d].indexOf("<#global") === 0 && tname === "/#global")) {
                                            data.types[d] = "template_start";
                                            return false;
                                        }
                                    }
                                    if (ee === 0) {
                                        return false;
                                    }
                                    d = d - 1;
                                } while (d > -1);
                            }
                            return false;
                        }

                        //determines if custom coldfusion tags are singletons
                        cfval = cftags[tname];
                        if (data.types[lengthMarkup] === "end" && tname.slice(0, 3) === "/cf" && cfval !== undefined) {
                            if (tname === "/cftransaction") {
                                cftransaction = false;
                            }
                            if (cfval !== undefined) {
                                data.types[lengthMarkup] = "template_end";
                            }
                            if ((cfval === "optional" || cfval === "prohibited") && tname !== "/cftransaction") {
                                return fixsingleton();
                            }
                            return false;
                        }

                        //processes all other coldfusion tags
                        if (tname.slice(0, 2) === "cf") {
                            if (tname === "cfelse" || tname === "cfelseif") {
                                record.token = lex.join("");
                                record.types = "template_else";
                                lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                singleton    = true;
                                return false;
                            }
                            if (tname === "cftransaction" && cftransaction === true) {
                                cfval = "prohibited";
                            } else {
                                cfval = cftags[tname];
                            }
                            if (tname === "cfscript") {
                                ext = true;
                            }
                            if (cfval === "optional" || cfval === "prohibited" || tname.slice(0, 3) === "cf_") {
                                if (parse.options.correct === true && ender.test(element) === false) {
                                    lex.pop();
                                    lex.push("/");
                                    lex.push(">");
                                }
                                record.token = lex
                                    .join("")
                                    .replace(/\s+/, " ");
                                record.types = "template";
                                lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                singleton    = true;
                                return false;
                            }
                            if (cfval === "required" && tname !== "cfquery") {
                                if (tname === "cftransaction" && cftransaction === false) {
                                    cftransaction = true;
                                }
                                record.begin = (parse.structure[parse.structure.length - 1][1] === -1)
                                    ? lengthMarkup
                                    : parse.structure[parse.structure.length - 1][1];
                                record.token = lex.join("");
                                record.types = (ltype === "end")
                                    ? "template_end"
                                    : "template_start";
                                lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                singleton    = true;
                                parse.structure.push([tname, parse.recordCount]);
                            }
                            return false;
                        }

                        if (parse.options.lang === "html") {
                            // html gets tag names in lowercase, if you want to preserve case sensitivity
                            // beautify as XML
                            if (element.charAt(0) === "<" && element.charAt(1) !== "!" && element.charAt(1) !== "?" && (lengthMarkup < 0 || data.types[lengthMarkup].indexOf("template") < 0) && parse.options.lang !== "jsx" && cftags[tname] === undefined && tname.slice(0, 3) !== "cf_") {
                                element = element.toLowerCase();
                            }

                            //looks for HTML "li" tags that have no ending tag, which is valid in HTML
                            if (tname === "li") {
                                if (litag === list && (list !== 0 || (list === 0 && lengthMarkup > -1 && data.types[lengthMarkup].indexOf("template") < 0))) {
                                    d = lengthMarkup;
                                    if (d > -1) {
                                        do {
                                            if (data.types[d] === "start" || data.types[d] === "template_start") {
                                                ee = ee - 1;
                                            } else if (data.types[d] === "end" || data.types[d] === "template_end") {
                                                ee = ee + 1;
                                            }
                                            if (ee === -1 && (tagName(data.token[d]) === "li" || (tagName(data.token[d + 1]) === "li" && (tagName(data.token[d]) === "ul" || tagName(data.token[d]) === "ol")))) {
                                                record.lines                 = data.lines[lengthMarkup];
                                                record.presv                 = false;
                                                record.token                 = "</li>";
                                                record.types                 = "end";
                                                lengthMarkup                 = parse.recordPush(data, record, true, lengthMarkup);
                                                record.lines                 = parse.linesSpace;
                                                record.presv                 = preserve;
                                                record.token                 = element;
                                                record.types                 = ltype;
                                                data.lines[lengthMarkup - 1] = 0;
                                                parse.structure.pop();
                                                break;
                                            }
                                            if (ee < 0) {
                                                break;
                                            }
                                            d = d - 1;
                                        } while (d > -1);
                                    }
                                } else {
                                    litag = litag + 1;
                                }
                            } else if (tname === "/li" && litag === list) {
                                litag = litag - 1;
                            } else if (tname === "ul" || tname === "ol") {
                                list = list + 1;
                            } else if (tname === "/ul" || tname === "/ol") {
                                if (litag === list) {
                                    record.lines                 = data.lines[lengthMarkup];
                                    record.presv                 = false;
                                    record.token                 = "</li>";
                                    record.types                 = "end";
                                    lengthMarkup                 = parse.recordPush(data, record, true, lengthMarkup);
                                    record.lines                 = parse.linesSpace;
                                    record.presv                 = preserve;
                                    record.token                 = element;
                                    record.types                 = ltype;
                                    data.lines[lengthMarkup - 1] = 0;
                                    parse.structure.pop();
                                    litag = litag - 1;
                                }
                                list = list - 1;
                            }

                            //generalized corrections for the handling of singleton tags
                            if (data.types[lengthMarkup] === "end" && htmlsings[tname.slice(1)] === "singleton" && tname !== "/cftransaction") {
                                return fixsingleton();
                            }

                            //inserts a trailing slash into singleton tags if they do not already have it
                            if (htmlsings[tname] === "singleton") {
                                if (parse.options.correct === true && ender.test(element) === false) {
                                    lex.pop();
                                    lex.push(" ");
                                    lex.push("/");
                                    lex.push(">");
                                    element = lex.join("");
                                }
                                return true;
                            }
                        }

                        return false;
                    }());

                    //This escape flag is set in the cheat function
                    if (singleton === true) {
                        attributeRecord();
                        return;
                    }

                    //tags with the following names are singletons
                    if (tname.charAt(0) === "#" && data.types[lengthMarkup] === "start" && (tname === "#assign" || tname === "#break" || tname === "#case" || tname === "#default" || tname === "#fallback" || tname === "#flush" || tname === "#ftl" || tname === "#global" || tname === "#import" || tname === "#include" || tname === "#local" || tname === "#t" || tname === "#lt" || tname === "#rt" || tname === "#nested" || tname === "#nt" || tname === "#recover" || tname === "#recurse" || tname === "#return" || tname === "#sep" || tname === "#setting" || tname === "#stop" || tname === "#visit")) {
                        simple = true;
                    }

                    //correction for dustjs tags to template singleton types
                    if (parse.options.lang === "dustjs" && data.types[lengthMarkup] === "template_start") {
                        quote    = element.charAt(1);
                        jsxquote = element.slice(element.length - 2);
                        if ((jsxquote === "/}" || jsxquote.charAt(0) === quote) && (quote === "#" || quote === "?" || quote === "^" || quote === "@" || quote === "<" || quote === "+")) {
                            data.types[lengthMarkup] = "template";
                        }
                    }

                    // determine if the markup tag potentially contains code interpreted by a
                    // different lexer
                    if ((tname === "script" || tname === "style" || tname === "cfscript") && element.slice(element.length - 2) !== "/>") {

                        //get the attribute value for "type"
                        e = attstore.length - 1;
                        if (e > -1) {
                            do {
                                attribute = arname(attstore[e]);
                                if (attribute[0] === "type") {
                                    quote = attribute[1];
                                    if (quote.charAt(0) === "\"" || quote.charAt(0) === "'") {
                                        quote = quote.slice(1, quote.length - 1);
                                    }
                                    break;
                                }
                                e = e - 1;
                            } while (e > -1);
                        }

                        //ext is flag to send information between the tag lexer and the content lexer
                        if (tname === "script" && (quote === "" || quote === "text/javascript" || quote === "babel" || quote === "module" || quote === "application/javascript" || quote === "application/x-javascript" || quote === "text/ecmascript" || quote === "application/ecmascript" || quote === "text/jsx" || quote === "application/jsx" || quote === "text/cjs")) {
                            ext = true;
                        } else if (tname === "style" && (quote === "" || quote === "text/css")) {
                            ext = true;
                        } else if (tname === "cfscript") {
                            ext = true;
                        }
                        if (ext === true) {
                            e = a + 1;
                            if (e < c) {
                                do {
                                    if ((/\s/).test(b[e]) === false) {
                                        if (b[e] === "<") {
                                            if (b.slice(e + 1, e + 4).join("") === "!--") {
                                                e = e + 4;
                                                if (e < c) {
                                                    do {
                                                        if ((/\s/).test(b[e]) === false) {
                                                            ext = false;
                                                            break;
                                                        }
                                                        if (b[e] === "\n" || b[e] === "\r") {
                                                            break;
                                                        }
                                                        e = e + 1;
                                                    } while (e < c);
                                                }
                                            } else if (b.slice(e + 1, e + 9).join("") === "![CDATA[") {
                                                ext = false;
                                            }
                                        }
                                        break;
                                    }
                                    e = e + 1;
                                } while (e < c);
                            }
                        }
                    }

                    //am I a singleton or a start type?
                    if (simple === true && ignoreme === false) {
                        if (cheat === true || (lex[lex.length - 2] === "/" && lex[lex.length - 1] === ">")) {
                            ltype = "singleton";
                        } else {
                            ltype = "start";
                        }
                        record.types = ltype;
                    }

                    // additional logic is required to find the end of a tag with the attribute
                    // data-parse-ignore
                    if (simple === true && preserve === false && ignoreme === true && end === ">" && element.slice(element.length - 2) !== "/>") {
                        if (cheat === true) {
                            ltype = "singleton";
                        } else {
                            preserve                 = true;
                            data.presv[lengthMarkup] = true;
                            ltype                    = "ignore";
                            a                        = a + 1;
                            quote                    = "";
                            if (a < c) {
                                do {
                                    if (b[a] === "\n") {
                                        parse.lineNumber = parse.lineNumber + 1;
                                    }
                                    lex.push(b[a]);
                                    if (quote === "") {
                                        if (b[a] === "\"") {
                                            quote = "\"";
                                        } else if (b[a] === "'") {
                                            quote = "'";
                                        } else if (lex[0] !== "{" && b[a] === "{" && (parse.options.lang === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                            if (b[a + 1] === "{") {
                                                if (b[a + 2] === "{") {
                                                    quote = "}}}";
                                                } else {
                                                    quote = "}}";
                                                }
                                            } else if (parse.options.lang === "dustjs") {
                                                quote = "}";
                                            } else {
                                                quote = b[a + 1] + "}";
                                            }
                                        } else if (b[a] === "<" && simple === true) {
                                            if (b[a + 1] === "/") {
                                                endtag = true;
                                            } else {
                                                endtag = false;
                                            }
                                        } else if (b[a] === lastchar) {
                                            if (b[a - 1] !== "/") {
                                                if (b[a - 1] !== "/") {
                                                    if (endtag === true) {
                                                        igcount = igcount - 1;
                                                        if (igcount < 0) {
                                                            break;
                                                        }
                                                    } else {
                                                        igcount = igcount + 1;
                                                    }
                                                }
                                            }
                                        }
                                    } else if (b[a] === quote.charAt(quote.length - 1)) {
                                        f = 0;
                                        e = quote.length - 1;
                                        if (e > -1) {
                                            do {
                                                if (b[a - f] !== quote.charAt(e)) {
                                                    break;
                                                }
                                                f = f + 1;
                                                e = e - 1;
                                            } while (e > -1);
                                        }
                                        if (e < 0) {
                                            quote = "";
                                        }
                                    }
                                    a = a + 1;
                                } while (a < c);
                            }
                        }
                        element = lex.join("");
                    }

                    // some template tags can be evaluated as a block start/end based on syntax
                    // alone
                    if (lengthMarkup > -1 && data.types[lengthMarkup].indexOf("template") > -1) {
                        if (element.slice(0, 2) === "{%") {
                            lex = [
                                "autoescape",
                                "block",
                                "capture",
                                "case",
                                "comment",
                                "embed",
                                "filter",
                                "for",
                                "form",
                                "if",
                                "macro",
                                "paginate",
                                "raw",
                                "sandbox",
                                "spaceless",
                                "tablerow",
                                "unless",
                                "verbatim"
                            ];
                            if (tname === "else" || tname === "elseif" || tname === "when" || tname === "elif") {
                                data.types[e] = "template_else";
                            } else {
                                f = lex.length - 1;
                                if (f > -1) {
                                    do {
                                        if (tname === lex[f]) {
                                            data.types[e] = "template_start";
                                            break;
                                        }
                                        if (tname === "end" + lex[f]) {
                                            data.types[e] = "template_end";
                                            break;
                                        }
                                        f = f - 1;
                                    } while (f > -1);
                                }
                            }
                        } else if (element.slice(0, 2) === "{{" && element.charAt(3) !== "{") {
                            if ((/^(\{\{\s*end\s*\}\})$/).test(element) === true) {
                                data.types[e] = "template_end";
                            } else if (tname === "block" || tname === "define" || tname === "form" || tname === "if" || tname === "range" || tname === "with") {
                                if (tname !== "block" || (/\{%\s*\w/).test(source) === false) {
                                    data.types[e] = "template_start";
                                }
                            }
                        } else if (data.types[e] === "template") {
                            if (element.indexOf("else") > 2) {
                                data.types[e] = "template_else";
                            } else if ((/^(<%\s*\})/).test(element) === true || (/^(\[%\s*\})/).test(element) === true || (/^(\{@\s*\})/).test(element) === true) {
                                data.types[e] = "template_end";
                            } else if ((/(\{\s*%>)$/).test(element) === true || (/(\{\s*%\])$/).test(element) === true || (/(\{\s*@\})$/).test(element) === true) {
                                data.types[e] = "template_start";
                            }
                        }
                    }

                    // identify script hidden within a CDATA escape
                    if (ltype === "cdata" && record.stack === "script") {
                        igcount   = parse.recordCount;
                        parncount = lengthMarkup;
                        if (data.types[parncount] === "attribute") {
                            do {
                                igcount   = igcount - 1;
                                parncount = parncount - 1;
                            } while (data.types[parncount] === "attribute" && parncount > -1);
                        }
                        record.begin = igcount;
                        element      = element
                            .replace(/^(\s*<\!\[cdata\[)/i, "")
                            .replace(/(\]\]>\s*)$/, "");
                        record.token = "<![CDATA[";
                        lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                        parse.structure.push(["cdata", parse.recordCount]);
                        lengthMarkup = parse.recordConcat(data, lexer.script(element));
                        record.begin = parse.structure[parse.structure.length - 1][1];
                        record.token = "]]>";
                        lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                        parse.structure.pop();
                    } else {
                        lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                    }

                    // this is necessary to describe the structures that populate the begin and
                    // stack data
                    if (data.types[lengthMarkup] === "start" || data.types[lengthMarkup] === "template_start" || data.types[lengthMarkup] === "content_preserve") {
                        parse.structure.push([tname, parse.recordCount]);
                    } else if ((data.types[lengthMarkup] === "end" || data.types[lengthMarkup] === "template_end") && parse.structure.length > 1) {
                        parse.structure.pop();
                    }

                    attributeRecord();

                    //sorts child elements
                    if (parse.options.tagsort === true && data.types[lengthMarkup] === "end" && data.types[lengthMarkup - 1] !== "start") {
                        (function lexer_markup_markup_tag_sorttag() {
                            var children    = [],
                                bb          = 0,
                                d           = 0,
                                endStore    = 0,
                                startStore  = 0,
                                endData     = {},
                                store       = (function lexer_markup_markup_tag_sorttag_store() {
                                    var output = {};
                                    parse.datanames.forEach(function lexer_markup_markup_tag_sorttag_store_datanames(value) {
                                        output[value] = [];
                                    });
                                    return output;
                                }()),
                                storeRecord = function lexer_markup_markup_tag_sorttag_storeRecord(index) {
                                    var output = {};
                                    parse.datanames.forEach(
                                        function lexer_markup_markup_tag_sorttag_storeRecord_datanames(value) {
                                            output[value] = data[value][index];
                                        }
                                    );
                                    return output;
                                };
                            bb = lengthMarkup - 1;
                            if (bb > -1) {
                                do {
                                    if (data.types[bb] === "start") {
                                        d = d - 1;
                                        if (d < 0) {
                                            startStore = bb + 1;
                                            break;
                                        }
                                    } else if (data.types[bb] === "end") {
                                        d = d + 1;
                                        if (d === 1) {
                                            endStore = bb;
                                        }
                                    }
                                    if (d === 0) {
                                        if (data.types[bb] === "start") {
                                            children.push([bb, endStore]);
                                        } else {
                                            children.push([bb, bb]);
                                        }
                                    }
                                    bb = bb - 1;
                                } while (bb > -1);
                            }
                            if (children.length < 2) {
                                return;
                            }
                            children = parse.safeSort(children);
                            bb       = children.length - 1;
                            if (bb > -1) {
                                do {
                                    parse.recordPush(store, storeRecord(children[bb][0]), false, 0);
                                    if (children[bb][0] !== children[bb][1]) {
                                        d = children[bb][0] + 1;
                                        if (d < children[bb][1]) {
                                            do {
                                                parse.recordPush(store, storeRecord(d), false, 0);
                                                d = d + 1;
                                            } while (d < children[bb][1]);
                                        }
                                        parse.recordPush(store, storeRecord(children[bb][1]), false, 0);
                                    }
                                    bb = bb - 1;
                                } while (bb > -1);
                            }
                            endData = (function lexer_markup_markup_tag_sorttag_endData() {
                                var output = {};
                                parse.datanames.forEach(function lexer_markup_markup_tag_sorttag_endData_datanames(value) {
                                    output[value] = data[value].pop();
                                });
                                return output;
                            }());
                            (function lexer_markup_markup_tag_sorttag_slice() {
                                parse.datanames.forEach(function lexer_markup_markup_tag_sorttag_slice_datanames(value) {
                                    data[value] = data[value].slice(0, startStore);
                                });
                            }());
                            lengthMarkup = parse.recordConcat(data, store);
                            lengthMarkup = parse.recordPush(data, endData, true, lengthMarkup);
                        }());
                    }

                    parse.linesSpace = 0;
                },
                content       = function lexer_markup_markup_content() {
                    var lex       = [],
                        quote     = "",
                        ltoke     = "",
                        jsxbrace  = (data.token[lengthMarkup] === "{"),
                        liner     = parse.linesSpace,
                        now       = a,
                        name      = (ext === true)
                            ? (jsxbrace === true)
                                ? "script"
                                : tagName(data.token[parse.structure[parse.structure.length - 1][1]].toLowerCase())
                            : "",
                        end       = "",
                        square    = (
                            data.types[lengthMarkup] === "template_start" && data.token[lengthMarkup].indexOf("<!") === 0 && data.token[lengthMarkup].indexOf("<![") < 0 && data.token[lengthMarkup].charAt(data.token[lengthMarkup].length - 1) === "["
                        ),
                        external  = {},
                        record    = {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markup",
                            lines: liner,
                            presv: (linepreserve > 0),
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "",
                            types: "content"
                        },
                        tailSpace = function lexer_markup_markup_content_tailSpace(spacey) {
                            if (linepreserve > 0 && spacey.indexOf("\n") < 0 && spacey.indexOf("\r") < 0) {
                                spacey = "";
                            }
                            return "";
                        },
                        esctest   = function lexer_markup_markup_content_esctest() {
                            var aa = a - 1,
                                bb = 0;
                            if (b[a - 1] !== "\\") {
                                return false;
                            }
                            if (aa > -1) {
                                do {
                                    if (b[aa] !== "\\") {
                                        break;
                                    }
                                    bb = bb + 1;
                                    aa = aa - 1;
                                } while (aa > -1);
                            }
                            if (bb % 2 === 1) {
                                return true;
                            }
                            return false;
                        };
                    if (a < c) {
                        do {

                            // external code requires additional parsing to look for the appropriate end
                            // tag, but that end tag cannot be quoted or commented
                            if (ext === true) {
                                if (quote === "") {
                                    if (b[a] === "/") {
                                        if (b[a + 1] === "*") {
                                            quote = "*";
                                        } else if (b[a + 1] === "/") {
                                            quote = "/";
                                        } else if (name === "script" && "([{!=,;.?:&<>".indexOf(b[a - 1]) > -1) {
                                            quote = "reg";
                                        }
                                    } else if ((b[a] === "\"" || b[a] === "'" || b[a] === "`") && esctest() === false) {
                                        quote = b[a];
                                    } else if (b[a] === "}" && jsxbrace === true) {
                                        ext          = false;
                                        external     = lexer.script(
                                            lex.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""),
                                            parse.structure[parse.structure.length - 1][1] + 1
                                        );
                                        lengthMarkup = parse.recordConcat(data, external);
                                        record.token = "}";
                                        record.types = "script";
                                        lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                        parse.structure.pop();
                                        break;
                                    }
                                    end = b
                                        .slice(a, a + 10)
                                        .join("")
                                        .toLowerCase();

                                    //cfscript requires use of the script lexer
                                    if (name === "cfscript" && end === "</cfscript") {
                                        a   = a - 1;
                                        ext = false;
                                        if (lex.length < 1) {
                                            break;
                                        }
                                        external     = lexer.script(
                                            lex.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""),
                                            lengthMarkup
                                        );
                                        lengthMarkup = parse.recordConcat(data, external);
                                        break;
                                    }

                                    //script requires use of the script lexer
                                    if (name === "script") {
                                        if (a === c - 9) {
                                            end = end.slice(0, end.length - 1);
                                        } else {
                                            end = end.slice(0, end.length - 2);
                                        }
                                        if (end === "</script") {
                                            a   = a - 1;
                                            ext = false;
                                            if (lex.length < 1) {
                                                break;
                                            }
                                            external     = lexer.script(
                                                lex.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""),
                                                lengthMarkup
                                            );
                                            lengthMarkup = parse.recordConcat(data, external);
                                            break;
                                        }
                                    }

                                    //style requires use of the style lexer
                                    if (name === "style") {
                                        if (a === c - 8) {
                                            end = end.slice(0, end.length - 1);
                                        } else if (a === c - 9) {
                                            end = end.slice(0, end.length - 2);
                                        } else {
                                            end = end.slice(0, end.length - 3);
                                        }
                                        if (end === "</style") {
                                            a   = a - 1;
                                            ext = false;
                                            if (lex.length < 1) {
                                                break;
                                            }
                                            external     = lexer.style(
                                                lex.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""),
                                                lengthMarkup
                                            );
                                            lengthMarkup = parse.recordConcat(data, external);
                                            break;
                                        }
                                    }
                                } else if (quote === b[a] && (quote === "\"" || quote === "'" || quote === "`" || (quote === "*" && b[a + 1] === "/")) && esctest() === false) {
                                    quote = "";
                                } else if (quote === "`" && b[a] === "$" && b[a + 1] === "{" && esctest() === false) {
                                    quote = "}";
                                } else if (quote === "}" && b[a] === "}" && esctest() === false) {
                                    quote = "`";
                                } else if (quote === "/" && (b[a] === "\n" || b[a] === "\r")) {
                                    quote = "";
                                } else if (quote === "reg" && b[a] === "/" && esctest() === false) {
                                    quote = "";
                                } else if (quote === "/" && b[a] === ">" && b[a - 1] === "-" && b[a - 2] === "-") {
                                    end = b
                                        .slice(a + 1, a + 11)
                                        .join("")
                                        .toLowerCase();
                                    if (name === "cfscript" && end === "</cfscript") {
                                        quote = "";
                                    }
                                    end = end.slice(0, end.length - 2);
                                    if (name === "script" && end === "</script") {
                                        quote = "";
                                    }
                                    end = end.slice(0, end.length - 1);
                                    if (name === "style" && end === "</style") {
                                        quote = "";
                                    }
                                }
                            }

                            //typically this logic is for artifacts nested within an SGML tag
                            if (square === true && b[a] === "]") {
                                a = a - 1;
                                if (parse.options.content === true) {
                                    ltoke = "text";
                                } else if (parse.options.textpreserve === true) {
                                    ltoke = minspace + lex.join("");
                                    liner = 0;
                                } else if (parse.linesSpace > 0) {
                                    ltoke = minspace + lex
                                        .join("")
                                        .replace(/(\s+)$/, tailSpace);
                                    liner = 0;
                                } else {
                                    ltoke = lex
                                        .join("")
                                        .replace(/(\s+)$/, tailSpace)
                                        .replace(/\s+/g, " ");
                                }
                                record.token = ltoke;
                                lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                break;
                            }

                            //general content processing
                            if (ext === false && lex.length > 0 && ((b[a] === "<" && b[a + 1] !== "=" && (/\s|\d/).test(b[a + 1]) === false) || (b[a] === "[" && b[a + 1] === "%") || (b[a] === "{" && (parse.options.lang === "jsx" || parse.options.lang === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")))) {

                                //dustjs template handling
                                if (parse.options.lang === "dustjs" && b[a] === "{" && b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                                    a = a + 6;
                                    if (parse.options.content === true) {
                                        ltoke = "text";
                                    } else if (parse.options.textpreserve === true) {
                                        ltoke = minspace + lex.join("");
                                        liner = 0;
                                    } else {
                                        ltoke = lex
                                            .join("")
                                            .replace(/(\s+)$/, tailSpace)
                                            .replace(/\s+/g, " ");
                                    }
                                    record.token = ltoke;
                                    lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                    record.token = "{:else}";
                                    record.types = "template_else";
                                    record.presv = false;
                                    lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                    break;
                                }

                                //regular content
                                a = a - 1;
                                if (parse.options.content === true) {
                                    ltoke = "text";
                                } else if (parse.options.textpreserve === true) {
                                    ltoke = minspace + lex.join("");
                                    liner = 0;
                                } else if (parse.linesSpace > 0) {
                                    ltoke = minspace + lex
                                        .join("")
                                        .replace(/(\s+)$/, tailSpace);
                                } else {
                                    ltoke = lex
                                        .join("")
                                        .replace(/(\s+)$/, tailSpace)
                                        .replace(/\s+/g, " ");
                                }
                                record.token = ltoke;
                                lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                                break;
                            }
                            lex.push(b[a]);
                            a = a + 1;
                        } while (a < c);
                    }

                    if (a > now && a < c) {
                        if ((/\s/).test(b[a]) === true) {
                            (function lexer_markup_markup_content_space() {
                                var x = a;
                                parse.linesSpace = 1;
                                do {
                                    if (b[x] === "\n") {
                                        parse.lineNumber = parse.lineNumber + 1;
                                        parse.linesSpace = parse.linesSpace + 1;
                                    }
                                    x = x - 1;
                                } while (x > now && (/\s/).test(b[x]) === true);
                            }());
                        } else {
                            parse.linesSpace = 0;
                        }
                    } else {

                        //regular content at the end of the supplied source
                        if (parse.options.content === true) {
                            ltoke = "text";
                        } else if (parse.options.textpreserve === true) {
                            ltoke = minspace + lex.join("");
                            liner = 0;
                        } else {
                            ltoke = lex
                                .join("")
                                .replace(/(\s+)$/, tailSpace);
                        }
                        record       = ltoke;
                        lengthMarkup = parse.recordPush(data, record, true, lengthMarkup);
                        parse.linesSpace   = 0;
                    }
                };

            do {
                if ((/\s/).test(b[a]) === true) {
                    a = parse.spacer({array: b, end: c, index: a});
                } else if (ext === true) {
                    content();
                } else if (b[a] === "<") {
                    tag("");
                } else if (b[a] === "[" && b[a + 1] === "%") {
                    tag("%]");
                } else if (b[a] === "{" && (parse.options.lang === "jsx" || parse.options.lang === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                    tag("");
                } else if (b[a] === "]" && sgmlflag > 0) {
                    tag("]>");
                } else if (b[a] === "-" && b[a + 1] === "-" && b[a + 2] === "-" && parse.options.lang === "jekyll") {
                    tag("---");
                } else if (parse.options.lang === "apacheVelocity" && (/\d/).test(b[a + 1]) === false && (/\s/).test(b[a + 1]) === false) {
                    if (b[a] === "#" && ((/\w/).test(b[a + 1]) === true || b[a + 1] === "*" || b[a + 1] === "#" || (b[a + 1] === "[" && b[a + 2] === "["))) {
                        tag("");
                    } else if (b[a] === "$" && b[a + 1] !== "$" && b[a + 1] !== "=" && b[a + 1] !== "[") {
                        tag("");
                    } else {
                        content();
                    }
                } else {
                    content();
                }
                a = a + 1;
            } while (a < c);
            return data;
        };

    lexer.markup = markup;
}());
