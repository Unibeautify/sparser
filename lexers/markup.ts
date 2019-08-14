(function markup_init() {
    "use strict";
    const sparser:sparser = global.sparser,
        markup = function lexer_markup(source:string):data {
            let a:number             = 0,
                sgmlflag:number      = 0,
                html:"html"|"xml"|"" = "",
                cftransaction:boolean = false,
                ext:boolean           = false;
            const parse:parse       = sparser.parse,
                data:data          = parse.data,
                count:markupCount = {
                    end  : 0,
                    index: -1,
                    start: 0
                },
                options:any            = sparser.options,
                b:string[]             = source.split(""),
                c:number             = b.length,
                htmlblocks:{} = {
                    body    : "block",
                    colgroup: "block",
                    dd      : "block",
                    dt      : "block",
                    head    : "block",
                    html    : "block",
                    li      : "block",
                    option  : "block",
                    p       : "block",
                    tbody   : "block",
                    td      : "block",
                    tfoot   : "block",
                    th      : "block",
                    thead   : "block",
                    tr      : "block",
                },
                attribute_sort_list:string[] = (typeof options.lexer_options.markup.attribute_sort_list === "string" && options.lexer_options.markup.attribute_sort_list !== "")
                    ? options.lexer_options.markup.attribute_sort_list.split(",")
                    : [],
                asl:number = attribute_sort_list.length,

                //pads certain template tag delimiters with a space
                bracketSpace = function lexer_markup_bracketSpace(input:string):string {
                    if (options.language !== "html" && options.language !== "xml" && options.language !== "sgml" && options.language !== "jsx") {
                        const spaceStart = function lexer_markup_tag_spaceStart(start:string):string {
                                return start.replace(/\s*$/, " ");
                            },
                            spaceEnd = function lexer_markup_tag_spaceStart(end:string):string {
                                return end.replace(/^\s*/, " ");
                            };
                        if ((/\{(=|#|\/|(%>)|(%\]))/).test(input) === true || (/\}%(>|\])/).test(input) === true) {
                            return input;
                        }
                        input = input.replace(/\{((\{+)|%-?)\s*/g, spaceStart);
                        input = input.replace(/\s*((\}\}+)|(-?%\}))/g, spaceEnd);
                        return input;
                    }
                    return input;
                },

                // pushes a record into the parse table
                recordPush = function lexer_markup_recordPush(target:data, record:record, structure:string):void {
                    if (target === data) {
                        if (record.types.indexOf("end") > -1) {
                            count.end = count.end + 1;
                        } else if (record.types.indexOf("start") > -1) {
                            count.start = count.start + 1;
                        }
                    }
                    if (options.lexer_options.markup.parse_space === true) {
                        record.lines = 0;
                    }
                    parse.push(target, record, structure);
                },

                // Find the lowercase tag name of the provided token.
                tagName       = function lexer_markup_tagName(el:string):string {
                    let space:number = 0,
                        name:string  = "";
                    const reg:RegExp   = (/^((\{|<)((%-?)|\{-?)=?\s*)/);
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
                    if (html === "html" || options.language === "coldfusion") {
                        name = name.toLowerCase();
                    }
                    name = name.replace(/(\}\})$/, "");
                    if (name.indexOf("(") > 0) {
                        name = name.slice(0, name.indexOf("("));
                    }
                    if (name === "?xml?") {
                        return "xml";
                    }
                    return name;
                },

                // A fix for HTML missing end tags
                fixHtmlEnd = function lexer_markup_fixHtmlEnd(element:string, end:boolean):void {
                    const tname:string = tagName(element),
                        record:record          = {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markup",
                            lines: (data.lines[parse.count] > 0) ? 1 : 0,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: `</${parse.structure[parse.structure.length - 1][0]}>`,
                            types: "end"
                        };
                    recordPush(data, record, "");
                    if (htmlblocks[parse.structure[parse.structure.length - 1][0]] === "block" && ((end === true && parse.structure.length > 1) || (end === false && `/${parse.structure[parse.structure.length - 1][0]}` !== tname))) {
                        do {
                            record.begin = parse.structure[parse.structure.length - 1][1];
                            record.stack = parse.structure[parse.structure.length - 1][0];
                            record.token = `</${parse.structure[parse.structure.length - 1][0]}>`;
                            recordPush(data, record, "");
                        } while (htmlblocks[parse.structure[parse.structure.length - 1][0]] === "block" && ((end === true && parse.structure.length > 1) || (end === false && `/${parse.structure[parse.structure.length - 1][0]}` !== tname)));
                    }
                },

                // A fix for Vapor Leaf end structure parsing
                vaporEnd = function lexer_markup_vaporEnd():void {
                    const liner:number = parse.linesSpace,
                        rec:record = {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markup",
                            lines: liner,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "}",
                            types: "template_end"
                        };
                    let aa:number = a + 1;
                    if ((/\s/).test(b[aa]) === true) {
                        aa = parse.spacer({array: b, end: c, index: aa}) + 1;
                    }
                    if (b[aa] === "e" && b[aa + 1] === "l" && b[aa + 2] === "s" && b[aa + 3] === "e") {
                        if (b[aa + 4] === "{") {
                            rec.token = "} else {";
                            rec.types = "template_else";
                            recordPush(data, rec, "else");
                            a = aa;
                            return;
                        }
                        if ((/\s/).test(b[aa + 4]) === true) {
                            aa = parse.spacer({array: b, end: c, index: aa + 4}) + 1;
                            if (b[aa] === "{") {
                                rec.token = "} else {";
                                rec.types = "template_else";
                                recordPush(data, rec, "else");
                                a = aa;
                                return;
                            }
                            if (b[aa] === "i" && b[aa + 1] === "f") {
                                aa = aa + 2;
                                if ((/\s/).test(b[aa]) === true) {
                                    aa = parse.spacer({array: b, end: c, index: aa}) + 1;
                                }
                                if (b[aa] === "(") {
                                    let paren:number = 0;
                                    do {
                                        if (b[aa] === "(") {
                                            paren = paren + 1;
                                        } else if (b[aa] === ")") {
                                            paren = paren - 1;
                                            if (paren < 1) {
                                                aa = aa + 1;
                                                break;
                                            }
                                        }
                                        aa = aa + 1;
                                    } while (aa < c);
                                    if ((/\s/).test(b[aa]) === true) {
                                        aa = parse.spacer({array: b, end: c, index: aa}) + 1;
                                    }
                                    if (b[aa] === "{") {
                                        rec.token = b.slice(a, aa + 1).join("");
                                        rec.types = "template_else";
                                        recordPush(data, rec, "else");
                                        a = aa;
                                        return;
                                    }
                                }
                            }
                        }
                    }
                    recordPush(data, rec, "");
                    parse.linesSpace = liner;
                },

                // A fix for Vapor Leaf start structure parsing
                vaporStart = function lexer_markup_vaporStart():void {
                    const rec:record = parse.pop(data);
                    rec.token = `${rec.token} {`;
                    rec.types = "template_start";
                    recordPush(data, rec, rec.token.slice(0, rec.token.indexOf("(")));
                },

                //parses tags, attributes, and template elements
                tag           = function lexer_markup_tag(end:string):void {

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

                    let igcount:number         = 0,
                        element:string         = "",
                        lastchar:string        = "",
                        ltype:string           = "",
                        tname:string           = "",
                        start:string            = "",
                        cheat:boolean           = false,
                        earlyexit:boolean       = false,
                        ignoreme:boolean        = false,
                        jscom:boolean           = false,
                        nopush:boolean          = false,
                        nosort:boolean          = false,
                        preserve:boolean        = false,
                        simple:boolean          = false,
                        singleton:boolean       = false,
                        attstore:attStore        = [],
                        comm:[string, number]    = ["", 0];
                    const record:record          = {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markup",
                            lines: parse.linesSpace,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "",
                            types: ""
                        },
                        //cftags is a list of supported coldfusion tags
                        // * required - means must have a separate matching end tag
                        // * optional - means the tag could have a separate end tag, but is probably a
                        // singleton
                        // * prohibited - means there is no corresponding end tag
                        cftags:cftags          = {
                            "cfNTauthenticate"      : "optional",
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
                        arname          = function lexer_markup_tag_name(x:string):[string, string] {
                            const eq:number = x.indexOf("=");
                            if (eq > 0 && ((eq < x.indexOf("\"") && x.indexOf("\"") > 0) || (eq < x.indexOf("'") && x.indexOf("'") > 0))) {
                                return [x.slice(0, eq), x.slice(eq + 1)];
                            }
                            return [x, ""];
                        },

                        // attribute parser
                        attributeRecord = function lexer_markup_tag_attributeRecord():void {
                            let ind:number          = 0,
                                eq:number           = 0,
                                dq:number           = 0,
                                sq:number           = 0,
                                slice:string        = "",
                                name:string         = "",
                                cft:string          = cftags[
                                    tname
                                        .toLowerCase()
                                        .replace(/\/$/, "")
                                ],
                                store:string[]        = [],
                                len:number = attstore.length;
                            const qc:"none"|"double"|"single" = (options.lexer_options.markup.quote_convert === undefined)
                                    ? "none"
                                    : options.lexer_options.markup.quote_convert,
                                begin:number = parse.count,
                                stack:string = tname.replace(/\/$/, ""),
                                syntax:string       = "<{\"'=/",
                                convertQ = function lexer_markup_tag_attributeRecord_convertQ():void {
                                    if (ignoreme === true || qc === "none" || record.types !== "attribute" || (qc === "single" && record.token.indexOf("\"") < 0) || (qc === "double" && record.token.indexOf("'") < 0)) {
                                        recordPush(data, record, "");
                                    } else {
                                        let ee:number = 0,
                                            inner:boolean = false;
                                        const chars:string[] = record.token.split(""),
                                            eq:number = record.token.indexOf("="),
                                            len:number = chars.length - 1;
                                        if (chars[eq + 1] !== "\"" && qc === "single" && chars[chars.length - 1] !== "\"") {
                                            recordPush(data, record, "");
                                        } else if (chars[eq + 1] !== "'" && qc === "double" && chars[chars.length - 1] !== "'") {
                                            recordPush(data, record, "");
                                        } else {
                                            ee = eq + 2;
                                            if (qc === "double") {
                                                if (record.token.slice(eq + 2, len).indexOf("\"") > -1) {
                                                    inner = true;
                                                }
                                                chars[eq + 1] = "\"";
                                                chars[chars.length - 1] = "\"";
                                            } else {
                                                if (record.token.slice(eq + 2, len).indexOf("'") > -1) {
                                                    inner = true;
                                                }
                                                chars[eq + 1] = "'";
                                                chars[chars.length - 1] = "'";
                                            }
                                            if (inner === true) {
                                                do {
                                                    if (chars[ee] === "'" && qc === "single") {
                                                        chars[ee] = "\"";
                                                    } else if (chars[ee] === "\"" && qc === "double") {
                                                        chars[ee] = "'";
                                                    }
                                                    ee = ee + 1;
                                                } while (ee < len);
                                            }
                                            record.token = chars.join("");
                                            recordPush(data, record, "");
                                        }
                                    }
                                },
                                templateAtt = function lexer_markup_tag_attributeRecord_templateAtt(sample:string, token:string):void {
                                    if (sample.charAt(0) === "{" && "{%#@:/?^<+~=".indexOf(sample.charAt(1)) > -1) {
                                        record.types = "template_attribute";
                                    } else if (sample.charAt(0) === "<") {
                                        record.types = "template_attribute";
                                    } else if (sample === "[%") {
                                        record.types = "template_attribute";
                                    } else {
                                        record.token = token;
                                        convertQ();
                                        return;
                                    }
                                    record.token = token;
                                    convertQ();
                                    record.types = "attribute";
                                };

                            if (attstore.length < 1) {
                                return;
                            }

                            // fix for singleton tags, since "/" at the end of the tag is not an attribute
                            if (attstore[attstore.length - 1][0] === "/") {
                                attstore.pop();
                                element = element.replace(/>$/, "/>");
                            }

                            // reconnects attribute names to their respective values if separated on "="
                            eq = attstore.length;
                            dq = 1;
                            if (dq < eq) {
                                do {
                                    name = attstore[dq - 1][0];
                                    if (name.charAt(name.length - 1) === "=" && attstore[dq][0].indexOf("=") < 0) {
                                        attstore[dq - 1][0] = name + attstore[dq][0];
                                        attstore.splice(dq, 1);
                                        eq = eq - 1;
                                        dq = dq - 1;
                                    }
                                    dq = dq + 1;
                                } while (dq < eq);
                            }

                            // sort the attributes
                            if ((options.lexer_options.markup.attribute_sort === true || options.lexer_options.markup.tag_sort === true) && jscom === false && options.language !== "jsx" && nosort === false && tname !== "cfif" && tname !== "cfelseif" && tname !== "cfset") {
                                // if making use of the 'attribute_sort_list` option
                                if (asl > 0) {
                                    const tempstore:attStore = [];
                                    dq = 0;
                                    eq = 0;
                                    len = attstore.length;

                                    // loop through the attribute_sort_list looking for attribute name matches
                                    do {
                                        // loop through the attstore
                                        eq = 0;
                                        do {
                                            name = attstore[eq][0].split("=")[0];
                                            if (attribute_sort_list[dq] === name) {
                                                tempstore.push(attstore[eq]);
                                                attstore.splice(eq, 1);
                                                len = len - 1;
                                                break;
                                            }
                                            eq = eq + 1;
                                        } while (eq < len);
                                        dq = dq + 1;
                                    } while (dq < asl);
                                    attstore = parse.safeSort(attstore, "", false);
                                    attstore = tempstore.concat(attstore);
                                    len = attstore.length;
                                } else {
                                    attstore = parse.safeSort(attstore, "", false);
                                }
                            }

                            // preparation for a coldfusion edge case
                            if (tname.slice(0, 3).toLowerCase() === "cf_") {
                                cft = "required";
                            }

                            record.begin = begin;
                            record.stack = stack;
                            record.types = "attribute";
                            store = [];

                            if (ind < len) {
                                do {
                                    if (attstore[ind] === undefined) {
                                        break;
                                    }
                                    attstore[ind][0] = attstore[ind][0].replace(/\s+$/, "");
                                    record.lines = attstore[ind][1];
                                    eq = attstore[ind][0].indexOf("=");
                                    dq = attstore[ind][0].indexOf("\"");
                                    sq = attstore[ind][0].indexOf("'");

                                    if ((/^\/(\/|\*)/).test(attstore[ind][0]) === true && options.language === "jsx") {
                                        record.types = "comment_attribute";
                                        record.token = attstore[ind][0];
                                        convertQ();
                                    } else if (eq > -1 && store.length > 0) {
                                        // put certain attributes together for coldfusion
                                        record.token = store.join(" ");
                                        convertQ();
                                        if (attstore[ind][0].indexOf("=") > 0 && attstore[ind][0].indexOf("//") < 0 && attstore[ind][0].charAt(0) !== ";") {
                                            record.token = attstore[ind][0].replace(/\s$/, "");
                                        } else {
                                            record.token = attstore[ind][0];
                                        }
                                        convertQ();
                                        store        = [];
                                    } else if (ltype === "sgml") {
                                        store.push(attstore[ind][0]);
                                    } else if (cft !== undefined && eq < 0 && attstore[ind][0].indexOf("=") < 0) {
                                        // put certain attributes together for coldfusion
                                        store.push(attstore[ind][0]);
                                    } else if ((cft !== undefined && eq < 0) || (dq > 0 && dq < eq) || (sq > 0 && sq < eq) || syntax.indexOf(attstore[ind][0].charAt(0)) > -1) {
                                        // tags stored as attributes of other tags
                                        templateAtt(attstore[ind][0].replace(/^("|')/, "").slice(0, 2), attstore[ind][0].replace(/\s$/, ""));
                                    } else if (eq < 0 && cft === undefined) {
                                        // in most markup languages an attribute without an expressed value has its name
                                        // as its string value
                                        if (html === "html" && "[{(".indexOf(attstore[ind][0].charAt(0)) < 0 && attstore[ind][0].charAt(0) !== "#" && (/^\*?ng[A-Z]/).test(attstore[ind][0]) === false) {
                                            record.token = attstore[ind][0].toLowerCase();
                                        } else if (options.language === "xml" || options.language === "coldfusion") {
                                            if (options.lexer_options.markup.quote_convert === "single") {
                                                record.token = `${attstore[ind][0]}='${attstore[ind][0]}'`;
                                            } else {
                                                record.token = `${attstore[ind][0]}="${attstore[ind][0]}"`;
                                            }
                                        } else {
                                            record.token = attstore[ind][0];
                                        }
                                        convertQ();
                                    } else {
                                        // separates out the attribute name from its value
                                        slice = attstore[ind][0].slice(eq + 1);
                                        if (syntax.indexOf(slice.charAt(0)) < 0 && cft === undefined) {
                                            slice = "\"" + slice + "\"";
                                        }
                                        name = attstore[ind][0].slice(0, eq);
                                        if (html === "html" && "[{(".indexOf(name.charAt(0)) < 0 && cft === undefined && (/^\*?ng[A-Z]/).test(attstore[ind][0]) === false) {
                                            name = name.toLowerCase();
                                        }
                                        if (options.language === "jsx" && (/^(\s*\{)/).test(slice) === true) {
                                            record.token = name + "={";
                                            record.types = "jsx_attribute_start";
                                            recordPush(data, record, "jsx_attribute");
                                            sparser.lexers.script(slice.slice(1, slice.length - 1));
                                            record.begin = parse.count;
                                            if ((/\s\}$/).test(slice) === true) {
                                                slice = slice.slice(0, slice.length - 1);
                                                slice = (/\s+$/).exec(slice)[0];
                                                if (slice.indexOf("\n") < 0) {
                                                    record.lines = 1;
                                                } else {
                                                    record.lines = slice.split("\n").length;
                                                }
                                            } else {
                                                record.lines = 0;
                                            }
                                            record.begin = parse.structure[parse.structure.length - 1][1];
                                            record.stack = parse.structure[parse.structure.length - 1][0];
                                            record.token = "}";
                                            record.types = "jsx_attribute_end";
                                            convertQ();
                                            record.types = "attribute";
                                            record.begin = begin;
                                            record.stack = stack;
                                        } else {
                                            name = name + "=" + slice;
                                            templateAtt(slice.replace(/^("|')/, "").slice(0, 2), name.replace(/(\s+)$/, ""));
                                        }
                                    }
                                    ind = ind + 1;
                                } while (ind < len);
                            }
                            if (store.length > 0) {
                                record.token = store.join(" ");
                                convertQ();
                            }
                        };
                    ext = false;

                    // this complex series of conditions determines an elements delimiters look to
                    // the types being pushed to quickly reason about the logic no type is pushed
                    // for start tags or singleton tags just yet some types set the `preserve` flag,
                    // which means to preserve internal white space The `nopush` flag is set when
                    // parsed tags are to be ignored and forgotten
                    (function lexer_markup_tag_types() {
                        if (end === "]>") {
                            end      = ">";
                            sgmlflag = sgmlflag - 1;
                            ltype    = "end";
                        } else if (end === "---") {
                            ltype    = "comment";
                            start    = "---";
                        } else if (end === ")" && options.language === "vapor") {
                            ltype    = "template";
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
                                        end      = "--->";
                                        ltype    = "comment";
                                        start    = "<!---";
                                    } else {
                                        end = "-->";
                                        ltype = "comment";
                                        start = "<!--";
                                    }
                                } else if (b[a + 2] === "[" && b[a + 3] === "C" && b[a + 4] === "D" && b[a + 5] === "A" && b[a + 6] === "T" && b[a + 7] === "A" && b[a + 8] === "[") {
                                    end      = "]]>";
                                    ltype    = "cdata";
                                    preserve = true;
                                } else {
                                    end      = ">";
                                    sgmlflag = sgmlflag + 1;
                                    ltype    = "sgml";
                                }
                            } else if (b[a + 1] === "?") {
                                end = "?>";
                                if (b[a + 2] === "x" && b[a + 3] === "m" && b[a + 4] === "l") {
                                    ltype = "xml";
                                    simple = true;
                                } else {
                                    preserve = true;
                                    ltype    = "template";
                                }
                            } else if (b[a + 1] === "%") {
                                preserve = true;
                                if (b[a + 2] === "-" && b[a + 3] === "-") {
                                    end     = "--%>";
                                    ltype = "comment";
                                    start = "<%--";
                                } else if (b[a + 2] === "#") {
                                    end     = "%>";
                                    ltype = "comment";
                                    start = "<%#";
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
                                    start    = "<#--";
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
                            if (options.language === "jsx") {
                                ext          = true;
                                earlyexit    = true;
                                record.token = "{";
                                record.types = "script_start";
                                recordPush(data, record, "");
                                parse.structure.push(["script", parse.count]);
                                return;
                            }
                            if (options.language === "dustjs") {
                                if (b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                                    a            = a + 6;
                                    earlyexit    = true;
                                    record.token = "{:else}";
                                    record.types = "template_else";
                                    recordPush(data, record, "else");
                                    return;
                                }
                                if (b[a + 1] === "!") {
                                    end     = "!}";
                                    ltype   = "comment";
                                    start   = "{!";
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
                                start = "{#";
                            } else {
                                end   = b[a + 1] + "}";
                                ltype = "template";
                            }
                            if (b[a + 1] === "@" && b[a + 2] === "}" && b[a + 3] === "e" && b[a + 4] === "l" && b[a + 5] === "s" && b[a + 6] === "e" && b[a + 7] === "{" && b[a + 8] === "@" && b[a + 9] === "}") {
                                a            = a + 9;
                                earlyexit    = true;
                                record.token = "{@}else{@}";
                                record.types = "template_else";
                                recordPush(data, record, "else");
                                return;
                            }
                        } else if (b[a] === "[" && b[a + 1] === "%") {
                            end   = "%]";
                            ltype = "template";
                        } else if (b[a] === "#" && options.language === "apacheVelocity") {
                            if (b[a + 1] === "*") {
                                end      = "*#";
                                ltype    = "comment";
                                start    = "#*";
                            } else if (b[a + 1] === "[" && b[a + 2] === "[") {
                                end      = "]]#";
                                ltype    = "comment";
                                start    = "#[["
                            } else if (b[a + 1] === "#") {
                                end      = "\n";
                                ltype    = "comment";
                                start    = "##";
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
                        } else if (b[a] === "$" && options.language === "apacheVelocity") {
                            end   = "\n";
                            ltype = "template";
                        }
                        if (options.lexer_options.markup.unformatted === true) {
                            preserve = true;
                        }
                    }());
                    if (earlyexit === true) {
                        return;
                    }

                    // This is the real tag lexer. Everything that follows is attribute handling and
                    // edge cases
                    lastchar = end.charAt(end.length - 1);
                    if (ltype === "comment" && b[a] === "<") {
                        comm = parse.wrapCommentBlock({
                            chars: b,
                            end: c,
                            lexer: "markup",
                            opening: start,
                            start: a,
                            terminator: end
                        });
                        element = comm[0];
                        a = comm[1];
                        if (element.replace(start, "").replace(/(^\s*)/, "").indexOf("parse-ignore-start") === 0) {
                            record.token = element;
                            record.types = "ignore";
                            recordPush(data, record, "");
                            return;
                        }
                    } else if (a < c) {
                        let bcount:number    = 0,
                            braccount:number = 0,
                            jsxcount:number  = 0,
                            e:number         = 0,
                            f:number         = 0,
                            parncount:number = 0,
                            lines:number     = 1,
                            quote:string     = "",
                            jsxquote:string  = "",
                            stest:boolean     = false,
                            quotetest:boolean = false,
                            dustatt:string[]  = [],
                            attribute:string[] = [];
                        const lex:string[] = [],

                            //finds slash escape sequences
                            slashy          = function lexer_markup_tag_slashy():boolean {
                                let x:number = a;
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
                            attributeLexer  = function lexer_markup_tag_attributeLexer(quotes:boolean):void {
                                let atty:string = "",
                                    name:[string, string],
                                    aa:number   = 0,
                                    bb:number   = 0;
                                if (quotes === true) {
                                    atty = attribute.join("");
                                    name = arname(atty);
                                    if (name[0] === "data-parse-ignore" || name[0] === "data-prettydiff-ignore") {
                                        ignoreme = true;
                                    }
                                    quote = "";
                                } else {
                                    atty = attribute
                                        .join("");
                                    if (options.language !== "jsx" || (options.language === "jsx" && atty.charAt(atty.length - 1) !== "}")) {
                                        atty = atty.replace(/\s+/g, " ");
                                    }
                                    name = arname(atty);
                                    if (name[0] === "data-parse-ignore" || name[0] === "data-prettydiff-ignore") {
                                        ignoreme = true;
                                    }
                                    if (options.language === "jsx" && attribute[0] === "{" && attribute[attribute.length - 1] === "}") {
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
                                if (options.crlf === true) {
                                    atty = attribute.join("\r\n");
                                } else {
                                    atty = attribute.join("\n");
                                }
                                atty = bracketSpace(atty);
                                if (atty === "=") {
                                    attstore[attstore.length - 1][0] = `${attstore[attstore.length - 1][0]}=`;
                                } else if (atty.charAt(0) === "=" && attstore.length > 0 && attstore[attstore.length - 1][0].indexOf("=") < 0) {
                                    //if an attribute starts with a `=` then adjoin it to the last attribute
                                    attstore[attstore.length - 1][0] = attstore[attstore.length - 1][0] + atty;
                                } else if (atty.charAt(0) !== "=" && attstore.length > 0 && attstore[attstore.length - 1][0].indexOf("=") === attstore[attstore.length - 1][0].length - 1) {
                                    // if an attribute follows an attribute ending with `=` then adjoin it to the
                                    // last attribute
                                    attstore[attstore.length - 1][0] = attstore[attstore.length - 1][0] + atty;
                                } else if (options.language === "coldfusion" && attstore.length > 0 && (("+-\u002a/(^").indexOf(atty) > -1 || ("+-\u002a/(^").indexOf(attstore[attstore.length - 1][0].charAt(attstore[attstore.length - 1][0].length - 1)) > -1)) {
                                    attstore[attstore.length - 1][0] = `${attstore[attstore.length - 1][0]} ${atty}`;
                                } else if (atty !== "" && atty !== " ") {
                                    attstore.push([atty, lines]);
                                }
                                if (attstore.length > 0 && attstore[attstore.length - 1][0].indexOf("=\u201c") > 0) {
                                    sparser.parseerror = `Quote looking character (\u201c, &#x201c) used instead of actual quotes on line number ${parse.lineNumber}`;
                                } else if (attstore.length > 0 && attstore[attstore.length - 1][0].indexOf("=\u201d") > 0) {
                                    sparser.parseerror = `Quote looking character (\u201d, &#x201d) used instead of actual quotes on line number ${parse.lineNumber}`;
                                }
                                attribute = [];
                                lines = (b[a] === "\n")
                                    ? 2
                                    : 1;
                            };
                        do {
                            if (b[a] === "\n") {
                                lines = lines + 1;
                                if (options.language === "apacheVelocity" && lex[0] === "#") {
                                    a = a - 1;
                                    break;
                                }
                                parse.lineNumber = parse.lineNumber + 1;
                            }
                            if (preserve === true || (((/\s/).test(b[a]) === false && quote !== "}") || quote === "}")) {
                                lex.push(b[a]);
                                if (lex[0] === "<" && lex[1] === ">" && end === ">") {
                                    record.token = "<>";
                                    record.types = "start";
                                    recordPush(data, record, "(empty)");
                                    return;
                                }
                                if (lex[0] === "<" && lex[1] === "/" && lex[2] === ">" && end === ">") {
                                    record.token = "</>";
                                    record.types = "end";
                                    recordPush(data, record, "");
                                    return;
                                }
                            }
                            if (ltype === "cdata" && b[a] === ">" && b[a - 1] === "]" && b[a - 2] !== "]") {
                                sparser.parseerror = `CDATA tag ${lex.join("")} is not properly terminated with ]]>`;
                                break;
                            }
                            if (ltype === "comment") {
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
                                                } while (f > 0 && (/\s/).test(lex[f]) === true);
                                            }
                                            if (lex[f - 2] === "{" && lex[f - 1] === "%" && lex[f] === "-") {
                                                end      = "-%}";
                                                lastchar = "}";
                                            } else if (lex[f - 1] === "{" && lex[f] === "%") {
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
                                    if (lex[0] + lex[1] === "<!" && ltype !== "cdata") {
                                        if (b[a] === "[") {
                                            if (b[a + 1] === "<") {
                                                ltype = "start";
                                                break;
                                            }
                                            if ((/\s/).test(b[a + 1]) === true) {
                                                do {
                                                    a = a + 1;
                                                    if (b[a] === "\n") {
                                                        lines = lines + 1;
                                                    }
                                                } while (a < c - 1 && (/\s/).test(b[a + 1]) === true);
                                            }
                                            if (b[a + 1] === "<") {
                                                ltype = "start";
                                                break;
                                            }
                                        }
                                        if (b[a] !== ">" && b[a + 1] === "<") {
                                            sparser.parseerror = `SGML tag ${lex.join("")} is missing termination with '[' or '>'.`
                                            break;
                                        }
                                    }
                                    if (options.language === "jsx") {
                                        if (b[a] === "{") {
                                            jsxcount = jsxcount + 1;
                                        } else if (b[a] === "}") {
                                            jsxcount = jsxcount - 1;
                                        }
                                    }
                                    if (data.types[parse.count] === "sgml" && b[a] === "[" && lex.length > 4) {
                                        data.types[parse.count] = "template_start";
                                        count.start = count.start + 1;
                                        break;
                                    }
                                    if (b[a] === "<" && options.language !== "coldfusion" && preserve === false && lex.length > 1 && end !== ">>" && end !== ">>>" && simple === true) {
                                        sparser.parseerror = `Parse error on line ${parse.lineNumber} on element: ${lex.join("")}`;
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
                                                if (options.lexer_options.markup.unformatted === true) {
                                                    lex.push(b[a]);
                                                } else {
                                                    attribute.push(b[a]);
                                                }

                                                if ((b[a] === "<" || b[a] === ">") && (quote === "" || quote === ">") && options.language !== "jsx") {
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
                                                        if (attribute[attribute.length - 1] === "/" || (attribute[attribute.length - 1] === "?" && ltype === "xml")) {
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
                                                    if ((/^=?("|')?((\{(\{|%|#|@|:|\/|\?|\^|<|\+|~|=))|(\[%)|<)/).test(b[a] + b[a + 1] + b[a + 2] + b[a + 3]) === true) {
                                                        attribute.pop();
                                                        if (b[a] !== "=" && attribute.length > 0) {
                                                            attributeLexer(false);
                                                        }
                                                        quote = "";
                                                        do {
                                                            attribute.push(b[a]);
                                                            if (b[a] === dustatt[dustatt.length - 1]) {
                                                                dustatt.pop();
                                                                if (b[a] === "}" && b[a + 1] === "}") {
                                                                    attribute.push("}");
                                                                    a = a + 1;
                                                                    if (b[a + 1] === "}") {
                                                                        attribute.push("}");
                                                                        a = a + 1;
                                                                    }
                                                                }
                                                                if (dustatt.length < 1) {
                                                                    attributeLexer(false);
                                                                    b[a] = " ";
                                                                    break;
                                                                }
                                                            } else if ((b[a] === "\"" || b[a] === "'") && dustatt[dustatt.length - 1] !== "\"" && dustatt[dustatt.length - 1] !== "'") {
                                                                dustatt.push(b[a]);
                                                            } else if (b[a] === "{" && "{%#@:/?^<+~=".indexOf(b[a + 1]) && dustatt[dustatt.length - 1] !== "}") {
                                                                dustatt.push("}");
                                                            } else if (b[a] === "<" && dustatt[dustatt.length - 1] !== ">") {
                                                                dustatt.push(">");
                                                            } else if (b[a] === "[" && b[a + 1] === ":" && dustatt[dustatt.length - 1] !== "]") {
                                                                dustatt.push("]");
                                                            }
                                                            a = a + 1;
                                                        } while (a < c);
                                                    } else if (b[a] === "{" && b[a - 1] === "=" && options.language !== "jsx") {
                                                        quote = "}";
                                                    } else if (b[a] === "\"" || b[a] === "'") {
                                                        quote = b[a];
                                                        if (
                                                            b[a - 1] === "=" &&
                                                            (
                                                                b[a + 1] === "<" ||
                                                                (b[a + 1] === "{" && b[a + 2] === "%") ||
                                                                ((/\s/).test(b[a + 1]) === true && b[a - 1] !== "=")
                                                            )
                                                        ) {
                                                            igcount = a;
                                                        }
                                                    } else if (b[a] === "(") {
                                                        quote     = ")";
                                                        parncount = 1;
                                                    } else if (options.language === "jsx") {
                                                        //jsx variable attribute
                                                        if ((b[a - 1] === "=" || (/\s/).test(b[a - 1]) === true) && b[a] === "{") {
                                                            quote  = "}";
                                                            bcount = 1;
                                                        } else if (b[a] === "/") {
                                                            //jsx comments
                                                            if (b[a + 1] === "*") {
                                                                quote = "\u002a/";
                                                            } else if (b[a + 1] === "/") {
                                                                quote = "\n";
                                                            }
                                                        }
                                                    } else if (lex[0] !== "{" && b[a] === "{" && (b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                                        //opening embedded template expression
                                                        if (b[a + 1] === "{") {
                                                            if (b[a + 2] === "{") {
                                                                quote = "}}}";
                                                            } else {
                                                                quote = "}}";
                                                            }
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
                                                } else if (options.language === "jsx" && (quote === "}" || (quote === "\n" && b[a] === "\n") || (quote === "\u002a/" && b[a - 1] === "*" && b[a] === "/"))) {
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
                                                                if (options.lexer_options.markup.unformatted === false) {
                                                                    if (options.language === "jsx") {
                                                                        if ((/^(\s*)$/).test(element) === false) {
                                                                            attstore.push([element, lines]);
                                                                        }
                                                                    } else {
                                                                        element = element.replace(/\s+/g, " ");
                                                                        if (element !== " ") {
                                                                            attstore.push([element, lines]);
                                                                        }
                                                                    }
                                                                }
                                                                attribute = [];
                                                                lines = 1;
                                                                break;
                                                            }
                                                        }
                                                    } else {
                                                        jsxquote = "";
                                                        jscom    = true;
                                                        element  = attribute.join("");
                                                        if (element !== " ") {
                                                            attstore.push([element, lines]);
                                                        }
                                                        attribute = [];
                                                        lines = (quote === "\n")
                                                            ? 2
                                                            : 1;
                                                        quote    = "";
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
                                    } else if (ltype !== "comment" && end !== "\n" && b[a] === "<" && b[a + 1] === "!" && b[a + 2] === "-" && b[a + 3] === "-" && b[a + 4] !== "#" && data.types[parse.count] !== "conditional") {
                                        quote = "-->";
                                    } else if (b[a] === "{" && lex[0] !== "{" && end !== "\n" && end !== "%>" && end !== "%]" && (options.language === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                        //opening embedded template expression
                                        if (b[a + 1] === "{") {
                                            if (b[a + 2] === "{") {
                                                quote = "}}}";
                                            } else {
                                                quote = "}}";
                                            }
                                        } else if (options.language === "dustjs") {
                                            if (attribute.length < 1 && (attstore.length < 1 || (/\s/).test(b[a - 1]) === true)) {
                                                lex.pop();
                                                do {
                                                    if (b[a] === "\n") {
                                                        lines = lines + 1;
                                                    }
                                                    attribute.push(b[a]);
                                                    a = a + 1;
                                                } while (a < c && b[a] !== "}");
                                                attribute.push("}");
                                                attstore.push([attribute.join(""), lines]);
                                                attribute = [];
                                                lines = 1;
                                            } else {
                                                quote = "}";
                                            }
                                        } else {
                                            quote = b[a + 1] + "}";
                                            if (attribute.length < 1 && (attstore.length < 1 || (/\s/).test(b[a - 1]) === true)) {
                                                lex.pop();
                                                do {
                                                    if (b[a] === "\n") {
                                                        lines = lines + 1;
                                                    }
                                                    attribute.push(b[a]);
                                                    a = a + 1;
                                                } while (a < c && b[a - 1] + b[a] !== quote);
                                                attribute.push("}");
                                                attstore.push([attribute.join(""), lines]);
                                                attribute = [];
                                                lines = 1;
                                                quote = "";
                                            }
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
                                    } else if (simple === true && options.language === "jsx" && b[a] === "/" && (b[a + 1] === "*" || b[a + 1] === "/")) {
                                        //jsx comment immediately following tag name
                                        stest               = true;
                                        lex[lex.length - 1] = " ";
                                        attribute.push(b[a]);
                                        if (b[a + 1] === "*") {
                                            jsxquote = "\u002a/";
                                        } else {
                                            jsxquote = "\n";
                                        }
                                    } else if ((b[a] === lastchar || (end === "\n" && b[a + 1] === "<")) && (lex.length > end.length + 1 || lex[0] === "]") && (options.language !== "jsx" || jsxcount === 0)) {
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
                                            ltype    = "comment";
                                        } else if (lex[0] === "{" && lex[1] === "%" && lex[2] === "-" && lex.join("").replace(/\s+/g, "") === "{%-comment-%}") {
                                            end      = "endcomment";
                                            lastchar = "t";
                                            preserve = true;
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
                                } else if (b[a] === quote.charAt(quote.length - 1) && ((options.language === "jsx" && end === "}" && (b[a - 1] !== "\\" || slashy() === false)) || options.language !== "jsx" || end !== "}")) {
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
                        if (nopush) {
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
                        tname        = tagName(element);
                        element      = bracketSpace(element);
                        if (tname === "xml") {
                            html = "xml";
                        } else if (html === "" && tname === "!DOCTYPE" && element.toLowerCase().indexOf("xhtml") > 0) {
                            html = "xml";
                        } else if (html === "" && tname === "html") {
                            html = "html";
                        }
                        if (element.replace(start, "").replace(/^\s+/, "").indexOf("parse-ignore-start") === 0) {
                            a = a + 1;
                            do {
                                lex.push(b[a]);
                                if (b[a] === "d" && lex.slice(lex.length - 16).join("") === "parse-ignore-end") {
                                    break;
                                }
                                a = a + 1;
                            } while (a < c);
                            do {
                                lex.push(b[a]);
                                if (b[a] === end.charAt(end.length - 1) && b.slice(a - (end.length - 1), a + 1).join("") === end) {
                                    break;
                                }
                                a = a + 1;
                            } while (a < c);
                            record.token = lex.join("");
                            record.types = "ignore";
                            recordPush(data, record, "");
                            return;
                        }
                    }
                    record.token = element;
                    record.types = ltype;
                    tname        = tagName(element);

                    // Twig language allows {% block %} elements to be singleton or start.  You don't
                    // know until you encounter a {% endblock %} tag
                    if (tname === "endblock" && element.slice(0, 2) === "{%") {
                        const endName:string = element.replace(/\{%\s*endblock\s+/, "").replace(/\s*%\}/, "");
                        let aa:number = parse.count,
                            bb:number = parse.count,
                            startName:string = "";
                        do {
                            if (data.types[aa].indexOf("end") > 0) {
                                aa = data.begin[aa];
                                if (aa < 0) {
                                    break;
                                }
                            } else if ((/\{%\s*block/).test(data.token[aa]) === true) {
                                if (endName === "") {
                                    break;
                                }
                                startName = data.token[aa].replace(/\{%\s*block\s+/, "").split(/\s+/)[0].replace(/\s+/, "");
                                if (endName === startName) {
                                    break;
                                }
                            }
                            aa = aa - 1;
                        } while (aa > -1);
                        count.start = count.start + 1;
                        data.types[aa] = "template_start";
                        data.ender[aa] = parse.count + 1;
                        record.begin = aa;
                        record.stack = "block";
                        record.token = element;
                        record.types = "template_end";
                        if (aa > -1) {
                            do {
                                if (data.types[bb].indexOf("end") > 0) {
                                    bb = data.begin[bb];
                                    data.begin[bb] = aa;
                                    data.stack[bb] = "block";
                                } else if (data.begin[bb] < aa) {
                                    data.begin[bb] = aa;
                                    if (data.types[bb].indexOf("start") < 0) {
                                        data.ender[bb] = parse.count + 1;
                                    }
                                    data.stack[bb] = "block";
                                }
                                bb = bb - 1;
                            } while (bb > aa);
                        }
                        parse.structure.push(["block", aa]);
                        recordPush(data, record, "");
                        return;
                    }
                    if ((/^(\/?cf)/i).test(tname) === true) {
                        tname = tname
                            .toLowerCase()
                            .replace(/\/$/, "")
                            .replace(/^\//, "");
                    }

                    if (preserve === false && options.language !== "jsx") {
                        element = element.replace(/\s+/g, " ");
                    }

                    //a quick hack to inject records for a type of template comments
                    if (tname === "comment" && element.slice(0, 2) === "{%") {
                        const lineFindStart = function lexer_markup_tag_lineFindStart(spaces:string):string {
                                if (spaces === "") {
                                    linesStart = 0;
                                } else {
                                    linesStart = spaces.split("\n").length;
                                }
                                return "";
                            },
                            lineFindEnd = function lexer_markup_tag_lineFindEnd(spaces:string):string {
                                if (spaces === "") {
                                    linesEnd = 0;
                                } else {
                                    linesEnd = spaces.split("\n").length;
                                }
                                return "";
                            };
                        let linesStart:number = 0,
                            linesEnd:number = 0;
                        record.begin = parse.structure[parse.structure.length - 1][1];
                        record.ender = parse.count + 3;
                        record.stack = parse.structure[parse.structure.length - 1][0];
                        record.types = "template_start";
                        if (element.charAt(2) === "-") {
                            element      = element
                                .replace(/^(\s*\{%-\s*comment\s*-%\})/, "")
                                .replace(/(\{%-\s*endcomment\s*-%\}\s*)$/, "");
                            record.token = "{%- comment -%}";
                            recordPush(data, record, "comment");
                            record.begin = parse.count;
                            element = element.replace(/^\s*/, lineFindStart);
                            element = element.replace(/\s*$/, lineFindEnd);
                            record.lines = linesStart;
                            record.stack = "comment";
                            record.token = element;
                            record.types = "comment";
                            recordPush(data, record, "");
                            record.token = "{%- endcomment -%}";
                        } else {
                            element      = element
                                .replace(/^(\s*\{%\s*comment\s*%\})/, "")
                                .replace(/(\{%\s*endcomment\s*%\}\s*)$/, "");
                            record.token = "{% comment %}";
                            recordPush(data, record, "comment");
                            record.begin = parse.count;
                            element = element.replace(/^\s*/, lineFindStart);
                            element = element.replace(/\s*$/, lineFindEnd);
                            record.lines = linesStart;
                            record.stack = "comment";
                            record.token = element;
                            record.types = "comment";
                            recordPush(data, record, "");
                            record.token = "{% endcomment %}";
                        }
                        record.lines = linesEnd;
                        record.types = "template_end";
                        recordPush(data, record, "");
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
                        } else if (((/\sdo\s/).test(element) === true && (/\s-?%>$/).test(element) === true) || (/^(<%(%|-|=)?\s*if)/).test(element) === true) {
                            ltype = "template_start";
                        }
                    }
                    record.types = ltype;

                    //update a flag for subatomic parsing in SGML tags
                    if (end !== "]>" && sgmlflag > 0 && element.charAt(element.length - 1) !== "[" && (element.slice(element.length - 2) === "]>" || (/^(<!((doctype)|(notation))\s)/i).test(element) === true)) {
                        sgmlflag = sgmlflag - 1;
                    }

                    // cheat identifies HTML singleton elements as singletons even if formatted as
                    // start tags, such as <br> (which is really <br/>)
                    cheat = (function lexer_markup_tag_cheat():boolean {
                        let cfval:string = "",
                            struc:Array <[string, number]> = [];
                        const ender:RegExp      = (/(\/>)$/),
                            htmlsings:{}    = {
                                area       : "singleton",
                                base       : "singleton",
                                basefont   : "singleton",
                                br         : "singleton",
                                col        : "singleton",
                                embed      : "singleton",
                                eventsource: "singleton",
                                frame      : "singleton",
                                hr         : "singleton",
                                image      : "singleton",
                                img        : "singleton",
                                input      : "singleton",
                                isindex    : "singleton",
                                keygen     : "singleton",
                                link       : "singleton",
                                meta       : "singleton",
                                param      : "singleton",
                                progress   : "singleton",
                                source     : "singleton",
                                wbr        : "singleton"
                            },
                            fixsingleton = function lexer_markup_tag_cheat_fixsingleton():boolean {
                                let aa:number = parse.count,
                                    bb:number = 0;
                                const vname:string = tname.slice(1);
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
                                            if (cftags[tname] === undefined) {
                                                data.types[aa] = "start";
                                            } else {
                                                data.types[aa] = "template_start";
                                            }
                                            count.start = count.start + 1;
                                            data.token[aa] = data
                                                .token[aa]
                                                .replace(/(\s*\/>)$/, ">");
                                            return false;
                                        }
                                        aa = aa - 1;
                                    } while (aa > -1);
                                }
                                return false;
                            },
                            peertest = function lexer_markup_tag_cheat_peertest(name:string, item:string):boolean {
                                if (htmlblocks[name] === undefined) {
                                    return false;
                                }
                                if (name === item) {
                                    return true;
                                }
                                if (name === "dd" && item === "dt") {
                                    return true;
                                }
                                if (name === "dt" && item === "dd") {
                                    return true;
                                }
                                if (name === "td" && item === "th") {
                                    return true;
                                }
                                if (name === "th" && item === "td") {
                                    return true;
                                }
                                if (name === "colgroup" && (item === "tbody" || item === "tfoot" || item === "thead" || item === "tr")) {
                                    return true;
                                }
                                if (name === "tbody" && (item === "colgroup" || item === "tfoot" || item === "thead")) {
                                    return true;
                                }
                                if (name === "tfoot" && (item === "colgroup" || item === "tbody" || item === "thead")) {
                                    return true;
                                }
                                if (name === "thead" && (item === "colgroup" || item === "tbody" || item === "tfoot")) {
                                    return true;
                                }
                                if (name === "tr" && item === "colgroup") {
                                    return true;
                                }
                                return false;
                            },
                            addHtmlEnd = function (count:number):void {
                                record.lines                 = (data.lines[parse.count] > 0) ? 1 : 0;
                                record.token                 = `</${parse.structure[parse.structure.length - 1][0]}>`;
                                record.types                 = "end";
                                recordPush(data, record, "");
                                if (count > 0) {
                                    do {
                                        record.begin                 = parse.structure[parse.structure.length - 1][1];
                                        record.stack                 = parse.structure[parse.structure.length - 1][0];
                                        record.token                 = `</${parse.structure[parse.structure.length - 1][0]}>`;
                                        recordPush(data, record, "");
                                        count = count - 1;
                                    } while (count > 0);
                                }
                                record.begin                 = parse.structure[parse.structure.length - 1][1];
                                record.lines                 = parse.linesSpace;
                                record.stack                 = parse.structure[parse.structure.length - 1][0];
                                record.token                 = element;
                                record.types                 = "end";
                                data.lines[parse.count - 1] = 0;
                            };

                        //determine if the current end tag is actually part of an HTML singleton
                        if (ltype === "end" && tname.slice(0, 3) !== "/cf") {
                            const lastToken:string = data.token[parse.count];
                            if (data.types[parse.count - 1] === "singleton" && lastToken.charAt(lastToken.length - 2) !== "/" && "/" + tagName(lastToken) === tname) {
                                data.types[parse.count - 1] = "start";
                            } else if (
                                tname !== "/span" &&
                                tname !== "/div" &&
                                tname !== "/script" &&
                                options.lexer_options.markup.tag_merge === true &&
                                (html !== "html" || (html === "html" && tname !== "/li"))
                            ) {
                                if (tname === "/" + tagName(data.token[parse.count]) && data.types[parse.count] === "start") {
                                    parse.structure.pop();
                                    data.token[parse.count] = data
                                        .token[parse.count]
                                        .replace(/>$/, "/>");
                                    data.types[parse.count] = "singleton";
                                    singleton                = true;
                                    count.start = count.start - 1;
                                    return false;
                                }
                                if (tname === "/" + tagName(data.token[data.begin[parse.count]]) && data.types[parse.count].indexOf("attribute") > -1 && data.types[data.begin[parse.count]] === "start") {
                                    parse.structure.pop();
                                    data.token[data.begin[parse.count]] = data
                                        .token[data.begin[parse.count]]
                                        .replace(/>$/, "/>");
                                    data.types[data.begin[parse.count]] = "singleton";
                                    singleton                = true;
                                    count.start = count.start - 1;
                                    return false;
                                }
                            }
                        }

                        //renames the types value for the following two template tags
                        if (tname === "/#assign" || tname === "/#global") {
                            let dd:number    = parse.count - 1,
                                tcount:number = 1;
                            if (dd > -1) {
                                do {
                                    if (data.types[dd] === "start" || data.types[dd] === "template_start") {
                                        tcount = tcount - 1;
                                    } else if (data.types[dd] === "end" || data.types[dd] === "template_end") {
                                        tcount = tcount + 1;
                                    }
                                    if (tcount === 1) {
                                        if ((data.token[dd].indexOf("<#assign") === 0 && tname === "/#assign") || (data.token[dd].indexOf("<#global") === 0 && tname === "/#global")) {
                                            data.types[dd] = "template_start";
                                            count.start = count.start + 1;
                                            return false;
                                        }
                                    }
                                    if (tcount === 0) {
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
                                recordPush(data, record, tname);
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
                                // The following madness is required because cfmodule may be a singleton or a block.
                                // You don't know until you encounter the end tag
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
                                    count.start = count.start + 1;
                                    tt = Math.min(ss + 1, parse.count);
                                    struc = [["cfmodule", ss]];
                                    ss  = parse.count + 1;
                                    do {
                                        data.begin[tt] = struc[struc.length - 1][1];
                                        data.stack[tt] = struc[struc.length - 1][0];
                                        if (data.types[tt] === "end" || data.types[tt].indexOf("_end") > 0) {
                                            if (struc.length > 1) {
                                                struc.pop();
                                            }
                                        } else if (data.types[tt] === "start" || data.types[tt].indexOf("_start") > 0) {
                                            struc.push([tagName(data.token[tt]), tt]);
                                        }
                                        tt = tt + 1;
                                    } while (tt < ss);
                                    parse.structure.push(struc[0]);
                                    record.begin = struc[0][1];
                                    record.stack = "cfmodule";
                                    record.types = "template_end";
                                }
                                recordPush(data, record, "");
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
                                recordPush(data, record, tname);
                                singleton    = true;
                            }
                            return false;
                        }

                        if (html === "html") {
                            // html gets tag names in lowercase, if you want to preserve case sensitivity
                            // beautify as XML
                            if (element.charAt(0) === "<" && element.charAt(1) !== "!" && element.charAt(1) !== "?" && (parse.count < 0 || data.types[parse.count].indexOf("template") < 0) && cftags[tname] === undefined && tname.slice(0, 3) !== "cf_") {
                                element = element.toLowerCase();
                            }

                            if (htmlblocks[parse.structure[parse.structure.length - 1][0]] === "block" && peertest(tname.slice(1), parse.structure[parse.structure.length - 2][0]) === true) {
                                // looks for HTML tags missing an ending pair when encountering an ending tag for a parent node
                                addHtmlEnd(0);
                            } else if (
                                parse.structure.length > 3 &&
                                htmlblocks[parse.structure[parse.structure.length - 1][0]] === "block" &&
                                htmlblocks[parse.structure[parse.structure.length - 2][0]] === "block" &&
                                htmlblocks[parse.structure[parse.structure.length - 3][0]] === "block" &&
                                peertest(tname, parse.structure[parse.structure.length - 4][0]) === true
                            ) {
                                // looks for consecutive missing end tags
                                addHtmlEnd(3);
                            } else if (
                                parse.structure.length > 2 &&
                                htmlblocks[parse.structure[parse.structure.length - 1][0]] === "block" &&
                                htmlblocks[parse.structure[parse.structure.length - 2][0]] === "block" &&
                                peertest(tname, parse.structure[parse.structure.length - 3][0]) === true
                            ) {
                                // looks for consecutive missing end tags
                                addHtmlEnd(2);
                            } else if (
                                parse.structure.length > 1 &&
                                htmlblocks[parse.structure[parse.structure.length - 1][0]] === "block" &&
                                peertest(tname, parse.structure[parse.structure.length - 2][0]) === true
                            ) {
                                // looks for consecutive missing end tags
                                addHtmlEnd(1);
                            } else if (peertest(tname, parse.structure[parse.structure.length - 1][0]) === true) {
                                // certain tags cannot contain other certain tags if such tags are peers
                                addHtmlEnd(0);
                            } else if (tname.charAt(0) === "/" && htmlblocks[parse.structure[parse.structure.length - 1][0]] === "block" && parse.structure[parse.structure.length - 1][0] !== tname.slice(1)) {
                                // looks for consecutive missing end tags if the current element is an end tag
                                fixHtmlEnd(element, false);
                                record.begin                 = parse.structure[parse.structure.length - 1][1];
                                record.lines                 = parse.linesSpace;
                                record.stack                 = parse.structure[parse.structure.length - 1][0];
                                record.token                 = element;
                                record.types                 = "end";
                                data.lines[parse.count - 1] = 0;
                            }

                            // generalized corrections for the handling of singleton tags
                            if (data.types[parse.count] === "end" && htmlsings[tname.slice(1)] === "singleton" && element.toLowerCase().indexOf("/cftransaction") !== 1) {
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
                    if (options.language === "dustjs" && data.types[parse.count] === "template_start") {
                        const first:string = element.charAt(1),
                            ending:string  = element.slice(element.length - 2);
                        if ((ending === "/}" || ending.charAt(0) === first) && (first === "#" || first === "?" || first === "^" || first === "@" || first === "<" || first === "+")) {
                            data.types[parse.count] = "template";
                        }
                    }

                    // determine if the markup tag potentially contains code interpreted by a
                    // different lexer
                    if ((tname === "script" || tname === "style" || tname === "cfscript") && element.slice(element.length - 2) !== "/>") {

                        //get the attribute value for "type"
                        let len:number      = attstore.length - 1,
                            attValue:string = "",
                            attr:string[]     = [];
                        if (len > -1) {
                            do {
                                attr = arname(attstore[len][0]);
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
                        } else if (tname === "style" && options.language !== "jsx" && (attValue === "" || attValue === "text/css")) {
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
                    if (simple === true && ignoreme === false && ltype !== "xml" && ltype !== "sgml") {
                        if (cheat === true || element.slice(element.length - 2) === "/>") {
                            ltype = "singleton";
                        } else {
                            ltype = "start";
                        }
                        record.types = ltype;
                    }

                    // additional logic is required to find the end of a tag with the attribute
                    // data-parse-ignore
                    if (simple === true && preserve === false && ignoreme && end === ">" && element.slice(element.length - 2) !== "/>") {
                        let tags:string[] = [],
                            atstring:string[] = [];
                        if (cheat === true) {
                            ltype = "singleton";
                        } else {
                            attstore.forEach(function lexer_markup_tag_atstore(value:[string, number]):void {
                                atstring.push(value[0]);
                            });
                            preserve                = true;
                            ltype                   = "ignore";
                            a                       = a + 1;
                            if (a < c) {
                                let delim:string  = "",
                                    ee:number     = 0,
                                    ff:number     = 0,
                                    endtag:boolean = false;
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
                                        } else if (tags[0] !== "{" && b[a] === "{" && (options.language === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                            if (b[a + 1] === "{") {
                                                if (b[a + 2] === "{") {
                                                    delim = "}}}";
                                                } else {
                                                    delim = "}}";
                                                }
                                            } else if (options.language === "dustjs") {
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
                        element = element.replace(">", ` ${atstring.join(" ")}>`);
                        record.token = element;
                        record.types = "content-ignore";
                        attstore = [];
                    }

                    // some template tags can be evaluated as a block start/end based on syntax
                    // alone
                    if (record.types.indexOf("template") > -1) {
                        if (element.slice(0, 2) === "{%") {
                            let names:string[] = [
                                "autoescape",
                                "case",
                                "capture",
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
                                "switch",
                                "tablerow",
                                "unless",
                                "verbatim"
                            ];
                            if ((tname === "case" || tname === "default") && (parse.structure[parse.structure.length - 1][0] === "switch" || parse.structure[parse.structure.length - 1][0] === "case")) {
                                record.types = "template_else";
                            } else if (tname === "else" || tname === "elseif" || tname === "when" || tname === "elif" || tname === "elsif") {
                                record.types = "template_else";
                            } else {
                                let namelen:number = names.length - 1;
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
                        } else if (element.slice(0, 2) === "<%" && options.language === "silverstripe") {
                            if (tname === "if" || tname === "loop" || tname === "with" || tname === "control" || tname === "cached" || tname === "uncached") {
                                record.types = "template_start";
                            } else if (tname === "else" || tname === "else_if") {
                                record.types = "template_else";
                            } else if (tname === "end_if" || tname === "end_loop" || tname === "end_with" || tname === "end_control" || tname === "end_cached" || tname === "end_uncached") {
                                record.types = "template_end";
                            }
                        } else if (element.slice(0, 2) === "{{" && element.charAt(3) !== "{") {
                            if ((/^(\{\{\s*-?\s*end\s*-?\s*\}\})$/).test(element) === true) {
                                record.types = "template_end";
                            } else if (tname === "define" || tname === "form" || tname === "if" || tname === "range" || tname === "with") {
                                record.types = "template_start";
                            }
                        } else if (record.types === "template") {
                            if (element.indexOf("else") > 2) {
                                record.types = "template_else";
                            } else if ((/^(<%\s*\})/).test(element) === true || (/^(\[%\s*\})/).test(element) === true || (/^(\{@\s*\})/).test(element) === true) {
                                record.types = "template_end";
                            } else if ((/(\{\s*%>)$/).test(element) === true || (/(\{\s*%\])$/).test(element) === true || (/(\{\s*@\})$/).test(element) === true) {
                                record.types = "template_start";
                            } else if ((/\{\s*\?>$/).test(element) === true) {
                                record.types = "template_start";
                            } else if ((/^<\?(=|(php))\s*\}/).test(element) === true) {
                                record.types = "template_end";
                            }
                        }
                        if (record.types === "template_start" || record.types === "template_else") {
                            if ((/^<\?(=|(php))\s*/).test(element) === true) {
                                tname = element;
                            } else if (tname === "" || tname === "@" || tname === "#" || tname === "%") {
                                tname = tname + element.slice(1).replace(tname, "").replace(/^\s+/, "");
                                tname = tname.slice(0, tname.indexOf("(")).replace(/\s+/, "");
                            }
                        }
                    }

                    // identify script and style hidden within a CDATA escape
                    if (ltype === "cdata" && (record.stack === "script" || record.stack === "style")) {
                        let counta:number = parse.count,
                            countb:number = parse.count,
                            stack:string = record.stack;
                        if (data.types[countb] === "attribute") {
                            do {
                                counta = counta - 1;
                                countb  = countb - 1;
                            } while (data.types[countb] === "attribute" && countb > -1);
                        }
                        record.begin = counta;
                        element      = element
                            .replace(/^(\s*<!\[cdata\[)/i, "")
                            .replace(/(\]\]>\s*)$/, "");
                        record.token = "<![CDATA[";
                        record.types = "cdata_start";
                        recordPush(data, record, "");
                        parse.structure.push(["cdata", parse.count]);
                        if (stack === "script") {
                            sparser.lexers.script(element);
                        } else {
                            sparser.lexers.style(element);
                        }
                        record.begin = parse.structure[parse.structure.length - 1][1];
                        record.token = "]]>";
                        record.types = "cdata_end";
                        recordPush(data, record, "");
                        parse.structure.pop();
                    } else {
                        recordPush(data, record, tname);
                    }

                    attributeRecord();

                    // inserts a script space in anticipation of word wrap since JSX has unique white space rules
                    if (options.wrap > 0 && options.language === "jsx") {
                        let current_length:number = 0,
                            bb:number = parse.count,
                            cc:number = 0;
                        if (data.types[bb].indexOf("attribute") > -1) {
                            do {
                                current_length = current_length + data.token[bb].length + 1;
                                bb = bb - 1;
                            } while (data.lexer[bb] !== "markup" || data.types[bb].indexOf("attribute") > -1);
                            if (data.lines[bb] === 1) {
                                current_length = current_length + data.token[bb].length + 1;
                            }
                        } else if (data.lines[bb] === 1) {
                            current_length = data.token[bb].length + 1;
                        }
                        cc = bb - 1;
                        if (current_length > 0 && data.types[cc] !== "script_end") {
                            if (data.types[cc].indexOf("attribute") > -1) {
                                do {
                                    current_length = current_length + data.token[cc].length + 1;
                                    cc = cc - 1;
                                } while (data.lexer[cc] !== "markup" || data.types[cc].indexOf("attribute") > -1);
                                if (data.lines[cc] === 1) {
                                    current_length = current_length + data.token[cc].length + 1;
                                }
                            } else if (data.lines[cc] === 1) {
                                current_length = data.token[cc].length + 1;
                            }
                            if (current_length > options.wrap && data.lines[bb] === 1) {
                                record.begin = data.begin[bb];
                                record.ender = bb + 2;
                                record.lexer = data.lexer[bb];
                                record.lines = 1;
                                record.stack = data.stack[bb];
                                record.token = "{";
                                record.types = "script_start";
                                parse.splice({
                                    data: data,
                                    howmany: 0,
                                    index: bb,
                                    record: record
                                });
                                record.begin = bb;
                                record.lexer = "script";
                                record.lines = 0;
                                record.stack = "script";
                                if (options.quote_convert === "single") {
                                    record.token = "' '";
                                } else {
                                    record.token = "\" \"";
                                }
                                record.types = "string";
                                parse.splice({
                                    data: data,
                                    howmany: 0,
                                    index: bb + 1,
                                    record: record
                                });
                                record.lexer = "markup";
                                record.token = "}";
                                record.types = "script_end";
                                parse.splice({
                                    data: data,
                                    howmany: 0,
                                    index: bb + 2,
                                    record: record
                                });
                                data.ender[bb + 3] = data.ender[bb + 3] + 3;
                                bb = bb + 4;
                                do {
                                    data.begin[bb] = data.begin[bb] + 3;
                                    data.ender[bb] = data.ender[bb] + 3;
                                    bb = bb + 1;
                                } while (bb < parse.count);
                            }
                        }
                    }

                    //sorts child elements
                    if (options.lexer_options.markup.tag_sort === true && data.types[parse.count] === "end" && data.types[parse.count - 1] !== "start" && tname !== "/script" && tname !== "/style" && tname !== "/cfscript") {
                        let bb:number          = 0,
                            d:number           = 0,
                            startStore:number  = 0,
                            jsxatt:boolean      = false,
                            endData:record;
                        const children:Array<[number, number]> = [],
                            store:data       = {
                                begin: [],
                                ender: [],
                                lexer: [],
                                lines: [],
                                stack: [],
                                token: [],
                                types: []
                            },
                            storeRecord = function lexer_markup_tag_sorttag_storeRecord(index: number):record {
                                const output:record = {
                                    begin: data.begin[index],
                                    ender: data.ender[index],
                                    lexer: data.lexer[index],
                                    lines: data.lines[index],
                                    stack: data.stack[index],
                                    token: data.token[index],
                                    types: data.types[index]
                                };
                                return output;
                            },
                            childsort = function lexer_markup_tag_sorttag_childsort(a:[number, number], b:[number, number]):number {
                                if (data.token[a[0]] > data.token[b[0]]) {
                                    return -1;
                                }
                                return 1;
                            };
                        bb = parse.count - 1;
                        if (bb > -1) {
                            let endStore:number = 0;
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
                                            let cc:number = bb + 1;
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
                                recordPush(store, storeRecord(children[bb][0]), "");
                                if (children[bb][0] !== children[bb][1]) {
                                    d = children[bb][0] + 1;
                                    if (d < children[bb][1]) {
                                        do {
                                            recordPush(store, storeRecord(d), "");
                                            d = d + 1;
                                        } while (d < children[bb][1]);
                                    }
                                    recordPush(store, storeRecord(children[bb][1]), "");
                                }
                                bb = bb - 1;
                            } while (bb > -1);
                        }
                        endData = {
                            begin: data.begin.pop(),
                            ender: data.ender.pop(),
                            lexer: data.lexer.pop(),
                            lines: data.lines.pop(),
                            stack: data.stack.pop(),
                            token: data.token.pop(),
                            types: data.types.pop()
                        };
                        (function lexer_markup_tag_sorttag_slice() {
                            parse.datanames.forEach(function lexer_markup_tag_sorttag_slice_datanames(value) {
                                data[value] = data[value].slice(0, startStore);
                            });
                        }());
                        parse.concat(data, store);
                        count.end = count.end - 1;
                        recordPush(data, endData, "");
                    }
                    parse.linesSpace = 0;
                },

                // parses everything other than markup tags
                content       = function lexer_markup_content():void {
                    let lex:string[]       = [],
                        ltoke:string     = "",
                        jsxbrace:boolean  = (data.token[parse.count] === "{"),
                        liner:number     = parse.linesSpace,
                        now:number       = a;
                    const name:string      = (ext === true)
                            ? (jsxbrace === true)
                                ? "script"
                                : (parse.structure[parse.structure.length - 1][1] > -1)
                                    ? tagName(data.token[parse.structure[parse.structure.length - 1][1]].toLowerCase())
                                    : tagName(data.token[data.begin[parse.count]].toLowerCase())
                            : "",
                        square:boolean    = (
                            data.types[parse.count] === "template_start" && data.token[parse.count].indexOf("<!") === 0 && data.token[parse.count].indexOf("<![") < 0 && data.token[parse.count].charAt(data.token[parse.count].length - 1) === "["
                        ),
                        record:record    = {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "markup",
                            lines: liner,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: "",
                            types: "content"
                        },
                        esctest   = function lexer_markup_content_esctest():boolean {
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
                        let end:string    = "",
                            quote:string  = "",
                            quotes:number = 0;
                        do {
                            if (b[a] === "\n") {
                                parse.lineNumber = parse.lineNumber + 1;
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
                                            if (options.language !== "jsx" || b[a - 1] !== "<") {
                                                quote = "reg";
                                            }
                                        }
                                    } else if ((b[a] === "\"" || b[a] === "'" || b[a] === "`") && esctest() === false) {
                                        quote = b[a];
                                    } else if (b[a] === "{" && jsxbrace === true) {
                                        quotes = quotes + 1;
                                    } else if (b[a] === "}" && jsxbrace === true) {
                                        if (quotes === 0) {
                                            sparser.lexers.script(
                                                lex.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, "")
                                            );
                                            parse.structure[parse.structure.length - 1][1] + 1;
                                            if (data.types[parse.count] === "end" && data.lexer[data.begin[parse.count] - 1] === "script") {
                                                record.lexer = "script";
                                                record.token = (options.correct === true) ? ";" : "x;";
                                                record.types = "separator";
                                                recordPush(data, record, "");
                                                record.lexer = "markup";
                                            }
                                            record.token = "}";
                                            record.types = "script_end";
                                            recordPush(data, record, "");
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
                                        sparser.lexers.script(
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
                                            let outside = lex.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, "");
                                            a   = a - 1;
                                            if (lex.length < 1) {
                                                break;
                                            }
                                            if ((/^(<!--+)/).test(outside) === true && (/(--+>)$/).test(outside) === true) {
                                                record.token = "<!--";
                                                record.types = "comment";
                                                recordPush(data, record, "");
                                                outside = outside.replace(/^(<!--+)/, "").replace(/(--+>)$/, "");
                                                sparser.lexers.script(outside);
                                                record.token = "-->";
                                                recordPush(data, record, "");
                                            } else {
                                                sparser.lexers.script(outside);
                                            }
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
                                            let outside = lex.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, "");
                                            a   = a - 1;
                                            if (lex.length < 1) {
                                                break;
                                            }
                                            if ((/^(<!--+)/).test(outside) === true && (/(--+>)$/).test(outside) === true) {
                                                record.token = "<!--";
                                                record.types = "comment";
                                                recordPush(data, record, "");
                                                outside = outside.replace(/^(<!--+)/, "").replace(/(--+>)$/, "");
                                                sparser.lexers.style(outside);
                                                record.token = "-->";
                                                recordPush(data, record, "");
                                            } else {
                                                sparser.lexers.style(outside);
                                            }
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
                                ltoke = lex.join("");
                                if (options.lexer_options.markup.parse_space === false) {
                                    ltoke = ltoke.replace(/\s+$/, "");
                                }
                                liner = 0;
                                record.token = ltoke;
                                recordPush(data, record, "");
                                break;
                            }

                            //general content processing
                            if (ext === false && lex.length > 0 && ((b[a] === "<" && b[a + 1] !== "=" && (/\s|\d/).test(b[a + 1]) === false) || (b[a] === "[" && b[a + 1] === "%") || (b[a] === "{" && (options.language === "jsx" || options.language === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")))) {

                                //dustjs template handling
                                if (options.language === "dustjs" && b[a] === "{" && b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                                    a = a + 6;
                                    ltoke = lex.join("");
                                    if (options.lexer_options.markup.parse_space === false) {
                                        ltoke = ltoke.replace(/\s+$/, "");
                                    }
                                    liner = 0;
                                    record.token = ltoke;
                                    recordPush(data, record, "");
                                    record.token = "{:else}";
                                    record.types = "template_else";
                                    recordPush(data, record, "");
                                    break;
                                }

                                //regular content
                                a = a - 1;
                                if (options.lexer_options.markup.parse_space === true || parse.structure[parse.structure.length - 1][0] === "comment") {
                                    ltoke = lex.join("");
                                } else {
                                    ltoke = lex.join("").replace(/\s+$/, "");
                                }
                                ltoke = bracketSpace(ltoke);
                                liner = 0;
                                record.token = ltoke;
                                if (options.wrap > 0 && options.lexer_options.markup.preserve_text !== true) {
                                    let aa:number  = options.wrap,
                                        len:number = ltoke.length,
                                        startSpace:string = "",
                                        endSpace:string = "";
                                    const wrap:number = options.wrap,
                                        store:string[] = [],
                                        wrapper = function beautify_markup_apply_content_wrapper():void {
                                            if (ltoke.charAt(aa) === " ") {
                                                store.push(ltoke.slice(0, aa));
                                                ltoke = ltoke.slice(aa + 1);
                                                len = ltoke.length;
                                                aa = wrap;
                                                return;
                                            }
                                            do {
                                                aa = aa - 1;
                                            } while (aa > 0 && ltoke.charAt(aa) !== " ");
                                            if (aa > 0) {
                                                store.push(ltoke.slice(0, aa));
                                                ltoke = ltoke.slice(aa + 1);
                                                len = ltoke.length;
                                                aa = wrap;
                                            } else {
                                                aa = wrap;
                                                do {
                                                    aa = aa + 1;
                                                } while (aa < len && ltoke.charAt(aa) !== " ");
                                                store.push(ltoke.slice(0, aa));
                                                ltoke = ltoke.slice(aa + 1);
                                                len = ltoke.length;
                                                aa = wrap;
                                            }
                                        };
                                    // HTML anchor lists do not get wrapping unless the content itself exceeds the wrapping limit
                                    if (
                                        data.token[data.begin[parse.count]] === "<a>" &&
                                        data.token[data.begin[data.begin[parse.count]]] === "<li>" &&
                                        data.lines[data.begin[parse.count]] === 0 &&
                                        parse.linesSpace === 0 &&
                                        ltoke.length < options.wrap
                                    ) {
                                        recordPush(data, record, "");
                                        break;
                                    }
                                    if (len < wrap) {
                                        recordPush(data, record, "");
                                        break;
                                    }
                                    if (parse.linesSpace < 1) {
                                        let bb = parse.count;
                                        do {
                                            aa = aa - data.token[bb].length;
                                            if (data.types[bb].indexOf("attribute") > -1) {
                                                aa = aa - 1;
                                            }
                                            if (data.lines[bb] > 0 && data.types[bb].indexOf("attribute") < 0) {
                                                break;
                                            }
                                            bb = bb - 1;
                                        } while (bb > 0 && aa > 0);
                                        if (aa < 1) {
                                            aa = ltoke.indexOf(" ");
                                        }
                                    }
                                    ltoke = lex.join("");
                                    if (options.lexer_options.markup.parse_space === true) {
                                        startSpace = ((/\s/).test(ltoke.charAt(0)) === true)
                                            ? (/\s+/).exec(ltoke)[0]
                                            : "";
                                        endSpace = ((/\s/).test(ltoke.charAt(ltoke.length - 1)) === true)
                                            ? (/\s+$/).exec(ltoke)[0]
                                            : "";
                                    }
                                    ltoke = ltoke.replace(/^\s+/, "").replace(/\s+$/, "").replace(/\s+/g, " ");
                                    do {
                                        wrapper();
                                    } while (aa < len);
                                    if (ltoke !== "" && ltoke !== " ") {
                                        store.push(ltoke);
                                    }
                                    if (options.crlf === true) {
                                        ltoke = store.join("\r\n");
                                    } else {
                                        ltoke = store.join("\n");
                                    }
                                    ltoke = startSpace + ltoke + endSpace;
                                }
                                liner = 0;
                                record.token = ltoke;
                                recordPush(data, record, "");
                                break;
                            }
                            lex.push(b[a]);
                            a = a + 1;
                        } while (a < c);
                    }

                    if (options.lexer_options.markup.parse_space === false) {
                        if (a > now && a < c) {
                            if ((/\s/).test(b[a]) === true) {
                                let x:number = a;
                                parse.linesSpace = 1;
                                do {
                                    if (b[x] === "\n") {
                                        parse.linesSpace = parse.linesSpace + 1;
                                    }
                                    x = x - 1;
                                } while (x > now && (/\s/).test(b[x]) === true);
                            } else {
                                parse.linesSpace = 0;
                            }
                        } else if (a !== now || (a === now && ext === false)) {

                            //regular content at the end of the supplied source
                            ltoke = lex.join("").replace(/\s+$/, "");
                            liner = 0;
                            
                            //this condition prevents adding content that was just added in the loop above
                            if (record.token !== ltoke) {
                                record.token       = ltoke;
                                recordPush(data, record, "");
                                parse.linesSpace   = 0;
                            }
                        }
                    }
                    ext = false;
                };
            
            // trim the attribute_sort_list values
            if (asl > 0) {
                do {
                    attribute_sort_list[a] = attribute_sort_list[a].replace(/^\s+/, "").replace(/\s+$/, "");
                    a = a + 1;
                } while (a < asl);
                a = 0;
            }
            if (options.language === "html") {
                html = "html";
            } else if (options.language === "xml" || options.language === "sgml") {
                html = "xml";
            }
            do {
                if ((/\s/).test(b[a]) === true) {
                    if (options.lexer_options.markup.parse_space === true || (data.types[parse.count] === "template_start" && parse.structure[parse.structure.length - 1][0] === "comment")) {
                        content();
                    } else {
                        a = parse.spacer({array: b, end: c, index: a});
                    }
                } else if (ext) {
                    content();
                } else if (b[a] === "<") {
                    tag("");
                } else if (b[a] === "[" && b[a + 1] === "%") {
                    tag("%]");
                } else if (b[a] === "{" && (options.language === "jsx" || options.language === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                    tag("");
                } else if (b[a] === "]" && sgmlflag > 0) {
                    tag("]>");
                } else if (options.language === "vapor") {
                    if (b[a] === "#") {
                        tag(")");
                    } else if (b[a] === "{" && data.token[parse.count].charAt(0) === "#") {
                        vaporStart();
                    } else if (b[a] === "}") {
                        vaporEnd();
                    } else {
                        content();
                    }
                } else if (options.language === "jekyll" && b[a] === "-" && b[a + 1] === "-" && b[a + 2] === "-") {
                    tag("---");
                } else if (options.language === "apacheVelocity" && (/\d/).test(b[a + 1]) === false && (/\s/).test(b[a + 1]) === false) {
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
            if (data.token[parse.count].charAt(0) !== "/" && htmlblocks[parse.structure[parse.structure.length - 1][0]] === "block") {
                fixHtmlEnd(data.token[parse.count], true);
            }
            if (count.end !== count.start && sparser.parseerror === "") {
                if (count.end > count.start) {
                    let x:number = count.end - count.start,
                        plural:string = (x === 1)
                            ? ""
                            : "s";
                    sparser.parseerror = `${x} more end type${plural} than start types.`;
                } else {
                    let x:number = count.start - count.end,
                        plural:string = (x === 1)
                            ? ""
                            : "s";
                    sparser.parseerror = `${x} more start type${plural} than end types.`;
                }
            }
            return data;
        };

    sparser.lexers.markup = markup;
}());
