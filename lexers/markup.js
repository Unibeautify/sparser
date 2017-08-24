/*global global*/
(function markup_init() {
    "use strict";
    const framework = global.parseFramework,
        markup = function lexer_markup(source) {
            let a             = 0,
                linepreserve  = 0,
                list          = 0,
                litag         = 0,
                sgmlflag      = 0,
                minspace      = "",
                cftransaction = false,
                ext           = false;
            const parse       = framework.parse,
                data          = parse.data,
                options       = parse.options,
                b             = source.split(""),
                c             = b.length,
                // Find the lowercase tag name of the provided token.
                tagName       = function lexer_markup_tagName(el) {
                    let space = "",
                        name  = "";
                    const reg   = (/^(\{((%-?)|\{-?)\s*)/);
                    if (typeof el !== "string") {
                        return "";
                    }
                    space = el
                        .replace(reg, "%")
                        .replace(/\s+/, " ")
                        .indexOf(" ");
                    name  = el.replace(reg, " ");
                    name  = (space < 0)
                        ? name.slice(1, el.length - 1)
                        : name.slice(1, space);
                    if (options.lang === "html" || options.lang === "coldfusion") {
                        name = name.toLowerCase();
                    }
                    name = name.replace(/(\}\})$/, "");
                    if (name.indexOf("(") > 0) {
                        name = name.slice(0, name.indexOf("("));
                    }
                    return name;
                },

                //parses tags, attributes, and template elements
                tag           = function lexer_markup_tag(end) {

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

                    let igcount         = 0,
                        element         = "",
                        lastchar        = "",
                        ltype           = "",
                        tname           = "",
                        comment         = false,
                        cheat           = false,
                        earlyexit       = false,
                        ignoreme        = false,
                        jscom           = false,
                        nopush          = false,
                        nosort          = false,
                        preserve        = false,
                        simple          = false,
                        singleton       = false,
                        attstore        = [];
                    const record          = {
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
                        // * prohibited - means there is no corresponding end tag
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
                        arname          = function lexer_markup_tag_name(x) {
                            const eq = x.indexOf("=");
                            if (eq > 0 && ((eq < x.indexOf("\"") && x.indexOf("\"") > 0) || (eq < x.indexOf("'") && x.indexOf("'") > 0))) {
                                return x.slice(0, eq);
                            }
                            return x;
                        },

                        // attribute parser
                        attributeRecord = function lexer_markup_tag_attributeRecord() {
                            let ind          = 0,
                                eq           = 0,
                                dq           = 0,
                                sq           = 0,
                                slice        = "",
                                name         = "",
                                cft          = cftags[
                                    tname
                                        .toLowerCase()
                                        .replace(/\/$/, "")
                                ],
                                store        = [];
                            const len          = attstore.length,
                                syntax       = "<{\"'=/",
                                jsxAttribute = function lexer_markup_tag_attributeRecord_jsxAttribute(str) {
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
                                element = element.replace(/>$/, "/>");
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
                            if (options.tagSort === true && jscom === false && options.lang !== "jsx" && nosort === false && tname !== "cfif" && tname !== "cfelseif" && tname !== "cfset") {
                                attstore     = parse.safeSort(attstore);
                                record.presv = true;
                            } else {
                                record.presv = false;
                            }

                            // preparation for a coldfusion edge case
                            if (tname.slice(0, 3).toLowerCase() === "cf_") {
                                cft = "required";
                            }

                            record.begin = parse.count;
                            record.lines = 0;
                            record.stack = tname.replace(/\/$/, "");
                            record.types = "attribute";

                            if (ind < len) {
                                do {
                                    if (attstore[ind] === undefined) {
                                        break;
                                    }
                                    eq = attstore[ind].indexOf("=");
                                    dq = attstore[ind].indexOf("\"");
                                    sq = attstore[ind].indexOf("'");

                                    if (eq > -1 && store.length > 0) {
                                        // put certain attributes together for coldfusion
                                        record.token = store.join(" ");
                                        parse.push(data, record, "");
                                        record.token = attstore[ind];
                                        parse.push(data, record, "");
                                        store        = [];
                                    } else if (ltype === "sgml") {
                                        store.push(attstore[ind]);
                                    } else if (cft !== undefined && eq < 0 && attstore[ind].indexOf("=") < 0) {
                                        // put certain attributes together for coldfusion
                                        store.push(attstore[ind]);
                                    } else if ((cft !== undefined && eq < 0) || (dq > 0 && dq < eq) || (sq > 0 && sq < eq) || syntax.indexOf(attstore[ind].charAt(0)) > -1) {
                                        // tags stored as attributes of other tags
                                        record.token = attstore[ind];
                                        parse.push(data, record, "");
                                    } else if (eq < 0 && cft === undefined) {
                                        // in most markup languages an attribute without an expressed value has its name
                                        // as its string value
                                        name = attstore[ind];
                                        if (options.lang === "html") {
                                            name = name.toLowerCase();
                                        }
                                        record.token = name + "=\"" + attstore[ind] + "\"";
                                        parse.push(data, record, "");
                                    } else {
                                        // separates out the attribute name from its value
                                        slice = attstore[ind].slice(eq + 1);
                                        if (syntax.indexOf(slice.charAt(0)) < 0 && cft === undefined) {
                                            slice = "\"" + slice + "\"";
                                        }
                                        name = attstore[ind].slice(0, eq);
                                        if (options.lang === "html" && cft === undefined) {
                                            name = name.toLowerCase();
                                        }
                                        if (options.lang === "jsx" && (/^(\s*\{)/).test(slice) === true) {
                                            if (ind === 0 && (ltype === "singleton" || ltype === "template")) {
                                                parse.structure.push([
                                                    tagName(element).replace(/\/$/, ""),
                                                    parse.count
                                                ]);
                                            }
                                            record.token = name + "={";
                                            record.types = "jsx_attribute_start";
                                            parse.push(data, record);
                                            parse.structure.push(["jsx_attribute", parse.count]);
                                            name         = slice
                                                .replace(/^(\s*\{)/, "")
                                                .replace(/(\}\s*)$/, jsxAttribute);
                                            framework.lexer.script(name);
                                            record.begin = record.begin + 1;
                                            record.token = "}";
                                            record.types = "jsx_attribute_end";
                                            parse.push(data, record, "");
                                            record.types = "attribute";
                                            parse.structure.pop();
                                            if (ind === len - 1 && (ltype === "singleton" || ltype === "template")) {
                                                parse.structure.pop();
                                            }
                                        } else {
                                            record.token = name + "=" + slice;
                                            parse.push(data, record, "");
                                        }
                                    }
                                    ind = ind + 1;
                                } while (ind < len);
                            }
                            if (store.length > 0) {
                                record.token = store.join(" ");
                                parse.push(data, record, "");
                            }
                        };
                    ext = false;

                    // this complex series of conditions determines an elements delimiters look to
                    // the types being pushed to quickly reason about the logic no type is pushed
                    // for start tags or singleton tags just yet some types set the `preserve` flag,
                    // which means to preserve internal white space The `nopush` flag is set when
                    // parsed tags are to be ignored and forgotten
                    (function lexer_markup_types() {
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
                                    } else if (b[a + 4] === "-" && (/<cf[a-z]/i).test(source) === true) {
                                        preserve = true;
                                        comment  = true;
                                        end      = "--->";
                                        ltype    = "comment";
                                    } else {
                                        end = "-->";
                                        preserve = true;
                                        comment = true;
                                        ltype = "comment";
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
                                    ltype = "comment";
                                } else if (b[a + 2] === "#") {
                                    end     = "%>";
                                    comment = true;
                                    ltype = "comment";
                                } else {
                                    end   = "%>";
                                    ltype = "template";
                                }
                            } else if ((b[a + 1] === "p" || b[a + 1] === "P") && (b[a + 2] === "r" || b[a + 2] === "R") && (b[a + 3] === "e" || b[a + 3] === "E") && (b[a + 4] === ">" || (/\s/).test(b[a + 4]) === true)) {
                                end      = "</pre>";
                                preserve = true;
                                ltype    = "ignore";
                            } else if ((b[a + 1] === "x" || b[a + 1] === "X") && (b[a + 2] === "m" || b[a + 2] === "M") && (b[a + 3] === "l" || b[a + 3] === "L") && b[a + 4] === ":" && (b[a + 5] === "t" || b[a + 5] === "T") && (b[a + 6] === "e" || b[a + 6] === "E") && (b[a + 7] === "x" || b[a + 7] === "X") && (b[a + 8] === "t" || b[a + 8] === "T") && (b[a + 9] === ">" || (/\s/).test(b[a + 9]) === true)) {
                                end      = "</xsl:text>";
                                preserve = true;
                                ltype    = "ignore";
                            } else if ((b[a + 1] === "c" || b[a + 1] === "C") && (b[a + 2] === "f" || b[a + 2] === "F") && (b[a + 3] === "q" || b[a + 3] === "Q") && (b[a + 4] === "u" || b[a + 4] === "U") && (b[a + 5] === "e" || b[a + 5] === "E") && (b[a + 6] === "r" || b[a + 6] === "R") && (b[a + 7] === "y" || b[a + 7] === "Y") && (b[a + 8] === ">" || (/\s/).test(b[a + 8]) === true)) {
                                end = "</" + b.slice(a + 1, a + 8).join("") + ">";
                                preserve = true;
                                ltype = "content_preserve";
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
                            if (options.lang === "jsx") {
                                ext          = true;
                                earlyexit    = true;
                                record.token = "{";
                                record.types = "script";
                                parse.push(data, record, "");
                                parse.structure.push(["script", parse.count]);
                                return;
                            }
                            if (options.lang === "dustjs") {
                                if (b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                                    a            = a + 6;
                                    earlyexit    = true;
                                    record.presv = true;
                                    record.token = "{:else}";
                                    record.types = "template_else";
                                    parse.push(data, record, "");
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
                                parse.push(data, record, "");
                                return;
                            }
                        } else if (b[a] === "[" && b[a + 1] === "%") {
                            end   = "%]";
                            ltype = "template";
                        } else if (b[a] === "#" && options.lang === "apacheVelocity") {
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
                        } else if (b[a] === "$" && options.lang === "apacheVelocity") {
                            end   = "\n";
                            ltype = "template";
                        }
                        if (options.lexerOptions.markup.unformatted === true) {
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
                        let bcount    = 0,
                            braccount = 0,
                            jsxcount  = 0,
                            e         = 0,
                            f         = 0,
                            parncount = 0,
                            quote     = "",
                            jsxquote  = "",
                            stest     = false,
                            quotetest = false,
                            attribute = [];
                        const lex = [],

                            //finds slash escape sequences
                            slashy          = function lexer_markup_tag_slashy() {
                                let x = a;
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
                            attributeLexer  = function lexer_markup_tag_attributeLexer(quotes) {
                                let atty = "",
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
                                    if (options.lang === "jsx" && attribute[0] === "{" && attribute[attribute.length - 1] === "}") {
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
                                if (aa < bb) {
                                    do {
                                        attribute[aa] = attribute[aa].replace(/(\s+)$/, "");
                                        aa            = aa + 1;
                                    } while (aa < bb);
                                }
                                atty = attribute.join(parse.crlf);
                                if (atty === "=") {
                                    attstore[attstore.length - 1] = attstore[attstore.length - 1] + "=";
                                } else if (atty.charAt(0) === "=" && attstore.length > 0 && attstore[attstore.length - 1].indexOf("=") < 0) {
                                    //if an attribute starts with a `=` then adjoin it to the last attribute
                                    attstore[attstore.length - 1] = attstore[attstore.length - 1] + atty;
                                } else if (atty.charAt(0) !== "=" && attstore.length > 0 && attstore[attstore.length - 1].indexOf("=") === attstore[attstore.length - 1].length - 1) {
                                    // if an attribute follows an attribute ending with `=` then adjoin it to the
                                    // last attribute
                                    attstore[attstore.length - 1] = attstore[attstore.length - 1] + atty;
                                } else if (options.lang === "coldfusion" && attstore.length > 0 && (("+-*/(^").indexOf(atty) > -1 || ("+-*/(^").indexOf(attstore[attstore.length - 1].charAt(attstore[attstore.length - 1].length - 1)) > -1)) {
                                    attstore[attstore.length - 1] = attstore[attstore.length - 1] + " " + atty;
                                } else if (atty !== "" && atty !== " ") {
                                    attstore.push(atty);
                                }
                                attribute = [];
                            };
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
                                    if (options.lang === "jsx") {
                                        if (b[a] === "{") {
                                            jsxcount = jsxcount + 1;
                                        } else if (b[a] === "}") {
                                            jsxcount = jsxcount - 1;
                                        }
                                    }
                                    if (data.types[parse.count] === "sgml" && b[a] === "[" && lex.length > 4) {
                                        data.types[parse.count] = "template_start";
                                        break;
                                    }
                                    if (b[a] === "<" && options.lang !== "coldfusion" && preserve === false && lex.length > 1 && end !== ">>" && end !== ">>>" && simple === true) {
                                        framework.parseerror = "Parse error on line " + parse.lineNumber + " on element: " + data.token[parse.count];
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
                                                if (options.lexerOptions.markup.unformatted === true) {
                                                    lex.push(b[a]);
                                                }
                                                attribute.push(b[a]);

                                                if ((b[a] === "<" || b[a] === ">") && (quote === "" || quote === ">") && options.lang !== "jsx") {
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
                                                    if (b[a] === "{" && b[a - 1] === "=" && options.lang !== "jsx") {
                                                        quote = "}";
                                                    } else if (b[a] === "\"" || b[a] === "'") {
                                                        quote = b[a];
                                                        if (b[a - 1] === "=" && (b[a + 1] === "<" || (b[a + 1] === "{" && b[a + 2] === "%") || (/\s/).test(b[a + 1]) === true)) {
                                                            igcount = a;
                                                        }
                                                    } else if (b[a] === "(") {
                                                        quote     = ")";
                                                        parncount = 1;
                                                    } else if (options.lang === "jsx") {
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
                                                    } else if (lex[0] !== "{" && b[a] === "{" && (options.lang === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                                        //opening embedded template expression
                                                        if (b[a + 1] === "{") {
                                                            if (b[a + 2] === "{") {
                                                                quote = "}}}";
                                                            } else {
                                                                quote = "}}";
                                                            }
                                                        } else if (options.lang === "dustjs") {
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
                                                } else if (options.lang === "jsx" && (quote === "}" || (quote === "\n" && b[a] === "\n") || (quote === "*/" && b[a - 1] === "*" && b[a] === "/"))) {
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
                                                                if (options.lexerOptions.markup.unformatted === false) {
                                                                    if (options.lang === "jsx") {
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
                                                    if (lex.length > 1) {
                                                        tname = lex[1] + lex[2];
                                                        tname = tname.toLowerCase();
                                                    }
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
                                    } else if (comment === false && end !== "\n" && b[a] === "<" && b[a + 1] === "!" && b[a + 2] === "-" && b[a + 3] === "-" && b[a + 4] !== "#" && data.types[parse.count] !== "conditional") {
                                        quote = "-->";
                                    } else if (lex[0] !== "{" && end !== "\n" && b[a] === "{" && end !== "%>" && end !== "%]" && (options.lang === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                        //opening embedded template expression
                                        if (b[a + 1] === "{") {
                                            if (b[a + 2] === "{") {
                                                quote = "}}}";
                                            } else {
                                                quote = "}}";
                                            }
                                        } else if (options.lang === "dustjs") {
                                            quote = "}";
                                        } else {
                                            quote = b[a + 1] + "}";
                                        }
                                        if (quote === end) {
                                            quote = "";
                                        }
                                    } else if ((simple === true || ltype === "sgml") && end !== "\n" && (/\s/).test(b[a]) === true && b[a - 1] !== "<") {
                                        //identify a space in a regular start or singleton tag
                                        if (ltype === "sgml") {
                                            lex.push(" ");
                                        } else {
                                            stest = true;
                                        }
                                    } else if (simple === true && options.lang === "jsx" && b[a] === "/" && (b[a + 1] === "*" || b[a + 1] === "/")) {
                                        //jsx comment immediately following tag name
                                        stest               = true;
                                        lex[lex.length - 1] = " ";
                                        attribute.push(b[a]);
                                        if (b[a + 1] === "*") {
                                            jsxquote = "*/";
                                        } else {
                                            jsxquote = "\n";
                                        }
                                    } else if ((b[a] === lastchar || (end === "\n" && b[a + 1] === "<")) && (lex.length > end.length + 1 || lex[0] === "]") && (options.lang !== "jsx" || jsxcount === 0)) {
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
                                } else if (b[a] === quote.charAt(quote.length - 1) && ((options.lang === "jsx" && end === "}" && (b[a - 1] !== "\\" || slashy() === false)) || options.lang !== "jsx" || end !== "}")) {
                                    //find the closing quote or embedded template expression
                                    f     = 0;
                                    if (lex.length > 1) {
                                        tname = lex[1] + lex[2];
                                        tname = tname.toLowerCase();
                                    }
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
                        //nopush flags mean an early exit
                        if (nopush === true) {
                            return;
                        }

                        //a correction to incomplete template tags that use multiple angle braces
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

                        igcount      = 0;
                        element      = lex.join("");
                    }

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

                    if (preserve === false && options.lang !== "jsx") {
                        element = element.replace(/\s+/g, " ");
                    }

                    //a quick hack to inject records for a type of template comments
                    if (tname === "comment" && element.slice(0, 2) === "{%") {
                        element      = element
                            .replace(/^(\{%\s*comment\s*%\}\s*)/, "")
                            .replace(/(\s*\{%\s*endcomment\s*%\})$/, "");
                        record.token = "{% comment %}";
                        record.types = "template_start";
                        parse.push(data, record, "");
                        record.token = element;
                        record.types = "comment";
                        parse.push(data, record, "");
                        record.token = "{% endcomment %}";
                        record.types = "template_end";
                        parse.push(data, record, "");
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

                    // cheat identifies HTML singleton elements as singletons even if formatted as
                    // start tags, such as <br> (which is really <br/>)
                    cheat = (function lexer_markup_tag_cheat() {
                        let cfval = "",
                            struc = [];
                        const ender      = (/(\/>)$/),
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
                            fixsingleton = function lexer_markup_tag_cheat_fixsingleton() {
                                let aa = parse.count,
                                    bb = 0;
                                const vname = tname.slice(1);
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

                        //determine if the current tag is an HTML singleton and exit
                        if (data.types[parse.count] === "end" && tname.slice(0, 3) !== "/cf") {
                            const lastToken = data.token[parse.count];
                            if (data.types[parse.count - 1] === "singleton" && lastToken.charAt(lastToken.length - 2) !== "/" && "/" + tagName(lastToken) === tname) {
                                data.types[parse.count - 1] = "start";
                            } else if (tname !== "/span" && tname !== "/div" && tname !== "/script" && tname === "/" + tagName(data.token[parse.count]) && options.tagMerge === true(data.types[parse.count - 1] === "start" || htmlsings[tname.slice(1)] === "singleton") && (options.lang !== "html" || (options.lang === "html" && tname !== "/li"))) {
                                parse.pop(data);
                                if (data.types[parse.count] === "start") {
                                    data.token[parse.count] = data
                                        .token[parse.count]
                                        .replace(/>$/, "/>");
                                }
                                data.types[parse.count] = "singleton";
                                singleton                = true;
                                return false;
                            }
                        }

                        //renames the types value for the following two template tags
                        if (tname === "/#assign" || tname === "/#global") {
                            let dd    = parse.count - 1,
                                count = 1;
                            if (dd > -1) {
                                do {
                                    if (data.types[dd] === "start" || data.types[dd] === "template_start") {
                                        count = count - 1;
                                    } else if (data.types[dd] === "end" || data.types[dd] === "template_end") {
                                        count = count + 1;
                                    }
                                    if (count === 1) {
                                        if ((data.token[dd].indexOf("<#assign") === 0 && tname === "/#assign") || (data.token[dd].indexOf("<#global") === 0 && tname === "/#global")) {
                                            data.types[dd] = "template_start";
                                            return false;
                                        }
                                    }
                                    if (count === 0) {
                                        return false;
                                    }
                                    dd = dd - 1;
                                } while (dd > -1);
                            }
                            return false;
                        }

                        //determines if custom coldfusion tags are singletons
                        cfval = cftags[tname];
                        if (data.types[parse.count] === "end" && tname.slice(0, 3) === "/cf" && cfval !== undefined) {
                            if (tname === "/cftransaction") {
                                cftransaction = false;
                            }
                            if (cfval !== undefined) {
                                data.types[parse.count] = "template_end";
                            }
                            if ((cfval === "optional" || cfval === "prohibited") && tname !== "/cftransaction") {
                                return fixsingleton();
                            }
                            return false;
                        }

                        //processes all other coldfusion tags
                        if (tname.slice(0, 2) === "cf") {
                            if (tname === "cfelse" || tname === "cfelseif") {
                                record.token = element;
                                record.types = "template_else";
                                parse.push(data, record, "");
                                singleton    = true;
                                return false;
                            }
                            if (tname === "cftransaction" && cftransaction === true) {
                                if (element.charAt(1) === "/") {
                                    record.types = "template_end";
                                } else {
                                    cfval = "prohibited";
                                }
                            } else {
                                cfval = cftags[tname];
                            }
                            if (tname === "cfscript" && element.indexOf("</cfscript") !== 0) {
                                ext = true;
                            }
                            if (cfval === "optional" || cfval === "prohibited" || tname.slice(0, 3) === "cf_") {
                                if (options.correct === true && ender.test(element) === false) {
                                    element = element.slice(0, element.length - 1) + "/>";
                                }
                                record.token = element.replace(/\s+/, " ");
                                record.types = "template";
                                if (tname === "cfmodule" && element.charAt(1) === "/") {
                                    let ss = parse.count,
                                        tt = 1;
                                    do {
                                        if (data.token[ss].toLowerCase() === "<cfmodule>") {
                                            tt = tt - 1;
                                            if (tt < 1) {
                                                break;
                                            }
                                        } else if (data.token[ss].toLowerCase() === "</cfmodule>") {
                                            tt = tt + 1;
                                        }
                                        ss = ss - 1;
                                    } while (ss > -1);
                                    data.types[ss] = "template_start";
                                    tt = ss + 1;
                                    struc = [["cfmodule", ss]];
                                    ss  = parse.count + 1;
                                    do {
                                        if (data.types[tt] === "end" || data.types[tt] === "template_end") {
                                            data.begin[tt] = struc[struc.length - 1][1];
                                            data.stack[tt] = struc[struc.length - 1][0];
                                            if (struc.length > 1) {
                                                struc.pop();
                                            }
                                        } else if (data.types[tt] === "start" || data.types[tt] === "template_start" || (data.types[tt] === "cdata" && data.token[data.begin[tt + 1]].toLowerCase().indexOf("<script") === 0)) {
                                            data.begin[tt] = struc[struc.length - 1][1];
                                            data.stack[tt] = struc[struc.length - 1][0];
                                            struc.push([tagName(data.token[tt]), tt]);
                                        } else {
                                            data.begin[tt] = struc[struc.length - 1][1];
                                            data.stack[tt] = struc[struc.length - 1][0];
                                        }
                                        tt = tt + 1;
                                    } while (tt < ss);
                                    parse.structure.push(struc[0]);
                                    record.begin = struc[0][1];
                                    record.stack = "cfmodule";
                                    record.types = "template_end";
                                }
                                parse.push(data, record, "");
                                singleton    = true;
                                return false;
                            }
                            if (cfval === "required" && tname !== "cfquery") {
                                if (tname === "cftransaction" && cftransaction === false) {
                                    cftransaction = true;
                                }
                                record.token = element;
                                record.types = (ltype === "end")
                                    ? "template_end"
                                    : "template_start";
                                parse.push(data, record, tname);
                                singleton    = true;
                            }
                            return false;
                        }

                        if (options.lang === "html") {
                            // html gets tag names in lowercase, if you want to preserve case sensitivity
                            // beautify as XML
                            if (element.charAt(0) === "<" && element.charAt(1) !== "!" && element.charAt(1) !== "?" && (parse.count < 0 || data.types[parse.count].indexOf("template") < 0) && options.lang !== "jsx" && cftags[tname] === undefined && tname.slice(0, 3) !== "cf_") {
                                element = element.toLowerCase();
                            }

                            //looks for HTML "li" tags that have no ending tag, which is valid in HTML
                            if (tname === "li") {
                                if (litag === list && (list !== 0 || (list === 0 && parse.count > -1 && data.types[parse.count].indexOf("template") < 0))) {
                                    let d  = parse.count,
                                        ee = 1;
                                    if (d > -1) {
                                        do {
                                            if (data.types[d] === "start" || data.types[d] === "template_start") {
                                                ee = ee - 1;
                                            } else if (data.types[d] === "end" || data.types[d] === "template_end") {
                                                ee = ee + 1;
                                            }
                                            if (ee === -1 && (tagName(data.token[d]) === "li" || (tagName(data.token[d + 1]) === "li" && (tagName(data.token[d]) === "ul" || tagName(data.token[d]) === "ol")))) {
                                                record.lines                 = data.lines[parse.count];
                                                record.presv                 = false;
                                                record.token                 = "</li>";
                                                record.types                 = "end";
                                                parse.push(data, record, "");
                                                record.begin                 = parse.structure[parse.structure.length - 1][1];
                                                record.lines                 = parse.linesSpace;
                                                record.presv                 = preserve;
                                                record.stack                 = parse.structure[parse.structure.length - 1][0];
                                                record.token                 = element;
                                                record.types                 = ltype;
                                                data.lines[parse.count - 1] = 0;
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
                                    record.lines                 = data.lines[parse.count];
                                    record.presv                 = false;
                                    record.token                 = "</li>";
                                    record.types                 = "end";
                                    parse.push(data, record, "");
                                    record.begin                 = parse.structure[parse.structure.length - 1][1];
                                    record.lines                 = parse.linesSpace;
                                    record.presv                 = preserve;
                                    record.stack                 = parse.structure[parse.structure.length - 1][0];
                                    record.token                 = element;
                                    record.types                 = "end";
                                    data.lines[parse.count - 1] = 0;
                                    litag = litag - 1;
                                }
                                list = list - 1;
                            }

                            //generalized corrections for the handling of singleton tags
                            if (data.types[parse.count] === "end" && htmlsings[tname.slice(1)] === "singleton" && element.toLowerCase("").indexOf("/cftransaction") !== 1) {
                                return fixsingleton();
                            }

                            //inserts a trailing slash into singleton tags if they do not already have it
                            if (htmlsings[tname] === "singleton") {
                                if (options.correct === true && ender.test(element) === false) {
                                    element = element.slice(0, element.length - 1) + " />";
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
                    if (tname.charAt(0) === "#" && data.types[parse.count] === "start" && (tname === "#assign" || tname === "#break" || tname === "#case" || tname === "#default" || tname === "#fallback" || tname === "#flush" || tname === "#ftl" || tname === "#global" || tname === "#import" || tname === "#include" || tname === "#local" || tname === "#t" || tname === "#lt" || tname === "#rt" || tname === "#nested" || tname === "#nt" || tname === "#recover" || tname === "#recurse" || tname === "#return" || tname === "#sep" || tname === "#setting" || tname === "#stop" || tname === "#visit")) {
                        simple = true;
                    }

                    //correction for dustjs tags to template singleton types
                    if (options.lang === "dustjs" && data.types[parse.count] === "template_start") {
                        const first = element.charAt(1),
                            ending  = element.slice(element.length - 2);
                        if ((ending === "/}" || ending.charAt(0) === first) && (first === "#" || first === "?" || first === "^" || first === "@" || first === "<" || first === "+")) {
                            data.types[parse.count] = "template";
                        }
                    }

                    // determine if the markup tag potentially contains code interpreted by a
                    // different lexer
                    if ((tname === "script" || tname === "style" || tname === "cfscript") && element.slice(element.length - 2) !== "/>") {

                        //get the attribute value for "type"
                        let len      = attstore.length - 1,
                            attValue = "",
                            attr     = [];
                        if (len > -1) {
                            do {
                                attr = arname(attstore[len]);
                                if (attr[0] === "type") {
                                    attValue = attr[1];
                                    if (attValue.charAt(0) === "\"" || attValue.charAt(0) === "'") {
                                        attValue = attValue.slice(1, attValue.length - 1);
                                    }
                                    break;
                                }
                                len = len - 1;
                            } while (len > -1);
                        }

                        //ext is flag to send information between the tag lexer and the content lexer
                        if (tname === "script" && (attValue === "" || attValue === "text/javascript" || attValue === "babel" || attValue === "module" || attValue === "application/javascript" || attValue === "application/x-javascript" || attValue === "text/ecmascript" || attValue === "application/ecmascript" || attValue === "text/jsx" || attValue === "application/jsx" || attValue === "text/cjs")) {
                            ext = true;
                        } else if (tname === "style" && (attValue === "" || attValue === "text/css")) {
                            ext = true;
                        } else if (tname === "cfscript") {
                            ext = true;
                        }
                        if (ext === true) {
                            len = a + 1;
                            if (len < c) {
                                do {
                                    if ((/\s/).test(b[len]) === false) {
                                        if (b[len] === "<") {
                                            if (b.slice(len + 1, len + 4).join("") === "!--") {
                                                len = len + 4;
                                                if (len < c) {
                                                    do {
                                                        if ((/\s/).test(b[len]) === false) {
                                                            ext = false;
                                                            break;
                                                        }
                                                        if (b[len] === "\n" || b[len] === "\r") {
                                                            break;
                                                        }
                                                        len = len + 1;
                                                    } while (len < c);
                                                }
                                            } else {
                                                ext = false;
                                            }
                                        }
                                        break;
                                    }
                                    len = len + 1;
                                } while (len < c);
                            }
                        }
                    }

                    //am I a singleton or a start type?
                    if (simple === true && ignoreme === false) {
                        if (cheat === true || element.slice(element.length - 2) === "/>") {
                            ltype = "singleton";
                        } else {
                            ltype = "start";
                        }
                        record.types = ltype;
                    }

                    // additional logic is required to find the end of a tag with the attribute
                    // data-parse-ignore
                    if (simple === true && preserve === false && ignoreme === true && end === ">" && element.slice(element.length - 2) !== "/>") {
                        let tags = [];
                        if (cheat === true) {
                            ltype = "singleton";
                        } else {
                            preserve                = true;
                            data.presv[parse.count] = true;
                            ltype                   = "ignore";
                            a                       = a + 1;
                            if (a < c) {
                                let delim  = "",
                                    ee     = 0,
                                    ff     = 0,
                                    endtag = false;
                                do {
                                    if (b[a] === "\n") {
                                        parse.lineNumber = parse.lineNumber + 1;
                                    }
                                    tags.push(b[a]);
                                    if (delim === "") {
                                        if (b[a] === "\"") {
                                            delim = "\"";
                                        } else if (b[a] === "'") {
                                            delim = "'";
                                        } else if (tags[0] !== "{" && b[a] === "{" && (options.lang === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                            if (b[a + 1] === "{") {
                                                if (b[a + 2] === "{") {
                                                    delim = "}}}";
                                                } else {
                                                    delim = "}}";
                                                }
                                            } else if (options.lang === "dustjs") {
                                                delim = "}";
                                            } else {
                                                delim = b[a + 1] + "}";
                                            }
                                        } else if (b[a] === "<" && simple === true) {
                                            if (b[a + 1] === "/") {
                                                endtag = true;
                                            } else {
                                                endtag = false;
                                            }
                                        } else if (b[a] === lastchar && b[a - 1] !== "/") {
                                            if (endtag === true) {
                                                igcount = igcount - 1;
                                                if (igcount < 0) {
                                                    break;
                                                }
                                            } else {
                                                igcount = igcount + 1;
                                            }
                                        }
                                    } else if (b[a] === delim.charAt(delim.length - 1)) {
                                        ff = 0;
                                        ee = delim.length - 1;
                                        if (ee > -1) {
                                            do {
                                                if (b[a - ff] !== delim.charAt(ee)) {
                                                    break;
                                                }
                                                ff = ff + 1;
                                                ee = ee - 1;
                                            } while (ee > -1);
                                        }
                                        if (ee < 0) {
                                            delim = "";
                                        }
                                    }
                                    a = a + 1;
                                } while (a < c);
                            }
                        }
                        element = element + tags.join("");
                        element = element.replace(">", " " + attstore.join(" ") + ">");
                        record.token = element;
                        record.types = "content-ignore";
                        attstore = [];
                    }

                    // some template tags can be evaluated as a block start/end based on syntax
                    // alone
                    if (record.types.indexOf("template") > -1) {
                        if (element.slice(0, 2) === "{%") {
                            let names = [
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
                                record.types = "template_else";
                            } else {
                                let namelen = names.length - 1;
                                if (namelen > -1) {
                                    do {
                                        if (tname === names[namelen]) {
                                            record.types = "template_start";
                                            break;
                                        }
                                        if (tname === "end" + names[namelen]) {
                                            record.types = "template_end";
                                            break;
                                        }
                                        namelen = namelen - 1;
                                    } while (namelen > -1);
                                }
                            }
                        } else if (element.slice(0, 2) === "{{" && element.charAt(3) !== "{") {
                            if ((/^(\{\{\s*-?\s*end\s*-?\s*\}\})$/).test(element) === true) {
                                record.types = "template_end";
                            } else if (tname === "block" || tname === "define" || tname === "form" || tname === "if" || tname === "range" || tname === "with") {
                                if (tname !== "block" || (/\{%\s*\w/).test(source) === false) {
                                    record.types = "template_start";
                                }
                            }
                        } else if (record.types === "template") {
                            if (element.indexOf("else") > 2) {
                                record.types = "template_else";
                            } else if ((/^(<%\s*\})/).test(element) === true || (/^(\[%\s*\})/).test(element) === true || (/^(\{@\s*\})/).test(element) === true) {
                                record.types = "template_end";
                            } else if ((/(\{\s*%>)$/).test(element) === true || (/(\{\s*%\])$/).test(element) === true || (/(\{\s*@\})$/).test(element) === true) {
                                record.types = "template_start";
                            }
                        }
                        if (record.types === "template_start" && (tname === "" || tname === "@" || tname === "#" || tname === "%")) {
                            tname = tname + element.slice(1).replace(tname, "").replace(/^(\s+)/, "");
                            tname = tname.slice(0, tname.indexOf("(")).replace(/\s+/, "");
                        }
                    }

                    // identify script hidden within a CDATA escape
                    if (ltype === "cdata" && record.stack === "script") {
                        let counta = parse.count,
                            countb = parse.count;
                        if (data.types[countb] === "attribute") {
                            do {
                                counta = counta - 1;
                                countb  = countb - 1;
                            } while (data.types[countb] === "attribute" && countb > -1);
                        }
                        record.begin = counta;
                        element      = element
                            .replace(/^(\s*<\!\[cdata\[)/i, "")
                            .replace(/(\]\]>\s*)$/, "");
                        record.token = "<![CDATA[";
                        parse.push(data, record, "");
                        parse.structure.push(["cdata", parse.count]);
                        framework.lexer.script(element);
                        record.begin = parse.structure[parse.structure.length - 1][1];
                        record.token = "]]>";
                        parse.push(data, record, "");
                        parse.structure.pop();
                    } else {
                        parse.push(data, record, tname);
                    }

                    attributeRecord();

                    //sorts child elements
                    if (options.tagSort === true && data.types[parse.count] === "end" && data.types[parse.count - 1] !== "start" && tname !== "/script" && tname !== "/style" && tname !== "/cfscript") {
                        (function lexer_markup_tag_sorttag() {
                            let bb          = 0,
                                d           = 0,
                                startStore  = 0,
                                jsxatt      = false,
                                endData     = {};
                            const children  = [],
                                store       = (function lexer_markup_tag_sorttag_store() {
                                    const output = {};
                                    parse.datanames.forEach(function lexer_markup_tag_sorttag_store_datanames(value) {
                                        output[value] = [];
                                    });
                                    return output;
                                }()),
                                storeRecord = function lexer_markup_tag_sorttag_storeRecord(index) {
                                    const output = {};
                                    parse.datanames.forEach(
                                        function lexer_markup_tag_sorttag_storeRecord_datanames(value) {
                                            output[value] = data[value][index];
                                        }
                                    );
                                    return output;
                                },
                                childsort = function lexer_markup_tag_sorttag_childsort(a, b) {
                                    if (data.token[a[0]] > data.token[b[0]]) {
                                        return -1;
                                    }
                                    return 1;
                                };
                            bb = parse.count - 1;
                            if (bb > -1) {
                                let endStore = 0;
                                do {
                                    if (data.types[bb] === "start") {
                                        d = d - 1;
                                        if (d < 0) {
                                            startStore = bb + 1;
                                            if (data.types[startStore] === "attribute" || data.types[startStore] === "jsx_attribute_start") {
                                                jsxatt = false;
                                                do {
                                                    startStore = startStore + 1;
                                                    if (jsxatt === false && data.types[startStore] !== "attribute") {
                                                        break;
                                                    }
                                                    if (data.types[startStore] === "jsx_attribute_start") {
                                                        jsxatt = true;
                                                    } else if (data.types[startStore] === "jsx_attribute_end") {
                                                        jsxatt = false;
                                                    }
                                                } while (startStore < c);
                                            } 
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
                                            if (data.types[bb] === "singleton" && (data.types[bb + 1] === "attribute" || data.types[bb + 1] === "jsx_attribute_start")) {
                                                let cc = bb + 1;
                                                jsxatt = false;
                                                do {
                                                    if (data.types[cc] === "jsx_attribute_start") {
                                                        jsxatt = true;
                                                    } else if (data.types[cc] === "jsx_attribute_end") {
                                                        jsxatt = false;
                                                    }
                                                    if (jsxatt === false && data.types[cc + 1] !== "attribute" && data.types[cc + 1] !== "jsx_attribute_start") {
                                                        break;
                                                    }
                                                    cc = cc + 1;
                                                } while (cc < parse.count);
                                                children.push([bb, cc]);
                                            } else if (data.types[bb] !== "attribute" && data.types[bb] !== "jsx_attribute_start") {
                                                children.push([bb, bb]);
                                            }
                                        }
                                    }
                                    bb = bb - 1;
                                } while (bb > -1);
                            }
                            if (children.length < 2) {
                                return;
                            }
                            children.sort(childsort);
                            bb       = children.length - 1;
                            if (bb > -1) {
                                do {
                                    parse.push(store, storeRecord(children[bb][0]), "");
                                    if (children[bb][0] !== children[bb][1]) {
                                        d = children[bb][0] + 1;
                                        if (d < children[bb][1]) {
                                            do {
                                                parse.push(store, storeRecord(d), "");
                                                d = d + 1;
                                            } while (d < children[bb][1]);
                                        }
                                        parse.push(store, storeRecord(children[bb][1]), "");
                                    }
                                    bb = bb - 1;
                                } while (bb > -1);
                            }
                            endData = (function lexer_markup_tag_sorttag_endData() {
                                const output = {};
                                parse.datanames.forEach(function lexer_markup_tag_sorttag_endData_datanames(value) {
                                    output[value] = data[value].pop();
                                });
                                return output;
                            }());
                            (function lexer_markup_tag_sorttag_slice() {
                                parse.datanames.forEach(function lexer_markup_tag_sorttag_slice_datanames(value) {
                                    data[value] = data[value].slice(0, startStore);
                                });
                            }());
                            parse.concat(data, store);
                            parse.push(data, endData, "");
                        }());
                    }

                    parse.linesSpace = 0;
                },
                content       = function lexer_markup_content() {
                    let lex       = [],
                        ltoke     = "",
                        jsxbrace  = (data.token[parse.count] === "{"),
                        liner     = parse.linesSpace,
                        now       = a;
                    const name      = (ext === true)
                            ? (jsxbrace === true)
                                ? "script"
                                : (parse.structure[parse.structure.length - 1][1] > -1)
                                    ? tagName(data.token[parse.structure[parse.structure.length - 1][1]].toLowerCase())
                                    : tagName(data.token[data.begin[parse.count]].toLowerCase())
                            : "",
                        square    = (
                            data.types[parse.count] === "template_start" && data.token[parse.count].indexOf("<!") === 0 && data.token[parse.count].indexOf("<![") < 0 && data.token[parse.count].charAt(data.token[parse.count].length - 1) === "["
                        ),
                        record    = {
                            begin: parse.structure[parse.structure.length - 1][1],
                            lexer: "markup",
                            lines: liner,
                            presv: (linepreserve > 0),
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "",
                            types: "content"
                        },
                        esctest   = function lexer_markup_content_esctest() {
                            let aa = a - 1,
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
                        let end    = "",
                            quote  = "",
                            quotes = 0;
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
                                            if (options.lang !== "jsx" || b[a - 1] !== "<") {
                                                quote = "reg";
                                            }
                                        }
                                    } else if ((b[a] === "\"" || b[a] === "'" || b[a] === "`") && esctest() === false) {
                                        quote = b[a];
                                    } else if (b[a] === "{" && jsxbrace === true) {
                                        quotes = quotes + 1;
                                    } else if (b[a] === "}" && jsxbrace === true) {
                                        if (quotes === 0) {
                                            framework.lexer.script(
                                                lex.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""),
                                                parse.structure[parse.structure.length - 1][1] + 1
                                            );
                                            record.token = "}";
                                            record.types = "script";
                                            parse.push(data, record, "");
                                            parse.structure.pop();
                                            break;
                                        }
                                        quotes = quotes - 1;
                                    }
                                    end = b
                                        .slice(a, a + 10)
                                        .join("")
                                        .toLowerCase();

                                    //cfscript requires use of the script lexer
                                    if (name === "cfscript" && end === "</cfscript") {
                                        a   = a - 1;
                                        if (lex.length < 1) {
                                            break;
                                        }
                                        framework.lexer.script(
                                            lex.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, "")
                                        );
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
                                            if (lex.length < 1) {
                                                break;
                                            }
                                            framework.lexer.script(
                                                lex.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, "")
                                            );
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
                                            if (lex.length < 1) {
                                                break;
                                            }
                                            framework.lexer.style(
                                                lex.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, "")
                                            );
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
                                ltoke = minspace + lex.join("");
                                liner = 0;
                                record.token = ltoke;
                                parse.push(data, record, "");
                                break;
                            }

                            //general content processing
                            if (ext === false && lex.length > 0 && ((b[a] === "<" && b[a + 1] !== "=" && (/\s|\d/).test(b[a + 1]) === false) || (b[a] === "[" && b[a + 1] === "%") || (b[a] === "{" && (options.lang === "jsx" || options.lang === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")))) {

                                //dustjs template handling
                                if (options.lang === "dustjs" && b[a] === "{" && b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                                    a = a + 6;
                                    ltoke = minspace + lex.join("");
                                    liner = 0;
                                    record.token = ltoke;
                                    parse.push(data, record, "");
                                    record.token = "{:else}";
                                    record.types = "template_else";
                                    record.presv = false;
                                    parse.push(data, record, "");
                                    break;
                                }

                                //regular content
                                a = a - 1;
                                ltoke = minspace + lex.join("");
                                liner = 0;
                                record.token = ltoke;
                                parse.push(data, record, "");
                                break;
                            }
                            lex.push(b[a]);
                            a = a + 1;
                        } while (a < c);
                    }

                    if (a > now && a < c) {
                        if ((/\s/).test(b[a]) === true) {
                            let x = a;
                            parse.linesSpace = 1;
                            do {
                                if (b[x] === "\n") {
                                    parse.lineNumber = parse.lineNumber + 1;
                                    parse.linesSpace = parse.linesSpace + 1;
                                }
                                x = x - 1;
                            } while (x > now && (/\s/).test(b[x]) === true);
                        } else {
                            parse.linesSpace = 0;
                        }
                    } else if (a !== now || (a === now && ext === false)) {

                        //regular content at the end of the supplied source
                        ltoke = minspace + lex.join("");
                        liner = 0;
                        
                        //this condition prevents adding content that was just added in the loop above
                        if (record.token !== ltoke) {
                            record.token       = ltoke;
                            parse.push(data, record, "");
                            parse.linesSpace   = 0;
                        }
                    }
                    ext = false;
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
                } else if (b[a] === "{" && (options.lang === "jsx" || options.lang === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                    tag("");
                } else if (b[a] === "]" && sgmlflag > 0) {
                    tag("]>");
                } else if (b[a] === "-" && b[a + 1] === "-" && b[a + 2] === "-" && options.lang === "jekyll") {
                    tag("---");
                } else if (options.lang === "apacheVelocity" && (/\d/).test(b[a + 1]) === false && (/\s/).test(b[a + 1]) === false) {
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

    framework.lexer.markup = markup;
}());
