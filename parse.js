/*
Parse Framework
*/

(function parse() {
    "use strict";
    var markuppretty = function markuppretty_(options) {
        var safeSort    = global.prettydiff.safeSort,
            output      = "",
            stats       = {
                cdata      : [
                    0, 0
                ],
                comment    : [
                    0, 0
                ],
                conditional: [
                    0, 0
                ],
                content    : [
                    0, 0
                ],
                end        : [
                    0, 0
                ],
                ignore     : [
                    0, 0
                ],
                script     : [
                    0, 0
                ],
                sgml       : [
                    0, 0
                ],
                singleton  : [
                    0, 0
                ],
                space      : 0,
                start      : [
                    0, 0
                ],
                style      : [
                    0, 0
                ],
                template   : [
                    0, 0
                ],
                text       : [
                    0, 0
                ],
                xml        : [0, 0]
            },

            //parallel arrays
            // * attrs is a list of arrays, each of which contains (if any) parsed
            // attributes
            // * begin stores the index of the current token's parent element
            // * daddy stores the tag name of the parent element
            // * jscom stores true/false if the current token is a JS comment from JSX
            // format
            // * level describes the indentation of a given token level is only used in
            // beautify and diff modes
            // * linen stores the input line number on which the token occurs
            // * lines describes the preceeding space using: 2, 1, or 0 lines is populated
            // in markuppretty__tokenize_spacer
            // * presv whether a given token should be preserved as provided
            // * token stores parsed tokens
            // * types segments tokens into named groups
            // * value attribute value if current type is attribute and
            // options.attributetoken is true
            attrs       = [],
            jscom       = [],
            level       = [],
            linen       = [],
            lines       = [],
            token       = [],
            types       = [],
            presv       = [],
            daddy       = [],
            begin       = [],
            value       = [],
            reqs        = [],
            ids         = [],
            parseError  = [],
            parent      = [
                ["none", -1]
            ],
            line        = 1,
            wrap        = options.wrap,
            objsortop   = false,
            globalerror = "",
            lf          = (options.crlf === true || options.crlf === "true")
                ? "\r\n"
                : "\n",
            sourceSize  = options.source.length,
            extlib      = function markuppretty__extlib(type) {
                var result = "",
                    newline = options.newline;
                if (type === "script" && typeof global.prettydiff.jspretty !== "function") {
                    return options.source;
                }
                if (type === "style" && typeof global.prettydiff.csspretty !== "function") {
                    return options.source;
                }
                options.newline = false;
                result = (type === "script")
                    ? global
                        .prettydiff
                        .jspretty(options)
                    : global
                        .prettydiff
                        .csspretty(options);
                options.newline = newline;
                if (options.nodeasync === true) {
                    if (globalerror === "") {
                        globalerror = result[1];
                    }
                    if (options.mode === "parse") {
                        if (options.parseFormat === "htmltable") {
                            if (type === "script") {
                                return result[0]
                                    .data
                                    .replace(
                                        "<thead>",
                                        "<thead><tr><th colspan=\"6\" class=\"nested\">JavaScript tokens</th></tr>"
                                    );
                            }
                            return result[0]
                                .data
                                .replace(
                                    "<thead>",
                                    "<thead><tr><th colspan=\"4\" class=\"nested\">CSS tokens</th></tr>"
                                );
                        }
                        return result[0].data;
                    }
                    return result[0];
                }
                if (options.mode === "parse") {
                    if (options.parseFormat === "htmltable") {
                        if (type === "script") {
                            return result
                                .data
                                .replace(
                                    "<thead>",
                                    "<thead><tr><th colspan=\"6\" class=\"nested\">JavaScript tokens</th></tr>"
                                );
                        }
                        return result
                            .data
                            .replace(
                                "<thead>",
                                "<thead><tr><th colspan=\"4\" class=\"nested\">CSS tokens</th></tr>"
                            );
                    }
                    return result.data;
                }
                return result;
            },
            //What is the lowercase tag name of the provided token?
            tagName     = function markuppretty__tagName(el) {
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

        (function markuppretty__options() {
            objsortop      = (
                options.objsort === true || options.objsort === "true" || options.objsort === "all" || options.objsort === "markup"
            );
            options.source = (
                typeof options.source === "string" && options.source.length > 0
            )
                ? options
                    .source
                    .replace(/\r\n?/g, "\n")
                : "Error: no source code supplied to markuppretty!";
            if (options.mode === "analysis") {
                options.accessibility = true;
            }
        }());
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
        if (options.mode !== "diff") {
            options.content = false;
        }
        if (options.jsx === true) {
            options.dustjs = false;
        }
        (function markuppretty__tokenize() {
            var a             = 0,
                b             = options
                    .source
                    .split(""),
                c             = b.length,
                minspace      = "",
                space         = "",
                list          = 0,
                litag         = 0,
                linepreserve  = 0,
                cftransaction = false,
                sgmlflag      = 0,
                ext           = false,
                //cftags is a list of supported coldfusion tags
                //* required - means must have a separate matching end tag
                // * optional - means the tag could have a separate end tag, but is probably a
                // singleton
                //* prohibited - means there is not corresponding end tag
                cftags        = {
                    cfabort               : "prohibited",
                    cfajaximport          : "optional",
                    cfajaxproxy           : "optional",
                    cfapplet              : "prohibited",
                    cfapplication         : "prohibited",
                    cfargument            : "prohibited",
                    cfassociate           : "prohibited",
                    cfauthenticate        : "prohibited",
                    cfbreak               : "prohibited",
                    cfcache               : "optional",
                    cfcalendar            : "optional",
                    cfcase                : "required",
                    cfcatch               : "required",
                    cfchart               : "optional",
                    cfchartdata           : "prohibited",
                    cfchartseries         : "optional",
                    cfclient              : "required",
                    cfclientsettings      : "optional",
                    cfcol                 : "prohibited",
                    cfcollection          : "prohibited",
                    cfcomponent           : "required",
                    cfcontent             : "optional",
                    cfcontinue            : "prohibited",
                    cfcookie              : "prohibited",
                    cfdbinfo              : "prohibited",
                    cfdefaultcase         : "required",
                    cfdirectory           : "prohibited",
                    cfdiv                 : "optional",
                    cfdocument            : "optional",
                    cfdocumentitem        : "optional",
                    cfdocumentsection     : "optional",
                    cfdump                : "optional",
                    cfelse                : "prohibited",
                    cfelseif              : "prohibited",
                    cferror               : "prohibited",
                    cfexchangecalendar    : "optional",
                    cfexchangeconnection  : "optional",
                    cfexchangecontact     : "optional",
                    cfexchangeconversation: "optional",
                    cfexchangefilter      : "optional",
                    cfexchangefolder      : "optional",
                    cfexchangemail        : "optional",
                    cfexchangetask        : "optional",
                    cfexecute             : "required",
                    cfexit                : "prohibited",
                    cffeed                : "prohibited",
                    cffile                : "optional",
                    cffileupload          : "optional",
                    cffinally             : "required",
                    cfflush               : "prohibited",
                    cfform                : "required",
                    cfformgroup           : "required",
                    cfformitem            : "optional",
                    cfforward             : "prohibited",
                    cfftp                 : "prohibited",
                    cffunction            : "required",
                    cfgraph               : "required",
                    cfgraphdata           : "prohibited",
                    cfgrid                : "required",
                    cfgridcolumn          : "optional",
                    cfgridrow             : "optional",
                    cfgridupdate          : "optional",
                    cfheader              : "prohibited",
                    cfhtmlbody            : "optional",
                    cfhtmlhead            : "optional",
                    cfhtmltopdf           : "optional",
                    cfhtmltopdfitem       : "optional",
                    cfhttp                : "optional",
                    cfhttpparam           : "prohibited",
                    cfif                  : "required",
                    cfimage               : "prohibited",
                    cfimap                : "prohibited",
                    cfimapfilter          : "optional",
                    cfimport              : "prohibited",
                    cfinclude             : "prohibited",
                    cfindex               : "prohibited",
                    cfinput               : "prohibited",
                    cfinsert              : "prohibited",
                    cfinterface           : "required",
                    cfinvoke              : "optional",
                    cfinvokeargument      : "prohibited",
                    cflayout              : "optional",
                    cflayoutarea          : "optional",
                    cfldap                : "prohibited",
                    cflocation            : "prohibited",
                    cflock                : "required",
                    cflog                 : "prohibited",
                    cflogic               : "required",
                    cfloginuser           : "prohibited",
                    cflogout              : "prohibited",
                    cfloop                : "required",
                    cfmail                : "required",
                    cfmailparam           : "prohibited",
                    cfmailpart            : "required",
                    cfmap                 : "optional",
                    cfmapitem             : "optional",
                    cfmediaplayer         : "optional",
                    cfmenu                : "required",
                    cfmenuitem            : "optional",
                    cfmessagebox          : "optional",
                    cfmodule              : "optional",
                    cfNTauthenticate      : "optional",
                    cfoauth               : "optional",
                    cfobject              : "prohibited",
                    cfobjectcache         : "prohibited",
                    cfoutput              : "required",
                    cfpageencoding        : "optional",
                    cfparam               : "prohibited",
                    cfpdf                 : "optional",
                    cfpdfform             : "optional",
                    cfpdfformparam        : "optional",
                    cfpdfparam            : "prohibited",
                    cfpdfsubform          : "required",
                    cfpod                 : "optional",
                    cfpop                 : "prohibited",
                    cfpresentation        : "required",
                    cfpresentationslide   : "optional",
                    cfpresenter           : "optional",
                    cfprint               : "optional",
                    cfprocessingdirective : "optional",
                    cfprocparam           : "prohibited",
                    cfprocresult          : "prohibited",
                    cfprogressbar         : "optional",
                    cfproperty            : "prohibited",
                    cfquery               : "required",
                    cfqueryparam          : "prohibited",
                    cfregistry            : "prohibited",
                    cfreport              : "optional",
                    cfreportparam         : "optional",
                    cfrethrow             : "prohibited",
                    cfretry               : "prohibited",
                    cfreturn              : "prohibited",
                    cfsavecontent         : "required",
                    cfschedule            : "prohibited",
                    cfscript              : "required",
                    cfsearch              : "prohibited",
                    cfselect              : "required",
                    cfservlet             : "prohibited",
                    cfservletparam        : "prohibited",
                    cfset                 : "prohibited",
                    cfsetting             : "optional",
                    cfsharepoint          : "optional",
                    cfsilent              : "required",
                    cfsleep               : "prohibited",
                    cfslider              : "prohibited",
                    cfspreadsheet         : "optional",
                    cfsprydataset         : "optional",
                    cfstatic              : "required",
                    cfstopwatch           : "required",
                    cfstoredproc          : "optional",
                    cfswitch              : "required",
                    cftable               : "required",
                    cftextarea            : "optional",
                    cfthread              : "optional",
                    cfthrow               : "prohibited",
                    cftimer               : "required",
                    cftooltip             : "required",
                    cftrace               : "optional",
                    cftransaction         : "required",
                    cftree                : "required",
                    cftreeitem            : "optional",
                    cftry                 : "required",
                    cfupdate              : "prohibited",
                    cfvideo               : "prohibited",
                    cfvideoplayer         : "optional",
                    cfwddx                : "prohibited",
                    cfwebsocket           : "optional",
                    cfwhile               : "required",
                    cfwindow              : "optional",
                    cfx_                  : "prohibited",
                    cfxml                 : "required",
                    cfzip                 : "optional",
                    cfzipparam            : "prohibited"
                },
                // determine if spaces between nodes are absent, multiline, or merely there 2 -
                // multiline 1 - space present 0 - no space present
                spacer        = function markuppretty__tokenize_spacer() {
                    var linea = 0;
                    if (space.length > 0) {
                        stats.space = stats.space + space.length;
                        linea       = space
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
                tag           = function markuppretty__tokenize_tag(end) {
                    var lexer     = [],
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
                        arname    = function markuppretty__tokenize_tag_name(x) {
                            var eq = x.indexOf("=");
                            if (eq > 0 && ((eq < x.indexOf("\"") && x.indexOf("\"") > 0) || (eq < x.indexOf("'") && x.indexOf("'") > 0))) {
                                return x.slice(0, eq);
                            }
                            return x;
                        },
                        slashy    = function markuppretty__tokenize_tag_slashy() {
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
                        attrpush  = function markuppretty__tokenize_tag_attrpush(quotes) {
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
                            for (aa = 0; aa < bb; aa = aa + 1) {
                                attribute[aa] = attribute[aa].replace(/(\s+)$/, "");
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
                    value.push("");
                    ext = false;
                    // this complex series of conditions determines an elements delimiters look to
                    // the types being pushed to quickly reason about the logic no type is pushed
                    // for start tags or singleton tags just yet some types set the `preserve` flag,
                    // which means to preserve internal white space The `nopush` flag is set when
                    // parsed tags are to be ignored and forgotten
                    (function markuppretty__tokenize_types() {
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
                                    } else if (b[a + 4] === "-" && (/<cf[a-z]/i).test(options.source) === true) {
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
                                            comment  = true;
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
                                    daddy.push(parent[parent.length - 1][0]);
                                    begin.push(parent[parent.length - 1][1]);
                                    attrs.push({});
                                    stats.template[0] = stats.template[0] + 1;
                                    stats.template[1] = stats.template[1] + 7;
                                    earlyexit         = true;
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
                                daddy.push(parent[parent.length - 1][0]);
                                begin.push(parent[parent.length - 1][1]);
                                attrs.push({});
                                stats.template[0] = stats.template[0] + 1;
                                stats.template[1] = stats.template[1] + 10;
                                earlyexit         = true;
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
                    for (a = a; a < c; a = a + 1) {
                        if (b[a] === "\n") {
                            line = line + 1;
                        }
                        if (preserve === true || (/\s/).test(b[a]) === false) {
                            lexer.push(b[a]);
                        } else if (lexer[lexer.length - 1] !== " ") {
                            lexer.push(" ");
                        }
                        if (comment === true) {
                            quote = "";
                            //comments must ignore fancy encapsulations and attribute parsing
                            if (b[a] === lastchar && lexer.length > end.length + 1) {
                                //if current character matches the last character of the tag ending sequence
                                f = lexer.length;
                                for (e = end.length - 1; e > -1; e = e - 1) {
                                    f = f - 1;
                                    if (lexer[f] !== end.charAt(e)) {
                                        break;
                                    }
                                }
                                if (e < 0) {
                                    if (end === "endcomment") {
                                        f = f - 1;
                                        if ((/\s/).test(lexer[f]) === true) {
                                            do {
                                                f = f - 1;
                                            } while ((/\s/).test(lexer[f]) === true);
                                        }
                                        if (lexer[f - 1] === "{" && lexer[f] === "%") {
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
                                if (types[types.length - 1] === "sgml" && b[a] === "[" && lexer.length > 4) {
                                    types[types.length - 1] = "template_start";
                                    break;
                                }
                                if (b[a] === "<" && preserve === false && lexer.length > 1 && end !== ">>" && end !== ">>>" && simple === true) {
                                    parseError.push("Parse error on line " + line + " on element: ");
                                    parseFail = true;
                                }
                                if (stest === true && (/\s/).test(b[a]) === false && b[a] !== lastchar) {
                                    //attribute start
                                    stest   = false;
                                    quote   = jsxquote;
                                    igcount = 0;
                                    lexer.pop();
                                    for (a = a; a < c; a = a + 1) {
                                        if (b[a] === "\n") {
                                            line = line + 1;
                                        }
                                        if (options.unformatted === true) {
                                            lexer.push(b[a]);
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
                                                        lexer.pop();
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
                                            } else if (lexer[0] !== "{" && b[a] === "{" && (options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
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
                                                    for (e = a + 1; e < c; e = e + 1) {
                                                        if ((/\s/).test(b[e]) === false) {
                                                            if (b[e] === "\"" || b[e] === "'") {
                                                                a         = e - 1;
                                                                quotetest = true;
                                                                attribute.pop();
                                                            }
                                                            break;
                                                        }
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
                                            tname = lexer[1] + lexer[2];
                                            tname = tname.toLowerCase();
                                            // in coldfusion quotes are escaped in a string with double the characters:
                                            // "cat"" and dog"
                                            if (tname === "cf" && b[a] === b[a + 1] && (b[a] === "\"" || b[a] === "'")) {
                                                attribute.push(b[a + 1]);
                                                a = a + 1;
                                            } else {
                                                for (e = quote.length - 1; e > -1; e = e - 1) {
                                                    if (b[a - f] !== quote.charAt(e)) {
                                                        break;
                                                    }
                                                    f = f + 1;
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
                                    }
                                } else if (end !== "%>" && end !== "\n" && (b[a] === "\"" || b[a] === "'")) {
                                    //opening quote
                                    quote = b[a];
                                } else if (comment === false && end !== "\n" && b[a] === "<" && b[a + 1] === "!" && b[a + 2] === "-" && b[a + 3] === "-" && b[a + 4] !== "#" && types[types.length - 1] !== "conditional") {
                                    quote = "-->";
                                } else if (lexer[0] !== "{" && end !== "\n" && b[a] === "{" && end !== "%>" && end !== "%]" && (options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
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
                                    stest                   = true;
                                    lexer[lexer.length - 1] = " ";
                                    attribute.push(b[a]);
                                    if (b[a + 1] === "*") {
                                        jsxquote = "*/";
                                    } else {
                                        jsxquote = "\n";
                                    }
                                } else if ((b[a] === lastchar || (end === "\n" && b[a + 1] === "<")) && (lexer.length > end.length + 1 || lexer[0] === "]") && (options.jsx === false || jsxcount === 0)) {
                                    if (end === "\n") {
                                        if ((/\s/).test(lexer[lexer.length - 1]) === true) {
                                            do {
                                                lexer.pop();
                                                a = a - 1;
                                            } while ((/\s/).test(lexer[lexer.length - 1]) === true);
                                        }
                                        break;
                                    }
                                    if (lexer[0] === "{" && lexer[1] === "%" && lexer.join("").replace(/\s+/g, "") === "{%comment%}") {
                                        end                     = "endcomment";
                                        lastchar                = "t";
                                        preserve                = true;
                                        comment                 = true;
                                        types[types.length - 1] = "comment";
                                    } else {
                                        //if current character matches the last character of the tag ending sequence
                                        f = lexer.length;
                                        for (e = end.length - 1; e > -1; e = e - 1) {
                                            f = f - 1;
                                            if (lexer[f] !== end.charAt(e)) {
                                                break;
                                            }
                                        }
                                        if (e < 0) {
                                            break;
                                        }
                                    }
                                }
                            } else if (b[a] === quote.charAt(quote.length - 1) && ((options.jsx === true && end === "}" && (b[a - 1] !== "\\" || slashy() === false)) || options.jsx === false || end !== "}")) {
                                //find the closing quote or embedded template expression
                                f     = 0;
                                tname = lexer[1] + lexer[2];
                                tname = tname.toLowerCase();
                                // in coldfusion quotes are escaped in a string with double the characters:
                                // "cat"" and dog"
                                if (tname === "cf" && b[a] === b[a + 1] && (b[a] === "\"" || b[a] === "'")) {
                                    attribute.push(b[a + 1]);
                                    a = a + 1;
                                } else {
                                    for (e = quote.length - 1; e > -1; e = e - 1) {
                                        if (b[a - f] !== quote.charAt(e)) {
                                            break;
                                        }
                                        f = f + 1;
                                    }
                                    if (e < 0) {
                                        quote = "";
                                    }
                                }
                            }
                        }
                    }
                    //nopush flags mean an early exit
                    if (nopush === true) {
                        jscom.pop();
                        linen.pop();
                        lines.pop();
                        value.pop();
                        space = minspace;
                        return;
                    }

                    if (preserve === true) {
                        presv.push(true);
                    } else {
                        presv.push(false);
                    }

                    if (options.correct === true) {
                        if (b[a + 1] === ">" && lexer[0] === "<" && lexer[1] !== "<") {
                            do {
                                a = a + 1;
                            } while (b[a + 1] === ">");
                        } else if (lexer[0] === "<" && lexer[1] === "<" && b[a + 1] !== ">" && lexer[lexer.length - 2] !== ">") {
                            do {
                                lexer.splice(1, 1);
                            } while (lexer[1] === "<");
                        }
                    }
                    igcount = 0;
                    element = lexer.join("");
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
                        value.push("");
                        value.push("");
                        jscom.push(false);
                        jscom.push(false);
                        e = linen[linen.length - 1];
                        linen.push(e);
                        linen.push(e);
                        types[types.length - 1] = "template_start";
                        token.push("{% comment %}");
                        types.push("comment");
                        daddy.push(parent[parent.length - 1][0]);
                        begin.push(parent[parent.length - 1][1]);
                        stats.template[0] = stats.template[0] + 1;
                        stats.template[1] = stats.template[1] + 13;
                        token.push(element);
                        types.push("template_end");
                        daddy.push(parent[parent.length - 1][0]);
                        begin.push(parent[parent.length - 1][1]);
                        stats.template[0] = stats.template[0] + 1;
                        stats.template[1] = stats.template[1] + element.length;
                        return token.push("{% endcomment %}");
                    }

                    if (end !== "]>" && sgmlflag > 0 && element.charAt(element.length - 1) !== "[" && (element.slice(element.length - 2) === "]>" || (/^(<!((doctype)|(notation))\s)/i).test(element) === true)) {
                        sgmlflag = sgmlflag - 1;
                    }

                    //fix singleton tags and sort attributes
                    if (attstore.length > 0) {
                        if (attstore[attstore.length - 1] === "/") {
                            attstore.pop();
                            lexer.splice(lexer.length - 1, 0, "/");
                        }
                        f = attstore.length;
                        for (e = 1; e < f; e = e + 1) {
                            quote = attstore[e - 1];
                            if (quote.charAt(quote.length - 1) === "=" && attstore[e].indexOf("=") < 0) {
                                attstore[e - 1] = quote + attstore[e];
                                attstore.splice(e, 1);
                                f = f - 1;
                                e = e - 1;
                            }
                        }
                        if (objsortop === true && jscom[jscom.length - 1] === false && options.jsx === false && nosort === false && tname !== "cfif" && tname !== "cfelseif" && tname !== "cfset") {
                            attstore = safeSort(attstore);
                        }
                    }
                    attrs.push(function markuppretty__tokenize_attribute() {
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
                        for (ind = 0; ind < len; ind = ind + 1) {
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
                                daddy.push(parent[parent.length - 1][0]);
                                begin.push(parent[parent.length - 1][1]);
                                stats.end[0] = stats.end[0] + 1;
                                stats.end[1] = stats.end[1] + token[token.length - 1].length;
                                return types.push("end");
                            }
                        }
                    }
                    // cheat identifies HTML singleton elements as singletons even if formatted as
                    // start tags
                    cheat = (function markuppretty__tokenize_tag_cheat() {
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
                            fixsingleton = function markuppretty__tokenize_tag_cheat_fixsingleton() {
                                var aa    = 0,
                                    bb    = 0,
                                    vname = tname.slice(1);
                                for (aa = token.length - 1; aa > -1; aa = aa - 1) {
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
                                            types[aa]          = "start";
                                            stats.singleton[0] = stats.singleton[0] - 1;
                                            stats.singleton[1] = stats.singleton[1] - token[token.length - 1].length;
                                            stats.start[0]     = stats.start[0] + 1;
                                            stats.start[1]     = stats.start[1] + token[token.length - 1].length;
                                        }
                                        if (Object.keys(attrs[aa]).length > 0) {
                                            token[aa] = token[aa].replace(/(\s*\/>)$/, " >");
                                        } else {
                                            token[aa] = token[aa].replace(/(\s*\/>)$/, ">");
                                        }
                                        return false;
                                    }
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
                                value.pop();
                                if (types[types.length - 1] === "start") {
                                    token[token.length - 1] = token[token.length - 1].replace(/>$/, "/>");
                                }
                                types[types.length - 1] = "singleton";
                                singleton               = true;
                                return;
                            }
                        }
                        for (d = attstore.length - 1; d > -1; d = d - 1) {
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
                                for (d = a + 1; d < c; d = d + 1) {
                                    if ((/\s/).test(b[d]) === false) {
                                        if (b[d] === "<") {
                                            if (b.slice(d + 1, d + 4).join("") === "!--") {
                                                for (d = d + 4; d < c; d = d + 1) {
                                                    if ((/\s/).test(b[d]) === false) {
                                                        ext = false;
                                                        break;
                                                    }
                                                    if (b[d] === "\n" || b[d] === "\r") {
                                                        break;
                                                    }
                                                }
                                            } else if (b.slice(d + 1, d + 9).join("") !== "![CDATA[") {
                                                ext = false;
                                            }
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                        if (tname === "/#assign" || tname === "/#global") {
                            for (d = types.length - 2; d > -1; d = d - 1) {
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
                                        for (d = types.length - 1; d > -1; d = d - 1) {
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
                                    lexer.pop();
                                    lexer.push(" ");
                                    lexer.push("/");
                                    lexer.push(">");
                                    element = lexer.join("");
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
                                token.push(lexer.join(""));
                                daddy.push(parent[parent.length - 1][0]);
                                begin.push(parent[parent.length - 1][1]);
                                stats.template[0] = stats.template[0] + 1;
                                stats.template[1] = stats.template[1] + token[token.length - 1].length;
                                singleton         = true;
                                return false;
                            }
                            if (tname === "cftransaction" && cftransaction === true) {
                                cfval = "prohibited";
                            } else {
                                cfval = cftags[tname];
                            }
                            if (cfval === "optional" || cfval === "prohibited" || tname.slice(0, 3) === "cf_") {
                                if (options.correct === true && ender.test(element) === false) {
                                    lexer.pop();
                                    lexer.push(" ");
                                    lexer.push("/");
                                    lexer.push(">");
                                }
                                types.push("template");
                                token.push(lexer.join("").replace(/\s+/, " "));
                                daddy.push(parent[parent.length - 1][0]);
                                begin.push(parent[parent.length - 1][1]);
                                stats.template[0] = stats.template[0] + 1;
                                stats.template[1] = stats.template[1] + token[token.length - 1].length;
                                singleton         = true;
                                return false;
                            }
                            if (cfval === "required" && tname !== "cfquery") {
                                if (tname === "cftransaction" && cftransaction === false) {
                                    cftransaction = true;
                                }
                                types.push("template_start");
                                token.push(lexer.join(""));
                                daddy.push(parent[parent.length - 1][0]);
                                if (parent[parent.length - 1][1] === -1) {
                                    begin.push(token.length - 1);
                                } else {
                                    begin.push(parent[parent.length - 1][1]);
                                }
                                stats.template[0] = stats.template[0] + 1;
                                stats.template[1] = stats.template[1] + token[token.length - 1].length;
                                singleton         = true;
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
                        if (cheat === true || (lexer[lexer.length - 2] === "/" && lexer[lexer.length - 1] === ">")) {
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
                            for (a = a; a < c; a = a + 1) {
                                if (b[a] === "\n") {
                                    line = line + 1;
                                }
                                lexer.push(b[a]);
                                if (quote === "") {
                                    if (b[a] === "\"") {
                                        quote = "\"";
                                    } else if (b[a] === "'") {
                                        quote = "'";
                                    } else if (lexer[0] !== "{" && b[a] === "{" && (options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
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
                                    for (e = quote.length - 1; e > -1; e = e - 1) {
                                        if (b[a - f] !== quote.charAt(e)) {
                                            break;
                                        }
                                        f = f + 1;
                                    }
                                    if (e < 0) {
                                        quote = "";
                                    }
                                }
                            }
                        }
                        element = lexer.join("");
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
                            lexer = [
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
                                for (f = lexer.length - 1; f > -1; f = f - 1) {
                                    if (tname === lexer[f]) {
                                        types[e] = "template_start";
                                        break;
                                    }
                                    if (tname === "end" + lexer[f]) {
                                        types[e] = "template_end";
                                        break;
                                    }
                                }
                            }
                        } else if (element.slice(0, 2) === "{{" && element.charAt(3) !== "{") {
                            if ((/^(\{\{\s*end\s*\}\})$/).test(element) === true) {
                                types[e] = "template_end";
                            } else if (tname === "block" || tname === "define" || tname === "form" || tname === "if" || tname === "range" || tname === "with") {
                                if (tname !== "block" || (/\{%\s*\w/).test(options.source) === false) {
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
                    if (liend === true && (options.mode === "beautify" || options.mode === "diff" || options.mode === "parse")) {
                        token.push("</prettydiffli>");
                        daddy.push(parent[parent.length - 1][0]);
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
                        value.push("");
                        if (parent.length > 1) {
                            parent.pop();
                        }
                        stats.end[0] = stats.end[0] + 1;
                        stats.end[1] = stats.end[1] + 5;
                    }
                    if (parent[parent.length - 1][1] === -1) {
                        parent[parent.length - 1] = ["root", token.length];
                    }
                    if (preserve === true) {
                        token.push(element);
                        daddy.push(parent[parent.length - 1][0]);
                        begin.push(parent[parent.length - 1][1]);
                        stats.ignore[0] = stats.ignore[0] + 1;
                        stats.ignore[1] = stats.ignore[1] + token[token.length - 1].length;
                    } else {
                        if (options.jsx === true) {
                            token.push(element);
                        } else {
                            token.push(element.replace(/\s+/g, " "));
                        }
                        daddy.push(parent[parent.length - 1][0]);
                        begin.push(parent[parent.length - 1][1]);
                        if (types[types.length - 1].indexOf("template") > -1) {
                            stats.template[0] = stats.template[0] + 1;
                            stats.template[1] = stats.template[1] + token[token.length - 1].length;
                        } else if (types[types.length - 1].indexOf("linepreserve") > -1) {
                            stats.ignore[0] = stats.ignore[0] + 1;
                            stats.ignore[1] = stats.ignore[1] + token[token.length - 1].length;
                        } else {
                            stats[types[types.length - 1]][0] = stats[types[types.length - 1]][0] + 1;
                            stats[types[types.length - 1]][1] = stats[types[types.length - 1]][1] +
                                    token[token.length - 1].length;
                        }
                    }
                    if (options.tagsort === true && types[types.length - 1] === "end" && types[types.length - 2] !== "start") {
                        (function markuppretty__tokenize_tag_sorttag() {
                            var children   = [],
                                bb         = 0,
                                d          = 0,
                                endStore   = 0,
                                startStore = 0,
                                endData    = {},
                                store      = {
                                    attrs: [],
                                    begin: [],
                                    daddy: [],
                                    jscom: [],
                                    linen: [],
                                    lines: [],
                                    presv: [],
                                    token: [],
                                    types: [],
                                    value: []
                                },
                                sortName   = function markuppretty__tokenize_tag_sorttag_sortName(x, y) {
                                    if (token[x[0]] < token[y[0]]) {
                                        return 1;
                                    }
                                    return -1;
                                },
                                pushy      = function markuppretty__tokenize_tag_sorttag_pushy(index) {
                                    store
                                        .attrs
                                        .push(attrs[index]);
                                    store
                                        .begin
                                        .push(begin[index]);
                                    store
                                        .daddy
                                        .push(daddy[index]);
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
                                    store
                                        .value
                                        .push(value[index]);
                                };
                            for (bb = token.length - 2; bb > -1; bb = bb - 1) {
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
                            endData.daddy = daddy.pop();
                            endData.jscom = jscom.pop();
                            endData.linen = linen.pop();
                            endData.lines = lines.pop();
                            endData.presv = presv.pop();
                            endData.token = token.pop();
                            endData.types = types.pop();
                            endData.value = value.pop();
                            attrs         = attrs
                                .slice(0, startStore)
                                .concat(store.attrs);
                            begin         = begin
                                .slice(0, startStore)
                                .concat(store.begin);
                            daddy         = daddy
                                .slice(0, startStore)
                                .concat(store.daddy);
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
                            value         = value
                                .slice(0, startStore)
                                .concat(store.value);
                            attrs.push(endData.attrs);
                            begin.push(endData.begin);
                            daddy.push(endData.daddy);
                            jscom.push(endData.jscom);
                            linen.push(endData.linen);
                            lines.push(endData.lines);
                            presv.push(endData.presv);
                            token.push(endData.token);
                            types.push(endData.types);
                            value.push(endData.value);
                        }());
                    }
                    e = token.length - 1;
                    if (types[e] === "start") {
                        parent.push([tname, e]);
                    } else if (types[e] === "end" && parent.length > 1) {
                        parent.pop();
                    }
                    if (options.attributetoken === true && options.mode === "parse") {
                        attribute = Object.keys(attrs[e]);
                        bcount    = attribute.length;
                        if ((types[e] === "start" || types[e] === "singleton") && bcount > 0) {
                            for (f = 0; f < bcount; f = f + 1) {
                                attrs.push({});
                                begin.push(begin[e]);
                                if (daddy[e] === "root") {
                                    daddy.push(tname);
                                } else {
                                    daddy.push(daddy[e]);
                                }
                                jscom.push(false);
                                linen.push(linen[e]);
                                lines.push(0);
                                presv.push(presv[e]);
                                token.push(attribute[f]);
                                if (attribute[f] === "") {
                                    types.push("template_attribute");
                                    value.push("");
                                } else {
                                    types.push("attribute");
                                    value.push(attrs[e][attribute[f]]);
                                }
                            }
                        }
                    }
                },
                content       = function markuppretty__tokenize_content() {
                    var lexer     = [],
                        quote     = "",
                        end       = "",
                        square    = (
                            types[types.length - 1] === "template_start" && token[token.length - 1].indexOf("<!") === 0 && token[token.length - 1].indexOf("<![") < 0 && token[token.length - 1].charAt(token[token.length - 1].length - 1) === "["
                        ),
                        tailSpace = function markuppretty__tokenize_content_tailSpace(spacey) {
                            if (linepreserve > 0 && spacey.indexOf("\n") < 0 && spacey.indexOf("\r") < 0) {
                                spacey = "";
                            }
                            space = spacey;
                            return "";
                        },
                        esctest   = function markuppretty__tokenize_content_esctest() {
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
                    value.push("");
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
                                    if (lexer.length < 1) {
                                        attrs.pop();
                                        jscom.pop();
                                        linen.pop();
                                        presv.pop();
                                        value.pop();
                                        return lines.pop();
                                    }
                                    token.push(lexer.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""));
                                    daddy.push(parent[parent.length - 1][0]);
                                    begin.push(parent[parent.length - 1][1]);
                                    stats.script[0] = stats.script[0] + 1;
                                    stats.script[1] = stats.script[1] + token[token.length - 1].length;
                                    if (typeof global.prettydiff.jspretty === "function") {
                                        return types.push(name);
                                    }
                                    return types.push("content");
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
                                        if (lexer.length < 1) {
                                            attrs.pop();
                                            jscom.pop();
                                            linen.pop();
                                            presv.pop();
                                            value.pop();
                                            return lines.pop();
                                        }
                                        token.push(lexer.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""));
                                        daddy.push(parent[parent.length - 1][0]);
                                        begin.push(parent[parent.length - 1][1]);
                                        stats.script[0] = stats.script[0] + 1;
                                        stats.script[1] = stats.script[1] + token[token.length - 1].length;
                                        if (typeof global.prettydiff.jspretty === "function") {
                                            return types.push(name);
                                        }
                                        return types.push("content");
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
                                        if (lexer.length < 1) {
                                            attrs.pop();
                                            jscom.pop();
                                            linen.pop();
                                            presv.pop();
                                            value.pop();
                                            return lines.pop();
                                        }
                                        token.push(lexer.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""));
                                        daddy.push(parent[parent.length - 1][0]);
                                        begin.push(parent[parent.length - 1][1]);
                                        stats.style[0] = stats.style[0] + 1;
                                        stats.style[1] = stats.style[1] + token[token.length - 1].length;
                                        if (typeof global.prettydiff.csspretty === "function") {
                                            return types.push(name);
                                        }
                                        return types.push("content");
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
                                token.push(minspace + lexer.join(""));
                                lines[lines.length - 1] = 0;
                            } else if (linepreserve > 0) {
                                token.push(minspace + lexer.join("").replace(/(\s+)$/, tailSpace));
                                lines[lines.length - 1] = 0;
                            } else {
                                token.push(lexer.join("").replace(/(\s+)$/, tailSpace).replace(/\s+/g, " "));
                            }
                            stats.content[0] = stats.content[0] + 1;
                            stats.content[1] = stats.content[1] + token[token.length - 1].length;
                            daddy.push(parent[parent.length - 1][0]);
                            begin.push(parent[parent.length - 1][1]);
                            return types.push("content");
                        }

                        if (ext === false && lexer.length > 0 && ((b[a] === "<" && b[a + 1] !== "=" && (/\s|\d/).test(b[a + 1]) === false) || (b[a] === "[" && b[a + 1] === "%") || (b[a] === "{" && (options.jsx === true || options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")))) {
                            if (options.dustjs === true && b[a] === "{" && b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                                a = a + 6;
                                if (options.content === true) {
                                    token.push("text");
                                } else if (options.textpreserve === true) {
                                    token.push(minspace + lexer.join(""));
                                    lines[lines.length - 1] = 0;
                                } else {
                                    token.push(lexer.join("").replace(/(\s+)$/, tailSpace).replace(/\s+/g, " "));
                                }
                                stats.content[0] = stats.content[0] + 1;
                                stats.content[1] = stats.content[1] + token[token.length - 1].length;
                                types.push("content");
                                spacer();
                                attrs.push({});
                                jscom.push(false);
                                linen.push(line);
                                presv.push(false);
                                token.push("{:else}");
                                value.push("");
                                stats.template[0] = stats.template[0] + 1;
                                stats.template[1] = stats.template[1] + token[token.length - 1].length;
                                daddy.push(parent[parent.length - 1][0]);
                                begin.push(parent[parent.length - 1][1]);
                                return types.push("template_else");
                            }
                            a = a - 1;
                            if (options.content === true) {
                                token.push("text");
                            } else if (options.textpreserve === true) {
                                token.push(minspace + lexer.join(""));
                                lines[lines.length - 1] = 0;
                            } else if (linepreserve > 0) {
                                token.push(minspace + lexer.join("").replace(/(\s+)$/, tailSpace));
                                lines[lines.length - 1] = 0;
                            } else {
                                token.push(lexer.join("").replace(/(\s+)$/, tailSpace).replace(/\s+/g, " "));
                            }
                            stats.content[0] = stats.content[0] + 1;
                            stats.content[1] = stats.content[1] + token[token.length - 1].length;
                            daddy.push(parent[parent.length - 1][0]);
                            begin.push(parent[parent.length - 1][1]);
                            return types.push("content");
                        }
                        lexer.push(b[a]);
                    }
                    spacer();
                    if (options.content === true) {
                        token.push("text");
                    } else if (options.textpreserve === true) {
                        token.push(minspace + lexer.join(""));
                        lines[lines.length - 1] = 0;
                    } else {
                        token.push(lexer.join("").replace(/(\s+)$/, tailSpace));
                    }
                    stats.content[0] = stats.content[0] + 1;
                    stats.content[1] = stats.content[1] + token[token.length - 1].length;
                    daddy.push(parent[parent.length - 1][0]);
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

        if (token.length === 0) {
            if (options.nodeasync === true) {
                return [options.source, "Error: source does not appear to be markup."];
            }
            if (global.prettydiff.meta === undefined) {
                global.prettydiff.meta = {};
            }
            global.prettydiff.meta.error = "Error: source does not appear to be markup.";
            return options.source;
        }

        globalerror = (function markuppretty__globalerror() {
            var startend = stats.start[0] - stats.end[0],
                error    = "";
            if (startend > 0) {
                error = startend + " more start tag";
                if (startend > 1) {
                    error = error + "s";
                }
                error = error + " than start tag";
                if (startend > 1) {
                    error = error + "s";
                }
                error = error + "!";
                return error;
            } else if (startend < 0) {
                startend = startend * -1;
                error    = startend + " more end tag";
                if (startend > 1) {
                    error = error + "s";
                }
                error = error + " than start tag";
                if (startend > 1) {
                    error = error + "s";
                }
                error = error + "!";
                return error;
            } else {
                return "";
            }
        }());

        if (options.nodeasync === false) {
            if (global.prettydiff.meta === undefined) {
                global.prettydiff.meta       = {};
                global.prettydiff.meta.error = "";
            }
            if (global.prettydiff.meta.error === "") {
                global.prettydiff.meta.error = globalerror;
            }
        }

        if (options.mode === "parse") {
            return (function markuppretty__parse() {
                var a        = 0,
                    c        = token.length,
                    record   = [],
                    wspace   = "",
                    data     = {},
                    def      = {
                        attrs: "array - List of attributes (if any) for the given token.",
                        begin: "number - Index where the parent element occurs.",
                        daddy: "string - Tag name of the parent element. Tokens of type 'template_start' are n" +
                                "ot considered as parent elements.  End tags reflect their matching start tag.",
                        jscom: "boolean - Whether the token is a JavaScript comment if in JSX format.",
                        linen: "number - The line number in the original source where the token started, which" +
                                " is used for reporting and analysis.",
                        lines: "number - Whether the token is preceeded any space and/or line breaks in the or" +
                                "iginal code source.",
                        presv: "boolean - Whether the token is preserved verbatim as found.  Useful for commen" +
                                "ts and HTML 'pre' tags.",
                        token: "string - The parsed code tokens.",
                        types: "string - Data types of the tokens: cdata, comment, conditional, content, end, " +
                                "ignore, linepreserve, script, sgml, singleton, start, template, template_else," +
                                " template_end, template_start, xml",
                        value: "string - The attribute's value if the current type is attribute"
                    },
                    //white space token to insertion logic
                    insert   = function markuppretty__parse_insert(string) {
                        if (types[a] === "content") {
                            token[a] = string + token[a];
                            return;
                        }
                        if (types[a - 1] === "content" && token[a] !== "content") {
                            token[a - 1] = token[a - 1] + string;
                            return;
                        }
                        attrs.splice(a, 0, {});
                        begin.splice(a, 0, begin[a]);
                        daddy.splice(a, 0, daddy[a]);
                        jscom.splice(a, 0, false);
                        linen.splice(a, 0, linen[a]);
                        lines.splice(a, 0, 1);
                        presv.splice(a, 0, false);
                        token.splice(a, 0, string);
                        types.splice(a, 0, "content");
                        value.splice(a, 0, "");
                        c = c + 1;
                        a = a + 1;
                    },
                    attApply = function markuppretty__parse_attApply(atty) {
                        var string = "",
                            xlen   = atty.length,
                            xind   = 0,
                            toke   = token[a],
                            atts   = "";
                        for (xind = 0; xind < xlen; xind = xind + 1) {
                            if (attrs[a][atty[xind]] === "") {
                                atts = atts + " " + atty[xind];
                            } else {
                                atts = atts + " " + atty[xind] + "=" + attrs[a][atty[xind]];
                            }
                        }
                        if (presv[a] === true) {
                            token[a] = toke.replace(" ", atts);
                        } else {
                            string   = ((/(\/>)$/).test(toke) === true)
                                ? "/>"
                                : ">";
                            xlen     = (string === "/>")
                                ? 3
                                : 2;
                            token[a] = (toke.slice(0, toke.length - xlen) + atts + string);
                        }
                    };
                if (options.attributetoken === true) {
                    delete def.attrs;
                } else {
                    delete def.value;
                }
                for (a = 0; a < c; a = a + 1) {
                    wspace = "";
                    record = Object.keys(attrs[a]);
                    if (record.length > 0 && options.unformatted === false) {
                        attApply(record);
                    }
                    if (token[a] === "</prettydiffli>") {
                        if (options.correct === true) {
                            token[a] = "</li>";
                        } else {
                            attrs.splice(a, 1);
                            begin.splice(a, 1);
                            daddy.splice(a, 1);
                            jscom.splice(a, 1);
                            linen.splice(a, 1);
                            lines.splice(a, 1);
                            presv.splice(a, 1);
                            token.splice(a, 1);
                            types.splice(a, 1);
                            value.splice(a, 1);
                            a = a - 1;
                            c = c - 1;
                        }
                    }
                    if (options.parseFormat !== "htmltable") {
                        if (types[a] === "script") {
                            options.source = token[a];
                            token[a]       = extlib("script");
                        } else if (types[a] === "style") {
                            options.source = token[a];
                            token[a]       = extlib("style");
                        }
                    }
                    if (options.parseSpace === true) {
                        if (lines[a] > 1) {
                            if (options.preserve > 1) {
                                if (options.parseFormat === "htmltable") {
                                    wspace = "(empty line)";
                                } else {
                                    wspace = lf + lf;
                                }
                            } else if (types[a] === "singleton" || types[a] === "content" || types[a] === "template") {
                                wspace = " ";
                            }
                        } else if (lines[a] === 1) {
                            if (types[a] === "singleton" || types[a] === "content" || types[a] === "template") {
                                wspace = " ";
                            } else if (types[a] !== types[a - 1] && (types[a - 1] === "singleton" || types[a - 1] === "content" || types[a - 1] === "template")) {
                                wspace = " ";
                            }
                        }
                        if (wspace !== "") {
                            if (wspace === " " && options.parseFormat === "htmltable") {
                                wspace = "(space)";
                            }
                            insert(wspace);
                        }
                    }
                }
                if (options.parseFormat === "sequential") {
                    if (options.attributetoken === true) {
                        def.order = "[token, types, value, lines, linen, jscom, presv, daddy, begin]";
                    } else {
                        def.order = "[token, types, attrs, lines, linen, jscom, presv, daddy, begin]";
                    }
                    for (a = 0; a < c; a = a + 1) {
                        if (options.attributetoken === true) {
                            record.push([
                                token[a],
                                types[a],
                                value[a],
                                lines[a],
                                linen[a],
                                jscom[a],
                                presv[a],
                                daddy[a],
                                begin[a]
                            ]);
                        } else {
                            record.push([
                                token[a],
                                types[a],
                                attrs[a],
                                lines[a],
                                linen[a],
                                jscom[a],
                                presv[a],
                                daddy[a],
                                begin[a]
                            ]);
                        }
                    }
                    if (options.nodeasync === true) {
                        return [
                            {
                                data      : record,
                                definition: def
                            },
                            globalerror
                        ];
                    }
                    return {data: record, definition: def};
                }
                if (options.parseFormat === "htmltable") {
                    return (function markuppretty__parse_html() {
                        var report = [],
                            header = "<tr class=\"header\"><th>index</th><th>token</th><th>types</th>",
                            aa     = 0,
                            len    = 0;
                        if (options.attributetoken === true) {
                            header = header + "<th>value</th>";
                        } else {
                            header = header + "<th>attrs</th>";
                        }
                        header = header + "<th>linen</th><th>jscom</th><th>presv</th><th>daddy</th><th>" +
                                "begin</th><th>lines</th></tr>";
                        report.push("<table summary='markup parse table'><thead>");
                        report.push(header);
                        report.push("</thead><tbody>");
                        len = token.length;
                        for (aa = 0; aa < len; aa = aa + 1) {
                            if (types[aa] === "script") {
                                options.source = token[aa];
                                report.push("<tr><td colspan=\"10\" class=\"nested\">");
                                report.push(extlib("script"));
                                report.push("</td></tr>");
                                report.push("<tr><th colspan=\"10\" class=\"nested\">Markup tokens</th></tr>");
                                report.push(header);
                            } else if (types[aa] === "style") {
                                options.source = token[aa];
                                report.push("<tr><td colspan=\"10\" class=\"nested\">");
                                report.push(extlib("style"));
                                report.push("</td></tr>");
                                report.push("<tr><th colspan=\"10\" class=\"nested\">Markup tokens</th></tr>");
                                report.push(header);
                            } else {
                                report.push("<tr><td>");
                                report.push(aa);
                                report.push("</td><td style=\"white-space:pre\">");
                                report.push(
                                    token[aa].replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;")
                                );
                                report.push("</td><td>");
                                report.push(types[aa]);
                                report.push("</td>");
                                if (options.attributetoken === true) {
                                    report.push("<td style=\"white-space:pre\">");
                                    report.push(
                                        value[aa].replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;")
                                    );
                                    report.push("</td><td>");
                                } else {
                                    report.push("<td style=\"white-space:pre\">");
                                    report.push(
                                        JSON.stringify(attrs[aa]).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;")
                                    );
                                    report.push("</td><td>");
                                }
                                report.push(linen[aa]);
                                report.push("</td><td>");
                                report.push(jscom[aa]);
                                report.push("</td><td>");
                                report.push(presv[aa]);
                                report.push("</td><td>");
                                report.push(daddy[aa]);
                                report.push("</td><td>");
                                report.push(begin[aa]);
                                report.push("</td><td>");
                                report.push(lines[aa]);
                                report.push("</td></tr>");
                            }
                        }
                        report.push("</tbody></table>");
                        if (options.nodeasync === true) {
                            return [
                                {
                                    data      : report.join(""),
                                    definition: def
                                },
                                globalerror
                            ];
                        }
                        return {data: report.join(""), definition: def};
                    }());
                }
                if (options.attributetoken === true) {
                    data.value = value;
                } else {
                    data.attrs = attrs;
                }
                data.begin = begin;
                data.daddy = daddy;
                data.jscom = jscom;
                data.linen = linen;
                data.lines = lines;
                data.presv = presv;
                data.token = token;
                data.types = types;
                if (options.nodeasync === true) {
                    return [
                        {
                            data      : data,
                            definition: def
                        },
                        globalerror
                    ];
                }
                return {data: data, definition: def};
            }());
        }

        if (options.mode === "minify") {
            (function markuppretty__minify() {
                var a      = 0,
                    c      = token.length,
                    script = function markuppretty__minify_script() {
                        options.source = token[a];
                        token[a]       = extlib("script");
                        level.push(-20);
                    },
                    style  = function markuppretty__minify_style() {
                        options.source = token[a];
                        token[a]       = extlib("style");
                        level.push(-20);
                    };
                for (a = 0; a < c; a = a + 1) {
                    if (types[a] === "script") {
                        script();
                    } else if (types[a] === "style") {
                        style();
                    } else if (lines[a] > 0) {
                        if (types[a] === "singleton" || types[a] === "content" || types[a] === "template") {
                            level.push(0);
                        } else if (types[a - 1] === "singleton" || types[a - 1] === "content" || types[a] === "template") {
                            level.push(0);
                        } else {
                            level.push(-20);
                        }
                    } else {
                        level.push(-20);
                    }
                }
            }());
        }

        output = (function markuppretty__beautify() {
            var a            = 0,
                c            = token.length,
                lprescount   = [],
                ltype        = "",
                lline        = 0,
                indent       = options.inlevel,
                cdataS       = "",
                cdataE       = "",
                commentS     = "",
                commentE     = "",
                cdataStart   = (/^(\s*(\/)*<!?\[+[A-Z]+\[+)/),
                cdataEnd     = (/((\/)*\]+>\s*)$/),
                commentStart = (/^(\s*<!--)/),
                commentEnd   = (/((\/\/)?-->\s*)$/),
                tabs         = "",
                twigStart    = (/^(\{%\s+)/),
                twigEnd      = (/(\s%\})$/),
                xslline      = function markuppretty__beautify_xslline() {
                    var tname = false;
                    if (lines[a] > 1 || (types[a] !== "start" && types[a] !== "singleton") || (types[a - 1] === "comment" && lines[a - 1] > 1)) {
                        return;
                    }
                    tname = (tagName(token[a]).indexOf("xsl:") === 0);
                    if (tname === false) {
                        return;
                    }
                    if (types[a] === "start") {
                        lines[a] = 2;
                    } else if (types[a - 1] !== "start" || types[a + 1] !== "end" || (types[a - 1] !== "start" && types[a + 1] !== "end")) {
                        lines[a] = 2;
                    }
                },
                tab          = (function markuppretty__beautify_tab() {
                    var b   = options.insize,
                        ind = [];
                    for (b = b; b > 0; b = b - 1) {
                        ind.push(options.inchar);
                    }
                    return new RegExp("^(" + ind.join("") + "+)");
                }()),
                end          = function markuppretty__beautify_end() {
                    var b = 0;
                    indent = indent - 1;
                    if ((types[a] === "end" && ltype === "start") || (types[a] === "template_end" && ltype === "template_start") || (options.jsx === true && (/^\s+\{/).test(token[a - 1]) === true && lines[a] === 0)) {
                        return level.push(-20);
                    }
                    if (lines[a] < 1 && options.html === true && tagName(token[a - 1]) === "/span") {
                        b = a;
                        do {
                            b = b - 1;
                        } while (lines[b] < 1);
                        if (types[b] === "content" || types[b] === "singleton" || types[b] === "start" || types[b] === "comment" || types[b].indexOf("template") > -1) {
                            level[a - 1] = -20;
                            return level.push(-20);
                        }
                    }
                    if (options.force_indent === false) {
                        if (lines[a] === 0 && (ltype === "singleton" || ltype === "content" || (ltype === "template" && types[a] !== "template_end"))) {
                            return level.push(-20);
                        }
                        if (ltype === "comment") {
                            for (b = a - 1; b > -1; b = b - 1) {
                                if (types[b] !== "comment") {
                                    if (lines[b + 1] === 0 && (types[b] === "singleton" || types[b] === "content" || ltype === "template")) {
                                        for (b = b + 1; b < a; b = b + 1) {
                                            level[b] = -20;
                                        }
                                        return level.push(-20);
                                    }
                                    return level.push(indent);
                                }
                            }
                        }
                        return level.push(indent);
                    }
                    level.push(indent);
                },
                content      = function markuppretty__beautify_content() {
                    var b       = 0,
                        spanfix = function markuppretty__beautify_content_spanfix() {
                            b = b - 1;
                            if (types[b] === "comment") {
                                do {
                                    b = b - 1;
                                } while (b > 0 && types[b] === "comment" && lines[b] < 1);
                            }
                            if (lines[b] === 0 && tagName(token[b]) === "span" && (tagName(token[b - 1]) === "span" || tagName(token[b - 1]) === "/span")) {
                                do {
                                    level[b] = -20;
                                    b        = b - 1;
                                } while (
                                    b > 0 && lines[b] < 1 && (tagName(token[b]) === "span" || types[b] === "comment")
                                );
                            }
                        };
                    if (lines[a] === 0 && options.force_indent === false && (presv[a] === false || types[a] !== "content")) {
                        if (ltype === "comment" && lline === 0) {
                            for (b = a - 1; b > -1; b = b - 1) {
                                if (types[b - 1] !== "comment" && types[b] === "comment") {
                                    if (lines[b] === 0) {
                                        for (b = b; b < a; b = b + 1) {
                                            level[b] = -20;
                                        }
                                        if (options.html === true && tagName(token[begin[a]]) === "span") {
                                            spanfix();
                                        }
                                        return level.push(-20);
                                    }
                                    return level.push(indent);
                                }
                                if (lines[b] > 0) {
                                    return level.push(indent);
                                }
                            }
                            return level.push(indent);
                        }
                        level.push(-20);
                        if (options.html === true && begin[a] > -1 && tagName(token[begin[a]]) === "span") {
                            b = a;
                            spanfix();
                        }
                    } else {
                        level.push(indent);
                    }
                },
                script       = function markuppretty__beautify_script(twig) {
                    var list    = [],
                        source  = "",
                        twigfix = function markuppretty__beautify_script_twigfix(item) {
                            var fixnumb = function markupretty__beautify_script_twigfix_fixnumb(xx) {
                                return xx.replace(". .", "..");
                            };
                            item = item
                                .replace(tab, "")
                                .replace(/\)\s*and\s*\(/g, ") and (")
                                .replace(/in\u0020?\(?\d+\.\u0020\.\d\(?/g, fixnumb);
                            if (options.correct === true) {
                                item = item.replace(/;$/, "") + " %}";
                            } else {
                                item = item + " %}";
                            }
                            return "{% " + item;
                        },
                        inle    = options.inlevel,
                        mode    = options.mode;
                    if (twig === true) {
                        options.twig = true;
                        token[a]     = token[a]
                            .replace(twigStart, "")
                            .replace(twigEnd, "");
                    }
                    stats.script[0] = stats.script[0] + 1;
                    stats.script[1] = stats.script[1] + token[a]
                        .replace(/\s+/g, " ")
                        .length;
                    if (cdataStart.test(token[a]) === true) {
                        cdataS   = cdataStart
                            .exec(token[a])[0]
                            .replace(/^\s+/, "") + lf;
                        token[a] = token[a].replace(cdataStart, "");
                    } else if (commentStart.test(token[a]) === true) {
                        commentS = commentStart
                            .exec(token[a])[0]
                            .replace(/^\s+/, "") + lf;
                        token[a] = token[a].replace(commentStart, "");
                    }
                    if (cdataEnd.test(token[a]) === true) {
                        cdataE   = cdataEnd.exec(token[a])[0];
                        token[a] = token[a].replace(cdataEnd, "");
                    } else if (commentEnd.test(token[a]) === true) {
                        commentE = commentEnd.exec(token[a])[0];
                        token[a] = token[a].replace(commentEnd, "");
                    }
                    source          = token[a].replace(/^(\s+)/, "");
                    options.source  = source;
                    options.inlevel = (options.style === "noinde")
                        ? 0
                        : indent;
                    options.mode    = "beautify";
                    token[a]        = extlib("script");
                    options.inlevel = inle;
                    options.mode    = mode;
                    options.twig    = false;
                    list            = tab.exec(token[a]);
                    if (list !== null) {
                        tabs = list[0];
                    }
                    if (cdataS !== "") {
                        token[a] = tabs + cdataS + token[a];
                        cdataS   = "";
                    } else if (commentS !== "") {
                        token[a] = tabs + commentS + token[a];
                        commentS = "";
                    }
                    if (cdataE !== "") {
                        token[a] = token[a] + lf + tabs + cdataE;
                        cdataE   = "";
                    } else if (commentE !== "") {
                        token[a] = token[a] + lf + tabs + commentE;
                        commentE = "";
                    }
                    if ((/^(\s+\{)/).test(token[a]) === true && options.jsx === true) {
                        if (ltype === "content" || ltype === "singleton" || ltype === "template") {
                            token[a] = token[a].replace(/^(\s+)/, "");
                            if (lines[a] < 1) {
                                level.push(-20);
                            } else {
                                level.push(-10);
                            }
                        } else {
                            token[a] = token[a].replace(/^(\s+)/, "");
                            if (lines[a] === 0) {
                                level.push(-20);
                            } else {
                                level.push(indent);
                                token[a] = token[a].replace(/(\r?\n\})$/, lf + tabs + "}");
                            }
                        }
                        if (token[a].indexOf(";") < 0 && token[a].replace(/^(\{\s+)/, "").replace(/(\s+\})$/, "").indexOf("\n") < 0) {
                            token[a] = token[a]
                                .replace(/^(\{\s+)/, "{")
                                .replace(/(\s+\})$/, "}");
                        }
                    } else if (twig === true) {
                        token[a] = twigfix(token[a]);
                    } else if (twig === true && lines[a] === 0) {
                        level.push(-20);
                        types[a] = "singleton";
                    } else {
                        level.push(0);
                    }
                },
                style        = function markuppretty__beautify_style() {
                    var list = [],
                        inle = options.inlevel,
                        mode = options.mode;
                    stats.style[0] = stats.style[0] + 1;
                    stats.style[1] = stats.style[1] + token[a]
                        .replace(/\s+/g, " ")
                        .length;
                    if (cdataStart.test(token[a]) === true) {
                        cdataS   = cdataStart
                            .exec(token[a])[0]
                            .replace(/^\s+/, "") + lf;
                        token[a] = token[a].replace(cdataStart, "");
                    } else if (commentStart.test(token[a]) === true) {
                        commentS = commentStart
                            .exec(token[a])[0]
                            .replace(/^\s+/, "") + lf;
                        token[a] = token[a].replace(commentStart, "");
                    }
                    if (cdataEnd.test(token[a]) === true) {
                        cdataE   = cdataEnd.exec(token[a])[0];
                        token[a] = token[a].replace(cdataEnd, "");
                    } else if (commentEnd.test(token[a]) === true) {
                        commentE = commentEnd.exec(token[a])[0];
                        token[a] = token[a].replace(commentEnd, "");
                    }
                    options.inlevel = (options.style === "noindent")
                        ? 0
                        : indent;
                    options.mode    = "beautify";
                    options.source  = token[a].replace(/^(\s+)/, "");
                    token[a]        = extlib("style");
                    options.inlevel = inle;
                    options.mode    = mode;
                    list            = tab.exec(token[a]);
                    if (list !== null) {
                        tabs = list[0];
                    }
                    if (cdataS !== "") {
                        token[a] = tabs + cdataS + token[a];
                        cdataS   = "";
                    } else if (commentS !== "") {
                        token[a] = tabs + commentS + token[a];
                        commentS = "";
                    }
                    if (cdataE !== "") {
                        token[a] = token[a] + lf + tabs + cdataE;
                        cdataE   = "";
                    } else if (commentE !== "") {
                        token[a] = token[a] + lf + tabs + commentE;
                        commentE = "";
                    }
                    token[a] = token[a].replace(/(\s+)$/, "");
                    level.push(0);
                },
                apply        = function markuppretty__beautify_apply() {
                    var x            = 0,
                        y            = level.length,
                        build        = [],
                        attrib       = [],
                        //tab builds out the character sequence for one step of indentation
                        ind          = (function markuppretty__beautify_apply_tab() {
                            var aa   = 0,
                                indy = [options.inchar],
                                size = options.insize - 1;
                            for (aa = 0; aa < size; aa = aa + 1) {
                                indy.push(options.inchar);
                            }
                            return indy.join("");
                        }()),
                        // a new line character plus the correct amount of identation for the given line
                        // of code
                        nl           = function markuppretty__beautify_apply_nl(indy, item) {
                            var aa          = 0,
                                indentation = [lf];
                            if (options.mode === "minify") {
                                return build.push(lf);
                            }
                            if (indy === -10) {
                                item.push(" ");
                            } else if (indy > -9) {
                                if (lines[x] > 1 && item === build) {
                                    do {
                                        lines[x] = lines[x] - 1;
                                        indentation.push(lf);
                                    } while (lines[x] > 1);
                                }
                                for (aa = 0; aa < indy; aa = aa + 1) {
                                    indentation.push(ind);
                                }
                                item.push(indentation.join(""));
                            }
                        },
                        // populates attributes onto start and singleton tags it also checks to see if a
                        // tag or content should wrap
                        wrapper      = function markuppretty__beautify_apply_wrapper() {
                            var b      = 0,
                                len    = 0,
                                xlen   = 0,
                                list   = attrib,
                                lev    = level[x],
                                atty   = "",
                                string = "",
                                indy   = "",
                                name   = "",
                                text   = [],
                                tname  = tagName(token[x]);
                            if (lev === -20) {
                                b = x;
                                do {
                                    b    = b - 1;
                                    lev  = level[b];
                                    xlen = xlen + token[b].length;
                                } while (lev === -20 && b > -1);
                                if (lev === -20) {
                                    lev = 1;
                                }
                            }
                            if (lev === 0) {
                                lev = lev + options.inlevel;
                            }
                            if (list.length > 0) {
                                if (options.force_attribute === true) {
                                    len = list.length;
                                    text.push(list[0]);
                                    if (len > 1) {
                                        b = 1;
                                        do {
                                            nl(lev + 1, text);
                                            text.push(list[b]);
                                            b = b + 1;
                                        } while (b < len);
                                        b = 0;
                                    }
                                    atty = text.join("");
                                    text = [];
                                } else {
                                    atty = list.join(" ");
                                }
                                if ((types[x] === "template_start" || types[x] === "template" || types[x] === "template_else") && options.jsx === false) {
                                    len = list.length;
                                    for (b = 0; b < len; b = b + 1) {
                                        xlen = list[b].indexOf("{");
                                        if (list[b].indexOf("}") > xlen && xlen > 0) {
                                            options.source  = list[b].slice(xlen, list[b].indexOf("}") + 1);
                                            options.inlevel = lev;
                                            list[b]         = list[b].slice(0, xlen) + extlib("script").replace(/^(\s+)/, "") +
                                                    list[b].slice(list[b].indexOf("}") + 1);
                                        }
                                    }
                                }
                                indy   = (function markuppretty__beautify_apply_wrapper_indy() {
                                    var atline = lf,
                                        atnum  = lev + 1;
                                    do {
                                        atline = atline + ind;
                                        atnum  = atnum - 1;
                                    } while (atnum > 0);
                                    return atline;
                                }());
                                string = tagName(token[x]);
                                len    = string.length + 3 + atty.length;
                                if (token[x].charAt(token[x].length - 2) === "/") {
                                    len = len + 1;
                                }
                                if (wrap === 0 || len <= wrap || tname === "cfset" || tname === "cfreturn" || tname === "cfif" || tname === "cfelseif") {
                                    if (presv[x] === true) {
                                        token[x] = token[x].replace(" ", " " + atty);
                                    } else {
                                        string = ((/(\/>)$/).test(token[x]) === true)
                                            ? "/>"
                                            : ">";
                                        xlen   = (string === "/>")
                                            ? 3
                                            : 2;
                                        name   = token[x].slice(1, token[x].length - xlen);
                                        if (options.force_attribute === true) {
                                            token[x] = "<" + name + indy + atty + string;
                                        } else {
                                            token[x] = "<" + name + " " + atty + string;
                                        }
                                    }
                                    if (types[x] === "singleton" || types[x] === "template") {
                                        if (options.spaceclose === true) {
                                            token[x] = token[x].replace(/(\u0020*\/>)$/, " />");
                                        } else {
                                            token[x] = token[x].replace(/(\u0020*\/>)$/, "/>");
                                        }
                                    }
                                    return;
                                }
                                text.push(token[x].slice(0, token[x].indexOf(" ")));
                                len = list.length;
                                for (b = 0; b < len; b = b + 1) {
                                    nl(lev + 1, text);
                                    text.push(list[b]);
                                }
                                text.push(token[x].slice(token[x].indexOf(" ") + 1));
                                token[x] = text.join("");
                                if (types[x] === "singleton" || types[x] === "template") {
                                    if ((/(>\}+\/>)$/).test(token[x]) === true) {
                                        b    = 0;
                                        atty = lf;
                                        if (lev > 1) {
                                            do {
                                                atty = atty + ind;
                                                b    = b + 1;
                                            } while (b < lev);
                                            atty = atty + ind + "}" + atty + "/>";
                                        } else {
                                            atty = atty + "}/>";
                                        }
                                        token[x] = token[x].replace(/(\u0020*\}\u0020*\/>)$/, atty);
                                    } else if (options.spaceclose === true) {
                                        token[x] = token[x].replace(/(\u0020*\/>)$/, " />");
                                    } else {
                                        token[x] = token[x].replace(/(\u0020*\/>)$/, "/>");
                                    }
                                }
                            } else {
                                list = token[x]
                                    .replace(/\s+/g, " ")
                                    .split(" ");
                                len  = list.length;
                                if (level[x] === -20 && types[x - 1] === "end") {
                                    b   = x - 1;
                                    lev = 1;
                                    do {
                                        b = b - 1;
                                        if (types[b] === "start") {
                                            lev = lev - 1;
                                        } else if (types[b] === "end") {
                                            lev = lev + 1;
                                        }
                                    } while (lev > 0 && b > 0);
                                    lev = level[b];
                                }
                                for (b = 0; b < len; b = b + 1) {
                                    string = string + list[b];
                                    if (list[b + 1] !== undefined && string.length + list[b + 1].length + 1 > wrap - xlen) {
                                        text.push(string);
                                        xlen = 0;
                                        if (level[x] === -20 && types[x - 1] !== "end") {
                                            nl(lev + 1, text);
                                        } else {
                                            nl(lev, text);
                                        }
                                        string = "";
                                    } else {
                                        string = string + " ";
                                    }
                                }
                                text.push(string.replace(/\s$/, ""));
                                token[x] = text.join("");
                                if (types[x] === "singleton") {
                                    if (options.spaceclose === true) {
                                        token[x] = token[x].replace(/(\u0020*\/>)$/, " />");
                                    } else {
                                        token[x] = token[x].replace(/(\u0020*\/>)$/, "/>");
                                    }
                                }
                            }
                        },
                        // JSX tags may contain comments, which are captured as attributes in this
                        // parser.  These attributes demand unique care to be correctly applied.
                        attrcom      = function markuppretty__beautify_apply_attrcom() {
                            var toke  = token[x].split(" "),
                                attr  = attrib,
                                len   = attr.length,
                                ilen  = 0,
                                item  = [toke[0]],
                                temp  = [],
                                tempx = [],
                                index = 0,
                                b     = 0,
                                xx    = 0,
                                yy    = 0;
                            nl(level[x], build);
                            for (b = 0; b < len; b = b + 1) {
                                index = attr[b].indexOf("\n");
                                if (index > 0 && index !== attr[b].length - 1 && attr[b].indexOf("/*") === 0) {
                                    temp = (lf === "\r\n")
                                        ? attr[b].split("\r\n")
                                        : attr[b].split("\n");
                                    yy   = temp.length;
                                    for (xx = 0; xx < yy; xx = xx + 1) {
                                        if (temp[xx] === "") {
                                            temp[xx] = lf;
                                        } else {
                                            nl(level[x] + 1, tempx);
                                            tempx.push(temp[xx].replace(/^(\s+)/, ""));
                                        }
                                    }
                                    tempx.push(lf);
                                    attr[b] = tempx.join("");
                                }
                                if (b > 0 && attr[b - 1].charAt(attr[b - 1].length - 1) === "\n" && (/^(\s*\/\/)/).test(attr[b]) === false) {
                                    nl(level[x] + 1, item);
                                    ilen       = item.length - 1;
                                    item[ilen] = item[ilen].slice(1);
                                } else if ((/^\s/).test(attr[b]) === false && (/^(\s*\/\/)/).test(attr[b - 1]) === false) {
                                    item.push(" ");
                                }
                                item.push(attr[b]);
                            }
                            if (attr[len - 1].charAt(attr[len - 1].length - 1) === "\n") {
                                nl(level[x], item);
                                ilen       = item.length - 1;
                                item[ilen] = item[ilen].slice(1);
                            }
                            item.push(toke[1]);
                            build.push(item.join(""));
                        },
                        jsxattribute = function markuppretty__beautify_apply_jsxattribute() {
                            var attr     = Object.keys(attrs[x]),
                                b        = 0,
                                yy       = 0,
                                xx       = attr.length,
                                inlevel  = (level[x] < 1)
                                    ? options.inlevel + 1
                                    : level[x] + 1,
                                builder  = "",
                                inle     = options.inlevel,
                                mode     = options.mode,
                                vertical = options.vertical;
                            for (b = 0; b < xx; b = b + 1) {
                                if (attrs[x][attr[b]].charAt(0) === "{") {
                                    options.mode      = "beautify";
                                    options.inlevel   = inlevel;
                                    options.source    = attrs[x][attr[b]].slice(1, attrs[x][attr[b]].length - 1);
                                    options.vertical  = (
                                        options.vertical === "jsonly" || options.vertical === true || options.vertical === "true"
                                    );
                                    attrs[x][attr[b]] = extlib("script");
                                    options.mode      = mode;
                                    options.inlevel   = inle;
                                    options.vertical  = vertical;
                                    attrib[b]         = attr[b] + "={" + attrs[x][attr[b]].replace(/^\s+/, "") + "}";
                                } else if (attr[b].charAt(0) === "/" && attr[b].charAt(1) === "/" && attr[b].charAt(attr[b].length - 1) === "\n") {
                                    builder = "";
                                    yy      = inlevel;
                                    do {
                                        builder = builder + ind;
                                        yy      = yy - 1;
                                    } while (yy > 0);
                                    if (b < attrib.length - 1) {
                                        builder = lf + builder + attr[b].slice(0, attr[b].length - 1) + lf +
                                                builder;
                                    } else {
                                        builder = lf + builder + attr[b].slice(0, attr[b].length - 1) + lf;
                                    }
                                    attrib[b] = builder;
                                }
                            }
                        },
                        linepreserve = function markuppretty__beautify_apply_linepreserve() {
                            var str  = token[x]
                                    .replace(/\r\n/g, "\n")
                                    .replace(/^(\n)/, ""),
                                item = str.split("\n"),
                                aa   = 0,
                                bb   = item.length,
                                out  = [],
                                taby = new RegExp("^(" + ind + "+)");
                            lines[x] = 1;
                            for (aa = 0; aa < bb; aa = aa + 1) {
                                item[aa] = item[aa]
                                    .replace(/^(\s+)/, "")
                                    .replace(taby, "");
                                if (item[aa] === "" && item[aa - 1] !== "" && aa < bb - 1) {
                                    nl(0, out);
                                } else if (item[aa] !== "") {
                                    if (aa > 0) {
                                        nl(level[x], out);
                                    }
                                    if (item[aa].indexOf(ind) === 0) {
                                        do {
                                            item[aa] = item[aa].slice(ind.length);
                                        } while (item[aa].indexOf(ind) === 0);
                                    }
                                    out.push(item[aa].replace(/(\s+)$/, ""));
                                }
                            }
                            if (out[out.length - 1] === "") {
                                out.pop();
                            }
                            if (types[x + 1] === "template_end" && out[out.length - 1].indexOf(ind) > 0 && (/^(\s+)$/).test(out[out.length - 1]) === false) {
                                out.pop();
                            }
                            token[x] = out.join("");
                        },
                        attArray     = function markuppretty__beautify_apply_attArray() {
                            var list = Object.keys(attrs[x]),
                                len  = list.length,
                                b    = 0,
                                attr = [];
                            if (len < 1) {
                                return [];
                            }
                            do {
                                if (attrs[x][list[b]] === "") {
                                    attr.push(list[b]);
                                } else {
                                    attr.push(list[b] + "=" + attrs[x][list[b]]);
                                }
                                b = b + 1;
                            } while (b < len);
                            return attr;
                        };
                    for (x = 0; x < y; x = x + 1) {
                        attrib = attArray();
                        if (options.jsx === true && attrib.length > 0) {
                            jsxattribute();
                        }
                        if (jscom[x] === true) {
                            attrcom();
                        } else if (types[x] === "content" && x < y - 1) {
                            if (presv[x] === true) {
                                linepreserve();
                            } else if (wrap > 0 && token[x].length > wrap && (options.mode === "beautify" || options.mode === "diff")) {
                                wrapper();
                            }
                        } else if (types[x] !== "content" && options.unformatted === false && (options.mode === "beautify" || options.mode === "diff") && presv[x] === false && (attrib.length > 0 || (wrap > 0 && token[x].length > wrap)) && (types[x] === "content" || types[x] === "start" || types[x] === "singleton" || types[x] === "template_start" || types[x] === "template" || types[x] === "comment") && (types[x] !== "singleton" || token[x].charAt(0) !== "{")) {
                            wrapper();
                        } else if (options.unformatted === false && attrib.length > 0) {
                            token[x] = token[x].replace(" ", " " + attrib.join(" "));
                        } else if (types[x] === "singleton") {
                            if (options.spaceclose === true) {
                                token[x] = token[x].replace(/(\u0020*\/>)$/, " />");
                            } else {
                                token[x] = token[x].replace(/(\u0020*\/>)$/, "/>");
                            }
                        }
                        if (token[x] === "</prettydiffli>" && options.correct === true) {
                            token[x] = "</li>";
                        }
                        if (token[x] !== "</prettydiffli>" && jscom[x] === false) {
                            if ((types[x] === "template" || types[x] === "template_start") && types[x - 1] === "content" && presv[x - 1] === true && options.mode === "beautify" && level[x] === -20) {
                                build.push(" ");
                            }
                            if (level[x] > -9) {
                                if (options.mode === "minify") {
                                    build.push(" ");
                                } else {
                                    nl(level[x], build);
                                }
                            } else if (level[x] === -10) {
                                build.push(" ");
                            }
                            build.push(token[x]);
                        }
                    }
                    if (build[0] === lf || build[0] === " ") {
                        build[0] = "";
                    }
                    if (options.newline === true) {
                        if (options.crlf === true) {
                            build.push("\r\n");
                        } else {
                            build.push("\n");
                        }
                    }
                    if (options.nodeasync === true) {
                        return [build.join(""), globalerror];
                    }
                    return build.join("");
                };

            if (options.mode !== "minify") {
                for (a = 0; a < c; a = a + 1) {
                    if (twigStart.test(token[a]) === true && twigEnd.test(token[a]) === true && (a === 0 || (tagName(token[a - 1]) !== "script" && tagName(token[a - 1]) !== "style")) && (/\D-+\D/).test(token[a]) === false && (/^(\{%\s*((comment)|(else))\s*)/).test(token[a]) === false) {
                        script(true);
                    }
                    if (types[a] === "start") {
                        level.push(indent);
                        indent = indent + 1;
                        xslline();
                    } else if (types[a] === "template_start" || types[a] === "linepreserve") {
                        if (types[a] === "linepreserve") {
                            lprescount.push(tagName(token[a]));
                        }
                        level.push(indent);
                        indent = indent + 1;
                    } else if (types[a] === "template_else") {
                        level.push(indent - 1);
                    } else if (types[a] === "end") {
                        end();
                    } else if (types[a] === "template_end") {
                        if (lprescount.length > 0 && tagName(token[a]) === "/" + lprescount[lprescount.length - 1]) {
                            lprescount.pop();
                        }
                        end();
                    } else if (lines[a] === 0 && (types[a] === "singleton" || types[a] === "content" || types[a] === "template")) {
                        if (types[a] === "content" && options.textpreserve === true) {
                            level.push(-20);
                        } else {
                            content();
                        }
                        xslline();
                    } else if (types[a] === "script" || types[a] === "cfscript") {
                        script(false);
                    } else if (types[a] === "style") {
                        style();
                    } else if (types[a] === "comment" && options.comments === "noindent") {
                        level.push(0);
                    } else if (types[a] === "linepreserve") {
                        level.push(indent);
                    } else {
                        level.push(indent);
                        xslline();
                    }
                    if (types[a] !== "content" && types[a] !== "comment" && types[a - 1] === "content" && types[a - 2] !== "linepreserve" && lprescount.length > 0) {
                        level[a] = -20;
                    }
                    if (lines[a] === 0 && (ltype === "content" || (ltype === "script" && token[a - 1].charAt(0) === "{" && options.jsx === true))) {
                        level[a] = -20;
                    }
                    ltype = types[a];
                    lline = lines[a];
                }
            }
            level[0] = 0;
            return apply();
        }());

        if (options.mode === "analysis") {
            options.accessibility = true;
            return (function markuppretty__beautify_apply_summary() {
                var len           = token.length,
                    sum           = [],
                    data          = {
                        violations: 0
                    },
                    numformat     = function markuppretty__beautify_apply_summary_numformat(x) {
                        var y    = String(x).split(""),
                            z    = 0,
                            xlen = y.length,
                            dif  = 0;
                        if (xlen % 3 === 2) {
                            dif = 2;
                        } else if (xlen % 3 === 1) {
                            dif = 1;
                        }
                        for (z = xlen - 1; z > 0; z = z - 1) {
                            if ((z % 3) - dif === 0) {
                                y[z] = "," + y[z];
                            }
                        }
                        return y.join("");
                    },
                    analysis      = function markuppretty__beautify_apply_summary_analysis(arr) {
                        var x       = arr.length,
                            idtest  = (arr === ids),
                            y       = 0,
                            adata   = [],
                            content = [];
                        if (x > 0) {
                            arr = safeSort(arr);
                            for (y = 0; y < x; y = y + 1) {
                                if (arr[y] === arr[y + 1]) {
                                    if (idtest === true && (adata.length === 0 || adata[adata.length - 1][1] !== arr[y])) {
                                        adata.push([
                                            2, arr[y]
                                        ]);
                                    }
                                    if (adata.length > 0) {
                                        adata[adata.length - 1][0] = adata[adata.length - 1][0] + 1;
                                    }
                                } else if (idtest === false) {
                                    adata.push([
                                        1, arr[y]
                                    ]);
                                }
                            }
                            x = adata.length;
                            if (idtest === true) {
                                if (x === 0) {
                                    return "";
                                }
                                content.push("<h4>Duplicate id attribute values</h4>");
                            } else {
                                content.push("<h4>HTTP requests:</h4>");
                            }
                            content.push("<ul>");
                            for (y = 0; y < x; y = y + 1) {
                                if (idtest === true && adata[y][0] > 1) {
                                    data.violations = data.violations + (adata[y][0] - 1);
                                }
                                content.push("<li>");
                                content.push(adata[y][0]);
                                content.push("x - ");
                                content.push(adata[y][1].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(
                                    />/g,
                                    "&gt;"
                                ));
                                content.push("</li>");
                            }
                            content.push("</ul>");
                            return content.join("");
                        }
                        return "";
                    },
                    accessibility = (
                        function markuppretty__beautify_apply_summary_accessibility() {
                            var findings   = [],
                                tagsbyname = function markuppretty__beautify_apply_summary_accessibility_tagsbyname() {
                                    var b            = 0,
                                        c            = 0,
                                        x            = 0,
                                        y            = 0,
                                        z            = 0,
                                        tagname      = "",
                                        tabindex     = "",
                                        alttest      = false,
                                        id           = false,
                                        fortest      = false,
                                        hidden       = false,
                                        html         = false,
                                        headtest     = (/^(h\d)$/),
                                        obsoleteAttr = [
                                            "alink",
                                            "align",
                                            "background",
                                            "border",
                                            "color",
                                            "compact",
                                            "face",
                                            "height",
                                            "language",
                                            "link",
                                            "nowrap",
                                            "size",
                                            "start",
                                            "text",
                                            "version",
                                            "vlink",
                                            "width"
                                        ],
                                        attr         = [],
                                        formID       = [],
                                        labelFor     = [],
                                        nofor        = [],
                                        namestack    = [];

                                    // badnest - checks for improperly orderd tags [tagname, start index, end index]
                                    data.badnest      = [];
                                    // obsoleteTags - checks for obsolete or presentation only tag names of start
                                    // and singleton tags token index
                                    data.obsoleteTags = [];
                                    // obsoleteAttr - checks for obsolete or presentation attribute names [token
                                    // index, attr index]
                                    data.obsoleteAttr = [];
                                    // headings - stores heading tag data [token index, number from tag name, if
                                    // violation]
                                    data.headings     = [];
                                    // emptyalt - if an img tag contains an alt attribute with no values token index
                                    data.emptyalt     = [];
                                    //noalt - if an img tag does not contain an alt attribute token index
                                    data.noalt        = [];
                                    //formNoId - if a form control is missing an id attribute token index
                                    data.formNoId     = [];
                                    // formNoLabel - if a form control is missing a binding to a label [token index,
                                    // id attr index]
                                    data.formNoLabel  = [];
                                    // tabindex - identifies elements with a tabindex attribute [token index, if
                                    // value is greater than 0]
                                    data.tabindex     = [];
                                    // htmllang - if there is an <html> tag does it contain a lang or xml:lang
                                    // attribute? boolean
                                    data.htmllang     = false;

                                    c                 = token.length;
                                    for (b = 0; b < c; b = b + 1) {
                                        hidden  = false;
                                        tagname = tagName(token[b]);
                                        if ((types[b] === "start" || types[b] === "singleton") && (tagname === "font" || tagname === "center" || tagname === "basefont" || tagname === "b" || tagname === "i" || tagname === "u" || tagname === "small" || tagname === "big" || tagname === "blink" || tagname === "plaintext" || tagname === "spacer" || tagname === "strike" || tagname === "tt" || tagname === "xmp")) {
                                            data
                                                .obsoleteTags
                                                .push(b);
                                        } else {
                                            if (types[b] === "start" && headtest.test(tagname) === true) {
                                                z = Number(tagname.charAt(1));
                                                if (data.headings.length > 0 && z - data.headings[data.headings.length - 1][1] > 1) {
                                                    data.violations = data.violations + 1;
                                                    data
                                                        .headings
                                                        .push([b, z, true]);
                                                } else {
                                                    data
                                                        .headings
                                                        .push([b, z, false]);
                                                }
                                            }
                                            if (attrs[b].alt !== undefined && tagname === "img") {
                                                alttest = true;
                                                if (attrs[b].alt === "") {
                                                    data
                                                        .emptyalt
                                                        .push(b);
                                                }
                                            }
                                            if (attrs[b].for !== undefined && tagname === "label") {
                                                labelFor.push(attrs[b].for);
                                                fortest = true;
                                            }
                                            if (tagname === "select" || tagname === "input" || tagname === "textarea") {
                                                if (typeof attrs[b].id === "string" || (tagname === "input" && typeof attrs[b].type === "string" && (attrs[b].type.toLowerCase() === "hidden" || attrs[b].type.toLowerCase() === "submit"))) {
                                                    id = true;
                                                    if (tagname === "input" && attrs[b].type === "hidden") {
                                                        hidden = true;
                                                    }
                                                    if (typeof attrs[b].id === "string") {
                                                        formID.push(b);
                                                    }
                                                } else {
                                                    z = namestack.length;
                                                    if (z > 0) {
                                                        do {
                                                            z = z - 1;
                                                        } while (z > 0 && namestack[z][0] === "span");
                                                        if (namestack[z][0] === "label") {
                                                            hidden = true;
                                                        }
                                                    }
                                                }
                                            } else if (tagname === "html") {
                                                html = true;
                                                if (typeof attrs[b].lang === "string" || typeof attrs[b]["xml:lang"] === "string") {
                                                    data.htmllang = true;
                                                }
                                            }
                                            if (data.obsoleteTags[data.obsoleteTags.length - 1] !== b) {
                                                if (typeof attrs[b].name === "string" && tagname !== "meta" && tagname !== "iframe" && tagname !== "select" && tagname !== "input" && tagname !== "textarea") {
                                                    data
                                                        .obsoleteAttr
                                                        .push([b, "name"]);
                                                }
                                                if (typeof attrs[b].type === "string" && tagname !== "script" && tagname !== "style" && tagname !== "input" && tagname !== "button" && tagname !== "link") {
                                                    data
                                                        .obsoleteAttr
                                                        .push([b, "type"]);
                                                }
                                                if (typeof attrs[b].value === "string" && tagname !== "input" && tagname !== "option" && tagname !== "textarea" && tagname !== "button") {
                                                    data
                                                        .obsoleteAttr
                                                        .push([b, "value"]);
                                                }
                                                z = obsoleteAttr.length;
                                                for (y = 0; y < z; y = y + 1) {
                                                    if (typeof attrs[b][obsoleteAttr[y]] === "string") {
                                                        data
                                                            .obsoleteAttr
                                                            .push([
                                                                b, obsoleteAttr[y]
                                                            ]);
                                                    }
                                                }
                                            }
                                            if (typeof attrs[b].tabindex === "string") {
                                                tabindex = attrs[b]
                                                    .tabindex
                                                    .slice(1, attrs[b].tabindex.length - 1);
                                                if (isNaN(tabindex) === true || Number(tabindex) > 0) {
                                                    data
                                                        .tabindex
                                                        .push([b, true]);
                                                    data.violations = data.violations + 1;
                                                } else {
                                                    data
                                                        .tabindex
                                                        .push([b, false]);
                                                }
                                            }
                                            if (fortest === true) {
                                                fortest = false;
                                            } else if (tagname === "label") {
                                                nofor.push(b);
                                            }
                                            if (id === true) {
                                                id = false;
                                            } else if (hidden === false && (tagname === "select" || tagname === "input" || tagname === "textarea")) {
                                                data
                                                    .formNoId
                                                    .push(b);
                                            }
                                            if (alttest === true) {
                                                alttest = false;
                                            } else if (tagname === "img") {
                                                data
                                                    .noalt
                                                    .push(b);
                                            }
                                        }
                                        if (types[b] === "start" || types[b] === "template_start") {
                                            namestack.push([tagname, b]);
                                        } else if (types[b] === "end" || types[b] === "template_end") {
                                            if (namestack.length > 0 && tagname !== "/" + namestack[namestack.length - 1][0]) {
                                                namestack[namestack.length - 1].push(b);
                                                data
                                                    .badnest
                                                    .push(namestack[namestack.length - 1]);
                                            }
                                            namestack.pop();
                                        }
                                    }
                                    attr = [];
                                    if (html === false) {
                                        data.htmllang = true;
                                    }
                                    attr.push("<div id='a11y'>");
                                    //missing lang attribute
                                    if (data.htmllang === false) {
                                        data.violations = data.violations + 1;
                                        attr.push(
                                            "<div><h4>HTML tag is a <strong>missing</strong> lang or xml:lang attribute</h4>"
                                        );
                                        attr.push(
                                            "<p>The lang attribute ensures the natural language is properly understood by a" +
                                            "ssisting applications.</p></div>"
                                        );
                                    } else {
                                        attr.push("<div><h4>HTML lang or xml:lang attribute is present</h4></div>");
                                    }
                                    //improperly nested tags
                                    b               = data.badnest.length;
                                    data.violations = data.violations + b;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        attr.push(b);
                                        attr.push("</strong> improperly nested tag");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            "</h4> <p>Improperly nested tags produce unexpected behaviors.</p> <ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            attr.push(
                                                token[data.badnest[x][2]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.badnest[x][2]]);
                                            attr.push(" does not match start tag <code>");
                                            attr.push(
                                                token[data.badnest[x][1]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            attr.push("</code> from input line number ");
                                            attr.push(linen[data.badnest[x][1]]);
                                            attr.push("</li>");
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push("<div><h4><strong>0</strong> improperly nested tags</h4>");
                                        attr.push("<p>Improperly nested tags produce unexpected behaviors.</p></div>");
                                    }
                                    //obsolete tags
                                    b               = data.obsoleteTags.length;
                                    data.violations = data.violations + b;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        attr.push(b);
                                        attr.push("</strong> obsolete HTML tag");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            "</h4> <p>Obsolete elements do not appropriately describe content.</p> <ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            attr.push(
                                                token[data.obsoleteTags[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.obsoleteTags[x]]);
                                            attr.push("</li>");
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push("<div><h4><strong>0</strong> obsolete HTML tags</h4>");
                                        attr.push("<p>Obsolete elements do not appropriately describe content.</p></div>");
                                    }
                                    //obsolete attributes
                                    b = data.obsoleteAttr.length;
                                    if (b > 0) {
                                        z = 0;
                                        attr.push("<div><h4><strong>");
                                        y = attr.length;
                                        attr.push("</strong> HTML tag");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            " containing obsolete or inappropriate attributes</h4> <p>Obsolete attributes d" +
                                            "o not appropriately describe content.</p> <ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            tagname = token[data.obsoleteAttr[x][0]]
                                                .replace(/&/g, "&amp;")
                                                .replace(/</g, "&lt;")
                                                .replace(/>/g, "&gt;")
                                                .replace(
                                                    attrs[data.obsoleteAttr[x][0]][data.obsoleteAttr[x][1]],
                                                    "<strong>" + attrs[data.obsoleteAttr[x][0]][data.obsoleteAttr[x][1]] + "</stron" +
                                                            "g>"
                                                );
                                            if (x < b - 1 && data.obsoleteAttr[x][0] === data.obsoleteAttr[x + 1][0]) {
                                                do {
                                                    tagname = tagname.replace(
                                                        attrs[data.obsoleteAttr[x][0]][data.obsoleteAttr[x + 1][1]],
                                                        "<strong>" + attrs[data.obsoleteAttr[x][0]][data.obsoleteAttr[x + 1][1]] + "</s" +
                                                                "trong>"
                                                    );
                                                    x       = x + 1;
                                                } while (x < b - 1 && data.obsoleteAttr[x][0] === data.obsoleteAttr[x + 1][0]);
                                            }
                                            z = z + 1;
                                            attr.push("<li><code>");
                                            attr.push(tagname);
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.obsoleteAttr[x][0]]);
                                            attr.push("</li>");
                                        }
                                        attr.splice(y, 0, z);
                                        data.violations = data.violations + z;
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push(
                                            "<div><h4><strong>0</strong> HTML tags containing obsolete or inappropriate attribut" +
                                            "es</h4>"
                                        );
                                        attr.push("<p>Obsolete attributes do not appropriately describe content.</p></div>");
                                    }
                                    //form controls missing a required 'id' attribute
                                    b               = data.formNoId.length;
                                    data.violations = data.violations + b;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        attr.push(b);
                                        attr.push("</strong> form control element");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            " missing a required <em>id</em> attribute</h4> <p>The id attribute is required" +
                                            " to bind a point of interaction to an HTML label.</p> <ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            attr.push(
                                                token[data.formNoId[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.formNoId[x]]);
                                            attr.push("</li>");
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push(
                                            "<div><h4><strong>0</strong> form control elements missing a required <em>id</em> at" +
                                            "tribute</h4> <p>The id attribute is required to bind a point of interaction to" +
                                            " an HTML label.</p></div>"
                                        );
                                    }
                                    //form controls missing a binding to a label
                                    b                = formID.length;
                                    data.formNoLabel = [];
                                    for (x = 0; x < b; x = x + 1) {
                                        for (y = labelFor.length - 1; y > -1; y = y - 1) {
                                            if (attrs[formID[x]].id === labelFor[y]) {
                                                break;
                                            }
                                        }
                                        if (y < 0) {
                                            data
                                                .formNoLabel
                                                .push(formID[x]);
                                        }
                                    }
                                    b               = data.formNoLabel.length;
                                    data.violations = data.violations + b;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        attr.push(b);
                                        attr.push("</strong> form control element");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            " not bound to a label</h4> <p>The <em>id</em> of a form control must match the" +
                                            " <em>for</em> of a label.</p><ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            attr.push(
                                                token[data.formNoLabel[x][0]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.formNoLabel[x][0]]);
                                            attr.push("</li>");
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push(
                                            "<div><h4><strong>0</strong> form control elements not bound to a label</h4> <p>The " +
                                            "<em>id</em> of a form control must match the <em>for</em> of a label.</p></div>"
                                        );
                                    }
                                    //elements with tabindex
                                    b = data.tabindex.length;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        y = attr.length;
                                        z = 0;
                                        attr.push(0);
                                        attr.push("</strong> <em>tabindex</em>");
                                        attr.push(" violation");
                                        attr.push(
                                            "</h4> <p>The tabindex attribute should have a 0 or -1 value and should not be " +
                                            "over used. Only tabindexes with a value greater than 0 are counted as violatio" +
                                            "ns, but every element with a tabindex attribute is listed to quickly indicate " +
                                            "if it used excessively.</p> <ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            if (data.tabindex[x][1] === true) {
                                                attr.push("<strong>");
                                                z = z + 1;
                                            }
                                            attr.push(
                                                token[data.tabindex[x][0]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            if (data.tabindex[x][1] === true) {
                                                attr.push("</strong>");
                                            }
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.tabindex[x][0]]);
                                            attr.push("</li>");
                                        }
                                        attr[y] = z;
                                        if (z !== 1) {
                                            attr[y + 2] = attr[y + 2] + "s";
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push(
                                            "<div><h4><strong>0</strong> elements with a <em>tabindex</em> attribute</h4> <p>The" +
                                            " tabindex attribute should have a 0 or -1 value and should not be over used.</" +
                                            "p></div>"
                                        );
                                    }
                                    //headings
                                    b = data.headings.length;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        attr.push(b);
                                        attr.push("</strong> HTML heading tag");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            " and their order</h4> <p>Poorly ordered tags are described with a <strong>stro" +
                                            "ng</strong> tag (color red).</p> <ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            if (data.headings[x][2] === true) {
                                                attr.push("<strong>");
                                            }
                                            attr.push(
                                                token[data.headings[x][0]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            if (data.headings[x][2] === true) {
                                                attr.push("</strong>");
                                            }
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.headings[x][0]]);
                                            attr.push("</li>");
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push("<div><h4><strong>0</strong> HTML heading elements</h4>");
                                        attr.push(
                                            "<p>When heading tags are present it is important they are properly ordered so " +
                                            "that the content they describe can be navigated in the proper order.</p></div>"
                                        );
                                    }
                                    //missing alt attributes on images
                                    b               = data.noalt.length;
                                    data.violations = data.violations + b;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        attr.push(b);
                                        attr.push("</strong> image");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            " missing a required <em>alt</em> attribute</h4> <p>The alt attribute is requir" +
                                            "ed even if it contains no value.</p> <ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            attr.push(
                                                token[data.noalt[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.noalt[x]]);
                                            attr.push("</li>");
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push(
                                            "<div><h4><strong>0</strong> images missing a required <em>alt</em> attribute</h4> <" +
                                            "p>The alt attribute is required even if it contains no value.</p></div>"
                                        );
                                    }
                                    //alt attributes with empty values
                                    b               = data.emptyalt.length;
                                    data.violations = data.violations + b;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        attr.push(b);
                                        attr.push("</strong> image");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            " have an empty <em>alt</em> attribute value</h4> <p>Empty alt text is not nece" +
                                            "ssarily a violation, such as the case of tracking pixels. If an image has embe" +
                                            "dded text this content should be supplied in the alt attribute.</p>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            attr.push(
                                                token[data.emptyalt[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.emptyalt[x]]);
                                            attr.push("</li>");
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push(
                                            "<div><h4><strong>0</strong> images have an empty <em>alt</em> attribute value</h4>"
                                        );
                                        attr.push(
                                            "<p>Empty alt text is not necessarily a violation, such as the case of tracking" +
                                            " pixels. If an image has embedded text this content should be supplied in the " +
                                            "alt attribute.</p></div>"
                                        );
                                    }
                                    attr.push("</div>");
                                    return attr.join("");
                                };
                            if (options.accessibility === false) {
                                return "";
                            }
                            findings.push(tagsbyname());
                            return findings.join("");
                        }()
                    ),
                    parseErrors   = (function markuppretty__beautify_apply_summary_parseErrors() {
                        var x     = parseError.length,
                            y     = 0,
                            fails = [];
                        data.violations = data.violations + x;
                        if (parseError.length > 1) {
                            globalerror = parseError[0].replace(options.functions.binaryCheck, "");
                        }
                        if (x === 0) {
                            return "";
                        }
                        fails.push("<h4><strong>");
                        fails.push(x);
                        fails.push("</strong> errors interpreting markup</h4> <ol>");
                        for (y = 0; y < x; y = y + 1) {
                            fails.push("<li>");
                            fails.push(
                                parseError[y].replace(options.functions.binaryCheck, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace("element: ", "element: <code>")
                            );
                            fails.push("</code></li>");
                        }
                        fails.push("</ol>");
                        return fails.join("");
                    }()),
                    sizes         = (function markuppretty__beautify_apply_summary_sizes() {
                        var table      = [],
                            outlines   = output
                                .split(lf)
                                .length,
                            outsize    = output.length,
                            linechange = (outlines / line) * 100,
                            charchange = (outsize / sourceSize) * 100;
                        table.push("<h4>Data sizes</h4>");
                        table.push(
                            "<table class='analysis' summary='Data sizes'><caption>This table shows changes" +
                            " in sizes of the data due to beautification.</caption>"
                        );
                        table.push(
                            "<thead><tr><th>Data figure</th><th>Input</th><th>Output</th><th>Percent change" +
                            "</th></tr></thead><tbody>"
                        );
                        table.push("<tr><th>Lines of code</th><td>");
                        table.push(numformat(line));
                        table.push("</td><td>");
                        table.push(numformat(outlines));
                        table.push("</td><td>");
                        table.push(linechange.toFixed(2));
                        table.push("%</td></tr>");
                        table.push("<tr><th>Character size</th><td>");
                        table.push(numformat(sourceSize));
                        table.push("</td><td>");
                        table.push(numformat(outsize));
                        table.push("</td><td>");
                        table.push(charchange.toFixed(2));
                        table.push("%</td></tr>");
                        table.push("</tbody></table>");
                        return table.join("");
                    }()),
                    statistics    = (function markuppretty__beautify_apply_summary_statistics() {
                        var stat       = [],
                            totalItems = stats.cdata[0] + stats.comment[0] + stats.content[0] + stats.end[0] +
                                    stats.ignore[0] + stats.script[0] + stats.sgml[0] + stats.singleton[0] +
                                    stats.start[0] + stats.style[0] + stats.template[0] + stats.text[0] + stats.xml[0],
                            totalSizes = stats.cdata[1] + stats.comment[1] + stats.content[1] + stats.end[1] +
                                    stats.ignore[1] + stats.script[1] + stats.sgml[1] + stats.singleton[1] +
                                    stats.start[1] + stats.style[1] + stats.template[1] + stats.text[1] + stats.xml[1],
                            rowBuilder = function markuppretty__beautify_apply_summary_statistics_rowBuilder(
                                type
                            ) {
                                var itema = (type === "Total*")
                                        ? totalItems
                                        : stats[type][0],
                                    itemb = (type === "Total*")
                                        ? totalSizes
                                        : stats[type][1],
                                    ratio = 0;
                                stat.push("<tr><th>");
                                stat.push(type);
                                if (itema > 0 && (type === "script" || type === "style")) {
                                    stat.push("**");
                                }
                                stat.push("</th><td");
                                if ((globalerror.indexOf(" more start tag") || globalerror.indexOf(" more end tag")) && (type === "start" || type === "end")) {
                                    stat.push(" class=\"bad\"");
                                }
                                stat.push(">");
                                stat.push(itema);
                                stat.push("</td><td>");
                                ratio = ((itema / totalItems) * 100);
                                stat.push(ratio.toFixed(2));
                                stat.push("%</td><td>");
                                stat.push(itemb);
                                stat.push("</td><td");
                                if (itema > 0 && (type === "script" || type === "style")) {
                                    stat.push(" class='bad'");
                                }
                                stat.push(">");
                                ratio = ((itemb / totalSizes) * 100);
                                stat.push(ratio.toFixed(2));
                                stat.push("%</td></tr>");
                            };
                        stat.push("<h4>Statistics and analysis of parsed code</h4>");
                        stat.push(
                            "<table class='analysis' summary='Statistics'><caption>This table provides basi" +
                            "c statistics about the parsed components of the given code sample after beauti" +
                            "fication.</caption>"
                        );
                        stat.push(
                            "<thead><tr><th>Item type</th><th>Number of instances</th><th>Percentage of tot" +
                            "al items</th><th>Character size</th><th>Percentage of total size</th></tr></th" +
                            "ead>"
                        );
                        stat.push("<tbody>");
                        rowBuilder("Total*");
                        rowBuilder("cdata");
                        rowBuilder("comment");
                        rowBuilder("content");
                        rowBuilder("end");
                        rowBuilder("ignore");
                        rowBuilder("script");
                        rowBuilder("sgml");
                        rowBuilder("singleton");
                        rowBuilder("start");
                        rowBuilder("style");
                        rowBuilder("template");
                        rowBuilder("text");
                        rowBuilder("xml");
                        stat.push("<tr><th>space between tags***</th><td colspan='4'>");
                        stat.push(stats.space);
                        stat.push("</td></tr>");
                        stat.push("</tbody></table> ");
                        stat.push(
                            "<p>* Totals are accounted for parsed code/content tokens only and not extraneo" +
                            "us space for beautification.</p> "
                        );
                        stat.push(
                            "<p>** Script and Style code is measured with minimal white space.</p>"
                        );
                        stat.push(
                            "<p>*** This is space that is not associated with text, tags, script, or css.</" +
                            "p> "
                        );
                        return stat.join("");
                    }()),
                    zipf          = (function markuppretty__beautify_apply_summary_zipf() {
                        var x          = 0,
                            ratio      = 0,
                            wordlen    = 0,
                            wordcount  = 0,
                            word       = "",
                            wordlist   = [],
                            wordtotal  = [],
                            wordproper = [],
                            zipfout    = [],
                            identical  = true,
                            sortchild  = function markuppretty__beautify_apply_summary_zipf_sortchild(y, z) {
                                return z[0] - y[0];
                            };
                        for (x = x; x < len; x = x + 1) {
                            if (types[x] === "content") {
                                wordlist.push(token[x]);
                            }
                        }
                        wordlist = safeSort(
                            wordlist.join(" ").replace(options.functions.binaryCheck, "").toLowerCase().replace(/&nbsp;/gi, " ").replace(/(,|\.|\?|!|:|\(|\)|"|\{|\}|\[|\])/g, "").replace(/\s+/g, " ").replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").split(" ")
                        );
                        wordlen  = wordlist.length;
                        for (x = 0; x < wordlen; x = x + 1) {
                            word = wordlist[x];
                            if (word.length > 2 && word.length < 30 && (/&#?\w+;/).test(word) === false && word !== "the" && word !== "and" && word !== "for" && word !== "are" && word !== "this" && word !== "from" && word !== "with" && word !== "that" && word !== "to") {
                                if (wordproper.length === 0 || word !== wordproper[wordproper.length - 1][1]) {
                                    wordproper.push([1, word]);
                                } else {
                                    wordproper[wordproper.length - 1][0] = wordproper[wordproper.length - 1][0] + 1;
                                }
                            }
                            if (word !== wordlist[x - 1]) {
                                wordtotal.push([1, word]);
                            } else {
                                wordtotal[wordtotal.length - 1][0] = wordtotal[wordtotal.length - 1][0] + 1;
                            }
                        }
                        wordtotal  = wordtotal
                            .sort(sortchild)
                            .slice(0, 11);
                        wordproper = wordproper
                            .sort(sortchild)
                            .slice(0, 11);
                        wordlen    = (wordproper.length > 10)
                            ? 11
                            : wordproper.length;
                        for (x = 0; x < wordlen; x = x + 1) {
                            if (wordtotal[x][1] !== wordproper[x][1]) {
                                identical = false;
                                break;
                            }
                        }
                        wordlen = (wordtotal.length > 10)
                            ? 10
                            : wordtotal.length;
                        if (wordlen > 1) {
                            wordcount = wordlist.length;
                            zipfout.push("<h4>Zipf's Law analysis of content</h4>");
                            zipfout.push(
                                "<table class='analysis' summary='Zipf&#39;s Law'><caption>This table demonstra" +
                                "tes <em>Zipf&#39;s Law</em> by listing the 10 most occuring words in the conte" +
                                "nt and the number of times they occurred.</caption>"
                            );
                            zipfout.push(
                                "<thead><tr><th>Word Rank</th><th>Most Occurring Word by Rank</th><th>Number of" +
                                " Instances</th><th>Ratio Increased Over Next Most Frequence Occurance</th><th>" +
                                "Percentage from "
                            );
                            zipfout.push(wordcount);
                            zipfout.push(" total words</th></tr></thead><tbody>");
                            if (identical === false) {
                                zipfout.push("<tr><th colspan='5'>Unfiltered Word Set</th></tr>");
                            }
                            for (x = 0; x < wordlen; x = x + 1) {
                                ratio = (wordtotal[x + 1] !== undefined)
                                    ? (wordtotal[x][0] / wordtotal[x + 1][0])
                                    : 1;
                                zipfout.push("<tr><td>");
                                zipfout.push(x + 1);
                                zipfout.push("</td><td>");
                                zipfout.push(wordtotal[x][1]);
                                zipfout.push("</td><td>");
                                zipfout.push(wordtotal[x][0]);
                                zipfout.push("</td><td>");
                                zipfout.push(ratio.toFixed(2));
                                zipfout.push("</td><td>");
                                ratio = ((wordtotal[x][0] / wordcount) * 100);
                                zipfout.push(ratio.toFixed(2));
                                zipfout.push("%</td></tr>");
                            }
                            wordlen = (wordproper.length > 10)
                                ? 10
                                : wordproper.length;
                            if (wordlen > 1 && identical === false) {
                                zipfout.push("<tr><th colspan='5'>Filtered Word Set</th></tr>");
                                for (x = 0; x < wordlen; x = x + 1) {
                                    ratio = (wordproper[x + 1] !== undefined)
                                        ? (wordproper[x][0] / wordproper[x + 1][0])
                                        : 1;
                                    zipfout.push("<tr><td>");
                                    zipfout.push(x + 1);
                                    zipfout.push("</td><td>");
                                    zipfout.push(wordproper[x][1]);
                                    zipfout.push("</td><td>");
                                    zipfout.push(wordproper[x][0]);
                                    zipfout.push("</td><td>");
                                    zipfout.push(ratio.toFixed(2));
                                    zipfout.push("</td><td>");
                                    ratio = ((wordproper[x][0] / wordcount) * 100);
                                    zipfout.push(ratio.toFixed(2));
                                    zipfout.push("%</td></tr>");
                                }
                            }
                            zipfout.push("</tbody></table>");
                        }
                        return zipfout.join("");
                    }());

                sum.push(
                    "<p><strong>Total number of HTTP requests (presuming HTML or XML Schema):</stro" +
                    "ng> <em>"
                );
                sum.push(reqs.length);
                sum.push("</em></p>");
                sum.push("<div class='report'>");
                sum.push(analysis(ids));
                sum.push(sizes);
                sum.push(parseErrors);
                if (options.accessibility === true) {
                    sum.push(accessibility);
                }
                sum.push(statistics);
                sum.push(analysis(reqs));
                sum.push(zipf);
                sum.push("</div>");
                if (options.accessibility === true) {
                    if (options.nodeasync === true) {
                        return [
                            sum
                                .join("")
                                .replace(
                                    "<div class='report'>",
                                    "<p><strong>Total potential accessibility violations:</strong> <em>" + data.violations +
                                            "</em></p> <div class='report'>"
                                ),
                            globalerror
                        ];
                    }
                    return sum
                        .join("")
                        .replace(
                            "<div class='report'>",
                            "<p><strong>Total potential accessibility violations:</strong> <em>" + data.violations +
                                    "</em></p> <div class='report'>"
                        );
                }
                if (options.nodeasync === true) {
                    return [sum.join(""), globalerror];
                }
                return sum.join("");
            }());
        }
        return output;
    },
    jspretty = function jspretty_(options) {
        var sourcemap    = [
                0, ""
            ],
            json         = (options.lang === "json"),
            globalerror  = "",
            // all data that is created from the tokization process is stored in the
            // following four arrays: token, types, level, and lines.  All of this data
            // passes from the tokenization process to be analyzed by the algorithm
            token        = [], //stores parsed tokens
            types        = [], //parallel array that describes the tokens
            level        = [], //parallel array that list indentation per token
            lines        = [], //used to preserve empty lines
            depth        = [], //describes the token's current container
            begin        = [], //index where current container starts
            globals      = [], //which variables are declared globals
            // meta used to find scope and variables for jsscope these values are assigned in parallel to the other arrays
            //* irrelevant tokens are represented with an empty string
            // * first '(' following 'function' is token index number of function's closing
            // curly brace
            //* variables are represented with the value 'v'
            //* the closing brace of a function is an array of variables
            meta         = [],
            // lists a number at the opening paren of a function that points to the token
            // index of the function's closing curly brace.  At the closing curly brace
            // index this array stores an array indicating the names of variables declared
            // in the current function for coloring by function depth in jsscope.  This
            // array is ignored if jsscope is false
            varlist      = [],
            // groups variables from a variable list into a child array as well as
            // properties of objects.  This array for adding extra space so that the "="
            // following declared variables of a variable list is vertically aligned and
            // likewise of the ":" with object properties
            markupvar = [],
            // notes a token index of a JSX markup tag assigned to JavaScript variable. This
            // is necessary for indentation apart from syntactical factors.
            error        = [],
            news         = 0,
            scolon       = 0,
            // counts uncessary use of 'new' keyword variables j, k, l, m, n, o, p, q, and w
            // are used as various counters for the reporting only.  These variables do not
            // store any tokens and are not used in the algorithm j counts line comments
            stats        = {
                comma       : 0,
                commentBlock: {
                    chars: 0,
                    token: 0
                },
                commentLine : {
                    chars: 0,
                    token: 0
                },
                container   : 0,
                number      : {
                    chars: 0,
                    token: 0
                },
                operator    : {
                    chars: 0,
                    token: 0
                },
                regex       : {
                    chars: 0,
                    token: 0
                },
                semicolon   : 0,
                server      : {
                    chars: 0,
                    token: 0
                },
                space       : {
                    newline: 0,
                    other  : 0,
                    space  : 0,
                    tab    : 0
                },
                string      : {
                    chars: 0,
                    quote: 0,
                    token: 0
                },
                word        : {
                    chars: 0,
                    token: 0
                }
            },
            result       = "",
            objsortop    = false,
            verticalop   = false,
            originalSize = options.source.length,
            lf           = (options.crlf === true || options.crlf === "true")
                ? "\r\n"
                : "\n",
            extlib       = function jspretty__extlib(ops) {
                var item = (ops === undefined)
                    ? global
                        .prettydiff
                        .markuppretty(ops)
                    : global
                        .prettydiff
                        .markuppretty(options);
                if (options.nodeasync === true) {
                    if (globalerror === "") {
                        globalerror = item[1];
                    }
                    return item[0];
                }
                return item;
            };
        (function jspretty__options() {
            var styleguide  = {},
                brace_style = {};
            if (options.mode === "beautify" || options.mode === "diff" || options.mode === "minify") {
                objsortop  = (
                    options.objsort === true || options.objsort === "true" || options.objsort === "all" || options.objsort === "js" || options.objsort === "jsonly"
                );
                verticalop = (
                    options.vertical === true || options.vertical === "true" || options.vertical === "all" || options.vertical === "js"
                );
            }
            options.source                          = (
                typeof options.source === "string" && options.source.length > 0
            )
                ? options
                    .source
                    .replace(/\r\n?/g, "\n")
                : "Error: no source code supplied to jspretty!";
            if (options.mode !== "analysis" && options.source.indexOf("Error: no") < 0) {
                options.source = options.source + " ";
            }
            options.titanium                        = (options.titanium === true || options.titanium === "true")
                ? (function jspretty__options_titanium() {
                    options.correct  = false;
                    options.titanium = true;
                    token.push("x{");
                    types.push("start");
                    lines.push(0);
                    depth.push("global");
                    begin.push(0);
                    return true;
                }())
                : false;
            styleguide.airbnb                       = function jspretty__options_styleairbnb() {
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
            styleguide.crockford                    = function jspretty__options_stylecrockford() {
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
                verticalop            = false;
            };
            styleguide.google                       = function jspretty__options_stylegoogle() {
                options.correct      = true;
                options.inchar       = " ";
                options.insize       = 4;
                options.preserve     = 1;
                options.quoteConvert = "single";
                verticalop           = false;
                options.wrap         = -1;
            };
            styleguide.grunt                        = function jspretty__options_stylegrunt() {
                options.inchar       = " ";
                options.insize       = 2;
                options.quoteConvert = "single";
                options.varword      = "each";
            };
            styleguide.jquery                       = function jspretty__options_stylejquery() {
                options.bracepadding = true;
                options.correct      = true;
                options.inchar       = "\u0009";
                options.insize       = 1;
                options.quoteConvert = "double";
                options.varword      = "each";
                options.wrap         = 80;
            };
            styleguide.jslint                       = styleguide.crockford;
            styleguide.mrdoobs                      = function jspretty__options_stylemrdoobs() {
                options.braceline    = true;
                options.bracepadding = true;
                options.correct      = true;
                options.inchar       = "\u0009";
                options.insize       = 1;
                verticalop           = false;
            };
            styleguide.mediawiki                    = function jspretty__options_stylemediawiki() {
                options.bracepadding = true;
                options.correct      = true;
                options.inchar       = "\u0009";
                options.insize       = 1;
                options.preserve     = 1;
                options.quoteConvert = "single";
                options.space        = false;
                options.wrap         = 80;
            };
            styleguide.meteor                       = function jspretty__options_stylemeteor() {
                options.correct = true;
                options.inchar  = " ";
                options.insize  = 2;
                options.wrap    = 80;
            };
            styleguide.yandex                       = function jspretty__options_styleyandex() {
                options.bracepadding = false;
                options.correct      = true;
                options.quoteConvert = "single";
                options.varword      = "each";
                verticalop           = false;
            };
            brace_style.collapse                    = function jspretty__options_collapse() {
                options.braceline    = false;
                options.bracepadding = false;
                options.braces       = false;
                options.formatObject = "indent";
                options.neverflatten = true;
            };
            brace_style["collapse-preserve-inline"] = function jspretty__options_collapseInline() {
                options.braceline    = false;
                options.bracepadding = true;
                options.braces       = false;
                options.formatObject = "inline";
                options.neverflatten = false;
            };
            brace_style.expand                      = function jspretty__options_expand() {
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
        if (options.source === "Error: no source code supplied to jspretty!") {
            return options.source;
        }

        (function jspretty__tokenize() {
            var a              = 0,
                b              = options.source.length,
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
                depthlist      = [
                    ["global", 0]
                ],
                tempstore      = [],
                pdepth         = [],
                //depth and status of templateStrings
                templateString = [],
                //identify variable declarations
                vart           = {
                    count: [],
                    index: [],
                    word : [],
                    len  : -1
                },
                //operations for start types: (, [, {
                start          = function jspretty__tokenize_startInit() {
                    return;
                },
                //peek at whats up next
                nextchar       = function jspretty__tokenize_nextchar(len, current) {
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
                asifix         = function jspretty__tokenize_asifix() {
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
                        depth.splice(len, 1);
                        begin.splice(len, 1);
                    }
                },
                //determine the definition of containment by depth
                depthPush      = function jspretty__tokenize_depthPush() {
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
                    wordy   = (depth[aa] === undefined)
                        ? ""
                        : token[begin[aa] - 1];
                    if (types[aa] === "comment" || types[aa] === "comment-inline") {
                        do {
                            aa = aa - 1;
                        } while (aa > 0 && (types[aa] === "comment" || types[aa] === "comment-inline"));
                        wordx = token[aa];
                    }
                    if ((token[last] === "{" || token[last] === "x{") && ((wordx === "else" && token[last] !== "if") || wordx === "do" || wordx === "try" || wordx === "finally" || wordx === "switch")) {
                        depth.push(wordx);
                    } else if (token[last] === "{" || token[last] === "x{") {
                        if (lengtha === 1 && options.jsx === true) {
                            depth.push("global");
                        } else if (classy[classy.length - 1] === 0 && wordx !== "return") {
                            classy.pop();
                            depth.push("class");
                        } else if (token[aa - 1] === "class") {
                            depth.push("class");
                        } else if (token[aa] === "]" && token[aa - 1] === "[") {
                            depth.push("array");
                        } else if (types[aa] === "word" && (types[aa - 1] === "word" || (token[aa - 1] === "?" && types[aa - 2] === "word")) && token[aa] !== "in" && token[aa - 1] !== "export" && token[aa - 1] !== "import") {
                            depth.push("map");
                        } else if (depth[aa] === "method" && types[aa] === "end" && types[begin[aa] - 1] === "word" && token[begin[aa] - 2] === "new") {
                            depth.push("initializer");
                        } else if (token[last] === "{" && (wordx === ")" || wordx === "x)") && (types[begin[aa] - 1] === "word" || token[begin[aa] - 1] === "]")) {
                            if (wordy === "if") {
                                depth.push("if");
                            } else if (wordy === "for") {
                                depth.push("for");
                            } else if (wordy === "while") {
                                depth.push("while");
                            } else if (wordy === "class") {
                                depth.push("class");
                            } else if (wordy === "switch" || token[begin[aa] - 1] === "switch") {
                                depth.push("switch");
                            } else if (wordy === "catch") {
                                depth.push("catch");
                            } else {
                                depth.push("function");
                            }
                        } else if (token[last] === "{" && (wordx === ";" || wordx === "x;")) {
                            //ES6 block
                            depth.push("block");
                        } else if (token[last] === "{" && token[aa] === ":" && depth[aa] === "switch") {
                            //ES6 block
                            depth.push("block");
                        } else if (token[aa - 1] === "import" || token[aa - 2] === "import" || token[aa - 1] === "export" || token[aa - 2] === "export") {
                            depth.push("object");
                        } else if (wordx === ")" && (pword[0] === "function" || pword[0] === "if" || pword[0] === "for" || pword[0] === "class" || pword[0] === "while" || pword[0] === "switch" || pword[0] === "catch")) {
                            // if preceeded by a paren the prior containment is preceeded by a keyword if
                            // (...) {
                            depth.push(pword[0]);
                        } else if (depth[aa] === "notation") {
                            //if following a TSX array type declaration
                            depth.push("function");
                        } else if ((types[aa] === "literal" || types[aa] === "word") && types[aa - 1] === "word" && token[begin[aa] - 1] !== "for") {
                            //if preceed by a word and either string or word public class {
                            depth.push("function");
                        } else if (depthlist.length > 0 && token[aa] !== ":" && depthlist[depthlist.length - 1][0] === "object" && (
                            token[begin[aa] - 2] === "{" || token[begin[aa] - 2] === ","
                        )) {
                            // if an object wrapped in some containment which is itself preceeded by a curly
                            // brace or comma var a={({b:{cat:"meow"}})};
                            depth.push("function");
                        } else if (types[pword[1] - 1] === "markup" && token[pword[1] - 3] === "function") {
                            //checking for TSX function using an angle brace name
                            depth.push("function");
                        } else if (wordx === "=>") {
                            //checking for fat arrow assignment
                            depth.push("function");
                        } else if (wordx === ")" && depth[aa] === "method" && types[begin[aa] - 1] === "word") {
                            depth.push("function");
                        } else if (types[last - 1] === "word" && token[last] === "{" && token[last - 1] !== "return" && token[last - 1] !== "in" && token[last - 1] !== "import" && token[last - 1] !== "const" && token[last - 1] !== "let" && token[last - 1] !== "") {
                            //ES6 block
                            depth.push("block");
                        } else {
                            depth.push("object");
                        }
                    } else if (token[last] === "[") {
                        if ((/\s/).test(c[a - 1]) === true && types[aa] === "word" && wordx !== "return" && options.twig === false) {
                            depth.push("notation");
                        } else {
                            depth.push("array");
                        }
                    } else if (token[last] === "(" || token[last] === "x(") {
                        if (types[aa] === "generic") {
                            depth.push("method");
                        } else if (token[aa] === "}" && depth[aa] === "function") {
                            depth.push("method");
                        } else if (wordx === "if" || wordx === "for" || wordx === "function" || wordx === "class" || wordx === "while" || wordx === "catch" || wordx === "switch" || wordx === "with") {
                            depth.push("expression");
                        } else if ((types[aa] === "word" && wordx !== "return") || (wordx === "}" && (depth[aa] === "function" || depth[aa] === "class"))) {
                            depth.push("method");
                        } else {
                            depth.push("paren");
                        }
                    } else if (ltoke === ":" && types[aa] === "word" && token[aa - 1] === "[") {
                        depth[aa]     = "attribute";
                        depth[aa - 1] = "attribute";
                        depth.push("attribute");
                        depthlist[depthlist.length - 1][0] = "attribute";
                    } else if (depthlist.length === 0) {
                        depth.push("global");
                        begin.push(0);
                        bpush = true;
                    } else {
                        depth.push(depthlist[depthlist.length - 1][0]);
                        begin.push(depthlist[depthlist.length - 1][1]);
                        bpush = true;
                    }
                    if (bpush === false) {
                        begin.push(last);
                    }
                },
                tokenpop       = function jspretty__tokenize_tokenpop() {
                    lengtha   = lengtha - 1;
                    lengthb   = lengthb - 1;
                    tempstore = [token.pop(), types.pop(), lines.pop(), depth.pop(), begin.pop()];
                },
                //reinsert the prior popped token
                temppush       = function jspretty__tokenize_temppush() {
                    token.push(tempstore[0]);
                    types.push(tempstore[1]);
                    lines.push(tempstore[2]);
                    depth.push(tempstore[3]);
                    begin.push(tempstore[4]);
                    lengtha = lengtha + 1;
                },
                //populate various parallel arrays
                tokenpush      = function jspretty__tokenize_tokenpush(comma, lin) {
                    if (comma === true) {
                        token.push(",");
                        types.push("separator");
                    } else {
                        token.push(ltoke);
                        types.push(ltype);
                    }
                    lengtha = token.length;
                    lines.push(lin);
                    depthPush();
                },
                //inserts ending curly brace
                blockinsert    = function jspretty__tokenize_blockinsert() {
                    var next = nextchar(5, false),
                        g    = lengtha - 1;
                    if (json === true) {
                        return;
                    }
                    if (depth[lengtha - 1] === "do" && next === "while" && token[lengtha - 1] === "}") {
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
                        pdepth = depthlist.pop();
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
                    if (depth[lengtha - 1] === "if" && (token[lengtha - 1] === ";" || token[lengtha - 1] === "x;") && next === "else") {
                        tokenpush(false, 0);
                        brace.pop();
                        pdepth = depthlist.pop();
                        return;
                    }
                    do {
                        tokenpush(false, 0);
                        brace.pop();
                        pdepth = depthlist.pop();
                    } while (brace[brace.length - 1] === "x{");
                },
                //remove "vart" object data
                vartpop        = function jspretty__tokenize_vartpop() {
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
                logError       = function jspretty__tokenize_logError(message, start) {
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
                    if (globalerror === "") {
                        globalerror = message + ":" + error[1];
                    }
                },
                //A tokenizer for keywords, reserved words, and variables
                word           = function jspretty__tokenize_word() {
                    var f        = wordTest,
                        g        = 1,
                        build    = [],
                        output   = "",
                        nextitem = "",
                        elsefix  = function jspretty__tokenize_word_elsefix() {
                            brace.push("x{");
                            depthlist.push(["else", lengtha]);
                            token.splice(lengtha - 3, 1);
                            types.splice(lengtha - 3, 1);
                            lines.splice(lengtha - 3, 1);
                            depth.splice(lengtha - 3, 1);
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
                            depth[a - 1]                       = "object";
                            depthlist[depthlist.length - 1][0] = "object";
                        } else {
                            token[lengtha - 1]                 = "[";
                            ltoke                              = "]";
                            depth[a - 1]                       = "array";
                            depthlist[depthlist.length - 1][0] = "array";
                        }
                        types[lengtha - 1] = "start";
                        ltype              = "end";
                        c[a + 1]           = "";
                        c[a + 2]           = "";
                        stats.container    = stats.container + 2;
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
                                stats.word.token     = stats.word.token + 1;
                                stats.word.chars     = stats.word.chars + output.length;
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
                                depth.splice(f, 1);
                                begin.splice(f, 1);
                                g = g - 1;
                                f = f - 1;
                            }
                            do {
                                build = [
                                    token[g], types[g], lines[g], depth[g], begin[g]
                                ];
                                tokenpop();
                                token.splice(g - 3, 0, build[0]);
                                types.splice(g - 3, 0, build[1]);
                                lines.splice(g - 3, 0, build[2]);
                                depth.splice(g - 3, 0, build[3]);
                                begin.splice(g - 3, 0, build[4]);
                                f = f + 1;
                            } while (f < g);
                        }
                        if (output === "from" && token[lengtha - 1] === "x;" && token[lengtha - 2] === "}") {
                            asifix();
                        }
                        if (output === "while" && token[lengtha - 1] === "x;" && token[lengtha - 2] === "}") {
                            (function jspretty__tokenize_word_whilefix() {
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
                        ltoke            = output;
                        ltype            = "word";
                        stats.word.token = stats.word.token + 1;
                        stats.word.chars = stats.word.chars + output.length;
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
                            depthlist.push([
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
                            depthlist.push([
                                "else", lengtha - 1
                            ]);
                        }
                        if (token[lengtha - 3] === "x}") {
                            if (token[lengtha - 2] === "else") {
                                if (token[lengtha - 4] === "x}" && pdepth[0] !== "if" && depth[depth.length - 2] === "else") {
                                    elsefix();
                                } else if (token[lengtha - 4] === "}" && depth[lengtha - 4] === "if" && pdepth[0] === "if" && token[pdepth[1] - 1] !== "if" && token[begin[lengtha - 3]] === "x{") {
                                    //fixes when "else" is following a block that isn't "if"
                                    elsefix();
                                }
                            } else if (token[lengtha - 2] === "x}" && depth[depth.length - 2] === "if") {
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
                objSort        = function jspretty__tokenize_objSort() {
                    var cc        = 0,
                        dd        = 0,
                        ee        = 0,
                        startlen  = token.length - 1,
                        behind    = startlen,
                        keys      = [],
                        keylen    = 0,
                        keyend    = 0,
                        front     = 0,
                        sort      = function jspretty__tokenize_objSort_sort(x, y) {
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
                        pairDepth = [],
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
                                            pairDepth.push(depth[ee]);
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
                                            pairDepth.splice(ee, 0, "object");
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
                                        pairDepth.splice(ee, 1);
                                        pairBegin.splice(ee, 1);
                                    }
                                    keylen = token.length - (cc + 1);
                                    token.splice(cc + 1, keylen);
                                    types.splice(cc + 1, keylen);
                                    lines.splice(cc + 1, keylen);
                                    depth.splice(cc + 1, keylen);
                                    begin.splice(cc + 1, keylen);
                                    token     = token.concat(pairToken);
                                    types     = types.concat(pairTypes);
                                    lines     = lines.concat(pairLines);
                                    depth     = depth.concat(pairDepth);
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
                slashes        = function jspretty__tokenize_slashes(index) {
                    var slashy = index;
                    do {
                        slashy = slashy - 1;
                    } while (c[slashy] === "\\" && slashy > 0);
                    if ((index - slashy) % 2 === 1) {
                        return true;
                    }
                    return false;
                },
                // commaComment ensures that commas immediately precede comments instead of
                // immediately follow
                commaComment   = function jspretty__tokenize_commacomment() {
                    var x = types.length;
                    if (depth[lengtha - 1] === "object" && objsortop === true) {
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
                        depthPush();
                    }
                },
                //injects a comma into the end of arrays for use with endcomma option
                endCommaArray  = function jspretty__tokenize_endCommaArray() {
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
                asi            = function jspretty__tokenize_asi(isEnd) {
                    var len   = token.length - 1,
                        aa    = 0,
                        next  = nextchar(1, false),
                        tokel = token[len],
                        typel = types[len],
                        deepl = depth[len],
                        begnl = begin[len],
                        clist = (depthlist.length === 0)
                            ? ""
                            : depthlist[depthlist.length - 1][0];
                    if (json === true || tokel === ";" || tokel === "," || next === "{" || deepl === "class" || deepl === "map" || deepl === "attribute" || clist === "initializer" || types[begnl - 1] === "generic") {
                        return;
                    }
                    if (((deepl === "global" && typel !== "end") || (typel === "end" && depth[begnl - 1] === "global")) && (next === "" || next === "}") && deepl === depth[lengtha - 2] && options.jsx === true) {
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
                            if (depth[aa - 1] === "object" || depth[aa - 1] === "switch") {
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
                    if (depth[lengtha - 1] === "expression" && (token[begin[lengtha - 1] - 1] !== "while" || (token[begin[lengtha - 1] - 1] === "while" && depth[begin[lengtha - 1] - 2] !== "do"))) {
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
                        deepl = depth[len];
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
                    depthPush();
                    if (brace[brace.length - 1] === "x{" && nextchar !== "}") {
                        blockinsert();
                    }
                },
                //convert ++ and -- into "= x +"  and "= x -" in most cases
                plusplus = function jspretty__tokenize_plusplus() {
                    var store      = [],
                        pre        = true,
                        toke       = "+",
                        tokea      = "",
                        tokeb      = "",
                        tokec      = "",
                        inc        = 0,
                        ind        = 0,
                        walk       = 0,
                        end        = function jspretty__tokenize_plusplus_endInit() {
                            return;
                        },
                        period     = function jspretty__tokenize_plusplus_periodInit() {
                            return;
                        },
                        applyStore = function jspretty__tokenize_plusplus_applyStore() {
                            var x = 0,
                                y = store[0].length;
                            do {
                                token.push(store[0][x]);
                                types.push(store[1][x]);
                                lines.push(store[2][x]);
                                depth.push(store[3][x]);
                                begin.push(store[4][x]);
                                x = x + 1;
                            } while (x < y);
                        },
                        next       = "";
                    lengtha = token.length;
                    tokea   = token[lengtha - 1];
                    tokeb   = token[lengtha - 2];
                    tokec   = token[lengtha - 3];
                    end     = function jspretty__tokenize_plusplus_end() {
                        walk = begin[walk] - 1;
                        if (types[walk] === "end") {
                            jspretty__tokenize_plusplus_end();
                        } else if (token[walk - 1] === ".") {
                            period();
                        }
                    };
                    period  = function jspretty__tokenize_plusplus_period() {
                        walk = walk - 2;
                        if (types[walk] === "end") {
                            end();
                        } else if (token[walk - 1] === ".") {
                            jspretty__tokenize_plusplus_period();
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
                        store.push(depth.slice(walk));
                        store.push(begin.slice(walk));
                        token.splice(walk, lengtha - walk);
                        types.splice(walk, lengtha - walk);
                        lines.splice(walk, lengtha - walk);
                        depth.splice(walk, lengtha - walk);
                        begin.splice(walk, lengtha - walk);
                    } else {
                        if (options.correct === false || (tokea !== "++" && tokea !== "--" && tokeb !== "++" && tokeb !== "--")) {
                            return;
                        }
                        next = nextchar(1, false);
                        if ((tokea === "++" || tokea === "--") && (c[a] === ";" || next === ";" || c[a] === "}" || next === "}" || c[a] === ")" || next === ")")) {
                            toke = depth[lengtha - 1];
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
                                if (depth[inc] === "switch" && token[inc] === ":") {
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
                        store.push(depth.slice(walk));
                        store.push(begin.slice(walk));
                    }
                    if (pre === true) {
                        token.splice(walk - 1, 1);
                        types.splice(walk - 1, 1);
                        lines.splice(walk - 1, 1);
                        depth.splice(walk - 1, 1);
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
                plusequal = function jspretty__tokenize_plusequal(op) {
                    var toke       = op.charAt(0),
                        walk       = lengtha - 1,
                        store      = [],
                        end        = function jspretty__tokenize_plusequal_endInit() {
                            return;
                        },
                        period     = function jspretty__tokenize_plusequal_periodInit() {
                            return;
                        },
                        applyStore = function jspretty__tokenize_plusplus_applyStore() {
                            var x = 0,
                                y = store[0].length;
                            do {
                                token.push(store[0][x]);
                                types.push(store[1][x]);
                                lines.push(store[2][x]);
                                depth.push(store[3][x]);
                                begin.push(store[4][x]);
                                x = x + 1;
                            } while (x < y);
                        };
                    end    = function jspretty__tokenize_plusequal_end() {
                        walk = begin[walk] - 1;
                        if (types[walk] === "end") {
                            jspretty__tokenize_plusequal_end();
                        } else if (token[walk - 1] === ".") {
                            period();
                        }
                    };
                    period = function jspretty__tokenize_plusequal_period() {
                        walk = walk - 2;
                        if (types[walk] === "end") {
                            end();
                        } else if (token[walk - 1] === ".") {
                            jspretty__tokenize_plusequal_period();
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
                    store.push(depth.slice(walk));
                    store.push(begin.slice(walk));
                    ltoke = "=";
                    ltype = "operator";
                    tokenpush(false, 0);
                    applyStore();
                    return toke;
                },
                //fixes asi location if inserted after an inserted brace
                asibrace       = function jspretty__tokenize_asibrace() {
                    var aa = token.length;
                    do {
                        aa = aa - 1;
                    } while (aa > -1 && token[aa] === "x}");
                    if (depth[aa] === "else") {
                        return tokenpush(false, 0);
                    }
                    aa = aa + 1;
                    token.splice(aa, 0, ltoke);
                    types.splice(aa, 0, ltype);
                    lines.push(0);
                    depthPush();
                },
                //convert double quotes to single or the opposite
                quoteConvert   = function jspretty__tokenize_quoteConvert(item) {
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
                commentwrap    = function jspretty__tokenize_commentwrap(comment, line) {
                    var prior        = "",
                        ptype        = "",
                        xblock       = (function jspretty__tokenize_commentLine_xblock() {
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
                        commentSplit = function jspretty__tokenize_commentLine_commentSplit() {
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
                        depth[lengtha - 1] = pdepth[0];
                        begin[lengtha - 1] = pdepth[1];
                        depth.push(pdepth[0]);
                        begin.push(pdepth[1]);
                    }
                },
                //merges strings separated by "+" if options.wrap is less than 0
                strmerge       = function jspretty__tokenize_strmerge() {
                    var aa   = 0,
                        bb   = "",
                        item = ltoke.slice(1, ltoke.length - 1);
                    tokenpop();
                    aa        = token.length - 1;
                    bb        = token[aa];
                    token[aa] = bb.slice(0, bb.length - 1) + item + bb.charAt(0);
                },
                // the generic function is a generic tokenizer start argument contains the
                // token's starting syntax offset argument is length of start minus control
                // chars end is how is to identify where the token ends
                generic        = function jspretty__tokenize_genericBuilder(starting, ending) {
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
                                build.push(jspretty__tokenize_genericBuilder("<?php", "?>"));
                                ee = ee + build[build.length - 1].length - 1;
                            } else if (c[ee] === "<" && c[ee + 1] === "%" && c[ee + 2] !== starting && starting !== "//" && starting !== "/*") {
                                a = ee;
                                build.push(jspretty__tokenize_genericBuilder("<%", "%>"));
                                ee = ee + build[build.length - 1].length - 1;
                            } else if (c[ee] === "{" && c[ee + 1] === "%" && c[ee + 2] !== starting && starting !== "//" && starting !== "/*") {
                                a = ee;
                                build.push(jspretty__tokenize_genericBuilder("{%", "%}"));
                                ee = ee + build[build.length - 1].length - 1;
                            } else if (c[ee] === "{" && c[ee + 1] === "{" && c[ee + 2] === "{" && c[ee + 3] !== starting && starting !== "//" && starting !== "/*") {
                                a = ee;
                                build.push(jspretty__tokenize_genericBuilder("{{{", "}}}"));
                                ee = ee + build[build.length - 1].length - 1;
                            } else if (c[ee] === "{" && c[ee + 1] === "{" && c[ee + 2] !== starting && starting !== "//" && starting !== "/*") {
                                a = ee;
                                build.push(jspretty__tokenize_genericBuilder("{{", "}}"));
                                ee = ee + build[build.length - 1].length - 1;
                            } else if (c[ee] === "<" && c[ee + 1] === "!" && c[ee + 2] === "-" && c[ee + 3] === "-" && c[ee + 4] === "#" && c[ee + 5] !== starting && starting !== "//" && starting !== "/*") {
                                a = ee;
                                build.push(jspretty__tokenize_genericBuilder("<!--#", "-->"));
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
                        stats.space.newline = stats.space.newline + 1;
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
                    if (options.jsscope !== "none") {
                        output = output
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;");
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
                regex          = function jspretty__tokenize_regex() {
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
                    if (options.jsscope !== "none") {
                        output = output
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;");
                    }
                    return output;
                },
                //a unique tokenizer for operator characters
                operator       = function jspretty__tokenize_operator() {
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
                            ltoke             = regex();
                            ltype             = "regex";
                            stats.regex.token = stats.regex.token + 1;
                            stats.regex.chars = stats.regex.chars + ltoke.length;
                        } else {
                            stats.operator.token = stats.operator.token + 1;
                            stats.operator.chars = stats.operator.token + 1;
                            ltoke                = "/";
                            ltype                = "operator";
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
                    if (options.jsscope !== "none") {
                        output = output
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;");
                    }
                    if (output === "=>" && ltoke === ")") {
                        g  = token.length - 1;
                        jj = begin[g];
                        do {
                            if (begin[g] === jj) {
                                depth[g] = "method";
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
                tempstring     = function jspretty__tokenize_tempstring() {
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
                numb           = function jspretty__tokenize_number() {
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
                },
                // Not a tokenizer.  This counts white space characters and determines if there
                // are empty lines to be preserved
                space          = function jspretty__tokenize_space() {
                    var schars    = [],
                        f         = 0,
                        locallen  = b,
                        emptyline = 1,
                        output    = "",
                        stest     = (/\s/),
                        asitest   = false;
                    for (f = a; f < locallen; f = f + 1) {
                        if (c[f] === "\n") {
                            stats.space.newline = stats.space.newline + 1;
                            asitest             = true;
                        } else if (c[f] === " ") {
                            stats.space.space = stats.space.space + 1;
                        } else if (c[f] === "\t") {
                            stats.space.tab = stats.space.tab + 1;
                        } else if (stest.test(c[f]) === true) {
                            stats.space.other = stats.space.other + 1;
                        } else {
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
                },
                // Identifies blocks of markup embedded within JavaScript for language supersets
                // like React JSX.
                markup         = function jspretty__tokenize_markup() {
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
                    if (options.typescript === false && (token[d] === "return" || types[d] === "operator" || types[d] === "start" || types[d] === "separator" || (token[d] === "}" && depthlist[depthlist.length - 1][0] === "global"))) {
                        ltype       = "markup";
                        options.jsx = true;
                    } else if (options.typescript === true || token[lengtha - 1] === "#include" || (((/\s/).test(c[a - 1]) === false || ltoke === "public" || ltoke === "private" || ltoke === "static" || ltoke === "final" || ltoke === "implements" || ltoke === "class" || ltoke === "void" || ltoke === "Promise") && syntaxnum.indexOf(c[a + 1]) < 0)) {
                        //Java type generics
                        return (function jspretty__tokenize_markup_generic() {
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
                end            = function jspretty__tokenize_end(x) {
                    var insert   = false,
                        next     = nextchar(1, false),
                        newarray = function jspretty__tokenize_end_newarray() {
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
                                depth[depth.length - 1]         = "array";
                                begin[begin.length - 1]         = lengtha - 1;
                                depthlist[depthlist.length - 1] = [
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
                                depth.splice(aa - 2, 2);
                                begin.splice(aa - 2, 2);
                                lengtha                         = lengtha - 2;
                                depthlist[depthlist.length - 1] = [
                                    namear, aa - 2
                                ];
                                pdepth                          = [namear, aa];
                                bb                              = lengtha - 1;
                                do {
                                    if (begin[bb] === cc) {
                                        depth[bb] = namear;
                                        begin[bb] = begin[bb] - 2;
                                    }
                                    bb = bb - 1;
                                } while (bb > aa - 3);
                            }
                            ltoke = endar;
                            ltype = "end";
                            tokenpush(false, 0);
                        };
                    stats.container = stats.container + 1;
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
                    if (ltoke === "," && depth[lengtha - 1] !== "initializer" && ((x === "]" && (options.endcomma === "never" || options.endcomma === "multiline" || token[lengtha - 2] === "[")) || x === "}")) {
                        tokenpop();
                    } else if ((x === "]" || x === "}") && options.endcomma === "always" && ltoke !== ",") {
                        endCommaArray();
                    }
                    if (x === ")" || x === "x)") {
                        ltoke = x;
                        ltype = "end";
                        if (lword.length > 0) {
                            pword = lword[lword.length - 1];
                            if (pword.length > 1 && next !== "{" && (pword[0] === "if" || pword[0] === "for" || (pword[0] === "while" && depth[pword[1] - 2] !== undefined && depth[pword[1] - 2] !== "do") || pword[0] === "with")) {
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
                        if (depthlist.length > 0 && depthlist[depthlist.length - 1][0] !== "object") {
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
                    pdepth = depthlist.pop();
                    if (brace[brace.length - 1] === "x{" && x === "}") {
                        blockinsert();
                    }
                    brace.pop();
                    if (brace[brace.length - 1] === "x{" && x === "}" && depth[lengtha - 1] !== "try") {
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
                        depthlist.push(pword);
                    }
                },
                //determines tag names for {% %} based template tags and returns a type
                tname          = function jspretty__tokenize_tname(x) {
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
            start = function jspretty__tokenize_start(x) {
                brace.push(x);
                stats.container = stats.container + 1;
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
                depthlist.push([
                    depth[depth.length - 1],
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
                    ltoke              = generic("<?php", "?>");
                    ltype              = "template";
                    stats.server.token = stats.server.token + 1;
                    stats.server.chars = stats.server.chars + ltoke.length;
                    tokenpush(false, 0);
                } else if (c[a] === "<" && c[a + 1] === "%") {
                    //asp
                    ltoke              = generic("<%", "%>");
                    ltype              = "template";
                    stats.server.token = stats.server.token + 1;
                    stats.server.chars = stats.server.chars + ltoke.length;
                    tokenpush(false, 0);
                } else if (c[a] === "{" && c[a + 1] === "%") {
                    //twig
                    ltoke              = generic("{%", "%}");
                    ltype              = tname(ltoke);
                    stats.server.token = stats.server.token + 1;
                    stats.server.chars = stats.server.chars + ltoke.length;
                    tokenpush(false, 0);
                } else if (c[a] === "{" && c[a + 1] === "{" && c[a + 2] === "{") {
                    //mustache
                    ltoke              = generic("{{{", "}}}");
                    ltype              = "template";
                    stats.server.token = stats.server.token + 1;
                    stats.server.chars = stats.server.chars + ltoke.length;
                    tokenpush(false, 0);
                } else if (c[a] === "{" && c[a + 1] === "{") {
                    //handlebars
                    ltoke              = generic("{{", "}}");
                    ltype              = tname(ltoke);
                    stats.server.token = stats.server.token + 1;
                    stats.server.chars = stats.server.chars + ltoke.length;
                    tokenpush(false, 0);
                } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-" && c[a + 4] === "#") {
                    //ssi
                    ltoke              = generic("<!--#", "-->");
                    ltype              = "template";
                    stats.server.token = stats.server.token + 1;
                    stats.server.chars = stats.server.chars + ltoke.length;
                    tokenpush(false, 0);
                } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-") {
                    //markup comment
                    ltoke                    = generic("<!--", "-->");
                    ltype                    = "comment";
                    stats.commentBlock.token = stats.commentBlock.token + 1;
                    stats.commentBlock.chars = stats.commentBlock.chars + ltoke.length;
                    tokenpush(false, 0);
                } else if (c[a] === "<") {
                    //markup
                    ltoke              = markup();
                    stats.server.token = stats.server.token + 1;
                    stats.server.chars = stats.server.chars + ltoke.length;
                    tokenpush(false, 0);
                } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "*")) {
                    //comment block
                    ltoke                    = generic("/*", "*\/");
                    stats.commentBlock.token = stats.commentBlock.token + 1;
                    stats.commentBlock.chars = stats.commentBlock.chars + ltoke.length;
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
                    ltoke              = generic("#!" + c[a + 2], "\n");
                    ltoke              = ltoke.slice(0, ltoke.length - 1);
                    ltype              = "literal";
                    stats.server.token = stats.server.token + 1;
                    stats.server.chars = stats.server.chars + ltoke.length;
                    tokenpush(false, 2);
                } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "/")) {
                    //comment line
                    asi(false);
                    ltoke                   = generic("//", "\n");
                    stats.commentLine.token = stats.commentLine.token + 1;
                    stats.commentLine.chars = stats.commentLine.chars + ltoke.length;
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
                    ltoke                   = generic("#region", "\n");
                    ltype                   = "comment";
                    stats.commentLine.token = stats.commentLine.token + 1;
                    stats.commentLine.chars = stats.commentLine.chars + ltoke.length;
                    tokenpush(false, 0);
                } else if (c[a] === "#" && c[a + 1] === "e" && c[a + 2] === "n" && c[a + 3] === "d" && c[a + 4] === "r" && c[a + 5] === "e" && c[a + 6] === "g" && c[a + 7] === "i" && c[a + 8] === "o" && c[a + 9] === "n") {
                    //comment line
                    asi(false);
                    ltoke                   = generic("#endregion", "\n");
                    ltype                   = "comment";
                    stats.commentLine.token = stats.commentLine.token + 1;
                    stats.commentLine.chars = stats.commentLine.chars + ltoke.length;
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
                    ltoke              = tempstring();
                    ltype              = "literal";
                    stats.string.token = stats.string.token + 1;
                    if (ltoke.charAt(ltoke.length - 1) === "{") {
                        stats.string.quote = stats.string.quote + 3;
                        stats.string.chars = stats.string.chars + ltoke.length - 3;
                    } else {
                        stats.string.quote = stats.string.quote + 2;
                        stats.string.chars = ltoke.length - 2;
                    }
                    tokenpush(false, 0);
                } else if (c[a] === "\"" || c[a] === "'") {
                    //string
                    ltoke = generic(c[a], c[a]);
                    ltype = "literal";
                    if ((ltoke.charAt(0) === "\"" && options.quoteConvert === "single") || (ltoke.charAt(0) === "'" && options.quoteConvert === "double")) {
                        ltoke = quoteConvert(ltoke);
                    }
                    stats.string.token = stats.string.token + 1;
                    if (ltoke.length > 1) {
                        stats.string.chars = stats.string.chars + ltoke.length - 2;
                    }
                    stats.string.quote = stats.string.quote + 2;
                    if (options.wrap !== 0 && token[lengtha - 1] === "+" && (token[lengtha - 2].charAt(0) === "\"" || token[lengtha - 2].charAt(0) === "'")) {
                        strmerge();
                    } else if (options.wrap > 0 && (types[lengtha] !== "operator" || token[lengtha] === "=" || token[lengtha] === ":" || (token[lengtha] === "+" && types[lengtha - 1] === "literal"))) {
                        if ((token[0] === "[" && (/(\]\s*)$/).test(options.source) === true) || (token[0] === "{" && (/(\}\s*)$/).test(options.source) === true)) {
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
                    stats.operator.token = stats.operator.token + 1;
                    stats.operator.chars = stats.operator.chars + 1;
                    ltoke                = "-";
                    ltype                = "operator";
                    tokenpush(false, 0);
                } else if (wordTest === -1 && (c[a] !== "0" || (c[a] === "0" && c[a + 1] !== "b")) && ((/\d/).test(c[a]) || (a !== b - 2 && c[a] === "-" && c[a + 1] === "." && (/\d/).test(c[a + 2])) || (a !== b - 1 && (c[a] === "-" || c[a] === ".") && (/\d/).test(c[a + 1])))) {
                    //number
                    if (wordTest > -1) {
                        word();
                    }
                    if (ltype === "end" && c[a] === "-") {
                        ltoke                = "-";
                        ltype                = "operator";
                        stats.operator.token = stats.operator.token + 1;
                        stats.operator.chars = stats.operator.chars + 1;
                    } else {
                        ltoke              = numb();
                        ltype              = "literal";
                        stats.number.token = stats.number.token + 1;
                        stats.number.chars = stats.number.chars + ltoke.length;
                    }
                    tokenpush(false, 0);
                } else if (c[a] === ":" && c[a + 1] === ":") {
                    if (wordTest > -1) {
                        word();
                    }
                    plusplus();
                    asifix();
                    a                    = a + 1;
                    stats.operator.token = stats.operator.token + 1;
                    stats.operator.chars = stats.operator.chars + 2;
                    ltoke                = "::";
                    ltype                = "separator";
                    tokenpush(false, 0);
                } else if (c[a] === ",") {
                    //comma
                    if (wordTest > -1) {
                        word();
                    }
                    plusplus();
                    stats.comma = stats.comma + 1;
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
                    stats.operator.token = stats.operator.token + 1;
                    if (c[a + 1] === "." && c[a + 2] === ".") {
                        ltoke                = "...";
                        ltype                = "operator";
                        stats.operator.chars = stats.operator.chars + 3;
                        a                    = a + 2;
                    } else {
                        asifix();
                        ltoke                = ".";
                        ltype                = "separator";
                        stats.operator.chars = stats.operator.chars + 1;
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
                        stats.semicolon = stats.semicolon + 1;
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
                } else if (c[a] === "*" && depth[lengtha - 1] === "object" && wordTest < 0 && (/\s/).test(c[a + 1]) === false && c[a + 1] !== "=" && (/\d/).test(c[a + 1]) === false) {
                    wordTest = a;
                } else if (c[a] === "=" || c[a] === "&" || c[a] === "<" || c[a] === ">" || c[a] === "+" || c[a] === "-" || c[a] === "*" || c[a] === "/" || c[a] === "!" || c[a] === "?" || c[a] === "|" || c[a] === "^" || c[a] === ":" || c[a] === "%" || c[a] === "~") {
                    //operator
                    ltoke = operator();
                    if (ltoke === "regex") {
                        ltoke = token[lengtha - 1];
                    } else {
                        ltype                = "operator";
                        stats.operator.token = stats.operator.token + 1;
                        stats.operator.chars = stats.operator.chars + ltoke.length;
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
            (function jspretty__correct() {
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
        if (options.nodeasync === false) {
            if (global.prettydiff.meta === undefined) {
                global.prettydiff.meta       = {};
                global.prettydiff.meta.error = "";
            }
            if (global.prettydiff.meta.error === "") {
                global.prettydiff.meta.error = globalerror;
            }
        }
        if (options.mode === "parse") {
            return (function jspretty__parse() {
                var a      = 0,
                    c      = token.length,
                    record = [],
                    def    = {
                        begin: "number - The index where the current container starts",
                        depth: "string - The name of the current container",
                        lines: "number - Whether the token is preceeded any space and/or line breaks in the or" +
                                "iginal code source",
                        token: "string - The parsed code tokens",
                        types: "string - Data types of the tokens: comment, comment-inline, end, literal, mark" +
                                "up, operator, regex, separator, start, template, template_else, template_end, " +
                                "template_start, word"
                    };
                for (a = 0; a < c; a = a + 1) {
                    if (options.correct === false && (token[a] === "x;" || token[a] === "x{" || token[a] === "x}" || token[a] === "x(" || token[a] === "x)")) {
                        c = c - 1;
                        begin.splice(a, 1);
                        depth.splice(a, 1);
                        lines.splice(a, 1);
                        token.splice(a, 1);
                        types.splice(a, 1);
                    }
                    if (options.parseFormat !== "htmltable" && types[a] === "markup" && global.prettydiff.markuppretty !== undefined) {
                        options.source = token[a];
                        options.jsx    = true;
                        token[a]       = global
                            .prettydiff
                            .markuppretty(options)
                            .data;
                    }
                }
                if (options.parseFormat === "sequential") {
                    for (a = 0; a < c; a = a + 1) {
                        record.push([
                            token[a], types[a], depth[a], begin[a], lines[a]
                        ]);
                    }
                    if (options.nodeasync === true) {
                        return [
                            {
                                data      : record,
                                definition: def
                            },
                            globalerror
                        ];
                    }
                    return {data: record, definition: def};
                }
                if (options.parseFormat === "htmltable") {
                    return (function jspretty__parse_html() {
                        var output = [],
                            header = "<tr class=\"header\"><th>index</th><th>token</th><th>types</th><th>depth</th><" +
                                    "th>begin</th><th>lines</th></tr>",
                            aa     = 0,
                            len    = 0;
                        output.push("<table summary='CSS parse table'><thead>");
                        output.push(header);
                        output.push("</thead><tbody>");
                        len = token.length;
                        for (aa = 0; aa < len; aa = aa + 1) {
                            if (types[aa] === "markup" && global.prettydiff.markuppretty !== undefined) {
                                options.source = token[aa];
                                options.jsx    = true;
                                output.push("<tr><td colspan=\"6\" class=\"nested\">");
                                output.push(global.prettydiff.markuppretty(options).data.replace(
                                    "<thead>",
                                    "<thead><tr><th colspan=\"10\" class=\"nested\">markup tokens</th></tr>"
                                ));
                                output.push("</td></tr>");
                                output.push(
                                    "<tr><th colspan=\"6\" class=\"nested\">JavaScript tokens</th></tr>"
                                );
                                output.push(header);
                            } else {
                                output.push("<tr><td>");
                                output.push(aa);
                                output.push("</td><td>");
                                output.push(
                                    token[aa].replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;")
                                );
                                output.push("</td><td>");
                                output.push(types[aa]);
                                output.push("</td><td>");
                                output.push(depth[aa]);
                                output.push("</td><td>");
                                output.push(begin[aa]);
                                output.push("</td><td>");
                                output.push(lines[aa]);
                                output.push("</td></tr>");
                            }
                        }
                        output.push("</tbody></table>");
                        if (options.nodeasync === true) {
                            return [
                                {
                                    data      : output.join(""),
                                    definition: def
                                },
                                globalerror
                            ];
                        }
                        return {data: output.join(""), definition: def};
                    }());
                }
                if (options.nodeasync === true) {
                    return [
                        {
                            data      : {
                                begin: begin,
                                depth: depth,
                                lines: lines,
                                token: token,
                                types: types
                            },
                            definition: def
                        },
                        globalerror
                    ];
                }
                return {
                    data      : {
                        begin: begin,
                        depth: depth,
                        lines: lines,
                        token: token,
                        types: types
                    },
                    definition: def
                };
            }());
        }

        if (options.jsx === true && options.jsscope !== "none" && token[0] === "{") {
            options.jsscope = "none";
            (function jspretty__jsxScope() {
                var a   = 0,
                    len = token.length;
                for (a = 0; a < len; a = a + 1) {
                    if (types[a] === "word" && token[a - 1] !== ".") {
                        token[a] = "[pdjsxscope]" + token[a] + "[/pdjsxscope]";
                    }
                }
            }());
        }
        if (options.mode === "beautify" || options.mode === "diff") {
            //this function is the pretty-print algorithm
            (function jspretty__beautify() {
                var a             = 0,
                    b             = token.length,
                    indent        = options.inlevel, //will store the current level of indentation
                    list          = [], //stores comma status of current block
                    wordlist      = [], //if the current list is word types preceeded by a word (Java type invocations)
                    lastlist      = false, //remembers the list status of the most recently closed block
                    ternary       = [], //used to identify ternary statments
                    varline       = [], //determines if a current list of the given block is a list of variables following the "var" keyword
                    ctype         = "", //ctype stands for "current type"
                    ctoke         = "", //ctoke standa for "current token"
                    ltype         = types[0], //ltype stands for "last type"
                    ltoke         = token[0], //ltype stands for "last token"
                    lettest       = -1,
                    varlen        = [
                        []
                    ], //stores lists of variables, assignments, and object properties for white space padding
                    extraindent   = [
                        []
                    ], //stores token indexes where extra indentation occurs from ternaries and broken method chains
                    arrbreak      = [], //array where a method break has occurred
                    destruct      = [], //attempt to identify object destructuring
                    itemcount     = [], //counts items in destructured lists
                    assignlist    = [false], //are you in a list right now?
                    destructfix   = function jspretty__beautify_destructFix(listFix, override) {
                        // listfix  - at the end of a list correct the containing list override - to
                        // break arrays with more than 4 items into a vertical list
                        var c          = 0,
                            d          = (listFix === true)
                                ? 0
                                : 1,
                            ei         = (extraindent[extraindent.length - 1] === undefined)
                                ? []
                                : extraindent[extraindent.length - 1],
                            arrayCheck = (
                                override === false && depth[a] === "array" && listFix === true && ctoke !== "["
                            );
                        if (destruct[destruct.length - 1] === false || (depth[a] === "array" && options.formatArray === "inline") || (depth[a] === "object" && options.formatObject === "inline")) {
                            return;
                        }
                        destruct[destruct.length - 1] = false;
                        for (c = a - 1; c > -1; c = c - 1) {
                            if (types[c] === "end") {
                                d = d + 1;
                            } else if (types[c] === "start") {
                                d = d - 1;
                            }
                            if (depth[c] === "global") {
                                return;
                            }
                            if (d === 0) {
                                if (depth[a] === "class" || depth[a] === "map" || (arrayCheck === false && ((listFix === false && token[c] !== "(" && token[c] !== "x(") || (listFix === true && token[c] === ",")))) {
                                    if (types[c + 1] === "template_start") {
                                        if (lines[c] < 1) {
                                            level[c] = -20;
                                        } else {
                                            level[c] = indent - 1;
                                        }
                                    } else if (ei.length > 0 && ei[ei.length - 1] > -1) {
                                        level[c] = indent - 1;
                                    } else {
                                        level[c] = indent;
                                    }
                                }
                                if (listFix === false) {
                                    return;
                                }
                            }
                            if (d < 0) {
                                if (types[c + 1] === "template_start") {
                                    if (lines[c] < 1) {
                                        level[c] = -20;
                                    } else {
                                        level[c] = indent - 1;
                                    }
                                } else if (ei.length > 0 && ei[ei.length - 1] > -1) {
                                    level[c] = indent - 1;
                                } else {
                                    level[c] = indent;
                                }
                                return;
                            }
                        }
                    },
                    strwrap       = function jspretty__beautify_strwrap(offset) {
                        var aa        = 0,
                            bb        = 0,
                            cc        = 0,
                            dd        = 0,
                            ee        = 0,
                            ff        = 0,
                            x         = 0,
                            str       = "",
                            off       = false,
                            ei        = (extraindent[extraindent.length - 1] === undefined)
                                ? []
                                : extraindent[extraindent.length - 1],
                            ind       = (token[begin[a]] === "(" && (list[list.length - 1] === true || ei.length > 0))
                                ? indent + 3
                                : indent + 2,
                            bgn       = begin[a],
                            dep       = depth[a],
                            lin       = lines[a],
                            wrap      = options.wrap - 2,
                            paren     = token[a + 1] === ".",
                            uchar     = (/u[0-9a-fA-F]{4}/),
                            xchar     = (/x[0-9a-fA-F]{2}/),
                            item      = token[a],
                            qchar     = item.charAt(0),
                            slash     = function jspretty__beautify_strwrap_slash(trim, entity) {
                                var dist = 0;
                                if (entity === true) {
                                    ff = trim;
                                }
                                do {
                                    dist = dist + 1;
                                } while (item.charAt(cc - (trim + dist)) === "\\" && dist < cc);
                                if (entity === false) {
                                    cc = cc - dist;
                                    ff = ff + dist;
                                } else if (dist % 2 === 1) {
                                    cc = cc - ff;
                                } else {
                                    ff = 0;
                                }
                            },
                            parenpush = function jspretty_beautify_strwrap_parenpush() {
                                token.splice(a, 0, "(");
                                types.splice(a, 0, "start");
                                lines.splice(a, 0, lin);
                                depth.splice(a, 0, "paren");
                                begin.splice(a, 0, a);
                                level.push(indent + 1);
                                bgn = a;
                                dep = "paren";
                                a   = a + 1;
                                b   = b + 1;
                                x   = x + 1;
                            },
                            tokenpush = function jspretty_beautify_strwrap_tokenpush(toke, type) {
                                token.splice(a, 0, toke);
                                types.splice(a, 0, type);
                                lines.splice(a, 0, lin);
                                depth.splice(a, 0, dep);
                                begin.splice(a, 0, bgn);
                                if (toke === "+") {
                                    level.push(ind);
                                } else if (toke === ")") {
                                    level.push(indent);
                                    level[a - 1] = indent;
                                } else {
                                    level.push(-10);
                                }
                                a = a + 1;
                                b = b + 1;
                                x = x + 1;
                            };
                        aa = a;
                        do {
                            aa = aa - 1;
                            if (aa === begin[a] && token[aa] === "(") {
                                break;
                            }
                        } while (aa > 0 && level[aa - 1] < -9);
                        if (ltoke === "(") {
                            level[a - 1] = indent + 1;
                        }
                        if (token[aa] === "." && token[begin[a]] !== "(") {
                            ind = ind + 1;
                        }
                        if (token[begin[a]] === "(" && list[list.length - 1] === false && token[aa] !== "?" && token[aa] !== ":") {
                            ind = indent + 1;
                        }
                        if (paren === true && token[aa] !== "?" && token[aa] !== ":") {
                            ind = indent + 1;
                        }
                        if (offset > 1 && item.length > offset) {
                            off = true;
                            if (paren === true) {
                                tokenpush("(");
                            }
                            if (item.charAt(offset - 5) === "\\" && uchar.test(item.slice(offset - 4, offset + 1)) === true) {
                                str  = item.slice(0, offset - 5) + item.charAt(0);
                                item = item.charAt(0) + item.slice(offset - 5);
                            } else if (item.charAt(offset - 4) === "\\" && uchar.test(item.slice(offset - 3, offset + 2)) === true) {
                                str  = item.slice(0, offset - 4) + item.charAt(0);
                                item = item.charAt(0) + item.slice(offset - 4);
                            } else if (item.charAt(offset - 3) === "\\" && (uchar.test(item.slice(offset - 2, offset + 3)) === true || xchar.test(item.slice(offset - 2, offset + 1)) === true)) {
                                str  = item.slice(0, offset - 3) + item.charAt(0);
                                item = item.charAt(0) + item.slice(offset - 3);
                            } else if (item.charAt(offset - 2) === "\\" && (uchar.test(item.slice(offset - 1, offset + 4)) === true || xchar.test(item.slice(offset - 1, offset + 2)) === true)) {
                                str  = item.slice(0, offset - 2) + item.charAt(0);
                                item = item.charAt(0) + item.slice(offset - 2);
                            } else if (item.charAt(offset - 1) === "\\") {
                                str  = item.slice(0, offset - 1) + item.charAt(0);
                                item = item.charAt(0) + item.slice(offset - 1);
                            } else {
                                str  = item.slice(0, offset) + item.charAt(0);
                                item = item.charAt(0) + item.slice(offset);
                            }
                            if (str.charAt(str.length - 2) === "\\") {
                                str = str + str.charAt(0);
                            }
                            tokenpush(str, "literal");
                            tokenpush("+", "operator");
                        }
                        if (item.length > wrap) {
                            if (depth[a] === "object" || depth[a] === "array") {
                                destructfix(true, false);
                            }
                            if (off === false && paren === true) {
                                parenpush();
                            }
                            token.splice(a, 1);
                            types.splice(a, 1);
                            lines.splice(a, 1);
                            depth.splice(a, 1);
                            begin.splice(a, 1);
                            b    = b - 1;
                            item = item.slice(1, item.length - 1);
                            bb   = Math.floor(item.length / wrap) * wrap;
                            for (aa = 0; aa < bb; aa = aa + wrap) {
                                cc = aa + wrap + dd;
                                if (item.charAt(cc - 5) === "\\" && uchar.test(item.slice(cc - 4, cc + 1)) === true) {
                                    slash(5, true);
                                } else if (item.charAt(cc - 4) === "\\" && uchar.test(item.slice(cc - 3, cc + 2)) === true) {
                                    slash(4, true);
                                } else if (item.charAt(cc - 3) === "\\" && (uchar.test(item.slice(cc - 2, cc + 3)) === true || xchar.test(item.slice(cc - 2, cc + 1)) === true)) {
                                    slash(3, true);
                                } else if (item.charAt(cc - 2) === "\\" && (uchar.test(item.slice(cc - 1, cc + 4)) === true || xchar.test(item.slice(cc - 1, cc + 2)) === true)) {
                                    slash(2, true);
                                } else if (item.charAt(cc - 1) === "\\") {
                                    slash(1, true);
                                } else {
                                    ff = 0;
                                }
                                if (item.charAt(cc - 1) === "\\") {
                                    slash(1, false);
                                }
                                if (aa > 0 && dd < 0) {
                                    aa = aa - 1;
                                    dd = 0;
                                }
                                if (item.charAt(cc - 1) === "\\") {
                                    str = qchar + item.slice(ee, cc - 1) + qchar;
                                    ee  = cc - 1;
                                    aa  = aa - 1;
                                } else {
                                    str = qchar + item.slice(ee, cc) + qchar;
                                    ee  = cc;
                                }
                                if (item.charAt(cc) === "\\") {
                                    aa = aa - ff;
                                }
                                tokenpush(str, "literal");
                                if (aa < item.length - wrap) {
                                    tokenpush("+", "operator");
                                }
                            }
                            if (aa < item.length) {
                                tokenpush(qchar + item.slice(aa, aa + wrap) + qchar, "literal");
                            }
                            if (paren === true) {
                                tokenpush(")", "end");
                            }
                            a  = a - 1;
                            x  = x - 1;
                            aa = a + 1;
                            do {
                                aa = aa + 1;
                                if (types[aa - 1] === "start") {
                                    begin[aa - 1] = (aa - 1);
                                } else if (begin[aa - 1] > bgn) {
                                    begin[aa - 1] = begin[aa - 1] + x;
                                }
                            } while (aa < b);
                            ctoke = token[a];
                            ctype = types[a];
                            ltoke = token[a - 1];
                            ltype = types[a - 1];
                        } else {
                            if (off === true) {
                                aa = a;
                                do {
                                    aa = aa + 1;
                                    if (types[aa - 1] === "start") {
                                        begin[aa - 1] = (aa - 1);
                                    } else if (begin[aa - 1] > bgn) {
                                        begin[aa - 1] = begin[aa - 1] + x;
                                    }
                                } while (aa < b);
                            }
                            token[a] = item;
                            level.push(-10);
                        }
                        ctoke = token[a];
                        ctype = "string";
                    },
                    literal       = function jspretty__beautify_literal() {
                        if (ctoke.indexOf("#!/") === 0) {
                            level.push(indent);
                        } else {
                            if (ctoke.charAt(0) === "}") {
                                level[a - 1] = -20;
                            }
                            if (options.bracepadding === true && ctoke.charAt(0) === "}" && ctoke.charAt(ctoke.length - 1) === "`") {
                                level[a - 1] = -10;
                            }
                            if (options.wrap > 0 && ctoke.length > options.wrap && (ctoke.charAt(0) === "\"" || ctoke.charAt(0) === "'")) {
                                strwrap(0);
                            } else {
                                level.push(-10);
                            }
                        }
                        if ((ltoke === "," || ltype === "start") && (depth[a] === "object" || depth[a] === "array") && destruct[destruct.length - 1] === false && a > 0) {
                            level[a - 1] = indent;
                        }
                    },
                    endExtraInd   = function jspretty__beautify_endExtraInd() {
                        var ei = extraindent[extraindent.length - 1],
                            c  = 0;
                        if (ei === undefined) {
                            return;
                        }
                        c = ei.length - 1;
                        if (c < 1 && ei[c] < 0 && (ctoke === ";" || ctoke === "x;" || ctoke === ")" || ctoke === "x)" || ctoke === "}" || ctoke === "x}")) {
                            return ei.pop();
                        }
                        if (c < 0 || ei[c] < 0) {
                            return;
                        }
                        if (ctoke === ":") {
                            if (token[ei[c]] !== "?") {
                                do {
                                    ei.pop();
                                    c      = c - 1;
                                    indent = indent - 1;
                                } while (c > -1 && ei[c] > -1 && token[ei[c]] !== "?");
                            }
                            ei[c]        = a;
                            level[a - 1] = indent;
                        } else {
                            do {
                                ei.pop();
                                c      = c - 1;
                                indent = indent - 1;
                            } while (c > -1 && ei[c] > -1);
                        }
                        if ((depth[a] === "array" || ctoke === ",") && ei.length < 1) {
                            ei.push(-1);
                        }
                    },
                    comment       = function jspretty__beautify_comment() {
                        destructfix(false, false);
                        if (token[a - 1] === ",") {
                            level[a - 1] = indent;
                        } else if (lines[a - 1] === 0 && types[a - 1] !== "comment" && types[a - 1] !== "comment-inline") {
                            level[a - 1] = -20;
                        } else if (ltoke === "=" && (/^(\/\*\*\s*@[a-z_]+\s)/).test(ctoke) === true) {
                            level[a - 1] = -10;
                        } else {
                            level[a - 1] = indent;
                        }
                        level.push(indent);
                    },
                    commentInline = function jspretty__beautify_commentInline() {
                        destructfix(false, false);
                        if (a < b - 1 && depth[a + 1] !== "block" && (token[a + 1] === "{" || token[a + 1] === "x{")) {
                            token[a]     = token[a + 1];
                            types[a]     = "start";
                            depth[a]     = depth[a + 1];
                            begin[a]     = begin[a + 1];
                            lines[a]     = lines[a + 1];
                            token[a + 1] = ctoke;
                            types[a + 1] = ctype;
                            a            = a - 1;
                        } else {
                            level[a - 1] = -10;
                            if (depth[a] === "paren" || depth[a] === "method") {
                                level.push(indent + 2);
                            } else {
                                level.push(indent);
                            }
                        }
                    },
                    template      = function jspretty__beautify_template() {
                        if (ctype === "template_else") {
                            level[a - 1] = indent - 1;
                            level.push(indent);
                        } else if (ctype === "template_start") {
                            indent = indent + 1;
                            if (lines[a - 1] < 1) {
                                level[a - 1] = -20;
                            }
                            if (lines[a] > 0) {
                                level.push(indent);
                            } else {
                                level.push(-20);
                            }
                        } else if (ctype === "template_end") {
                            indent = indent - 1;
                            if (ltype === "template_start" || lines[a - 1] < 1) {
                                level[a - 1] = -20;
                            } else {
                                level[a - 1] = indent;
                            }
                            if (lines[a] > 0) {
                                level.push(indent);
                            } else {
                                level.push(-20);
                            }
                        } else if (ctype === "template") {
                            if (lines[a] > 0) {
                                level.push(indent);
                            } else {
                                level.push(-20);
                            }
                        }
                    },
                    markup        = function jspretty__beautify_markup() {
                        if ((token[a + 1] !== "," && ctoke.indexOf("/>") !== ctoke.length - 2) || (token[a + 1] === "," && token[begin[a] - 3] !== "React")) {
                            destructfix(false, false);
                        }
                        if (ltoke === "return" || ltoke === "?" || ltoke === ":") {
                            level[a - 1] = -10;
                            level.push(-20);
                        } else if (ltype === "start" || (token[a - 2] === "return" && depth[a - 1] === "method")) {
                            level.push(indent);
                        } else {
                            level.push(-20);
                        }
                        if (varline[varline.length - 1] === true) {
                            markupvar.push(a);
                        }
                    },
                    separator     = function jspretty__beautify_separator() {
                        var methtest      = false,
                            ei            = (extraindent[extraindent.length - 1] === undefined)
                                ? []
                                : extraindent[extraindent.length - 1],
                            propertybreak = function jspretty__beautify_separator_propertybreak() {
                                var c = 0,
                                    d = begin[a],
                                    e = 1;
                                if (ctoke === "." && ltype !== "end" && types[a + 2] !== "start") {
                                    level[a - 1] = -20;
                                    return;
                                }
                                for (c = a - 2; c > d; c = c - 1) {
                                    if (begin[c] === d) {
                                        if (token[c] === ".") {
                                            e = e + 1;
                                        }
                                        if (token[c] === ";" || token[c] === "," || types[c] === "operator" || token[c] === "return" || token[c] === "break" || token[c] === "continue" || types[c] === "comment" || types[c] === "comment-inline") {
                                            break;
                                        }
                                        if (types[c - 1] === "end") {
                                            if (types[c] !== "start" && types[c] !== "operator" && token[c] !== ".") {
                                                break;
                                            }
                                            c = begin[c - 1];
                                        }
                                    }
                                }
                                if (e < 2) {
                                    level[a - 1] = -20;
                                    return;
                                }
                                indent = indent + 1;
                                if (token[c] !== ".") {
                                    do {
                                        c = c + 1;
                                    } while (c < a && (token[c] !== "." || begin[c] !== d));
                                }
                                for (e = c; e < a; e = e + 1) {
                                    if (token[e] === "." && begin[e] === d) {
                                        level[e - 1] = indent;
                                    } else if (level[e] > -9) {
                                        level[e] = level[e] + 1;
                                    }
                                }
                                level[a - 1] = indent;
                                ei.push(a);
                            };
                        if (ctoke === "::") {
                            level[a - 1] = -20;
                            return level.push(-20);
                        }
                        if ((options.methodchain === "chain" || (options.methodchain === "none" && lines[a] < 1)) && types[a - 1] === "comment-inline" && a > 1) {
                            return (function jspretty__beautify_separator_commentfix() {
                                var c    = 0,
                                    d    = b,
                                    last = token[a - 1];
                                level[a - 2] = -20;
                                level[a - 1] = -20;
                                for (c = a; c < d; c = c + 1) {
                                    token[c - 1] = token[c];
                                    types[c - 1] = types[c];
                                    if (token[c] === ";" || token[c] === "x;" || token[c] === "{" || token[c] === "x{" || lines[c] > 0) {
                                        token[c] = last;
                                        types[c] = "comment-inline";
                                        a        = a - 1;
                                        return;
                                    }
                                }
                                token[c - 1] = last;
                                types[c - 1] = "comment-inline";
                                a            = a - 1;
                            }());
                        }
                        if (ctoke === ".") {
                            if (token[begin[a]] !== "(" && token[begin[a]] !== "x(" && ei.length > 0) {
                                if (depth[a] === "object" || depth[a] === "array") {
                                    destructfix(true, false);
                                } else {
                                    destructfix(false, false);
                                }
                            }
                            if ((options.methodchain === "chain" || (options.methodchain === "none" && lines[a] < 1)) && ltype !== "comment" && ltype !== "comment-inline") {
                                level[a - 1] = -20;
                            } else {
                                if (token[begin[a]] !== "(" && token[begin[a]] !== "x(" && (types[a + 2] === "start" || ltoke === ")" || (token[ei[ei.length - 1]] !== "."))) {
                                    if (token[ei[ei.length - 1]] !== "." && options.nochainindent === false) {
                                        propertybreak();
                                    } else {
                                        level[a - 1] = indent;
                                    }
                                } else if (token[ei[ei.length - 1]] === ".") {
                                    level[a - 1] = indent;
                                } else {
                                    level[a - 1] = -20;
                                }
                            }
                            if (types[a - 1] === "comment" || types[a - 1] === "comment-inline") {
                                if (ei > 0) {
                                    level[a - 1] = indent;
                                } else {
                                    level[a - 1] = indent + 1;
                                }
                            }
                            return level.push(-20);
                        }
                        if (ctoke === ",") {
                            if (list[list.length - 1] === false && (depth[a] === "object" || depth[a] === "array" || depth[a] === "paren" || depth[a] === "expression" || depth[a] === "method")) {
                                list[list.length - 1] = true;
                                if (token[begin[a]] === "(") {
                                    (function jspretty__beautify_separator_plusfix() {
                                        var aa = a;
                                        do {
                                            aa = aa - 1;
                                            if (begin[aa] === begin[a] && token[aa] === "+" && level[aa] > -9) {
                                                level[aa] = level[aa] + 2;
                                            }
                                        } while (aa > begin[a]);
                                    }());
                                }
                            }
                            if (ei.length > 0) {
                                if (ei[ei.length - 1] > -1) {
                                    endExtraInd();
                                }
                                level[a - 1] = -20;
                                return level.push(indent);
                            }
                            if (token[a - 2] === ":" && token[a - 4] === "where") {
                                level[a - 1] = -20;
                                return level.push(-10);
                            }
                            level[a - 1]                    = -20;
                            itemcount[itemcount.length - 1] = itemcount[itemcount.length - 1] + 1;
                            if ((token[begin[a]] === "(" || token[begin[a]] === "x(") && options.jsx === false && depth[a] !== "global" && (types[a - 1] !== "literal" || token[a - 2] !== "+" || (types[a - 1] === "literal" && token[a - 2] === "+" && types[a - 3] !== "literal"))) {
                                return level.push(-10);
                            }
                            if (ltype === "word" && types[a - 2] === "word" && "var-let-const-from".indexOf(token[a - 2]) < 0 && (types[a - 3] === "end" || token[a - 3] === ";")) {
                                wordlist[wordlist.length - 1] = true;
                                return level.push(-10);
                            }
                            if (wordlist[wordlist.length - 1] === true || depth[a] === "notation") {
                                return level.push(-10);
                            }
                            if (destruct[destruct.length - 1] === true && itemcount[itemcount.length - 1] > 4 && (depth[a] === "array" || depth[a] === "object")) {
                                destructfix(true, true);
                            }
                            if (depth[a] === "object") {
                                if (destruct[destruct.length - 1] === true && types[begin[a] - 1] !== "word" && token[begin[a] - 1] !== "(" && token[begin[a] - 1] !== "x(") {
                                    (function jspretty__beautify_separator_objDestruct() {
                                        var aa = 0,
                                            bb = 0;
                                        for (aa = a - 1; aa > -1; aa = aa - 1) {
                                            if (types[aa] === "end") {
                                                bb = bb + 1;
                                            } else if (types[aa] === "start") {
                                                bb = bb - 1;
                                            }
                                            if (bb < 0 || (bb === 0 && token[aa] === ",")) {
                                                return;
                                            }
                                            if (bb === 0 && token[aa] === ":") {
                                                return destructfix(true, false);
                                            }
                                        }
                                    }());
                                }
                            }
                            if (types[a - 1] === "word" && token[a - 2] === "for") {
                                //This is for Volt templates
                                return level.push(-10);
                            }
                            if (destruct[destruct.length - 1] === false || (token[a - 2] === "+" && ltype === "literal" && level[a - 2] > 0 && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'"))) {
                                if (depth[a] === "method") {
                                    if (token[a - 2] === "+" && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'") && (token[a - 3].charAt(0) === "\"" || token[a - 3].charAt(0) === "'")) {
                                        return level.push(indent + 2);
                                    }
                                    if (token[a - 2] !== "+") {
                                        return level.push(-10);
                                    }
                                }
                                return level.push(indent);
                            }
                            if (list[list.length - 1] === true) {
                                if (assignlist[assignlist.length - 1] === true && varline[varline.length - 1] === false) {
                                    assignlist[assignlist.length - 1] = false;
                                    varlen[varlen.length - 1]         = [];
                                }
                                return (function jspretty__beautify_separator_inList() {
                                    var c = 0,
                                        d = 0;
                                    for (c = a - 1; c > -1; c = c - 1) {
                                        if (types[c] === "end") {
                                            d = d + 1;
                                        }
                                        if (types[c] === "start") {
                                            d = d - 1;
                                        }
                                        if (d === -1) {
                                            if (token[c] === "[" && token[c + 1] !== "]" && token[c + 2] !== "]") {
                                                if (destruct[destruct.length - 1] === false || arrbreak[arrbreak.length - 1] === true) {
                                                    level[c] = indent;
                                                } else if (methtest === false && destruct[destruct.length - 1] === true) {
                                                    level[c] = -20;
                                                }
                                                if (token[a - 2] === "+" && ltype === "literal" && level[a - 2] > 0 && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'")) {
                                                    for (d = a - 2; d > c; d = d - 2) {
                                                        if (token[d] !== "+") {
                                                            return;
                                                        }
                                                        if (token[d - 1].charAt(0) !== "\"" && token[d - 1].charAt(0) !== "'") {
                                                            level[d] = -10;
                                                        }
                                                    }
                                                    return;
                                                }
                                            }
                                            if (arrbreak[arrbreak.length - 1] === true) {
                                                return level.push(indent);
                                            }
                                            return level.push(-10);
                                        }
                                    }
                                    if (arrbreak[arrbreak.length - 1] === true) {
                                        return level.push(indent);
                                    }
                                    return level.push(-10);
                                }());
                            }
                            if (varline[varline.length - 1] === true && token[begin[a] - 1] !== "for") {
                                if (ltoke !== "]") {
                                    (function jspretty__beautify_separator_varline() {
                                        var c     = 0,
                                            brace = false;
                                        for (c = a - 1; c > -1; c = c - 1) {
                                            if (token[c] === "]") {
                                                brace = true;
                                            }
                                            if (types[c] === "start") {
                                                if (token[c] === "[" && token[c + 1] !== "]" && brace === false) {
                                                    level[c] = indent;
                                                }
                                                return;
                                            }
                                        }
                                    }());
                                }
                                if (ltype === "literal" && token[a - 2] === "+" && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'")) {
                                    return level.push(indent);
                                }
                                return level.push(indent);
                            }
                            if (destruct[destruct.length - 1] === true && depth[a] !== "object") {
                                return level.push(-10);
                            }
                            return level.push(indent);
                        }
                        if (ctoke === ";" || ctoke === "x;") {
                            endExtraInd();
                            if (token[begin[a] - 1] !== "for") {
                                destructfix(false, false);
                            }
                            wordlist[wordlist.length - 1] = false;
                            if (ctoke === "x;") {
                                scolon = scolon + 1;
                            }
                            level[a - 1] = -20;
                            if (varline[varline.length - 1] === true) {
                                varline[varline.length - 1] = false;
                                if (depth[a] !== "method" && varlen.length > 0 && varlen[varlen.length - 1].length > 1) {
                                    varlist.push(varlen[varlen.length - 1]);
                                }
                                varlen[varlen.length - 1] = [];
                                (function jspretty__beautify_separator_varlinefix() {
                                    var c = 0,
                                        d = 0;
                                    for (c = a - 1; c > -1; c = c - 1) {
                                        if (types[c] === "start") {
                                            d = d + 1;
                                        }
                                        if (types[c] === "end") {
                                            d = d - 1;
                                        }
                                        if (d > 0) {
                                            return;
                                        }
                                        if (d === 0) {
                                            if (token[c] === "var" || token[c] === "let" || token[c] === "const") {
                                                return;
                                            }
                                            if (token[c] === ",") {
                                                indent = indent - 1;
                                                return;
                                            }
                                        }
                                    }
                                }());
                            }
                            if (begin[a] > 0 && token[begin[a] - 1] === "for" && depth[a] !== "for") {
                                return level.push(-10);
                            }
                            return level.push(indent);
                        }
                    },
                    start         = function jspretty__beautify_start() {
                        var deep   = depth[a],
                            deeper = (a === 0)
                                ? depth[a]
                                : depth[a - 1];
                        if (ltoke === ")" || ((deeper === "object" || deeper === "array") && ltoke !== "]")) {
                            if (deep !== "method" || (deep === "method" && token[a + 1] !== ")" && token[a + 2] !== ")")) {
                                if (ltoke === ")" && (deep !== "function" || token[begin[begin[a - 1] - 1]] === "(" || token[begin[begin[a - 1] - 1]] === "x(")) {
                                    destructfix(false, false);
                                } else if (types[a + 1] !== "end" && types[a + 2] !== "end") {
                                    destructfix(true, false);
                                }
                            }
                        }
                        list.push(false);
                        extraindent.push([]);
                        assignlist.push(false);
                        arrbreak.push(false);
                        wordlist.push(false);
                        itemcount.push(0);
                        varlen.push([]);
                        if (options.neverflatten === true || options.qml === true || deep === "attribute" || ltype === "generic" || (deep === "class" && ltoke !== "(" && ltoke !== "x(") || (ctoke === "[" && token[a + 1] === "function")) {
                            destruct.push(false);
                        } else {
                            if (deep === "expression" || deep === "method") {
                                destruct.push(true);
                            } else if ((deep === "object" || deep === "class") && (ltoke === "(" || ltoke === "x(" || ltype === "word")) {
                                //array or object literal following `return` or `(`
                                destruct.push(true);
                            } else if (deep === "array" || ctoke === "(" || ctoke === "x(") {
                                //array, method, paren
                                destruct.push(true);
                            } else if (ctoke === "{" && deep === "object" && ltype !== "operator" && ltype !== "start" && ltype !== "literal" && deeper !== "object" && deeper !== "array" && a > 0) {
                                //curly brace not in a list and not assigned
                                destruct.push(true);
                            } else {
                                //not destructured (multiline)
                                destruct.push(false);
                            }
                        }
                        if (ctoke !== "(" && ctoke !== "x(" && depth[a] !== "attribute") {
                            //if (ctoke !== "[" || (ctoke === "[" && token[a + 1] !== "(")) {
                                indent = indent + 1;
                            //}
                        }
                        if (ctoke === "{" || ctoke === "x{") {
                            if (ctoke === "{") {
                                varline.push(false);
                            }
                            if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline") {
                                if (ltype === "markup") {
                                    level[a - 1] = indent;
                                } else if (options.braces === true && ltype !== "operator" && ltoke !== "return") {
                                    level[a - 1] = indent - 1;
                                } else if (deep === "function" || ltoke === ")" || ltoke === "x)" || ltoke === "," || ltoke === "}" || ltype === "markup") {
                                    level[a - 1] = -10;
                                } else if (ltoke === "{" || ltoke === "x{" || ltoke === "[" || ltoke === "}" || ltoke === "x}") {
                                    level[a - 1] = indent - 1;
                                }
                            }
                            if (deep === "object") {
                                if (options.formatObject === "indent") {
                                    destruct[destruct.length - 1] = false;
                                    return level.push(indent);
                                }
                                if (options.formatObject === "inline") {
                                    destruct[destruct.length - 1] = true;
                                    return level.push(-20);
                                }
                            }
                            if (deep === "switch") {
                                if (options.nocaseindent === true) {
                                    return level.push(indent - 1);
                                }
                                indent = indent + 1;
                                return level.push(indent);
                            }
                            if (destruct[destruct.length - 1] === true) {
                                if (ltype !== "word") {
                                    return level.push(-20);
                                }
                            }
                            return level.push(indent);
                        }
                        if (ctoke === "(" || ctoke === "x(") {
                            if (ltoke === "-" && (token[a - 2] === "(" || token[a - 2] === "x(")) {
                                level[a - 2] = -20;
                            }
                            // the start of scope, at least for counting, is pushed back from the opening of
                            // the block to the paranthesis containing arguments so that the arguments can
                            // be tagged as variables of the coming scope
                            if (options.jsscope !== "none" || options.mode === "minify") {
                                // a 0 is pushed into the start of scope, but this number is updated in the
                                // "end" function to indicate the index where the scope ends
                                if (ltoke === "function" || token[a - 2] === "function") {
                                    meta[meta.length - 1] = 0;
                                }
                            }
                            if (ltype === "end" && deeper !== "if" && deeper !== "for" && deeper !== "catch" && deeper !== "else" && deeper !== "do" && deeper !== "try" && deeper !== "finally" && deeper !== "catch") {
                                if (types[a - 1] === "comment" || types[a - 1] === "comment-inline") {
                                    level[a - 1] = indent;
                                } else {
                                    level[a - 1] = -20;
                                }
                            }
                            if (ltoke === "async") {
                                level[a - 1] = -10;
                            } else if (deep === "method" || (token[a - 2] === "function" && ltype === "word")) {
                                if (ltoke === "import" || ltoke === "in" || options.functionname === true) {
                                    level[a - 1] = -10;
                                } else if ((ltoke === "}" && depth[a - 1] === "function") || ltype === "word") {
                                    level[a - 1] = -20;
                                } else if (deeper !== "method" && deep !== "method") {
                                    level[a - 1] = indent;
                                }
                            }
                            if (ltoke === "+" && (token[a - 2].charAt(0) === "\"" || token[a - 2].charAt(0) === "'")) {
                                return level.push(indent);
                            }
                            if (ltoke === "}" || ltoke === "x}") {
                                return level.push(-20);
                            }
                            if ((ltoke === "-" && (a < 2 || (token[a - 2] !== ")" && token[a - 2] !== "x)" && token[a - 2] !== "]" && types[a - 2] !== "word" && types[a - 2] !== "literal"))) || (options.space === false && ltoke === "function")) {
                                level[a - 1] = -20;
                            }
                            return level.push(-20);
                        }
                        if (ctoke === "[") {
                            if (ltoke === "[") {
                                list[list.length - 2] = true;
                            }
                            if (ltoke === "return" || ltoke === "var" || ltoke === "let" || ltoke === "const") {
                                level[a - 1] = -10;
                            } else if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline" && depth[a - 1] !== "attribute" && (ltype === "end" || ltype === "word")) {
                                level[a - 1] = -20;
                            } else if (ltoke !== "{" && (ltoke === "[" || ltoke === "{" || ltoke === "x{")) {
                                level[a - 1] = indent - 1;
                            }
                            if (depth[a] === "attribute") {
                                return level.push(-20);
                            }
                            if (options.formatArray === "indent") {
                                destruct[destruct.length - 1] = false;
                                return level.push(indent);
                            }
                            if (options.formatArray === "inline") {
                                destruct[destruct.length - 1] = true;
                                return level.push(-20);
                            }
                            if (deep === "method" || destruct[destruct.length - 1] === true) {
                                return level.push(-20);
                            }
                            return (function jspretty__beautify_start_squareBrace() {
                                var c = 0;
                                for (c = a + 1; c < b; c = c + 1) {
                                    if (token[c] === "]") {
                                        return level.push(-20);
                                    }
                                    if (token[c] === ",") {
                                        return level.push(indent);
                                    }
                                }
                                return level.push(-20);
                            }());
                        }
                    },
                    end           = function jspretty__beautify_end() {
                        var ei = (extraindent[extraindent.length - 1] === undefined)
                            ? []
                            : extraindent[extraindent.length - 1];
                        if (ctoke === ")" && token[a + 1] === "." && ei[ei.length - 1] > -1 && token[ei[0]] !== ":") {
                            (function jspretty__beautify_end_brokenParen() {
                                var c = begin[a],
                                    d = false,
                                    e = false;
                                do {
                                    c = c - 1;
                                } while (c > 0 && level[c] < -9);
                                d = (level[c] === indent);
                                c = a + 1;
                                do {
                                    c = c + 1;
                                    if (token[c] === "{") {
                                        e = true;
                                        break;
                                    }
                                    if (begin[c] === begin[a + 1] && (types[c] === "separator" || types[c] === "end")) {
                                        break;
                                    }
                                } while (c < b);
                                if (d === false && e === true && extraindent.length > 1) {
                                    extraindent[extraindent.length - 2].push(begin[a]);
                                    indent = indent + 1;
                                }
                            }());
                        }
                        if (token[a + 1] === "," && (depth[a] === "object" || depth[a] === "array")) {
                            destructfix(true, false);
                        }
                        if ((token[a + 1] === "}" || token[a + 1] === "]") && (depth[a] === "object" || depth[a] === "array") && token[begin[a] - 1] === ",") {
                            destructfix(true, false);
                        }
                        if (depth[a] !== "attribute") {
                            if (ctoke !== ")" && ctoke !== "x)" && (ltype !== "markup" || (ltype === "markup" && token[a - 2] !== "return"))) {
                                indent = indent - 1;
                            }
                            if (ctoke === "}" && depth[a] === "switch" && options.nocaseindent === false) {
                                indent = indent - 1;
                            }
                        }
                        if (ctoke === "}" || ctoke === "x}") {
                            if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline" && ltoke !== "{" && ltoke !== "x{" && ltype !== "end" && ltype !== "literal" && ltype !== "separator" && ltoke !== "++" && ltoke !== "--" && varline[varline.length - 1] === false && (a < 2 || token[a - 2] !== ";" || token[a - 2] !== "x;" || ltoke === "break" || ltoke === "return")) {
                                (function jspretty__beautify_end_curlyBrace() {
                                    var c       = 0,
                                        d       = 1,
                                        assign  = false,
                                        listlen = list.length;
                                    for (c = a - 1; c > -1; c = c - 1) {
                                        if (types[c] === "end") {
                                            d = d + 1;
                                        }
                                        if (types[c] === "start") {
                                            d = d - 1;
                                        }
                                        if (d === 1) {
                                            if (token[c] === "=" || token[c] === ";" || token[c] === "x;") {
                                                assign = true;
                                            }
                                            if (c > 0 && token[c] === "return" && (token[c - 1] === ")" || token[c - 1] === "x)" || token[c - 1] === "{" || token[c - 1] === "x{" || token[c - 1] === "}" || token[c - 1] === "x}" || token[c - 1] === ";" || token[c - 1] === "x;")) {
                                                indent       = indent - 1;
                                                level[a - 1] = indent;
                                                return;
                                            }
                                            if ((token[c] === ":" && ternary.length === 0) || (token[c] === "," && assign === false && varline[varline.length - 1] === false)) {
                                                return;
                                            }
                                            if ((c === 0 || token[c - 1] === "{" || token[c - 1] === "x{") || token[c] === "for" || token[c] === "if" || token[c] === "do" || token[c] === "function" || token[c] === "while" || token[c] === "var" || token[c] === "let" || token[c] === "const" || token[c] === "with") {
                                                if (list[listlen - 1] === false && listlen > 1 && (a === b - 1 || (token[a + 1] !== ")" && token[a + 1] !== "x)")) && depth[a] !== "object") {
                                                    indent = indent - 1;
                                                }
                                                if (varline[varline.length - 1] === true) {
                                                    indent = indent - 1;
                                                }
                                                return;
                                            }
                                        }
                                    }
                                }());
                            }
                            //this is the bulk of logic identifying scope start and end
                            if (depth[a] === "function" && (options.jsscope !== "none" || options.mode === "minify")) {
                                (function jspretty__beautify_end_jsscope() {
                                    var c     = 0,
                                        d     = 1,
                                        build = [],
                                        paren = false;
                                    for (c = a - 1; c > -1; c = c - 1) {
                                        if (types[c] === "end") {
                                            d = d + 1;
                                        } else if (types[c] === "start") {
                                            d = d - 1;
                                        }
                                        if (d < 0) {
                                            return;
                                        }
                                        if (meta[c] === "v" && token[c] !== build[build.length - 1]) {
                                            build.push(token[c]);
                                        } else if (d === 1 && token[c] === ")") {
                                            paren = true;
                                        } else if (d === 1 && paren === true && types[c] === "word" && token[c] !== build[build.length - 1]) {
                                            build.push(token[c]);
                                        }
                                        if (c === lettest) {
                                            meta[c] = a - 1;
                                            if (token[c] === "let" || token[c] === "const") {
                                                meta[meta.length - 2] = [build, true];
                                            }
                                            build   = [];
                                            lettest = -1;
                                        }
                                        if (c > 0 && token[c - 1] === "function" && types[c] === "word" && token[c] !== build[build.length - 1]) {
                                            build.push(token[c]);
                                        }
                                        if (d === 0) {
                                            if (token[c] === "function") {
                                                if (types[c + 1] === "word") {
                                                    meta[c + 2] = a;
                                                } else {
                                                    meta[c + 1] = a;
                                                }
                                                meta[meta.length - 1] = [build, false];
                                                return;
                                            }
                                        }
                                    }
                                }());
                            }
                        }
                        if (options.bracepadding === false && ctoke !== "}" && ltype !== "markup") {
                            level[a - 1] = -20;
                        }
                        if (options.bracepadding === true && ltype !== "start" && ltoke !== ";" && (level[begin[a]] < -9 || destruct[destruct.length - 1] === true)) {
                            level[begin[a]] = -10;
                            level[a - 1]    = -10;
                            level.push(-20);
                        } else if (options.qml === true) {
                            if (ltype === "start" || ctoke === ")" || ctoke === "x)") {
                                level[a - 1] = -20;
                            } else {
                                level[a - 1] = indent;
                            }
                            level.push(indent);
                        } else if (depth[a] === "attribute") {
                            level[a - 1] = -20;
                            level.push(indent);
                        } else if (depth[a] === "array" && (ei.length > 0 || arrbreak[arrbreak.length - 1] === true)) {
                            endExtraInd();
                            destruct[destruct.length - 1] = false;
                            level[begin[a]]               = indent + 1;
                            level[a - 1]                  = indent;
                            level.push(-20);
                        } else if ((depth[a] === "object" || (begin[a] === 0 && ctoke === "}")) && ei.length > 0) {
                            endExtraInd();
                            destruct[destruct.length - 1] = false;
                            level[begin[a]]               = indent + 1;
                            level[a - 1]                  = indent;
                            level.push(-20);
                        } else if (ctoke === ")" || ctoke === "x)") {
                            if (options.wrap > 0 && ctoke === ")") {
                                (function jspretty__beautify_end_parenWrap() {
                                    var len   = 0,
                                        aa    = 0,
                                        short = 0,
                                        first = 0,
                                        inc   = 0,
                                        comma = false,
                                        array = false,
                                        wrap  = options.wrap,
                                        open  = begin[a],
                                        ind   = (indent + 1),
                                        exl   = ei.length,
                                        ready = false,
                                        mark  = false,
                                        tern  = false;
                                    if (level[open] < -9) {
                                        aa = open;
                                        do {
                                            aa = aa + 1;
                                        } while (aa < a && level[aa] < -9);
                                        first = aa;
                                        do {
                                            len = len + token[aa].length;
                                            if (level[aa] === -10) {
                                                len = len + 1;
                                            }
                                            if (token[aa] === "(" && short > 0 && short < wrap - 1 && first === a) {
                                                short = -1;
                                            }
                                            if (token[aa] === ")") {
                                                inc = inc - 1;
                                            } else if (token[aa] === "(") {
                                                inc = inc + 1;
                                            }
                                            if (aa === open && inc > 0) {
                                                short = len;
                                            }
                                            aa = aa - 1;
                                        } while (aa > 0 && level[aa] < -9);
                                        if (token[aa + 1] === ".") {
                                            ind = level[aa] + 1;
                                        }
                                        if (len > wrap - 1 && ltoke !== "(" && short !== -1 && destruct[destruct.length - 2] === false) {
                                            if ((token[open - 1] === "if" && list[list.length - 1] === true) || token[open - 1] !== "if") {
                                                level[open] = ind;
                                                if (token[open - 1] === "for") {
                                                    aa = open;
                                                    do {
                                                        aa = aa + 1;
                                                        if (token[aa] === ";" && begin[aa] === open) {
                                                            level[aa] = ind;
                                                        }
                                                    } while (aa < a);
                                                }
                                            }
                                        }
                                    }
                                    aa  = a;
                                    len = 0;
                                    do {
                                        aa = aa - 1;
                                        if (depth[aa] === "function") {
                                            aa = begin[aa];
                                        } else if (begin[aa] === open) {
                                            if (token[aa] === "?") {
                                                tern = true;
                                            } else if (token[aa] === "," && comma === false) {
                                                comma = true;
                                                if (len >= wrap) {
                                                    ready = true;
                                                }
                                            } else if (types[aa] === "markup" && mark === false) {
                                                mark = true;
                                            }
                                            if (level[aa] > -9 && token[aa] !== "," && types[aa] !== "markup") {
                                                len = 0;
                                            } else {
                                                if (level[aa] === -10) {
                                                    len = len + 1;
                                                }
                                                len = len + token[aa].length;
                                                if (len >= wrap && (comma === true || mark === true)) {
                                                    ready = true;
                                                }
                                            }
                                        } else {
                                            if (level[aa] > -9) {
                                                len = 0;
                                            } else {
                                                len = len + token[aa].length;
                                                if (len >= wrap && (comma === true || mark === true)) {
                                                    ready = true;
                                                }
                                            }
                                        }
                                    } while (aa > open && ready === false);
                                    if (((comma === true || mark === true) && len >= wrap) || level[open] > -9) {
                                        if (tern === true) {
                                            ind = level[open];
                                            if (token[open - 1] === "[") {
                                                aa = a;
                                                do {
                                                    aa = aa + 1;
                                                    if (types[aa] === "end" || token[aa] === "," || token[aa] === ";") {
                                                        break;
                                                    }
                                                } while (aa < b);
                                                if (token[aa] === "]") {
                                                    ind = ind - 1;
                                                    array = true;
                                                }
                                            }
                                        } else if (exl > 0 && ei[exl - 1] > aa) {
                                            ind = ind - exl;
                                        }
                                        destruct[destruct.length - 1] = false;
                                        aa = a;
                                        do {
                                            aa = aa - 1;
                                            if (begin[aa] === open) {
                                                if (token[aa].indexOf("=") > -1 && types[aa] === "operator" && token[aa].indexOf("!") < 0 && token[aa].indexOf("==") < 0 && token[aa] !== "<=" && token[aa].indexOf(">") < 0) {
                                                    len = aa;
                                                    do {
                                                        len = len - 1;
                                                        if (begin[len] === open && (token[len] === ";" || token[len] === "," || len === open)) {
                                                            break;
                                                        }
                                                    } while (len > open);
                                                    if (token[len] !== ";" && varlen.length > 0) {
                                                        varlen[varlen.length - 1].push(aa - 1);
                                                    }
                                                } else if (token[aa] === ",") {
                                                    level[aa] = ind;
                                                } else if (level[aa] > -9 && array === false && (token[open - 1] !== "for" || token[aa + 1] === "?" || token[aa + 1] === ":") && (token[begin[a]] !== "(" || token[aa] !== "+")) {
                                                    level[aa] = level[aa] + 1;
                                                }
                                            } else if (level[aa] > -9 && array === false) {
                                                level[aa] = level[aa] + 1;
                                            }
                                        } while (aa > open);
                                        level[open]  = ind;
                                        level[a - 1] = ind - 1;
                                    } else {
                                        level[a - 1] = -20;
                                    }
                                }());
                                if (token[begin[a] - 1] === "+" && level[begin[a]] > -9) {
                                    level[begin[a] - 1] = -10;
                                }
                            } else {
                                level[a - 1] = -20;
                            }
                            level.push(-20);
                        } else if (destruct[destruct.length - 1] === true) {
                            if (ctoke === "]" && begin[a] - 1 > 0 && token[begin[begin[a] - 1]] === "[") {
                                destruct[destruct.length - 2] = false;
                            }
                            if (begin[a] < level.length) {
                                level[begin[a]] = -20;
                            }
                            level[a - 1] = -20;
                            level.push(-20);
                        } else if ((types[a - 1] === "comment" && token[a - 1].substr(0, 2) === "//") || types[a - 1] === "comment-inline") {
                            if (token[a - 2] === "x}") {
                                level[a - 3] = indent + 1;
                            }
                            level[a - 1] = indent;
                            level.push(-20);
                        } else if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline" && ((ltoke === "{" && ctoke === "}") || (ltoke === "[" && ctoke === "]"))) {
                            level[a - 1] = -20;
                            if (ctoke === "}" && options.titanium === true) {
                                level.push(indent);
                            } else {
                                level.push(-20);
                            }
                        } else if (ctoke === "]") {
                            if ((list[list.length - 1] === true && destruct[destruct.length - 1] === false) || (ltoke === "]" && level[a - 2] === indent + 1)) {
                                level[a - 1]    = indent;
                                level[begin[a]] = indent + 1;
                            } else if (level[a - 1] === -10) {
                                level[a - 1] = -20;
                            }
                            if (token[begin[a] + 1] === "function") {
                                level[a - 1] = indent;
                            } else if (list[list.length - 1] === false) {
                                if (ltoke === "}" || ltoke === "x}") {
                                    level[a - 1] = indent;
                                }
                                (function jspretty__beautify_end_squareBrace() {
                                    var c = 0,
                                        d = 1;
                                    for (c = a - 1; c > -1; c = c - 1) {
                                        if (token[c] === "]") {
                                            d = d + 1;
                                        }
                                        if (token[c] === "[") {
                                            d = d - 1;
                                            if (d === 0) {
                                                if (c > 0 && (token[c + 1] === "{" || token[c + 1] === "x{" || token[c + 1] === "[")) {
                                                    level[c] = indent + 1;
                                                    return;
                                                }
                                                if (token[c + 1] !== "[" || lastlist === false) {
                                                    level[c] = -20;
                                                    return;
                                                }
                                                return;
                                            }
                                        }
                                        if (d === 1 && token[c] === "+" && level[c] > 1) {
                                            level[c] = level[c] - 1;
                                        }
                                    }
                                }());
                            }
                            level.push(-20);
                        } else if (ctoke === "}" || ctoke === "x}" || list[list.length - 1] === true) {
                            if (ctoke === "}" && ltoke === "x}" && token[a + 1] === "else") {
                                level[a - 2] = indent + 2;
                                level.push(-20);
                            } else {
                                level.push(indent);
                            }
                            level[a - 1] = indent;
                        } else {
                            level.push(-20);
                        }
                        endExtraInd();
                        lastlist = list[list.length - 1];
                        list.pop();
                        extraindent.pop();
                        arrbreak.pop();
                        itemcount.pop();
                        if (ctoke === "}" || (ctoke === ")" && level[a - 1] > -9)) {
                            if (varline[varline.length - 1] === true || ltoke !== "{" || token[begin[a] - 2] === "interface") {
                                if (varlen.length > 0 && varlen[varlen.length - 1].length > 1 && destruct[destruct.length - 1] === false) {
                                    varlist.push(varlen[varlen.length - 1]);
                                }
                            }
                            if (ctoke === "}") {
                                varline.pop();
                            }
                        }
                        wordlist.pop();
                        varlen.pop();
                        destruct.pop();
                        assignlist.pop();
                    },
                    operator      = function jspretty__beautify_operator() {
                        var ei = (extraindent[extraindent.length - 1] === undefined)
                            ? []
                            : extraindent[extraindent.length - 1];
                        if (ei.length > 0 && ei[ei.length - 1] > -1 && depth[a] === "array") {
                            arrbreak[arrbreak.length - 1] = true;
                        }
                        if (ctoke !== ":") {
                            if (token[begin[a]] !== "(" && token[begin[a]] !== "x(" && destruct.length > 0) {
                                destructfix(true, false);
                            }
                            if (ctoke !== "?" && token[ei[ei.length - 1]] === ".") {
                                (function jspretty__beautify_operator_question() {
                                    var c = a,
                                        d = begin[c],
                                        e = 0;
                                    do {
                                        if (begin[c] === d) {
                                            if (token[c + 1] === "{" || token[c + 1] === "[" || token[c] === "function") {
                                                return;
                                            }
                                            if (token[c] === "," || token[c] === ";" || types[c] === "end" || token[c] === ":") {
                                                ei.pop();
                                                indent = indent - 1;
                                                return;
                                            }
                                            if (token[c] === "?" || token[c] === ":") {
                                                if (token[ei[ei.length - 1]] === "." && e < 2) {
                                                    ei[ei.length - 1] = d + 1;
                                                }
                                                return;
                                            }
                                            if (token[c] === ".") {
                                                e = e + 1;
                                            }
                                        }
                                        c = c + 1;
                                    } while (c < b);
                                }());
                            }
                        }
                        if (ctoke === "!" || ctoke === "...") {
                            if (ltoke === "}" || ltoke === "x}") {
                                level[a - 1] = indent;
                            }
                            return level.push(-20);
                        }
                        if (ltoke === ";" || ltoke === "x;") {
                            if (token[begin[a] - 1] !== "for") {
                                level[a - 1] = indent;
                            }
                            return level.push(-20);
                        }
                        if (ctoke === "*") {
                            if (ltoke === "function" || ltoke === "yield") {
                                level[a - 1] = -20;
                            } else {
                                level[a - 1] = -10;
                            }
                            return level.push(-10);
                        }
                        if (ctoke === "?") {
                            if (lines[a] === 0 && types[a - 2] === "word" && token[a - 2] !== "return" && token[a - 2] !== "in" && token[a - 2] !== "instanceof" && token[a - 2] !== "typeof" && ltype === "word") {
                                if (types[a + 1] === "word" || ((token[a + 1] === "(" || token[a + 1] === "x(") && token[a - 2] === "new")) {
                                    level[a - 1] = -20;
                                    if (types[a + 1] === "word") {
                                        return level.push(-10);
                                    }
                                    return level.push(-20);
                                }
                            }
                            if (token[a + 1] === ":") {
                                level[a - 1] = -20;
                                return level.push(-20);
                            }
                            if (options.ternaryline === true) {
                                level[a - 1] = -10;
                            } else {
                                (function jspretty__beautify_operator_ternObj() {
                                    var c = a - 1;
                                    do {
                                        c = c - 1;
                                    } while (c > -1 && level[c] < -9);
                                    ei.push(a);
                                    ternary.push(a);
                                    indent = indent + 1;
                                    if (level[c] === indent && token[c + 1] !== ":") {
                                        indent = indent + 1;
                                        ei.push(a);
                                    }
                                    level[a - 1] = indent;
                                    if (token[begin[a]] === "(" && (ei.length < 2 || ei[0] === ei[1])) {
                                        destruct[destruct.length - 1] = false;
                                        if (a - 2 === begin[a]) {
                                            level[begin[a]] = indent - 1;
                                        } else {
                                            level[begin[a]] = indent;
                                        }
                                        c = a - 2;
                                        do {
                                            if (types[c] === "end" && level[c - 1] > -1) {
                                                break;
                                            }
                                            if (level[c] > -1) {
                                                level[c] = level[c] + 1;
                                            }
                                            c = c - 1;
                                        } while (c > begin[a]);
                                    }
                                }());
                            }
                        }
                        if (ctoke === ":") {
                            if (token[a - 2] === "where" && depth[a - 2] === depth[a]) {
                                level[a - 1] = -10;
                                return level.push(-10);
                            }
                            if ((token[a - 2] === "var" || token[a - 2] === "let" || token[a - 2] === "const" || token[a - 2] === "," || (depth[a] === "global" && options.jsx === true && ternary.length < 1)) && ltype === "word" && token[begin[a]] !== "(" && token[begin[a]] !== "x(") {
                                level[a - 1] = -20;
                                if (depth[a] === "object" || (varline[varline.length - 1] === true && token[begin[a]] !== "(" && token[begin[a]] !== "x(")) {
                                    if (varlen.length > 0 && varlen[varlen.length - 1].length > 0 && token[varlen[varlen.length - 1][varlen[varlen.length - 1].length - 1] + 1] !== ctoke) {
                                        if (varlen[varlen.length - 1].length > 1) {
                                            varlist.push(varlen[varlen.length - 1]);
                                        }
                                        varlen[varlen.length - 1] = [];
                                    }
                                    varlen[varlen.length - 1].push(a - 1);
                                }
                                return level.push(-10);
                            }
                            if ((ltoke === ")" || ltoke === "x)") && token[begin[a - 1] - 2] === "function") {
                                level[a - 1] = -20;
                                return level.push(-10);
                            }
                            if (depth[a] === "attribute") {
                                level[a - 1] = -20;
                                return level.push(-10);
                            }
                            if (token[begin[a]] !== "(" && token[begin[a]] !== "x(" && (ltype === "word" || ltoke === ")" || ltoke === "]" || ltoke === "?") && (depth[a] === "map" || depth[a] === "class" || types[a + 1] === "word") && (ternary.length === 0 || ternary[ternary.length - 1] < begin[a]) && ("mapclassexpressionmethodglobalparen".indexOf(depth[a]) > -1 || (types[a - 2] === "word" && depth[a] !== "switch"))) {
                                level[a - 1] = -20;
                                varlen[varlen.length - 1].push(a - 1);
                                return level.push(-10);
                            }
                            if (depth[a] === "switch" && (ternary.length < 1 || ternary[ternary.length - 1] < begin[a])) {
                                level[a - 1] = -20;
                                return level.push(indent);
                            }
                            if (ternary.length > 0 && ternary[ternary.length - 1] > begin[a]) {
                                (function jspretty_beautify_operator_colon() {
                                    var c = a,
                                        d = begin[a];
                                    do {
                                        c = c - 1;
                                        if (begin[c] === d) {
                                            if (token[c] === "," || token[c] === ";") {
                                                level[a - 1] = -20;
                                                return;
                                            }
                                            if (token[c] === "?") {
                                                ternary.pop();
                                                return endExtraInd();
                                            }
                                        }
                                    } while (c > d);
                                }());
                            } else if (depth[a] === "object") {
                                level[a - 1] = -20;
                                varlen[varlen.length - 1].push(a - 1);
                            } else if (ternary.length > 0) {
                                level[a - 1] = indent;
                            } else {
                                level[a - 1] = -10;
                            }
                            return level.push(-10);
                        }
                        if (ctoke === "++" || ctoke === "--") {
                            if (ltype === "literal" || ltype === "word") {
                                level[a - 1] = -20;
                                level.push(-10);
                            } else if (a < b - 1 && (types[a + 1] === "literal" || types[a + 1] === "word")) {
                                level.push(-20);
                            } else {
                                level.push(-10);
                            }
                            return;
                        }
                        if (ctoke === "+") {
                            if (ltype === "start") {
                                level[a - 1] = -20;
                            } else {
                                level[a - 1] = -10;
                            }
                            if (options.wrap < 1 || token[begin[a]] === "x(") {
                                return level.push(-10);
                            }
                            return (function jspretty__beautify_operator_plus() {
                                var line = 0,
                                    next = 0,
                                    c    = a,
                                    ind  = indent + 2,
                                    aa   = token[a + 1],
                                    meth = 0;
                                if (aa === undefined) {
                                    return level.push(-10);
                                }
                                if (types[a - 1] === "operator" || types[a - 1] === "start") {
                                    if (types[a + 1] === "word" || aa === "(" || aa === "[") {
                                        return level.push(-20);
                                    }
                                    if (isNaN(aa.slice(1, -1)) === false && ((/\d/).test(aa.charAt(1)) === true || aa.charAt(1) === "." || aa.charAt(1) === "-" || aa.charAt(1) === "+")) {
                                        return level.push(-20);
                                    }
                                }
                                do {
                                    c = c - 1;
                                    if (token[begin[a]] === "(") {
                                        if (c === begin[a]) {
                                            meth = line;
                                        }
                                        if (token[c] === "," && begin[c] === begin[a] && list[list.length - 1] === true) {
                                            break;
                                        }
                                    }
                                    if (line > options.wrap - 1) {
                                        break;
                                    }
                                    if (level[c] > -9) {
                                        break;
                                    }
                                    if (types[c] === "operator" && token[c] !== "=" && token[c] !== "+" && begin[c] === begin[a]) {
                                        break;
                                    }
                                    line = line + token[c].length;
                                    if (c === begin[a] && token[c] === "[" && line < options.wrap - 1) {
                                        break;
                                    }
                                    if (token[c] === "." && level[c] > -9) {
                                        break;
                                    }
                                    if (level[c] === -10) {
                                        line = line + 1;
                                    }
                                } while (c > 0);
                                if (meth > 0) {
                                    meth = meth + aa.length;
                                }
                                line = line + aa.length;
                                next = c;
                                if (line > options.wrap - 1 && level[c] < -9) {
                                    do {
                                        next = next - 1;
                                    } while (next > 0 && level[next] < -9);
                                }
                                if (token[next + 1] === "." && begin[a] <= begin[next]) {
                                    ind = ind + 1;
                                } else if (token[next] === "+") {
                                    ind = level[next];
                                }
                                next = aa.length;
                                if (line + next < options.wrap) {
                                    level.push(-10);
                                } else {
                                    if (token[begin[a]] === "(" && (token[ei[0]] === ":" || token[ei[0]] === "?")) {
                                        ind = indent + 3;
                                    } else if (depth[a] === "method") {
                                        level[begin[a]] = indent;
                                        if (list[list.length - 1] === true) {
                                            ind = indent + 3;
                                        } else {
                                            ind = indent + 1;
                                        }
                                    } else if (depth[a] === "object" || depth[a] === "array") {
                                        destructfix(true, false);
                                    }
                                    if (token[c] === "var" || token[c] === "let" || token[c] === "const") {
                                        line = line - (options.insize * options.inchar.length * 2);
                                    }
                                    if (meth > 0) {
                                        c = options.wrap - meth;
                                    } else {
                                        c = options.wrap - line;
                                    }
                                    if (c > 0 && c < 5) {
                                        level.push(ind);
                                        if (token[a].charAt(0) === "\"" || token[a].charAt(0) === "'") {
                                            a = a + 1;
                                            if (token[a].length > options.wrap) {
                                                strwrap(0);
                                            } else {
                                                level.push(-10);
                                            }
                                        }
                                    } else if (token[begin[a]] !== "(" || meth > options.wrap - 1 || meth === 0) {
                                        if (meth > 0) {
                                            line = meth;
                                        }
                                        if (line - aa.length < options.wrap - 1 && (aa.charAt(0) === "\"" || aa.charAt(0) === "'")) {
                                            a = a + 1;
                                            if (line - aa.length > options.wrap - 4) {
                                                level.push(ind);
                                            } else {
                                                level.push(-10);
                                            }
                                            if (varline[varline.length - 1] === true && token[c] === "=") {
                                                line = line + (options.inchar.length * options.insize) - 1;
                                            } else {
                                                line = line + 3;
                                            }
                                            strwrap(options.wrap - (line - aa.length));
                                        } else {
                                            level.push(ind);
                                        }
                                    } else {
                                        level.push(-10);
                                    }
                                }
                            }());
                        }
                        if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline") {
                            if (ltoke === "(") {
                                level[a - 1] = -20;
                            } else if (ctoke === "*" && depth[a] === "object" && types[a + 1] === "word" && (ltoke === "{" || ltoke === ",")) {
                                level[a - 1] = indent;
                            } else if (ctoke !== "?" || ternary.length === 0) {
                                level[a - 1] = -10;
                            }
                        }
                        if (ctoke.indexOf("=") > -1 && ctoke !== "==" && ctoke !== "===" && ctoke !== "!=" && ctoke !== "!==" && ctoke !== ">=" && ctoke !== "<=" && ctoke !== "=>" && depth[a] !== "method" && depth[a] !== "object") {
                            if (assignlist[assignlist.length - 1] === true && token[begin[a] - 1] !== "for") {
                                (function jspretty__beautify_operator_assignTest() {
                                    var c = 0,
                                        d = "",
                                        e = begin[a];
                                    if (depth[a] === "class") {
                                        varlen[varlen.length - 1].push(a - 1);
                                    } else {
                                        for (c = a - 1; c > e; c = c - 1) {
                                            d = token[c];
                                            if (d === ";" || d === "x;" || d === "," || d === "?" || d === ":" || c === e + 1) {
                                                return varlen[varlen.length - 1].push(a - 1);
                                            }
                                            if (d.indexOf("=") > -1 && d !== "==" && d !== "===" && d !== "!=" && d !== "!==" && d !== ">=" && d !== "<=") {
                                                return;
                                            }
                                        }
                                    }
                                }());
                            }
                            (function jspretty__beautify_operator_assignSpaces() {
                                var c = 0,
                                    d = 0,
                                    e = false,
                                    f = "";
                                if ((token[begin[a]] === "(" || token[begin[a]] === "x(") && token[a + 1] !== "function") {
                                    return;
                                }
                                for (c = a + 1; c < b; c = c + 1) {
                                    if (types[c] === "start") {
                                        if (e === true && token[c] !== "[") {
                                            if (assignlist[assignlist.length - 1] === true) {
                                                assignlist[assignlist.length - 1] = false;
                                                if (varlen[varlen.length - 1].length > 1) {
                                                    varlist.push(varlen[varlen.length - 1]);
                                                }
                                                varlen[varlen.length - 1] = [];
                                            }
                                            break;
                                        }
                                        d = d + 1;
                                    }
                                    if (types[c] === "end") {
                                        d = d - 1;
                                    }
                                    if (d < 0) {
                                        if (assignlist[assignlist.length - 1] === true) {
                                            assignlist[assignlist.length - 1] = false;
                                            if (varlen[varlen.length - 1].length > 1) {
                                                varlist.push(varlen[varlen.length - 1]);
                                            }
                                            varlen[varlen.length - 1] = [];
                                        }
                                        break;
                                    }
                                    if (d === 0) {
                                        f = token[c];
                                        if (e === true) {
                                            if (types[c] === "operator" || token[c] === ";" || token[c] === "x;" || token[c] === "?" || token[c] === "var" || token[c] === "let" || token[c] === "const") {
                                                if (f !== undefined && (f === "?" || (f.indexOf("=") > -1 && f !== "==" && f !== "===" && f !== "!=" && f !== "!==" && f !== ">=" && f !== "<="))) {
                                                    if (assignlist[assignlist.length - 1] === false && (varlen[varlen.length - 1].length === 0 || token[varlen[varlen.length - 1][varlen[varlen.length - 1].length - 1] + 1] === ctoke)) {
                                                        varlen[varlen.length - 1].push(a - 1);
                                                        assignlist[assignlist.length - 1] = true;
                                                    }
                                                }
                                                if ((f === ";" || f === "x;" || f === "var" || f === "let" || f === "const") && assignlist[assignlist.length - 1] === true) {
                                                    assignlist[assignlist.length - 1] = false;
                                                    if (varlen[varlen.length - 1].length > 1) {
                                                        varlist.push(varlen[varlen.length - 1]);
                                                    }
                                                    varlen[varlen.length - 1] = [];
                                                }
                                                break;
                                            }
                                            if (assignlist[assignlist.length - 1] === true && (f === "return" || f === "break" || f === "continue" || f === "throw")) {
                                                assignlist[assignlist.length - 1] = false;
                                                if (varlen[varlen.length - 1].length > 1) {
                                                    varlist.push(varlen[varlen.length - 1]);
                                                }
                                                varlen[varlen.length - 1] = [];
                                            }
                                        }
                                        if (f === ";" || f === "x;" || f === ",") {
                                            e = true;
                                        }
                                    }
                                }
                            }());
                        }
                        if ((ctoke === "-" && ltoke === "return") || ltoke === "=") {
                            return level.push(-20);
                        }
                        if (ltype === "operator" && types[a + 1] === "word" && ltoke !== "--" && ltoke !== "++" && ctoke !== "&&" && ctoke !== "||") {
                            return level.push(-20);
                        }
                        level.push(-10);
                    },
                    word          = function jspretty__beautify_word() {
                        var next    = token[a + 1],
                            compare = (
                                next !== undefined && next !== "==" && next !== "===" && next !== "!=" && next !== "!==" && next === ">=" && next !== "<=" && next.indexOf("=") > -1
                            );
                        if (varline[varline.length - 1] === true && (ltoke === "," || ltoke === "var" || ltoke === "let" || ltoke === "const")) {
                            if (token[begin[a] - 1] !== "for" && depth[a] !== "method" && token[begin[a]] !== "(" && token[begin[a]] !== "x(") {
                                if (types[a + 1] === "operator" && compare === true && token[varlen[varlen.length - 1][varlen[varlen.length - 1].length - 1] + 1] !== ":") {
                                    varlen[varlen.length - 1].push(a);
                                }
                            }
                            if (options.jsscope !== "none" || options.mode === "minify") {
                                meta[meta.length - 1] = "v";
                            }
                        } else if ((options.jsscope !== "none" || options.mode === "minify") && ltoke === "function") {
                            meta[meta.length - 1] = "v";
                        }
                        if ((ltoke === ")" || ltoke === "x)") && depth[a] === "class" && (token[begin[a - 1] - 1] === "static" || token[begin[a - 1] - 1] === "final" || token[begin[a - 1] - 1] === "void")) {
                            level[a - 1]            = -10;
                            level[begin[a - 1] - 1] = -10;
                        }
                        if (ltoke === "]") {
                            level[a - 1] = -10;
                        }
                        if (ltoke === "}" || ltoke === "x}") {
                            level[a - 1] = indent;
                        }
                        if (ctoke === "else" && ltoke === "}" && token[a - 2] === "x}") {
                            level[a - 3] = level[a - 3] - 1;
                        }
                        if (varline.length === 1 && varline[0] === true && (ltoke === "var" || ltoke === "let" || ltoke === "const" || ltoke === "," || (ltoke === "function" && depth[a + 1] === "method"))) {
                            globals.push(ctoke);
                        }
                        if ((ctoke === "let" || ctoke === "const") && lettest < 0) {
                            lettest = a;
                        }
                        if (ctoke === "new") {
                            (function jspretty__beautify_word_new() {
                                var c       = 0,
                                    nextish = (typeof next === "string")
                                        ? next
                                        : "",
                                    apiword = (nextish === "")
                                        ? []
                                        : [
                                            "ActiveXObject",
                                            "ArrayBuffer",
                                            "AudioContext",
                                            "Canvas",
                                            "CustomAnimation",
                                            "DOMParser",
                                            "DataView",
                                            "Date",
                                            "Error",
                                            "EvalError",
                                            "FadeAnimation",
                                            "FileReader",
                                            "Flash",
                                            "Float32Array",
                                            "Float64Array",
                                            "FormField",
                                            "Frame",
                                            "Generator",
                                            "HotKey",
                                            "Image",
                                            "Iterator",
                                            "Intl",
                                            "Int16Array",
                                            "Int32Array",
                                            "Int8Array",
                                            "InternalError",
                                            "Loader",
                                            "Map",
                                            "MenuItem",
                                            "MoveAnimation",
                                            "Notification",
                                            "ParallelArray",
                                            "Point",
                                            "Promise",
                                            "Proxy",
                                            "RangeError",
                                            "Rectangle",
                                            "ReferenceError",
                                            "Reflect",
                                            "RegExp",
                                            "ResizeAnimation",
                                            "RotateAnimation",
                                            "Set",
                                            "SQLite",
                                            "ScrollBar",
                                            "Set",
                                            "Shadow",
                                            "StopIteration",
                                            "Symbol",
                                            "SyntaxError",
                                            "Text",
                                            "TextArea",
                                            "Timer",
                                            "TypeError",
                                            "URL",
                                            "Uint16Array",
                                            "Uint32Array",
                                            "Uint8Array",
                                            "Uint8ClampedArray",
                                            "URIError",
                                            "WeakMap",
                                            "WeakSet",
                                            "Web",
                                            "Window",
                                            "XMLHttpRequest"
                                        ],
                                    apilen  = apiword.length;
                                for (c = 0; c < apilen; c = c + 1) {
                                    if (nextish === apiword[c]) {
                                        return;
                                    }
                                }
                                news = news + 1;
                                if (options.jsscope !== "none") {
                                    token[a] = "<strong class='new'>new</strong>";
                                }
                            }());
                        }
                        if (ctoke === "from" && ltype === "end" && a > 0 && (token[begin[a - 1] - 1] === "import" || token[begin[a - 1] - 1] === ",")) {
                            level[a - 1] = -10;
                        }
                        if (ctoke === "this" && options.jsscope !== "none") {
                            token[a] = "<strong class='new'>this</strong>";
                        }
                        if (ctoke === "function") {
                            if (options.space === false && a < b - 1 && (token[a + 1] === "(" || token[a + 1] === "x(")) {
                                return level.push(-20);
                            }
                            return level.push(-10);
                        }
                        if (ltype === "literal" && ltoke.charAt(ltoke.length - 1) === "{" && options.bracepadding === false) {
                            level[a - 1] = -20;
                        } else if (ltoke === "-" && a > 1) {
                            if (types[a - 2] === "operator" || token[a - 2] === ",") {
                                level[a - 1] = -20;
                            } else if (types[a - 2] === "start") {
                                level[a - 2] = -20;
                                level[a - 1] = -20;
                            }
                        } else if (ctoke === "while" && (ltoke === "}" || ltoke === "x}")) {
                            //verify if this is a do/while block
                            (function jspretty__beautify_word_curlyBrace() {
                                var c = 0,
                                    d = 0;
                                for (c = a - 1; c > -1; c = c - 1) {
                                    if (token[c] === "}" || token[c] === "x}") {
                                        d = d + 1;
                                    }
                                    if (token[c] === "{" || token[c] === "x{") {
                                        d = d - 1;
                                    }
                                    if (d === 0) {
                                        if (token[c - 1] === "do") {
                                            level[a - 1] = -10;
                                            return;
                                        }
                                        level[a - 1] = indent;
                                        return;
                                    }
                                }
                            }());
                        } else if (ctoke === "in" || (((ctoke === "else" && options.elseline === false) || ctoke === "catch") && (ltoke === "}" || ltoke === "x}"))) {
                            level[a - 1] = -10;
                        } else if (ctoke === "var" || ctoke === "let" || ctoke === "const") {
                            if (assignlist[assignlist.length - 1] === true && varlen.length > 0 && varlen[varlen.length - 1].length > 1) {
                                assignlist[assignlist.length - 1] = false;
                                varlist.push(varlen[varlen.length - 1]);
                                varlen[varlen.length - 1] = [];
                            } else if (depth[a] !== "method") {
                                varlen[varlen.length - 1] = [];
                            }
                            if (ltype === "end") {
                                level[a - 1] = indent;
                            }
                            if (token[begin[a] - 1] !== "for") {
                                if (varline.length === 0) {
                                    varline.push(true);
                                } else {
                                    varline[varline.length - 1] = true;
                                }
                                (function jspretty__beautify_word_varlisttest() {
                                    var c = 0,
                                        d = 0;
                                    for (c = a + 1; c < b; c = c + 1) {
                                        if (types[c] === "end") {
                                            d = d - 1;
                                        }
                                        if (types[c] === "start") {
                                            d = d + 1;
                                        }
                                        if (d < 0 || (d === 0 && (token[c] === ";" || token[c] === ","))) {
                                            break;
                                        }
                                    }
                                    if (token[c] === ",") {
                                        indent = indent + 1;
                                    }
                                }());
                            }
                        } else if ((ctoke === "default" || ctoke === "case") && ltype !== "word" && depth[a] === "switch") {
                            level[a - 1] = indent - 1;
                            return level.push(-10);
                        }
                        if (ctoke === "catch" && ltoke === ".") {
                            level[a - 1] = -20;
                            return level.push(-20);
                        }
                        if (ctoke === "catch" || ctoke === "finally") {
                            level[a - 1] = -10;
                            return level.push(-10);
                        }
                        if (options.bracepadding === false && a < b - 1 && token[a + 1].charAt(0) === "}") {
                            return level.push(-20);
                        }
                        if (depth[a] === "object" && (ltoke === "{" || ltoke === ",") && (token[a + 1] === "(" || token[a + 1] === "x(")) {
                            return level.push(-20);
                        }
                        level.push(-10);
                    };
                if (options.titanium === true) {
                    indent = indent - 1;
                }
                for (a = 0; a < b; a = a + 1) {
                    if (options.jsscope !== "none" || options.mode === "minify") {
                        meta.push("");
                    }
                    ctype = types[a];
                    ctoke = token[a];
                    if (ctype === "comment") {
                        comment();
                    } else if (ctype === "comment-inline") {
                        commentInline();
                    } else if (ctype === "regex") {
                        level.push(-20);
                    } else if (ctype === "literal") {
                        literal();
                    } else if (ctype === "separator") {
                        separator();
                    } else if (ctype === "start") {
                        start();
                    } else if (ctype === "end") {
                        end();
                    } else if (ctype === "operator") {
                        operator();
                    } else if (ctype === "word") {
                        word();
                    } else if (ctype === "markup") {
                        markup();
                    } else if (ctype.indexOf("template") === 0) {
                        template();
                    } else if (ctype === "generic") {
                        if (ltoke !== "return" && ltoke.charAt(0) !== "#" && ltype !== "operator" && ltoke !== "public" && ltoke !== "private" && ltoke !== "static" && ltoke !== "final" && ltoke !== "implements" && ltoke !== "class" && ltoke !== "void") {
                            level[a - 1] = -20;
                        }
                        if (token[a + 1] === "(" || token[a + 1] === "x(") {
                            level.push(-20);
                        } else {
                            level.push(-10);
                        }
                    }
                    if (ctype !== "comment" && ctype !== "comment-inline") {
                        ltype = ctype;
                        ltoke = ctoke;
                    }
                }
                if (assignlist[assignlist.length - 1] === true && varlen[varlen.length - 1].length > 1 && ltoke === ";") {
                    varlist.push(varlen[varlen.length - 1]);
                }
            }());
        }
        if (options.titanium === true) {
            token[0] = "";
            types[0] = "";
            lines[0] = 0;
        }
        if (options.mode === "minify") {
            result = (function jspretty__minify() {
                var a        = 0,
                    linelen  = 0,
                    length   = token.length,
                    comtest  = (options.topcoms === false),
                    build    = [],
                    lastsemi = function jspretty__minify_lastsemi() {
                        var aa = 0,
                            bb = 0;
                        for (aa = a; aa > -1; aa = aa - 1) {
                            if (types[aa] === "end") {
                                bb = bb + 1;
                            } else if (types[aa] === "start") {
                                bb = bb - 1;
                            }
                            if (bb < 0) {
                                if (token[aa - 1] === "for") {
                                    build.push(";");
                                }
                                return;
                            }
                        }
                    };
                for (a = 0; a < length; a = a + 1) {
                    if (types[a] !== "comment") {
                        comtest = true;
                    }
                    if (types[a - 1] === "operator" && types[a] === "operator" && token[a] !== "!") {
                        build.push(" ");
                    }
                    if (types[a] === "markup" && typeof global.prettydiff.markuppretty === "function") {
                        build.push(extlib({jsx: true, mode: "minify", source: token[a]}));
                    } else if (types[a] === "word" && (types[a + 1] === "word" || types[a + 1] === "literal" || token[a + 1] === "x{" || types[a + 1] === "comment" || types[a + 1] === "comment-inline")) {
                        if (types[a - 1] === "literal" && token[a - 1].charAt(0) !== "\"" && token[a - 1].charAt(0) !== "'") {
                            build.push(" ");
                        }
                        build.push(token[a]);
                        build.push(" ");
                    } else if (types[a] === "comment" && comtest === false) {
                        build.push(token[a]);
                        build.push(lf);
                    } else if (token[a] === "x;" && token[a + 1] !== "}") {
                        build.push(";");
                    } else if (token[a] === ";" && token[a + 1] === "}") {
                        lastsemi();
                    } else if (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}" && token[a] !== "x)" && token[a] !== "x(" && types[a] !== "comment" && types[a] !== "comment-inline") {
                        build.push(token[a]);
                    }
                    if (options.wrap > 0) {
                        if (types[a] !== "comment" && types[a] !== "comment-inline") {
                            linelen = linelen + token[a].length;
                        }
                        if ((types[a] === "operator" || types[a] === "separator" || types[a] === "start") && a < length - 1 && linelen + token[a + 1].length > options.wrap) {
                            build.push(lf);
                            linelen = 0;
                        }
                    }
                }
                if (options.newline === true) {
                    if (options.crlf === true) {
                        build.push("\r\n");
                    } else {
                        build.push("\n");
                    }
                }
                if (options.nodeasync === true) {
                    return [build.join(""), globalerror];
                }
                return build.join("");
            }());
        } else {
            //the result function generates the out
            (function jspretty__result() {
                var tab      = (function jspretty__result_tab() {
                        var aa = options.inchar,
                            bb = options.insize,
                            cc = [];
                        for (bb = bb; bb > 0; bb = bb - 1) {
                            cc.push(aa);
                        }
                        return cc.join("");
                    }()),
                    vertical = function jspretty__result_vertical() {
                        var aa          = 0,
                            lastListLen = 0,
                            cc          = 0,
                            dd          = 0,
                            longest     = 0,
                            longTest    = 0,
                            strlongest  = 0,
                            isvar       = false,
                            isvartoken  = 0,
                            strspace    = "",
                            tokenInList = "",
                            longList    = [],
                            joins       = function jspretty__result_vertical_joins(x) {
                                var xlen = token[x].length,
                                    y    = x;
                                if (level[x] === 0) {
                                    return xlen;
                                }
                                if (level[x] < -9) {
                                    do {
                                        y = y - 1;
                                        if (level[y] > -9) {
                                            break;
                                        }
                                        if (level[y] === -10) {
                                            xlen = xlen + 1;
                                        }
                                        xlen = xlen + token[y].length;
                                    } while (y > 0);
                                    if (level[y] > 0) {
                                        xlen = xlen + (options.inchar.length * options.insize * level[y]);
                                    }
                                } else {
                                    xlen = xlen + (options.inchar.length * options.insize * level[x]);
                                }
                                if (depth[x] === "global" && varlist[0][0] === x && options.lang !== "javascript") {
                                    y = x;
                                    do {
                                        y = y - 1;
                                    } while (y > -1 && level[y] < -9);
                                    if (y < 0) {
                                        xlen = xlen + (options.inchar.length * options.insize * options.inlevel);
                                    }
                                }
                                return xlen;
                            };
                        for (aa = varlist.length - 1; aa > -1; aa = aa - 1) {
                            if (varlist[aa] !== undefined) {
                                lastListLen = varlist[aa].length;
                                longest     = 0;
                                longList    = [];
                                isvartoken  = token[varlist[aa][0] - 1];
                                isvar       = (
                                    isvartoken === "var" || isvartoken === "let" || isvartoken === "const"
                                );
                                for (cc = 0; cc < lastListLen; cc = cc + 1) {
                                    longTest = joins(varlist[aa][cc], isvar);
                                    if (longTest > longest) {
                                        longest = longTest;
                                    }
                                    longList.push(longTest);
                                }
                                strspace = "";
                                if (longest > options.insize) {
                                    strlongest = longest - options.insize;
                                } else if (longest < options.insize) {
                                    strlongest = options.insize - longest;
                                }
                                if (token[varlist[aa][0] - 1] === "var" || token[varlist[aa][0] - 1] === "let" || token[varlist[aa][0] - 1] === "const") {
                                    strlongest = strlongest - options.insize;
                                } else if (token[varlist[aa][0] + 1] === "=") {
                                    strlongest = strlongest + 1;
                                }
                                if (longest !== options.insize && strlongest > 0) {
                                    do {
                                        strspace   = strspace + " ";
                                        strlongest = strlongest - 1;
                                    } while (strlongest > -1);
                                }
                                for (cc = 0; cc < lastListLen; cc = cc + 1) {
                                    tokenInList = token[varlist[aa][cc]];
                                    if (longList[cc] < longest) {
                                        do {
                                            tokenInList  = tokenInList + " ";
                                            longList[cc] = longList[cc] + 1;
                                        } while (longList[cc] < longest);
                                    }
                                    token[varlist[aa][cc]] = tokenInList;
                                    if (token[varlist[aa][cc] + 2] !== undefined && token[varlist[aa][cc] + 2].length === options.wrap + 2 && token[varlist[aa][cc] + 3] === "+" && token[varlist[aa][cc] + 4] !== undefined && options.styleguide !== "crockford" && options.styleguide !== "jslint" && (token[varlist[aa][cc] + 4].charAt(0) === "\"" || token[varlist[aa][cc] + 4].charAt(0) === "'")) {
                                        if (longest <= options.insize) {
                                            strspace = "";
                                            dd       = 0;
                                            do {
                                                dd       = dd + 1;
                                                strspace = strspace + " ";
                                            } while (dd < longest + 1);
                                            dd = varlist[aa][cc] + 4;
                                            do {
                                                token[dd]     = strspace + tab + tab + token[dd];
                                                level[dd - 1] = level[dd - 1] - 1;
                                                dd            = dd + 2;
                                            } while (types[dd] === "literal" && types[dd - 1] !== "separator");
                                        } else {
                                            dd = varlist[aa][cc] + 4;
                                            do {
                                                token[dd]     = strspace + tab + tab + token[dd];
                                                level[dd - 1] = 0;
                                                dd            = dd + 2;
                                            } while (types[dd] === "literal" && types[dd - 1] !== "separator");
                                        }
                                    }
                                }
                            }
                        }
                    };
                if (options.jsscope !== "none") {
                    result = (function jspretty__result_scope() {
                        var a                  = 0,
                            b                  = token.length,
                            build              = [],
                            linecount          = 2,
                            last               = "",
                            scope              = 1,
                            buildlen           = 0,
                            commentfix         = (function jspretty__result_scope_commentfix() {
                                var aa = 1,
                                    bb = 1;
                                if (types[0] !== "comment" || (token[0].indexOf("//") === 0 && lines[0] > 0) || types[1] !== "comment") {
                                    return 1;
                                }
                                do {
                                    if (token[aa].indexOf("/*") === 0) {
                                        bb = bb + 1;
                                    }
                                    aa = aa + 1;
                                } while (types[aa] === "comment" && aa < b);
                                return bb + 1;
                            }()),
                            folderItem         = [],
                            comfold            = -1,
                            //if current folding is for comment
                            data               = [
                                "<div class='beautify' data-prettydiff-ignore='true'><ol class='count'>", "<li>", 1, "</li>"
                            ],
                            //applies folding to comments and functions
                            //
                            // Folder uses the i variable to determine how far back into the data array to
                            // look.  i must be multiplied by 3 because each line number is three indexes in
                            // the data array: <li>, line #, </li>.
                            //
                            //i is incremented for:
                            // * block comments following one or more line  comments that follow one or more
                            // block comments
                            //* if last comment in a series is a block comment  and not the first token
                            // * block comments with a new line that are either  the first token or not
                            // followed by another block
                            //* if a block comment is followed by another block  comment
                            //
                            //i is decremented for:
                            //* line comment following a block comment
                            //* block comment if "i" is greater than 1 and  inside a function fold
                            // * if a line comment is not preceeded by another  comment and is followed by a
                            // block comment
                            //
                            // If closing a fold and token is a comment and not token 0 then decrement by
                            // commentfix.
                            folder             = function jspretty__result_scope_folder() {
                                var datalen = (data.length - (commentfix * 3) > 0)
                                        ? data.length - (commentfix * 3)
                                        : 1,
                                    index   = a,
                                    start   = data[datalen + 1] || 1,
                                    assign  = true,
                                    kk      = index;
                                if (types[a] === "comment" && comfold === -1) {
                                    comfold = a;
                                } else if (types[a] !== "comment") {
                                    index = meta[a];
                                    do {
                                        kk = kk - 1;
                                    } while (token[kk] !== "function" && kk > -1);
                                    kk = kk - 1;
                                    if (token[kk] === "(" || token[kk] === "x(") {
                                        do {
                                            kk = kk - 1;
                                        } while (kk > -1 && (token[kk] === "(" || token[kk] === "x("));
                                    }
                                    if (token[kk] === "=" || token[kk] === ":" || token[kk] === "," || token[kk + 1] === "(" || token[kk + 1] === "x(") {
                                        assign = false;
                                    }
                                }
                                if (types[a] === "comment" && lines[a] > 1) {
                                    datalen = datalen - 3;
                                    start   = start - 1;
                                }
                                data[datalen]     = "<li class='fold' title='folds from line " + start + " to line " +
                                        "xxx'>";
                                data[datalen + 1] = "- " + start;
                                folderItem.push([datalen, index, assign]);
                            },
                            // determines where folding ends function assignments require one more line for
                            // closing than everything else
                            foldclose          = function jspretty__result_scope_foldclose() {
                                var end  = (function jspretty__result_scope_foldclose_end() {
                                        if (comfold > -1 || folderItem[folderItem.length - 1][2] === true) {
                                            return linecount - commentfix - 1;
                                        }
                                        return linecount - commentfix;
                                    }()),
                                    semi = (/(>;<\/em>)$/).test(token[a]),
                                    gg   = 0,
                                    lets = false;
                                if (semi === true) {
                                    end = end - 1;
                                    for (gg = build.length - 1; gg > 0; gg = gg - 1) {
                                        if (build[gg] === "let" || build[gg] === "const") {
                                            lets = true;
                                        }
                                        if (build[gg].indexOf("><li") > 0) {
                                            build[gg] = build[gg].replace(/class\='l\d+'/, "class='l" + (
                                                scope + 1
                                            ) + "'");
                                            if (lets === true) {
                                                break;
                                            }
                                        }
                                        if (build[gg].indexOf("<em class='l" + scope + "'>" + tab) > -1) {
                                            build[gg] = build[gg].replace(
                                                "<em class='l" + scope + "'>" + tab,
                                                "<em class='l" + (
                                                    scope + 1
                                                ) + "'>" + tab
                                            );
                                        }
                                    }
                                }
                                if (a > 1 && token[a].indexOf("}</em>") === token[a].length - 6 && token[a - 1].indexOf("{</em>") === token[a - 1].length - 6) {
                                    for (gg = data.length - 1; gg > 0; gg = gg - 1) {
                                        if (typeof data[gg] === "string" && data[gg].charAt(0) === "-") {
                                            data[gg - 1] = "<li>";
                                            data[gg]     = Number(data[gg].substr(1));
                                            folderItem.pop();
                                            return;
                                        }
                                    }
                                }
                                if (folderItem[folderItem.length - 1][1] === b - 1 && token[a].indexOf("<em ") === 0) {
                                    end = end + 1;
                                }
                                data[folderItem[folderItem.length - 1][0]] = data[folderItem[folderItem.length - 1][0]].replace(
                                    "xxx",
                                    end
                                );
                                folderItem.pop();
                            },
                            // splits block comments, which are single tokens, into multiple lines of output
                            blockline          = function jspretty__result_scope_blockline(x) {
                                var commentLines = x.split(lf),
                                    hh           = 0,
                                    ii           = commentLines.length - 1;
                                if (lines[a] > 0) {
                                    data.push("<li>");
                                    data.push(linecount);
                                    data.push("</li>");
                                    linecount = linecount + 1;
                                }
                                for (hh = 0; hh < ii; hh = hh + 1) {
                                    data.push("<li>");
                                    data.push(linecount);
                                    data.push("</li>");
                                    linecount        = linecount + 1;
                                    commentLines[hh] = commentLines[hh] + "<em>&#xA;</em></li><li class='c0'>";
                                }
                                return commentLines.join("");
                            },
                            //finds the variables if the jsscope option is true
                            findvars           = function jspretty__result_scope_findvars(x) {
                                var metax         = meta[x],
                                    metameta      = meta[metax][0],
                                    lettest       = false,
                                    ee            = 0,
                                    ff            = 0,
                                    hh            = 0,
                                    adjustment    = 1,
                                    functionBlock = true,
                                    varbuild      = [],
                                    varbuildlen   = 0,
                                    letcomma      = function jspretty__result_scope_findvars_letcomma() {
                                        var aa = 0,
                                            bb = 0;
                                        for (aa = a; aa > -1; aa = aa - 1) {
                                            if (types[aa] === "end") {
                                                bb = bb - 1;
                                            }
                                            if (types[aa] === "start") {
                                                bb = bb + 1;
                                            }
                                            if (bb > 0) {
                                                return;
                                            }
                                            if (bb === 0) {
                                                if (token[aa] === "var" || token[aa] === ";" || token[aa] === "x;") {
                                                    return;
                                                }
                                                if (token[aa] === "let" || token[aa] === "const") {
                                                    token[ee] = "<em class='s" + scope + "'>" + varbuild[0] + "</em>";
                                                }
                                            }
                                        }
                                    };
                                if (metameta === undefined) {
                                    return;
                                }
                                lettest = meta[metax][1];
                                hh      = metameta.length;
                                if (types[a - 1] === "word" && token[a - 1] !== "function" && lettest === false) {
                                    varbuild     = token[a - 1].split(" ");
                                    token[a - 1] = "<em class='s" + scope + "'>" + varbuild[0] + "</em>";
                                    varbuildlen  = varbuild.length;
                                    if (varbuildlen > 1) {
                                        do {
                                            token[ee]   = token[ee] + " ";
                                            varbuildlen = varbuildlen - 1;
                                        } while (varbuildlen > 1);
                                    }
                                }
                                if (hh > 0) {
                                    ee = metax - 1;
                                    if (lettest === true) {
                                        ee = ee - 1;
                                    }
                                    for (ee = ee; ee > a; ee = ee - 1) {
                                        if (types[ee] === "word") {
                                            varbuild = token[ee].split(" ");
                                            for (ff = 0; ff < hh; ff = ff + 1) {
                                                if (varbuild[0] === metameta[ff] && token[ee - 1] !== ".") {
                                                    if (token[ee - 1] === "function" && token[ee + 1] === "(") {
                                                        token[ee]   = "<em class='s" + (
                                                            scope + 1
                                                        ) + "'>" + varbuild[0] + "</em>";
                                                        varbuildlen = varbuild.length;
                                                        if (varbuildlen > 1) {
                                                            do {
                                                                token[ee]   = token[ee] + " ";
                                                                varbuildlen = varbuildlen - 1;
                                                            } while (varbuildlen > 1);
                                                        }
                                                    } else if (token[ee - 1] === "case" || token[ee + 1] !== ":" || (token[ee + 1] === ":" && level[ee] > -20)) {
                                                        if (lettest === true) {
                                                            if (token[ee - 1] === "let" || token[ee - 1] === "const") {
                                                                token[ee] = "<em class='s" + scope + "'>" + varbuild[0] + "</em>";
                                                            } else if (token[ee - 1] === ",") {
                                                                letcomma();
                                                            } else {
                                                                token[ee] = "<em class='s" + scope + "'>" + varbuild[0] + "</em>";
                                                            }
                                                        } else {
                                                            token[ee] = "<em class='s" + scope + "'>" + varbuild[0] + "</em>";
                                                        }
                                                        varbuildlen = varbuild.length;
                                                        if (varbuildlen > 1) {
                                                            do {
                                                                token[ee]   = token[ee] + " ";
                                                                varbuildlen = varbuildlen - 1;
                                                            } while (varbuildlen > 1);
                                                        }
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                        if (functionBlock === true) {
                                            if (types[ee] === "end") {
                                                adjustment = adjustment + 1;
                                            } else if (types[ee] === "start") {
                                                adjustment = adjustment - 1;
                                            }
                                            if (adjustment === 0 && token[ee] === "{") {
                                                token[ee]     = "<em class='s" + scope + "'>{</em>";
                                                functionBlock = false;
                                            }
                                        }
                                    }
                                } else {
                                    ee = a + 1;
                                    if (lettest === true) {
                                        ee = ee - 1;
                                    }
                                    for (ee = ee; ee < metax; ee = ee + 1) {
                                        if (types[ee] === "end") {
                                            adjustment = adjustment - 1;
                                        } else if (types[ee] === "start") {
                                            adjustment = adjustment + 1;
                                        }
                                        if (adjustment === 1 && token[ee] === "{") {
                                            token[ee] = "<em class='s" + scope + "'>{</em>";
                                            return;
                                        }
                                    }
                                }
                            },
                            indent             = options.inlevel,
                            //some prebuilt color coded tabs
                            lscope             = [
                                "<em class='l0'>" + tab + "</em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab +
                                        "</em><em class='l2'>" + tab + "</em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab +
                                        "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab +
                                        "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='" +
                                        "l4'>" + tab + "</em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab +
                                        "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='" +
                                        "l4'>" + tab + "</em><em class='l5'>" + tab + "</em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab +
                                        "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='" +
                                        "l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "<" +
                                        "/em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab +
                                        "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='" +
                                        "l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "<" +
                                        "/em><em class='l7'>" + tab + "</em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab +
                                        "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='" +
                                        "l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "<" +
                                        "/em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab +
                                        "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='" +
                                        "l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "<" +
                                        "/em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l" +
                                        "9'>" + tab + "</em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab +
                                        "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='" +
                                        "l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "<" +
                                        "/em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l" +
                                        "9'>" + tab + "</em><em class='l10'>" + tab + "</em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab +
                                        "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='" +
                                        "l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "<" +
                                        "/em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l" +
                                        "9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab +
                                        "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='" +
                                        "l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "<" +
                                        "/em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l" +
                                        "9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" +
                                        tab + "</em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab +
                                        "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='" +
                                        "l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "<" +
                                        "/em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l" +
                                        "9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" +
                                        tab + "</em><em class='l13'>" + tab + "</em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab +
                                        "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='" +
                                        "l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "<" +
                                        "/em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l" +
                                        "9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" +
                                        tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab +
                                        "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='" +
                                        "l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "<" +
                                        "/em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l" +
                                        "9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" +
                                        tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em" +
                                        " class='l15'>" + tab + "</em>",
                                "<em class='l0'>" + tab + "</em><em class='l1'>" + tab +
                                        "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='" +
                                        "l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "<" +
                                        "/em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l" +
                                        "9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" +
                                        tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em" +
                                        " class='l15'>" + tab + "</em><em class='l16'>" + tab + "</em>"
                            ],
                            //a function for calculating indentation after each new line
                            nl                 = function jspretty__result_scope_nl(x, linetest) {
                                var dd = 0;
                                if (token[a] !== "x}" || (token[a] === "x}" && token[a + 1] !== "}")) {
                                    data.push("<li>");
                                    data.push(linecount);
                                    data.push("</li>");
                                    linecount = linecount + 1;
                                    if (a < b - 1 && token[a + 1].indexOf("/*") === 0) {
                                        build.push("<em>&#xA;</em></li><li class='c0'>");
                                    } else {
                                        build.push("<em>&#xA;</em></li><li class='l" + scope + "'>");
                                        if (x > 0) {
                                            dd = scope;
                                            if (scope > 0) {
                                                if (scope === x + 1 && x > 0 && linetest !== true) {
                                                    dd = dd - 1;
                                                }
                                                build.push(lscope[dd - 1]);
                                            }
                                        } else if (linetest === true) {
                                            build.push(lscope[0]);
                                        }
                                    }
                                } else {
                                    if (x > 0) {
                                        dd = scope;
                                        if (scope > 0) {
                                            if (scope === x + 1 && x > 0 && linetest !== true) {
                                                dd = dd - 1;
                                            }
                                            build.push(lscope[dd - 1]);
                                        }
                                    }
                                }
                                for (dd = dd; dd < x; dd = dd + 1) {
                                    build.push(tab);
                                }
                            },
                            rl                 = function jspretty__result_scope_rl(x) {
                                var bb = token.length,
                                    cc = 2,
                                    dd = 0;
                                for (dd = a + 2; dd < bb; dd = dd + 1) {
                                    if (token[dd] === "x}") {
                                        cc = cc + 1;
                                    } else {
                                        break;
                                    }
                                }
                                nl(x - cc);
                                a = a + 1;
                            },
                            markupBuild        = function jspretty__result_scope_markupBuild() {
                                var mindent  = (function jspretty__result_scope_markupBuild_offset() {
                                        var d = 0;
                                        if (a === markupvar[0]) {
                                            markupvar.splice(0, 1);
                                            return 1;
                                        }
                                        if (token[d] === "return" || token[0] === "{") {
                                            return 1;
                                        }
                                        if (level[a] < -9) {
                                            return 0;
                                        }
                                        for (d = a - 1; d > -1; d = d - 1) {
                                            if (token[d] !== "(" && token[d] !== "x(") {
                                                if (token[d] === "=") {
                                                    return 1;
                                                }
                                                return 0;
                                            }
                                        }
                                        return 0;
                                    }()),
                                    markup   = (function jspretty__result_scope_markupBuild_varscope() {
                                        var item    = "",
                                            emscope = function jsscope__result_scope_markupBuild_varscope_emscope(x) {
                                                return "<em class='s" + x
                                                    .replace("[pdjsxem", "")
                                                    .replace("]", "") + "'>";
                                            },
                                            word    = "",
                                            newword = "",
                                            inca    = 0,
                                            incb    = 0,
                                            lena    = meta.length,
                                            lenb    = 0,
                                            vars    = [],
                                            mode    = options.mode,
                                            inle    = options.inlevel,
                                            jsx     = options.jsx;
                                        options.source  = token[a];
                                        options.mode    = "beautify";
                                        options.inlevel = mindent;
                                        options.jsx     = true;
                                        item            = extlib().replace(/return\s+</g, "return <");
                                        options.mode    = mode;
                                        options.inlevel = inle;
                                        options.jsx     = jsx;
                                        if (item.indexOf("[pdjsxscope]") < 0) {
                                            return item
                                                .replace(/&/g, "&amp;")
                                                .replace(/</g, "&lt;")
                                                .replace(/>/g, "&gt;")
                                                .split(lf);
                                        }
                                        do {
                                            newword = "";
                                            vars    = [];
                                            word    = item.substring(
                                                item.indexOf("[pdjsxscope]") + 12,
                                                item.indexOf("[/pdjsxscope]")
                                            );
                                            for (inca = 0; inca < lena; inca = inca + 1) {
                                                if (typeof meta[inca] === "number" && inca < a && a < meta[inca]) {
                                                    vars.push(meta[inca]);
                                                    lenb = meta[meta[inca]].length;
                                                    for (incb = 0; incb < lenb; incb = incb + 1) {
                                                        if (meta[meta[inca]][incb] === word) {
                                                            newword = "[pdjsxem" + (
                                                                vars.length + 1
                                                            ) + "]" + word + "[/pdjsxem]";
                                                        }
                                                    }
                                                    if (incb < lenb) {
                                                        break;
                                                    }
                                                    vars.pop();
                                                }
                                            }
                                            if (newword === "") {
                                                lenb = globals.length;
                                                for (incb = 0; incb < lenb; incb = incb + 1) {
                                                    if (word === globals[incb]) {
                                                        newword = "[pdjsxem0]" + word + "[/pdjsxem]";
                                                    }
                                                }
                                                if (newword === "") {
                                                    newword = word;
                                                }
                                            }
                                            item = item.replace("[pdjsxscope]" + word + "[/pdjsxscope]", newword);
                                        } while (item.indexOf("[pdjsxscope]") > -1);
                                        return item
                                            .replace(/&/g, "&amp;")
                                            .replace(/</g, "&lt;")
                                            .replace(/>/g, "&gt;")
                                            .replace(/\[pdjsxem\d+\]/g, emscope)
                                            .replace(/\[\/pdjsxem\]/g, "</em>")
                                            .split(lf);
                                    }()),
                                    len      = 0,
                                    c        = 0,
                                    spaces   = 0,
                                    synthtab = "\\" + tab.charAt(0),
                                    tabreg   = {};
                                len = tab.length;
                                for (c = 1; c < len; c = c + 1) {
                                    synthtab = synthtab + "\\" + tab.charAt(c);
                                }
                                tabreg  = new RegExp("^(" + synthtab + "+)");
                                mindent = indent + 2;
                                if (level[a] < -9) {
                                    markup[0] = markup[0].replace(tabreg, "");
                                    mindent   = mindent - 1;
                                }
                                len = markup.length;
                                for (c = 0; c < len - 1; c = c + 1) {
                                    if (markup[c].indexOf(tab) !== 0 && c > 0) {
                                        spaces = markup[c - 1]
                                            .split(tab)
                                            .length - 1;
                                        do {
                                            spaces    = spaces - 1;
                                            markup[c] = tab + markup[c];
                                        } while (spaces > 0);
                                    }
                                    build.push(markup[c]);
                                    nl(mindent - 1);
                                }
                                build.push(markup[markup.length - 1]);
                            },
                            multiline          = function jspretty__result_scope_multiline(x) {
                                var temparray = x.split(lf),
                                    c         = 0,
                                    d         = temparray.length;
                                build.push(temparray[0]);
                                for (c = 1; c < d; c = c + 1) {
                                    nl(indent);
                                    build.push(temparray[c]);
                                }
                            },
                            endcomma_multiline = function jspretty__result_scope_endcommaMultiline() {
                                var c = a;
                                if (types[c] === "comment" || types[c] === "comment-inline") {
                                    do {
                                        c = c - 1;
                                    } while (c > 0 && (types[c] === "comment" || types[c] === "comment-inline"));
                                }
                                token[c] = token[c] + ",";
                            };
                        if (verticalop === true) {
                            vertical();
                        }
                        if (types[a] === "comment" && token[a].indexOf("/*") === 0) {
                            build.push("<ol class='data'><li class='c0'>");
                        } else {
                            build.push("<ol class='data'><li>");
                        }
                        for (a = 0; a < indent; a = a + 1) {
                            build.push(tab);
                        }
                        // its important to find the variables separately from building the output so
                        // that recursive flows in the loop incrementation do not present simple
                        // counting collisions as to what gets modified versus what gets included
                        for (a = b - 1; a > -1; a = a - 1) {
                            if (typeof meta[a] === "number") {
                                scope = scope - 1;
                                findvars(a);
                            } else if (meta[a] !== undefined && typeof meta[a] !== "string" && typeof meta[a] !== "number" && a > 0 && token[a] !== "x;" && token[a] !== "x}" && token[a] !== "x{" && token[a] !== "x(" && token[a] !== "x)") {
                                token[a] = "<em class='s" + scope + "'>" + token[a] + "</em>";
                                scope    = scope + 1;
                                if (scope > 16) {
                                    scope = 16;
                                }
                            }
                        }
                        (function jspretty__result_scope_globals() {
                            var aa          = 0,
                                bb          = token.length,
                                globalLocal = globals,
                                dd          = globalLocal.length,
                                ee          = 0,
                                word        = [],
                                wordlen     = 0;
                            for (aa = bb - 1; aa > 0; aa = aa - 1) {
                                if (types[aa] === "word" && (token[aa + 1] !== ":" || (token[aa + 1] === ":" && level[aa + 1] === -20)) && token[aa].indexOf("<em ") < 0) {
                                    word = token[aa].split(" ");
                                    for (ee = dd - 1; ee > -1; ee = ee - 1) {
                                        if (word[0] === globalLocal[ee] && token[aa - 1] !== ".") {
                                            if (token[aa - 1] === "function" && depth[aa + 1] === "method") {
                                                token[aa] = "<em class='s1'>" + word[0] + "</em>";
                                                wordlen   = word.length;
                                                if (wordlen > 1) {
                                                    do {
                                                        token[aa] = token[aa] + " ";
                                                        wordlen   = wordlen - 1;
                                                    } while (wordlen > 1);
                                                }
                                            } else {
                                                token[aa] = "<em class='s0'>" + word[0] + "</em>";
                                                wordlen   = word.length;
                                                if (wordlen > 1) {
                                                    do {
                                                        token[aa] = token[aa] + " ";
                                                        wordlen   = wordlen - 1;
                                                    } while (wordlen > 1);
                                                }
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                        }());
                        scope = 0;
                        // this loops combines the white space as determined from the algorithm with the
                        // tokens to create the output
                        for (a = 0; a < b; a = a + 1) {
                            if (typeof meta[a] === "number") {
                                folder();
                            }
                            if (comfold === -1 && types[a] === "comment" && ((token[a].indexOf("/*") === 0 && token[a].indexOf("\n") > 0) || types[a + 1] === "comment" || lines[a] > 1)) {
                                folder();
                                comfold = a;
                            }
                            if (comfold > -1 && types[a] !== "comment") {
                                foldclose();
                                comfold = -1;
                            }
                            if (options.endcomma === "multiline" && (token[a + 1] === "]" || token[a + 1] === "}") && level[a] !== -20) {
                                endcomma_multiline();
                            }
                            if (types[a] === "comment" && token[a].indexOf("/*") === 0) {
                                build.push(blockline(token[a]));
                            } else if (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}" && token[a] !== "x(" && token[a] !== "x)") {
                                if (typeof meta[a] === "number") {
                                    scope = scope + 1;
                                    if (scope > 16) {
                                        scope = 16;
                                    }
                                    build.push(token[a]);
                                } else if (typeof meta[a] !== "string" && typeof meta[a] !== "number") {
                                    build.push(token[a]);
                                    scope    = scope - 1;
                                    buildlen = build.length - 1;
                                    do {
                                        buildlen = buildlen - 1;
                                    } while (buildlen > 0 && build[buildlen].indexOf("</li><li") < 0);
                                    build[buildlen] = build[buildlen].replace(
                                        /class\='l\d+'/,
                                        "class='l" + scope + "'"
                                    );
                                } else if (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}" && token[a] !== "x(" && token[a] !== "x)") {
                                    if (types[a] === "markup") {
                                        if (level[a] > -9) {
                                            if (types[a - 1] === "operator") {
                                                nl(indent);
                                            } else if (token[a - 1] !== "return") {
                                                nl(indent + 1);
                                            }
                                        }
                                        if (typeof global.prettydiff.markuppretty === "function") {
                                            markupBuild();
                                        } else {
                                            build.push(token[a].replace(/\r?\n(\s*)/g, " "));
                                        }
                                    } else if (types[a] === "comment") {
                                        if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline") {
                                            nl(indent);
                                        }
                                        if (a === 0) {
                                            build[0] = "<ol class='data'><li class='c0'>";
                                        } else {
                                            buildlen = build.length - 1;
                                            if (build[buildlen].indexOf("<li") < 0) {
                                                do {
                                                    build[buildlen] = build[buildlen]
                                                        .replace(/<em\u0020class\='[a-z]\d+'>/g, "")
                                                        .replace(/<\/em>/g, "");
                                                    buildlen        = buildlen - 1;
                                                    if (buildlen > 0 && build[buildlen] === undefined) {
                                                        buildlen = buildlen - 1;
                                                    }
                                                } while (
                                                    buildlen > 0 && build[buildlen - 1] !== undefined && build[buildlen].indexOf("<li") < 0
                                                );
                                            }
                                            if ((/^(<em>&#xA;<\/em><\/li><li\u0020class='l\d+'>)$/).test(build[buildlen - 1]) === true) {
                                                build[buildlen - 1] = build[buildlen - 1].replace(
                                                    /class\='l\d+'/,
                                                    "class='c0'"
                                                );
                                            }
                                            build[buildlen] = build[buildlen].replace(/class\='l\d+'/, "class='c0'");
                                        }
                                        build.push(token[a]);
                                    } else {
                                        if (types[a] === "literal" && token[a].indexOf("\n") > 0) {
                                            multiline(token[a]);
                                        } else {
                                            build.push(token[a]);
                                        }
                                    }
                                }
                            }
                            // this condition performs additional calculations for options.preserve.
                            // options.preserve determines whether empty lines should be preserved from the
                            // code input
                            if (options.preserve > 0 && lines[a] > 0 && level[a] > -9 && token[a] !== "+") {
                                //special treatment for math operators
                                if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                                    //comments get special treatment
                                    if (a < b - 1 && types[a + 1] !== "comment" && types[a + 1] !== "comment-inline") {
                                        nl(level[a]);
                                        build.push(tab);
                                        level[a] = -20;
                                    } else {
                                        indent = level[a];
                                        if (lines[a] > 1) {
                                            do {
                                                build.push(lf);
                                                lines[a] = lines[a] - 1;
                                            } while (lines[a] > 1);
                                        }
                                        nl(indent);
                                        build.push(tab);
                                        build.push(token[a + 1]);
                                        nl(indent);
                                        build.push(tab);
                                        level[a + 1] = -20;
                                        a            = a + 1;
                                    }
                                } else if (lines[a] > 1 && token[a].charAt(0) !== "=" && token[a].charAt(0) !== "!" && (types[a] !== "start" || (a < b - 1 && types[a + 1] !== "end"))) {
                                    if ((token[a] !== "x}" || isNaN(level[a]) === true) && (a < b - 1 && (types[a + 1] === "comment" || types[a + 1] === "comment-inline" || (token[a] !== "." && types[a + 1] !== "separator")))) {
                                        do {
                                            nl(0, true);
                                            lines[a] = lines[a] - 1;
                                        } while (lines[a] > 1);
                                        if (types[a] === "comment") {
                                            build.push("<em>&#xA;</em></li><li class='c0'>");
                                        } else {
                                            commentfix = commentfix + 1;
                                            nl(level[a], true);
                                        }
                                    }
                                }
                            }
                            if ((token[a] === ";" || token[a] === "x;") && token[a + 1] === "x}" && ((/<em\u0020class='s\d+'>\}<\/em>/).test(token[a + 2]) === true || token[a + 2] === "x}")) {
                                rl(indent);
                            } else if (token[a] === "x{" && level[a] === -10 && level[a - 1] === -10) {
                                build.push("");
                            } else if (a < b - 1 && types[a + 1] === "comment" && options.comments === "noindent") {
                                nl(options.inlevel);
                            } else if (level[a] === -10 && token[a] !== "x}") {
                                build.push(" ");
                            } else if (token[a] !== "" && level[a] !== -20 && (token[a] !== "x}" || (token[a] === "x}" && (token[a - 1] === "x;" || token[a - 1] === ";") && types[a + 1] !== "word") || lines[a] > 1)) {
                                indent = level[a];
                                nl(indent);
                            }
                            if (folderItem.length > 0) {
                                if (a === folderItem[folderItem.length - 1][1] && comfold === -1) {
                                    foldclose();
                                }
                            }
                        }
                        for (a = build.length - 1; a > -1; a = a - 1) {
                            if (build[a] === tab) {
                                build.pop();
                            } else {
                                break;
                            }
                        }
                        //this logic is necessary to some line counting corrections to the HTML output
                        last = build[build.length - 1];
                        if (last.indexOf("<li") > 0) {
                            build[build.length - 1] = "<em>&#xA;</em></li>";
                        } else if (last.indexOf("</li>") < 0) {
                            build.push("<em>&#xA;</em></li>");
                        }
                        build.push("</ol></div>");
                        last = build.join("");
                        if (last.match(/<li/g) !== null) {
                            scope = last
                                .match(/<li/g)
                                .length;
                            if (linecount - 1 > scope) {
                                linecount = linecount - 1;
                                do {
                                    data.pop();
                                    data.pop();
                                    data.pop();
                                    linecount = linecount - 1;
                                } while (linecount > scope);
                            }
                        }
                        data.push("</ol>");
                        if (options.jsscope === "html") {
                            data.push(last);
                            if (options.newline === true) {
                                if (options.crlf === true) {
                                    data.push("\r\n");
                                } else {
                                    data.push("\n");
                                }
                            }
                            return data.join("");
                        }
                        build = [
                            "<p>Scope analysis does not provide support for undeclared variables.</p>",
                            "<p><em>",
                            scolon,
                            "</em> instances of <strong>missing semicolons</strong> counted.</p>",
                            "<p><em>",
                            news,
                            "</em> unnecessary instances of the keyword <strong>new</strong> counted.</p>",
                            data.join(""),
                            last
                        ];
                        if (options.newline === true) {
                            if (options.crlf === true) {
                                build.push("\r\n");
                            } else {
                                build.push("\n");
                            }
                        }
                        if (options.nodeasync === true) {
                            return [build.join(""), globalerror];
                        }
                        return build.join("");
                    }())
                        .replace(/(\s+)$/, "")
                        .replace(options.functions.binaryCheck, "");
                } else {
                    result = (function jspretty__result_standard() {
                        var a                  = 0,
                            b                  = token.length,
                            build              = [],
                            indent             = options.inlevel,
                            //a function for calculating indentation after each new line
                            nl                 = function jspretty__result_standard_nl(x) {
                                var dd = 0;
                                build.push(lf);
                                for (dd = 0; dd < x; dd = dd + 1) {
                                    build.push(tab);
                                }
                            },
                            rl                 = function jspretty__result_standard_rl(x) {
                                var bb = token.length,
                                    cc = 2,
                                    dd = 0;
                                for (dd = a + 2; dd < bb; dd = dd + 1) {
                                    if (token[dd] === "x}") {
                                        cc = cc + 1;
                                    } else {
                                        break;
                                    }
                                }
                                nl(x - cc);
                                a = a + 1;
                            },
                            markupwrapper      = function jspretty__result_standard_markupwrapper() {
                                var inle = options.inlevel,
                                    mode = options.mode,
                                    jsx  = options.jsx,
                                    nel  = options.newline;
                                options.source  = token[a];
                                options.jsx     = true;
                                options.mode    = "beautify";
                                options.newline = false;
                                if (level[a] < -9 || depth[a] === "array" || token[begin[a]] === "(") {
                                    options.inlevel = indent;
                                } else {
                                    options.inlevel = indent + 1;
                                }
                                build.push(extlib(options));
                                options.jsx     = jsx;
                                options.mode    = mode;
                                options.inlevel = inle;
                                options.newline = nel;
                            },
                            endcomma_multiline = function jspretty__result_standard_endcommaMultiline() {
                                var c = a;
                                if (types[c] === "comment" || types[c] === "comment-inline") {
                                    do {
                                        c = c - 1;
                                    } while (c > 0 && (types[c] === "comment" || types[c] === "comment-inline"));
                                }
                                token[c] = token[c] + ",";
                            };
                        if (verticalop === true) {
                            vertical();
                        }
                        for (a = 0; a < indent; a = a + 1) {
                            build.push(tab);
                        }
                        // this loops combines the white space as determined from the algorithm with the
                        // tokens to create the output
                        for (a = 0; a < b; a = a + 1) {
                            if (options.endcomma === "multiline" && (token[a + 1] === "]" || token[a + 1] === "}") && level[a] > -20) {
                                endcomma_multiline();
                            }
                            if (types[a] === "comment" || (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}" && token[a] !== "x(" && token[a] !== "x)")) {
                                if (types[a] === "markup") {
                                    if (level[a - 1] > -9 && token[a - 1] !== "return" && depth[a] !== "global" && depth[a] !== "array" && types[a] !== "markup") {
                                        build.push(tab);
                                    }
                                    if (typeof global.prettydiff.markuppretty === "function") {
                                        markupwrapper();
                                    } else {
                                        build.push(token[a].replace(/\r?\n(\s*)/g, " "));
                                    }
                                } else {
                                    build.push(token[a]);
                                }
                            }
                            // this condition performs additional calculations if options.preserve === true.
                            // options.preserve determines whether empty lines should be preserved from the
                            // code input
                            if (options.preserve > 0 && ((lines[a] > 0 && level[a] > -9 && token[a] !== "+" && options.qml === false) || (options.qml === true && lines[a] > 1))) {
                                if (options.qml === true) {
                                    do {
                                        build.push(lf);
                                        lines[a] = lines[a] - 1;
                                    } while (lines[a] > 1);
                                    //special treatment for math operators
                                } else if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                                    //comments get special treatment
                                    if (a < b - 1 && types[a + 1] !== "comment" && types[a + 1] !== "comment-inline") {
                                        nl(level[a]);
                                        build.push(tab);
                                        level[a] = -20;
                                    } else {
                                        indent = level[a];
                                        if (lines[a] > 1) {
                                            do {
                                                build.push(lf);
                                                lines[a] = lines[a] - 1;
                                            } while (lines[a] > 1);
                                        }
                                        nl(indent);
                                        build.push(tab);
                                        build.push(token[a + 1]);
                                        nl(indent);
                                        build.push(tab);
                                        level[a + 1] = -20;
                                        a            = a + 1;
                                    }
                                } else if (lines[a] > 1 && token[a].charAt(0) !== "=" && token[a].charAt(0) !== "!" && (types[a] !== "start" || (a < b - 1 && types[a + 1] !== "end"))) {
                                    if (a < b - 1 && (types[a + 1] === "comment" || types[a + 1] === "comment-inline" || (token[a] !== "." && types[a + 1] !== "separator"))) {
                                        if (token[a] !== "x}" || isNaN(level[a]) === true || level[a] === -20) {
                                            do {
                                                build.push(lf);
                                                lines[a] = lines[a] - 1;
                                            } while (lines[a] > 1);
                                        }
                                    }
                                }
                            }
                            if ((token[a] === ";" || token[a] === "x;") && token[a + 1] === "x}" && (token[a + 2] === "}" || token[a + 2] === "x}")) {
                                rl(indent);
                            } else if (token[a] === "x{" && level[a] === -10 && level[a - 1] === -10) {
                                build.push("");
                                //adds a new line and no indentation
                            } else if (a < b - 1 && types[a + 1] === "comment" && options.comments === "noindent") {
                                nl(options.inlevel);
                            } else if (level[a] === -10 && token[a] !== "x}") {
                                build.push(" ");
                                //adds a new line and indentation
                            } else if (token[a] !== "" && level[a] !== -20 && (token[a] !== "x}" || (token[a] === "x}" && (token[a - 1] === "x;" || token[a - 1] === ";") && types[a + 1] !== "word") || lines[a] > 1)) {
                                indent = level[a];
                                nl(indent);
                            }
                        }
                        for (a = build.length - 1; a > -1; a = a - 1) {
                            if (build[a] === tab) {
                                build.pop();
                            } else {
                                break;
                            }
                        }
                        if (options.preserve > 0 && lines[lines.length - 1] > 0) {
                            if (options.nodeasync === true) {
                                return [
                                    build
                                        .join("")
                                        .replace(/(\s+)$/, lf),
                                    globalerror
                                ];
                            }
                            return build
                                .join("")
                                .replace(/(\s+)$/, lf);
                        }
                        if (options.newline === true) {
                            if (options.crlf === true) {
                                build.push("\r\n");
                            } else {
                                build.push("\n");
                            }
                        }
                        if (options.nodeasync === true) {
                            return [
                                build
                                    .join("")
                                    .replace(/(\s+)$/, ""),
                                globalerror
                            ];
                        }
                        return build
                            .join("")
                            .replace(/(\s+)$/, "");
                    }());
                }
            }());
            //the analysis report is generated in this function
            if (options.mode === "analysis") {
                return (function jspretty__report() {
                    var noOfLines = result
                            .split(lf)
                            .length,
                        newlines  = stats.space.newline,
                        percent   = 0,
                        total     = {
                            chars  : 0,
                            comment: {
                                chars: stats.commentBlock.chars + stats.commentLine.chars,
                                token: stats.commentBlock.token + stats.commentLine.token
                            },
                            literal: {
                                chars: stats.number.chars + stats.regex.chars + stats.string.chars,
                                token: stats.number.token + stats.regex.token + stats.string.token
                            },
                            space  : stats.space.newline + stats.space.other + stats.space.space + stats.space.tab,
                            syntax : {
                                chars: 0,
                                token: stats.string.quote + stats.comma + stats.semicolon + stats.container
                            },
                            token  : 0
                        },
                        output    = [],
                        zero      = function jspretty__report_zero(x, y) {
                            var ratio = 0;
                            if (y === 0) {
                                return "0.00%";
                            }
                            ratio = ((x / y) * 100);
                            return ratio.toFixed(2) + "%";
                        };
                    total.syntax.chars = total.syntax.token + stats.operator.chars;
                    total.syntax.token = total.syntax.token + stats.operator.token;
                    total.token        = stats.server.token + stats.word.token + total.comment.token +
                            total.literal.token + total.space + total.syntax.token;
                    total.chars        = stats.server.chars + stats.word.chars + total.comment.chars +
                            total.literal.chars + total.space + total.syntax.chars;
                    if (newlines === 0) {
                        newlines = 1;
                    }
                    output.push("<div class='report'>");
                    if (error.length > 0) {
                        output.push("<p id='jserror'><strong>Error: ");
                        output.push(
                            error[0].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(options.functions.binaryCheck, "")
                        );
                        output.push("</strong> <code><span>");
                        error[1] = error[1]
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(options.functions.binaryCheck, "")
                            .replace(/^(\s+)/, "");
                        if (error.indexOf("\n") > 0) {
                            output.push(error[1].replace(lf, "</span>"));
                        } else {
                            output.push(error[1]);
                            output.push("</span>");
                        }
                        output.push("</code></p>");
                    }
                    output.push("<p><em>");
                    output.push(scolon);
                    output.push("</em> instance");
                    if (scolon !== 1) {
                        output.push("s");
                    }
                    output.push(" of <strong>missing semicolons</strong> counted.</p>");
                    output.push("<p><em>");
                    output.push(news);
                    output.push("</em> unnessary instance");
                    if (news !== 1) {
                        output.push("s");
                    }
                    output.push(" of the keyword <strong>new</strong> counted.</p>");
                    output.push(
                        "<table class='analysis' summary='JavaScript character size comparison'><captio" +
                        "n>JavaScript data report</caption><thead><tr><th>Data Label</th><th>Input</th>" +
                        "<th>Output</th><th>Literal Increase</th><th>Percentage Increase</th></tr>"
                    );
                    output.push("</thead><tbody><tr><th>Total Character Size</th><td>");
                    output.push(originalSize);
                    output.push("</td><td>");
                    output.push(result.length);
                    output.push("</td><td>");
                    output.push(result.length - originalSize);
                    output.push("</td><td>");
                    percent = (((result.length - originalSize) / originalSize) * 100);
                    output.push(percent.toFixed(2));
                    output.push("%</td></tr><tr><th>Total Lines of Code</th><td>");
                    output.push(newlines);
                    output.push("</td><td>");
                    output.push(noOfLines);
                    output.push("</td><td>");
                    output.push(noOfLines - newlines);
                    output.push("</td><td>");
                    percent = (((noOfLines - newlines) / newlines) * 100);
                    output.push(percent.toFixed(2));
                    output.push("%</td></tr></tbody></table>");
                    output.push(
                        "<table class='analysis' summary='JavaScript component analysis'><caption>JavaS" +
                        "cript component analysis</caption><thead><tr><th>JavaScript Component</th><th>" +
                        "Component Quantity</th><th>Percentage Quantity from Section</th>"
                    );
                    output.push(
                        "<th>Percentage Qauntity from Total</th><th>Character Length</th><th>Percentage" +
                        " Length from Section</th><th>Percentage Length from Total</th></tr></thead><tb" +
                        "ody>"
                    );
                    output.push("<tr><th>Total Accounted</th><td>");
                    output.push(total.token);
                    output.push("</td><td>100.00%</td><td>100.00%</td><td>");
                    output.push(total.chars);
                    output.push(
                        "</td><td>100.00%</td><td>100.00%</td></tr><tr><th colspan='7'>Comments</th></t" +
                        "r><tr><th>Block Comments</th><td>"
                    );
                    output.push(stats.commentBlock.token);
                    output.push("</td><td>");
                    output.push(zero(stats.commentBlock.token, total.comment.token));
                    output.push("</td><td>");
                    output.push(zero(stats.commentBlock.token, total.token));
                    output.push("</td><td>");
                    output.push(stats.commentBlock.chars);
                    output.push("</td><td>");
                    output.push(zero(stats.commentBlock.chars, total.comment.chars));
                    output.push("</td><td>");
                    output.push(zero(stats.commentBlock.chars, total.chars));
                    output.push("</td></tr><tr><th>Inline Comments</th><td>");
                    output.push(stats.commentLine.token);
                    output.push("</td><td>");
                    output.push(zero(stats.commentLine.token, total.comment.token));
                    output.push("</td><td>");
                    output.push(zero(stats.commentLine.token, total.token));
                    output.push("</td><td>");
                    output.push(stats.commentLine.chars);
                    output.push("</td><td>");
                    output.push(zero(stats.commentLine.chars, total.comment.chars));
                    output.push("</td><td>");
                    output.push(zero(stats.commentLine.chars, total.chars));
                    output.push("</td></tr><tr><th>Comment Total</th><td>");
                    output.push(total.comment.token);
                    output.push("</td><td>100.00%</td><td>");
                    output.push(zero(total.comment.token, total.token));
                    output.push("</td><td>");
                    output.push(total.comment.chars);
                    output.push("</td><td>100.00%</td><td>");
                    output.push(zero(total.comment.chars, total.chars));
                    output.push(
                        "</td></tr><tr><th colspan='7'>Whitespace Outside of Strings and Comments</th><" +
                        "/tr><tr><th>New Lines</th><td>"
                    );
                    output.push(stats.space.newline);
                    output.push("</td><td>");
                    output.push(zero(stats.space.newline, total.space));
                    output.push("</td><td>");
                    output.push(zero(stats.space.newline, total.token));
                    output.push("</td><td>");
                    output.push(stats.space.newline);
                    output.push("</td><td>");
                    output.push(zero(stats.space.newline, total.space));
                    output.push("</td><td>");
                    output.push(zero(stats.space.newline, total.chars));
                    output.push("</td></tr><tr><th>Spaces</th><td>");
                    output.push(stats.space.space);
                    output.push("</td><td>");
                    output.push(zero(stats.space.space, total.space));
                    output.push("</td><td>");
                    output.push(zero(stats.space.space, total.token));
                    output.push("</td><td>");
                    output.push(stats.space.space);
                    output.push("</td><td>");
                    output.push(zero(stats.space.space, total.space));
                    output.push("</td><td>");
                    output.push(zero(stats.space.space, total.chars));
                    output.push("</td></tr><tr><th>Tabs</th><td>");
                    output.push(stats.space.tab);
                    output.push("</td><td>");
                    output.push(zero(stats.space.tab, total.space));
                    output.push("</td><td>");
                    output.push(zero(stats.space.tab, total.token));
                    output.push("</td><td>");
                    output.push(stats.space.tab);
                    output.push("</td><td>");
                    output.push(zero(stats.space.tab, total.space));
                    output.push("</td><td>");
                    output.push(zero(stats.space.tab, total.chars));
                    output.push("</td></tr><tr><th>Other Whitespace</th><td>");
                    output.push(stats.space.other);
                    output.push("</td><td>");
                    output.push(zero(stats.space.other, total.space));
                    output.push("</td><td>");
                    output.push(zero(stats.space.other, total.token));
                    output.push("</td><td>");
                    output.push(stats.space.other);
                    output.push("</td><td>");
                    output.push(zero(stats.space.other, total.space));
                    output.push("</td><td>");
                    output.push(zero(stats.space.other, total.chars));
                    output.push("</td></tr><tr><th>Total Whitespace</th><td>");
                    output.push(total.space);
                    output.push("</td><td>100.00%</td><td>");
                    output.push(zero(total.space, total.token));
                    output.push("</td><td>");
                    output.push(total.space);
                    output.push("</td><td>100.00%</td><td>");
                    output.push(zero(total.space, total.chars));
                    output.push(
                        "</td></tr><tr><th colspan='7'>Literals</th></tr><tr><th>Strings</th><td>"
                    );
                    output.push(stats.string.token);
                    output.push("</td><td>");
                    output.push(zero(stats.string.token, total.literal.token));
                    output.push("</td><td>");
                    output.push(zero(stats.string.token, total.token));
                    output.push("</td><td>");
                    output.push(stats.string.chars);
                    output.push("</td><td>");
                    output.push(zero(stats.string.chars, total.literal.chars));
                    output.push("</td><td>");
                    output.push(zero(stats.string.chars, total.chars));
                    output.push("</td></tr><tr><th>Numbers</th><td>");
                    output.push(stats.number.token);
                    output.push("</td><td>");
                    output.push(zero(stats.number.token, total.literal.token));
                    output.push("</td><td>");
                    output.push(zero(stats.number.token, total.token));
                    output.push("</td><td>");
                    output.push(stats.number.chars);
                    output.push("</td><td>");
                    output.push(zero(stats.number.chars, total.literal.chars));
                    output.push("</td><td>");
                    output.push(zero(stats.number.chars, total.chars));
                    output.push("</td></tr><tr><th>Regular Expressions</th><td>");
                    output.push(stats.regex.token);
                    output.push("</td><td>");
                    output.push(zero(stats.regex.token, total.literal.token));
                    output.push("</td><td>");
                    output.push(zero(stats.regex.token, total.token));
                    output.push("</td><td>");
                    output.push(stats.regex.chars);
                    output.push("</td><td>");
                    output.push(zero(stats.regex.chars, total.literal.chars));
                    output.push("</td><td>");
                    output.push(zero(stats.regex.chars, total.chars));
                    output.push("</td></tr><tr><th>Total Literals</th><td>");
                    output.push(total.literal.token);
                    output.push("</td><td>100.00%</td><td>");
                    output.push(zero(total.literal.token, total.token));
                    output.push("</td><td>");
                    output.push(total.literal.chars);
                    output.push("</td><td>100.00%</td><td>");
                    output.push(zero(total.literal.chars, total.chars));
                    output.push(
                        "</td></tr><tr><th colspan='7'>Syntax Characters</th></tr><tr><th>Quote Charact" +
                        "ers</th><td>"
                    );
                    output.push(stats.string.quote);
                    output.push("</td><td>");
                    output.push(zero(stats.string.quote, total.syntax.token));
                    output.push("</td><td>");
                    output.push(zero(stats.string.quote, total.token));
                    output.push("</td><td>");
                    output.push(stats.string.quote);
                    output.push("</td><td>");
                    output.push(zero(stats.string.quote, total.syntax.chars));
                    output.push("</td><td>");
                    output.push(zero(stats.string.quote, total.chars));
                    output.push("</td></tr><tr><th>Commas</th><td>");
                    output.push(stats.comma);
                    output.push("</td><td>");
                    output.push(zero(stats.comma, total.syntax.token));
                    output.push("</td><td>");
                    output.push(zero(stats.comma, total.token));
                    output.push("</td><td>");
                    output.push(stats.comma);
                    output.push("</td><td>");
                    output.push(zero(stats.comma, total.syntax.chars));
                    output.push("</td><td>");
                    output.push(zero(stats.comma, total.chars));
                    output.push("</td></tr><tr><th>Containment Characters</th><td>");
                    output.push(stats.container);
                    output.push("</td><td>");
                    output.push(zero(stats.container, total.syntax.token));
                    output.push("</td><td>");
                    output.push(zero(stats.container, total.token));
                    output.push("</td><td>");
                    output.push(stats.container);
                    output.push("</td><td>");
                    output.push(zero(stats.container, total.syntax.chars));
                    output.push("</td><td>");
                    output.push(zero(stats.container, total.chars));
                    output.push("</td></tr><tr><th>Semicolons</th><td>");
                    output.push(stats.semicolon);
                    output.push("</td><td>");
                    output.push(zero(stats.semicolon, total.syntax.token));
                    output.push("</td><td>");
                    output.push(zero(stats.semicolon, total.token));
                    output.push("</td><td>");
                    output.push(stats.semicolon);
                    output.push("</td><td>");
                    output.push(zero(stats.semicolon, total.syntax.chars));
                    output.push("</td><td>");
                    output.push(zero(stats.semicolon, total.chars));
                    output.push("</td></tr><tr><th>Operators</th><td>");
                    output.push(stats.operator.token);
                    output.push("</td><td>");
                    output.push(zero(stats.operator.token, total.syntax.token));
                    output.push("</td><td>");
                    output.push(zero(stats.operator.token, total.token));
                    output.push("</td><td>");
                    output.push(stats.operator.chars);
                    output.push("</td><td>");
                    output.push(zero(stats.operator.chars, total.syntax.chars));
                    output.push("</td><td>");
                    output.push(zero(stats.operator.chars, total.chars));
                    output.push("</td></tr><tr><th>Total Syntax Characters</th><td>");
                    output.push(total.syntax.token);
                    output.push("</td><td>100.00%</td><td>");
                    output.push(zero(total.syntax.token, total.token));
                    output.push("</td><td>");
                    output.push(total.syntax.chars);
                    output.push("</td><td>100.00%</td><td>");
                    output.push(zero(total.syntax.chars, total.chars));
                    output.push("</td></tr>");
                    output.push(
                        "<tr><th colspan='7'>Keywords and Variables</th></tr><tr><th>Words</th><td>"
                    );
                    output.push(stats.word.token);
                    output.push("</td><td>100.00%</td><td>");
                    output.push(zero(stats.word.token, total.token));
                    output.push("</td><td>");
                    output.push(stats.word.chars);
                    output.push("</td><td>100.00%</td><td>");
                    output.push(zero(stats.word.chars, total.chars));
                    output.push("</td></tr>");
                    output.push(
                        "<tr><th colspan='7'>Server-side Tags</th></tr><tr><th>Server Tags</th><td>"
                    );
                    output.push(stats.server.token);
                    output.push("</td><td>100.00%</td><td>");
                    output.push(zero(stats.server.token, total.token));
                    output.push("</td><td>");
                    output.push(stats.server.chars);
                    output.push("</td><td>100.00%</td><td>");
                    output.push(zero(stats.server.chars, total.chars));
                    output.push("</td></tr></tbody></table></div>");
                    if (options.nodeasync === true) {
                        return [output.join(""), globalerror];
                    }
                    return output.join("");
                }());
            }
        }
        return result;
    },
    csspretty = function csspretty_(options) {
        var token      = [],
            types      = [],
            lines      = [],
            depth      = [],
            begin      = [],
            uri        = [],
            colors     = [],
            output     = "",
            endline    = false,
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
            },
            stats      = {
                braces    : 0,
                colon     : 0,
                comments  : {
                    chars: 0,
                    count: 0
                },
                properties: {
                    chars: 0,
                    count: 0
                },
                selectors : {
                    chars: 0,
                    count: 0
                },
                semi      : 0,
                space     : 0,
                values    : {
                    chars: 0,
                    count: 0
                },
                variables : {
                    chars: 0,
                    count: 0
                }
            },
            lf         = (options.crlf === true || options.crlf === "true")
                ? "\r\n"
                : "\n";
        (function csspretty__options() {
            objsortop      = (
                options.objsort === true || options.objsort === "true" || options.objsort === "all" || options.objsort === "css"
            );
            verticalop     = (
                options.compressedcss === false && (options.vertical === true || options.vertical === "true" || options.vertical === "all" || options.vertical === "css")
            );
            options.source = (
                typeof options.source === "string" && options.source.length > 0
            )
                ? options
                    .source
                    .replace(/\r\n?/g, "\n") + " "
                : "Error: no source code supplied to csspretty!";
        }());
        if (typeof options.source !== "string" || options.source === "" || (/^(\s+)$/).test(options.source) === true) {
            if (options.nodeasync === true) {
                return [options.source, "Error: no source supplied to csspretty."];
            }
            if (global.prettydiff.meta === undefined) {
                global.prettydiff.meta = {};
            }
            global.prettydiff.meta.error = options.source;
            return options.source;
        }
        (function csspretty__tokenize() {
            var a          = 0,
                b          = options
                    .source
                    .split(""),
                len        = options.source.length,
                ltype      = "",
                itemsize   = 0,
                space      = "",
                endtest    = false,
                struct     = [0],
                mapper     = [],
                structval  = "root",
                nosort     = [],
                esctest    = function csspretty__tokenize_esctest(xx) {
                    var yy = xx;
                    do {
                        xx = xx - 1;
                    } while (xx > 0 && b[xx] === "\\");
                    if ((yy - xx) % 2 === 0) {
                        return true;
                    }
                    return false;
                },
                // Since I am already identifying value types this is a good place to do some
                // quick analysis and clean up on certain value conditions. These things are
                // being corrected:
                //  * fractional values missing a leading 0 are    provided a leading 0
                // * 0 values with a dimension indicator    (px, em) have the dimension
                // indicator    removed
                //  * eliminate unnecessary leading 0s
                //  * url values that are not quoted are wrapped    in double quote characters
                // * color values are set to lowercase and    reduced from 6 to 3 digits if
                // appropriate
                value      = function csspretty__tokenize_item_value(val, font) {
                    var x         = val.split(""),
                        leng      = x.length,
                        cc        = 0,
                        dd        = 0,
                        items     = [],
                        block     = "",
                        values    = [],
                        qchar     = "",
                        qreg      = {},
                        colorPush = function csspretty__tokenize_item_value_colorPush(value) {
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
                        } else if ((/^(0+([a-z]{2,3}|%))$/).test(values[cc]) === true) {
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
                spacer     = function csspretty__tokenize_space(end) {
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
                        endline = true;
                        space   = "";
                        return val;
                    }
                    space = "";
                    return val;
                },
                //sort parsed properties intelligently
                objSort    = function csspretty__tokenize_objSort() {
                    var cc        = 0,
                        dd        = 0,
                        ee        = 0,
                        startlen  = token.length - 1,
                        end       = startlen,
                        keys      = [],
                        keylen    = 0,
                        keyend    = 0,
                        start     = 0,
                        sort      = function csspretty__tokenize_objSort_sort(x, y) {
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
                        pairDepth = [],
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
                                    depth.push(depth[depth.length - 1]);
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
                                        pairDepth.push(depth[ee]);
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
                                        pairDepth.splice(ee, 0, pairDepth[ee]);
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
                                depth.splice(cc + 1, keylen);
                                begin.splice(cc + 1, keylen);
                                token = token.concat(pairToken);
                                types = types.concat(pairTypes);
                                lines = lines.concat(pairLines);
                                depth = depth.concat(pairDepth);
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
                                        depth.splice(cc, 1);
                                        begin.splice(cc, 1);
                                    }
                                }
                            }
                            return;
                        }
                    }
                },
                //the generic token builder
                buildtoken = function csspretty__tokenize_build() {
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
                                depth.pop();
                                begin.pop();
                                struct.pop();
                                structval = depth[depth.length - 1];
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
                    a        = aa;
                    itemsize = out.length;
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
                    depth.push(structval);
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
                },
                // Some tokens receive a generic type named 'item' because their type is unknown
                // until we know the following syntax.  This function replaces the type 'item'
                // with something more specific.
                item       = function csspretty__tokenize_item(type) {
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
                            stats.selectors.count = stats.selectors.count + 1;
                            stats.selectors.chars = stats.selectors.chars + itemsize;
                            if (types[aa - 1] !== "comment" && types[aa - 1] !== "comment-inline" && types[aa - 1] !== "end" && types[aa - 1] !== "start" && types[aa - 1] !== "semi" && types[aa - 1] !== undefined && types[aa - 1].indexOf("external") < 0) {
                                (function csspretty__tokenize_item_selparts() {
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
                                    depth.splice(cc, dd);
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
                            (function csspretty__tokenize_item_selectorsort() {
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
                                token[aa] = list.join(",").replace(/^(\s+)/, "");
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
                                    stats.values.count      = stats.values.count - 1;
                                    stats.values.chars      = stats.values.chars - itemsize;
                                    stats.variables.count   = stats.variables.count + 1;
                                    stats.variables.chars   = stats.variables.chars + itemsize;
                                } else if (structval === "block") {
                                    if (coms.length > 0 && ltype !== "semi" && ltype !== "end" && ltype !== "start") {
                                        aa = coms.length - 1;
                                        do {
                                            token.pop();
                                            types.pop();
                                            lines.pop();
                                            depth.pop();
                                            begin.pop();
                                            aa = aa - 1;
                                        } while (aa > 0);
                                        if (options.mode === "diff") {
                                            token.push("x;");
                                        } else {
                                            token.push(";");
                                        }
                                        depth.push(structval);
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
                                            depth.push(structval);
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
                                        depth.push(structval);
                                        begin.push(struct[struct.length - 1]);
                                        types.push("semi");
                                        lines.push(spacer(false));
                                    }
                                }
                            }
                            stats.values.count = stats.values.count + 1;
                            stats.values.chars = stats.values.chars + itemsize;
                        } else if (type === "semi") {
                            if (types[aa - 1] === "colon") {
                                stats.values.count = stats.values.count + 1;
                                stats.values.chars = stats.values.chars + itemsize;
                                types[aa]          = "value";
                                ltype              = "value";
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
                                stats.variables.count = stats.variables.count + 1;
                                stats.variables.chars = stats.variables.chars + itemsize;
                            }
                        } else if (type === "colon") {
                            types[aa]              = "property";
                            ltype                  = "property";
                            stats.properties.count = stats.properties.count + 1;
                            stats.properties.chars = stats.properties.chars + itemsize;
                        } else if (token[aa].charAt(0) === "@" && ((types[aa - 2] !== "propvar" && types[aa - 2] !== "property") || types[aa - 1] === "semi")) {
                            types[aa] = "propvar";
                            ltype     = "propvar";
                        }
                    }
                },
                external   = function csspretty__tokenize_external(open, end) {
                    var store  = [],
                        quote  = "",
                        name   = "",
                        endlen = 0,
                        start  = open.length,
                        linev  = spacer(false),
                        exit   = function csspretty__tokenize_external_exit(typename) {
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
                                    depth.push(structval);
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
                comment    = function csspretty__tokenize_comment(inline) {
                    var aa        = 0,
                        bb        = 0,
                        out       = [b[a]],
                        type      = "comment",
                        extra     = "",
                        spareType = [],
                        spareToke = [],
                        spareLine = [],
                        spareBegn = [],
                        spareDept = [],
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
                    a                    = aa;
                    stats.comments.count = stats.comments.count + 1;
                    stats.comments.chars = stats.comments.chars + out.length;
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
                            depth.pop();
                            begin.push(struct[struct.length - 1]);
                            depth.push(structval);
                            token.push(out.join(""));
                            types.push(type);
                            lines.push(linev);
                            begin.push(struct[struct.length - 1]);
                            depth.push(structval);
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
                                spareDept.push(depth[depth.length - 1]);
                                spareBegn.push(begin[begin.length - 1]);
                                token.pop();
                                types.pop();
                                lines.pop();
                                depth.pop();
                                begin.pop();
                            } while (
                                types.length > 1 && types[types.length - 1] !== "semi" && types[types.length - 1] !== "start"
                            );
                            token.push(out.join(""));
                            types.push(type);
                            lines.push(linev);
                            depth.push(structval);
                            begin.push(struct[struct.length - 1]);
                            do {
                                token.push(spareToke[spareToke.length - 1]);
                                types.push(spareType[spareType.length - 1]);
                                lines.push(spareLine[spareLine.length - 1]);
                                depth.push(spareDept[spareDept.length - 1]);
                                begin.push(spareBegn[spareBegn.length - 1]);
                                spareToke.pop();
                                spareType.pop();
                                spareLine.pop();
                                spareDept.pop();
                                spareBegn.pop();
                            } while (spareToke.length > 0);
                        } else {
                            ltype = type;
                            types.push(type);
                            token.push(out.join(""));
                            lines.push(linev);
                            depth.push(structval);
                            begin.push(struct[struct.length - 1]);
                        }
                    }
                },
                //do fancy things to property types like: sorting, consolidating, and padding
                properties = function csspretty__tokenize_properties() {
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
                        sdept = [],
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
                    (function csspretty__tokenize_properties_propcheck() {
                        var leng      = set.length,
                            fourcount = function csspretty__tokenize_properties_propcheck_fourcount(name) {
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
                                    store    = function csspretty__tokenize_properties_propcheck_fourcount_store(side) {
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
                            sdept.push(depth[set[aa][cc]]);
                            sbegn.push(begin[set[aa][cc]]);
                        }
                    }
                    //replace a block's data with sorted analyzed data
                    token.splice(next + 1, token.length - next - 1);
                    types.splice(next + 1, types.length - next - 1);
                    lines.splice(next + 1, lines.length - next - 1);
                    depth.splice(next + 1, depth.length - next - 1);
                    begin.splice(next + 1, begin.length - next - 1);
                    token = token.concat(stoke);
                    types = types.concat(stype);
                    lines = lines.concat(sline);
                    depth = depth.concat(sdept);
                    begin = begin.concat(sbegn);
                };
            //token building loop
            for (a = 0; a < len; a = a + 1) {
                if (ltype !== "comment" && ltype !== "comment-inline" && ltype !== "" && options.topcoms === true) {
                    options.topcoms = false;
                }
                if ((/\s/).test(b[a]) === true) {
                    stats.space = stats.space + 1;
                    space       = space + b[a];
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
                    depth.push(depth[depth.length - 1]);
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
                        depth.push("map");
                        mapper.push(0);
                    } else {
                        structval = "block";
                        depth.push("block");
                    }
                    nosort.push(false);
                    lines.push(spacer(false));
                    stats.braces = stats.braces + 1;
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
                        depth.pop();
                        depth.pop();
                        begin.pop();
                        begin.pop();
                    } else {
                        if (b[a] === ")") {
                            mapper.pop();
                        } else if (b[a] === "}" && ltype === "value" && token[token.length - 1] !== ";") {
                            token.push(";");
                            types.push("semi");
                            lines.push(0);
                            depth.push("block");
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
                        depth.push(structval);
                        begin.push(struct[struct.length - 1]);
                        stats.braces = stats.braces + 1;
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
                        depth.push(structval);
                        begin.push(begin[begin.length - 1]);
                    }
                    stats.semi = stats.semi + 1;
                    space      = "";
                } else if (b[a] === ":" && types[types.length - 1] !== "end") {
                    item("colon");
                    types.push("colon");
                    token.push(":");
                    if ((/\s/).test(b[a - 1]) === true) {
                        lines.push(1);
                    } else {
                        lines.push(0);
                    }
                    ltype       = "colon";
                    stats.colon = stats.colon + 1;
                    space       = "";
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

        if (options.mode === "parse") {
            return (function csspretty__parse() {
                var a      = 0,
                    c      = token.length,
                    record = [],
                    def    = {
                        token: "string - The parsed code tokens",
                        types: "string - Data types of the tokens: colon, comment, comment-inline, end, extern" +
                                "al, external_else, external_end, external_start, item, propvar, pseudo, select" +
                                "or, semi, start, value",
                        lines: "number - Whether the token is preceeded any space and/or line breaks in the or" +
                                "iginal code source",
                        depth: "string - Type of current structure",
                        begin: "number - Index where current structure begins"
                    };
                if (options.parseFormat === "sequential") {
                    for (a = 0; a < c; a = a + 1) {
                        record.push([
                            token[a], types[a], lines[a], depth[a], begin[a]
                        ]);
                    }
                    if (options.nodeasync === true) {
                        return [
                            {
                                data      : record,
                                definition: def
                            },
                            ""
                        ];
                    }
                    return {data: record, definition: def};
                }
                if (options.parseFormat === "htmltable") {
                    return (function csspretty__parse_html() {
                        var report = [],
                            aa     = 0,
                            len    = 0;
                        report.push("<table summary='CSS parse table'><thead><tr><th>index</th>");
                        report.push("<th>token</th>");
                        report.push("<th>types</th>");
                        report.push("<th>lines</th>");
                        report.push("<th>depth</th>");
                        report.push("<th>begin</th>");
                        report.push("</tr></thead><tbody>");
                        len = token.length;
                        for (aa = 0; aa < len; aa = aa + 1) {
                            report.push("<tr><td>");
                            report.push(aa);
                            report.push("</td><td>");
                            report.push(
                                token[aa].replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;")
                            );
                            report.push("</td><td>");
                            report.push(types[aa]);
                            report.push("</td><td>");
                            report.push(lines[aa]);
                            report.push("</td><td>");
                            report.push(depth[aa]);
                            report.push("</td><td>");
                            report.push(begin[aa]);
                            report.push("</td></tr>");
                        }
                        report.push("</tbody></table>");
                        if (options.nodeasync === true) {
                            return [
                                {
                                    data      : report.join(""),
                                    definition: def
                                },
                                ""
                            ];
                        }
                        return {data: report.join(""), definition: def};
                    }());
                }
                if (options.nodeasync === true) {
                    return [
                        {
                            data      : {
                                token: token,
                                types: types,
                                lines: lines,
                                depth: depth,
                                begin: begin
                            },
                            definition: def
                        },
                        ""
                    ];
                }
                return {
                    data      : {
                        token: token,
                        types: types,
                        lines: lines,
                        depth: depth,
                        begin: begin
                    },
                    definition: def
                };
            }());
        }

        //analysis
        if (options.mode === "analysis") {
            return (function csspretty__summary() {
                var summ  = [],
                    inl   = options.source.length,
                    out   = output.length,
                    uris  = uri.length,
                    uric  = 0,
                    a     = 0,
                    b     = 0,
                    color = [];
                (function csspretty_summary_colorNormalize() {
                    var aa = 0,
                        bb = 0,
                        cc = colors.length;
                    colors.sort();
                    color.push(colors[0]);
                    for (aa = 0; aa < cc; aa = aa + 1) {
                        if (colors[aa] !== color[bb]) {
                            color.push(colors[aa]);
                            bb = bb + 1;
                        }
                    }
                }());
                summ.push(
                    "<div class='report' id='cssreport'><p><strong>Number of HTTP requests:</strong" +
                    "> <em>"
                );
                summ.push(uris);
                summ.push(
                    "</em></p><table class='analysis' id='css-parts' summary='Component counts and " +
                    "sizes'><caption>Component counts and sizes</caption><thead><tr><th>Type Name</" +
                    "th><th>Quantity</th><th>Character Size</th></tr></thead><tbody><tr><th>curly b" +
                    "races</th><td>"
                );
                summ.push(stats.braces);
                summ.push("</td><td>");
                summ.push(stats.braces);
                summ.push("</td></tr><tr><th>colon</th><td>");
                summ.push(stats.colon);
                summ.push("</td><td>");
                summ.push(stats.colon);
                summ.push("</td></tr><tr><th>comments</th><td>");
                summ.push(stats.comments.count);
                summ.push("</td><td>");
                summ.push(stats.comments.chars);
                summ.push("</td></tr><tr><th>properties</th><td>");
                summ.push(stats.properties.count);
                summ.push("</td><td>");
                summ.push(stats.properties.chars);
                summ.push("</td></tr><tr><th>selectors</th><td>");
                summ.push(stats.selectors.count);
                summ.push("</td><td>");
                summ.push(stats.selectors.chars);
                summ.push("</td></tr><tr><th>semicolons</th><td>");
                summ.push(stats.semi);
                summ.push("</td><td>");
                summ.push(stats.semi);
                summ.push("</td></tr><tr><th>white space</th><td>");
                summ.push(stats.space);
                summ.push("</td><td>");
                summ.push(stats.space);
                summ.push("</td></tr><tr><th>values</th><td>");
                summ.push(stats.values.count);
                summ.push("</td><td>");
                summ.push(stats.values.chars);
                summ.push("</td></tr><tr><th>variables</th><td>");
                summ.push(stats.variables.count);
                summ.push("</td><td>");
                summ.push(stats.variables.chars);
                summ.push(
                    "</td></tr></tbody></table><table class='analysis' id='css-size' summary='CSS c" +
                    "haracter size change'><caption>CSS character size change</caption><tbody><tr><" +
                    "th>Input</th><td>"
                );
                summ.push(inl);
                summ.push("</td></tr><tr><th>Output</th><td>");
                summ.push(out);
                summ.push("</td></tr><tr><th>");
                if (out > inl) {
                    summ.push("Increase</th><td>");
                    summ.push(out - inl);
                    summ.push("</td></tr><tr><th>Percent Change</th><td>");
                    a = (((out - inl) / out) * 100);
                    summ.push(a.toFixed(2));
                } else {
                    summ.push("Decrease</th><td>");
                    summ.push(inl - out);
                    summ.push("</td></tr><tr><th>Percent Change</th><td>");
                    a = (((inl - out) / inl) * 100);
                    summ.push(a.toFixed(2));
                }
                summ.push(
                    "%</td></tr></tbody></table><table class='analysis' id='css-uri' summary='A lis" +
                    "t of HTTP requests'><caption>A List of HTTP Requests</caption><thead><tr><th>Q" +
                    "uantity</th><th>URI</th></tr></thead><tbody>"
                );
                for (a = 0; a < uris; a = a + 1) {
                    uric = 1;
                    for (b = a + 1; b < uris; b = b + 1) {
                        if (uri[a] === uri[b]) {
                            uric = uric + 1;
                            uri.splice(b, 1);
                            uris = uris - 1;
                        }
                    }
                    summ.push("<tr><td>");
                    summ.push(uric);
                    summ.push("</td><td>");
                    summ.push(
                        uri[a].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                    );
                    summ.push("</td></tr>");
                }
                summ.push("</tbody></table>");
                summ.push("</div><span class='clear'></span>");
                if (color.length === 0) {
                    summ.push("<h4>0 colors were identified in the provided code.</h4>");
                } else {
                    summ.push("<h4>These ");
                    summ.push(color.length);
                    if (color.length > 1) {
                        summ.push(" different");
                    }
                    summ.push(" color");
                    if (color.length > 1) {
                        summ.push("s");
                    }
                    summ.push(" were identified in the provided code:</h4><p>");
                    summ.push(color.join(", "));
                    summ.push("</p>");
                    if (options.accessibility === true) {
                        (function csspretty__summary_colorConvert() {
                            var vl        = "",
                                bb        = color.length,
                                aa        = 0,
                                luminance = function csspretty__summary_colorConvert_luminance(rgb) {
                                    var convert = function csspretty__summary_colorConvert_luminance_convert(x) {
                                        if (x === 0) {
                                            return 0;
                                        }
                                        x = (x / 255);
                                        if ((x * 100000) <= 3928) {
                                            return ((x * 100) / 1292) * 10000;
                                        }
                                        x = x * 100000;
                                        return Math.pow(((x + 5500) / 105500), 2.4) * 10000;
                                    };
                                    return (
                                        (2126 * convert(rgb[0])) + (7152 * convert(rgb[1])) + (722 * convert(rgb[2]))
                                    ) / 100000000;
                                },
                                hexToDec  = function csspretty__summary_colorConvert_hexToDec(val) {
                                    var str = val
                                            .slice(1)
                                            .split(""),
                                        rgb = [],
                                        num = [],
                                        aaa = 0,
                                        bbb = str.length;
                                    for (aaa = 0; aaa < bbb; aaa = aaa + 1) {
                                        if (str[aaa] === "a") {
                                            num.push(10);
                                        } else if (str[aaa] === "b") {
                                            num.push(11);
                                        } else if (str[aaa] === "c") {
                                            num.push(12);
                                        } else if (str[aaa] === "d") {
                                            num.push(13);
                                        } else if (str[aaa] === "e") {
                                            num.push(14);
                                        } else if (str[aaa] === "f") {
                                            num.push(15);
                                        } else {
                                            num.push(Number(str[aaa]));
                                        }
                                    }
                                    if (bbb === 3) {
                                        rgb.push((num[0] * 16) + num[0]);
                                        rgb.push((num[1] * 16) + num[1]);
                                        rgb.push((num[2] * 16) + num[2]);
                                    } else {
                                        rgb.push((num[0] * 16) + num[1]);
                                        rgb.push((num[2] * 16) + num[3]);
                                        rgb.push((num[4] * 16) + num[5]);
                                    }
                                    return luminance(rgb);
                                },
                                rgbToDec  = function csspretty__summary_colorConvert_rgbToDec(val) {
                                    var rgb  = [],
                                        rgbs = [],
                                        rr   = 0;
                                    if (vl.charAt(3) === "a") {
                                        vl   = vl
                                            .slice(5, vl.length - 1)
                                            .replace(/\s+/g, "");
                                        rgbs = vl.split(",");
                                        rgbs.pop();
                                    } else {
                                        vl   = vl
                                            .slice(4, vl.length - 1)
                                            .replace(/\s+/g, "");
                                        rgbs = vl.split(",");
                                    }
                                    do {
                                        if ((/^([0-9a-f]{2})$/).test(rgbs[rr]) === false) {
                                            if (rgbs[rr].charAt(rgbs[rr].length - 1) === "%") {
                                                vl = rgbs[rr].slice(0, rgbs[rr].length - 1);
                                                if (isNaN(vl) === true) {
                                                    return val;
                                                }
                                                rgb.push(Number(vl));
                                                if (rgb[rr] < 0) {
                                                    rgb[rr] = 0;
                                                } else if (rgb[rr] > 100) {
                                                    rgb[rr] = 100;
                                                }
                                                rgb[rr] = Math.round(2.55 * rgb[rr]);
                                            } else {
                                                if (isNaN(rgbs[rr]) === true) {
                                                    return val;
                                                }
                                                rgb.push(Number(rgbs[rr]));
                                                if (rgb[rr] < 0) {
                                                    rgb[rr] = 0;
                                                } else if (rgb[rr] > 255) {
                                                    rgb[rr] = 255;
                                                }
                                                rgb[rr] = Math.round(rgb[rr]);
                                            }
                                        }
                                        rr = rr + 1;
                                    } while (rr < 3);
                                    return luminance(rgb);
                                };
                            colors = [];
                            for (aa = 0; aa < bb; aa = aa + 1) {
                                if (color[aa] === undefined) {
                                    break;
                                }
                                vl = color[aa].toLowerCase();
                                if ((/^(#[0-9a-f]{3,6})$/).test(vl) === true) {
                                    colors.push(hexToDec(vl.slice(1)));
                                } else if ((/^(rgba?\()/).test(vl) === true) {
                                    colors.push(rgbToDec(vl));
                                } else if (colorNames[vl] !== undefined) {
                                    colors.push(colorNames[vl]);
                                }
                            }
                        }());
                    }
                }
                if (options.nodeasync === true) {
                    return [summ.join(""), ""];
                }
                return summ.join("");
            }());
        }

        //beautification
        if (options.mode !== "minify") {
            output = (function csspretty__beautify() {
                var a        = 0,
                    len      = token.length,
                    build    = [],
                    indent   = options.inlevel,
                    mixin    = false,
                    //a single unit of indentation
                    tab      = (function csspretty__beautify_tab() {
                        var aa = 0,
                            bb = [];
                        for (aa = 0; aa < options.insize; aa = aa + 1) {
                            bb.push(options.inchar);
                        }
                        return bb.join("");
                    }()),
                    //new lines plus indentation
                    nl       = function csspretty__beautify_nl(tabs) {
                        var aa = 0;
                        if (build[build.length - 1] === tab) {
                            do {
                                build.pop();
                            } while (build[build.length - 1] === tab);
                        }
                        build.push(lf);
                        for (aa = 0; aa < tabs; aa = aa + 1) {
                            build.push(tab);
                        }
                    },
                    //breaks selector lists onto newlines
                    selector = function csspretty__beautify_selector(item) {
                        var aa    = 0,
                            bb    = 0,
                            cc    = 0,
                            block = "",
                            items = [],
                            leng  = item.length;
                        if (options.compressedcss === true && (/\)\s*when\s*\(/).test(item) === true) {
                            item = item.replace(
                                /\)\s*when\s*\(/,
                                ")" + lf + (function csspretty__beautify_selector_whenTab() {
                                    var wtab = "",
                                        aaa  = indent + 1;
                                    do {
                                        wtab = wtab + tab;
                                        aaa  = aaa - 1;
                                    } while (aaa > 0);
                                    return wtab;
                                }()) + "when ("
                            );
                        }
                        for (aa = 0; aa < leng; aa = aa + 1) {
                            if (block === "") {
                                if (item.charAt(aa) === "\"") {
                                    block = "\"";
                                    bb    = bb + 1;
                                } else if (item.charAt(aa) === "'") {
                                    block = "'";
                                    bb    = bb + 1;
                                } else if (item.charAt(aa) === "(") {
                                    block = ")";
                                    bb    = bb + 1;
                                } else if (item.charAt(aa) === "[") {
                                    block = "]";
                                    bb    = bb + 1;
                                }
                            } else if ((item.charAt(aa) === "(" && block === ")") || (item.charAt(aa) === "[" && block === "]")) {
                                bb = bb + 1;
                            } else if (item.charAt(aa) === block) {
                                bb = bb - 1;
                                if (bb === 0) {
                                    block = "";
                                }
                            }
                            if (block === "" && item.charAt(aa) === ",") {
                                items.push(item.substring(cc, aa + 1));
                                cc = aa + 1;
                            }
                        }
                        if (cc > 0) {
                            items.push(item.substr(cc));
                        }
                        leng = items.length;
                        if (leng === 0) {
                            items.push(item);
                        }
                        if (options.selectorlist === true) {
                            build.push(items.join(" "));
                        } else {
                            build.push(items[0].replace(/,(\s*)/g, ", ").replace(/(,\u0020)$/, ","));
                            for (aa = 1; aa < leng; aa = aa + 1) {
                                nl(indent);
                                build.push(items[aa].replace(/,(\s*)/g, ", ").replace(/(,\u0020)$/, ","));
                            }
                        }
                        if (options.compressedcss === false) {
                            build.push(" ");
                        }
                    };
                if (options.inlevel > 0) {
                    a = options.inlevel;
                    do {
                        a = a - 1;
                        build.push(tab);
                    } while (a > 0);
                }

                //beautification loop
                for (a = 0; a < len; a = a + 1) {
                    if (lines[a] > 1 && options.compressedcss === false && (types[a] === "start" || types[a] === "end" || types[a] === "selector" || types[a] === "comment" || types[a] === "property" || types[a] === "propvar" || types[a].indexOf("external") > -1)) {
                        if (options.cssinsertlines === true && types[a] === "selector" && types[a - 1] !== "comment") {
                            lines[a] = lines[a] - 1;
                        }
                        if (build[build.length - 1] === tab) {
                            do {
                                build.pop();
                            } while (build[build.length - 1] === tab);
                        }
                        if (lines[a] > 1) {
                            if (lines[a] > 2) {
                                do {
                                    lines[a] = lines[a] - 1;
                                    build.push(lf);
                                } while (lines[a] > 2);
                            }
                            nl(indent);
                        }
                    }
                    if (types[a] === "start") {
                        if (types[a - 1] === "propvar" && options.compressedcss === false) {
                            build.push(" ");
                        }
                        if (a > 0 && token[a - 1].charAt(token[a - 1].length - 1) === "#") {
                            build.push(token[a]);
                        } else {
                            if (options.braces === true) {
                                if (build[build.length - 1] === " ") {
                                    build.pop();
                                }
                                nl(indent);
                            } else if (types[a - 1] === "colon") {
                                build.push(" ");
                            }
                            build.push(token[a]);
                            indent = indent + 1;
                            if (types[a + 1] !== "end" && (options.compressedcss === false || (options.compressedcss === true && types[a + 1] === "start")) && (types[a + 1] !== "selector" || options.cssinsertlines === false)) {
                                nl(indent);
                            }
                        }
                    } else if (types[a] === "end") {
                        if (types[a + 1] === "external_else") {
                            indent = indent - 1;
                            nl(indent);
                            build.push(token[a]);
                            build.push(" ");
                            build.push(token[a + 1]);
                            build.push(" ");
                            a = a + 1;
                        } else if (mixin === true) {
                            mixin = false;
                            build.push(token[a]);
                            build.push(" ");
                        } else {
                            indent = indent - 1;
                            if (types[a - 1] !== "start" && options.compressedcss === false) {
                                nl(indent);
                            }
                            build.push(token[a]);
                            if (options.compressedcss === true && types[a + 1] === "end") {
                                nl(indent - 1);
                            } else if (options.cssinsertlines === true && types[a + 1] === "selector" && lines[a] < 2 && token[a - 1] !== "{") {
                                build.push(lf);
                            } else if (types[a + 1] !== "end" && types[a + 1] !== "semi" && types[a + 1] !== "comment") {
                                nl(indent);
                            }
                        }
                    } else if (types[a] === "semi") {
                        if (token[a] !== "x;" && (options.compressedcss === false || (options.compressedcss === true && types[a + 1] !== "end"))) {
                            build.push(token[a]);
                        }
                        if (types[a + 1] === "comment-inline") {
                            build.push(" ");
                        } else if (types[a + 1] !== "end" && types[a + 1] !== "comment" && options.compressedcss === false) {
                            if (options.cssinsertlines === true && types[a + 1] === "selector") {
                                build.push(lf);
                            } else if (lines[a + 1] > 0 || (types[a + 1] !== undefined && types[a + 1].indexOf("external") < 0)) {
                                nl(indent);
                            }
                        }
                    } else if (types[a] === "selector") {
                        if (a > 0 && types[a - 1] !== "comment" && (options.cssinsertlines === true || (options.compressedcss === true && (types[a - 1] === "start" || types[a - 1] === "semi")))) {
                            nl(indent);
                        }
                        if (token[a].charAt(token[a].length - 1) === "#") {
                            build.push(token[a]);
                            mixin = true;
                        } else if (token[a].indexOf(",") > -1) {
                            selector(token[a]);
                        } else {
                            if (token[a].charAt(0) === ":" && token[a - 1] === "}" && build[build.length - 1] === " ") {
                                build.pop();
                            }
                            build.push(token[a]);
                            if (options.compressedcss === false) {
                                build.push(" ");
                            }
                        }
                    } else if ((types[a] === "comment" || types[a] === "comment-inline") && types[a - 1] !== "colon" && types[a - 1] !== "property") {
                        if (types[a - 1] === "value" && types[a] === "comment-inline") {
                            build.push(" ");
                        }
                        if (a > 0 && options.compressedcss === true && types[a] === "comment" && types[a - 1] !== "comment") {
                            build.push(lf);
                            nl(indent);
                        } else if (a > 0 && types[a - 1] !== "start" && types[a] !== "comment-inline") {
                            nl(indent);
                        }
                        build.push(token[a]);
                        if (types[a + 1] !== "end" && types[a + 1] !== "comment") {
                            nl(indent);
                        }
                    } else {
                        if (types[a - 1] !== "semi" && options.compressedcss === false && (mixin === false || token[a - 1] === ":") && token[a - 2] !== "filter" && token[a - 2] !== "progid") {
                            if (types[a] === "value" || (types[a].indexOf("external") > -1 && types[a - 1] === "colon")) {
                                build.push(" ");
                            }
                        } else if (options.compressedcss === true && (types[a] === "value" || types[a] === "propvar")) {
                            token[a] = token[a].replace(/(\s*,\s*)/g, ",");
                        }
                        if (types[a] === "external_start") {
                            indent = indent + 1;
                        } else if (types[a] === "external_end") {
                            indent = indent - 1;
                            if (build[build.length - 1] === tab) {
                                build.pop();
                            }
                        } else if (types[a] === "external_else" && build[build.length - 1] === tab) {
                            build.pop();
                        }
                        build.push(token[a]);
                        if (types[a].indexOf("external") > -1 && types[a + 1] !== "semi") {
                            if ((types[a + 1] !== undefined && types[a + 1].indexOf("external") > -1) || (lines[a + 1] === 1 && types[a + 1] !== "end") || lines[a + 1] > 1) {
                                nl(indent);
                            }
                        }
                    }
                }
                if (options.newline === true) {
                    if (options.crlf === true) {
                        build.push("\r\n");
                    } else {
                        build.push("\n");
                    }
                }
                if (options.preserve > 0 && (lines[lines.length - 1] > 0 || endline === true)) {
                    return build
                        .join("")
                        .replace(/(\s+)$/, lf);
                }
                return build
                    .join("")
                    .replace(/(\s+)$/, "");
            }());
        } else {
            if (options.newline === true) {
                if (options.crlf === true) {
                    output.push("\r\n");
                } else {
                    output.push("\n");
                }
            }
            output = token
                .join("")
                .replace(/;\}/g, "}");
        }
        if (options.nodeasync === true) {
            return [output, ""];
        }
        return output;
    };
}());