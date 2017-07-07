/*
Parse Framework
*/

(function parse_init() {
    "use strict";
    var parser = function parser_(options) {
        var parse  = {
                attrs: [], // markup - element attributes
                begin: [], // all - token index where a structure opens as described by stack
                jscom: [], // markup - stores a boolean if a given token is a C like comment used within a markup tag in JSX/TSX
                linen: [], // all - indicates the line number the token resides from the supplied source, used for error reporting
                lines: [], // all - the number of empty lines to store at the given token
                presv: [], // markup = indicates whether the current token should be voided from beautification
                stack: [], // all - the name of the current container indicated by begin
                token: [], // all - parsed tokens, used by all lexers
                types: [] // all - parsed token categories, used by all lexers
            },
            lexer  = {},
            lf     = (options.crlf === true || options.crlf === "true")
                ? "\r\n"
                : "\n";
        lexer.markup = function parser_markup(source) {
            var safeSort   = function safeSort_(array, operation, recursive) {
                    var arTest  = function safeSort_arTest(item) {
                            if (typeof item !== "object" || item.length === undefined || item.length < 2) {
                                return false;
                            }
                            return true;
                        },
                        extref  = function safeSort__extref() {
                            //worthless function for backwards compatibility with older versions of V8 node.
                            return;
                        },
                        normal  = function safeSort__normal(item) {
                            var done    = [item[0]],
                                storeb  = item,
                                child   = function safeSort__normal_child() {
                                    var a   = 0,
                                        len = storeb.length;
                                    for (a = 0; a < len; a = a + 1) {
                                        if (arTest(storeb[a]) === true) {
                                            storeb[a] = safeSort__normal(storeb[a]);
                                        }
                                    }
                                },
                                recurse = function safeSort__normal_recurse(x) {
                                    var a      = 0,
                                        storea = [],
                                        len    = storeb.length;
                                    for (a = 0; a < len; a = a + 1) {
                                        if (storeb[a] !== x) {
                                            storea.push(storeb[a]);
                                        }
                                    }
                                    storeb = storea;
                                    if (storea.length > 0) {
                                        done.push(storea[0]);
                                        extref(storea[0]);
                                    } else {
                                        if (recursive === true) {
                                            child();
                                        }
                                        item = storeb;
                                    }
                                };
                            extref = recurse;
                            recurse(array[0]);
                        },
                        descend = function safeSort__descend(item) {
                            var c       = 0,
                                storeb  = item,
                                len     = item.length,
                                child   = function safeSort__descend_child() {
                                    var a    = 0,
                                        lenc = storeb.length;
                                    for (a = 0; a < lenc; a = a + 1) {
                                        if (arTest(storeb[a]) === true) {
                                            storeb[a] = safeSort__descend(storeb[a]);
                                        }
                                    }
                                },
                                recurse = function safeSort__descend_recurse() {
                                    var a      = 0,
                                        b      = 0,
                                        d      = 0,
                                        e      = 0,
                                        ind    = [],
                                        key    = storeb[c],
                                        tstore = "",
                                        tkey   = typeof key;
                                    for (a = c; a < len; a = a + 1) {
                                        tstore = typeof storeb[a];
                                        if (storeb[a] > key || (tstore > tkey)) {
                                            key = storeb[a];
                                            ind = [a];
                                        } else if (storeb[a] === key) {
                                            ind.push(a);
                                        }
                                    }
                                    d = ind.length;
                                    b = d + c;
                                    for (a = c; a < b; a = a + 1) {
                                        storeb[ind[e]] = storeb[a];
                                        storeb[a]      = key;
                                        e              = e + 1;
                                    }
                                    c = c + d;
                                    if (c < len) {
                                        extref();
                                    } else {
                                        if (recursive === true) {
                                            child();
                                        }
                                        item = storeb;
                                    }
                                };
                            extref = recurse;
                            recurse();
                            return item;
                        },
                        ascend  = function safeSort__ascend(item) {
                            var c       = 0,
                                storeb  = item,
                                len     = item.length,
                                child   = function safeSort__ascend_child() {
                                    var a    = 0,
                                        lenc = storeb.length;
                                    for (a = 0; a < lenc; a = a + 1) {
                                        if (arTest(storeb[a]) === true) {
                                            storeb[a] = safeSort__ascend(storeb[a]);
                                        }
                                    }
                                },
                                recurse = function safeSort__ascend_recurse() {
                                    var a      = 0,
                                        b      = 0,
                                        d      = 0,
                                        e      = 0,
                                        ind    = [],
                                        key    = storeb[c],
                                        tstore = "",
                                        tkey   = typeof key;
                                    for (a = c; a < len; a = a + 1) {
                                        tstore = typeof storeb[a];
                                        if (storeb[a] < key || tstore < tkey) {
                                            key = storeb[a];
                                            ind = [a];
                                        } else if (storeb[a] === key) {
                                            ind.push(a);
                                        }
                                    }
                                    d = ind.length;
                                    b = d + c;
                                    for (a = c; a < b; a = a + 1) {
                                        storeb[ind[e]] = storeb[a];
                                        storeb[a]      = key;
                                        e              = e + 1;
                                    }
                                    c = c + d;
                                    if (c < len) {
                                        extref();
                                    } else {
                                        if (recursive === true) {
                                            child();
                                        }
                                        item = storeb;
                                    }
                                };
                            extref = recurse;
                            recurse();
                            return item;
                        };
                    if (arTest(array) === false) {
                        return array;
                    }
                    if (recursive === "true") {
                        recursive = true;
                    } else if (recursive !== true) {
                        recursive = false;
                    }
                    if (operation === "normal") {
                        return normal(array);
                    }
                    if (operation === "descend") {
                        return descend(array);
                    }
                    return ascend(array);
                },
                attrs      = [],
                begin      = [],
                jscom      = [],
                linen      = [],
                lines      = [],
                presv      = [],
                stack      = [],
                token      = [],
                types      = [],
                reqs       = [],
                ids        = [],
                parseError = [],
                parent     = [
                    ["none", -1]
                ],
                line       = 1,
                objsortop  = false,
                //What is the lowercase tag name of the provided token?
                tagName    = function parser_markup_tagName(el) {
                    var space = el
                            .replace(/^(\{((%-?)|\{-?)\s*)/, "%")
                            .replace(/\s+/, " ")
                            .indexOf(" "),
                        name  = (space < 0)
                            ? el
                                .replace(/^(\{((%-?)|\{-?)\s*)/, " ")
                                .slice(1, el.length - 1)
                                .toLowerCase()
                            : el
                                .replace(/^(\{((%-?)|\{-?)\s*)/, " ")
                                .slice(1, space)
                                .toLowerCase();
                    name = name.replace(/(\}\})$/, "");
                    if (name.indexOf("(") > 0) {
                        name = name.slice(0, name.indexOf("("));
                    }
                    return name;
                };

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
            (function parser_markup_tokenize() {
                var a             = 0,
                    b             = source.split(""),
                    c             = b.length,
                    minspace      = "",
                    space         = "",
                    list          = 0,
                    litag         = 0,
                    linepreserve  = 0,
                    cftransaction = false,
                    sgmlflag      = 0,
                    ext           = false, //cftags is a list of supported coldfusion tags
                    //* required - means must have a separate matching end tag
                    // * optional - means the tag could have a separate end tag, but is probably a
                    // singleton
                    //* prohibited - means there is not corresponding end tag
                    cftags        = {
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
                    }, // determine if spaces between nodes are absent, multiline, or merely there 2 -
                    // multiline 1 - space present 0 - no space present
                    spacer        = function parser_markup_tokenize_spacer() {
                        var linea = 0;
                        if (space.length > 0) {
                            linea = space
                                .split("\n")
                                .length - 1;
                            if (options.preserve > 0 && linea > 1) {
                                if (linea > options.preserve + 1) {
                                    lines.push(options.preserve + 1);
                                } else {
                                    lines.push(linea);
                                }
                            } else {
                                lines.push(1);
                            }
                        } else {
                            lines.push(0);
                        }
                        minspace = space;
                        space    = "";
                    },
                    //parses tags, attributes, and template elements
                    tag           = function parser_markup_tokenize_tag(end) {
                        var lex       = [],
                            bcount    = 0,
                            e         = 0,
                            f         = 0,
                            igcount   = 0,
                            jsxcount  = 0,
                            braccount = 0,
                            parncount = 0,
                            quote     = "",
                            element   = "",
                            lastchar  = "",
                            jsxquote  = "",
                            tname     = "",
                            comment   = false,
                            cheat     = false,
                            endtag    = false,
                            nopush    = false,
                            nosort    = false,
                            simple    = false,
                            preserve  = false,
                            stest     = false,
                            liend     = false,
                            ignoreme  = false,
                            quotetest = false,
                            parseFail = false,
                            singleton = false,
                            earlyexit = false,
                            attribute = [],
                            attstore  = [],
                            presend   = {
                                cfquery: true
                            },
                            arname    = function parser_markup_tokenize_tag_name(x) {
                                var eq = x.indexOf("=");
                                if (eq > 0 && ((eq < x.indexOf("\"") && x.indexOf("\"") > 0) || (eq < x.indexOf("'") && x.indexOf("'") > 0))) {
                                    return x.slice(0, eq);
                                }
                                return x;
                            },
                            slashy    = function parser_markup_tokenize_tag_slashy() {
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
                            attrpush  = function parser_markup_tokenize_tag_attrpush(quotes) {
                                var atty = "",
                                    name = "",
                                    aa   = 0,
                                    bb   = 0;
                                if (quotes === true) {
                                    if (quote === "\"" && options.quoteConvert === "single") {
                                        atty = attribute
                                            .slice(0, attribute.length - 1)
                                            .join("")
                                            .replace(/'/g, "\"")
                                            .replace(/"/, "'") + "'";
                                    } else if (quote === "'" && options.quoteConvert === "double") {
                                        atty = attribute
                                            .slice(0, attribute.length - 1)
                                            .join("")
                                            .replace(/"/g, "'")
                                            .replace(/'/, "\"") + "\"";
                                    } else {
                                        atty = attribute.join("");
                                    }
                                    name = arname(atty);
                                    if (name === "data-prettydiff-ignore") {
                                        ignoreme = true;
                                    } else if (name === "id") {
                                        ids.push(atty.slice(name.length + 2, atty.length - 1));
                                    } else if (name === "schemaLocation") {
                                        reqs.push(atty.slice(name.length + 2, atty.length - 1));
                                    }
                                    quote = "";
                                } else {
                                    atty = attribute
                                        .join("")
                                        .replace(/\s+/g, " ");
                                    name = arname(atty);
                                    if (name === "data-prettydiff-ignore") {
                                        ignoreme = true;
                                    } else if (name === "id") {
                                        ids.push(element.slice(name.length + 1, atty.length));
                                    }
                                    if (options.jsx === true && attribute[0] === "{" && attribute[attribute.length - 1] === "}") {
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
                                atty = attribute.join(lf);
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
                            };
                        spacer();
                        jscom.push(false);
                        linen.push(line);
                        ext = false;
                        // this complex series of conditions determines an elements delimiters look to
                        // the types being pushed to quickly reason about the logic no type is pushed
                        // for start tags or singleton tags just yet some types set the `preserve` flag,
                        // which means to preserve internal white space The `nopush` flag is set when
                        // parsed tags are to be ignored and forgotten
                        (function parser_markup_tokenize_types() {
                            if (end === "]>") {
                                end      = ">";
                                sgmlflag = sgmlflag - 1;
                                types.push("template_end");
                            } else if (end === "---") {
                                preserve = true;
                                types.push("comment");
                            } else if (b[a] === "<") {
                                if (b[a + 1] === "/") {
                                    if (b[a + 2] === "#") {
                                        types.push("template_end");
                                    } else {
                                        types.push("end");
                                    }
                                    end = ">";
                                } else if (b[a + 1] === "!") {
                                    if (b[a + 2] === "-" && b[a + 3] === "-") {
                                        if (b[a + 4] === "#") {
                                            end = "-->";
                                            types.push("template");
                                        } else if (b[a + 4] === "[" && b[a + 5] === "i" && b[a + 6] === "f" && options.conditional === true) {
                                            end = "-->";
                                            types.push("conditional");
                                        } else if (b[a + 4] === "-" && (/<cf[a-z]/i).test(source) === true) {
                                            preserve = true;
                                            comment  = true;
                                            end      = "--->";
                                            types.push("comment");
                                        } else {
                                            end = "-->";
                                            if (options.mode === "minify" || options.comments === "nocomment") {
                                                nopush  = true;
                                                comment = true;
                                            } else {
                                                if (options.preserveComment === true) {
                                                    preserve = true;
                                                }
                                                comment = true;
                                                if (options.commline === true) {
                                                    lines[lines.length - 1] = 2;
                                                }
                                                types.push("comment");
                                            }
                                        }
                                    } else if (b[a + 2] === "[" && b[a + 3] === "C" && b[a + 4] === "D" && b[a + 5] === "A" && b[a + 6] === "T" && b[a + 7] === "A" && b[a + 8] === "[") {
                                        end      = "]]>";
                                        preserve = true;
                                        comment  = true;
                                        types.push("cdata");
                                    } else {
                                        end      = ">";
                                        sgmlflag = sgmlflag + 1;
                                        types.push("sgml");
                                    }
                                } else if (b[a + 1] === "?") {
                                    end = "?>";
                                    if (b[a + 2] === "x" && b[a + 3] === "m" && b[a + 4] === "l") {
                                        types.push("xml");
                                    } else {
                                        preserve = true;
                                        types.push("template");
                                    }
                                } else if (b[a + 1] === "%") {
                                    if (b[a + 2] !== "=") {
                                        preserve = true;
                                    }
                                    if (b[a + 2] === "-" && b[a + 3] === "-") {
                                        end     = "--%>";
                                        comment = true;
                                        if (options.commline === true) {
                                            line[line.length - 1] = 2;
                                        }
                                        types.push("comment");
                                    } else if (b[a + 2] === "#") {
                                        end     = "%>";
                                        comment = true;
                                        if (options.commline === true) {
                                            line[line.length - 1] = 2;
                                        }
                                        types.push("comment");
                                    } else {
                                        end = "%>";
                                        types.push("template");
                                    }
                                } else if (b[a + 4] !== undefined && b[a + 1].toLowerCase() === "p" && b[a + 2].toLowerCase() === "r" && b[a + 3].toLowerCase() === "e" && (b[a + 4] === ">" || (/\s/).test(b[a + 4]) === true)) {
                                    end      = "</pre>";
                                    preserve = true;
                                    types.push("ignore");
                                } else if (b[a + 4] !== undefined && b[a + 1].toLowerCase() === "x" && b[a + 2].toLowerCase() === "s" && b[a + 3].toLowerCase() === "l" && b[a + 4].toLowerCase() === ":" && b[a + 5].toLowerCase() === "t" && b[a + 6].toLowerCase() === "e" && b[a + 7].toLowerCase() === "x" && b[a + 8].toLowerCase() === "t" && (b[a + 9] === ">" || (/\s/).test(b[a + 9]) === true)) {
                                    end      = "</xsl:text>";
                                    preserve = true;
                                    types.push("ignore");
                                } else if (b[a + 8] !== undefined && b[a + 1].toLowerCase() === "c" && b[a + 2].toLowerCase() === "f" && b[a + 3].toLowerCase() === "q" && b[a + 4].toLowerCase() === "u" && b[a + 5].toLowerCase() === "e" && b[a + 6].toLowerCase() === "r" && b[a + 7].toLowerCase() === "y" && (b[a + 8] === ">" || (/\s/).test(b[a + 8]))) {
                                    end          = ">";
                                    linepreserve = linepreserve + 1;
                                    types.push("linepreserve");
                                } else if (b[a + 1] === "<") {
                                    if (b[a + 2] === "<") {
                                        end = ">>>";
                                    } else {
                                        end = ">>";
                                    }
                                    types.push("template");
                                } else if (b[a + 1] === "#") {
                                    if (b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e") {
                                        end = ">";
                                        types.push("template_else");
                                    } else if (b[a + 2] === "-" && b[a + 3] === "-") {
                                        end = "-->";
                                        types.push("comment");
                                        preserve = true;
                                    } else {
                                        end = ">";
                                        types.push("template_start");
                                    }
                                } else {
                                    simple = true;
                                    end    = ">";
                                }
                            } else if (b[a] === "{") {
                                preserve = true;
                                if (options.jsx === true) {
                                    end = "}";
                                    types.push("script");
                                } else if (options.dustjs === true) {
                                    if (b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                                        a = a + 6;
                                        token.push("{:else}");
                                        presv.push(true);
                                        stack.push(parent[parent.length - 1][0]);
                                        begin.push(parent[parent.length - 1][1]);
                                        attrs.push({});
                                        earlyexit = true;
                                        return types.push("template_else");
                                    }
                                    if (b[a + 1] === "!") {
                                        end     = "!}";
                                        comment = true;
                                        types.push("comment");
                                    } else if (b[a + 1] === "/") {
                                        end = "}";
                                        types.push("template_end");
                                    } else if (b[a + 1] === "~") {
                                        end = "}";
                                        types.push("singleton");
                                    } else if (b[a + 1] === ">") {
                                        end = "/}";
                                        types.push("singleton");
                                    } else if (b[a + 1] === "#" || b[a + 1] === "?" || b[a + 1] === "^" || b[a + 1] === "@" || b[a + 1] === "<" || b[a + 1] === "+") {
                                        end = "}";
                                        types.push("template_start");
                                    } else {
                                        end = "}";
                                        types.push("template");
                                    }
                                } else if (b[a + 1] === "{") {
                                    if (b[a + 2] === "{") {
                                        end = "}}}";
                                        types.push("template");
                                    } else if (b[a + 2] === "#") {
                                        end = "}}";
                                        types.push("template_start");
                                    } else if (b[a + 2] === "/") {
                                        end = "}}";
                                        types.push("template_end");
                                    } else if (b[a + 2] === "e" && b[a + 3] === "n" && b[a + 4] === "d") {
                                        end = "}}";
                                        types.push("template_end");
                                    } else if (b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e") {
                                        end = "}}";
                                        types.push("template_else");
                                    } else {
                                        end = "}}";
                                        types.push("template");
                                    }
                                } else if (b[a + 1] === "%") {
                                    end = "%}";
                                    types.push("template");
                                } else if (b[a + 1] === "#") {
                                    end = "#}";
                                    types.push("comment");
                                    preserve = true;
                                    comment  = true;
                                } else {
                                    end = b[a + 1] + "}";
                                    types.push("template");
                                }
                                if (b[a + 1] === "@" && b[a + 2] === "}" && b[a + 3] === "e" && b[a + 4] === "l" && b[a + 5] === "s" && b[a + 6] === "e" && b[a + 7] === "{" && b[a + 8] === "@" && b[a + 9] === "}") {
                                    a                       = a + 9;
                                    types[types.length - 1] = "template_else";
                                    presv.push(true);
                                    stack.push(parent[parent.length - 1][0]);
                                    begin.push(parent[parent.length - 1][1]);
                                    attrs.push({});
                                    earlyexit = true;
                                    return token.push("{@}else{@}");
                                }
                            } else if (b[a] === "[" && b[a + 1] === "%") {
                                end = "%]";
                                types.push("template");
                            } else if (b[a] === "#" && options.apacheVelocity === true) {
                                if (b[a + 1] === "*") {
                                    preserve = true;
                                    comment  = true;
                                    end      = "*#";
                                    types.push("comment");
                                } else if (b[a + 1] === "[" && b[a + 2] === "[") {
                                    preserve = true;
                                    comment  = true;
                                    end      = "]]#";
                                    types.push("comment");
                                } else if (b[a + 1] === "#") {
                                    preserve = true;
                                    comment  = true;
                                    end      = "\n";
                                    types.push("comment");
                                } else if (b[a + 1] === "e" && b[a + 2] === "l" && b[a + 3] === "s" && b[a + 4] === "e" && (/\s/).test(b[a + 5]) === true) {
                                    end = "\n";
                                    types.push("template_else");
                                } else if (b[a + 1] === "i" && b[a + 2] === "f") {
                                    end = "\n";
                                    types.push("template_start");
                                } else if (b[a + 1] === "f" && b[a + 2] === "o" && b[a + 3] === "r" && b[a + 4] === "e" && b[a + 5] === "a" && b[a + 6] === "c" && b[a + 7] === "h") {
                                    end = "\n";
                                    types.push("template_start");
                                } else if (b[a + 1] === "e" && b[a + 2] === "n" && b[a + 3] === "d") {
                                    end = "\n";
                                    types.push("template_end");
                                } else {
                                    end = "\n";
                                    types.push("template");
                                }
                            } else if (b[a] === "$" && options.apacheVelocity === true) {
                                end = "\n";
                                types.push("template");
                            }
                            if (options.unformatted === true) {
                                preserve = true;
                            }
                        }());
                        if (earlyexit === true) {
                            return;
                        }
                        // This loop is the logic that parses tags and attributes If the attribute
                        // data-prettydiff-ignore is present the `ignore` flag is set The ignore flag is
                        // identical to the preserve flag
                        lastchar = end.charAt(end.length - 1);
                        if (a < c) {
                            do {
                                if (b[a] === "\n") {
                                    line = line + 1;
                                }
                                if (preserve === true || (/\s/).test(b[a]) === false) {
                                    lex.push(b[a]);
                                } else if (lex[lex.length - 1] !== " ") {
                                    lex.push(" ");
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
                                        if (options.jsx === true) {
                                            if (b[a] === "{") {
                                                jsxcount = jsxcount + 1;
                                            } else if (b[a] === "}") {
                                                jsxcount = jsxcount - 1;
                                            }
                                        }
                                        if (types[types.length - 1] === "sgml" && b[a] === "[" && lex.length > 4) {
                                            types[types.length - 1] = "template_start";
                                            break;
                                        }
                                        if (b[a] === "<" && preserve === false && lex.length > 1 && end !== ">>" && end !== ">>>" && simple === true) {
                                            parseError.push("Parse error on line " + line + " on element: ");
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
                                                        line = line + 1;
                                                    }
                                                    if (options.unformatted === true) {
                                                        lex.push(b[a]);
                                                    }
                                                    attribute.push(b[a]);

                                                    if ((b[a] === "<" || b[a] === ">") && (quote === "" || quote === ">") && options.jsx === false) {
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
                                                                        attrpush(false);
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
                                                                attrpush(false);
                                                            }
                                                            break;
                                                        }
                                                        if (b[a] === "{" && b[a - 1] === "=" && options.jsx === false) {
                                                            quote = "}";
                                                        } else if (b[a] === "\"" || b[a] === "'") {
                                                            quote = b[a];
                                                            if (b[a - 1] === "=" && (b[a + 1] === "<" || (b[a + 1] === "{" && b[a + 2] === "%") || (/\s/).test(b[a + 1]) === true)) {
                                                                igcount = a;
                                                            }
                                                        } else if (b[a] === "(") {
                                                            quote     = ")";
                                                            parncount = 1;
                                                        } else if (options.jsx === true) {
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
                                                        } else if (lex[0] !== "{" && b[a] === "{" && (options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                                            //opening embedded template expression
                                                            if (b[a + 1] === "{") {
                                                                if (b[a + 2] === "{") {
                                                                    quote = "}}}";
                                                                } else {
                                                                    quote = "}}";
                                                                }
                                                            } else if (options.dustjs === true) {
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
                                                                attrpush(false);
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
                                                                attrpush(false);
                                                                break;
                                                            }
                                                        }
                                                    } else if (options.jsx === true && (quote === "}" || (quote === "\n" && b[a] === "\n") || (quote === "*/" && b[a - 1] === "*" && b[a] === "/"))) {
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
                                                                    if (options.unformatted === false) {
                                                                        if (options.jsx === true) {
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
                                                            quote                   = "";
                                                            jsxquote                = "";
                                                            jscom[jscom.length - 1] = true;
                                                            element                 = attribute.join("");
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
                                                                attrpush(true);
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
                                        } else if (comment === false && end !== "\n" && b[a] === "<" && b[a + 1] === "!" && b[a + 2] === "-" && b[a + 3] === "-" && b[a + 4] !== "#" && types[types.length - 1] !== "conditional") {
                                            quote = "-->";
                                        } else if (lex[0] !== "{" && end !== "\n" && b[a] === "{" && end !== "%>" && end !== "%]" && (options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                            //opening embedded template expression
                                            if (b[a + 1] === "{") {
                                                if (b[a + 2] === "{") {
                                                    quote = "}}}";
                                                } else {
                                                    quote = "}}";
                                                }
                                            } else if (options.dustjs === true) {
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
                                        } else if (simple === true && options.jsx === true && b[a] === "/" && (b[a + 1] === "*" || b[a + 1] === "/")) {
                                            //jsx comment immediately following tag name
                                            stest               = true;
                                            lex[lex.length - 1] = " ";
                                            attribute.push(b[a]);
                                            if (b[a + 1] === "*") {
                                                jsxquote = "*/";
                                            } else {
                                                jsxquote = "\n";
                                            }
                                        } else if ((b[a] === lastchar || (end === "\n" && b[a + 1] === "<")) && (lex.length > end.length + 1 || lex[0] === "]") && (options.jsx === false || jsxcount === 0)) {
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
                                                end                     = "endcomment";
                                                lastchar                = "t";
                                                preserve                = true;
                                                comment                 = true;
                                                types[types.length - 1] = "comment";
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
                                    } else if (b[a] === quote.charAt(quote.length - 1) && ((options.jsx === true && end === "}" && (b[a - 1] !== "\\" || slashy() === false)) || options.jsx === false || end !== "}")) {
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
                                    a = a + 1;
                                }
                            } while (a < c);
                        }
                        //nopush flags mean an early exit
                        if (nopush === true) {
                            jscom.pop();
                            linen.pop();
                            lines.pop();
                            space = minspace;
                            return;
                        }

                        if (preserve === true) {
                            presv.push(true);
                        } else {
                            presv.push(false);
                        }

                        if (options.correct === true) {
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
                        igcount = 0;
                        element = lex.join("");
                        if (element.indexOf("{{") === 0 && element.slice(element.length - 2) === "}}") {
                            if (tagName(element) === "end") {
                                types[types.length - 1] = "template_end";
                            } else if (tagName(element) === "else") {
                                types[types.length - 1] = "template_else";
                            }
                        } else if (element.slice(0, 2) === "<%" && element.slice(element.length - 2) === "%>") {
                            if ((/^(<%\s+end\s+-?%>)$/).test(element) === true) {
                                types[types.length - 1] = "template_end";
                            } else if (((/\sdo\s/).test(element) === true && element.indexOf("-%>") === element.length - 3) || (/^(<%(%|-)?\s*if)/).test(element) === true) {
                                types[types.length - 1] = "template_start";
                            }
                        }
                        tname = tagName(element);
                        if (options.html === true && element.charAt(0) === "<" && element.charAt(1) !== "!" && element.charAt(1) !== "?" && (types.length === 0 || types[types.length - 1].indexOf("template") < 0) && options.jsx === false && cftags[tname] === undefined && cftags[tname.slice(1)] === undefined && tname.slice(0, 3) !== "cf_") {
                            element = element.toLowerCase();
                        }
                        if (tname === "comment" && element.slice(0, 2) === "{%") {
                            element = element
                                .replace(/^(\{%\s*comment\s*%\}\s*)/, "")
                                .replace(/(\s*\{%\s*endcomment\s*%\})$/, "");

                            attrs.push({});
                            attrs.push({});
                            jscom.push(false);
                            jscom.push(false);
                            e = linen[linen.length - 1];
                            linen.push(e);
                            linen.push(e);
                            types[types.length - 1] = "template_start";
                            token.push("{% comment %}");
                            types.push("comment");
                            stack.push(parent[parent.length - 1][0]);
                            begin.push(parent[parent.length - 1][1]);
                            token.push(element);
                            types.push("template_end");
                            stack.push(parent[parent.length - 1][0]);
                            begin.push(parent[parent.length - 1][1]);
                            return token.push("{% endcomment %}");
                        }

                        if (end !== "]>" && sgmlflag > 0 && element.charAt(element.length - 1) !== "[" && (element.slice(element.length - 2) === "]>" || (/^(<!((doctype)|(notation))\s)/i).test(element) === true)) {
                            sgmlflag = sgmlflag - 1;
                        }

                        //fix singleton tags and sort attributes
                        if (attstore.length > 0) {
                            if (attstore[attstore.length - 1] === "/") {
                                attstore.pop();
                                lex.splice(lex.length - 1, 0, "/");
                            }
                            f = attstore.length;
                            e = 1;
                            if (e < f) {
                                do {
                                    quote = attstore[e - 1];
                                    if (quote.charAt(quote.length - 1) === "=" && attstore[e].indexOf("=") < 0) {
                                        attstore[e - 1] = quote + attstore[e];
                                        attstore.splice(e, 1);
                                        f = f - 1;
                                        e = e - 1;
                                    }
                                    e = e + 1;
                                } while (e < f);
                            }
                            if (objsortop === true && jscom[jscom.length - 1] === false && options.jsx === false && nosort === false && tname !== "cfif" && tname !== "cfelseif" && tname !== "cfset") {
                                attstore = safeSort(attstore);
                            }
                        }
                        attrs.push(function parser_markup_tokenize_attribute() {
                            var ind    = 0,
                                len    = attstore.length,
                                obj    = {},
                                eq     = 0,
                                dq     = 0,
                                sq     = 0,
                                syntax = "<{\"'=/",
                                slice  = "",
                                store  = [],
                                name   = "",
                                cft    = cftags[tname];
                            if (tname.slice(0, 3) === "cf_") {
                                cft = "required";
                            }
                            if (objsortop === true && options.jsx === false && cft === undefined) {
                                attstore = safeSort(attstore);
                            }
                            if (ind < len) {
                                do {
                                    eq = attstore[ind].indexOf("=");
                                    dq = attstore[ind].indexOf("\"");
                                    sq = attstore[ind].indexOf("'");
                                    if (eq > -1 && store.length > 0) {
                                        obj[store.join(" ")] = "";
                                        store                = [];
                                        obj[attstore[ind]]   = "";
                                    } else if (cft !== undefined && eq < 0 && attstore[ind].indexOf("=") < 0) {
                                        store.push(attstore[ind]);
                                    } else if ((cft !== undefined && eq < 0) || (dq > 0 && dq < eq) || (sq > 0 && sq < eq) || syntax.indexOf(attstore[ind].charAt(0)) > -1) {
                                        obj[attstore[ind]] = "";
                                    } else if (eq < 0 && cft === undefined) {
                                        name = attstore[ind];
                                        if (options.html === true && options.jsx === false && cft === undefined) {
                                            name = name.toLowerCase();
                                        }
                                        if (options.quoteConvert === "single") {
                                            obj[name] = "'" + attstore[ind] + "'";
                                        } else {
                                            obj[name] = "\"" + attstore[ind] + "\"";
                                        }
                                    } else {
                                        slice = attstore[ind].slice(eq + 1);
                                        if (syntax.indexOf(slice.charAt(0)) < 0 && cft === undefined) {
                                            if (options.quoteConvert === "single") {
                                                slice = "'" + slice + "'";
                                            } else {
                                                slice = "\"" + slice + "\"";
                                            }
                                        }
                                        name = attstore[ind].slice(0, eq);
                                        if (options.html === true && options.jsx === false && cft === undefined) {
                                            name = name.toLowerCase();
                                        }
                                        obj[name] = slice;
                                    }
                                    ind = ind + 1;
                                } while (ind < len);
                            }
                            if (store.length > 0) {
                                obj[store.join(" ")] = "";
                            }
                            return obj;
                        }());

                        if (parseFail === true) {
                            if (element.indexOf("<!--<![") === 0) {
                                parseError.pop();
                            } else {
                                parseError[parseError.length - 1] = parseError[parseError.length - 1] +
                                        element;
                                if (element.indexOf("</") > 0) {
                                    token.push(element);
                                    stack.push(parent[parent.length - 1][0]);
                                    begin.push(parent[parent.length - 1][1]);
                                    return types.push("end");
                                }
                            }
                        }
                        // cheat identifies HTML singleton elements as singletons even if formatted as
                        // start tags
                        cheat = (function parser_markup_tokenize_tag_cheat() {
                            var atty         = [],
                                attn         = token[token.length - 1],
                                atval        = "",
                                type         = "",
                                d            = 0,
                                ee           = 1,
                                cfval        = "",
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
                                fixsingleton = function parser_markup_tokenize_tag_cheat_fixsingleton() {
                                    var aa    = token.length - 1,
                                        bb    = 0,
                                        vname = tname.slice(1);
                                    if (aa > -1) {
                                        do {
                                            if (types[aa] === "end") {
                                                bb = bb + 1;
                                            } else if (types[aa] === "start") {
                                                bb = bb - 1;
                                                if (bb < 0) {
                                                    return false;
                                                }
                                            }
                                            if (bb === 0 && token[aa].toLowerCase().indexOf(vname) === 1) {
                                                if (cftags[tagName(token[aa])] !== undefined) {
                                                    types[aa] = "template_start";
                                                } else {
                                                    types[aa] = "start";
                                                }
                                                if (Object.keys(attrs[aa]).length > 0) {
                                                    token[aa] = token[aa].replace(/(\s*\/>)$/, " >");
                                                } else {
                                                    token[aa] = token[aa].replace(/(\s*\/>)$/, ">");
                                                }
                                                return false;
                                            }
                                            aa = aa - 1;
                                        } while (aa > -1);
                                    }
                                };
                            if (presend["/" + tname] === true) {
                                linepreserve = linepreserve - 1;
                            }
                            if (types[types.length - 1] === "end" && tname.slice(0, 3) !== "/cf") {
                                if (types[types.length - 2] === "singleton" && attn.charAt(attn.length - 2) !== "/" && "/" + tagName(attn) === tname) {
                                    types[types.length - 2] = "start";
                                } else if ((types[types.length - 2] === "start" || htmlsings[tname.slice(1)] === "singleton") && tname !== "/span" && tname !== "/div" && tname !== "/script" && (options.html === false || (options.html === true && tname !== "/li")) && tname === "/" + tagName(token[token.length - 1]) && options.tagmerge === true) {
                                    types.pop();
                                    attrs.pop();
                                    jscom.pop();
                                    linen.pop();
                                    lines.pop();
                                    presv.pop();
                                    if (types[types.length - 1] === "start") {
                                        token[token.length - 1] = token[token.length - 1].replace(/>$/, "/>");
                                    }
                                    types[types.length - 1] = "singleton";
                                    singleton               = true;
                                    return;
                                }
                            }
                            d = attstore.length - 1;
                            if (d > -1) {
                                do {
                                    atty = arname(attstore[d]);
                                    if (atty[0] === "type") {
                                        type = atty[1];
                                        if (type.charAt(0) === "\"" || type.charAt(0) === "'") {
                                            type = type.slice(1, type.length - 1);
                                        }
                                    } else if (atty[0] === "src" && (tname === "embed" || tname === "img" || tname === "script" || tname === "iframe")) {
                                        atval = atty[1];
                                        if (atval.charAt(0) === "\"" || atval.charAt(0) === "'") {
                                            atval = atval.slice(1, atval.length - 1);
                                        }
                                        reqs.push(atval);
                                    } else if (tname === "link" && atty === "href") {
                                        atval = atty[1];
                                        if (atval.charAt(0) === "\"" || atval.charAt(0) === "'") {
                                            atval = atval.slice(1, atval.length - 1);
                                        }
                                        reqs.push(atval);
                                    }
                                    d = d - 1;
                                } while (d > -1);
                            }

                            if ((tname === "script" || tname === "style" || tname === "cfscript") && element.slice(element.length - 2) !== "/>") {
                                //identify if there is embedded code requiring an external parser
                                if (tname === "script" && (type === "" || type === "text/javascript" || type === "babel" || type === "module" || type === "application/javascript" || type === "application/x-javascript" || type === "text/ecmascript" || type === "application/ecmascript" || type === "text/jsx" || type === "application/jsx" || type === "text/cjs")) {
                                    ext = true;
                                } else if (tname === "style" && (type === "" || type === "text/css")) {
                                    ext = true;
                                } else if (tname === "cfscript") {
                                    ext = true;
                                }
                                if (ext === true) {
                                    d = a + 1;
                                    if (d < c) {
                                        do {
                                            if ((/\s/).test(b[d]) === false) {
                                                if (b[d] === "<") {
                                                    if (b.slice(d + 1, d + 4).join("") === "!--") {
                                                        d = d + 4;
                                                        if (d < c) {
                                                            do {
                                                                if ((/\s/).test(b[d]) === false) {
                                                                    ext = false;
                                                                    break;
                                                                }
                                                                if (b[d] === "\n" || b[d] === "\r") {
                                                                    break;
                                                                }
                                                                d = d + 1;
                                                            } while (d < c);
                                                        }
                                                    } else if (b.slice(d + 1, d + 9).join("") !== "![CDATA[") {
                                                        ext = false;
                                                    }
                                                }
                                                break;
                                            }
                                            d = d + 1;
                                        } while (d < c);
                                    }
                                }
                            }
                            if (tname === "/#assign" || tname === "/#global") {
                                d = types.length - 2;
                                if (d > -1) {
                                    do {
                                        if (types[d] === "start" || types[d] === "template_start") {
                                            ee = ee - 1;
                                        } else if (types[d] === "end" || types[d] === "template_end") {
                                            ee = ee + 1;
                                        }
                                        if (ee === 1) {
                                            if ((token[d].indexOf("<#assign") === 0 && tname === "/#assign") || (token[d].indexOf("<#global") === 0 && tname === "/#global")) {
                                                types[d] = "template_start";
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
                            if (tname.charAt(0) === "#" && types[types.length - 1] === "start" && (tname === "#assign" || tname === "#break" || tname === "#case" || tname === "#default" || tname === "#fallback" || tname === "#flush" || tname === "#ftl" || tname === "#global" || tname === "#import" || tname === "#include" || tname === "#local" || tname === "#t" || tname === "#lt" || tname === "#rt" || tname === "#nested" || tname === "#nt" || tname === "#recover" || tname === "#recurse" || tname === "#return" || tname === "#sep" || tname === "#setting" || tname === "#stop" || tname === "#visit")) {
                                simple = true;
                                return true;
                            }
                            if (options.html === true) {
                                //simple means of looking for missing li end tags
                                if (options.jsx === false) {
                                    if (tname === "li") {
                                        if (litag === list && (list !== 0 || (list === 0 && types.length > 0 && types[types.length - 1].indexOf("template") < 0))) {
                                            d = types.length - 1;
                                            if (d > -1) {
                                                do {
                                                    if (types[d] === "start" || types[d] === "template_start") {
                                                        ee = ee - 1;
                                                    } else if (types[d] === "end" || types[d] === "template_end") {
                                                        ee = ee + 1;
                                                    }
                                                    if (ee === -1 && (tagName(token[d]) === "li" || (tagName(token[d + 1]) === "li" && (tagName(token[d]) === "ul" || tagName(token[d]) === "ol")))) {
                                                        liend = true;
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
                                            liend = true;
                                            litag = litag - 1;

                                        }
                                        list = list - 1;
                                    }
                                }
                                if (types[types.length - 1] === "end" && htmlsings[tname.slice(1)] === "singleton" && tname !== "/cftransaction") {
                                    return fixsingleton();
                                }
                                if (htmlsings[tname] === "singleton") {
                                    if (options.correct === true && ender.test(element) === false) {
                                        lex.pop();
                                        lex.push(" ");
                                        lex.push("/");
                                        lex.push(">");
                                        element = lex.join("");
                                    }
                                    return true;
                                }
                            }
                            if (types[types.length - 1] === "end" && tname.slice(0, 3) === "/cf" && cftags[tname.slice(1)] !== undefined) {
                                cfval = cftags[tname.slice(1)];
                                if (tname === "/cftransaction") {
                                    cftransaction = false;
                                }
                                if (cfval !== undefined) {
                                    types[types.length - 1] = "template_end";
                                }
                                if ((cfval === "optional" || cfval === "prohibited") && tname !== "/cftransaction") {
                                    return fixsingleton();
                                }
                                return false;
                            }
                            if (tname.slice(0, 2) === "cf") {
                                if (tname === "cfelse" || tname === "cfelseif") {
                                    types.push("template_else");
                                    token.push(lex.join(""));
                                    stack.push(parent[parent.length - 1][0]);
                                    begin.push(parent[parent.length - 1][1]);
                                    singleton = true;
                                    return false;
                                }
                                if (tname === "cftransaction" && cftransaction === true) {
                                    cfval = "prohibited";
                                } else {
                                    cfval = cftags[tname];
                                }
                                if (cfval === "optional" || cfval === "prohibited" || tname.slice(0, 3) === "cf_") {
                                    if (options.correct === true && ender.test(element) === false) {
                                        lex.pop();
                                        lex.push(" ");
                                        lex.push("/");
                                        lex.push(">");
                                    }
                                    types.push("template");
                                    token.push(lex.join("").replace(/\s+/, " "));
                                    stack.push(parent[parent.length - 1][0]);
                                    begin.push(parent[parent.length - 1][1]);
                                    singleton = true;
                                    return false;
                                }
                                if (cfval === "required" && tname !== "cfquery") {
                                    if (tname === "cftransaction" && cftransaction === false) {
                                        cftransaction = true;
                                    }
                                    types.push("template_start");
                                    token.push(lex.join(""));
                                    stack.push(parent[parent.length - 1][0]);
                                    if (parent[parent.length - 1][1] === -1) {
                                        begin.push(token.length - 1);
                                    } else {
                                        begin.push(parent[parent.length - 1][1]);
                                    }
                                    singleton = true;
                                }
                                return false;
                            }
                            if (options.dustjs === true && types[types.length - 1] === "template_start") {
                                type  = element.charAt(1);
                                atval = element.slice(element.length - 2);
                                if ((atval === "/}" || atval.charAt(0) === type) && (type === "#" || type === "?" || type === "^" || type === "@" || type === "<" || type === "+")) {
                                    types[types.length - 1] = "template";
                                }
                            }
                            return false;
                        }());

                        if (singleton === true) {
                            return;
                        }
                        //am I a singleton or a start type?
                        if (simple === true && ignoreme === false) {
                            if (cheat === true || (lex[lex.length - 2] === "/" && lex[lex.length - 1] === ">")) {
                                types.push("singleton");
                            } else {
                                types.push("start");
                            }
                        }
                        // additional logic is required to find the end of a tag with the attribute
                        // data-prettydiff-ignore
                        if (simple === true && preserve === false && ignoreme === true && end === ">" && element.slice(element.length - 2) !== "/>") {
                            if (cheat === true) {
                                types.push("singleton");
                            } else {
                                preserve                = true;
                                presv[presv.length - 1] = true;
                                types.push("ignore");
                                a     = a + 1;
                                quote = "";
                                if (a < c) {
                                    do {
                                        if (b[a] === "\n") {
                                            line = line + 1;
                                        }
                                        lex.push(b[a]);
                                        if (quote === "") {
                                            if (b[a] === "\"") {
                                                quote = "\"";
                                            } else if (b[a] === "'") {
                                                quote = "'";
                                            } else if (lex[0] !== "{" && b[a] === "{" && (options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                                if (b[a + 1] === "{") {
                                                    if (b[a + 2] === "{") {
                                                        quote = "}}}";
                                                    } else {
                                                        quote = "}}";
                                                    }
                                                } else if (options.dustjs === true) {
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
                            if (options.mode === "diff") {
                                element = element.replace(" >", " />");
                                element = element.slice(0, element.indexOf(" />") + 3);
                                if (options.quotes === "single") {
                                    attstore = ["data-prettydiff-ignore='true'"];
                                } else {
                                    attstore = ["data-prettydiff-ignore=\"true\""];
                                }
                            }
                        }

                        //some template tags can be evaluated as a block start/end based on syntax alone
                        e = types.length - 1;
                        if (types[e].indexOf("template") > -1) {
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
                                    types[e] = "template_else";
                                } else {
                                    f = lex.length - 1;
                                    if (f > -1) {
                                        do {
                                            if (tname === lex[f]) {
                                                types[e] = "template_start";
                                                break;
                                            }
                                            if (tname === "end" + lex[f]) {
                                                types[e] = "template_end";
                                                break;
                                            }
                                            f = f - 1;
                                        } while (f > -1);
                                    }
                                }
                            } else if (element.slice(0, 2) === "{{" && element.charAt(3) !== "{") {
                                if ((/^(\{\{\s*end\s*\}\})$/).test(element) === true) {
                                    types[e] = "template_end";
                                } else if (tname === "block" || tname === "define" || tname === "form" || tname === "if" || tname === "range" || tname === "with") {
                                    if (tname !== "block" || (/\{%\s*\w/).test(source) === false) {
                                        types[e] = "template_start";
                                    }
                                }
                            } else if (types[e] === "template") {
                                if (element.indexOf("else") > 2) {
                                    types[e] = "template_else";
                                } else if ((/^(<%\s*\})/).test(element) === true || (/^(\[%\s*\})/).test(element) === true || (/^(\{@\s*\})/).test(element) === true) {
                                    types[e] = "template_end";
                                } else if ((/(\{\s*%>)$/).test(element) === true || (/(\{\s*%\])$/).test(element) === true || (/(\{\s*@\})$/).test(element) === true) {
                                    types[e] = "template_start";
                                }
                            }
                        }

                        // HTML5 does not require an end tag for an opening list item <li> this logic
                        // temprorarily creates a pseudo end tag
                        if (liend === true) {
                            token.push("</parseli>");
                            stack.push(parent[parent.length - 1][0]);
                            begin.push(parent[parent.length - 1][1]);
                            lines.push(lines[lines.length - 1]);
                            linen.push(line);
                            lines[lines.length - 2] = 0;
                            attrs.push({});
                            if (types[types.length - 1] === "start") {
                                types.splice(types.length - 1, 0, "end");
                            } else {
                                types.push("end");
                            }
                            presv.push(false);
                            jscom.push(false);
                            if (parent.length > 1) {
                                parent.pop();
                            }
                        }
                        if (parent[parent.length - 1][1] === -1) {
                            parent[parent.length - 1] = ["root", token.length];
                        }
                        if (preserve === true) {
                            token.push(element);
                            stack.push(parent[parent.length - 1][0]);
                            begin.push(parent[parent.length - 1][1]);
                        } else {
                            if (options.jsx === true) {
                                token.push(element);
                            } else {
                                token.push(element.replace(/\s+/g, " "));
                            }
                            stack.push(parent[parent.length - 1][0]);
                            begin.push(parent[parent.length - 1][1]);
                        }
                        if (options.tagsort === true && types[types.length - 1] === "end" && types[types.length - 2] !== "start") {
                            (function parser_markup_tokenize_tag_sorttag() {
                                var children   = [],
                                    bb         = 0,
                                    d          = 0,
                                    endStore   = 0,
                                    startStore = 0,
                                    endData    = {},
                                    store      = {
                                        attrs: [],
                                        begin: [],
                                        jscom: [],
                                        linen: [],
                                        lines: [],
                                        presv: [],
                                        stack: [],
                                        token: [],
                                        types: []
                                    },
                                    sortName   = function parser_markup_tokenize_tag_sorttag_sortName(x, y) {
                                        if (token[x[0]] < token[y[0]]) {
                                            return 1;
                                        }
                                        return -1;
                                    },
                                    pushy      = function parser_markup_tokenize_tag_sorttag_pushy(index) {
                                        store
                                            .attrs
                                            .push(attrs[index]);
                                        store
                                            .begin
                                            .push(begin[index]);
                                        store
                                            .stack
                                            .push(stack[index]);
                                        store
                                            .jscom
                                            .push(jscom[index]);
                                        store
                                            .linen
                                            .push(linen[index]);
                                        store
                                            .lines
                                            .push(lines[index]);
                                        store
                                            .presv
                                            .push(presv[index]);
                                        store
                                            .token
                                            .push(token[index]);
                                        store
                                            .types
                                            .push(types[index]);
                                    };
                                bb = token.length - 2;
                                if (bb > -1) {
                                    do {
                                        if (types[bb] === "start") {
                                            d = d - 1;
                                            if (d < 0) {
                                                startStore = bb + 1;
                                                break;
                                            }
                                        } else if (types[bb] === "end") {
                                            d = d + 1;
                                            if (d === 1) {
                                                endStore = bb;
                                            }
                                        }
                                        if (d === 0) {
                                            if (types[bb] === "start") {
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
                                children.sort(sortName);
                                for (bb = children.length - 1; bb > -1; bb = bb - 1) {
                                    pushy(children[bb][0]);
                                    if (children[bb][0] !== children[bb][1]) {
                                        for (d = children[bb][0] + 1; d < children[bb][1]; d = d + 1) {
                                            pushy(d);
                                        }
                                        pushy(children[bb][1]);
                                    }
                                }
                                endData.attrs = attrs.pop();
                                endData.begin = begin.pop();
                                endData.stack = stack.pop();
                                endData.jscom = jscom.pop();
                                endData.linen = linen.pop();
                                endData.lines = lines.pop();
                                endData.presv = presv.pop();
                                endData.token = token.pop();
                                endData.types = types.pop();
                                attrs         = attrs
                                    .slice(0, startStore)
                                    .concat(store.attrs);
                                begin         = begin
                                    .slice(0, startStore)
                                    .concat(store.begin);
                                stack         = stack
                                    .slice(0, startStore)
                                    .concat(store.stack);
                                jscom         = jscom
                                    .slice(0, startStore)
                                    .concat(store.jscom);
                                linen         = linen
                                    .slice(0, startStore)
                                    .concat(store.linen);
                                lines         = lines
                                    .slice(0, startStore)
                                    .concat(store.lines);
                                presv         = presv
                                    .slice(0, startStore)
                                    .concat(store.presv);
                                token         = token
                                    .slice(0, startStore)
                                    .concat(store.token);
                                types         = types
                                    .slice(0, startStore)
                                    .concat(store.types);
                                attrs.push(endData.attrs);
                                begin.push(endData.begin);
                                stack.push(endData.stack);
                                jscom.push(endData.jscom);
                                linen.push(endData.linen);
                                lines.push(endData.lines);
                                presv.push(endData.presv);
                                token.push(endData.token);
                                types.push(endData.types);
                            }());
                        }
                        e = token.length - 1;
                        if (types[e] === "start") {
                            parent.push([tname, e]);
                        } else if (types[e] === "end" && parent.length > 1) {
                            parent.pop();
                        }
                    },
                    content       = function parser_markup_tokenize_content() {
                        var lex       = [],
                            quote     = "",
                            end       = "",
                            square    = (
                                types[types.length - 1] === "template_start" && token[token.length - 1].indexOf("<!") === 0 && token[token.length - 1].indexOf("<![") < 0 && token[token.length - 1].charAt(token[token.length - 1].length - 1) === "["
                            ),
                            tailSpace = function parser_markup_tokenize_content_tailSpace(spacey) {
                                if (linepreserve > 0 && spacey.indexOf("\n") < 0 && spacey.indexOf("\r") < 0) {
                                    spacey = "";
                                }
                                space = spacey;
                                return "";
                            },
                            esctest   = function parser_markup_tokenize_content_esctest() {
                                var aa = 0,
                                    bb = 0;
                                if (b[a - 1] !== "\\") {
                                    return false;
                                }
                                for (aa = a - 1; aa > -1; aa = aa - 1) {
                                    if (b[aa] !== "\\") {
                                        break;
                                    }
                                    bb = bb + 1;
                                }
                                if (bb % 2 === 1) {
                                    return true;
                                }
                                return false;
                            },
                            name      = "";
                        spacer();
                        attrs.push({});
                        jscom.push(false);
                        linen.push(line);
                        if (linepreserve > 0) {
                            presv.push(true);
                        } else {
                            presv.push(false);
                        }
                        if (ext === true) {
                            name = tagName(token[token.length - 1]);
                        }
                        for (a = a; a < c; a = a + 1) {
                            if (b[a] === "\n") {
                                line = line + 1;
                            }
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
                                    }
                                    end = b
                                        .slice(a, a + 10)
                                        .join("")
                                        .toLowerCase();
                                    if (name === "cfscript" && end === "</cfscript") {
                                        a   = a - 1;
                                        ext = false;
                                        if (lex.length < 1) {
                                            attrs.pop();
                                            jscom.pop();
                                            linen.pop();
                                            presv.pop();
                                            return lines.pop();
                                        }
                                        token.push(lex.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""));
                                        stack.push(parent[parent.length - 1][0]);
                                        begin.push(parent[parent.length - 1][1]);
                                        return types.push("cfscript");
                                    }
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
                                                attrs.pop();
                                                jscom.pop();
                                                linen.pop();
                                                presv.pop();
                                                return lines.pop();
                                            }
                                            token.push(lex.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""));
                                            stack.push(parent[parent.length - 1][0]);
                                            begin.push(parent[parent.length - 1][1]);
                                            return types.push("script");
                                        }
                                    }
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
                                                attrs.pop();
                                                jscom.pop();
                                                linen.pop();
                                                presv.pop();
                                                return lines.pop();
                                            }
                                            token.push(lex.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""));
                                            stack.push(parent[parent.length - 1][0]);
                                            begin.push(parent[parent.length - 1][1]);
                                            types.push("style");
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
                            if (square === true && b[a] === "]") {
                                a = a - 1;
                                spacer();
                                if (options.content === true) {
                                    token.push("text");
                                } else if (options.textpreserve === true) {
                                    token.push(minspace + lex.join(""));
                                    lines[lines.length - 1] = 0;
                                } else if (linepreserve > 0) {
                                    token.push(minspace + lex.join("").replace(/(\s+)$/, tailSpace));
                                    lines[lines.length - 1] = 0;
                                } else {
                                    token.push(lex.join("").replace(/(\s+)$/, tailSpace).replace(/\s+/g, " "));
                                }
                                stack.push(parent[parent.length - 1][0]);
                                begin.push(parent[parent.length - 1][1]);
                                return types.push("content");
                            }

                            if (ext === false && lex.length > 0 && ((b[a] === "<" && b[a + 1] !== "=" && (/\s|\d/).test(b[a + 1]) === false) || (b[a] === "[" && b[a + 1] === "%") || (b[a] === "{" && (options.jsx === true || options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")))) {
                                if (options.dustjs === true && b[a] === "{" && b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                                    a = a + 6;
                                    if (options.content === true) {
                                        token.push("text");
                                    } else if (options.textpreserve === true) {
                                        token.push(minspace + lex.join(""));
                                        lines[lines.length - 1] = 0;
                                    } else {
                                        token.push(lex.join("").replace(/(\s+)$/, tailSpace).replace(/\s+/g, " "));
                                    }
                                    types.push("content");
                                    spacer();
                                    attrs.push({});
                                    jscom.push(false);
                                    linen.push(line);
                                    presv.push(false);
                                    token.push("{:else}");
                                    stack.push(parent[parent.length - 1][0]);
                                    begin.push(parent[parent.length - 1][1]);
                                    return types.push("template_else");
                                }
                                a = a - 1;
                                if (options.content === true) {
                                    token.push("text");
                                } else if (options.textpreserve === true) {
                                    token.push(minspace + lex.join(""));
                                    lines[lines.length - 1] = 0;
                                } else if (linepreserve > 0) {
                                    token.push(minspace + lex.join("").replace(/(\s+)$/, tailSpace));
                                    lines[lines.length - 1] = 0;
                                } else {
                                    token.push(lex.join("").replace(/(\s+)$/, tailSpace).replace(/\s+/g, " "));
                                }
                                stack.push(parent[parent.length - 1][0]);
                                begin.push(parent[parent.length - 1][1]);
                                return types.push("content");
                            }
                            lex.push(b[a]);
                        }
                        spacer();
                        if (options.content === true) {
                            token.push("text");
                        } else if (options.textpreserve === true) {
                            token.push(minspace + lex.join(""));
                            lines[lines.length - 1] = 0;
                        } else {
                            token.push(lex.join("").replace(/(\s+)$/, tailSpace));
                        }
                        stack.push(parent[parent.length - 1][0]);
                        begin.push(parent[parent.length - 1][1]);
                        return types.push("content");
                    };

                for (a = 0; a < c; a = a + 1) {
                    if ((/\s/).test(b[a]) === true) {
                        space = space + b[a];
                        if (b[a] === "\n") {
                            line = line + 1;
                        }
                    } else if (ext === true) {
                        content();
                    } else if (b[a] === "<") {
                        tag("");
                    } else if (b[a] === "[" && b[a + 1] === "%") {
                        tag("%]");
                    } else if (b[a] === "{" && (options.jsx === true || options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                        tag("");
                    } else if (b[a] === "]" && sgmlflag > 0) {
                        tag("]>");
                    } else if (b[a] === "-" && b[a + 1] === "-" && b[a + 2] === "-" && options.jekyll === true) {
                        tag("---");
                    } else if (b[a] === "#" && options.apacheVelocity === true && (/\d/).test(b[a + 1]) === false && (/\s/).test(b[a + 1]) === false && ((/\w/).test(b[a + 1]) === true || b[a + 1] === "*" || b[a + 1] === "#" || (b[a + 1] === "[" && b[a + 2] === "["))) {
                        tag("");
                    } else if (b[a] === "$" && options.apacheVelocity === true && (/\d/).test(b[a + 1]) === false && (/\s/).test(b[a + 1]) === false && b[a + 1] !== "$" && b[a + 1] !== "=" && b[a + 1] !== "[") {
                        tag("");
                    } else {
                        content();
                    }
                }
                lines[0] = 0;
            }());

            return {
                attrs: attrs,
                begin: begin,
                jscom: jscom,
                lines: lines,
                presv: presv,
                stack: stack,
                token: token,
                types: types
            }
        };
        lexer.script = function parser_script(source) {
            var sourcemap = [
                    0, ""
                ],
                objsortop = false,
                json      = (options.lang === "json"),
                attrs     = [],
                begin     = [],
                jscom     = [],
                lines     = [],
                presv     = [],
                stack     = [],
                token     = [],
                types     = [],
                error     = [],
                scolon    = 0,
                result    = "";
            (function parser_script_options() {
                var styleguide  = {},
                    brace_style = {};
                if (options.mode !== "analysis" && source.indexOf("Error: no") < 0) {
                    source = source + " ";
                }
                options.titanium                        = (options.titanium === true || options.titanium === "true")
                    ? (function parser_script_options_titanium() {
                        options.correct  = false;
                        options.titanium = true;
                        token.push("x{");
                        types.push("start");
                        lines.push(0);
                        stack.push("global");
                        begin.push(0);
                        return true;
                    }())
                    : false;
                styleguide.airbnb                       = function parser_script_options_styleairbnb() {
                    options.bracepadding = true;
                    options.correct      = true;
                    options.endcomma     = "always";
                    options.inchar       = " ";
                    options.insize       = 2;
                    options.preserve     = 1;
                    options.quoteConvert = "single";
                    options.varword      = "each";
                    options.wrap         = 80;
                };
                styleguide.crockford                    = function parser_script_options_stylecrockford() {
                    options.bracepadding  = false;
                    options.correct       = true;
                    options.elseline      = false;
                    options.endcomma      = "never";
                    options.inchar        = " ";
                    options.insize        = 4;
                    options.nocaseindent  = true;
                    options.nochainindent = false;
                    options.space         = true;
                    options.varword       = "each";
                };
                styleguide.google                       = function parser_script_options_stylegoogle() {
                    options.correct      = true;
                    options.inchar       = " ";
                    options.insize       = 4;
                    options.preserve     = 1;
                    options.quoteConvert = "single";
                    options.wrap         = -1;
                };
                styleguide.grunt                        = function parser_script_options_stylegrunt() {
                    options.inchar       = " ";
                    options.insize       = 2;
                    options.quoteConvert = "single";
                    options.varword      = "each";
                };
                styleguide.jquery                       = function parser_script_options_stylejquery() {
                    options.bracepadding = true;
                    options.correct      = true;
                    options.inchar       = "\u0009";
                    options.insize       = 1;
                    options.quoteConvert = "double";
                    options.varword      = "each";
                    options.wrap         = 80;
                };
                styleguide.jslint                       = styleguide.crockford;
                styleguide.mrdoobs                      = function parser_script_options_stylemrdoobs() {
                    options.braceline    = true;
                    options.bracepadding = true;
                    options.correct      = true;
                    options.inchar       = "\u0009";
                    options.insize       = 1;
                };
                styleguide.mediawiki                    = function parser_script_options_stylemediawiki() {
                    options.bracepadding = true;
                    options.correct      = true;
                    options.inchar       = "\u0009";
                    options.insize       = 1;
                    options.preserve     = 1;
                    options.quoteConvert = "single";
                    options.space        = false;
                    options.wrap         = 80;
                };
                styleguide.meteor                       = function parser_script_options_stylemeteor() {
                    options.correct = true;
                    options.inchar  = " ";
                    options.insize  = 2;
                    options.wrap    = 80;
                };
                styleguide.yandex                       = function parser_script_options_styleyandex() {
                    options.bracepadding = false;
                    options.correct      = true;
                    options.quoteConvert = "single";
                    options.varword      = "each";
                };
                brace_style.collapse                    = function parser_script_options_collapse() {
                    options.braceline    = false;
                    options.bracepadding = false;
                    options.braces       = false;
                    options.formatObject = "indent";
                    options.neverflatten = true;
                };
                brace_style["collapse-preserve-inline"] = function parser_script_options_collapseInline() {
                    options.braceline    = false;
                    options.bracepadding = true;
                    options.braces       = false;
                    options.formatObject = "inline";
                    options.neverflatten = false;
                };
                brace_style.expand                      = function parser_script_options_expand() {
                    options.braceline    = false;
                    options.bracepadding = false;
                    options.braces       = true;
                    options.formatObject = "indent";
                    options.neverflatten = true;
                };
                if (styleguide[options.styleguide] !== undefined) {
                    styleguide[options.styleguide]();
                }
                if (brace_style[options.brace_style] !== undefined) {
                    brace_style[options.brace_style]();
                }
                if (json === true) {
                    options.wrap = 0;
                }
            }());

            (function parser_script_tokenize() {
                var a              = 0,
                    b              = source.length,
                    c              = options
                        .source
                        .split(""),
                    ltoke          = "",
                    ltype          = "",
                    lword          = [],
                    brace          = [],
                    pword          = [],
                    lengtha        = 0,
                    lengthb        = 0,
                    wordTest       = -1,
                    paren          = -1,
                    classy         = [],
                    stacklist      = [
                        ["global", 0]
                    ],
                    tempstore      = [],
                    pstack         = [],
                    //depth and status of templateStrings
                    templateString = [],
                    //identify variable declarations
                    vart           = {
                        count: [],
                        index: [],
                        len  : -1,
                        word : []
                    },
                    //operations for start types: (, [, {
                    start          = function parser_script_tokenize_startInit() {
                        return;
                    },
                    //peek at whats up next
                    nextchar       = function parser_script_tokenize_nextchar(len, current) {
                        var cc    = 0,
                            dd    = "",
                            front = (current === true)
                                ? a
                                : a + 1;
                        if (typeof len !== "number" || len < 1) {
                            len = 1;
                        }
                        if (c[a] === "/") {
                            if (c[a + 1] === "/") {
                                dd = "\n";
                            } else if (c[a + 1] === "*") {
                                dd = "/";
                            }
                        }
                        for (cc = front; cc < b; cc = cc + 1) {
                            if ((/\s/).test(c[cc]) === false) {
                                if (c[cc] === "/") {
                                    if (dd === "") {
                                        if (c[cc + 1] === "/") {
                                            dd = "\n";
                                        } else if (c[cc + 1] === "*") {
                                            dd = "/";
                                        }
                                    } else if (dd === "/" && c[cc - 1] === "*") {
                                        dd = "";
                                    }
                                }
                                if (dd === "" && c[cc - 1] + c[cc] !== "*/") {
                                    return c
                                        .slice(cc, cc + len)
                                        .join("");
                                }
                            } else if (dd === "\n" && c[cc] === "\n") {
                                dd = "";
                            }
                        }
                        return "";
                    },
                    //cleans up improperly applied ASI
                    asifix         = function parser_script_tokenize_asifix() {
                        var len = types.length;
                        do {
                            len = len - 1;
                        } while (
                            len > 0 && (types[len] === "comment" || types[len] === "comment-inline")
                        );
                        if (token[len] === "from") {
                            len = len - 2;
                        }
                        if (token[len] === "x;") {
                            token.splice(len, 1);
                            types.splice(len, 1);
                            lines.splice(len, 1);
                            stack.splice(len, 1);
                            begin.splice(len, 1);
                        }
                    },
                    //determine the definition of containment by stack
                    stackPush      = function parser_script_tokenize_stackPush() {
                        // * block      : if, for, while, catch, function, class, map
                        // * immediates : else, do, try, finally, switch
                        // * paren based: method, expression, paren
                        // * data       : array, object
                        var last  = 0,
                            aa    = 0,
                            wordx = "",
                            wordy = "",
                            bpush = false;
                        lengtha = token.length;
                        last    = lengtha - 1;
                        aa      = last - 1;
                        wordx   = token[aa];
                        wordy   = (stack[aa] === undefined)
                            ? ""
                            : token[begin[aa] - 1];
                        if (types[aa] === "comment" || types[aa] === "comment-inline") {
                            do {
                                aa = aa - 1;
                            } while (aa > 0 && (types[aa] === "comment" || types[aa] === "comment-inline"));
                            wordx = token[aa];
                        }
                        if ((token[last] === "{" || token[last] === "x{") && ((wordx === "else" && token[last] !== "if") || wordx === "do" || wordx === "try" || wordx === "finally" || wordx === "switch")) {
                            stack.push(wordx);
                        } else if (token[last] === "{" || token[last] === "x{") {
                            if (lengtha === 1 && options.jsx === true) {
                                stack.push("global");
                            } else if (classy[classy.length - 1] === 0 && wordx !== "return") {
                                classy.pop();
                                stack.push("class");
                            } else if (token[aa - 1] === "class") {
                                stack.push("class");
                            } else if (token[aa] === "]" && token[aa - 1] === "[") {
                                stack.push("array");
                            } else if (types[aa] === "word" && (types[aa - 1] === "word" || (token[aa - 1] === "?" && types[aa - 2] === "word")) && token[aa] !== "in" && token[aa - 1] !== "export" && token[aa - 1] !== "import") {
                                stack.push("map");
                            } else if (stack[aa] === "method" && types[aa] === "end" && types[begin[aa] - 1] === "word" && token[begin[aa] - 2] === "new") {
                                stack.push("initializer");
                            } else if (token[last] === "{" && (wordx === ")" || wordx === "x)") && (types[begin[aa] - 1] === "word" || token[begin[aa] - 1] === "]")) {
                                if (wordy === "if") {
                                    stack.push("if");
                                } else if (wordy === "for") {
                                    stack.push("for");
                                } else if (wordy === "while") {
                                    stack.push("while");
                                } else if (wordy === "class") {
                                    stack.push("class");
                                } else if (wordy === "switch" || token[begin[aa] - 1] === "switch") {
                                    stack.push("switch");
                                } else if (wordy === "catch") {
                                    stack.push("catch");
                                } else {
                                    stack.push("function");
                                }
                            } else if (token[last] === "{" && (wordx === ";" || wordx === "x;")) {
                                //ES6 block
                                stack.push("block");
                            } else if (token[last] === "{" && token[aa] === ":" && stack[aa] === "switch") {
                                //ES6 block
                                stack.push("block");
                            } else if (token[aa - 1] === "import" || token[aa - 2] === "import" || token[aa - 1] === "export" || token[aa - 2] === "export") {
                                stack.push("object");
                            } else if (wordx === ")" && (pword[0] === "function" || pword[0] === "if" || pword[0] === "for" || pword[0] === "class" || pword[0] === "while" || pword[0] === "switch" || pword[0] === "catch")) {
                                // if preceeded by a paren the prior containment is preceeded by a keyword if
                                // (...) {
                                stack.push(pword[0]);
                            } else if (stack[aa] === "notation") {
                                //if following a TSX array type declaration
                                stack.push("function");
                            } else if ((types[aa] === "literal" || types[aa] === "word") && types[aa - 1] === "word" && token[begin[aa] - 1] !== "for") {
                                //if preceed by a word and either string or word public class {
                                stack.push("function");
                            } else if (stacklist.length > 0 && token[aa] !== ":" && stacklist[stacklist.length - 1][0] === "object" && (
                                token[begin[aa] - 2] === "{" || token[begin[aa] - 2] === ","
                            )) {
                                // if an object wrapped in some containment which is itself preceeded by a curly
                                // brace or comma var a={({b:{cat:"meow"}})};
                                stack.push("function");
                            } else if (types[pword[1] - 1] === "markup" && token[pword[1] - 3] === "function") {
                                //checking for TSX function using an angle brace name
                                stack.push("function");
                            } else if (wordx === "=>") {
                                //checking for fat arrow assignment
                                stack.push("function");
                            } else if (wordx === ")" && stack[aa] === "method" && types[begin[aa] - 1] === "word") {
                                stack.push("function");
                            } else if (types[last - 1] === "word" && token[last] === "{" && token[last - 1] !== "return" && token[last - 1] !== "in" && token[last - 1] !== "import" && token[last - 1] !== "const" && token[last - 1] !== "let" && token[last - 1] !== "") {
                                //ES6 block
                                stack.push("block");
                            } else {
                                stack.push("object");
                            }
                        } else if (token[last] === "[") {
                            if ((/\s/).test(c[a - 1]) === true && types[aa] === "word" && wordx !== "return" && options.twig === false) {
                                stack.push("notation");
                            } else {
                                stack.push("array");
                            }
                        } else if (token[last] === "(" || token[last] === "x(") {
                            if (types[aa] === "generic") {
                                stack.push("method");
                            } else if (token[aa] === "}" && stack[aa] === "function") {
                                stack.push("method");
                            } else if (wordx === "if" || wordx === "for" || wordx === "function" || wordx === "class" || wordx === "while" || wordx === "catch" || wordx === "switch" || wordx === "with") {
                                stack.push("expression");
                            } else if ((types[aa] === "word" && wordx !== "return") || (wordx === "}" && (stack[aa] === "function" || stack[aa] === "class"))) {
                                stack.push("method");
                            } else {
                                stack.push("paren");
                            }
                        } else if (ltoke === ":" && types[aa] === "word" && token[aa - 1] === "[") {
                            stack[aa]     = "attribute";
                            stack[aa - 1] = "attribute";
                            stack.push("attribute");
                            stacklist[stacklist.length - 1][0] = "attribute";
                        } else if (stacklist.length === 0) {
                            stack.push("global");
                            begin.push(0);
                            bpush = true;
                        } else {
                            stack.push(stacklist[stacklist.length - 1][0]);
                            begin.push(stacklist[stacklist.length - 1][1]);
                            bpush = true;
                        }
                        if (bpush === false) {
                            begin.push(last);
                        }
                    },
                    tokenpop       = function parser_script_tokenize_tokenpop() {
                        lengtha   = lengtha - 1;
                        lengthb   = lengthb - 1;
                        tempstore = [token.pop(), types.pop(), lines.pop(), stack.pop(), begin.pop()];
                    },
                    //reinsert the prior popped token
                    temppush       = function parser_script_tokenize_temppush() {
                        token.push(tempstore[0]);
                        types.push(tempstore[1]);
                        lines.push(tempstore[2]);
                        stack.push(tempstore[3]);
                        begin.push(tempstore[4]);
                        lengtha = lengtha + 1;
                    },
                    //populate various parallel arrays
                    tokenpush      = function parser_script_tokenize_tokenpush(comma, lin) {
                        if (comma === true) {
                            token.push(",");
                            types.push("separator");
                        } else {
                            token.push(ltoke);
                            types.push(ltype);
                        }
                        attrs.push({});
                        jscom.push(false);
                        presv.push(false);
                        lengtha = token.length;
                        lines.push(lin);
                        stackPush();
                    },
                    //inserts ending curly brace
                    blockinsert    = function parser_script_tokenize_blockinsert() {
                        var next = nextchar(5, false),
                            g    = lengtha - 1;
                        if (json === true) {
                            return;
                        }
                        if (stack[lengtha - 1] === "do" && next === "while" && token[lengtha - 1] === "}") {
                            return;
                        }
                        next = next.slice(0, 4);
                        if (ltoke === ";" && token[g - 1] === "x{") {
                            //to prevent the semicolon from inserting between the braces --> while (x) {};
                            tokenpop();
                            ltoke = "x}";
                            ltype = "end";
                            tokenpush(false, 0);
                            brace.pop();
                            pstack = stacklist.pop();
                            ltoke  = ";";
                            ltype  = "end";
                            temppush();
                            return;
                        }
                        ltoke = "x}";
                        ltype = "end";
                        if (token[lengtha - 1] === "x}") {
                            return;
                        }
                        if (stack[lengtha - 1] === "if" && (token[lengtha - 1] === ";" || token[lengtha - 1] === "x;") && next === "else") {
                            tokenpush(false, 0);
                            brace.pop();
                            pstack = stacklist.pop();
                            return;
                        }
                        do {
                            tokenpush(false, 0);
                            brace.pop();
                            pstack = stacklist.pop();
                        } while (brace[brace.length - 1] === "x{");
                    },
                    //remove "vart" object data
                    vartpop        = function parser_script_tokenize_vartpop() {
                        vart
                            .count
                            .pop();
                        vart
                            .index
                            .pop();
                        vart
                            .word
                            .pop();
                        vart.len = vart.len - 1;
                    },
                    logError       = function parser_script_tokenize_logError(message, start) {
                        var f = a,
                            g = types.length;
                        if (error.length > 0) {
                            return;
                        }
                        error.push(message);
                        do {
                            f = f - 1;
                        } while (c[f] !== "\n" && f > 0);
                        error.push(c.slice(f, start).join(""));
                        if (g > 1) {
                            do {
                                g = g - 1;
                            } while (g > 0 && types[g] !== "comment");
                        }
                        if (g > -1 && g < token.length && token[g].indexOf("//") === 0 && error[1].replace(/^\s+/, "").indexOf(token[g + 1]) === 0 && (token[g].split("\"").length % 2 === 1 || token[g].split("'").length % 2 === 1)) {
                            error = [
                                message, token[g] + error[1]
                            ];
                        } else {
                            error = [
                                message, error[1]
                            ];
                        }
                    },
                    //A tokenizer for keywords, reserved words, and variables
                    word           = function parser_script_tokenize_word() {
                        var f        = wordTest,
                            g        = 1,
                            build    = [],
                            output   = "",
                            nextitem = "",
                            elsefix  = function parser_script_tokenize_word_elsefix() {
                                brace.push("x{");
                                stacklist.push(["else", lengtha]);
                                token.splice(lengtha - 3, 1);
                                types.splice(lengtha - 3, 1);
                                lines.splice(lengtha - 3, 1);
                                stack.splice(lengtha - 3, 1);
                                begin.splice(lengtha - 3, 1);
                            };
                        do {
                            build.push(c[f]);
                            if (c[f] === "\\") {
                                logError("Illegal escape in JavaScript", a);
                            }
                            f = f + 1;
                        } while (f < a);
                        output   = build.join("");
                        wordTest = -1;
                        if (types.length > 1 && output === "function" && token[lengtha - 1] === "(" && (token[token.length - 2] === "{" || token[token.length - 2] === "x{")) {
                            types[types.length - 1] = "start";
                        }
                        if (types.length > 2 && output === "function" && ltoke === "(" && (token[token.length - 2] === "}" || token[token.length - 2] === "x}")) {
                            if (token[token.length - 2] === "}") {
                                for (f = token.length - 3; f > -1; f = f - 1) {
                                    if (types[f] === "end") {
                                        g = g + 1;
                                    } else if (types[f] === "start" || types[f] === "end") {
                                        g = g - 1;
                                    }
                                    if (g === 0) {
                                        break;
                                    }
                                }
                                if (token[f] === "{" && token[f - 1] === ")") {
                                    g = 1;
                                    for (f = f - 2; f > -1; f = f - 1) {
                                        if (types[f] === "end") {
                                            g = g + 1;
                                        } else if (types[f] === "start" || types[f] === "end") {
                                            g = g - 1;
                                        }
                                        if (g === 0) {
                                            break;
                                        }
                                    }
                                    if (token[f - 1] !== "function" && token[f - 2] !== "function") {
                                        types[types.length - 1] = "start";
                                    }
                                }
                            } else {
                                types[types.length - 1] = "start";
                            }
                        }
                        if (options.correct === true && (output === "Object" || output === "Array") && c[a + 1] === "(" && c[a + 2] === ")" && token[lengtha - 2] === "=" && token[lengtha - 1] === "new") {
                            if (output === "Object") {
                                token[lengtha - 1]                 = "{";
                                ltoke                              = "}";
                                stack[a - 1]                       = "object";
                                stacklist[stacklist.length - 1][0] = "object";
                            } else {
                                token[lengtha - 1]                 = "[";
                                ltoke                              = "]";
                                stack[a - 1]                       = "array";
                                stacklist[stacklist.length - 1][0] = "array";
                            }
                            types[lengtha - 1] = "start";
                            ltype              = "end";
                            c[a + 1]           = "";
                            c[a + 2]           = "";
                            a                  = a + 2;
                        } else {
                            g = types.length - 1;
                            f = g;
                            if (options.varword !== "none" && (output === "var" || output === "let" || output === "const")) {
                                if (types[g] === "comment" || types[g] === "comment-inline") {
                                    do {
                                        g = g - 1;
                                    } while (g > 0 && (types[g] === "comment" || types[g] === "comment-inline"));
                                }
                                if (options.varword === "list" && vart.len > -1 && vart.index[vart.len] === g && output === vart.word[vart.len]) {
                                    ltoke                = ",";
                                    ltype                = "separator";
                                    token[g]             = ltoke;
                                    types[g]             = ltype;
                                    vart.count[vart.len] = 0;
                                    vart.index[vart.len] = g;
                                    vart.word[vart.len]  = output;
                                    return;
                                }
                                vart.len = vart.len + 1;
                                vart
                                    .count
                                    .push(0);
                                vart
                                    .index
                                    .push(g);
                                vart
                                    .word
                                    .push(output);
                                g = f;
                            } else if (vart.len > -1 && output !== vart.word[vart.len] && token.length === vart.index[vart.len] + 1 && token[vart.index[vart.len]] === ";" && ltoke !== vart.word[vart.len] && options.varword === "list") {
                                vartpop();
                            }
                            if (output === "else" && (types[g] === "comment" || types[g] === "comment-inline")) {
                                do {
                                    f = f - 1;
                                } while (f > -1 && (types[f] === "comment" || types[f] === "comment-inline"));
                                if (token[f] === "x;" && (token[f - 1] === "}" || token[f - 1] === "x}")) {
                                    token.splice(f, 1);
                                    types.splice(f, 1);
                                    lines.splice(f, 1);
                                    stack.splice(f, 1);
                                    begin.splice(f, 1);
                                    g = g - 1;
                                    f = f - 1;
                                }
                                do {
                                    build = [
                                        token[g], types[g], lines[g], stack[g], begin[g]
                                    ];
                                    tokenpop();
                                    token.splice(g - 3, 0, build[0]);
                                    types.splice(g - 3, 0, build[1]);
                                    lines.splice(g - 3, 0, build[2]);
                                    stack.splice(g - 3, 0, build[3]);
                                    begin.splice(g - 3, 0, build[4]);
                                    f = f + 1;
                                } while (f < g);
                            }
                            if (output === "from" && token[lengtha - 1] === "x;" && token[lengtha - 2] === "}") {
                                asifix();
                            }
                            if (output === "while" && token[lengtha - 1] === "x;" && token[lengtha - 2] === "}") {
                                (function parser_script_tokenize_word_whilefix() {
                                    var d = 0,
                                        e = 0;
                                    for (e = lengtha - 3; e > -1; e = e - 1) {
                                        if (types[e] === "end") {
                                            d = d + 1;
                                        } else if (types[e] === "start") {
                                            d = d - 1;
                                        }
                                        if (d < 0) {
                                            if (token[e] === "{" && token[e - 1] === "do") {
                                                asifix();
                                            }
                                            return;
                                        }
                                    }
                                }());
                            }
                            ltoke = output;
                            ltype = "word";
                            if (output === "from" && token[lengtha - 1] === "}") {
                                asifix();
                            }
                        }
                        tokenpush(false, 0);
                        if (output === "class") {
                            classy.push(0);
                        }
                        if (output === "do") {
                            nextitem = nextchar(1, true);
                            if (nextitem !== "{") {
                                ltoke = "x{";
                                ltype = "start";
                                brace.push("x{");
                                tokenpush(false, 0);
                                stacklist.push([
                                    "do", lengtha - 1
                                ]);
                            }
                        }
                        if (output === "else") {
                            nextitem = nextchar(2, true);
                            if (nextitem !== "if" && nextitem.charAt(0) !== "{") {
                                ltoke = "x{";
                                ltype = "start";
                                brace.push("x{");
                                tokenpush(false, 0);
                                stacklist.push([
                                    "else", lengtha - 1
                                ]);
                            }
                            if (token[lengtha - 3] === "x}") {
                                if (token[lengtha - 2] === "else") {
                                    if (token[lengtha - 4] === "x}" && pstack[0] !== "if" && stack[stack.length - 2] === "else") {
                                        elsefix();
                                    } else if (token[lengtha - 4] === "}" && stack[lengtha - 4] === "if" && pstack[0] === "if" && token[pstack[1] - 1] !== "if" && token[begin[lengtha - 3]] === "x{") {
                                        //fixes when "else" is following a block that isn't "if"
                                        elsefix();
                                    }
                                } else if (token[lengtha - 2] === "x}" && stack[stack.length - 2] === "if") {
                                    elsefix();
                                }
                            }
                        }
                        if ((output === "for" || output === "if" || output === "switch" || output === "catch") && options.twig === false && token[lengtha - 2] !== ".") {
                            nextitem = nextchar(1, true);
                            if (nextitem !== "(") {
                                paren = lengtha - 1;
                                start("x(");
                            }
                        }
                    },
                    //sort object properties
                    objSort        = function parser_script_tokenize_objSort() {
                        var cc        = 0,
                            dd        = 0,
                            ee        = 0,
                            startlen  = token.length - 1,
                            behind    = startlen,
                            keys      = [],
                            keylen    = 0,
                            keyend    = 0,
                            front     = 0,
                            sort      = function parser_script_tokenize_objSort_sort(x, y) {
                                var xx = x[0],
                                    yy = y[0];
                                if (types[xx] === "comment" || types[xx] === "comment-inline") {
                                    do {
                                        xx = xx + 1;
                                    } while (
                                        xx < startlen && (types[xx] === "comment" || types[xx] === "comment-inline")
                                    );
                                }
                                if (types[yy] === "comment" || types[yy] === "comment-inline") {
                                    do {
                                        yy = yy + 1;
                                    } while (
                                        yy < startlen && (types[yy] === "comment" || types[yy] === "comment-inline")
                                    );
                                }
                                if (token[xx].toLowerCase() > token[yy].toLowerCase()) {
                                    return 1;
                                }
                                return -1;
                            },
                            commaTest = true,
                            pairToken = [],
                            pairTypes = [],
                            pairLines = [],
                            pairStack = [],
                            pairBegin = [];
                        if (token[behind] === "," || types[behind] === "comment") {
                            do {
                                behind = behind - 1;
                            } while (behind > 0 && (token[behind] === "," || types[behind] === "comment"));
                        }
                        for (cc = behind; cc > -1; cc = cc - 1) {
                            if (types[cc] === "end") {
                                dd = dd + 1;
                            }
                            if (types[cc] === "start") {
                                dd = dd - 1;
                            }
                            if (dd === 0) {
                                if (types[cc].indexOf("template") > -1) {
                                    return;
                                }
                                if (token[cc] === ",") {
                                    commaTest = true;
                                    front     = cc + 1;
                                }
                                if (commaTest === true && token[cc] === "," && front < behind) {
                                    if (token[behind] !== ",") {
                                        behind = behind + 1;
                                    }
                                    if (types[front] === "comment-inline") {
                                        front = front + 1;
                                    }
                                    keys.push([front, behind]);
                                    behind = front - 1;
                                }
                            }
                            if (dd < 0 && cc < startlen) {
                                if (keys.length > 0 && keys[keys.length - 1][0] > cc + 1) {
                                    ee = keys[keys.length - 1][0];
                                    if (types[ee - 1] !== "comment-inline") {
                                        ee = ee - 1;
                                    }
                                    keys.push([
                                        cc + 1,
                                        ee
                                    ]);
                                }
                                if (token[cc - 1] === "=" || token[cc - 1] === ":" || token[cc - 1] === "(" || token[cc - 1] === "[" || token[cc - 1] === "," || types[cc - 1] === "word" || cc === 0) {
                                    if (keys.length > 1) {
                                        keys.sort(sort);
                                        keylen    = keys.length;
                                        commaTest = false;
                                        for (dd = 0; dd < keylen; dd = dd + 1) {
                                            keyend = keys[dd][1];
                                            if (lines[keys[dd][0] - 1] > 1 && pairLines.length > 0) {
                                                pairLines[pairLines.length - 1] = lines[keys[dd][0] - 1];
                                            }
                                            for (ee = keys[dd][0]; ee < keyend; ee = ee + 1) {
                                                pairToken.push(token[ee]);
                                                pairTypes.push(types[ee]);
                                                pairLines.push(lines[ee]);
                                                pairStack.push(stack[ee]);
                                                pairBegin.push(begin[ee]);

                                                //remove extra commas
                                                if (token[ee] === ",") {
                                                    commaTest = true;
                                                } else if (token[ee] !== "," && types[ee] !== "comment" && types[ee] !== "comment-inline") {
                                                    commaTest = false;
                                                }
                                            }
                                            if (commaTest === false) {
                                                ee = pairTypes.length - 1;
                                                if (pairTypes[ee] === "comment" || pairTypes[ee] === "comment-inline") {
                                                    do {
                                                        ee = ee - 1;
                                                    } while (
                                                        ee > 0 && (pairTypes[ee] === "comment" || pairTypes[ee] === "comment-inline")
                                                    );
                                                }
                                                ee = ee + 1;
                                                pairToken.splice(ee, 0, ",");
                                                pairTypes.splice(ee, 0, "separator");
                                                pairLines.splice(ee, 0, pairLines[ee - 1]);
                                                pairStack.splice(ee, 0, "object");
                                                pairBegin.splice(ee, 0, cc);
                                                pairLines[ee - 1] = 0;
                                            }
                                        }
                                        ee = pairTypes.length;
                                        do {
                                            ee = ee - 1;
                                        } while (
                                            ee > 0 && (pairTypes[ee] === "comment" || pairTypes[ee] === "comment-inline")
                                        );
                                        if (options.endcomma === "never" || options.endcomma === "multiline") {
                                            pairToken.splice(ee, 1);
                                            pairTypes.splice(ee, 1);
                                            pairLines.splice(ee, 1);
                                            pairStack.splice(ee, 1);
                                            pairBegin.splice(ee, 1);
                                        }
                                        keylen = token.length - (cc + 1);
                                        token.splice(cc + 1, keylen);
                                        types.splice(cc + 1, keylen);
                                        lines.splice(cc + 1, keylen);
                                        stack.splice(cc + 1, keylen);
                                        begin.splice(cc + 1, keylen);
                                        token     = token.concat(pairToken);
                                        types     = types.concat(pairTypes);
                                        lines     = lines.concat(pairLines);
                                        stack     = stack.concat(pairStack);
                                        begin     = begin.concat(pairBegin);
                                        lengtha   = token.length;
                                        pairToken = [cc];
                                        for (cc = cc + 1; cc < lengtha; cc = cc + 1) {
                                            if (types[cc] === "start") {
                                                pairToken.push(cc);
                                            }
                                            begin[cc] = pairToken[pairToken.length - 1];
                                            if (types[cc] === "end") {
                                                pairToken.pop();
                                            }
                                        }
                                    } else if (options.endcomma === "always" && types[lengtha - 1] !== "start") {
                                        tokenpush(true, 0);
                                    }
                                }
                                return;
                            }
                        }
                    },
                    slashes        = function parser_script_tokenize_slashes(index) {
                        var slashy = index;
                        do {
                            slashy = slashy - 1;
                        } while (c[slashy] === "\\" && slashy > 0);
                        if ((index - slashy) % 2 === 1) {
                            return true;
                        }
                        return false;
                    }, // commaComment ensures that commas immediately precede comments instead of
                    // immediately follow
                    commaComment   = function parser_script_tokenize_commacomment() {
                        var x = types.length;
                        if (stack[lengtha - 1] === "object" && objsortop === true) {
                            ltoke = ",";
                            ltype = "separator";
                            asifix();
                            tokenpush(false, 0);
                        } else {
                            do {
                                x = x - 1;
                            } while (
                                x > 0 && (types[x - 1] === "comment" || types[x - 1] === "comment-inline")
                            );
                            token.splice(x, 0, ",");
                            types.splice(x, 0, "separator");
                            lines.splice(x, 0, 0);
                            stackPush();
                        }
                    },
                    //injects a comma into the end of arrays for use with endcomma option
                    endCommaArray  = function parser_script_tokenize_endCommaArray() {
                        var d = 0,
                            e = 0;
                        for (d = lengtha; d > 0; d = d - 1) {
                            if (types[d] === "end") {
                                e = e + 1;
                            } else if (types[d] === "start") {
                                e = e - 1;
                            }
                            if (e < 0) {
                                return;
                            }
                            if (e === 0 && token[d] === ",") {
                                return tokenpush(true, 0);
                            }
                        }
                    },
                    //automatic semicolon insertion
                    asi            = function parser_script_tokenize_asi(isEnd) {
                        var len   = token.length - 1,
                            aa    = 0,
                            next  = nextchar(1, false),
                            tokel = token[len],
                            typel = types[len],
                            deepl = stack[len],
                            begnl = begin[len],
                            clist = (stacklist.length === 0)
                                ? ""
                                : stacklist[stacklist.length - 1][0];
                        if (json === true || tokel === ";" || tokel === "," || next === "{" || deepl === "class" || deepl === "map" || deepl === "attribute" || clist === "initializer" || types[begnl - 1] === "generic") {
                            return;
                        }
                        if (((deepl === "global" && typel !== "end") || (typel === "end" && stack[begnl - 1] === "global")) && (next === "" || next === "}") && deepl === stack[lengtha - 2] && options.jsx === true) {
                            return;
                        }
                        if (deepl === "array" && tokel !== "]") {
                            return;
                        }
                        if (typel !== undefined && typel.indexOf("template") > -1) {
                            return;
                        }
                        if (next === ";" && isEnd === false) {
                            return;
                        }
                        if (options.qml === true) {
                            if (typel === "start") {
                                return;
                            }
                            ltoke = "x;";
                            ltype = "separator";
                            tokenpush(false, 0);
                            if (brace[brace.length - 1] === "x{" && nextchar !== "}") {
                                blockinsert();
                            }
                            return;
                        }
                        if (tokel === "}" && (deepl === "function" || deepl === "if" || deepl === "else" || deepl === "for" || deepl === "do" || deepl === "while" || deepl === "switch" || deepl === "class" || deepl === "try" || deepl === "catch" || deepl === "finally" || deepl === "block")) {
                            if (token[begnl - 1] === ")") {
                                aa = begin[begnl - 1] - 1;
                                if (token[aa - 1] === "function") {
                                    aa = aa - 1;
                                }
                                if (stack[aa - 1] === "object" || stack[aa - 1] === "switch") {
                                    return;
                                }
                                if (token[aa - 1] !== "=" && token[aa - 1] !== "return" && token[aa - 1] !== ":") {
                                    return;
                                }
                            } else {
                                return;
                            }
                        }
                        if (typel === "comment" || typel === "comment-inline" || clist === "method" || clist === "paren" || clist === "expression" || clist === "array" || clist === "object" || (clist === "switch" && deepl !== "method" && token[begin[lengtha - 1]] === "(")) {
                            return;
                        }
                        if (stack[lengtha - 1] === "expression" && (token[begin[lengtha - 1] - 1] !== "while" || (token[begin[lengtha - 1] - 1] === "while" && stack[begin[lengtha - 1] - 2] !== "do"))) {
                            return;
                        }
                        if (next !== "" && "=<>+*?|^:&%~,.()]".indexOf(next) > -1 && isEnd === false) {
                            return;
                        }
                        if (typel === "comment" || typel === "comment-inline") {
                            do {
                                len = len - 1;
                            } while (
                                len > 0 && (types[len] === "comment" || types[len] === "comment-inline")
                            );
                            if (len < 1) {
                                return;
                            }
                            tokel = token[len];
                            typel = types[len];
                            deepl = stack[len];
                        }
                        if (tokel === undefined || typel === "start" || typel === "separator" || (typel === "operator" && tokel !== "++" && tokel !== "--") || tokel === "x}" || tokel === "var" || tokel === "let" || tokel === "const" || tokel === "else" || tokel.indexOf("#!/") === 0 || tokel === "instanceof") {
                            return;
                        }
                        if (deepl === "method" && (token[begnl - 1] === "function" || token[begnl - 2] === "function")) {
                            return;
                        }
                        if (options.varword === "list") {
                            vart.index[vart.len] = token.length;
                        }
                        ltoke = ";";
                        ltype = "separator";
                        token.splice(len + 1, 0, "x;");
                        types.splice(len + 1, 0, "separator");
                        lines.splice(len, 0, 0);
                        stackPush();
                        if (brace[brace.length - 1] === "x{" && nextchar !== "}") {
                            blockinsert();
                        }
                    },
                    //convert ++ and -- into "= x +"  and "= x -" in most cases
                    plusplus = function parser_script_tokenize_plusplus() {
                        var store      = [],
                            pre        = true,
                            toke       = "+",
                            tokea      = "",
                            tokeb      = "",
                            tokec      = "",
                            inc        = 0,
                            ind        = 0,
                            walk       = 0,
                            end        = function parser_script_tokenize_plusplus_endInit() {
                                return;
                            },
                            period     = function parser_script_tokenize_plusplus_periodInit() {
                                return;
                            },
                            applyStore = function parser_script_tokenize_plusplus_applyStore() {
                                var x = 0,
                                    y = store[0].length;
                                do {
                                    token.push(store[0][x]);
                                    types.push(store[1][x]);
                                    lines.push(store[2][x]);
                                    stack.push(store[3][x]);
                                    begin.push(store[4][x]);
                                    x = x + 1;
                                } while (x < y);
                            },
                            next       = "";
                        lengtha = token.length;
                        tokea   = token[lengtha - 1];
                        tokeb   = token[lengtha - 2];
                        tokec   = token[lengtha - 3];
                        end     = function parser_script_tokenize_plusplus_end() {
                            walk = begin[walk] - 1;
                            if (types[walk] === "end") {
                                parser_script_tokenize_plusplus_end();
                            } else if (token[walk - 1] === ".") {
                                period();
                            }
                        };
                        period  = function parser_script_tokenize_plusplus_period() {
                            walk = walk - 2;
                            if (types[walk] === "end") {
                                end();
                            } else if (token[walk - 1] === ".") {
                                parser_script_tokenize_plusplus_period();
                            }
                        };
                        if (tokea !== "++" && tokea !== "--" && tokeb !== "++" && tokeb !== "--") {
                            walk = lengtha - 1;
                            if (types[walk] === "end") {
                                end();
                            } else if (token[walk - 1] === ".") {
                                period();
                            }
                        }
                        if (token[walk - 1] === "++" || token[walk - 1] === "--") {
                            if ("startendoperator".indexOf(types[walk - 2]) > -1) {
                                return;
                            }
                            store.push(token.slice(walk));
                            store.push(types.slice(walk));
                            store.push(lines.slice(walk));
                            store.push(stack.slice(walk));
                            store.push(begin.slice(walk));
                            token.splice(walk, lengtha - walk);
                            types.splice(walk, lengtha - walk);
                            lines.splice(walk, lengtha - walk);
                            stack.splice(walk, lengtha - walk);
                            begin.splice(walk, lengtha - walk);
                        } else {
                            if (options.correct === false || (tokea !== "++" && tokea !== "--" && tokeb !== "++" && tokeb !== "--")) {
                                return;
                            }
                            next = nextchar(1, false);
                            if ((tokea === "++" || tokea === "--") && (c[a] === ";" || next === ";" || c[a] === "}" || next === "}" || c[a] === ")" || next === ")")) {
                                toke = stack[lengtha - 1];
                                if (toke === "array" || toke === "method" || toke === "object" || toke === "paren" || toke === "notation" || (token[begin[lengtha - 1] - 1] === "while" && toke !== "while")) {
                                    return;
                                }
                                inc = lengtha - 1;
                                do {
                                    inc = inc - 1;
                                    if (token[inc] === "return") {
                                        return;
                                    }
                                    if (types[inc] === "end") {
                                        do {
                                            inc = begin[inc] - 1;
                                        } while (types[inc] === "end" && inc > 0);
                                    }
                                } while (
                                    inc > 0 && (token[inc] === "." || types[inc] === "word" || types[inc] === "end")
                                );
                                if (token[inc] === "," && c[a] !== ";" && next !== ";" && c[a] !== "}" && next !== "}" && c[a] !== ")" && next !== ")") {
                                    return;
                                }
                                if (types[inc] === "operator") {
                                    if (stack[inc] === "switch" && token[inc] === ":") {
                                        do {
                                            inc = inc - 1;
                                            if (types[inc] === "start") {
                                                ind = ind - 1;
                                                if (ind < 0) {
                                                    break;
                                                }
                                            } else if (types[inc] === "end") {
                                                ind = ind + 1;
                                            }
                                            if (token[inc] === "?" && ind === 0) {
                                                return;
                                            }
                                        } while (inc > 0);
                                    } else {
                                        return;
                                    }
                                }
                                pre = false;
                                if (tokea === "--") {
                                    toke = "-";
                                } else {
                                    toke = "+";
                                }
                            } else if (tokec === "[" || tokec === ";" || tokec === "x;" || tokec === "}" || tokec === "{" || tokec === "(" || tokec === ")" || tokec === "," || tokec === "return") {
                                if (tokea === "++" || tokea === "--") {
                                    if (tokec === "[" || tokec === "(" || tokec === "," || tokec === "return") {
                                        return;
                                    }
                                    if (tokea === "--") {
                                        toke = "-";
                                    }
                                    pre = false;
                                } else if (tokeb === "--" || tokea === "--") {
                                    toke = "-";
                                }
                            } else {
                                return;
                            }
                            if (pre === false) {
                                tokenpop();
                            }
                            walk = lengtha - 1;
                            if (types[walk] === "end") {
                                end();
                            } else if (token[walk - 1] === ".") {
                                period();
                            }
                            store.push(token.slice(walk));
                            store.push(types.slice(walk));
                            store.push(lines.slice(walk));
                            store.push(stack.slice(walk));
                            store.push(begin.slice(walk));
                        }
                        if (pre === true) {
                            token.splice(walk - 1, 1);
                            types.splice(walk - 1, 1);
                            lines.splice(walk - 1, 1);
                            stack.splice(walk - 1, 1);
                            begin.splice(walk - 1, 1);
                            ltoke = "=";
                            ltype = "operator";
                            tokenpush(false, 0);
                            applyStore();
                            ltoke = toke;
                            ltype = "operator";
                            tokenpush(false, 0);
                            ltoke = "1";
                            ltype = "literal";
                            tokenpush(false, 0);
                        } else {
                            ltoke = "=";
                            ltype = "operator";
                            tokenpush(false, 0);
                            applyStore();
                            ltoke = toke;
                            ltype = "operator";
                            tokenpush(false, 0);
                            ltoke = "1";
                            ltype = "literal";
                            tokenpush(false, 0);
                        }
                        ltoke = token[lengtha - 1];
                        ltype = types[lengtha - 1];
                        if (next === "}" && c[a] !== ";") {
                            asi(false);
                        }
                    },
                    //converts "+=" and "-=" to "x = x + 1"
                    plusequal = function parser_script_tokenize_plusequal(op) {
                        var toke       = op.charAt(0),
                            walk       = lengtha - 1,
                            store      = [],
                            end        = function parser_script_tokenize_plusequal_endInit() {
                                return;
                            },
                            period     = function parser_script_tokenize_plusequal_periodInit() {
                                return;
                            },
                            applyStore = function parser_script_tokenize_plusplus_applyStore() {
                                var x = 0,
                                    y = store[0].length;
                                do {
                                    token.push(store[0][x]);
                                    types.push(store[1][x]);
                                    lines.push(store[2][x]);
                                    stack.push(store[3][x]);
                                    begin.push(store[4][x]);
                                    x = x + 1;
                                } while (x < y);
                            };
                        end    = function parser_script_tokenize_plusequal_end() {
                            walk = begin[walk] - 1;
                            if (types[walk] === "end") {
                                parser_script_tokenize_plusequal_end();
                            } else if (token[walk - 1] === ".") {
                                period();
                            }
                        };
                        period = function parser_script_tokenize_plusequal_period() {
                            walk = walk - 2;
                            if (types[walk] === "end") {
                                end();
                            } else if (token[walk - 1] === ".") {
                                parser_script_tokenize_plusequal_period();
                            }
                        };
                        if (types[walk] === "end") {
                            end();
                        } else if (token[walk - 1] === ".") {
                            period();
                        }
                        store.push(token.slice(walk));
                        store.push(types.slice(walk));
                        store.push(lines.slice(walk));
                        store.push(stack.slice(walk));
                        store.push(begin.slice(walk));
                        ltoke = "=";
                        ltype = "operator";
                        tokenpush(false, 0);
                        applyStore();
                        return toke;
                    },
                    //fixes asi location if inserted after an inserted brace
                    asibrace       = function parser_script_tokenize_asibrace() {
                        var aa = token.length;
                        do {
                            aa = aa - 1;
                        } while (aa > -1 && token[aa] === "x}");
                        if (stack[aa] === "else") {
                            return tokenpush(false, 0);
                        }
                        aa = aa + 1;
                        token.splice(aa, 0, ltoke);
                        types.splice(aa, 0, ltype);
                        lines.push(0);
                        stackPush();
                    },
                    //convert double quotes to single or the opposite
                    quoteConvert   = function parser_script_tokenize_quoteConvert(item) {
                        var dub   = (options.quoteConvert === "double"),
                            qchar = (dub === true)
                                ? "\""
                                : "'";
                        item = item.slice(1, item.length - 1);
                        if (dub === true) {
                            item = item.replace(/"/g, "'");
                        } else {
                            item = item.replace(/'/g, "\"");
                        }
                        return qchar + item + qchar;
                    },
                    //manage comment wrapping
                    commentwrap    = function parser_script_tokenize_commentwrap(comment, line) {
                        var prior        = "",
                            ptype        = "",
                            xblock       = (function parser_script_tokenize_commentLine_xblock() {
                                if (token[lengtha - 1] !== "x}" || (lines[lengtha - 1] > 0 && nextchar(4, false) !== "else") || (token[lengtha - 1] === "x}" && (token[lengtha - 2] === "}" || token[lengtha - 2] === "x}"))) {
                                    return false;
                                }
                                tokenpop();
                                return true;
                            }()),
                            ind          = 0,
                            vartest      = "",
                            cstart       = (line === true)
                                ? "// "
                                : " * ",
                            empty        = (/^(\/\/\s*)$/),
                            list         = (
                                /^(\/\/\s*(\*|-|@|\=|(\d+(\.|(\s*-))))(?!(\*|-|@|\=|(\d+(\.|(\s*-))))))/
                            ),
                            hrule        = (/^(\/\/\s*---+\s*)$/),
                            remind       = (/^(\/\/\s*((todo)|(note:)))/i),
                            commentSplit = function parser_script_tokenize_commentLine_commentSplit() {
                                var endi    = options.wrap - 3,
                                    starti  = 0,
                                    spacely = (comment.indexOf(" ") > 0),
                                    len     = 0,
                                    block   = [];
                                if (line === true) {
                                    comment = comment.slice(2);
                                    if (spacely === true) {
                                        do {
                                            //split comments by word if possible
                                            len    = comment.length;
                                            starti = 0;
                                            if ((/\s/).test(comment.charAt(0)) === true) {
                                                do {
                                                    starti = starti + 1;
                                                } while (starti < len && (/\s/).test(comment.charAt(starti)) === true);
                                            }
                                            comment = comment.slice(starti);
                                            len     = comment.length;
                                            endi    = (options.wrap - 3);
                                            if ((/\s/).test(comment.slice(0, endi + 1)) === true && endi < len) {
                                                endi = endi + 1;
                                                do {
                                                    endi = endi - 1;
                                                } while (endi > 0 && (/\s/).test(comment.charAt(endi)) === false);
                                            } else if ((/\s/).test(comment) === true && endi < len) {
                                                do {
                                                    endi = endi + 1;
                                                } while (endi < len && (/\s/).test(comment.charAt(endi)) === false);
                                            } else {
                                                endi = len;
                                            }
                                            ltoke = cstart + comment
                                                .slice(0, endi)
                                                .replace(/(\s+)$/, "");
                                            tokenpush(false, 0);
                                            comment = comment.slice(endi);
                                        } while (comment.length > endi);
                                        if (comment !== "") {
                                            len    = comment.length;
                                            starti = 0;
                                            if ((/\s/).test(comment.charAt(0)) === true) {
                                                do {
                                                    starti = starti + 1;
                                                } while (starti < len && (/\s/).test(comment.charAt(starti)) === true);
                                            }
                                            ltoke = cstart + comment.slice(starti);
                                            ltoke = ltoke.replace(/(\s+)$/, "");
                                            tokenpush(false, 0);
                                        }
                                    } else {
                                        if (prior.indexOf("//") === 0 && prior.length < endi && prior.indexOf(" ") === -1 && comment.indexOf(" ") === -1) {
                                            endi               = endi - prior.length;
                                            token[lengtha - 1] = prior + comment.slice(0, endi);
                                            comment            = comment.slice(endi);
                                            endi               = options.wrap;
                                        }
                                        endi = endi - 2;
                                        do {
                                            ltoke = cstart + comment.slice(0, endi);
                                            ltoke = ltoke.replace(/(\s+)$/, "");
                                            tokenpush(false, 0);
                                            comment = comment.slice(endi);
                                        } while (comment.length > endi);
                                        if (comment !== "") {
                                            ltoke = cstart + comment.slice(0, endi);
                                            ltoke = ltoke.replace(/(\s+)$/, "");
                                            tokenpush(false, 0);
                                        }
                                    }
                                } else {
                                    // the functionality for wrapping block comments is written here, but currently
                                    // disabled.  It demands a bit more finesse to prevent violation of JSLint and
                                    // some mutilation of white space styles
                                    if (spacely === true) {
                                        len    = comment.length;
                                        starti = 0;
                                        if ((/\s/).test(comment.charAt(0)) === true) {
                                            do {
                                                starti = starti + 1;
                                            } while (starti < len && (/\s/).test(comment.charAt(starti)) === true);
                                        }
                                        endi = (options.wrap - 3) + starti;
                                        if ((/\s/).test(comment.charAt(endi)) === false && endi < len) {
                                            do {
                                                endi = endi - 1;
                                            } while (endi > starti && (/\s/).test(comment.charAt(endi)) === false);
                                        }
                                        if (endi > 0) {
                                            block.push("/* " + comment.slice(starti, endi));
                                            do {
                                                starti = endi;
                                                if ((/\s/).test(comment.charAt(starti)) === true) {
                                                    do {
                                                        starti = starti + 1;
                                                    } while (starti < len && (/\s/).test(comment.charAt(starti)) === true);
                                                }
                                                endi = (options.wrap - 3) + starti;
                                                if ((/\s/).test(comment.charAt(endi)) === false && endi < len) {
                                                    do {
                                                        endi = endi - 1;
                                                    } while (
                                                        endi > 0 && endi > starti && (/\s/).test(comment.charAt(endi)) === false
                                                    );
                                                }
                                                block.push(cstart + comment.slice(starti, endi).replace(/(\s+)$/, ""));
                                            } while (endi > 0 && endi < len);
                                            block.push(" */");
                                            ltoke = block.join(lf);
                                        } else {
                                            ltoke = "/* " + comment.replace(/(\s+)$/, "") + " */";
                                        }
                                        tokenpush(false, 0);
                                    } else {
                                        len  = comment.length;
                                        endi = options.wrap - 3;
                                        block.push("/* " + comment.slice(0, endi));
                                        do {
                                            starti = endi;
                                            endi   = starti + (options.wrap - 3);
                                            block.push(cstart + comment.slice(starti, endi));
                                        } while (endi < len);
                                        block.push(" */");
                                        ltoke = block.join(lf);
                                        tokenpush(false, 0);
                                    }
                                }
                            };

                        if (lines[lines.length - 1] === 0 && ltype !== "comment" && ltype !== "comment-inline" && options.styleguide !== "mrdoobs") {
                            ltype = "comment-inline";
                        } else {
                            ltype = "comment";
                        }
                        if (options.preserveComment === true) {
                            return tokenpush(false, 0);
                        }
                        if (hrule.test(comment) === true) {
                            if (comment.charAt(2) !== " ") {
                                comment = "// " + comment.slice(2);
                            }
                            ltoke = comment;
                            return tokenpush(false, 0);
                        }
                        lengtha = token.length;
                        if (comment.indexOf("/*global") === 0) {
                            return tokenpush(false, 0);
                        }
                        if (line === true) {
                            comment = comment
                                .replace(/\s\/\//g, " ")
                                .replace(/(\s+)$/, "");
                        } else {
                            if (comment.indexOf("/**") === 0) {
                                return tokenpush(false, 0);
                            }
                            if (comment.indexOf("\n") < 0 && comment.indexOf(":") > 0 && comment.indexOf(",") > 0) {
                                return tokenpush(false, 0);
                            }
                            if ((/\n(\u0020|\t)/).test(comment) === true && ((/\n\u0020\*(\u0020|\/)/).test(comment) === false || (/\n(?!(\u0020\*(\u0020|\/)))/).test(comment) === true)) {
                                return tokenpush(false, 0);
                            }
                            if (comment.length < options.wrap - 3) {
                                return tokenpush(false, 0);
                            }
                            if ((/^(\/\*\u0020)/).test(comment) === true && (/\n\u0020\*\u0020/).test(comment) === true) {
                                comment = comment.replace("/* ", "/*");
                            }
                            comment = comment
                                .replace(/\n\u0020\*\u0020/g, " ")
                                .replace(/\n(\u0020|\t)+/g, "\n");
                            comment = comment.slice(2, comment.length - 2);
                        }
                        if (lengtha > 0) {
                            prior = token[lengtha - 1];
                            ptype = types[lengtha - 1];
                        }
                        if (ltype === "comment" && ptype !== "comment-inline" && options.wrap > 0 && empty.test(comment) === false && (comment.length > options.wrap || prior.indexOf("//") === 0)) {
                            if (lengtha > 0 && token[lengtha - 1].indexOf("//") === 0 && empty.test(token[lengtha - 1]) === false && hrule.test(token[lengtha - 1]) === false && list.test(comment) === false && remind.test(comment) === false) {
                                if (comment.charAt(2) !== " ") {
                                    comment = prior + " " + comment.slice(2);
                                } else {
                                    comment = prior + comment.slice(2);
                                }
                                tokenpop();
                            }
                            if (token[lengtha - 1] === "var" || token[lengtha - 1] === "let" || token[lengtha - 1] === "const") {
                                tokenpop();
                                vartest = token[lengtha - 1];
                            }
                            if (comment.length > options.wrap - 2) {
                                commentSplit();
                            } else {
                                if (line === true) {
                                    ltoke = comment;
                                } else {
                                    ltoke = "/* " + comment
                                        .replace(/^(\s+)/, "")
                                        .replace(/(\s+)$/, "") + " */";
                                }
                                tokenpush(false, 0);
                            }
                            if (vartest !== "") {
                                temppush();
                                ind = lengtha - 1;
                                do {
                                    ind = ind - 1;
                                } while (types[ind] === "comment");
                                lines[ind]         = lines[lengtha - 1];
                                lines[lengtha - 1] = 0;
                            }
                        } else if (options.wrap < 0 && prior.indexOf("//") === 0) {
                            if (comment.charAt(2) !== " ") {
                                token[lengtha - 1] = prior + " " + comment.slice(2);
                            } else {
                                token[lengtha - 1] = prior + comment.slice(2);
                            }
                        } else {
                            if (token[lengtha - 1] === "var" || token[lengtha - 1] === "let" || token[lengtha - 1] === "const") {
                                tokenpop();
                                vartest = token[lengtha - 1];
                            }
                            if (line === true) {
                                ltoke = comment;
                            } else {
                                ltoke = "/* " + comment
                                    .replace(/^(\s+)/, "")
                                    .replace(/(\s+)$/, "") + " */";
                            }
                            tokenpush(false, 0);
                            if (vartest !== "") {
                                temppush();
                                ind = lengtha - 1;
                                do {
                                    ind = ind - 1;
                                } while (types[ind] === "comment");
                                lines[ind]         = lines[lengtha - 1];
                                lines[lengtha - 1] = 0;
                            }
                        }
                        if (xblock === true) {
                            token.push("x}");
                            types.push("end");
                            lines.push(0);
                            stack[lengtha - 1] = pstack[0];
                            begin[lengtha - 1] = pstack[1];
                            stack.push(pstack[0]);
                            begin.push(pstack[1]);
                        }
                    },
                    //merges strings separated by "+" if options.wrap is less than 0
                    strmerge       = function parser_script_tokenize_strmerge() {
                        var aa   = 0,
                            bb   = "",
                            item = ltoke.slice(1, ltoke.length - 1);
                        tokenpop();
                        aa        = token.length - 1;
                        bb        = token[aa];
                        token[aa] = bb.slice(0, bb.length - 1) + item + bb.charAt(0);
                    }, // the generic function is a generic tokenizer start argument contains the
                    // token's starting syntax offset argument is length of start minus control
                    // chars end is how is to identify where the token ends
                    generic        = function parser_script_tokenize_genericBuilder(starting, ending) {
                        var ee     = 0,
                            ender  = ending.split(""),
                            endlen = ender.length,
                            jj     = b,
                            build  = [starting],
                            base   = a + starting.length,
                            output = "",
                            escape = false;
                        if (wordTest > -1) {
                            word();
                        }
                        // this insanity is for JSON where all the required quote characters are
                        // escaped.
                        if (c[a - 1] === "\\" && slashes(a - 1) === true && (c[a] === "\"" || c[a] === "'")) {
                            tokenpop();
                            if (token[0] === "{") {
                                if (c[a] === "\"") {
                                    starting = "\"";
                                    ending   = "\\\"";
                                    build    = ["\""];
                                } else {
                                    starting = "'";
                                    ending   = "\\'";
                                    build    = ["'"];
                                }
                                escape = true;
                            } else {
                                if (c[a] === "\"") {
                                    return "\\\"";
                                }
                                return "\\'";
                            }
                        }
                        for (ee = base; ee < jj; ee = ee + 1) {
                            if (ee > a + 1) {
                                if (c[ee] === "<" && c[ee + 1] === "?" && c[ee + 2] === "p" && c[ee + 3] === "h" && c[ee + 4] === "p" && c[ee + 5] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(parser_script_tokenize_genericBuilder("<?php", "?>"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "<" && c[ee + 1] === "%" && c[ee + 2] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(parser_script_tokenize_genericBuilder("<%", "%>"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "{" && c[ee + 1] === "%" && c[ee + 2] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(parser_script_tokenize_genericBuilder("{%", "%}"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "{" && c[ee + 1] === "{" && c[ee + 2] === "{" && c[ee + 3] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(parser_script_tokenize_genericBuilder("{{{", "}}}"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "{" && c[ee + 1] === "{" && c[ee + 2] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(parser_script_tokenize_genericBuilder("{{", "}}"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "<" && c[ee + 1] === "!" && c[ee + 2] === "-" && c[ee + 3] === "-" && c[ee + 4] === "#" && c[ee + 5] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(parser_script_tokenize_genericBuilder("<!--#", "-->"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else {
                                    build.push(c[ee]);
                                }
                            } else {
                                build.push(c[ee]);
                            }
                            if ((starting === "\"" || starting === "'") && json === false && c[ee - 1] !== "\\" && (c[ee] === "\n" || ee === jj - 1)) {
                                logError("Unterminated string in JavaScript", ee);
                                break;
                            }
                            if (c[ee] === ender[endlen - 1] && (c[ee - 1] !== "\\" || slashes(ee - 1) === false)) {
                                if (endlen === 1) {
                                    break;
                                }
                                // `ee - base` is a cheap means of computing length of build array the `ee -
                                // base` and `endlen` are both length based values, so adding two (1 for each)
                                // provides an index based number
                                if (build[ee - base] === ender[0] && build.slice(ee - base - endlen + 2).join("") === ending) {
                                    break;
                                }
                            }
                        }
                        if (escape === true) {
                            output = build[build.length - 1];
                            build.pop();
                            build.pop();
                            build.push(output);
                        }
                        a = ee;
                        if (starting === "//") {
                            build.pop();
                        }
                        output = build.join("");
                        if (starting === "//") {
                            output = output.replace(/(\s+)$/, "");
                        } else if (starting === "/*") {
                            build = output.split(lf);
                            for (ee = build.length - 1; ee > -1; ee = ee - 1) {
                                build[ee] = build[ee].replace(/(\s+)$/, "");
                            }
                            output = build.join(lf);
                        }
                        if (starting === "{%") {
                            if (output.indexOf("{%-") < 0) {
                                output = output
                                    .replace(/^(\{%\s*)/, "{% ")
                                    .replace(/(\s*%\})$/, " %}");
                            } else {
                                output = output
                                    .replace(/^(\{%-\s*)/, "{%- ")
                                    .replace(/(\s*-%\})$/, " -%}");
                            }
                        }
                        if (output.indexOf("#region") === 0 || output.indexOf("#endregion") === 0) {
                            output = output.replace(/(\s+)$/, "");
                        }
                        return output;
                    },
                    //a tokenizer for regular expressions
                    regex          = function parser_script_tokenize_regex() {
                        var ee     = 0,
                            f      = b,
                            h      = 0,
                            i      = 0,
                            build  = ["/"],
                            output = "",
                            square = false;
                        for (ee = a + 1; ee < f; ee = ee + 1) {
                            build.push(c[ee]);
                            if (c[ee - 1] !== "\\" || c[ee - 2] === "\\") {
                                if (c[ee] === "[") {
                                    square = true;
                                }
                                if (c[ee] === "]") {
                                    square = false;
                                }
                            }
                            if (c[ee] === "/" && square === false) {
                                if (c[ee - 1] === "\\") {
                                    i = 0;
                                    for (h = ee - 1; h > 0; h = h - 1) {
                                        if (c[h] === "\\") {
                                            i = i + 1;
                                        } else {
                                            break;
                                        }
                                    }
                                    if (i % 2 === 0) {
                                        break;
                                    }
                                } else {
                                    break;
                                }
                            }
                        }
                        if (c[ee + 1] === "g" || c[ee + 1] === "i" || c[ee + 1] === "m" || c[ee + 1] === "y" || c[ee + 1] === "u") {
                            build.push(c[ee + 1]);
                            if (c[ee + 2] !== c[ee + 1] && (c[ee + 2] === "g" || c[ee + 2] === "i" || c[ee + 2] === "m" || c[ee + 2] === "y" || c[ee + 2] === "u")) {
                                build.push(c[ee + 2]);
                                if (c[ee + 3] !== c[ee + 1] && c[ee + 3] !== c[ee + 2] && (c[ee + 3] === "g" || c[ee + 3] === "i" || c[ee + 3] === "m" || c[ee + 3] === "y" || c[ee + 3] === "u")) {
                                    build.push(c[ee + 3]);
                                    if (c[ee + 4] !== c[ee + 1] && c[ee + 4] !== c[ee + 2] && c[ee + 4] !== c[ee + 3] && (c[ee + 4] === "g" || c[ee + 4] === "i" || c[ee + 4] === "m" || c[ee + 4] === "y" || c[ee + 4] === "u")) {
                                        build.push(c[ee + 4]);
                                        if (c[ee + 5] !== c[ee + 1] && c[ee + 5] !== c[ee + 2] && c[ee + 5] !== c[ee + 3] && c[ee + 5] !== c[ee + 4] && (c[ee + 5] === "g" || c[ee + 5] === "i" || c[ee + 5] === "m" || c[ee + 5] === "y" || c[ee + 5] === "u")) {
                                            build.push(c[ee + 4]);
                                            a = ee + 5;
                                        } else {
                                            a = ee + 4;
                                        }
                                    } else {
                                        a = ee + 3;
                                    }
                                } else {
                                    a = ee + 2;
                                }
                            } else {
                                a = ee + 1;
                            }
                        } else {
                            a = ee;
                        }
                        output = build.join("");
                        return output;
                    },
                    //a unique tokenizer for operator characters
                    operator       = function parser_script_tokenize_operator() {
                        var syntax = [
                                "=",
                                "<",
                                ">",
                                "+",
                                "*",
                                "?",
                                "|",
                                "^",
                                ":",
                                "&",
                                "%",
                                "~"
                            ],
                            g      = 0,
                            h      = 0,
                            jj     = b,
                            build  = [c[a]],
                            synlen = syntax.length,
                            output = "";
                        if (wordTest > -1) {
                            word();
                        }
                        if (c[a] === "/" && (lengtha > 0 && (ltype !== "word" || ltoke === "typeof" || ltoke === "return" || ltoke === "else") && ltype !== "literal" && ltype !== "end")) {
                            if (ltoke === "return" || ltoke === "typeof" || ltoke === "else" || ltype !== "word") {
                                ltoke = regex();
                                ltype = "regex";
                            } else {
                                ltoke = "/";
                                ltype = "operator";
                            }
                            tokenpush(false, 0);
                            return "regex";
                        }
                        if (c[a] === "?" && ("+-*/".indexOf(c[a + 1]) > -1 || (c[a + 1] === ":" && syntax.join("").indexOf(c[a + 2]) < 0))) {
                            return "?";
                        }
                        if (c[a] === ":" && "+-*/".indexOf(c[a + 1]) > -1) {
                            return ":";
                        }
                        if (a < b - 1) {
                            if (c[a] !== "<" && c[a + 1] === "<") {
                                return c[a];
                            }
                            if (c[a] === "!" && c[a + 1] === "/") {
                                return "!";
                            }
                            if (c[a] === "-") {
                                if (c[a + 1] === "-") {
                                    output = "--";
                                } else if (c[a + 1] === "=") {
                                    output = "-=";
                                } else if (c[a + 1] === ">") {
                                    output = "->";
                                }
                                if (output === "") {
                                    return "-";
                                }
                            }
                            if (c[a] === "+") {
                                if (c[a + 1] === "+") {
                                    output = "++";
                                } else if (c[a + 1] === "=") {
                                    output = "+=";
                                }
                                if (output === "") {
                                    return "+";
                                }
                            }
                            if (c[a] === "=" && c[a + 1] !== "=" && c[a + 1] !== "!" && c[a + 1] !== ">") {
                                return "=";
                            }
                        }
                        if (output === "") {
                            if ((c[a + 1] === "+" && c[a + 2] === "+") || (c[a + 1] === "-" && c[a + 2] === "-")) {
                                output = c[a];
                            } else {
                                for (g = a + 1; g < jj; g = g + 1) {
                                    if ((c[g] === "+" && c[g + 1] === "+") || (c[g] === "-" && c[g + 1] === "-")) {
                                        break;
                                    }
                                    for (h = 0; h < synlen; h = h + 1) {
                                        if (c[g] === syntax[h]) {
                                            build.push(syntax[h]);
                                            break;
                                        }
                                    }
                                    if (h === synlen) {
                                        break;
                                    }
                                }
                                output = build.join("");
                            }
                        }
                        a = a + (output.length - 1);
                        if (output === "=>" && ltoke === ")") {
                            g  = token.length - 1;
                            jj = begin[g];
                            do {
                                if (begin[g] === jj) {
                                    stack[g] = "method";
                                }
                                g = g - 1;
                            } while (g > jj - 1);
                        }
                        if (output.length === 2 && output.charAt(1) === "=" && "!=<>|&?".indexOf(output.charAt(0)) < 0 && options.correct === true) {
                            return plusequal(output);
                        }
                        return output;
                    },
                    //ES6 template string support
                    tempstring     = function parser_script_tokenize_tempstring() {
                        var output = [c[a]];
                        for (a = a + 1; a < b; a = a + 1) {
                            output.push(c[a]);
                            if (c[a] === "`" && (c[a - 1] !== "\\" || slashes(a - 1) === false)) {
                                templateString.pop();
                                break;
                            }
                            if (c[a - 1] === "$" && c[a] === "{" && (c[a - 2] !== "\\" || slashes(a - 2) === false)) {
                                templateString[templateString.length - 1] = true;
                                break;
                            }
                        }
                        return output.join("");
                    },
                    //a tokenizer for numbers
                    numb           = function parser_script_tokenize_number() {
                        var ee    = 0,
                            f     = b,
                            build = [c[a]],
                            test  = /zz/,
                            dot   = (build[0] === ".");
                        if (a < b - 2 && c[a] === "0") {
                            if (c[a + 1] === "x") {
                                test = /[0-9a-fA-F]/;
                            } else if (c[a + 1] === "o") {
                                test = /[0-9]/;
                            } else if (c[a + 1] === "b") {
                                test = /0|1/;
                            }
                            if (test.test(c[a + 2]) === true) {
                                build.push(c[a + 1]);
                                ee = a + 1;
                                do {
                                    ee = ee + 1;
                                    build.push(c[ee]);
                                } while (test.test(c[ee + 1]) === true);
                                a = ee;
                                return build.join("");
                            }
                        }
                        for (ee = a + 1; ee < f; ee = ee + 1) {
                            if ((/[0-9]/).test(c[ee]) || (c[ee] === "." && dot === false)) {
                                build.push(c[ee]);
                                if (c[ee] === ".") {
                                    dot = true;
                                }
                            } else {
                                break;
                            }
                        }
                        if (ee < f - 1 && ((/\d/).test(c[ee - 1]) === true || ((/\d/).test(c[ee - 2]) === true && (c[ee - 1] === "-" || c[ee - 1] === "+"))) && (c[ee] === "e" || c[ee] === "E")) {
                            build.push(c[ee]);
                            if (c[ee + 1] === "-" || c[ee + 1] === "+") {
                                build.push(c[ee + 1]);
                                ee = ee + 1;
                            }
                            dot = false;
                            for (ee = ee + 1; ee < f; ee = ee + 1) {
                                if ((/[0-9]/).test(c[ee]) || (c[ee] === "." && dot === false)) {
                                    build.push(c[ee]);
                                    if (c[ee] === ".") {
                                        dot = true;
                                    }
                                } else {
                                    break;
                                }
                            }
                        }
                        a = ee - 1;
                        return build.join("");
                    }, // Not a tokenizer.  This counts white space characters and determines if there
                    // are empty lines to be preserved
                    space          = function parser_script_tokenize_space() {
                        var schars    = [],
                            f         = 0,
                            locallen  = b,
                            emptyline = 1,
                            output    = "",
                            asitest   = false;
                        for (f = a; f < locallen; f = f + 1) {
                            if (c[f] === "\n") {
                                asitest = true;
                            } else if ((/\s/).test(c[f]) === false) {
                                break;
                            }
                            schars.push(c[f]);
                        }
                        a = f - 1;
                        if (token.length === 0) {
                            return;
                        }
                        output = schars.join("");
                        if (output.indexOf("\n") > -1 && token[token.length - 1].indexOf("#!/") !== 0) {
                            schars = output.split("\n");
                            if (schars.length > 2) {
                                emptyline = schars.length - 1;
                                if (token[lengtha - 1].indexOf("//") === 0) {
                                    emptyline = emptyline + 1;
                                }
                                if (emptyline > options.preserve + 1) {
                                    emptyline = options.preserve + 1;
                                }
                            } else if (token[lengtha - 1] !== undefined && token[lengtha - 1].indexOf("//") === 0) {
                                emptyline = 2;
                            }
                            if (ltype === "comment" && ltoke.charAt(1) !== "*" && emptyline < 2) {
                                lines[lines.length - 1] = emptyline + 1;
                            } else {
                                lines[lines.length - 1] = emptyline;
                            }
                        }
                        if (asitest === true && ltoke !== ";" && lengthb < token.length && c[a + 1] !== "}") {
                            asi(false);
                            lengthb = token.length;
                        }
                    }, // Identifies blocks of markup embedded within JavaScript for language supersets
                    // like React JSX.
                    markup         = function parser_script_tokenize_markup() {
                        var output     = [],
                            curlytest  = false,
                            endtag     = false,
                            anglecount = 0,
                            curlycount = 0,
                            tagcount   = 0,
                            d          = 0,
                            next       = "",
                            syntaxnum  = "0123456789=<>+-*?|^:&.,;%(){}[]~",
                            syntax     = "=<>+-*?|^:&.,;%(){}[]~";
                        if (wordTest > -1) {
                            word();
                        }
                        d = token.length - 1;
                        if (types[d] === "comment" || types[d] === "comment-inline") {
                            do {
                                d = d - 1;
                            } while (d > 0 && (types[d] === "comment" || types[d] === "comment-inline"));
                        }
                        if (c[a] === "<" && c[a + 1] === ">") {
                            a     = a + 1;
                            ltype = "generic";
                            return "<>";
                        }
                        if ((c[a] !== "<" && syntaxnum.indexOf(c[a + 1]) > -1) || token[d] === "++" || token[d] === "--" || (/\s/).test(c[a + 1]) === true || ((/\d/).test(c[a + 1]) === true && (ltype === "operator" || ltype === "literal" || (ltype === "word" && ltoke !== "return")))) {
                            ltype = "operator";
                            return operator();
                        }
                        if (options.typescript === false && (token[d] === "return" || types[d] === "operator" || types[d] === "start" || types[d] === "separator" || (token[d] === "}" && stacklist[stacklist.length - 1][0] === "global"))) {
                            ltype       = "markup";
                            options.jsx = true;
                        } else if (options.typescript === true || token[lengtha - 1] === "#include" || (((/\s/).test(c[a - 1]) === false || ltoke === "public" || ltoke === "private" || ltoke === "static" || ltoke === "final" || ltoke === "implements" || ltoke === "class" || ltoke === "void" || ltoke === "Promise") && syntaxnum.indexOf(c[a + 1]) < 0)) {
                            //Java type generics
                            return (function parser_script_tokenize_markup_generic() {
                                var generics = [
                                        "<",
                                        c[a + 1]
                                    ],
                                    comma    = false,
                                    e        = 1,
                                    f        = 0;
                                if (c[a + 1] === "<") {
                                    e = 2;
                                }
                                for (d = a + 2; d < b; d = d + 1) {
                                    generics.push(c[d]);
                                    if (c[d] === "?" && c[d + 1] === ">") {
                                        generics.push(">");
                                        d = d + 1;
                                    }
                                    if (c[d] === ",") {
                                        comma = true;
                                        if ((/\s/).test(c[d + 1]) === false) {
                                            generics.push(" ");
                                        }
                                    } else if (c[d] === "[") {
                                        f = f + 1;
                                    } else if (c[d] === "]") {
                                        f = f - 1;
                                    } else if (c[d] === "<") {
                                        e = e + 1;
                                    } else if (c[d] === ">") {
                                        e = e - 1;
                                        if (e === 0 && f === 0) {
                                            if ((/\s/).test(c[d - 1]) === true) {
                                                ltype = "operator";
                                                return operator();
                                            }
                                            ltype = "generic";
                                            a     = d;
                                            return generics
                                                .join("")
                                                .replace(/\s+/g, " ");
                                        }
                                    }
                                    if ((syntax.indexOf(c[d]) > -1 && c[d] !== "," && c[d] !== "<" && c[d] !== ">" && c[d] !== "[" && c[d] !== "]") || (comma === false && (/\s/).test(c[d]) === true)) {
                                        ltype = "operator";
                                        return operator();
                                    }
                                }
                            }());
                        } else {
                            ltype = "operator";
                            return operator();
                        }
                        for (a = a; a < b; a = a + 1) {
                            output.push(c[a]);
                            if (c[a] === "{") {
                                curlycount = curlycount + 1;
                                curlytest  = true;
                            } else if (c[a] === "}") {
                                curlycount = curlycount - 1;
                                if (curlycount === 0) {
                                    curlytest = false;
                                }
                            } else if (c[a] === "<" && curlytest === false) {
                                if (c[a + 1] === "<") {
                                    do {
                                        output.push(c[a]);
                                        a = a + 1;
                                    } while (c[a + 1] === "<");
                                }
                                anglecount = anglecount + 1;
                                if (c[a + 1] === "/") {
                                    endtag = true;
                                }
                            } else if (c[a] === ">" && curlytest === false) {
                                if (c[a + 1] === ">") {
                                    do {
                                        output.push(c[a]);
                                        a = a + 1;
                                    } while (c[a + 1] === ">");
                                }
                                anglecount = anglecount - 1;
                                if (endtag === true) {
                                    tagcount = tagcount - 1;
                                } else if (c[a - 1] !== "/") {
                                    tagcount = tagcount + 1;
                                }
                                if (anglecount === 0 && curlycount === 0 && tagcount < 1) {
                                    ltype = "markup";
                                    next  = nextchar(2, false);
                                    if (next.charAt(0) !== "<") {
                                        return output.join("");
                                    }
                                    // catch additional trailing tag sets
                                    if (next.charAt(0) === "<" && syntaxnum.indexOf(next.charAt(1)) < 0 && (/\s/).test(next.charAt(1)) === false) {
                                        // perform a minor safety test to verify if "<" is a tag start or a less than
                                        // operator
                                        d = a + 1;
                                        do {
                                            d = d + 1;
                                            if (c[d] === ">" || ((/\s/).test(c[d - 1]) === true && syntaxnum.indexOf(c[d]) < 0)) {
                                                break;
                                            }
                                            if (syntaxnum.indexOf(c[d]) > -1) {
                                                return output.join("");
                                            }
                                        } while (d < b);
                                    } else {
                                        return output.join("");
                                    }
                                }
                                endtag = false;
                            }
                        }
                        ltype = "markup";
                        return output.join("");
                    },
                    //operations for end types: ), ], }
                    end            = function parser_script_tokenize_end(x) {
                        var insert   = false,
                            next     = nextchar(1, false),
                            newarray = function parser_script_tokenize_end_newarray() {
                                var aa       = begin[lengtha - 1],
                                    bb       = 0,
                                    cc       = 0,
                                    ar       = (token[begin[lengtha - 1] - 1] === "Array"),
                                    startar  = (ar === true)
                                        ? "["
                                        : "{",
                                    endar    = (ar === true)
                                        ? "]"
                                        : "}",
                                    namear   = (ar === true)
                                        ? "array"
                                        : "object",
                                    arraylen = 0;
                                tokenpop();
                                cc = lengtha - 1;
                                if (ar === true && token[cc - 1] === "(" && types[cc] === "literal" && token[cc].charAt(0) !== "\"" && token[cc].charAt(0) !== "'") {
                                    arraylen = token[cc] - 1;
                                    tokenpop();
                                    tokenpop();
                                    tokenpop();
                                    token[token.length - 1]         = "[";
                                    lengtha                         = token.length;
                                    types[types.length - 1]         = "start";
                                    lines[lines.length - 1]         = 0;
                                    stack[stack.length - 1]         = "array";
                                    begin[begin.length - 1]         = lengtha - 1;
                                    stacklist[stacklist.length - 1] = [
                                        "array", lengtha - 1
                                    ];
                                    do {
                                        tokenpush(true, 0);
                                        arraylen = arraylen - 1;
                                    } while (arraylen > 0);
                                } else {
                                    token[aa] = startar;
                                    types[aa] = "start";
                                    cc        = begin[aa];
                                    token.splice(aa - 2, 2);
                                    types.splice(aa - 2, 2);
                                    lines.splice(aa - 2, 2);
                                    stack.splice(aa - 2, 2);
                                    begin.splice(aa - 2, 2);
                                    lengtha                         = lengtha - 2;
                                    stacklist[stacklist.length - 1] = [
                                        namear, aa - 2
                                    ];
                                    pstack                          = [namear, aa];
                                    bb                              = lengtha - 1;
                                    do {
                                        if (begin[bb] === cc) {
                                            stack[bb] = namear;
                                            begin[bb] = begin[bb] - 2;
                                        }
                                        bb = bb - 1;
                                    } while (bb > aa - 3);
                                }
                                ltoke = endar;
                                ltype = "end";
                                tokenpush(false, 0);
                            };
                        if (wordTest > -1) {
                            word();
                        }
                        if (classy.length > 0) {
                            if (classy[classy.length - 1] === 0) {
                                classy.pop();
                            } else {
                                classy[classy.length - 1] = classy[classy.length - 1] - 1;
                            }
                        }
                        if (x === ")" || x === "x)" || x === "]") {
                            plusplus();
                            asifix();
                        }
                        if (x === ")" || x === "x)") {
                            asi(false);
                        }
                        if (vart.len > -1) {
                            if (x === "}" && ((options.varword === "list" && vart.count[vart.len] === 0) || (token[token.length - 1] === "x;" && options.varword === "each"))) {
                                vartpop();
                            }
                            vart.count[vart.len] = vart.count[vart.len] - 1;
                            if (vart.count[vart.len] < 0) {
                                vartpop();
                            }
                        }
                        if (ltoke === "," && stack[lengtha - 1] !== "initializer" && ((x === "]" && (options.endcomma === "never" || options.endcomma === "multiline" || token[lengtha - 2] === "[")) || x === "}")) {
                            tokenpop();
                        } else if ((x === "]" || x === "}") && options.endcomma === "always" && ltoke !== ",") {
                            endCommaArray();
                        }
                        if (x === ")" || x === "x)") {
                            ltoke = x;
                            ltype = "end";
                            if (lword.length > 0) {
                                pword = lword[lword.length - 1];
                                if (pword.length > 1 && next !== "{" && (pword[0] === "if" || pword[0] === "for" || (pword[0] === "while" && stack[pword[1] - 2] !== undefined && stack[pword[1] - 2] !== "do") || pword[0] === "with")) {
                                    insert = true;
                                }
                            }
                        } else if (x === "]") {
                            ltoke = "]";
                            ltype = "end";
                            pword = [];
                        } else if (x === "}") {
                            if (ltoke !== "," || options.endcomma === "always") {
                                if (ltoke === ";" && options.mode === "minify") {
                                    token[token.length - 1] = "x;";
                                }
                                plusplus();
                            }
                            if (stacklist.length > 0 && stacklist[stacklist.length - 1][0] !== "object") {
                                asi(true);
                            } else if (objsortop === true) {
                                objSort();
                            }
                            if (ltype === "comment" || ltype === "comment-inline") {
                                lengtha = token.length;
                                ltoke   = token[lengtha - 1];
                                ltype   = types[lengtha - 1];
                            }
                            if (options.braceline === true) {
                                lines[lines.length - 1] = 2;
                            }
                            ltoke = "}";
                            ltype = "end";
                            pword = [];
                        }
                        lword.pop();
                        tokenpush(false, 0);
                        if (x === ")" && options.correct === true && (token[begin[lengtha - 1] - 1] === "Array" || token[begin[lengtha - 1] - 1] === "Object") && token[begin[lengtha - 1] - 2] === "new") {
                            newarray();
                        }
                        pstack = stacklist.pop();
                        if (brace[brace.length - 1] === "x{" && x === "}") {
                            blockinsert();
                        }
                        brace.pop();
                        if (brace[brace.length - 1] === "x{" && x === "}" && stack[lengtha - 1] !== "try") {
                            if (next !== ":" && token[begin[a] - 1] !== "?") {
                                blockinsert();
                            }
                        }
                        if (insert === true) {
                            ltoke = "x{";
                            ltype = "start";
                            tokenpush(false, 0);
                            brace.push("x{");
                            pword[1] = lengtha - 1;
                            stacklist.push(pword);
                        }
                    },
                    //determines tag names for {% %} based template tags and returns a type
                    tname          = function parser_script_tokenize_tname(x) {
                        var sn       = 2,
                            en       = 0,
                            st       = x.slice(0, 2),
                            len      = x.length,
                            name     = "",
                            namelist = [
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
                        if (x.charAt(2) === "-") {
                            sn = sn + 1;
                        }
                        if ((/\s/).test(x.charAt(sn)) === true) {
                            do {
                                sn = sn + 1;
                            } while ((/\s/).test(x.charAt(sn)) === true && sn < len);
                        }
                        en = sn;
                        do {
                            en = en + 1;
                        } while (
                            (/\s/).test(x.charAt(en)) === false && x.charAt(en) !== "(" && en < len
                        );
                        if (en === len) {
                            en = x.length - 2;
                        }
                        name = x.slice(sn, en);
                        if (name === "else" || (st === "{%" && (name === "elseif" || name === "when" || name === "elif"))) {
                            return "template_else";
                        }
                        if (st === "{{") {
                            if (name === "end") {
                                return "template_end";
                            }
                            if (name === "block" || name === "define" || name === "form" || name === "if" || name === "range" || name === "with") {
                                return "template_start";
                            }
                            return "template";
                        }
                        for (en = namelist.length - 1; en > -1; en = en - 1) {
                            if (name === namelist[en]) {
                                return "template_start";
                            }
                            if (name === "end" + namelist[en]) {
                                return "template_end";
                            }
                        }
                        return "template";
                    };
                start = function parser_script_tokenize_start(x) {
                    brace.push(x);
                    if (wordTest > -1) {
                        word();
                    }
                    if (vart.len > -1) {
                        vart.count[vart.len] = vart.count[vart.len] + 1;
                    }
                    if (token[lengtha - 2] === "function") {
                        lword.push(["function", lengtha]);
                    } else {
                        lword.push([ltoke, lengtha]);
                    }
                    ltoke = x;
                    ltype = "start";
                    if (x === "(" || x === "x(") {
                        asifix();
                    } else if (x === "{") {
                        if (paren > -1) {
                            if (begin[paren - 1] === begin[begin[lengtha - 1] - 1] || token[begin[lengtha - 1]] === "x(") {
                                paren = -1;
                                end("x)");
                                asifix();
                                ltoke = "{";
                                ltype = "start";
                            }
                        } else if (ltoke === ")") {
                            asifix();
                        }
                        if ((ltype === "comment" || ltype === "comment-inline") && token[lengtha - 2] === ")") {
                            ltoke              = token[lengtha - 1];
                            token[lengtha - 1] = "{";
                            ltype              = types[lengtha - 1];
                            types[lengtha - 1] = "start";
                        }
                    }
                    if (options.braceline === true && x === "{") {
                        tokenpush(false, 2);
                    } else {
                        tokenpush(false, 0);
                    }
                    if (classy.length > 0) {
                        classy[classy.length - 1] = classy[classy.length - 1] + 1;
                    }
                    stacklist.push([
                        stack[stack.length - 1],
                        begin[begin.length - 1]
                    ]);
                };
                for (a = 0; a < b; a = a + 1) {
                    if ((/\s/).test(c[a])) {
                        if (wordTest > -1) {
                            word();
                        }
                        space();
                    } else if (c[a] === "<" && c[a + 1] === "?" && c[a + 2] === "p" && c[a + 3] === "h" && c[a + 4] === "p") {
                        //php
                        ltoke = generic("<?php", "?>");
                        ltype = "template";
                        tokenpush(false, 0);
                    } else if (c[a] === "<" && c[a + 1] === "%") {
                        //asp
                        ltoke = generic("<%", "%>");
                        ltype = "template";
                        tokenpush(false, 0);
                    } else if (c[a] === "{" && c[a + 1] === "%") {
                        //twig
                        ltoke = generic("{%", "%}");
                        ltype = tname(ltoke);
                        tokenpush(false, 0);
                    } else if (c[a] === "{" && c[a + 1] === "{" && c[a + 2] === "{") {
                        //mustache
                        ltoke = generic("{{{", "}}}");
                        ltype = "template";
                        tokenpush(false, 0);
                    } else if (c[a] === "{" && c[a + 1] === "{") {
                        //handlebars
                        ltoke = generic("{{", "}}");
                        ltype = tname(ltoke);
                        tokenpush(false, 0);
                    } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-" && c[a + 4] === "#") {
                        //ssi
                        ltoke = generic("<!--#", "-->");
                        ltype = "template";
                        tokenpush(false, 0);
                    } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-") {
                        //markup comment
                        ltoke = generic("<!--", "-->");
                        ltype = "comment";
                        tokenpush(false, 0);
                    } else if (c[a] === "<") {
                        //markup
                        ltoke = markup();
                        tokenpush(false, 0);
                    } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "*")) {
                        //comment block
                        ltoke = generic("/*", "*\/");
                        if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                            sourcemap[0] = token.length;
                            sourcemap[1] = ltoke;
                        }
                        if (options.comments !== "nocomment") {
                            ltype = "comment";
                            if (token[lengtha - 1] === "var" || token[lengtha - 1] === "let" || token[lengtha - 1] === "const") {
                                tokenpop();
                                commentwrap(ltoke, false);
                                temppush();
                                if (lines[lengtha - 3] === 0) {
                                    lines[lengtha - 3] = lines[lengtha - 1];
                                }
                                lines[lengtha - 1] = 0;
                            } else {
                                commentwrap(ltoke, false);
                            }
                        }
                    } else if ((lines.length === 0 || lines[lines.length - 1] > 0) && c[a] === "#" && c[a + 1] === "!" && (c[a + 2] === "/" || c[a + 2] === "[")) {
                        //shebang
                        ltoke = generic("#!" + c[a + 2], "\n");
                        ltoke = ltoke.slice(0, ltoke.length - 1);
                        ltype = "literal";
                        tokenpush(false, 2);
                    } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "/")) {
                        //comment line
                        asi(false);
                        ltoke = generic("//", "\n");
                        if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                            sourcemap[0] = token.length;
                            sourcemap[1] = ltoke;
                        }
                        if (options.comments !== "nocomment") {
                            commentwrap(ltoke, true);
                        }
                    } else if (c[a] === "#" && c[a + 1] === "r" && c[a + 2] === "e" && c[a + 3] === "g" && c[a + 4] === "i" && c[a + 5] === "o" && c[a + 6] === "n" && (/\s/).test(c[a + 7]) === true) {
                        //comment line
                        asi(false);
                        ltoke = generic("#region", "\n");
                        ltype = "comment";
                        tokenpush(false, 0);
                    } else if (c[a] === "#" && c[a + 1] === "e" && c[a + 2] === "n" && c[a + 3] === "d" && c[a + 4] === "r" && c[a + 5] === "e" && c[a + 6] === "g" && c[a + 7] === "i" && c[a + 8] === "o" && c[a + 9] === "n") {
                        //comment line
                        asi(false);
                        ltoke = generic("#endregion", "\n");
                        ltype = "comment";
                        tokenpush(false, 0);
                    } else if (c[a] === "`" || (c[a] === "}" && templateString[templateString.length - 1] === true)) {
                        //template string
                        if (wordTest > -1) {
                            word();
                        }
                        if (c[a] === "`") {
                            templateString.push(false);
                        } else {
                            templateString[templateString.length - 1] = false;
                        }
                        ltoke = tempstring();
                        ltype = "literal";
                        tokenpush(false, 0);
                    } else if (c[a] === "\"" || c[a] === "'") {
                        //string
                        ltoke = generic(c[a], c[a]);
                        ltype = "literal";
                        if ((ltoke.charAt(0) === "\"" && options.quoteConvert === "single") || (ltoke.charAt(0) === "'" && options.quoteConvert === "double")) {
                            ltoke = quoteConvert(ltoke);
                        }
                        if (options.wrap !== 0 && token[lengtha - 1] === "+" && (token[lengtha - 2].charAt(0) === "\"" || token[lengtha - 2].charAt(0) === "'")) {
                            strmerge();
                        } else if (options.wrap > 0 && (types[lengtha] !== "operator" || token[lengtha] === "=" || token[lengtha] === ":" || (token[lengtha] === "+" && types[lengtha - 1] === "literal"))) {
                            if ((token[0] === "[" && (/(\]\s*)$/).test(source) === true) || (token[0] === "{" && (/(\}\s*)$/).test(source) === true)) {
                                tokenpush(false, 0);
                            } else if (types[lengtha - 2] === "literal" && token[lengtha - 1] === "+" && (token[lengtha - 2].charAt(0) === "\"" || token[lengtha - 2].charAt(0) === "'") && token[lengtha - 2].length < options.wrap + 2) {
                                strmerge();
                            } else {
                                tokenpush(false, 0);
                            }
                        } else {
                            tokenpush(false, 0);
                        }
                    } else if (c[a] === "-" && (a < b - 1 && c[a + 1] !== "=" && c[a + 1] !== "-") && (ltype === "literal" || ltype === "word") && ltoke !== "return" && (ltoke === ")" || ltoke === "]" || ltype === "word" || ltype === "literal")) {
                        //subtraction
                        if (wordTest > -1) {
                            word();
                        }
                        ltoke = "-";
                        ltype = "operator";
                        tokenpush(false, 0);
                    } else if (wordTest === -1 && (c[a] !== "0" || (c[a] === "0" && c[a + 1] !== "b")) && ((/\d/).test(c[a]) || (a !== b - 2 && c[a] === "-" && c[a + 1] === "." && (/\d/).test(c[a + 2])) || (a !== b - 1 && (c[a] === "-" || c[a] === ".") && (/\d/).test(c[a + 1])))) {
                        //number
                        if (wordTest > -1) {
                            word();
                        }
                        if (ltype === "end" && c[a] === "-") {
                            ltoke = "-";
                            ltype = "operator";
                        } else {
                            ltoke = numb();
                            ltype = "literal";
                        }
                        tokenpush(false, 0);
                    } else if (c[a] === ":" && c[a + 1] === ":") {
                        if (wordTest > -1) {
                            word();
                        }
                        plusplus();
                        asifix();
                        a     = a + 1;
                        ltoke = "::";
                        ltype = "separator";
                        tokenpush(false, 0);
                    } else if (c[a] === ",") {
                        //comma
                        if (wordTest > -1) {
                            word();
                        }
                        plusplus();
                        if (ltype === "comment" || ltype === "comment-inline") {
                            commaComment();
                        } else if (vart.len > -1 && vart.count[vart.len] === 0 && options.varword === "each") {
                            asifix();
                            ltoke = ";";
                            ltype = "separator";
                            tokenpush(false, 0);
                            ltoke = vart.word[vart.len];
                            ltype = "word";
                            tokenpush(false, 0);
                            vart.index[vart.len] = token.length - 1;
                        } else {
                            ltoke = ",";
                            ltype = "separator";
                            asifix();
                            tokenpush(false, 0);
                        }
                    } else if (c[a] === ".") {
                        //period
                        if (wordTest > -1) {
                            word();
                        }
                        if (c[a + 1] === "." && c[a + 2] === ".") {
                            ltoke = "...";
                            ltype = "operator";
                            a     = a + 2;
                        } else {
                            asifix();
                            ltoke = ".";
                            ltype = "separator";
                        }
                        if ((/\s/).test(c[a - 1]) === true) {
                            tokenpush(false, 1);
                        } else {
                            tokenpush(false, 0);
                        }
                    } else if (c[a] === ";") {
                        //semicolon
                        if (wordTest > -1) {
                            word();
                        }
                        if (options.qml === true) {
                            ltoke = "x;";
                            ltype = "separator";
                            tokenpush(false, 0);
                        } else {
                            if (classy[classy.length - 1] === 0) {
                                classy.pop();
                            }
                            if (vart.len > -1 && vart.count[vart.len] === 0) {
                                if (options.varword === "each") {
                                    vartpop();
                                } else {
                                    vart.index[vart.len] = token.length;
                                }
                            }
                            plusplus();
                            ltoke = ";";
                            ltype = "separator";
                            if (token[token.length - 1] === "x}") {
                                asibrace();
                            } else {
                                tokenpush(false, 0);
                            }
                        }
                        if (brace[brace.length - 1] === "x{" && nextchar(1, false) !== "}") {
                            blockinsert();
                        }
                    } else if (c[a] === "(" || c[a] === "[" || c[a] === "{") {
                        start(c[a]);
                    } else if (c[a] === ")" || c[a] === "]" || c[a] === "}") {
                        end(c[a]);
                    } else if (c[a] === "*" && stack[lengtha - 1] === "object" && wordTest < 0 && (/\s/).test(c[a + 1]) === false && c[a + 1] !== "=" && (/\d/).test(c[a + 1]) === false) {
                        wordTest = a;
                    } else if (c[a] === "=" || c[a] === "&" || c[a] === "<" || c[a] === ">" || c[a] === "+" || c[a] === "-" || c[a] === "*" || c[a] === "/" || c[a] === "!" || c[a] === "?" || c[a] === "|" || c[a] === "^" || c[a] === ":" || c[a] === "%" || c[a] === "~") {
                        //operator
                        ltoke = operator();
                        if (ltoke === "regex") {
                            ltoke = token[lengtha - 1];
                        } else {
                            ltype = "operator";
                            if (ltoke !== "!" && ltoke !== "++" && ltoke !== "--") {
                                asifix();
                            }
                            tokenpush(false, 0);
                        }
                    } else if (wordTest < 0 && c[a] !== "") {
                        wordTest = a;
                    }
                    if (vart.len > -1 && token.length === vart.index[vart.len] + 2 && token[vart.index[vart.len]] === ";" && ltoke !== vart.word[vart.len] && ltype !== "comment" && ltype !== "comment-inline" && options.varword === "list") {
                        vartpop();
                    }
                }
                if (options.jsx === false && ((token[token.length - 1] !== "}" && token[0] === "{") || token[0] !== "{") && ((token[token.length - 1] !== "]" && token[0] === "[") || token[0] !== "[")) {
                    asi(false);
                }
                if (sourcemap[0] === token.length - 1) {
                    ltoke = "\n" + sourcemap[1];
                    ltype = "literal";
                    tokenpush(false, 0);
                }
                if (token[token.length - 1] === "x;" && (token[token.length - 2] === "}" || token[token.length - 2] === "]") && begin[begin.length - 2] === 0) {
                    tokenpop();
                }
            }());

            if (options.correct === true) {
                (function parser_script_correct() {
                    var a = 0,
                        b = token.length;
                    for (a = 0; a < b; a = a + 1) {
                        if (token[a] === "x;") {
                            token[a] = ";";
                            scolon   = scolon + 1;
                        } else if (token[a] === "x{") {
                            token[a] = "{";
                        } else if (token[a] === "x}") {
                            token[a] = "}";
                        } else if (token[a] === "x(") {
                            token[a] = "(";
                        } else if (token[a] === "x)") {
                            token[a] = ")";
                        }
                    }
                }());
            }

            return {
                attrs: attrs,
                begin: begin,
                jscom: jscom,
                lines: lines,
                presv: presv,
                stack: stack,
                token: token,
                types: types
            }
        };
        lexer.style  = function parser_style(source) {
            var begin      = [],
                lines      = [],
                stack      = [],
                token      = [],
                types      = [],
                colors     = [],
                output     = "",
                objsortop  = false,
                verticalop = false,
                colorNames = {
                    aliceblue           : 0.9288006825347457,
                    antiquewhite        : 0.8464695170775405,
                    aqua                : 0.7874,
                    aquamarine          : 0.8078549208338043,
                    azure               : 0.9726526495416643,
                    beige               : 0.8988459998705021,
                    bisque              : 0.8073232737297876,
                    black               : 0,
                    blanchedalmond      : 0.8508443960815607,
                    blue                : 0.0722,
                    blueviolet          : 0.12622014321946043,
                    brown               : 0.09822428787651079,
                    burlywood           : 0.5155984453389335,
                    cadetblue           : 0.29424681085422044,
                    chartreuse          : 0.7603202590262282,
                    chocolate           : 0.23898526114557292,
                    coral               : 0.3701793087292368,
                    cornflowerblue      : 0.30318641994179363,
                    cornsilk            : 0.9356211037296492,
                    crimson             : 0.16042199953025577,
                    cyan                : 0.7874,
                    darkblue            : 0.018640801980939217,
                    darkcyan            : 0.2032931783904645,
                    darkgoldenrod       : 0.27264703559992554,
                    darkgray            : 0.39675523072562674,
                    darkgreen           : 0.09114342904757505,
                    darkgrey            : 0.39675523072562674,
                    darkkhaki           : 0.45747326349994155,
                    darkmagenta         : 0.07353047651207048,
                    darkolivegreen      : 0.12651920884889156,
                    darkorange          : 0.40016167026523863,
                    darkorchid          : 0.1341314217485677,
                    darkred             : 0.05488967453113126,
                    darksalmon          : 0.4054147156338075,
                    darkseagreen        : 0.43789249325969054,
                    darkslateblue       : 0.06579284622798763,
                    darkslategray       : 0.06760815192804355,
                    darkslategrey       : 0.06760815192804355,
                    darkturquoise       : 0.4874606277449034,
                    darkviolet          : 0.10999048339343433,
                    deeppink            : 0.2386689582827583,
                    deepskyblue         : 0.444816033955754,
                    dimgray             : 0.14126329114027164,
                    dimgrey             : 0.14126329114027164,
                    dodgerblue          : 0.2744253699145608,
                    firebrick           : 0.10724525535015225,
                    floralwhite         : 0.9592248482500424,
                    forestgreen         : 0.18920812076002244,
                    fuchsia             : 0.2848,
                    gainsboro           : 0.7156935005064806,
                    ghostwhite          : 0.9431126188632283,
                    gold                : 0.6986087742815887,
                    goldenrod           : 0.41919977809568404,
                    gray                : 0.21586050011389915,
                    green               : 0.15438342968146068,
                    greenyellow         : 0.8060947261145331,
                    grey                : 0.21586050011389915,
                    honeydew            : 0.9633653555478173,
                    hotpink             : 0.3465843816971475,
                    indianred           : 0.21406134963884,
                    indigo              : 0.031075614863369846,
                    ivory               : 0.9907127060061531,
                    khaki               : 0.7701234339412052,
                    lavendar            : 0.8031875051452125,
                    lavendarblush       : 0.9017274863104644,
                    lawngreen           : 0.7390589312496334,
                    lemonchiffon        : 0.9403899224562171,
                    lightblue           : 0.6370914128080659,
                    lightcoral          : 0.35522120733134843,
                    lightcyan           : 0.9458729349482863,
                    lightgoldenrodyellow: 0.9334835101829635,
                    lightgray           : 0.651405637419824,
                    lightgreen          : 0.6909197995686475,
                    lightgrey           : 0.651405637419824,
                    lightpink           : 0.5856615273489745,
                    lightsalmon         : 0.47806752252059587,
                    lightseagreen       : 0.3505014511704197,
                    lightskyblue        : 0.5619563761833096,
                    lightslategray      : 0.23830165007286924,
                    lightslategrey      : 0.23830165007286924,
                    lightyellow         : 0.9816181839288161,
                    lime                : 0.7152,
                    limegreen           : 0.44571042246097864,
                    linen               : 0.8835734098437936,
                    magenta             : 0.2848,
                    maroon              : 0.04589194232421496,
                    mediumaquamarine    : 0.4938970331080111,
                    mediumblue          : 0.04407778021232784,
                    mediumorchid        : 0.21639251153773428,
                    mediumpurple        : 0.22905858091648004,
                    mediumseagreen      : 0.34393112338131226,
                    mediumslateblue     : 0.20284629471622434,
                    mediumspringgreen   : 0.7070430819418444,
                    mediumturquois      : 0.5133827926447991,
                    mediumvioletred     : 0.14371899849357186,
                    midnightblue        : 0.020717866350860484,
                    mintcream           : 0.9783460494758793,
                    mistyrose           : 0.8218304785918541,
                    moccasin            : 0.8008300099156694,
                    navajowhite         : 0.7651968234278562,
                    navy                : 0.015585128108223519,
                    oldlace             : 0.9190063340554899,
                    olive               : 0.20027537200567563,
                    olivedrab           : 0.2259315095192918,
                    orange              : 0.48170267036309605,
                    orangered           : 0.2551624375341641,
                    orchid              : 0.3134880676143873,
                    palegoldenrod       : 0.7879264788761452,
                    palegreen           : 0.7793675900635259,
                    paleturquoise       : 0.764360779217138,
                    palevioletred       : 0.2875499411788909,
                    papayawhip          : 0.8779710019983541,
                    peachpuff           : 0.7490558987825108,
                    peru                : 0.3011307487793569,
                    pink                : 0.6327107070246611,
                    plum                : 0.4573422158796909,
                    powderblue          : 0.6825458650060524,
                    purple              : 0.061477070432438476,
                    red                 : 0.2126,
                    rosyblue            : 0.3231945764940708,
                    royalblue           : 0.16663210743188323,
                    saddlebrown         : 0.09792228502052071,
                    salmon              : 0.3697724152759545,
                    sandybrown          : 0.46628543696283414,
                    seagreen            : 0.1973419970627483,
                    seashell            : 0.927378622069223,
                    sienna              : 0.13697631337097677,
                    silver              : 0.527115125705813,
                    skyblue             : 0.5529166851818412,
                    slateblue           : 0.14784278062136097,
                    slategray           : 0.20896704076536138,
                    slategrey           : 0.20896704076536138,
                    slightsteelblue     : 0.5398388828466575,
                    snow                : 0.9653334183484877,
                    springgreen         : 0.7305230606852947,
                    steelblue           : 0.20562642207624846,
                    tan                 : 0.48237604163921527,
                    teal                : 0.1699685577896842,
                    thistle             : 0.5681840109373312,
                    tomato              : 0.3063861271941505,
                    turquoise           : 0.5895536427577983,
                    violet              : 0.40315452986676303,
                    wheat               : 0.7490970282048214,
                    white               : 1,
                    whitesmoke          : 0.913098651793419,
                    yellow              : 0.9278,
                    yellowgreen         : 0.5076295720870697
                };
            (function parser_style_options() {
                objsortop  = (
                    options.objsort === true || options.objsort === "true" || options.objsort === "all" || options.objsort === "css"
                );
                verticalop = (
                    options.compressedcss === false && (options.vertical === true || options.vertical === "true" || options.vertical === "all" || options.vertical === "css")
                );
            }());
            (function parser_style_tokenize() {
                var a          = 0,
                    b          = options
                        .source
                        .split(""),
                    len        = source.length,
                    ltype      = "",
                    space      = "",
                    endtest    = false,
                    struct     = [0],
                    mapper     = [],
                    structval  = "root",
                    nosort     = [],
                    esctest    = function parser_style_tokenize_esctest(xx) {
                        var yy = xx;
                        do {
                            xx = xx - 1;
                        } while (xx > 0 && b[xx] === "\\");
                        if ((yy - xx) % 2 === 0) {
                            return true;
                        }
                        return false;
                    }, // Since I am already identifying value types this is a good place to do some
                    // quick analysis and clean up on certain value conditions. These things are
                    // being corrected:
                    //  * fractional values missing a leading 0 are    provided a leading 0
                    // * 0 values with a dimension indicator    (px, em) have the dimension
                    // indicator    removed
                    //  * eliminate unnecessary leading 0s
                    //  * url values that are not quoted are wrapped    in double quote characters
                    // * color values are set to lowercase and    reduced from 6 to 3 digits if
                    // appropriate
                    value      = function parser_style_tokenize_item_value(val, font) {
                        var x         = val.split(""),
                            leng      = x.length,
                            cc        = 0,
                            dd        = 0,
                            items     = [],
                            block     = "",
                            values    = [],
                            qchar     = "",
                            qreg      = {},
                            transition = (token[token.length - 3] === "transition"),
                            colorPush = function parser_style_tokenize_item_value_colorPush(value) {
                                var vl = value.toLowerCase();
                                if ((/^(#[0-9a-f]{3,6})$/).test(vl) === true) {
                                    colors.push(value);
                                } else if ((/^(rgba?\()/).test(vl) === true) {
                                    colors.push(value);
                                } else if (colorNames[vl] !== undefined) {
                                    colors.push(value);
                                }
                                return value;
                            };
                        if (options.quoteConvert === "double") {
                            qchar = "\"";
                        } else if (options.quoteConvert === "single") {
                            qchar = "'";
                        }
                        // this loop identifies containment so that tokens/sub-tokens are correctly
                        // taken
                        for (cc = 0; cc < leng; cc = cc + 1) {
                            items.push(x[cc]);
                            if (block === "") {
                                if (x[cc] === "\"") {
                                    block = "\"";
                                    dd    = dd + 1;
                                } else if (x[cc] === "'") {
                                    block = "'";
                                    dd    = dd + 1;
                                } else if (x[cc] === "(") {
                                    block = ")";
                                    dd    = dd + 1;
                                } else if (x[cc] === "[") {
                                    block = "]";
                                    dd    = dd + 1;
                                }
                            } else if ((x[cc] === "(" && block === ")") || (x[cc] === "[" && block === "]")) {
                                dd = dd + 1;
                            } else if (x[cc] === block) {
                                dd = dd - 1;
                                if (dd === 0) {
                                    block = "";
                                }
                            }
                            if (block === "" && x[cc] === " ") {
                                items.pop();
                                values.push(colorPush(items.join("")));
                                items = [];
                            }
                        }
                        values.push(colorPush(items.join("")));
                        leng = values.length;
                        //This is where the rules mentioned above are applied
                        for (cc = 0; cc < leng; cc = cc + 1) {
                            if (options.noleadzero === false && (/^(\.\d)/).test(values[cc]) === true) {
                                values[cc] = "0" + values[cc];
                            } else if (options.noleadzero === true && (/^(0+\.)/).test(values[cc])) {
                                values[cc] = values[cc].replace(/^(0+\.)/, ".");
                            } else if ((/^(0+([a-z]{2,3}|%))$/).test(values[cc]) === true && transition === false) {
                                values[cc] = "0";
                            } else if ((/^(0+)/).test(values[cc]) === true) {
                                values[cc] = values[cc].replace(/0+/, "0");
                                if ((/\d/).test(values[cc].charAt(1)) === true) {
                                    values[cc] = values[cc].substr(1);
                                }
                            } else if ((/^url\((?!\$)/).test(values[cc]) === true && values[cc].charAt(values[cc].length - 1) === ")") {
                                block = values[cc].charAt(values[cc].indexOf("url(") + 4);
                                if (block !== "@" && block !== "{" && block !== "<") {
                                    if (qchar === "") {
                                        values[cc] = values[cc]
                                            .replace(/url\(\s*('|")?/, "url(\"")
                                            .replace(/(('|")?\s*\))$/, "\")");
                                    } else {
                                        values[cc] = values[cc]
                                            .replace(/url\(\s*('|")?/, "url(" + qchar)
                                            .replace(/(('|")?\s*\))$/, qchar + ")");
                                    }
                                }
                            } else if (font === true) {
                                if (qchar === "'") {
                                    values[cc] = values[cc].replace(/"/g, "'");
                                } else {
                                    values[cc] = values[cc].replace(/'/g, "\"");
                                }
                            } else if (font === false && qchar !== "" && ((qchar === "\"" && values[cc].charAt(0) === "'" && values[cc].charAt(values[cc].length - 1) === "'") || (qchar === "'" && values[cc].charAt(0) === "\"" && values[cc].charAt(values[cc].length - 1) === "\""))) {
                                qreg       = new RegExp(qchar, "g");
                                values[cc] = qchar + values[cc]
                                    .slice(1, values[cc].length - 1)
                                    .replace(qreg, "\\" + qchar) + qchar;
                            }
                        }
                        return values.join(" ");
                    },
                    //map location of empty lines for beautification
                    spacer     = function parser_style_tokenize_space(end) {
                        var slen = space
                                .split(lf)
                                .length - 1,
                            val  = 0;
                        if (token.length === 0 && slen > 0) {
                            slen = slen + 1;
                        }
                        if (slen > 0 && options.preserve > 0) {
                            if (slen > options.preserve) {
                                val = options.preserve + 1;
                            } else {
                                val = slen;
                            }
                        } else if (space.length > 1) {
                            val = 1;
                        } else if (slen === 0 && types[types.length - 1] === "comment" && types[types.length - 2] !== "comment") {
                            types[types.length - 1] = "comment-inline";
                        }
                        if (slen > 1 && end === true && options.preserve > 0) {
                            space = "";
                            return val;
                        }
                        space = "";
                        return val;
                    },
                    //sort parsed properties intelligently
                    objSort    = function parser_style_tokenize_objSort() {
                        var cc        = 0,
                            dd        = 0,
                            ee        = 0,
                            startlen  = token.length - 1,
                            end       = startlen,
                            keys      = [],
                            keylen    = 0,
                            keyend    = 0,
                            start     = 0,
                            sort      = function parser_style_tokenize_objSort_sort(x, y) {
                                var xx = x[0],
                                    yy = y[0];
                                if (types[xx] === "comment" || types[xx] === "comment-inline") {
                                    do {
                                        xx = xx + 1;
                                    } while (
                                        xx < startlen && (types[xx] === "comment" || types[xx] === "comment-inline")
                                    );
                                }
                                if (types[yy] === "comment" || types[yy] === "comment-inline") {
                                    do {
                                        yy = yy + 1;
                                    } while (
                                        yy < startlen && (types[yy] === "comment" || types[yy] === "comment-inline")
                                    );
                                }
                                if (types[xx] < types[yy]) {
                                    return -1;
                                }
                                if (types[xx] === types[yy] && token[xx].toLowerCase() < token[yy].toLowerCase()) {
                                    return -1;
                                }
                                return 1;
                            },
                            semiTest  = true,
                            pairToken = [],
                            pairTypes = [],
                            pairLines = [],
                            pairStack = [],
                            pairBegin = [];
                        if (types[end] === "comment" || types[end] === "comment-inline") {
                            do {
                                end = end - 1;
                            } while (
                                end > 0 && (types[end] === "comment" || types[end] === "comment-inline")
                            );
                        }
                        for (cc = startlen; cc > -1; cc = cc - 1) {
                            if (types[cc] === "end") {
                                dd = dd + 1;
                            }
                            if (types[cc] === "start") {
                                dd = dd - 1;
                            }
                            if (dd === 0) {
                                if ((types[cc] === "property" || types[cc] === "selector" || types[cc] === "propvar") && types[cc - 1] !== "property" && types[cc - 1] !== "selector") {
                                    start = cc;
                                    if (types[end + 1] === "comment-inline") {
                                        end = end + 1;
                                    }
                                    if (types[start - 1] === "comment") {
                                        do {
                                            start = start - 1;
                                        } while (start > -1 && types[start - 1] === "comment");
                                    }
                                    keys.push([
                                        start, end + 1,
                                        false
                                    ]);
                                    end = start - 1;
                                }
                            }
                            if (dd < 0 && cc < startlen) {
                                if (keys.length > 1 && (types[cc - 1] === "selector" || types[cc - 1] === "propvar" || (types[cc - 2] === "propvar" && types[cc - 1] === "value") || token[cc - 1] === "=" || token[cc - 1] === ":" || token[cc - 1] === "[" || token[cc - 1] === "{" || (token[cc - 1] === "," && structval !== "map") || cc === 0)) {
                                    if (structval === "map" && token[token.length - 1] !== ",") {
                                        token.push(",");
                                        types.push("semi");
                                        lines.push(0);
                                        stack.push(stack[stack.length - 1]);
                                        begin.push(begin[begin.length - 1]);
                                        keys[0][1] = keys[0][1] + 1;
                                    }
                                    keys.sort(sort);
                                    keylen   = keys.length;
                                    semiTest = false;
                                    for (dd = 0; dd < keylen; dd = dd + 1) {
                                        keyend = keys[dd][1];
                                        for (ee = keys[dd][0]; ee < keyend; ee = ee + 1) {
                                            pairToken.push(token[ee]);
                                            pairTypes.push(types[ee]);
                                            pairLines.push(lines[ee]);
                                            pairStack.push(stack[ee]);
                                            pairBegin.push(begin[ee]);
                                            if ((token[ee] === ";" && structval === "block") || (token[ee] === "," && structval === "map") || token[ee] === "}") {
                                                semiTest = true;
                                            } else if ((structval === "block" && token[ee] !== ";") && (structval === "map" && token[ee] !== ",") && token[ee] !== "}" && types[ee] !== "comment" && types[ee] !== "comment-inline") {
                                                semiTest = false;
                                            }
                                        }
                                        if (semiTest === false) {
                                            ee = pairTypes.length - 1;
                                            if (pairTypes[ee] === "comment" || pairTypes[ee] === "comment-inline") {
                                                do {
                                                    ee = ee - 1;
                                                } while (
                                                    ee > 0 && (pairTypes[ee] === "comment" || pairTypes[ee] === "comment-inline")
                                                );
                                            }
                                            ee = ee + 1;
                                            if (structval === "map") {
                                                pairToken.splice(ee, 0, ",");
                                            } else {
                                                pairToken.splice(ee, 0, ";");
                                            }
                                            pairTypes.splice(ee, 0, "semi");
                                            pairStack.splice(ee, 0, pairStack[ee]);
                                            pairBegin.splice(ee, 0, pairBegin[ee]);
                                            if (pairLines[ee - 1] > 0) {
                                                pairLines[ee - 1] = 0;
                                                pairLines.splice(ee, 0, 1);
                                            } else {
                                                pairLines.splice(ee, 0, 0);
                                            }
                                        }
                                    }
                                    ee = pairTypes.length - 1;
                                    if (pairTypes[ee] === "comment" || pairTypes[ee] === "comment-inline") {
                                        do {
                                            ee = ee - 1;
                                        } while (
                                            ee > 0 && (pairTypes[ee] === "comment" || pairTypes[ee] === "comment-inline")
                                        );
                                    }
                                    keylen = token.length - (cc + 1);
                                    token.splice(cc + 1, keylen);
                                    types.splice(cc + 1, keylen);
                                    lines.splice(cc + 1, keylen);
                                    stack.splice(cc + 1, keylen);
                                    begin.splice(cc + 1, keylen);
                                    token = token.concat(pairToken);
                                    types = types.concat(pairTypes);
                                    lines = lines.concat(pairLines);
                                    stack = stack.concat(pairStack);
                                    begin = begin.concat(pairBegin);
                                    if (structval === "map") {
                                        cc = token.length - 1;
                                        if (types[cc].indexOf("comment") === 0) {
                                            do {
                                                cc = cc - 1;
                                            } while (types[cc].indexOf("comment") === 0);
                                        }
                                        if (token[cc] === ",") {
                                            token.splice(cc, 1);
                                            types.splice(cc, 1);
                                            lines.splice(cc, 1);
                                            stack.splice(cc, 1);
                                            begin.splice(cc, 1);
                                        }
                                    }
                                }
                                return;
                            }
                        }
                    },
                    //the generic token builder
                    buildtoken = function parser_style_tokenize_build() {
                        var aa         = 0,
                            bb         = 0,
                            out        = [],
                            block      = [],
                            outy       = "",
                            mappy      = 0,
                            comma      = (
                                token.length > 0 && token[token.length - 1].charAt(token[token.length - 1].length - 1) === ","
                            ),
                            linev      = spacer(false),
                            spacestart = function () {
                                if ((/\s/).test(b[aa + 1]) === true) {
                                    do {
                                        aa = aa + 1;
                                    } while ((/\s/).test(b[aa + 1]) === true);
                                }
                            };
                        //this loop accounts for grouping mechanisms
                        for (aa = a; aa < len; aa = aa + 1) {
                            out.push(b[aa]);
                            if (b[aa - 1] !== "\\" || esctest(aa) === false) {
                                if (b[aa] === "\"" && block[block.length - 1] !== "'") {
                                    if (block[block.length - 1] === "\"") {
                                        block.pop();
                                    } else {
                                        block.push("\"");
                                    }
                                } else if (b[aa] === "'" && block[block.length - 1] !== "\"") {
                                    if (block[block.length - 1] === "'") {
                                        block.pop();
                                    } else {
                                        block.push("'");
                                    }
                                } else if (block[block.length - 1] !== "\"" && block[block.length - 1] !== "'") {
                                    if (b[aa] === "(") {
                                        mappy = mappy + 1;
                                        block.push(")");
                                        spacestart();
                                    } else if (b[aa] === "[") {
                                        block.push("]");
                                        spacestart();
                                    } else if (b[aa] === "#" && b[aa + 1] === "{") {
                                        out.push("{");
                                        aa = aa + 1;
                                        block.push("}");
                                        spacestart();
                                    } else if (b[aa] === block[block.length - 1]) {
                                        block.pop();
                                        if ((/\s/).test(out[out.length - 2]) === true) {
                                            out.pop();
                                            do {
                                                out.pop();
                                            } while ((/\s/).test(out[out.length - 1]) === true);
                                            out.push(b[aa]);
                                        }
                                    }
                                }
                            }
                            if (structval === "map" && block.length === 0 && (b[aa + 1] === "," || b[aa + 1] === ")")) {
                                if (b[aa + 1] === ")" && token[token.length - 1] === "(") {
                                    token.pop();
                                    types.pop();
                                    lines.pop();
                                    stack.pop();
                                    begin.pop();
                                    struct.pop();
                                    structval = stack[stack.length - 1];
                                    out       = ["("];
                                    aa        = a - 1;
                                } else {
                                    break;
                                }
                            }
                            if (b[aa + 1] === ":") {
                                bb = aa;
                                if ((/\s/).test(b[bb]) === true) {
                                    do {
                                        bb = bb - 1;
                                    } while ((/\s/).test(b[bb]) === true);
                                }
                                outy = b
                                    .slice(bb - 6, bb + 1)
                                    .join("");
                                if (outy.indexOf("filter") === outy.length - 6 || outy.indexOf("progid") === outy.length - 6) {
                                    outy = "filter";
                                }
                            }
                            if (block.length === 0 && ((b[aa + 1] === ";" && esctest(aa + 1) === false) || (b[aa + 1] === ":" && b[aa] !== ":" && b[aa + 2] !== ":" && outy !== "filter" && outy !== "progid") || b[aa + 1] === "}" || b[aa + 1] === "{" || (b[aa + 1] === "/" && (b[aa + 2] === "*" || b[aa + 2] === "/")))) {
                                bb = out.length - 1;
                                if ((/\s/).test(out[bb]) === true) {
                                    do {
                                        bb = bb - 1;
                                        aa = aa - 1;
                                        out.pop();
                                    } while ((/\s/).test(out[bb]) === true);
                                }
                                break;
                            }
                            if (out[0] === "@" && block.length === 0 && (b[aa + 1] === "\"" || b[aa + 1] === "'")) {
                                break;
                            }
                        }
                        a = aa;
                        if (structval === "map" && out[0] === "(") {
                            mapper[mapper.length - 1] = mapper[mapper.length - 1] - 1;
                        }
                        if (comma === true && structval !== "map" && types[types.length - 1] !== "comment" && types[types.length - 1] !== "comment-inline") {
                            token[token.length - 1] = token[token.length - 1] + out
                                .join("")
                                .replace(/\s+/g, " ")
                                .replace(/^\s/, "")
                                .replace(/\s$/, "");
                            return;
                        }
                        token.push(
                            out.join("").replace(/\s+/g, " ").replace(/^\s/, "").replace(/\s$/, "")
                        );
                        begin.push(struct[struct.length - 1]);
                        stack.push(structval);
                        lines.push(linev);
                        if (token[token.length - 1].indexOf("extend(") === 0) {
                            ltype = "pseudo";
                            types.push("pseudo");
                        } else if ("\"'".indexOf(token[token.length - 1].charAt(0)) > -1 && types[types.length - 1] === "propvar") {
                            ltype = "item";
                            types.push("value");
                        } else if (out[0] === "@" || out[0] === "$") {
                            if (types[types.length - 1] === "colon" && (types[types.length - 2] === "property" || types[types.length - 2] === "propvar")) {
                                ltype = "value";
                                types.push("value");
                            } else {
                                ltype = "propvar";
                                types.push("propvar");
                                outy = token[token.length - 1];
                                aa   = outy.indexOf("(");
                                if (outy.charAt(outy.length - 1) === ")" && aa > 0) {
                                    outy                    = outy.slice(aa + 1, outy.length - 1);
                                    token[token.length - 1] = token[token.length - 1].slice(0, aa + 1) + value(
                                        outy,
                                        false
                                    ) + ")";
                                }
                            }
                        } else {
                            ltype = "item";
                            types.push("item");
                        }
                    }, // Some tokens receive a generic type named 'item' because their type is unknown
                    // until we know the following syntax.  This function replaces the type 'item'
                    // with something more specific.
                    item       = function parser_style_tokenize_item(type) {
                        var aa    = types.length,
                            bb    = 0,
                            coms  = [],
                            tokel = (token.length > 1)
                                ? token[token.length - 2]
                                : "",
                            toked = tokel.slice(tokel.length - 2);
                        //backtrack through immediately prior comments to find the correct token
                        if (ltype === "comment" || ltype === "comment-inline") {
                            do {
                                aa    = aa - 1;
                                ltype = types[aa];
                                coms.push(token[aa]);
                            } while (aa > 0 && (ltype === "comment" || ltype === "comment-inline"));
                        } else {
                            aa = aa - 1;
                        }
                        //if the last non-comment type is 'item' then id it
                        if (ltype === "item" && types[aa].indexOf("external") < 0) {
                            if (type === "start") {
                                if (types[aa - 1] !== "comment" && types[aa - 1] !== "comment-inline" && types[aa - 1] !== "end" && types[aa - 1] !== "start" && types[aa - 1] !== "semi" && types[aa - 1] !== undefined && types[aa - 1].indexOf("external") < 0) {
                                    (function parser_style_tokenize_item_selparts() {
                                        var parts = [],
                                            cc    = aa,
                                            dd    = 0;
                                        do {
                                            parts.push(token[cc]);
                                            if (lines[cc] > 0 && token[cc] === ":" && token[cc - 1] !== ":") {
                                                parts.push(" ");
                                            } else if (token[cc] !== ":") {
                                                parts.push(" ");
                                            }
                                            cc = cc - 1;
                                        } while (
                                            cc > -1 && types[cc] !== "comment" && types[cc] !== "comment-inline" && types[cc] !== "end" && types[cc] !== "start" && types[cc] !== "semi" && types[cc] !== undefined
                                        );
                                        parts.reverse();
                                        cc = cc + 1;
                                        dd = aa - cc;
                                        token.splice(cc, dd);
                                        types.splice(cc, dd);
                                        lines.splice(cc, dd);
                                        stack.splice(cc, dd);
                                        begin.splice(cc, dd);
                                        aa        = aa - dd;
                                        token[aa] = parts
                                            .join("")
                                            .replace(/:\u0020/g, ":")
                                            .replace(/(\s*,\s*)/g, ",");
                                    }());
                                } else {
                                    token[aa] = token[aa].replace(/(\s*,\s*)/g, ",");
                                }
                                if (options.compressedcss === true) {
                                    token[aa] = token[aa]
                                        .replace(/\s*&/, " &")
                                        .replace(/\s*>\s*/g, ">")
                                        .replace(/:\s+/g, ":")
                                        .replace(/^(\s+)/, "")
                                        .replace(/(\s+)$/, "");
                                } else {
                                    token[aa] = token[aa]
                                        .replace(/\s*&/, " &")
                                        .replace(/\s*>\s*/g, " > ")
                                        .replace(/:\s+/g, ": ")
                                        .replace(/^(\s+)/, "")
                                        .replace(/(\s+)$/, "");
                                }
                                (function parser_style_tokenize_item_selectorsort() {
                                    var y    = 0,
                                        slen = token[aa].length,
                                        z    = "",
                                        mark = 0,
                                        list = [];
                                    for (y = 0; y < slen; y = y + 1) {
                                        if (z === "" && token[aa].charAt(y) === ",") {
                                            list.push(token[aa].slice(mark, y));
                                            mark = y + 1;
                                        } else if (token[aa].charAt(y) === "\"" || token[aa].charAt(y) === "'" || token[aa].charAt(y) === "(" || token[aa].charAt(y) === "{") {
                                            z = token[aa].charAt(y);
                                        } else if (token[aa].charAt(y) === z && (z === "\"" || z === "''")) {
                                            z = "";
                                        } else if (token[aa].charAt(y) === ")" && z === "(") {
                                            z = "";
                                        } else if (token[aa].charAt(y) === "}" && z === "{") {
                                            z = "";
                                        }
                                    }
                                    list.push(token[aa].slice(mark, y));
                                    list.sort();
                                    token[aa] = list
                                        .join(",")
                                        .replace(/^(\s+)/, "");
                                }());
                                types[aa] = "selector";
                                ltype     = "selector";
                            } else if (type === "end") {
                                types[aa] = "value";
                                ltype     = "value";
                                if (options.mode !== "diff") {
                                    token[aa] = token[aa].replace(/\s*!\s+important/, " !important");
                                    if (options.quoteConvert !== "none" && (token[aa - 2] === "font" || token[aa - 2] === "font-family")) {
                                        token[aa] = value(token[aa], true);
                                    } else {
                                        token[aa] = value(token[aa], false);
                                    }
                                }
                                //take comments out until the 'item' is found and then put the comments back
                                if (options.mode === "beautify" || options.mode === "parse" || (options.mode === "diff" && options.diffcomments === true)) {
                                    if (token[token.length - 2] === "{") {
                                        types[types.length - 1] = "propvar";
                                    } else if (structval === "block") {
                                        if (coms.length > 0 && ltype !== "semi" && ltype !== "end" && ltype !== "start") {
                                            aa = coms.length - 1;
                                            do {
                                                token.pop();
                                                types.pop();
                                                lines.pop();
                                                stack.pop();
                                                begin.pop();
                                                aa = aa - 1;
                                            } while (aa > 0);
                                            if (options.mode === "diff") {
                                                token.push("x;");
                                            } else {
                                                token.push(";");
                                            }
                                            stack.push(structval);
                                            begin.push(struct[struct.length - 1]);
                                            types.push("semi");
                                            lines.push(spacer(false));
                                            bb = coms.length - 1;
                                            do {
                                                token.push(coms[aa]);
                                                if (coms[aa].indexOf("//") === 0 && lines[lines.length - 1] === 0) {
                                                    types.push("comment-inline");
                                                } else {
                                                    types.push("comment");
                                                }
                                                stack.push(structval);
                                                begin.push(struct[struct.length - 1]);
                                                lines.push(0);
                                                aa = aa + 1;
                                            } while (aa < bb);
                                        } else {
                                            if (options.mode === "diff") {
                                                token.push("x;");
                                            } else {
                                                token.push(";");
                                            }
                                            stack.push(structval);
                                            begin.push(struct[struct.length - 1]);
                                            types.push("semi");
                                            lines.push(spacer(false));
                                        }
                                    }
                                }
                            } else if (type === "semi") {
                                if (types[aa - 1] === "colon") {
                                    types[aa] = "value";
                                    ltype     = "value";
                                    if (options.mode !== "diff") {
                                        token[aa] = token[aa].replace(/\s*!\s+important/, " !important");
                                        if (options.quoteConvert !== "none" && (token[aa - 2] === "font" || token[aa - 2] === "font-family")) {
                                            token[aa] = value(token[aa], true);
                                        } else {
                                            token[aa] = value(token[aa], false);
                                        }
                                    }
                                } else {
                                    //properties without values are considered variables
                                    if (types[aa] !== "value") {
                                        if (types[aa] === "item" && types[aa - 1] === "value" && (toked === "}}" || toked === "?>" || toked === "->" || toked === "%}" || toked === "%>")) {
                                            if (isNaN(token[token.length - 1]) === true) {
                                                token[token.length - 2] = tokel + token.pop();
                                            } else {
                                                token[token.length - 2] = tokel + " " + token.pop();
                                            }
                                            types.pop();
                                            return;
                                        }
                                        types[aa] = "propvar";
                                        ltype     = "propvar";
                                    }
                                    if (token[aa].indexOf("\"") > 0) {
                                        bb        = token[aa].indexOf("\"");
                                        a         = a - (token[aa].length - bb);
                                        token[aa] = token[aa].slice(0, bb);
                                        buildtoken();
                                    } else if (token[aa].indexOf("'") > 0) {
                                        bb        = token[aa].indexOf("'");
                                        a         = a - (token[aa].length - bb);
                                        token[aa] = token[aa].slice(0, bb);
                                        buildtoken();
                                    } else if ((/\s/).test(token[aa]) === true) {
                                        bb = token[aa]
                                            .replace(/\s/, " ")
                                            .indexOf(" ");
                                        if (bb < token[aa].indexOf("(") && bb < token[aa].indexOf("[")) {
                                            a         = a - (token[aa].length - bb);
                                            token[aa] = token[aa].slice(0, bb);
                                            buildtoken();
                                        }
                                    }
                                }
                            } else if (type === "colon") {
                                types[aa] = "property";
                                ltype     = "property";
                            } else if (token[aa].charAt(0) === "@" && ((types[aa - 2] !== "propvar" && types[aa - 2] !== "property") || types[aa - 1] === "semi")) {
                                types[aa] = "propvar";
                                ltype     = "propvar";
                            }
                        }
                    },
                    external   = function parser_style_tokenize_external(open, end) {
                        var store  = [],
                            quote  = "",
                            name   = "",
                            endlen = 0,
                            start  = open.length,
                            linev  = spacer(false),
                            exit   = function parser_style_tokenize_external_exit(typename) {
                                var endtype = types[types.length - 2];
                                if (ltype === "item") {
                                    if (endtype === "colon") {
                                        types[types.length - 1] = "value";
                                    } else {
                                        item(endtype);
                                    }
                                }
                                types.push(typename);
                            };
                        nosort[nosort.length - 1] = true;
                        for (a = a; a < len; a = a + 1) {
                            store.push(b[a]);
                            if (quote === "") {
                                if (b[a] === "\"") {
                                    quote = "\"";
                                } else if (b[a] === "'") {
                                    quote = "'";
                                } else if (b[a] === "/") {
                                    if (b[a + 1] === "/") {
                                        quote = "/";
                                    } else if (b[a + 1] === "*") {
                                        quote = "*";
                                    }
                                } else if (b[a + 1] === end.charAt(0)) {
                                    do {
                                        endlen = endlen + 1;
                                        a      = a + 1;
                                        store.push(b[a]);
                                    } while (a < len && endlen < end.length && b[a + 1] === end.charAt(endlen));
                                    if (endlen === end.length) {
                                        quote = store.join("");
                                        if ((/\s/).test(quote.charAt(start)) === true) {
                                            do {
                                                start = start + 1;
                                            } while ((/\s/).test(quote.charAt(start)) === true);
                                        }
                                        endlen = start;
                                        do {
                                            endlen = endlen + 1;
                                        } while (endlen < end.length && (/\s/).test(quote.charAt(endlen)) === false);
                                        if (endlen === quote.length) {
                                            endlen = endlen - end.length;
                                        }
                                        if (open === "{%") {
                                            if (quote.indexOf("{%-") === 0) {
                                                quote = quote
                                                    .replace(/^(\{%-\s*)/, "{%- ")
                                                    .replace(/(\s*-%\})$/, " -%}");
                                                name  = quote.slice(4);
                                            } else {
                                                quote = quote
                                                    .replace(/^(\{%\s*)/, "{% ")
                                                    .replace(/(\s*%\})$/, " %}");
                                                name  = quote.slice(3);
                                            }
                                        }
                                        if (open === "{{") {
                                            quote = quote
                                                .replace(/^(\{\{\s+)/, "{{")
                                                .replace(/(\s+\}\})$/, "}}");
                                        }
                                        if (ltype === "item" && types[types.length - 2] === "colon" && (types[types.length - 3] === "property" || types[types.length - 3] === "propvar")) {
                                            ltype                   = "value";
                                            types[types.length - 1] = "value";
                                            if (isNaN(token[token.length - 1]) === true && token[token.length - 1].charAt(token[token.length - 1].length - 1) !== ")") {
                                                token[token.length - 1] = token[token.length - 1] + quote;
                                            } else {
                                                token[token.length - 1] = token[token.length - 1] + " " + quote;
                                            }
                                            return;
                                        }
                                        lines.push(linev);
                                        token.push(quote);
                                        begin.push(struct[struct.length - 1]);
                                        stack.push(structval);
                                        if (open === "{%") {
                                            name = name.slice(0, name.indexOf(" "));
                                            if (name.indexOf("(") > 0) {
                                                name = name.slice(0, name.indexOf("("));
                                            }
                                            store = [
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
                                            if (name === "else" || name === "elseif" || name === "when" || name === "elif") {
                                                return exit("external_else");
                                            }
                                            for (endlen = store.length - 1; endlen > -1; endlen = endlen - 1) {
                                                if (name === store[endlen]) {
                                                    return exit("external_start");
                                                }
                                                if (name === "end" + store[endlen]) {
                                                    return exit("external_end");
                                                }
                                            }
                                        } else if (open === "{{") {
                                            name   = quote.slice(2);
                                            endlen = name.length;
                                            start  = 0;
                                            do {
                                                start = start + 1;
                                            } while (
                                                start < endlen && (/\s/).test(name.charAt(start)) === false && name.charAt(start) !== "("
                                            );
                                            name = name.slice(0, start);
                                            if (name.charAt(name.length - 2) === "}") {
                                                name = name.slice(0, name.length - 2);
                                            }
                                            if (name === "end") {
                                                return exit("external_end");
                                            }
                                            if (name === "block" || name === "define" || name === "form" || name === "if" || name === "range" || name === "with") {
                                                return exit("external_start");
                                            }
                                        }
                                        return exit("external");
                                    }
                                    endlen = 0;
                                }
                            } else if (quote === b[a]) {
                                if (quote === "\"" || quote === "'") {
                                    quote = "";
                                } else if (quote === "/" && (b[a] === "\r" || b[a] === "\n")) {
                                    quote = "";
                                } else if (quote === "*" && b[a + 1] === "/") {
                                    quote = "";
                                }
                            }
                        }
                    },
                    //finds comments include those JS looking '//' comments
                    comment    = function parser_style_tokenize_comment(inline) {
                        var aa        = 0,
                            bb        = 0,
                            out       = [b[a]],
                            type      = "comment",
                            extra     = "",
                            spareType = [],
                            spareToke = [],
                            spareLine = [],
                            spareBegn = [],
                            spareStak = [],
                            linev     = spacer(false);
                        type = (inline === true && linev === 0)
                            ? "comment-inline"
                            : "comment";
                        for (aa = a + 1; aa < len; aa = aa + 1) {
                            out.push(b[aa]);
                            if ((inline === false && b[aa - 1] === "*" && b[aa] === "/") || (inline === true && (b[aa + 1] === "\n" || b[aa + 1] === "\r"))) {
                                break;
                            }
                        }
                        if (ltype === "item") {
                            bb = aa;
                            do {
                                bb = bb + 1;
                                if (b[bb] === "/") {
                                    if (b[bb + 1] === "*" || b[bb + 1] === "/") {
                                        extra = b[bb + 1];
                                    } else if (b[bb - 1] === "*" && extra === "*") {
                                        extra = "";
                                        bb    = bb + 1;
                                    }
                                } else if ((b[bb] === "\n" || b[bb] === "\r") && extra === "/") {
                                    extra = "";
                                    bb    = bb + 1;
                                }
                            } while (
                                bb < len && ((extra === "" && (/\s/).test(b[bb]) === true) || extra !== "")
                            );
                            if (b[bb] === "{") {
                                item("start");
                            } else if (b[bb] === "}") {
                                item("end");
                            } else if (b[bb] === ";") {
                                item("semi");
                            } else if (b[bb] === ":") {
                                item("colon");
                            } else {
                                item();
                            }
                        }
                        a = aa;
                        if (options.mode === "minify") {
                            out.push(lf);
                        }
                        if (options.mode === "beautify" || options.mode === "parse" || (options.mode === "diff" && options.diffcomments === true) || (options.mode === "minify" && options.topcoms === true)) {
                            if (token.length > 0 && (ltype === "selector" || ltype === "propvar") && types[types.length - 1] !== "comment" && types[types.length - 1] !== "comment-inline") {
                                spareToke.push(token[token.length - 1]);
                                token.pop();
                                types.pop();
                                lines.pop();
                                begin.pop();
                                stack.pop();
                                begin.push(struct[struct.length - 1]);
                                stack.push(structval);
                                token.push(out.join(""));
                                types.push(type);
                                lines.push(linev);
                                begin.push(struct[struct.length - 1]);
                                stack.push(structval);
                                token.push(spareToke[0]);
                                if (ltype === "propvar") {
                                    types.push("propvar");
                                } else {
                                    types.push("selector");
                                }
                                lines.push(0);
                            } else if (ltype === "colon" || ltype === "property" || ltype === "value" || ltype === "propvar") {
                                do {
                                    spareToke.push(token[token.length - 1]);
                                    spareType.push(types[types.length - 1]);
                                    spareLine.push(lines[lines.length - 1]);
                                    spareStak.push(stack[stack.length - 1]);
                                    spareBegn.push(begin[begin.length - 1]);
                                    token.pop();
                                    types.pop();
                                    lines.pop();
                                    stack.pop();
                                    begin.pop();
                                } while (
                                    types.length > 1 && types[types.length - 1] !== "semi" && types[types.length - 1] !== "start"
                                );
                                token.push(out.join(""));
                                types.push(type);
                                lines.push(linev);
                                stack.push(structval);
                                begin.push(struct[struct.length - 1]);
                                do {
                                    token.push(spareToke[spareToke.length - 1]);
                                    types.push(spareType[spareType.length - 1]);
                                    lines.push(spareLine[spareLine.length - 1]);
                                    stack.push(spareStak[spareStak.length - 1]);
                                    begin.push(spareBegn[spareBegn.length - 1]);
                                    spareToke.pop();
                                    spareType.pop();
                                    spareLine.pop();
                                    spareStak.pop();
                                    spareBegn.pop();
                                } while (spareToke.length > 0);
                            } else {
                                ltype = type;
                                types.push(type);
                                token.push(out.join(""));
                                lines.push(linev);
                                stack.push(structval);
                                begin.push(struct[struct.length - 1]);
                            }
                        }
                    },
                    //do fancy things to property types like: sorting, consolidating, and padding
                    properties = function parser_style_tokenize_properties() {
                        var aa    = 0,
                            bb    = 1,
                            cc    = 0,
                            dd    = 0,
                            p     = [],
                            set   = [
                                []
                            ],
                            next  = 0,
                            stoke = [],
                            stype = [],
                            sline = [],
                            sstak = [],
                            sbegn = [];
                        //identify properties and build out prop/val sets
                        for (aa = token.length - 1; aa > -1; aa = aa - 1) {
                            if (types[aa] === "start") {
                                bb = bb - 1;
                                if (bb === 0) {
                                    next = aa;
                                    set.pop();
                                    for (aa = set.length - 1; aa > -1; aa = aa - 1) {
                                        set[aa].reverse();
                                    }
                                    break;
                                }
                            }
                            if (types[aa] === "end") {
                                bb = bb + 1;
                            }
                            if (bb === 1 && (types[aa] === "property" || (types[aa] === "propvar" && types[aa + 1] === "colon")) && options.mode === "beautify") {
                                p.push(aa);
                            }
                            set[set.length - 1].push(aa);
                            if (bb === 1 && (types[aa - 1] === "comment" || types[aa - 1] === "comment-inline" || types[aa - 1] === "semi" || types[aa - 1] === "end" || types[aa - 1] === "start") && types[aa] !== "start" && types[aa] !== "end") {
                                set.push([]);
                            }
                        }
                        //this reverse fixes the order of consecutive comments
                        set.reverse();
                        p.reverse();

                        //consolidate margin and padding
                        (function parser_style_tokenize_properties_propcheck() {
                            var leng      = set.length,
                                fourcount = function parser_style_tokenize_properties_propcheck_fourcount(name) {
                                    var test     = [
                                            false, false, false, false
                                        ],
                                        val      = [
                                            "0", "0", "0", "0"
                                        ],
                                        zero     = (/^(0+([a-z]+|%))/),
                                        start    = aa,
                                        yy       = -1,
                                        zz       = 0,
                                        valsplit = [],
                                        store    = function parser_style_tokenize_properties_propcheck_fourcount_store(side) {
                                            yy         = yy + 1;
                                            val[side]  = token[set[aa][2]];
                                            test[side] = true;
                                            if (start < 0) {
                                                start = aa;
                                            }
                                        };
                                    for (aa = aa; aa < leng; aa = aa + 1) {
                                        if (token[set[aa][2]] !== undefined && token[set[aa][0]].indexOf(name) === 0) {
                                            if (token[set[aa][0]] === name || token[set[aa][0]].indexOf(name + " ") === 0) {
                                                yy       = yy + 1;
                                                valsplit = token[set[aa][2]].split(" ");
                                                if (valsplit.length === 1) {
                                                    val = [
                                                        token[set[aa][2]],
                                                        token[set[aa][2]],
                                                        token[set[aa][2]],
                                                        token[set[aa][2]]
                                                    ];
                                                } else if (valsplit.length === 2) {
                                                    val = [
                                                        valsplit[0], valsplit[1], valsplit[0], valsplit[1]
                                                    ];
                                                } else if (valsplit.length === 3) {
                                                    val = [
                                                        valsplit[0], valsplit[1], valsplit[2], valsplit[1]
                                                    ];
                                                } else if (valsplit.length === 4) {
                                                    val = [
                                                        valsplit[0], valsplit[1], valsplit[2], valsplit[3]
                                                    ];
                                                } else {
                                                    return;
                                                }
                                                test = [true, true, true, true];
                                            } else if (token[set[aa][0]].indexOf(name + "-bottom") === 0) {
                                                store(2);
                                            } else if (token[set[aa][0]].indexOf(name + "-left") === 0) {
                                                store(3);
                                            } else if (token[set[aa][0]].indexOf(name + "-right") === 0) {
                                                store(1);
                                            } else if (token[set[aa][0]].indexOf(name + "-top") === 0) {
                                                store(0);
                                            }
                                        }
                                        if (set[aa + 1] === undefined || token[set[aa + 1][0]].indexOf(name) < 0 || aa === leng - 1) {
                                            if (test[0] === true && test[1] === true && test[2] === true && test[3] === true) {
                                                set.splice(start + 1, yy);
                                                leng = leng - yy;
                                                aa   = aa - yy;
                                                zz   = 0;
                                                bb   = p.length;
                                                do {
                                                    if (p[zz] === set[start][0]) {
                                                        break;
                                                    }
                                                    zz = zz + 1;
                                                } while (zz < bb);
                                                if (zz < bb) {
                                                    p.splice(zz + 1, yy);
                                                }
                                                token[set[start][0]] = name;
                                                if (zero.test(val[0]) === true) {
                                                    val[0] = "0";
                                                }
                                                if (zero.test(val[1]) === true) {
                                                    val[1] = "0";
                                                }
                                                if (zero.test(val[2]) === true) {
                                                    val[2] = "0";
                                                }
                                                if (zero.test(val[3]) === true) {
                                                    val[3] = "0";
                                                }
                                                if (val[1] === val[3]) {
                                                    val.pop();
                                                    if (val[0] === val[2]) {
                                                        val.pop();
                                                        if (val[0] === val[1]) {
                                                            val.pop();
                                                        }
                                                    }
                                                }
                                                token[set[start][2]] = val.join(" ");
                                                if (token[set[start][2]].indexOf("!important") > 0) {
                                                    token[set[start][2]] = token[set[start][2]].replace(/\s!important/g, "") + " !i" +
                                                            "mportant";
                                                }
                                                if (options.mode === "beautify" && verticalop === true) {
                                                    if (token[set[start][0]].charAt(token[set[start][0]].length - 1) === " ") {
                                                        yy = token[set[start][0]].length - name.length;
                                                        do {
                                                            name = name + " ";
                                                            yy   = yy - 1;
                                                        } while (yy > 0);
                                                    }
                                                }
                                            }
                                            break;
                                        }
                                    }
                                };
                            for (aa = 0; aa < leng; aa = aa + 1) {
                                if (types[set[aa][0]] === "property") {
                                    if (token[set[aa][0]].indexOf("margin") === 0) {
                                        fourcount("margin");
                                    }
                                    if (token[set[aa][0]].indexOf("padding") === 0) {
                                        fourcount("padding");
                                    }
                                }
                            }
                        }());

                        //pad out those property names so that the colons are vertically aligned
                        if (verticalop === true) {
                            bb = 0;
                            for (aa = p.length - 1; aa > -1; aa = aa - 1) {
                                if (token[p[aa]].length > bb && token[p[aa]] !== "filter" && token[p[aa]] !== "progid") {
                                    bb = token[p[aa]].length;
                                }
                            }
                            for (aa = p.length - 1; aa > -1; aa = aa - 1) {
                                cc = bb - token[p[aa]].length;
                                if (cc > 0 && token[p[aa]] !== "filter" && token[p[aa]] !== "progid") {
                                    do {
                                        token[p[aa]] = token[p[aa]] + " ";
                                        cc           = cc - 1;
                                    } while (cc > 0);
                                }
                            }
                            if (endtest === false) {
                                return;
                            }
                        }

                        bb = set.length;
                        for (aa = 0; aa < bb; aa = aa + 1) {
                            dd = set[aa].length;
                            for (cc = 0; cc < dd; cc = cc + 1) {
                                stoke.push(token[set[aa][cc]]);
                                stype.push(types[set[aa][cc]]);
                                sline.push(lines[set[aa][cc]]);
                                sstak.push(stack[set[aa][cc]]);
                                sbegn.push(begin[set[aa][cc]]);
                            }
                        }
                        //replace a block's data with sorted analyzed data
                        token.splice(next + 1, token.length - next - 1);
                        types.splice(next + 1, types.length - next - 1);
                        lines.splice(next + 1, lines.length - next - 1);
                        stack.splice(next + 1, stack.length - next - 1);
                        begin.splice(next + 1, begin.length - next - 1);
                        token = token.concat(stoke);
                        types = types.concat(stype);
                        lines = lines.concat(sline);
                        stack = stack.concat(sstak);
                        begin = begin.concat(sbegn);
                    };
                //token building loop
                for (a = 0; a < len; a = a + 1) {
                    if (ltype !== "comment" && ltype !== "comment-inline" && ltype !== "" && options.topcoms === true) {
                        options.topcoms = false;
                    }
                    if ((/\s/).test(b[a]) === true) {
                        space = space + b[a];
                    } else if (b[a] === "/" && b[a + 1] === "*") {
                        comment(false);
                    } else if (b[a] === "/" && b[a + 1] === "/") {
                        comment(true);
                    } else if (b[a] === "<" && b[a + 1] === "?" && b[a + 2] === "p" && b[a + 3] === "h" && b[a + 4] === "p") {
                        //php
                        external("<?php", "?>");
                    } else if (b[a] === "<" && b[a + 1] === "%") {
                        //asp
                        external("<%", "%>");
                    } else if (b[a] === "{" && b[a + 1] === "%") {
                        //asp
                        external("{%", "%}");
                    } else if (b[a] === "{" && b[a + 1] === "{" && b[a + 2] === "{") {
                        //mustache
                        external("{{{", "}}}");
                    } else if (b[a] === "{" && b[a + 1] === "{") {
                        //handlebars
                        external("{{", "}}");
                    } else if (b[a] === "<" && b[a + 1] === "!" && b[a + 2] === "-" && b[a + 3] === "-" && b[a + 4] === "#") {
                        //ssi
                        external("<!--#", "-->");
                    } else if (b[a] === "@" && b[a + 1] === "e" && b[a + 2] === "l" && b[a + 3] === "s" && b[a + 4] === "e" && (b[a + 5] === "{" || (/\s/).test(b[a + 5]) === true)) {
                        types.push("external_else");
                        token.push("@else");
                        lines.push(0);
                        stack.push(stack[stack.length - 1]);
                        begin.push(begin[begin.length - 1]);
                        a = a + 4;
                    } else if (b[a] === "{" || (b[a] === "(" && token[token.length - 1] === ":" && types[types.length - 2] === "propvar")) {
                        if (b[a] === "{" && token[token.length - 2] === ":") {
                            types[types.length - 1] = "pseudo";
                        }
                        item("start");
                        struct.push(token.length);
                        ltype = "start";
                        types.push("start");
                        token.push(b[a]);
                        begin.push(token.length);
                        if (b[a] === "(") {
                            structval = "map";
                            stack.push("map");
                            mapper.push(0);
                        } else {
                            structval = "block";
                            stack.push("block");
                        }
                        nosort.push(false);
                        lines.push(spacer(false));
                    } else if (b[a] === "}" || (b[a] === ")" && structval === "map" && mapper[mapper.length - 1] === 0)) {
                        endtest = true;
                        if (b[a] === "}" && types[types.length - 1] === "item" && token[token.length - 2] === "{" && token[token.length - 3] !== undefined && token[token.length - 3].charAt(token[token.length - 3].length - 1) === "@") {
                            token[token.length - 3] = token[token.length - 3] + "{" + token[token.length - 1] +
                                    "}";
                            token.pop();
                            token.pop();
                            types.pop();
                            types.pop();
                            lines.pop();
                            lines.pop();
                            stack.pop();
                            stack.pop();
                            begin.pop();
                            begin.pop();
                        } else {
                            if (b[a] === ")") {
                                mapper.pop();
                            } else if (b[a] === "}" && ltype === "value" && token[token.length - 1] !== ";") {
                                token.push(";");
                                types.push("semi");
                                lines.push(0);
                                stack.push("block");
                                begin.push(begin[begin.length - 1]);
                            }
                            item("end");
                            if (options.mode !== "diff") {
                                properties();
                            }
                            ltype = "end";
                            if (objsortop === true && nosort[nosort.length - 1] === false) {
                                objSort();
                            }
                            nosort.pop();
                            types.push("end");
                            token.push(b[a]);
                            lines.push(spacer(false));
                            stack.push(structval);
                            begin.push(struct[struct.length - 1]);
                        }
                        struct.pop();
                        if (token[struct[struct.length - 1]] === "{") {
                            structval = "block";
                        } else if (token[struct[struct.length - 1]] === "(") {
                            structval = "map";
                        } else {
                            structval = "root";
                        }
                    } else if (b[a] === ";" || (b[a] === "," && structval === "map")) {
                        item("semi");
                        if (types[types.length - 1] !== "semi" && types[types.length - 1] !== "start" && esctest(a) === false) {
                            ltype = "semi";
                            types.push("semi");
                            token.push(b[a]);
                            lines.push(spacer(false));
                            stack.push(structval);
                            begin.push(begin[begin.length - 1]);
                        }
                        space = "";
                    } else if (b[a] === ":" && types[types.length - 1] !== "end") {
                        item("colon");
                        types.push("colon");
                        token.push(":");
                        if ((/\s/).test(b[a - 1]) === true) {
                            lines.push(1);
                        } else {
                            lines.push(0);
                        }
                        ltype = "colon";
                        space = "";
                    } else {
                        if (structval === "map" && b[a] === "(") {
                            mapper[mapper.length - 1] = mapper[mapper.length - 1] + 1;
                        }
                        buildtoken();
                    }
                }
                if (endtest === false && verticalop === true) {
                    properties();
                }
            }());

            return {
                attrs: attrs,
                begin: begin,
                jscom: jscom,
                lines: lines,
                presv: presv,
                stack: stack,
                token: token,
                types: types
            }
        };
        return lexer[options.type](options.source);
    };
    if (typeof module === "object" && typeof module.parent === "object") {
        module.exports = parser;
    }
}());