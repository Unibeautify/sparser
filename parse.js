/*
Parse Framework
*/

(function parse_init() {
    "use strict";
    var parser = function parser_(options) {
        var lexer      = {},
            lf         = (options.crlf === true || options.crlf === "true")
                ? "\r\n"
                : "\n",
            lineNumber = 1,
            recordPop  = function parser_recordPop(data, length) {
                return {
                    attrs : data
                        .attrs
                        .pop(),
                    begin : data
                        .begin
                        .pop(),
                    jscom : data
                        .jscom
                        .pop(),
                    length: length - 1,
                    lines : data
                        .lines
                        .pop(),
                    presv : data
                        .presv
                        .pop(),
                    stack : data
                        .stack
                        .pop(),
                    token : data
                        .token
                        .pop(),
                    types : data
                        .types
                        .pop()
                };
            },
            recordPush = function parser_recordPush(data, record, length) {
                data
                    .attrs
                    .push(record.attrs);
                data
                    .begin
                    .push(record.begin);
                data
                    .jscom
                    .push(record.jscom);
                data
                    .lines
                    .push(record.lines);
                data
                    .presv
                    .push(record.presv);
                data
                    .stack
                    .push(record.stack);
                data
                    .token
                    .push(record.token);
                data
                    .types
                    .push(record.types);
                return length + 1;
            },
            safeSort   = function parser_safeSort(array, operation, recursive) {
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
                                if (a < len) {
                                    do {
                                        if (arTest(storeb[a]) === true) {
                                            storeb[a] = safeSort__normal(storeb[a]);
                                        }
                                        a = a + 1;
                                    } while (a < len);
                                }
                            },
                            recurse = function safeSort__normal_recurse(x) {
                                var a      = 0,
                                    storea = [],
                                    len    = storeb.length;
                                if (a < len) {
                                    do {
                                        if (storeb[a] !== x) {
                                            storea.push(storeb[a]);
                                        }
                                        a = a + 1;
                                    } while (a < len);
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
                                if (a < lenc) {
                                    do {
                                        if (arTest(storeb[a]) === true) {
                                            storeb[a] = safeSort__descend(storeb[a]);
                                        }
                                        a = a + 1;
                                    } while (a < lenc);
                                }
                            },
                            recurse = function safeSort__descend_recurse() {
                                var a      = c,
                                    b      = 0,
                                    d      = 0,
                                    e      = 0,
                                    ind    = [],
                                    key    = storeb[c],
                                    tstore = "",
                                    tkey   = typeof key;
                                if (a < len) {
                                    do {
                                        tstore = typeof storeb[a];
                                        if (storeb[a] > key || (tstore > tkey)) {
                                            key = storeb[a];
                                            ind = [a];
                                        } else if (storeb[a] === key) {
                                            ind.push(a);
                                        }
                                        a = a + 1;
                                    } while (a < len);
                                }
                                d = ind.length;
                                a = c;
                                b = d + c;
                                if (a < b) {
                                    do {
                                        storeb[ind[e]] = storeb[a];
                                        storeb[a]      = key;
                                        e              = e + 1;
                                        a              = a + 1;
                                    } while (a < b);
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
                                if (a < lenc) {
                                    do {
                                        if (arTest(storeb[a]) === true) {
                                            storeb[a] = safeSort__ascend(storeb[a]);
                                        }
                                        a = a + 1;
                                    } while (a < lenc);
                                }
                            },
                            recurse = function safeSort__ascend_recurse() {
                                var a      = c,
                                    b      = 0,
                                    d      = 0,
                                    e      = 0,
                                    ind    = [],
                                    key    = storeb[c],
                                    tstore = "",
                                    tkey   = typeof key;
                                if (a < len) {
                                    do {
                                        tstore = typeof storeb[a];
                                        if (storeb[a] < key || tstore < tkey) {
                                            key = storeb[a];
                                            ind = [a];
                                        } else if (storeb[a] === key) {
                                            ind.push(a);
                                        }
                                        a = a + 1;
                                    } while (a < len);
                                }
                                d = ind.length;
                                a = c;
                                b = d + c;
                                if (a < b) {
                                    do {
                                        storeb[ind[e]] = storeb[a];
                                        storeb[a]      = key;
                                        e              = e + 1;
                                        a              = a + 1;
                                    } while (a < b);
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
            objectSort = function parser_objectSort(data) {
                var cc        = 0,
                    dd        = 0,
                    ee        = 0,
                    startlen  = data.token.length - 1,
                    behind    = startlen,
                    keys      = [],
                    keylen    = 0,
                    keyend    = 0,
                    front     = 0,
                    sort      = function parser_objectSort_sort(x, y) {
                        var xx = x[0],
                            yy = y[0];
                        if (data.types[xx] === "comment" || data.types[xx] === "comment-inline") {
                            do {
                                xx = xx + 1;
                            } while (
                                xx < startlen && (data.types[xx] === "comment" || data.types[xx] === "comment-inline")
                            );
                        }
                        if (data.types[yy] === "comment" || data.types[yy] === "comment-inline") {
                            do {
                                yy = yy + 1;
                            } while (
                                yy < startlen && (data.types[yy] === "comment" || data.types[yy] === "comment-inline")
                            );
                        }
                        if (data.token[xx].toLowerCase() > data.token[yy].toLowerCase()) {
                            return 1;
                        }
                        return -1;
                    },
                    commaTest = true,
                    store     = {
                        attrs: [],
                        begin: [],
                        jscom: [],
                        lines: [],
                        presv: [],
                        stack: [],
                        token: [],
                        types: []
                    };
                if (data.token[behind] === "," || data.types[behind] === "comment") {
                    do {
                        behind = behind - 1;
                    } while (
                        behind > 0 && (data.token[behind] === "," || data.types[behind] === "comment")
                    );
                }
                cc = behind;
                if (cc > -1) {
                    do {
                        if (data.types[cc] === "end") {
                            dd = dd + 1;
                        }
                        if (data.types[cc] === "start") {
                            dd = dd - 1;
                        }
                        if (dd === 0) {
                            if (data.types[cc].indexOf("template") > -1) {
                                return;
                            }
                            if (data.token[cc] === ",") {
                                commaTest = true;
                                front     = cc + 1;
                            }
                            if (commaTest === true && data.token[cc] === "," && front < behind) {
                                if (data.token[behind] !== ",") {
                                    behind = behind + 1;
                                }
                                if (data.types[front] === "comment-inline") {
                                    front = front + 1;
                                }
                                keys.push([front, behind]);
                                behind = front - 1;
                            }
                        }
                        if (dd < 0 && cc < startlen) {
                            if (keys.length > 0 && keys[keys.length - 1][0] > cc + 1) {
                                ee = keys[keys.length - 1][0];
                                if (data.types[ee - 1] !== "comment-inline") {
                                    ee = ee - 1;
                                }
                                keys.push([
                                    cc + 1,
                                    ee
                                ]);
                            }
                            if (data.token[cc - 1] === "=" || data.token[cc - 1] === ":" || data.token[cc - 1] === "(" || data.token[cc - 1] === "[" || data.token[cc - 1] === "," || data.types[cc - 1] === "word" || cc === 0) {
                                if (keys.length > 1) {
                                    keys.sort(sort);
                                    keylen    = keys.length;
                                    commaTest = false;
                                    dd        = 0;
                                    if (dd < keylen) {
                                        do {
                                            keyend = keys[dd][1];
                                            if (data.lines[keys[dd][0] - 1] > 1 && store.lines.length > 0) {
                                                store.lines[store.lines.length - 1] = data.lines[keys[dd][0] - 1];
                                            }
                                            ee = keys[dd][0];
                                            if (ee < keyend) {
                                                do {
                                                    store
                                                        .attrs
                                                        .push(data.attrs[ee]);
                                                    store
                                                        .begin
                                                        .push(data.begin[ee]);
                                                    store
                                                        .jscom
                                                        .push(data.jscom[ee]);
                                                    store
                                                        .lines
                                                        .push(data.lines[ee]);
                                                    store
                                                        .presv
                                                        .push(data.presv[ee]);
                                                    store
                                                        .stack
                                                        .push(data.stack[ee]);
                                                    store
                                                        .token
                                                        .push(data.token[ee]);
                                                    store
                                                        .types
                                                        .push(data.types[ee]);

                                                    //remove extra commas
                                                    if (data.token[ee] === ",") {
                                                        commaTest = true;
                                                    } else if (data.token[ee] !== "," && data.types[ee] !== "comment" && data.types[ee] !== "comment-inline") {
                                                        commaTest = false;
                                                    }
                                                    ee = ee + 1;
                                                } while (ee < keylen);
                                            }
                                            if (commaTest === false) {
                                                ee = store.types.length - 1;
                                                if (store.types[ee] === "comment" || store.types[ee] === "comment-inline") {
                                                    do {
                                                        ee = ee - 1;
                                                    } while (
                                                        ee > 0 && (store.types[ee] === "comment" || store.types[ee] === "comment-inline")
                                                    );
                                                }
                                                ee = ee + 1;
                                                store
                                                    .attrs
                                                    .splice(ee, 0, {});
                                                store
                                                    .begin
                                                    .splice(ee, 0, cc);
                                                store
                                                    .jscom
                                                    .splice(ee, 0, false);
                                                store
                                                    .lines
                                                    .splice(ee, 0, store.lines[ee - 1]);
                                                store
                                                    .presv
                                                    .splice(ee, 0, false);
                                                store
                                                    .stack
                                                    .splice(ee, 0, "object");
                                                store
                                                    .token
                                                    .splice(ee, 0, ",");
                                                store
                                                    .types
                                                    .splice(ee, 0, "separator");
                                                store.lines[ee - 1] = 0;
                                            }
                                            dd = dd + 1;
                                        } while (dd < keylen);
                                    }
                                    ee = store.types.length;
                                    do {
                                        ee = ee - 1;
                                    } while (
                                        ee > 0 && (store.types[ee] === "comment" || store.types[ee] === "comment-inline")
                                    );
                                    if (options.endcomma === "never" || options.endcomma === "multiline") {
                                        store
                                            .attrs
                                            .splice(ee, 1);
                                        store
                                            .begin
                                            .splice(ee, 1);
                                        store
                                            .jscom
                                            .splice(ee, 1);
                                        store
                                            .lines
                                            .splice(ee, 1);
                                        store
                                            .presv
                                            .splice(ee, 1);
                                        store
                                            .stack
                                            .splice(ee, 1);
                                        store
                                            .token
                                            .splice(ee, 1);
                                        store
                                            .types
                                            .splice(ee, 1);
                                    }
                                    keylen = data.token.length - (cc + 1);
                                    data
                                        .attrs
                                        .splice(cc + 1, keylen);
                                    data
                                        .begin
                                        .splice(cc + 1, keylen);
                                    data
                                        .jscom
                                        .splice(cc + 1, keylen);
                                    data
                                        .lines
                                        .splice(cc + 1, keylen);
                                    data
                                        .presv
                                        .splice(cc + 1, keylen);
                                    data
                                        .stack
                                        .splice(cc + 1, keylen);
                                    data
                                        .token
                                        .splice(cc + 1, keylen);
                                    data
                                        .types
                                        .splice(cc + 1, keylen);
                                    data.attrs  = data
                                        .attrs
                                        .concat(store.attrs);
                                    data.begin  = data
                                        .begin
                                        .concat(store.begin);
                                    data.jscom  = data
                                        .jscom
                                        .concat(store.jscom);
                                    data.lines  = data
                                        .lines
                                        .concat(store.lines);
                                    data.presv  = data
                                        .presv
                                        .concat(store.presv);
                                    data.stack  = data
                                        .stack
                                        .concat(store.stack);
                                    data.token  = data
                                        .token
                                        .concat(store.token);
                                    data.types  = data
                                        .types
                                        .concat(store.types);
                                    ee          = data.token.length;
                                    store.token = [cc];
                                    cc          = cc + 1;
                                    if (cc < ee) {
                                        do {
                                            if (data.types[cc] === "start") {
                                                store
                                                    .token
                                                    .push(cc);
                                            }
                                            data.begin[cc] = store.token[store.token.length - 1];
                                            if (data.types[cc] === "end") {
                                                store
                                                    .token
                                                    .pop();
                                            }
                                            cc = cc + 1;
                                        } while (cc < ee);
                                    }
                                } else if (options.endcomma === "always" && data.types[ee - 1] !== "start") {
                                    tokenpush(true, 0);
                                }
                            }
                            return;
                        }
                        cc = cc - 1;
                    } while (cc > -1);
                }
            };
        lexer.markup = function parser_markup(source) {

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
            var a             = 0,
                b             = source.split(""),
                c             = b.length,
                linesMarkup   = 0,
                lengthMarkup  = -1,
                list          = 0,
                litag         = 0,
                sgmlflag      = 0,
                minspace      = "",
                cftransaction = false,
                ext           = false,
                objsortop     = false,
                data          = {
                    attrs: [],
                    begin: [],
                    jscom: [],
                    lines: [],
                    presv: [],
                    stack: [],
                    token: [],
                    types: []
                },

                //cftags is a list of supported coldfusion tags
                // * required - means must have a separate matching end tag
                // * optional - means the tag could have a separate end tag, but is probably a
                // singleton
                // * prohibited - means there is not corresponding end tag
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
                },
                parseError    = [],
                parent        = [
                    ["none", -1]
                ],
                spacer        = function parser_markup_spacer() {
                    linesMarkup = 0;
                    do {
                        if (b[a] === "\n") {
                            linesMarkup = linesMarkup + 1;
                            lineNumber  = lineNumber + 1;
                        }
                        if ((/\s/).test(b[a + 1]) === false) {
                            break;
                        }
                        a = a + 1;
                    } while (a < c);
                },
                // Find the lowercase tag name of the provided token.
                tagName       = function parser_markup_tagName(el) {
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
                            .toLowerCase()
                        : el
                            .replace(reg, " ")
                            .slice(1, space)
                            .toLowerCase();
                    name  = name.replace(/(\}\})$/, "");
                    if (name.indexOf("(") > 0) {
                        name = name.slice(0, name.indexOf("("));
                    }
                    return name;
                },

                //parses tags, attributes, and template elements
                tag           = function parser_markup_tag(end) {
                    var lex       = [],
                        attr      = {},
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
                        ltype     = "",
                        tname     = "",
                        comment   = false,
                        cheat     = false,
                        endtag    = false,
                        nopush    = false,
                        nosort    = false,
                        simple    = false,
                        preserve  = false,
                        stest     = false,
                        ignoreme  = false,
                        quotetest = false,
                        parseFail = false,
                        singleton = false,
                        earlyexit = false,
                        attribute = [],
                        attstore  = [],

                        //attribute name
                        arname    = function parser_markup_tag_name(x) {
                            var eq = x.indexOf("=");
                            if (eq > 0 && ((eq < x.indexOf("\"") && x.indexOf("\"") > 0) || (eq < x.indexOf("'") && x.indexOf("'") > 0))) {
                                return x.slice(0, eq);
                            }
                            return x;
                        },

                        //finds slash escape sequences
                        slashy    = function parser_markup_tag_slashy() {
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

                        //attribute builder
                        attrpush  = function parser_markup_tag_attrpush(quotes) {
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
                    ext = false;

                    // this complex series of conditions determines an elements delimiters look to
                    // the types being pushed to quickly reason about the logic no type is pushed
                    // for start tags or singleton tags just yet some types set the `preserve` flag,
                    // which means to preserve internal white space The `nopush` flag is set when
                    // parsed tags are to be ignored and forgotten
                    (function parser_markup_types() {
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
                                    } else if (b[a + 4] === "[" && b[a + 5] === "i" && b[a + 6] === "f" && options.conditional === true) {
                                        end   = "-->";
                                        ltype = "conditional";
                                    } else if (b[a + 4] === "-" && (/<cf[a-z]/i).test(source) === true) {
                                        preserve = true;
                                        comment  = true;
                                        end      = "--->";
                                        ltype    = "comment";
                                    } else {
                                        end = "-->";
                                        if (options.comments === "nocomment") {
                                            nopush  = true;
                                            comment = true;
                                        } else {
                                            if (options.preserveComment === true) {
                                                preserve = true;
                                            }
                                            comment = true;
                                            if (options.commline === true) {
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
                                    if (options.commline === true) {
                                        data.lines[lengthMarkup] = 2;
                                    }
                                    ltype = "comment";
                                } else if (b[a + 2] === "#") {
                                    end     = "%>";
                                    comment = true;
                                    if (options.commline === true) {
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
                                end         = ">";
                                linesMarkup = linesMarkup + 1;
                                preserve    = true;
                                ltype       = "content_preserve";
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
                                end   = "}";
                                ltype = "script";
                            } else if (options.lang === "dustjs") {
                                if (b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                                    a            = a + 6;
                                    earlyexit    = true;
                                    lengthMarkup = recordPush(data, {
                                        attrs: {},
                                        begin: parent[parent.length - 1][1],
                                        jscom: false,
                                        lines: linesMarkup,
                                        presv: true,
                                        stack: parent[parent.length - 1][0],
                                        token: "{:else}",
                                        types: "template_else"
                                    }, lengthMarkup);
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
                                lengthMarkup = recordPush(data, {
                                    attrs: {},
                                    begin: parent[parent.length - 1][1],
                                    jscom: false,
                                    lines: linesMarkup,
                                    presv: true,
                                    stack: parent[parent.length - 1][0],
                                    token: "{@}else{@}",
                                    types: "template_else"
                                }, lengthMarkup);
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
                        if (options.unformatted === true) {
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
                                lineNumber = lineNumber + 1;
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
                                    if (options.lang === "jsx") {
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
                                            "Parse error on line " + lineNumber + " on element: "
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
                                                    lineNumber = lineNumber + 1;
                                                }
                                                if (options.unformatted === true) {
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
                                                                if (options.unformatted === false) {
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
                                                        quote                    = "";
                                                        jsxquote                 = "";
                                                        data.jscom[lengthMarkup] = true;
                                                        element                  = attribute.join("");
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
                                    } else if (comment === false && end !== "\n" && b[a] === "<" && b[a + 1] === "!" && b[a + 2] === "-" && b[a + 3] === "-" && b[a + 4] !== "#" && data.types[lengthMarkup] !== "conditional") {
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
                                    } else if (simple === true && end !== "\n" && (/\s/).test(b[a]) === true && b[a - 1] !== "<") {
                                        //identify a space in a regular start or singleton tag
                                        stest = true;
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

                    igcount = 0;
                    element = lex.join("");
                    tname   = tagName(element);

                    if (parent[parent.length - 1][1] === -1) {
                        parent[parent.length - 1] = ["root", lengthMarkup];
                    }

                    if (preserve === false && options.lang !== "jsx") {
                        element = element.replace(/\s+/g, " ");
                    }

                    //a quick hack to inject records for a type of template comments
                    if (tname === "comment" && element.slice(0, 2) === "{%") {
                        element      = element
                            .replace(/^(\{%\s*comment\s*%\}\s*)/, "")
                            .replace(/(\s*\{%\s*endcomment\s*%\})$/, "");
                        lengthMarkup = recordPush(data, {
                            attrs: {},
                            begin: parent[parent.length - 1][1],
                            jscom: false,
                            lines: linesMarkup,
                            presv: preserve,
                            stack: parent[parent.length - 1][0],
                            token: "{% comment %}",
                            types: "template_start"
                        }, lengthMarkup);
                        lengthMarkup = recordPush(data, {
                            attrs: {},
                            begin: parent[parent.length - 1][1],
                            jscom: false,
                            lines: linesMarkup,
                            presv: preserve,
                            stack: parent[parent.length - 1][0],
                            token: element,
                            types: "comment"
                        }, lengthMarkup);
                        lengthMarkup = recordPush(data, {
                            attrs: {},
                            begin: parent[parent.length - 1][1],
                            jscom: false,
                            lines: linesMarkup,
                            presv: preserve,
                            stack: parent[parent.length - 1][0],
                            token: "{% endcomment %}",
                            types: "template_end"
                        }, lengthMarkup);
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

                    //attribute processing
                    if (attstore.length > 0) {

                        //fix for singleton tags, since "/" at the end of the tag is not an attribute
                        if (attstore[attstore.length - 1] === "/") {
                            attstore.pop();
                            lex.splice(lex.length - 1, 0, "/");
                        }

                        //reconnects attribute names to their respective values if separated on "="
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
                        if (objsortop === true && data.jscom[lengthMarkup] === false && options.lang !== "jsx" && nosort === false && tname !== "cfif" && tname !== "cfelseif" && tname !== "cfset") {
                            attstore = safeSort(attstore);
                        }

                        //creates the attributes object for the current record
                        attr = (function parser_markup_attribute() {
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
                            if (objsortop === true && options.lang !== "jsx" && cft === undefined) {
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
                                        if (options.lang === "html" && cft === undefined) {
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
                                        if (options.lang === "html" && cft === undefined) {
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
                    }

                    //a correction for false-positive parse failures
                    if (parseFail === true) {
                        if (element.indexOf("<!--<![") === 0) {
                            parseError.pop();
                        } else {
                            parseError[parseError.length - 1] = parseError[parseError.length - 1] +
                                    element;
                            if (element.indexOf("</") > 0) {
                                lengthMarkup = recordPush(data, {
                                    attrs: attr,
                                    begin: parent[parent.length - 1][1],
                                    jscom: false,
                                    lines: linesMarkup,
                                    presv: preserve,
                                    stack: parent[parent.length - 1][0],
                                    token: element,
                                    types: "end"
                                }, lengthMarkup);
                                return;
                            }
                        }
                    }

                    // cheat identifies HTML singleton elements as singletons even if formatted as
                    // start tags, such as <br> (which is really <br/>)
                    cheat = (function parser_markup_tag_cheat() {
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
                            fixsingleton = function parser_markup_tag_cheat_fixsingleton() {
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
                                        if (bb === 0 && typeof data.token[aa] === "string" && data.token[aa].toLowerCase().indexOf(vname) === 1) {
                                            if (cftags[tagName(data.token[aa])] !== undefined) {
                                                data.types[aa] = "template_start";
                                            } else {
                                                data.types[aa] = "start";
                                            }
                                            if (Object.keys(data.attrs[aa]).length > 0) {
                                                data.token[aa] = data
                                                    .token[aa]
                                                    .replace(/(\s*\/>)$/, " >");
                                            } else {
                                                data.token[aa] = data
                                                    .token[aa]
                                                    .replace(/(\s*\/>)$/, ">");
                                            }
                                            return false;
                                        }
                                        aa = aa - 1;
                                    } while (aa > -1);
                                }
                                return false;
                            };
                        if (tname === "/cfquery") {
                            linesMarkup = linesMarkup - 1;
                        }

                        //determine if the current tag is an HTML singleton and exit
                        if (data.types[lengthMarkup] === "end" && tname.slice(0, 3) !== "/cf") {
                            quote = (typeof data.token[lengthMarkup] === "string")
                                ? data.token[lengthMarkup]
                                : "";
                            if (data.types[lengthMarkup - 1] === "singleton" && quote.charAt(quote.length - 2) !== "/" && "/" + tagName(quote) === tname) {
                                data.types[lengthMarkup - 1] = "start";
                            } else if (tname !== "/span" && tname !== "/div" && tname !== "/script" && tname === "/" + tagName(data.token[lengthMarkup]) && options.tagmerge === true(data.types[lengthMarkup - 1] === "start" || htmlsings[tname.slice(1)] === "singleton") && (options.lang !== "html" || (options.lang === "html" && tname !== "/li"))) {
                                lengthMarkup = recordPop(data, lengthMarkup).length;
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
                                    if (ee === 1 && typeof data.token[d] === "string") {
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
                        if (data.types[lengthMarkup] === "end" && tname.slice(0, 3) === "/cf" && cftags[tname.slice(1)] !== undefined) {
                            cfval = cftags[tname.slice(1)];
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
                                lengthMarkup = recordPush(data, {
                                    attrs: attr,
                                    begin: parent[parent.length - 1][1],
                                    jscom: false,
                                    lines: linesMarkup,
                                    presv: preserve,
                                    stack: parent[parent.length - 1][0],
                                    token: lex.join(""),
                                    types: "template_else"
                                }, lengthMarkup);
                                singleton    = true;
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
                                lengthMarkup = recordPush(data, {
                                    attrs: attr,
                                    begin: parent[parent.length - 1][1],
                                    jscom: false,
                                    lines: linesMarkup,
                                    presv: preserve,
                                    stack: parent[parent.length - 1][0],
                                    token: lex
                                        .join("")
                                        .replace(/\s+/, " "),
                                    types: "template"
                                }, lengthMarkup);
                                singleton    = true;
                                return false;
                            }
                            if (cfval === "required" && tname !== "cfquery") {
                                if (tname === "cftransaction" && cftransaction === false) {
                                    cftransaction = true;
                                }
                                lengthMarkup = recordPush(data, {
                                    attrs: attr,
                                    begin: (parent[parent.length - 1][1] === -1)
                                        ? lengthMarkup
                                        : parent[parent.length - 1][1],
                                    jscom: false,
                                    lines: linesMarkup,
                                    presv: preserve,
                                    stack: parent[parent.length - 1][0],
                                    token: lex.join(""),
                                    types: "template_start"
                                }, lengthMarkup);
                                singleton    = true;
                            }
                            return false;
                        }

                        if (options.lang === "html") {
                            // html gets tag names in lowercase, if you want to preserve case sensitivity
                            // beautify as XML
                            if (element.charAt(0) === "<" && element.charAt(1) !== "!" && element.charAt(1) !== "?" && (lengthMarkup < 0 || data.types[lengthMarkup].indexOf("template") < 0) && options.lang !== "jsx" && cftags[tname] === undefined && cftags[tname.slice(1)] === undefined && tname.slice(0, 3) !== "cf_") {
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
                                                lengthMarkup                 = recordPush(data, {
                                                    attrs: {},
                                                    begin: parent[parent.length - 1][1],
                                                    jscom: false,
                                                    lines: data.lines[lengthMarkup],
                                                    presv: false,
                                                    stack: parent[parent.length - 1][0],
                                                    token: "</li>",
                                                    types: "end"
                                                }, lengthMarkup);
                                                data.lines[lengthMarkup - 1] = 0;
                                                if (parent.length > 1) {
                                                    parent.pop();
                                                }
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
                                    lengthMarkup                 = recordPush(data, {
                                        attrs: {},
                                        begin: parent[parent.length - 1][1],
                                        jscom: false,
                                        lines: data.lines[lengthMarkup],
                                        presv: false,
                                        stack: parent[parent.length - 1][0],
                                        token: "</li>",
                                        types: "end"
                                    }, lengthMarkup);
                                    data.lines[lengthMarkup - 1] = 0;
                                    if (parent.length > 1) {
                                        parent.pop();
                                    }
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

                        return false;
                    }());

                    //This escape flag is set in the cheat function
                    if (singleton === true) {
                        return;
                    }

                    //tags with the following names are singletons
                    if (tname.charAt(0) === "#" && data.types[lengthMarkup] === "start" && (tname === "#assign" || tname === "#break" || tname === "#case" || tname === "#default" || tname === "#fallback" || tname === "#flush" || tname === "#ftl" || tname === "#global" || tname === "#import" || tname === "#include" || tname === "#local" || tname === "#t" || tname === "#lt" || tname === "#rt" || tname === "#nested" || tname === "#nt" || tname === "#recover" || tname === "#recurse" || tname === "#return" || tname === "#sep" || tname === "#setting" || tname === "#stop" || tname === "#visit")) {
                        simple = true;
                    }

                    //correction for dustjs tags to template singleton types
                    if (options.lang === "dustjs" && data.types[lengthMarkup] === "template_start") {
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
                                            } else if (b.slice(e + 1, e + 9).join("") !== "![CDATA[") {
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
                                        lineNumber = lineNumber + 1;
                                    }
                                    lex.push(b[a]);
                                    if (quote === "") {
                                        if (b[a] === "\"") {
                                            quote = "\"";
                                        } else if (b[a] === "'") {
                                            quote = "'";
                                        } else if (lex[0] !== "{" && b[a] === "{" && (options.lang === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
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

                    //some template tags can be evaluated as a block start/end based on syntax alone
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

                    lengthMarkup = recordPush(data, {
                        attrs: attr,
                        begin: parent[parent.length - 1][1],
                        jscom: false,
                        lines: linesMarkup,
                        presv: preserve,
                        stack: parent[parent.length - 1][0],
                        token: element,
                        types: ltype
                    }, lengthMarkup);

                    //sorts child elements
                    if (options.tagsort === true && data.types[lengthMarkup] === "end" && data.types[lengthMarkup - 1] !== "start") {
                        (function parser_markup_tag_sorttag() {
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
                                    lines: [],
                                    presv: [],
                                    stack: [],
                                    token: [],
                                    types: []
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
                            children = safeSort(children);
                            bb       = children.length - 1;
                            if (bb > -1) {
                                do {
                                    recordPush(store, {
                                        attrs: data.attrs[children[bb][0]],
                                        begin: data.begin[children[bb][0]],
                                        jscom: data.jscom[children[bb][0]],
                                        lines: data.lines[children[bb][0]],
                                        presv: data.presv[children[bb][0]],
                                        stack: data.stack[children[bb][0]],
                                        token: data.token[children[bb][0]],
                                        types: data.types[children[bb][0]]
                                    }, 0);
                                    if (children[bb][0] !== children[bb][1]) {
                                        d = children[bb][0] + 1;
                                        if (d < children[bb][1]) {
                                            do {
                                                recordPush(store, {
                                                    attrs: data.attrs[d],
                                                    begin: data.begin[d],
                                                    jscom: data.jscom[d],
                                                    lines: data.lines[d],
                                                    presv: data.presv[d],
                                                    stack: data.stack[d],
                                                    token: data.token[d],
                                                    types: data.types[d]
                                                }, 0);
                                                d = d + 1;
                                            } while (d < children[bb][1]);
                                        }
                                        recordPush(store, {
                                            attrs: data.attrs[children[bb][1]],
                                            begin: data.begin[children[bb][1]],
                                            jscom: data.jscom[children[bb][1]],
                                            lines: data.lines[children[bb][1]],
                                            presv: data.presv[children[bb][1]],
                                            stack: data.stack[children[bb][1]],
                                            token: data.token[children[bb][1]],
                                            types: data.types[children[bb][1]]
                                        }, 0);
                                    }
                                    bb = bb - 1;
                                } while (bb > -1);
                            }
                            endData.attrs = data
                                .attrs
                                .pop();
                            endData.begin = data
                                .begin
                                .pop();
                            endData.jscom = data
                                .jscom
                                .pop();
                            endData.lines = data
                                .lines
                                .pop();
                            endData.presv = data
                                .presv
                                .pop();
                            endData.stack = data
                                .stack
                                .pop();
                            endData.token = data
                                .token
                                .pop();
                            endData.types = data
                                .types
                                .pop();
                            lengthMarkup  = lengthMarkup - 1;
                            data.attrs    = data
                                .attrs
                                .slice(0, startStore)
                                .concat(store.attrs);
                            data.begin    = data
                                .begin
                                .slice(0, startStore)
                                .concat(store.begin);
                            data.jscom    = data
                                .jscom
                                .slice(0, startStore)
                                .concat(store.jscom);
                            data.lines    = data
                                .lines
                                .slice(0, startStore)
                                .concat(store.lines);
                            data.presv    = data
                                .presv
                                .slice(0, startStore)
                                .concat(store.presv);
                            data.stack    = data
                                .stack
                                .slice(0, startStore)
                                .concat(store.stack);
                            data.token    = data
                                .token
                                .slice(0, startStore)
                                .concat(store.token);
                            data.types    = data
                                .types
                                .slice(0, startStore)
                                .concat(store.types);
                            lengthMarkup  = data.token.length - 1;
                            lengthMarkup  = recordPush(data, {
                                attrs: endData.attrs,
                                begin: endData.begin,
                                jscom: endData.jscom,
                                lines: endData.lines,
                                presv: endData.presv,
                                stack: endData.stack,
                                token: endData.token,
                                types: endData.types
                            }, lengthMarkup);
                        }());
                    }

                    // this is necessary to describe the structures that populate the begin and
                    // stack data
                    if (data.types[lengthMarkup] === "start") {
                        parent.push([tname, lengthMarkup]);
                    } else if (data.types[lengthMarkup] === "end" && parent.length > 1) {
                        parent.pop();
                    }

                    linesMarkup = 0;
                },
                content       = function parser_markup_content() {
                    var lex       = [],
                        quote     = "",
                        ltoke     = "",
                        liner     = linesMarkup,
                        name      = (ext === true)
                            ? tagName(data.token[lengthMarkup])
                            : "",
                        end       = "",
                        square    = (
                            data.types[lengthMarkup] === "template_start" && data.token[lengthMarkup].indexOf("<!") === 0 && data.token[lengthMarkup].indexOf("<![") < 0 && data.token[lengthMarkup].charAt(data.token[lengthMarkup].length - 1) === "["
                        ),
                        tailSpace = function parser_markup_content_tailSpace(spacey) {
                            if (linesMarkup > 0 && spacey.indexOf("\n") < 0 && spacey.indexOf("\r") < 0) {
                                spacey = "";
                            }
                            return "";
                        },
                        esctest   = function parser_markup_content_esctest() {
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
                            if (b[a] === "\n") {
                                lineNumber = lineNumber + 1;
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

                                    //cfscript requires use of the script lexer
                                    if (name === "cfscript" && end === "</cfscript") {
                                        a   = a - 1;
                                        ext = false;
                                        if (lex.length < 1) {
                                            return;
                                        }
                                        lengthMarkup = recordPush(data, {
                                            attrs: {},
                                            begin: parent[parent.length - 1][1],
                                            jscom: false,
                                            lines: liner,
                                            presv: (linesMarkup > 0),
                                            stack: parent[parent.length - 1][0],
                                            token: lex
                                                .join("")
                                                .replace(/^(\s+)/, "")
                                                .replace(/(\s+)$/, ""),
                                            types: "cfscript"
                                        }, lengthMarkup);
                                        linesMarkup = 0;
                                        return;
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
                                                return;
                                            }
                                            lengthMarkup = recordPush(data, {
                                                attrs: {},
                                                begin: parent[parent.length - 1][1],
                                                jscom: false,
                                                lines: liner,
                                                presv: (linesMarkup > 0),
                                                stack: parent[parent.length - 1][0],
                                                token: lex
                                                    .join("")
                                                    .replace(/^(\s+)/, "")
                                                    .replace(/(\s+)$/, ""),
                                                types: "script"
                                            }, lengthMarkup);
                                            linesMarkup = 0;
                                            return;
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
                                                return;
                                            }
                                            lengthMarkup = recordPush(data, {
                                                attrs: {},
                                                begin: parent[parent.length - 1][1],
                                                jscom: false,
                                                lines: liner,
                                                presv: (linesMarkup > 0),
                                                stack: parent[parent.length - 1][0],
                                                token: lex
                                                    .join("")
                                                    .replace(/^(\s+)/, "")
                                                    .replace(/(\s+)$/, ""),
                                                types: "style"
                                            }, 0);
                                            linesMarkup = 0;
                                            return;
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

                            //typically this logic is for artifacts nested with an SGML tag
                            if (square === true && b[a] === "]") {
                                a = a - 1;
                                if (options.content === true) {
                                    ltoke = "text";
                                } else if (options.textpreserve === true) {
                                    ltoke = minspace + lex.join("");
                                    liner = 0;
                                } else if (linesMarkup > 0) {
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
                                lengthMarkup = recordPush(data, {
                                    attrs: {},
                                    begin: parent[parent.length - 1][1],
                                    jscom: false,
                                    lines: liner,
                                    presv: (linesMarkup > 0),
                                    stack: parent[parent.length - 1][0],
                                    token: ltoke,
                                    types: "content"
                                }, lengthMarkup);
                                linesMarkup = 0;
                                return;
                            }

                            //general content processing
                            if (ext === false && lex.length > 0 && ((b[a] === "<" && b[a + 1] !== "=" && (/\s|\d/).test(b[a + 1]) === false) || (b[a] === "[" && b[a + 1] === "%") || (b[a] === "{" && (options.lang === "jsx" || options.lang === "dustjs" || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")))) {

                                //dustjs template handling
                                if (options.lang === "dustjs" && b[a] === "{" && b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                                    a = a + 6;
                                    if (options.content === true) {
                                        ltoke = "text";
                                    } else if (options.textpreserve === true) {
                                        ltoke = minspace + lex.join("");
                                        liner = 0;
                                    } else {
                                        liner = lex
                                            .join("")
                                            .replace(/(\s+)$/, tailSpace)
                                            .replace(/\s+/g, " ");
                                    }
                                    lengthMarkup = recordPush(data, {
                                        attrs: {},
                                        begin: parent[parent.length - 1][1],
                                        jscom: false,
                                        lines: liner,
                                        presv: (linesMarkup > 0),
                                        stack: parent[parent.length - 1][0],
                                        token: ltoke,
                                        types: "content"
                                    }, lengthMarkup);
                                    lengthMarkup = recordPush(data, {
                                        attrs: {},
                                        begin: parent[parent.length - 1][1],
                                        jscom: false,
                                        lines: liner,
                                        presv: false,
                                        stack: parent[parent.length - 1][0],
                                        token: "{:else}",
                                        types: "template_else"
                                    }, lengthMarkup);
                                    linesMarkup = 0;
                                    return;
                                }

                                //regular content
                                a = a - 1;
                                if (options.content === true) {
                                    ltoke = "text";
                                } else if (options.textpreserve === true) {
                                    ltoke = minspace + lex.join("");
                                    liner = 0;
                                } else if (linesMarkup > 0) {
                                    ltoke = minspace + lex
                                        .join("")
                                        .replace(/(\s+)$/, tailSpace);
                                } else {
                                    ltoke = lex
                                        .join("")
                                        .replace(/(\s+)$/, tailSpace)
                                        .replace(/\s+/g, " ");
                                }
                                lengthMarkup = recordPush(data, {
                                    attrs: {},
                                    begin: parent[parent.length - 1][1],
                                    jscom: false,
                                    lines: liner,
                                    presv: (linesMarkup > 0),
                                    stack: parent[parent.length - 1][0],
                                    token: ltoke,
                                    types: "content"
                                }, lengthMarkup);
                                linesMarkup = 0;
                                return;
                            }
                            lex.push(b[a]);
                            a = a + 1;
                        } while (a < c);
                    }

                    //regular content at the end of the supplied source
                    if (options.content === true) {
                        ltoke = "text";
                    } else if (options.textpreserve === true) {
                        ltoke = minspace + lex.join("");
                        liner = 0;
                    } else {
                        ltoke = lex
                            .join("")
                            .replace(/(\s+)$/, tailSpace);
                    }
                    lengthMarkup = recordPush(data, {
                        attrs: {},
                        begin: parent[parent.length - 1][1],
                        jscom: false,
                        lines: liner,
                        presv: (linesMarkup > 0),
                        stack: parent[parent.length - 1][0],
                        token: ltoke,
                        types: "content"
                    }, lengthMarkup);
                    linesMarkup = 0;
                    return;
                };

            do {
                if ((/\s/).test(b[a]) === true) {
                    spacer();
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
        lexer.script = function parser_script(source) {
            var sourcemap      = [
                    0, ""
                ],
                objsortop      = false,
                json           = (options.lang === "json"),
                data           = {
                    attrs: [],
                    begin: [],
                    jscom: [],
                    lines: [],
                    presv: [],
                    stack: [],
                    token: [],
                    types: []
                },
                error          = [],
                scolon         = 0,
                a              = 0,
                b              = source.length,
                c              = options
                    .source
                    .split(""),
                ltoke          = "",
                ltype          = "",
                lword          = [],
                brace          = [],
                pword          = [],
                linesScript    = 0,
                lengthScript   = -1,
                lengthb        = 0,
                wordTest       = -1,
                paren          = -1,
                classy         = [],
                stacklist      = [
                    ["global", 0]
                ],
                tempstore      = {},
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
                start          = function parser_script_startInit() {
                    return;
                },
                //remove data by index
                cherrypick     = function parser_script_cherrypick(index, howmany, record) {
                    if (record !== undefined && typeof record.attrs === "object") {
                        data.attrs.splice(index, howmany, record.attrs);
                        data.begin.splice(index, howmany, record.begin);
                        data.jscom.splice(index, howmany, record.jscom);
                        data.lines.splice(index, howmany, record.lines);
                        data.presv.splice(index, howmany, record.presv);
                        data.stack.splice(index, howmany, record.stack);
                        data.token.splice(index, howmany, record.token);
                        data.types.splice(index, howmany, record.types);
                        lengthScript = (lengthScript - howmany) + 1;
                        linesScript = 0;
                        return;
                    }
                    data.attrs.splice(index, howmany);
                    data.begin.splice(index, howmany);
                    data.jscom.splice(index, howmany);
                    data.lines.splice(index, howmany);
                    data.presv.splice(index, howmany);
                    data.stack.splice(index, howmany);
                    data.token.splice(index, howmany);
                    data.types.splice(index, howmany);
                    lengthScript = lengthScript - howmany;
                },
                //peek at whats up next
                nextchar       = function parser_script_nextchar(len, current) {
                    var front = (current === true)
                            ? a
                            : a + 1,
                        cc    = front,
                        dd    = "";
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
                    if (cc < b) {
                        do {
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
                            cc = cc + 1;
                        } while (cc < b);
                    }
                    return "";
                },
                //cleans up improperly applied ASI
                asifix         = function parser_script_asifix() {
                    var len = lengthScript;
                    do {
                        len = len - 1;
                    } while (
                        len > 0 && (data.types[len] === "comment" || data.types[len] === "comment-inline")
                    );
                    if (data.token[len] === "from") {
                        len = len - 2;
                    }
                    if (data.token[len] === "x;") {
                        cherrypick(len, 1, {});
                    }
                },
                //determine the definition of containment by stack
                stackPush      = function parser_script_stackPush() {
                    // * block      : if, for, while, catch, function, class, map
                    // * immediates : else, do, try, finally, switch
                    // * paren based: method, expression, paren
                    // * data       : array, object
                    var aa     = 0,
                        wordx  = "",
                        wordy  = "",
                        record = {
                            attrs: {},
                            begin: lengthScript,
                            jscom: false,
                            lines: linesScript,
                            presv: false,
                            stack: "",
                            token: ltoke,
                            types: ltype
                        };
                    aa    = lengthScript - 1;
                    wordx = data.token[aa];
                    wordy = (data.stack[aa] === undefined)
                        ? ""
                        : data.token[data.begin[aa] - 1];
                    if (data.types[aa] === "comment" || data.types[aa] === "comment-inline") {
                        do {
                            aa = aa - 1;
                        } while (
                            aa > 0 && (data.types[aa] === "comment" || data.types[aa] === "comment-inline")
                        );
                        wordx = data.token[aa];
                    }
                    if ((data.token[lengthScript] === "{" || data.token[lengthScript] === "x{") && ((wordx === "else" && data.token[lengthScript] !== "if") || wordx === "do" || wordx === "try" || wordx === "finally" || wordx === "switch")) {
                        record.stack = wordx;
                    } else if (data.token[lengthScript] === "{" || data.token[lengthScript] === "x{") {
                        if (lengthScript === 1 && options.lang === "jsx") {
                            record.stack = "global";
                        } else if (classy[classy.length - 1] === 0 && wordx !== "return") {
                            classy.pop();
                            record.stack = "class";
                        } else if (data.token[aa - 1] === "class") {
                            record.stack = "class";
                        } else if (data.token[aa] === "]" && data.token[aa - 1] === "[") {
                            record.stack = "array";
                        } else if (data.types[aa] === "word" && (data.types[aa - 1] === "word" || (data.token[aa - 1] === "?" && data.types[aa - 2] === "word")) && data.token[aa] !== "in" && data.token[aa - 1] !== "export" && data.token[aa - 1] !== "import") {
                            record.stack = "map";
                        } else if (data.stack[aa] === "method" && data.types[aa] === "end" && data.types[data.begin[aa] - 1] === "word" && data.token[data.begin[aa] - 2] === "new") {
                            record.stack = "initializer";
                        } else if (data.token[lengthScript] === "{" && (wordx === ")" || wordx === "x)") && (data.types[data.begin[aa] - 1] === "word" || data.token[data.begin[aa] - 1] === "]")) {
                            if (wordy === "if") {
                                record.stack = "if";
                            } else if (wordy === "for") {
                                record.stack = "for";
                            } else if (wordy === "while") {
                                record.stack = "while";
                            } else if (wordy === "class") {
                                record.stack = "class";
                            } else if (wordy === "switch" || data.token[data.begin[aa] - 1] === "switch") {
                                record.stack = "switch";
                            } else if (wordy === "catch") {
                                record.stack = "catch";
                            } else {
                                record.stack = "function";
                            }
                        } else if (data.token[lengthScript] === "{" && (wordx === ";" || wordx === "x;")) {
                            //ES6 block
                            record.stack = "block";
                        } else if (data.token[lengthScript] === "{" && data.token[aa] === ":" && data.stack[aa] === "switch") {
                            //ES6 block
                            record.stack = "block";
                        } else if (data.token[aa - 1] === "import" || data.token[aa - 2] === "import" || data.token[aa - 1] === "export" || data.token[aa - 2] === "export") {
                            record.stack = "object";
                        } else if (wordx === ")" && (pword[0] === "function" || pword[0] === "if" || pword[0] === "for" || pword[0] === "class" || pword[0] === "while" || pword[0] === "switch" || pword[0] === "catch")) {
                            // if preceeded by a paren the prior containment is preceeded by a keyword if
                            // (...) {
                            record.stack = pword[0];
                        } else if (data.stack[aa] === "notation") {
                            //if following a TSX array type declaration
                            record.stack = "function";
                        } else if ((data.types[aa] === "literal" || data.types[aa] === "word") && data.types[aa - 1] === "word" && data.token[data.begin[aa] - 1] !== "for") {
                            //if preceed by a word and either string or word public class {
                            record.stack = "function";
                        } else if (stacklist.length > 0 && data.token[aa] !== ":" && stacklist[stacklist.length - 1][0] === "object" && (
                            data.token[data.begin[aa] - 2] === "{" || data.token[data.begin[aa] - 2] === ","
                        )) {
                            // if an object wrapped in some containment which is itself preceeded by a curly
                            // brace or comma var a={({b:{cat:"meow"}})};
                            record.stack = "function";
                        } else if (data.types[pword[1] - 1] === "markup" && data.token[pword[1] - 3] === "function") {
                            //checking for TSX function using an angle brace name
                            record.stack = "function";
                        } else if (wordx === "=>") {
                            //checking for fat arrow assignment
                            record.stack = "function";
                        } else if (wordx === ")" && data.stack[aa] === "method" && data.types[data.begin[aa] - 1] === "word") {
                            record.stack = "function";
                        } else if (data.types[aa] === "word" && data.token[lengthScript] === "{" && data.token[aa] !== "return" && data.token[aa] !== "in" && data.token[aa] !== "import" && data.token[aa] !== "const" && data.token[aa] !== "let" && data.token[aa] !== "") {
                            //ES6 block
                            record.stack = "block";
                        } else {
                            record.stack = "object";
                        }
                    } else if (data.token[lengthScript] === "[") {
                        if ((/\s/).test(c[a - 1]) === true && data.types[aa] === "word" && wordx !== "return" && options.lang !== "twig") {
                            record.stack = "notation";
                        } else {
                            record.stack = "array";
                        }
                    } else if (data.token[lengthScript] === "(" || data.token[lengthScript] === "x(") {
                        if (data.types[aa] === "generic") {
                            record.stack = "method";
                        } else if (data.token[aa] === "}" && data.stack[aa] === "function") {
                            record.stack = "method";
                        } else if (wordx === "if" || wordx === "for" || wordx === "function" || wordx === "class" || wordx === "while" || wordx === "catch" || wordx === "switch" || wordx === "with") {
                            record.stack = "expression";
                        } else if ((data.types[aa] === "word" && wordx !== "return") || (wordx === "}" && (data.stack[aa] === "function" || data.stack[aa] === "class"))) {
                            record.stack = "method";
                        } else {
                            record.stack = "paren";
                        }
                    } else if (ltoke === ":" && data.types[aa] === "word" && data.token[aa - 1] === "[") {
                        data.stack[aa]                     = "attribute";
                        data.stack[aa - 1]                 = "attribute";
                        record.stack                       = "attribute";
                        stacklist[stacklist.length - 1][0] = "attribute";
                    } else if (stacklist.length === 0) {
                        record.stack = "global";
                        record.begin = 0;
                    } else {
                        record.stack = stacklist[stacklist.length - 1][0];
                        record.begin = stacklist[stacklist.length - 1][1];
                    }
                    lengthScript = recordPush(data, record, lengthScript);
                    linesScript  = 0;
                },
                //inserts ending curly brace
                blockinsert    = function parser_script_blockinsert() {
                    var next = nextchar(5, false),
                        g    = lengthScript;
                    if (json === true) {
                        return;
                    }
                    if (data.stack[lengthScript] === "do" && next === "while" && data.token[lengthScript] === "}") {
                        return;
                    }
                    next = next.slice(0, 4);
                    if (ltoke === ";" && data.token[g - 1] === "x{") {
                        //to prevent the semicolon from inserting between the braces --> while (x) {};
                        tempstore    = recordPop(data, lengthScript);
                        lengthScript = tempstore.length;
                        ltoke        = "x}";
                        ltype        = "end";
                        stackPush();
                        brace.pop();
                        pstack       = stacklist.pop();
                        ltoke        = ";";
                        ltype        = "end";
                        lengthScript = recordPush(data, tempstore, lengthScript);
                        return;
                    }
                    ltoke = "x}";
                    ltype = "end";
                    if (data.token[lengthScript] === "x}") {
                        return;
                    }
                    if (data.stack[lengthScript] === "if" && (data.token[lengthScript] === ";" || data.token[lengthScript] === "x;") && next === "else") {
                        stackPush();
                        brace.pop();
                        pstack = stacklist.pop();
                        return;
                    }
                    do {
                        stackPush();
                        brace.pop();
                        pstack = stacklist.pop();
                    } while (brace[brace.length - 1] === "x{");
                },
                //remove "vart" object data
                vartpop        = function parser_script_vartpop() {
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
                logError       = function parser_script_logError(message, start) {
                    var f = a,
                        g = lengthScript;
                    if (error.length > 0) {
                        return;
                    }
                    error.push(message);
                    do {
                        f = f - 1;
                    } while (c[f] !== "\n" && f > 0);
                    error.push(c.slice(f, start).join(""));
                    if (g > 0) {
                        do {
                            g = g - 1;
                        } while (g > -1 && data.types[g] !== "comment");
                    }
                    if (g > -1 && g < lengthScript && data.token[g].indexOf("//") === 0 && error[1].replace(/^\s+/, "").indexOf(data.token[g + 1]) === 0 && (data.token[g].split("\"").length % 2 === 1 || data.token[g].split("'").length % 2 === 1)) {
                        error = [
                            message, data.token[g] + error[1]
                        ];
                    } else {
                        error = [
                            message, error[1]
                        ];
                    }
                },
                //A lexer for keywords, reserved words, and variables
                word           = function parser_script_word() {
                    var f        = wordTest,
                        g        = 1,
                        build    = {},
                        output   = "",
                        nextitem = "",
                        elsefix  = function parser_script_word_elsefix() {
                            brace.push("x{");
                            stacklist.push(["else", lengthScript]);
                            cherrypick(lengthScript - 3, 1, {});
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
                    if (lengthScript > 0 && output === "function" && data.token[lengthScript] === "(" && (data.token[lengthScript - 1] === "{" || data.token[lengthScript - 1] === "x{")) {
                        data.types[lengthScript] = "start";
                    }
                    if (lengthScript > 1 && output === "function" && ltoke === "(" && (data.token[lengthScript - 1] === "}" || data.token[lengthScript - 1] === "x}")) {
                        if (data.token[lengthScript - 1] === "}") {
                            f = lengthScript - 2;
                            if (f > -1) {
                                do {
                                    if (data.types[f] === "end") {
                                        g = g + 1;
                                    } else if (data.types[f] === "start" || data.types[f] === "end") {
                                        g = g - 1;
                                    }
                                    if (g === 0) {
                                        break;
                                    }
                                    f = f - 1;
                                } while (f > -1);
                            }
                            if (data.token[f] === "{" && data.token[f - 1] === ")") {
                                g = 1;
                                f = f - 2;
                                if (f > -1) {
                                    do {
                                        if (data.types[f] === "end") {
                                            g = g + 1;
                                        } else if (data.types[f] === "start" || data.types[f] === "end") {
                                            g = g - 1;
                                        }
                                        if (g === 0) {
                                            break;
                                        }
                                        f = f - 1;
                                    } while (f > -1);
                                }
                                if (data.token[f - 1] !== "function" && data.token[f - 2] !== "function") {
                                    data.types[lengthScript] = "start";
                                }
                            }
                        } else {
                            data.types[lengthScript] = "start";
                        }
                    }
                    if (options.correct === true && (output === "Object" || output === "Array") && c[a + 1] === "(" && c[a + 2] === ")" && data.token[lengthScript - 1] === "=" && data.token[lengthScript] === "new") {
                        if (output === "Object") {
                            data.token[lengthScript]           = "{";
                            ltoke                              = "}";
                            data.stack[lengthScript]           = "object";
                            stacklist[stacklist.length - 1][0] = "object";
                        } else {
                            data.token[lengthScript]           = "[";
                            ltoke                              = "]";
                            data.stack[lengthScript]           = "array";
                            stacklist[stacklist.length - 1][0] = "array";
                        }
                        data.types[lengthScript] = "start";
                        ltype                    = "end";
                        c[a + 1]                 = "";
                        c[a + 2]                 = "";
                        a                        = a + 2;
                    } else {
                        g = lengthScript;
                        f = g;
                        if (options.varword !== "none" && (output === "var" || output === "let" || output === "const")) {
                            if (data.types[g] === "comment" || data.types[g] === "comment-inline") {
                                do {
                                    g = g - 1;
                                } while (g > 0 && (data.types[g] === "comment" || data.types[g] === "comment-inline"));
                            }
                            if (options.varword === "list" && vart.len > -1 && vart.index[vart.len] === g && output === vart.word[vart.len]) {
                                ltoke                = ",";
                                ltype                = "separator";
                                data.token[g]        = ltoke;
                                data.types[g]        = ltype;
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
                        } else if (vart.len > -1 && output !== vart.word[vart.len] && lengthScript === vart.index[vart.len] && data.token[vart.index[vart.len]] === ";" && ltoke !== vart.word[vart.len] && options.varword === "list") {
                            vartpop();
                        }
                        if (output === "else" && (data.types[g] === "comment" || data.types[g] === "comment-inline")) {
                            do {
                                f = f - 1;
                            } while (f > -1 && (data.types[f] === "comment" || data.types[f] === "comment-inline"));
                            if (data.token[f] === "x;" && (data.token[f - 1] === "}" || data.token[f - 1] === "x}")) {
                                cherrypick(f, 1, {});
                                g = g - 1;
                                f = f - 1;
                            }
                            do {
                                build = {
                                    attrs: data.attrs[g],
                                    begin: data.begin[g],
                                    jscom: data.jscom[g],
                                    lines: data.lines[g],
                                    presv: data.presv[g],
                                    stack: data.stack[g],
                                    token: data.token[g],
                                    types: data.types[g]
                                };
                                tempstore = recordPop(data, lengthScript);
                                lengthScript = tempstore.length;
                                cherrypick(g - 3, 0, build);
                                f = f + 1;
                            } while (f < g);
                        }
                        if (output === "from" && data.token[lengthScript] === "x;" && data.token[lengthScript - 1] === "}") {
                            asifix();
                        }
                        if (output === "while" && data.token[lengthScript] === "x;" && data.token[lengthScript - 1] === "}") {
                            (function parser_script_word_whilefix() {
                                var d = 0,
                                    e = lengthScript - 2;
                                if (e > -1) {
                                    do {
                                        if (data.types[e] === "end") {
                                            d = d + 1;
                                        } else if (data.types[e] === "start") {
                                            d = d - 1;
                                        }
                                        if (d < 0) {
                                            if (data.token[e] === "{" && data.token[e - 1] === "do") {
                                                asifix();
                                            }
                                            return;
                                        }
                                        e = e - 1;
                                    } while (e > -1);
                                }
                            }());
                        }
                        ltoke = output;
                        ltype = "word";
                        if (output === "from" && data.token[lengthScript] === "}") {
                            asifix();
                        }
                    }
                    stackPush();
                    if (output === "class") {
                        classy.push(0);
                    }
                    if (output === "do") {
                        nextitem = nextchar(1, true);
                        if (nextitem !== "{") {
                            ltoke = "x{";
                            ltype = "start";
                            brace.push("x{");
                            stackPush();
                            stacklist.push([
                                "do", lengthScript
                            ]);
                        }
                    }
                    if (output === "else") {
                        nextitem = nextchar(2, true);
                        if (nextitem !== "if" && nextitem.charAt(0) !== "{") {
                            ltoke = "x{";
                            ltype = "start";
                            brace.push("x{");
                            stackPush();
                            stacklist.push([
                                "else", lengthScript
                            ]);
                        }
                        if (data.token[lengthScript - 2] === "x}") {
                            if (data.token[lengthScript - 1] === "else") {
                                if (data.token[lengthScript - 3] === "x}" && pstack[0] !== "if" && data.stack[lengthScript - 1] === "else") {
                                    elsefix();
                                } else if (data.token[lengthScript - 3] === "}" && data.stack[lengthScript - 3] === "if" && pstack[0] === "if" && data.token[pstack[1] - 1] !== "if" && data.token[data.begin[lengthScript - 2]] === "x{") {
                                    //fixes when "else" is following a block that isn't "if"
                                    elsefix();
                                }
                            } else if (data.token[lengthScript - 1] === "x}" && data.stack[lengthScript - 1] === "if") {
                                elsefix();
                            }
                        }
                    }
                    if ((output === "for" || output === "if" || output === "switch" || output === "catch") && options.lang !== "twig" && data.token[lengthScript - 1] !== ".") {
                        nextitem = nextchar(1, true);
                        if (nextitem !== "(") {
                            paren = lengthScript;
                            start("x(");
                        }
                    }
                },
                //determines if a slash comprises a valid escape or if it is escaped itself
                slashes        = function parser_script_slashes(index) {
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
                commaComment   = function parser_script_commacomment() {
                    var x = lengthScript;
                    if (data.stack[x] === "object" && objsortop === true) {
                        ltoke = ",";
                        ltype = "separator";
                        asifix();
                        stackPush();
                    } else {
                        do {
                            x = x - 1;
                        } while (
                            x > 0 && (data.types[x - 1] === "comment" || data.types[x - 1] === "comment-inline")
                        );
                        cherrypick(x, 0, {
                            attrs: {},
                            begin: data.begin[x],
                            jscom: false,
                            lines: linesScript,
                            presv: false,
                            stack: data.stack[x],
                            token: ",",
                            types: "separator"
                        });
                        stackPush();
                    }
                },
                //automatic semicolon insertion
                asi            = function parser_script_asi(isEnd) {
                    var aa    = 0,
                        next  = nextchar(1, false),
                        record = {
                            attrs: data.attrs[lengthScript],
                            begin: data.begin[lengthScript],
                            jscom: data.jscom[lengthScript],
                            lines: data.lines[lengthScript],
                            presv: data.presv[lengthScript],
                            stack: data.stack[lengthScript],
                            token: data.token[lengthScript],
                            types: data.types[lengthScript],
                        },
                        clist = (stacklist.length === 0)
                            ? ""
                            : stacklist[stacklist.length - 1][0];
                    if (options.lang === "json" || record.token === ";" || record.token === "," || next === "{" || record.stack === "class" || record.stack === "map" || record.stack === "attribute" || clist === "initializer" || data.types[record.begin - 1] === "generic") {
                        return;
                    }
                    if (((record.stack === "global" && record.types !== "end") || (record.types === "end" && data.stack[record.begin - 1] === "global")) && (next === "" || next === "}") && record.stack === data.stack[lengthScript - 1] && options.lang === "jsx") {
                        return;
                    }
                    if (record.stack === "array" && record.token !== "]") {
                        return;
                    }
                    if (record.types !== undefined && record.types.indexOf("template") > -1) {
                        return;
                    }
                    if (next === ";" && isEnd === false) {
                        return;
                    }
                    if (options.lang === "qml") {
                        if (record.types === "start") {
                            return;
                        }
                        ltoke = "x;";
                        ltype = "separator";
                        stackPush();
                        if (brace[brace.length - 1] === "x{" && nextchar !== "}") {
                            blockinsert();
                        }
                        return;
                    }
                    if (record.token === "}" && (record.stack === "function" || record.stack === "if" || record.stack === "else" || record.stack === "for" || record.stack === "do" || record.stack === "while" || record.stack === "switch" || record.stack === "class" || record.stack === "try" || record.stack === "catch" || record.stack === "finally" || record.stack === "block")) {
                        if (data.token[record.begin - 1] === ")") {
                            aa = data.begin[record.begin - 1] - 1;
                            if (data.token[aa - 1] === "function") {
                                aa = aa - 1;
                            }
                            if (data.stack[aa - 1] === "object" || data.stack[aa - 1] === "switch") {
                                return;
                            }
                            if (data.token[aa - 1] !== "=" && data.token[aa - 1] !== "return" && data.token[aa - 1] !== ":") {
                                return;
                            }
                        } else {
                            return;
                        }
                    }
                    if (record.types === "comment" || record.types === "comment-inline" || clist === "method" || clist === "paren" || clist === "expression" || clist === "array" || clist === "object" || (clist === "switch" && record.stack !== "method" && data.token[data.begin[lengthScript]] === "(")) {
                        return;
                    }
                    if (data.stack[lengthScript] === "expression" && (data.token[data.begin[lengthScript] - 1] !== "while" || (data.token[data.begin[lengthScript] - 1] === "while" && data.stack[data.begin[lengthScript] - 2] !== "do"))) {
                        return;
                    }
                    if (next !== "" && "=<>+*?|^:&%~,.()]".indexOf(next) > -1 && isEnd === false) {
                        return;
                    }
                    if (record.types === "comment" || record.types === "comment-inline") {
                        aa = lengthScript;
                        do {
                            aa = aa - 1;
                        } while (
                            aa > 0 && (data.types[aa] === "comment" || data.types[aa] === "comment-inline")
                        );
                        if (aa < 1) {
                            return;
                        }
                        record.token = data.token[aa];
                        record.types = data.types[aa];
                        record.stack = data.stack[aa];
                    }
                    if (record.token === undefined || record.types === "start" || record.types === "separator" || (record.types === "operator" && record.token !== "++" && record.token !== "--") || record.token === "x}" || record.token === "var" || record.token === "let" || record.token === "const" || record.token === "else" || record.token.indexOf("#!/") === 0 || record.token === "instanceof") {
                        return;
                    }
                    if (record.stack === "method" && (data.token[record.begin - 1] === "function" || data.token[record.begin - 2] === "function")) {
                        return;
                    }
                    if (options.varword === "list") {
                        vart.index[vart.len] = lengthScript;
                    }
                    ltoke = ";";
                    ltype = "separator";
                    aa = aa + 1;
                    cherrypick(aa, 0, {
                        attrs: {},
                        begin: data.begin[aa],
                        jscom: false,
                        lines: linesScript,
                        presv: false,
                        stack: data.stack[aa],
                        token: "x;",
                        types: "separator"
                    });
                    stackPush();
                    if (brace[brace.length - 1] === "x{" && nextchar !== "}") {
                        blockinsert();
                    }
                },
                //convert ++ and -- into "= x +"  and "= x -" in most cases
                plusplus       = function parser_script_plusplus() {
                    var store      = [],
                        pre        = true,
                        toke       = "+",
                        tokea      = "",
                        tokeb      = "",
                        tokec      = "",
                        inc        = 0,
                        ind        = 0,
                        walk       = 0,
                        end        = function parser_script_plusplus_endInit() {
                            return;
                        },
                        period     = function parser_script_plusplus_periodInit() {
                            return;
                        },
                        applyStore = function parser_script_plusplus_applyStore() {
                            var x = 0,
                                y = store.length;
                            do {
                                lengthScript = recordPush(data, store[x], lengthScript);
                                x = x + 1;
                            } while (x < y);
                        },
                        next       = "";
                    tokea   = data.token[lengthScript];
                    tokeb   = data.token[lengthScript - 1];
                    tokec   = data.token[lengthScript - 2];
                    end     = function parser_script_plusplus_end() {
                        walk = data.begin[walk] - 1;
                        if (data.types[walk] === "end") {
                            parser_script_plusplus_end();
                        } else if (data.token[walk - 1] === ".") {
                            period();
                        }
                    };
                    period  = function parser_script_plusplus_period() {
                        walk = walk - 2;
                        if (data.types[walk] === "end") {
                            end();
                        } else if (data.token[walk - 1] === ".") {
                            parser_script_plusplus_period();
                        }
                    };
                    if (tokea !== "++" && tokea !== "--" && tokeb !== "++" && tokeb !== "--") {
                        walk = lengthScript;
                        if (data.types[walk] === "end") {
                            end();
                        } else if (data.token[walk - 1] === ".") {
                            period();
                        }
                    }
                    if (data.token[walk - 1] === "++" || data.token[walk - 1] === "--") {
                        if ("startendoperator".indexOf(data.types[walk - 2]) > -1) {
                            return;
                        }
                        inc = walk;
                        if (inc < lengthScript) {
                            do {
                                store.push({
                                    attrs: data.attrs[inc],
                                    begin: data.begin[inc],
                                    jscom: data.jscom[inc],
                                    lines: data.lines[inc],
                                    presv: data.presv[inc],
                                    stack: data.stack[inc],
                                    token: data.token[inc],
                                    types: data.types[inc]
                                });
                                inc = inc + 1;
                            } while (inc < lengthScript);
                            lengthScript = cherrypick(walk, lengthScript - walk, {});
                        }
                    } else {
                        if (options.correct === false || (tokea !== "++" && tokea !== "--" && tokeb !== "++" && tokeb !== "--")) {
                            return;
                        }
                        next = nextchar(1, false);
                        if ((tokea === "++" || tokea === "--") && (c[a] === ";" || next === ";" || c[a] === "}" || next === "}" || c[a] === ")" || next === ")")) {
                            toke = data.stack[lengthScript];
                            if (toke === "array" || toke === "method" || toke === "object" || toke === "paren" || toke === "notation" || (data.token[data.begin[lengthScript] - 1] === "while" && toke !== "while")) {
                                return;
                            }
                            inc = lengthScript;
                            do {
                                inc = inc - 1;
                                if (data.token[inc] === "return") {
                                    return;
                                }
                                if (data.types[inc] === "end") {
                                    do {
                                        inc = data.begin[inc] - 1;
                                    } while (data.types[inc] === "end" && inc > 0);
                                }
                            } while (
                                inc > 0 && (data.token[inc] === "." || data.types[inc] === "word" || data.types[inc] === "end")
                            );
                            if (data.token[inc] === "," && c[a] !== ";" && next !== ";" && c[a] !== "}" && next !== "}" && c[a] !== ")" && next !== ")") {
                                return;
                            }
                            if (data.types[inc] === "operator") {
                                if (data.stack[inc] === "switch" && data.token[inc] === ":") {
                                    do {
                                        inc = inc - 1;
                                        if (data.types[inc] === "start") {
                                            ind = ind - 1;
                                            if (ind < 0) {
                                                break;
                                            }
                                        } else if (data.types[inc] === "end") {
                                            ind = ind + 1;
                                        }
                                        if (data.token[inc] === "?" && ind === 0) {
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
                            tempstore = recordPop(data, lengthScript);
                            lengthScript = tempstore.length;
                        }
                        walk = lengthScript;
                        if (data.types[walk] === "end") {
                            end();
                        } else if (data.token[walk - 1] === ".") {
                            period();
                        }
                        inc = walk;
                        if (inc < lengthScript) {
                            do {
                                store.push({
                                    attrs: data.attrs[inc],
                                    begin: data.begin[inc],
                                    jscom: data.jscom[inc],
                                    lines: data.lines[inc],
                                    presv: data.presv[inc],
                                    stack: data.stack[inc],
                                    token: data.token[inc],
                                    types: data.types[inc]
                                });
                                inc = inc + 1;
                            } while (inc < lengthScript);
                        }
                    }
                    if (pre === true) {
                        lengthScript = cherrypick(walk - 1, 1, {});
                        ltoke = "=";
                        ltype = "operator";
                        stackPush();
                        applyStore();
                        ltoke = toke;
                        ltype = "operator";
                        stackPush();
                        ltoke = "1";
                        ltype = "literal";
                        stackPush();
                    } else {
                        ltoke = "=";
                        ltype = "operator";
                        stackPush();
                        applyStore();
                        ltoke = toke;
                        ltype = "operator";
                        stackPush();
                        ltoke = "1";
                        ltype = "literal";
                        stackPush();
                    }
                    ltoke = data.token[lengthScript];
                    ltype = data.types[lengthScript];
                    if (next === "}" && c[a] !== ";") {
                        asi(false);
                    }
                },
                //converts "+=" and "-=" to "x = x + 1"
                plusequal      = function parser_script_plusequal(op) {
                    var toke       = op.charAt(0),
                        walk       = lengthScript,
                        inc        = 0,
                        store      = [],
                        end        = function parser_script_plusequal_endInit() {
                            return;
                        },
                        period     = function parser_script_plusequal_periodInit() {
                            return;
                        },
                        applyStore = function parser_script_plusplus_applyStore() {
                            var x = 0,
                                y = store.length;
                            do {
                                lengthScript = recordPush(data, store[x], lengthScript);
                                x = x + 1;
                            } while (x < y);
                        };
                    end    = function parser_script_plusequal_end() {
                        walk = data.begin[walk] - 1;
                        if (data.types[walk] === "end") {
                            parser_script_plusequal_end();
                        } else if (data.token[walk - 1] === ".") {
                            period();
                        }
                    };
                    period = function parser_script_plusequal_period() {
                        walk = walk - 2;
                        if (data.types[walk] === "end") {
                            end();
                        } else if (data.token[walk - 1] === ".") {
                            parser_script_plusequal_period();
                        }
                    };
                    if (data.types[walk] === "end") {
                        end();
                    } else if (data.token[walk - 1] === ".") {
                        period();
                    }
                    inc = walk;
                    if (inc < lengthScript) {
                        do {
                            store.push({
                                attrs: data.attrs[inc],
                                begin: data.begin[inc],
                                jscom: data.jscom[inc],
                                lines: data.lines[inc],
                                presv: data.presv[inc],
                                stack: data.stack[inc],
                                token: data.token[inc],
                                types: data.types[inc]
                            });
                            inc = inc + 1;
                        } while (inc < lengthScript);
                    }
                    ltoke = "=";
                    ltype = "operator";
                    stackPush();
                    applyStore();
                    return toke;
                },
                //fixes asi location if inserted after an inserted brace
                asibrace       = function parser_script_asibrace() {
                    var aa = lengthScript;
                    do {
                        aa = aa - 1;
                    } while (aa > -1 && data.token[aa] === "x}");
                    if (data.stack[aa] === "else") {
                        return stackPush();
                    }
                    aa = aa + 1;
                    cherrypick(aa, 0, {
                        attrs: {},
                        begin: data.begin[aa],
                        jscom: false,
                        lines: linesScript,
                        presv: false,
                        stack: data.stack[aa],
                        token: ltoke,
                        types: ltype
                    });
                    stackPush();
                },
                //convert double quotes to single or the opposite
                quoteConvert   = function parser_script_quoteConvert(item) {
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
                // the generic function is a generic tokenizer start argument contains the
                // token's starting syntax offset argument is length of start minus control
                // chars end is how is to identify where the token ends
                generic        = function parser_script_genericBuilder(starting, ending) {
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
                        tempstore = recordPop(data, lengthScript);
                        lengthScript = tempstore.length;
                        if (data.token[0] === "{") {
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
                    ee = base;
                    if (ee < jj) {
                        do {
                            if (ee > a + 1) {
                                if (c[ee] === "<" && c[ee + 1] === "?" && c[ee + 2] === "p" && c[ee + 3] === "h" && c[ee + 4] === "p" && c[ee + 5] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(parser_script_genericBuilder("<?php", "?>"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "<" && c[ee + 1] === "%" && c[ee + 2] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(parser_script_genericBuilder("<%", "%>"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "{" && c[ee + 1] === "%" && c[ee + 2] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(parser_script_genericBuilder("{%", "%}"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "{" && c[ee + 1] === "{" && c[ee + 2] === "{" && c[ee + 3] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(parser_script_genericBuilder("{{{", "}}}"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "{" && c[ee + 1] === "{" && c[ee + 2] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(parser_script_genericBuilder("{{", "}}"));
                                    ee = ee + build[build.length - 1].length - 1;
                                } else if (c[ee] === "<" && c[ee + 1] === "!" && c[ee + 2] === "-" && c[ee + 3] === "-" && c[ee + 4] === "#" && c[ee + 5] !== starting && starting !== "//" && starting !== "/*") {
                                    a = ee;
                                    build.push(parser_script_genericBuilder("<!--#", "-->"));
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
                            ee = ee + 1;
                        } while (ee < jj);
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
                        ee    = build.length - 1;
                        if (ee > -1) {
                            do {
                                build[ee] = build[ee].replace(/(\s+)$/, "");
                                ee        = ee - 1;
                            } while (ee > -1);
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
                regex          = function parser_script_regex() {
                    var ee     = a + 1,
                        f      = b,
                        h      = 0,
                        i      = 0,
                        build  = ["/"],
                        output = "",
                        square = false;
                    if (ee < f) {
                        do {
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
                                    h = ee - 1;
                                    if (h > 0) {
                                        do {
                                            if (c[h] === "\\") {
                                                i = i + 1;
                                            } else {
                                                break;
                                            }
                                            h = h - 1;
                                        } while (h > 0);
                                    }
                                    if (i % 2 === 0) {
                                        break;
                                    }
                                } else {
                                    break;
                                }
                            }
                            ee = ee + 1;
                        } while (ee < f);
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
                operator       = function parser_script_operator() {
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
                    if (c[a] === "/" && (lengthScript > -1 && (ltype !== "word" || ltoke === "typeof" || ltoke === "return" || ltoke === "else") && ltype !== "literal" && ltype !== "end")) {
                        if (ltoke === "return" || ltoke === "typeof" || ltoke === "else" || ltype !== "word") {
                            ltoke = regex();
                            ltype = "regex";
                        } else {
                            ltoke = "/";
                            ltype = "operator";
                        }
                        stackPush();
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
                            g = a + 1;
                            if (g < jj) {
                                do {
                                    if ((c[g] === "+" && c[g + 1] === "+") || (c[g] === "-" && c[g + 1] === "-")) {
                                        break;
                                    }
                                    h = 0;
                                    if (h < synlen) {
                                        do {
                                            if (c[g] === syntax[h]) {
                                                build.push(syntax[h]);
                                                break;
                                            }
                                            h = h + 1;
                                        } while (h < synlen);
                                    }
                                    if (h === synlen) {
                                        break;
                                    }
                                    g = g + 1;
                                } while (g < jj);
                            }
                            output = build.join("");
                        }
                    }
                    a = a + (output.length - 1);
                    if (output === "=>" && ltoke === ")") {
                        g  = lengthScript;
                        jj = data.begin[g];
                        do {
                            if (data.begin[g] === jj) {
                                data.stack[g] = "method";
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
                tempstring     = function parser_script_tempstring() {
                    var output = [c[a]];
                    a = a + 1;
                    if (a < b) {
                        do {
                            output.push(c[a]);
                            if (c[a] === "`" && (c[a - 1] !== "\\" || slashes(a - 1) === false)) {
                                templateString.pop();
                                break;
                            }
                            if (c[a - 1] === "$" && c[a] === "{" && (c[a - 2] !== "\\" || slashes(a - 2) === false)) {
                                templateString[templateString.length - 1] = true;
                                break;
                            }
                            a = a + 1;
                        } while (a < b);
                    }
                    return output.join("");
                },
                //a tokenizer for numbers
                numb           = function parser_script_number() {
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
                    ee = a + 1;
                    if (ee < f) {
                        do {
                            if ((/[0-9]/).test(c[ee]) || (c[ee] === "." && dot === false)) {
                                build.push(c[ee]);
                                if (c[ee] === ".") {
                                    dot = true;
                                }
                            } else {
                                break;
                            }
                            ee = ee + 1;
                        } while (ee < f);
                    }
                    if (ee < f - 1 && ((/\d/).test(c[ee - 1]) === true || ((/\d/).test(c[ee - 2]) === true && (c[ee - 1] === "-" || c[ee - 1] === "+"))) && (c[ee] === "e" || c[ee] === "E")) {
                        build.push(c[ee]);
                        if (c[ee + 1] === "-" || c[ee + 1] === "+") {
                            build.push(c[ee + 1]);
                            ee = ee + 1;
                        }
                        dot = false;
                        ee  = ee + 1;
                        if (ee < f) {
                            do {
                                if ((/[0-9]/).test(c[ee]) || (c[ee] === "." && dot === false)) {
                                    build.push(c[ee]);
                                    if (c[ee] === ".") {
                                        dot = true;
                                    }
                                } else {
                                    break;
                                }
                                ee = ee + 1;
                            } while (ee < f);
                        }
                    }
                    a = ee - 1;
                    return build.join("");
                },
                // A space lexer.  This counts white space characters and determines if there
                // are empty lines to be preserved
                space          = function parser_script_space() {
                    var localend  = b,
                        f         = a,
                        asitest   = false;
                    linesScript = 0;
                    if (f < localend) {
                        do {
                            if (c[f] === "\n") {
                                asitest = true;
                                linesScript = linesScript + 1;
                            } else if ((/\s/).test(c[f]) === false) {
                                break;
                            }
                            f = f + 1;
                        } while (f < localend);
                    }
                    a = f - 1;
                    if (lengthScript < 0) {
                        return;
                    }
                    if (asitest === true && ltoke !== ";" && lengthb < lengthScript && c[a + 1] !== "}") {
                        asi(false);
                        lengthb = lengthScript;
                    }
                }, // Identifies blocks of markup embedded within JavaScript for language supersets
                // like React JSX.
                markup         = function parser_script_markup() {
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
                    d = lengthScript;
                    if (data.types[d] === "comment" || data.types[d] === "comment-inline") {
                        do {
                            d = d - 1;
                        } while (d > 0 && (data.types[d] === "comment" || data.types[d] === "comment-inline"));
                    }
                    if (c[a] === "<" && c[a + 1] === ">") {
                        a     = a + 1;
                        ltype = "generic";
                        return "<>";
                    }
                    if ((c[a] !== "<" && syntaxnum.indexOf(c[a + 1]) > -1) || data.token[d] === "++" || data.token[d] === "--" || (/\s/).test(c[a + 1]) === true || ((/\d/).test(c[a + 1]) === true && (ltype === "operator" || ltype === "literal" || (ltype === "word" && ltoke !== "return")))) {
                        ltype = "operator";
                        return operator();
                    }
                    if (options.lang !== "typesscript" && (data.token[d] === "return" || data.types[d] === "operator" || data.types[d] === "start" || data.types[d] === "separator" || (data.token[d] === "}" && stacklist[stacklist.length - 1][0] === "global"))) {
                        ltype        = "markup";
                        options.lang = "jsx";
                    } else if (options.lang === "typescript" || data.token[lengthScript] === "#include" || (((/\s/).test(c[a - 1]) === false || ltoke === "public" || ltoke === "private" || ltoke === "static" || ltoke === "final" || ltoke === "implements" || ltoke === "class" || ltoke === "void" || ltoke === "Promise") && syntaxnum.indexOf(c[a + 1]) < 0)) {
                        //Java type generics
                        return (function parser_script_markup_generic() {
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
                            d = a + 2;
                            if (d < b) {
                                do {
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
                                    d = d + 1;
                                } while (d < b);
                            }
                        }());
                    } else {
                        ltype = "operator";
                        return operator();
                    }
                    do {
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
                        a = a + 1;
                    } while (a < b);
                    ltype = "markup";
                    return output.join("");
                },
                //operations for end types: ), ], }
                end            = function parser_script_end(x) {
                    var insert   = false,
                        next     = nextchar(1, false),
                        newarray = function parser_script_end_newarray() {
                            var aa       = data.begin[lengthScript],
                                bb       = 0,
                                cc       = 0,
                                ar       = (data.token[data.begin[lengthScript] - 1] === "Array"),
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
                            tempstore = recordPop(data, lengthScript);
                            lengthScript = tempstore.length;
                            if (ar === true && data.token[lengthScript - 1] === "(" && data.types[lengthScript] === "literal" && data.token[lengthScript].charAt(0) !== "\"" && data.token[lengthScript].charAt(0) !== "'") {
                                arraylen = data.token[data.begin[lengthScript]] - 1;
                                tempstore = recordPop(data, lengthScript);
                                lengthScript = tempstore.length;
                                tempstore = recordPop(data, lengthScript);
                                lengthScript = tempstore.length;
                                tempstore = recordPop(data, lengthScript);
                                lengthScript = tempstore.length;
                                data.token[lengthScript] = "[";
                                data.types[lengthScript] = "start";
                                data.lines[lengthScript] = 0;
                                data.stack[lengthScript] = "array";
                                data.begin[lengthScript] = lengthScript;
                                stacklist[stacklist.length - 1]   = [
                                    "array", lengthScript
                                ];
                                ltoke = ",";
                                ltype = "separator";
                                do {
                                    stackPush();
                                    arraylen = arraylen - 1;
                                } while (arraylen > 0);
                            } else {
                                data.token[aa] = startar;
                                data.types[aa] = "start";
                                cc        = data.begin[aa];
                                cherrypick(aa - 2, 2);
                                stacklist[stacklist.length - 1] = [
                                    namear, aa - 2
                                ];
                                pstack                          = [namear, aa];
                                bb                              = lengthScript;
                                do {
                                    if (data.begin[bb] === cc) {
                                        data.stack[bb] = namear;
                                        data.begin[bb] = data.begin[bb] - 2;
                                    }
                                    bb = bb - 1;
                                } while (bb > aa - 3);
                            }
                            ltoke = endar;
                            ltype = "end";
                            stackPush();
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
                        if (x === "}" && ((options.varword === "list" && vart.count[vart.len] === 0) || (data.token[lengthScript] === "x;" && options.varword === "each"))) {
                            vartpop();
                        }
                        vart.count[vart.len] = vart.count[vart.len] - 1;
                        if (vart.count[vart.len] < 0) {
                            vartpop();
                        }
                    }
                    if (ltoke === "," && data.stack[lengthScript] !== "initializer" && ((x === "]" && (options.endcomma === "never" || options.endcomma === "multiline" || data.token[lengthScript - 1] === "[")) || x === "}")) {
                        tempstore = recordPop(data, lengthScript);
                        lengthScript = tempstore.length;
                    }
                    if (x === ")" || x === "x)") {
                        ltoke = x;
                        ltype = "end";
                        if (lword.length > 0) {
                            pword = lword[lword.length - 1];
                            if (pword.length > 1 && next !== "{" && (pword[0] === "if" || pword[0] === "for" || (pword[0] === "while" && data.stack[pword[1] - 2] !== undefined && data.stack[pword[1] - 2] !== "do") || pword[0] === "with")) {
                                insert = true;
                            }
                        }
                    } else if (x === "]") {
                        ltoke = "]";
                        ltype = "end";
                        pword = [];
                    } else if (x === "}") {
                        if (ltoke !== "," || options.endcomma === "always") {
                            plusplus();
                        }
                        if (stacklist.length > 0 && stacklist[stacklist.length - 1][0] !== "object") {
                            asi(true);
                        } else if (objsortop === true) {
                            objSort();
                        }
                        if (ltype === "comment" || ltype === "comment-inline") {
                            ltoke   = data.token[lengthScript];
                            ltype   = data.types[lengthScript];
                        }
                        if (options.braceline === true) {
                            data.lines[lengthScript] = 2;
                        }
                        ltoke = "}";
                        ltype = "end";
                        pword = [];
                    }
                    lword.pop();
                    stackPush();
                    if (x === ")" && options.correct === true && (data.token[data.begin[lengthScript] - 1] === "Array" || data.token[data.begin[lengthScript] - 1] === "Object") && data.token[data.begin[lengthScript] - 2] === "new") {
                        newarray();
                    }
                    pstack = stacklist.pop();
                    if (brace[brace.length - 1] === "x{" && x === "}") {
                        blockinsert();
                    }
                    brace.pop();
                    if (brace[brace.length - 1] === "x{" && x === "}" && data.stack[lengthScript] !== "try") {
                        if (next !== ":" && data.token[data.begin[a] - 1] !== "?") {
                            blockinsert();
                        }
                    }
                    if (insert === true) {
                        ltoke = "x{";
                        ltype = "start";
                        stackPush();
                        brace.push("x{");
                        pword[1] = lengthScript;
                        stacklist.push(pword);
                    }
                },
                //determines tag names for {% %} based template tags and returns a type
                tname          = function parser_script_tname(x) {
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
                    en = namelist.length - 1;
                    if (en > -1) {
                        do {
                            if (name === namelist[en]) {
                                return "template_start";
                            }
                            if (name === "end" + namelist[en]) {
                                return "template_end";
                            }
                            en = en - 1;
                        } while (en > -1);
                    }
                    return "template";
                };
            start = function parser_script_start(x) {
                brace.push(x);
                if (wordTest > -1) {
                    word();
                }
                if (vart.len > -1) {
                    vart.count[vart.len] = vart.count[vart.len] + 1;
                }
                if (data.token[lengthScript - 1] === "function") {
                    lword.push(["function", lengthScript + 1]);
                } else {
                    lword.push([ltoke, lengthScript + 1]);
                }
                ltoke = x;
                ltype = "start";
                if (x === "(" || x === "x(") {
                    asifix();
                } else if (x === "{") {
                    if (paren > -1) {
                        if (data.begin[paren - 1] === data.begin[data.begin[lengthScript] - 1] || data.token[data.begin[lengthScript]] === "x(") {
                            paren = -1;
                            end("x)");
                            asifix();
                            ltoke = "{";
                            ltype = "start";
                        }
                    } else if (ltoke === ")") {
                        asifix();
                    }
                    if ((ltype === "comment" || ltype === "comment-inline") && data.token[lengthScript - 1] === ")") {
                        ltoke              = data.token[lengthScript];
                        data.token[lengthScript] = "{";
                        ltype              = data.types[lengthScript];
                        data.types[lengthScript] = "start";
                    }
                }
                if (options.braceline === true && x === "{") {
                    linesScript = 2;
                }
                stackPush();
                if (classy.length > 0) {
                    classy[classy.length - 1] = classy[classy.length - 1] + 1;
                }
                stacklist.push([
                    data.stack[lengthScript],
                    data.begin[lengthScript]
                ]);
            };
            do {
                if ((/\s/).test(c[a])) {
                    if (wordTest > -1) {
                        word();
                    }
                    space();
                } else if (c[a] === "<" && c[a + 1] === "?" && c[a + 2] === "p" && c[a + 3] === "h" && c[a + 4] === "p") {
                    //php
                    ltoke = generic("<?php", "?>");
                    ltype = "template";
                    stackPush();
                } else if (c[a] === "<" && c[a + 1] === "%") {
                    //asp
                    ltoke = generic("<%", "%>");
                    ltype = "template";
                    stackPush();
                } else if (c[a] === "{" && c[a + 1] === "%") {
                    //twig
                    ltoke = generic("{%", "%}");
                    ltype = tname(ltoke);
                    stackPush();
                } else if (c[a] === "{" && c[a + 1] === "{" && c[a + 2] === "{") {
                    //mustache
                    ltoke = generic("{{{", "}}}");
                    ltype = "template";
                    stackPush();
                } else if (c[a] === "{" && c[a + 1] === "{") {
                    //handlebars
                    ltoke = generic("{{", "}}");
                    ltype = tname(ltoke);
                    stackPush();
                } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-" && c[a + 4] === "#") {
                    //ssi
                    ltoke = generic("<!--#", "-->");
                    ltype = "template";
                    stackPush();
                } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-") {
                    //markup comment
                    ltoke = generic("<!--", "-->");
                    ltype = "comment";
                    stackPush();
                } else if (c[a] === "<") {
                    //markup
                    ltoke = markup();
                    stackPush();
                } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "*")) {
                    //comment block
                    ltoke = generic("/*", "*\/");
                    if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                        sourcemap[0] = lengthScript + 1;
                        sourcemap[1] = ltoke;
                    }
                    if (options.comments !== "nocomment") {
                        ltype = "comment";
                        if (data.token[lengthScript] === "var" || data.token[lengthScript] === "let" || data.token[lengthScript] === "const") {
                            tempstore = recordPop(data, lengthScript);
                            lengthScript = tempstore.length;
                            stackPush();
                            lengthScript = recordPush(data, tempstore, lengthScript);
                            if (data.lines[lengthScript - 2] === 0) {
                                data.lines[lengthScript - 2] = data.lines[lengthScript];
                            }
                            data.lines[lengthScript] = 0;
                        } else {
                            stackPush();
                        }
                    }
                } else if ((lengthScript < 0 || data.lines[lengthScript] > 0) && c[a] === "#" && c[a + 1] === "!" && (c[a + 2] === "/" || c[a + 2] === "[")) {
                    //shebang
                    ltoke = generic("#!" + c[a + 2], "\n");
                    ltoke = ltoke.slice(0, ltoke.length - 1);
                    ltype = "literal";
                    linesScript = 2;
                    stackPush();
                } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "/")) {
                    //comment line
                    asi(false);
                    ltoke = generic("//", "\n");
                    if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                        sourcemap[0] = lengthScript + 1;
                        sourcemap[1] = ltoke;
                    }
                    if (options.comments !== "nocomment") {
                        stackPush();
                    }
                } else if (c[a] === "#" && c[a + 1] === "r" && c[a + 2] === "e" && c[a + 3] === "g" && c[a + 4] === "i" && c[a + 5] === "o" && c[a + 6] === "n" && (/\s/).test(c[a + 7]) === true) {
                    //comment line
                    asi(false);
                    ltoke = generic("#region", "\n");
                    ltype = "comment";
                    stackPush();
                } else if (c[a] === "#" && c[a + 1] === "e" && c[a + 2] === "n" && c[a + 3] === "d" && c[a + 4] === "r" && c[a + 5] === "e" && c[a + 6] === "g" && c[a + 7] === "i" && c[a + 8] === "o" && c[a + 9] === "n") {
                    //comment line
                    asi(false);
                    ltoke = generic("#endregion", "\n");
                    ltype = "comment";
                    stackPush();
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
                    stackPush();
                } else if (c[a] === "\"" || c[a] === "'") {
                    //string
                    ltoke = generic(c[a], c[a]);
                    ltype = "literal";
                    if ((ltoke.charAt(0) === "\"" && options.quoteConvert === "single") || (ltoke.charAt(0) === "'" && options.quoteConvert === "double")) {
                        ltoke = quoteConvert(ltoke);
                    }
                    stackPush();
                } else if (c[a] === "-" && (a < b - 1 && c[a + 1] !== "=" && c[a + 1] !== "-") && (ltype === "literal" || ltype === "word") && ltoke !== "return" && (ltoke === ")" || ltoke === "]" || ltype === "word" || ltype === "literal")) {
                    //subtraction
                    if (wordTest > -1) {
                        word();
                    }
                    ltoke = "-";
                    ltype = "operator";
                    stackPush();
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
                    stackPush();
                } else if (c[a] === ":" && c[a + 1] === ":") {
                    if (wordTest > -1) {
                        word();
                    }
                    plusplus();
                    asifix();
                    a     = a + 1;
                    ltoke = "::";
                    ltype = "separator";
                    stackPush();
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
                        stackPush();
                        ltoke = vart.word[vart.len];
                        ltype = "word";
                        stackPush();
                        vart.index[vart.len] = lengthScript;
                    } else {
                        ltoke = ",";
                        ltype = "separator";
                        asifix();
                        stackPush();
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
                        linesScript = 1;
                    }
                    stackPush();
                } else if (c[a] === ";") {
                    //semicolon
                    if (wordTest > -1) {
                        word();
                    }
                    if (options.lang === "qml") {
                        ltoke = "x;";
                        ltype = "separator";
                        stackPush();
                    } else {
                        if (classy[classy.length - 1] === 0) {
                            classy.pop();
                        }
                        if (vart.len > -1 && vart.count[vart.len] === 0) {
                            if (options.varword === "each") {
                                vartpop();
                            } else {
                                vart.index[vart.len] = lengthScript + 1;
                            }
                        }
                        plusplus();
                        ltoke = ";";
                        ltype = "separator";
                        if (data.token[lengthScript] === "x}") {
                            asibrace();
                        } else {
                            stackPush();
                        }
                    }
                    if (brace[brace.length - 1] === "x{" && nextchar(1, false) !== "}") {
                        blockinsert();
                    }
                } else if (c[a] === "(" || c[a] === "[" || c[a] === "{") {
                    start(c[a]);
                } else if (c[a] === ")" || c[a] === "]" || c[a] === "}") {
                    end(c[a]);
                } else if (c[a] === "*" && data.stack[lengthScript] === "object" && wordTest < 0 && (/\s/).test(c[a + 1]) === false && c[a + 1] !== "=" && (/\d/).test(c[a + 1]) === false) {
                    wordTest = a;
                } else if (c[a] === "=" || c[a] === "&" || c[a] === "<" || c[a] === ">" || c[a] === "+" || c[a] === "-" || c[a] === "*" || c[a] === "/" || c[a] === "!" || c[a] === "?" || c[a] === "|" || c[a] === "^" || c[a] === ":" || c[a] === "%" || c[a] === "~") {
                    //operator
                    ltoke = operator();
                    if (ltoke === "regex") {
                        ltoke = data.token[lengthScript];
                    } else {
                        ltype = "operator";
                        if (ltoke !== "!" && ltoke !== "++" && ltoke !== "--") {
                            asifix();
                        }
                        stackPush();
                    }
                } else if (wordTest < 0 && c[a] !== "") {
                    wordTest = a;
                }
                if (vart.len > -1 && lengthScript === vart.index[vart.len] + 1 && data.token[vart.index[vart.len]] === ";" && ltoke !== vart.word[vart.len] && ltype !== "comment" && ltype !== "comment-inline" && options.varword === "list") {
                    vartpop();
                }
                a = a + 1;
            } while (a < b);
            if (options.lang !== "jsx" && ((data.token[lengthScript] !== "}" && data.token[0] === "{") || data.token[0] !== "{") && ((data.token[lengthScript] !== "]" && data.token[0] === "[") || data.token[0] !== "[")) {
                asi(false);
            }
            if (sourcemap[0] === lengthScript) {
                ltoke = "\n" + sourcemap[1];
                ltype = "literal";
                stackPush();
            }
            if (data.token[lengthScript] === "x;" && (data.token[lengthScript - 1] === "}" || data.token[lengthScript - 1] === "]") && data.begin[lengthScript - 1] === 0) {
                tempstore = recordPop(data, lengthScript);
                lengthScript = tempstore.length;
            }

            if (options.correct === true) {
                (function parser_script_correct() {
                    var aa = 0,
                        bb = lengthScript + 1;
                    do {
                        if (data.token[aa] === "x;") {
                            data.token[aa] = ";";
                            scolon   = scolon + 1;
                        } else if (data.token[aa] === "x{") {
                            data.token[aa] = "{";
                        } else if (data.token[aa] === "x}") {
                            data.token[aa] = "}";
                        } else if (data.token[aa] === "x(") {
                            data.token[aa] = "(";
                        } else if (data.token[aa] === "x)") {
                            data.token[aa] = ")";
                        }
                        aa = aa + 1;
                    } while (aa < bb);
                }());
            }

            return data;
        };
        lexer.style  = function parser_style(source) {
            var data       = {
                    attrs: [],
                    begin: [],
                    jscom: [],
                    lines: [],
                    presv: [],
                    stack: [],
                    token: [],
                    types: []
                },
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
                        var x          = val.split(""),
                            leng       = x.length,
                            cc         = 0,
                            dd         = 0,
                            items      = [],
                            block      = "",
                            values     = [],
                            qchar      = "",
                            qreg       = {},
                            transition = (token[token.length - 3] === "transition"),
                            colorPush  = function parser_style_tokenize_item_value_colorPush(value) {
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
                        if (cc < leng) {
                            do {
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
                                cc = cc + 1;
                            } while (cc < leng);
                        }
                        values.push(colorPush(items.join("")));
                        leng = values.length;
                        //This is where the rules mentioned above are applied
                        cc   = 0;
                        if (cc < leng) {
                            do {
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
                                cc = cc + 1;
                            } while (cc < leng);
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
                        } else if (slen === 0 && data.types[data.types.length - 1] === "comment" && data.types[data.types.length - 2] !== "comment") {
                            data.types[data.types.length - 1] = "comment-inline";
                        }
                        if (slen > 1 && end === true && options.preserve > 0) {
                            space = "";
                            return val;
                        }
                        space = "";
                        return val;
                    },
                    //sort parsed properties intelligently
                    /*objSort    = function parser_style_tokenize_objSort() {
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
                    },*/
                    //the generic token builder
                    buildtoken = function parser_style_tokenize_build() {
                        var aa         = a,
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
                        if (aa < len) {
                            do {
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
                                aa = aa + 1;
                            } while (aa < len);
                        }
                        a = aa;
                        if (structval === "map" && out[0] === "(") {
                            mapper[mapper.length - 1] = mapper[mapper.length - 1] - 1;
                        }
                        if (comma === true && structval !== "map" && data.types[data.types.length - 1] !== "comment" && data.types[data.types.length - 1] !== "comment-inline") {
                            data.token[data.token.length - 1] = data.token[data.token.length - 1] + out
                                .join(
                                    ""
                                )
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
                        } else if ("\"'".indexOf(data.token[data.token.length - 1].charAt(0)) > -1 && data.types[data.types.length - 1] === "propvar") {
                            ltype = "item";
                            types.push("value");
                        } else if (out[0] === "@" || out[0] === "$") {
                            if (data.types[data.types.length - 1] === "colon" && (data.types[data.types.length - 2] === "property" || data.types[data.types.length - 2] === "propvar")) {
                                ltype = "value";
                                types.push("value");
                            } else {
                                ltype = "propvar";
                                types.push("propvar");
                                outy = data.token[data.token.length - 1];
                                aa   = outy.indexOf("(");
                                if (outy.charAt(outy.length - 1) === ")" && aa > 0) {
                                    outy                              = outy.slice(aa + 1, outy.length - 1);
                                    data.token[data.token.length - 1] = data
                                        .token[data.token.length - 1]
                                        .slice(0, aa + 1) + value(outy, false) + ")";
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
                                    if (y < slen) {
                                        do {
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
                                            y = y + 1;
                                        } while (y < slen);
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
                                token[aa] = token[aa].replace(/\s*!\s+important/, " !important");
                                if (options.quoteConvert !== "none" && (data.token[aa - 2] === "font" || data.token[aa - 2] === "font-family")) {
                                    data.token[aa] = value(data.token[aa], true);
                                } else {
                                    data.token[aa] = value(data.token[aa], false);
                                }
                                //take comments out until the 'item' is found and then put the comments back
                                if (data.token[data.token.length - 2] === "{") {
                                    data.types[data.types.length - 1] = "propvar";
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
                                        token.push(";");
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
                                        token.push(";");
                                        stack.push(structval);
                                        begin.push(struct[struct.length - 1]);
                                        types.push("semi");
                                        lines.push(spacer(false));
                                    }
                                }
                            } else if (type === "semi") {
                                if (types[aa - 1] === "colon") {
                                    types[aa] = "value";
                                    ltype     = "value";
                                    token[aa] = token[aa].replace(/\s*!\s+important/, " !important");
                                    if (options.quoteConvert !== "none" && (token[aa - 2] === "font" || token[aa - 2] === "font-family")) {
                                        token[aa] = value(token[aa], true);
                                    } else {
                                        token[aa] = value(token[aa], false);
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
                                var endtype = data.types[data.types.length - 2];
                                if (ltype === "item") {
                                    if (endtype === "colon") {
                                        data.types[data.types.length - 1] = "value";
                                    } else {
                                        item(endtype);
                                    }
                                }
                                types.push(typename);
                            };
                        nosort[nosort.length - 1] = true;
                        if (a < len) {
                            do {
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
                                            if (ltype === "item" && data.types[data.types.length - 2] === "colon" && (data.types[data.types.length - 3] === "property" || data.types[data.types.length - 3] === "propvar")) {
                                                ltype                             = "value";
                                                data.types[data.types.length - 1] = "value";
                                                if (isNaN(data.token[data.token.length - 1]) === true && data.token[data.token.length - 1].charAt(data.token[data.token.length - 1].length - 1) !== ")") {
                                                    data.token[data.token.length - 1] = data.token[data.token.length - 1] +
                                                            quote;
                                                } else {
                                                    data.token[data.token.length - 1] = data.token[data.token.length - 1] + " " +
                                                            quote;
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
                                                endlen = store.length - 1;
                                                if (endlen > -1) {
                                                    do {
                                                        if (name === store[endlen]) {
                                                            return exit("external_start");
                                                        }
                                                        if (name === "end" + store[endlen]) {
                                                            return exit("external_end");
                                                        }
                                                        endlen = endlen - 1;
                                                    } while (endlen > -1);
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
                                a = a + 1;
                            } while (a < len);
                        }
                    },
                    //finds comments include those JS looking '//' comments
                    comment    = function parser_style_tokenize_comment(inline) {
                        var aa        = a + 1,
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
                        if (aa < len) {
                            do {
                                out.push(b[aa]);
                                if ((inline === false && b[aa - 1] === "*" && b[aa] === "/") || (inline === true && (b[aa + 1] === "\n" || b[aa + 1] === "\r"))) {
                                    break;
                                }
                                aa = aa + 1;
                            } while (aa < len);
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
                        if (token.length > 0 && (ltype === "selector" || ltype === "propvar") && data.types[data.types.length - 1] !== "comment" && data.types[data.types.length - 1] !== "comment-inline") {
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
                                types.length > 1 && data.types[data.types.length - 1] !== "semi" && data.types[data.types.length - 1] !== "start"
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
                    },
                    //do fancy things to property types like: sorting, consolidating, and padding
                    properties = function parser_style_tokenize_properties() {
                        var aa    = token.length - 1,
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
                        do {
                            if (types[aa] === "start") {
                                bb = bb - 1;
                                if (bb === 0) {
                                    next = aa;
                                    set.pop();
                                    aa = set.length - 1;
                                    if (aa > -1) {
                                        do {
                                            set[aa].reverse();
                                            aa = aa - 1;
                                        } while (aa > -1);
                                    }
                                    break;
                                }
                            }
                            if (types[aa] === "end") {
                                bb = bb + 1;
                            }
                            if (bb === 1 && (types[aa] === "property" || (types[aa] === "propvar" && types[aa + 1] === "colon"))) {
                                p.push(aa);
                            }
                            set[set.length - 1].push(aa);
                            if (bb === 1 && (types[aa - 1] === "comment" || types[aa - 1] === "comment-inline" || types[aa - 1] === "semi" || types[aa - 1] === "end" || types[aa - 1] === "start") && types[aa] !== "start" && types[aa] !== "end") {
                                set.push([]);
                            }
                            aa = aa - 1;
                        } while (aa > -1);
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
                                        store    = function parser_style_tokenize_properties_propcheck_fourcount_store(
                                            side
                                        ) {
                                            yy         = yy + 1;
                                            val[side]  = token[set[aa][2]];
                                            test[side] = true;
                                            if (start < 0) {
                                                start = aa;
                                            }
                                        };
                                    if (aa < leng) {
                                        do {
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
                                                    if (verticalop === true) {
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
                                            aa = aa + 1;
                                        } while (aa < leng);
                                    }
                                };
                            aa = 0;
                            if (aa < leng) {
                                do {
                                    if (types[set[aa][0]] === "property") {
                                        if (token[set[aa][0]].indexOf("margin") === 0) {
                                            fourcount("margin");
                                        }
                                        if (token[set[aa][0]].indexOf("padding") === 0) {
                                            fourcount("padding");
                                        }
                                    }
                                    aa = aa + 1;
                                } while (aa < leng);
                            }
                        }());

                        //pad out those property names so that the colons are vertically aligned
                        if (verticalop === true) {
                            bb = 0;
                            aa = p.length - 1;
                            if (aa > -1) {
                                do {
                                    if (token[p[aa]].length > bb && token[p[aa]] !== "filter" && token[p[aa]] !== "progid") {
                                        bb = token[p[aa]].length;
                                    }
                                    aa = aa - 1;
                                } while (aa > -1);
                            }
                            aa = p.length - 1;
                            if (aa > -1) {
                                do {
                                    cc = bb - token[p[aa]].length;
                                    if (cc > 0 && token[p[aa]] !== "filter" && token[p[aa]] !== "progid") {
                                        do {
                                            token[p[aa]] = token[p[aa]] + " ";
                                            cc           = cc - 1;
                                        } while (cc > 0);
                                    }
                                    aa = aa - 1;
                                } while (aa > -1);
                            }
                            if (endtest === false) {
                                return;
                            }
                        }

                        bb = set.length;
                        aa = 0;
                        if (aa < bb) {
                            do {
                                dd = set[aa].length;
                                cc = 0;
                                if (cc < dd) {
                                    do {
                                        stoke.push(token[set[aa][cc]]);
                                        stype.push(types[set[aa][cc]]);
                                        sline.push(lines[set[aa][cc]]);
                                        sstak.push(stack[set[aa][cc]]);
                                        sbegn.push(begin[set[aa][cc]]);
                                        cc = cc + 1;
                                    } while (cc < dd);
                                }
                                aa = aa + 1;
                            } while (aa < bb);
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
                do {
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
                    } else if (b[a] === "{" || (b[a] === "(" && data.token[data.token.length - 1] === ":" && data.types[data.types.length - 2] === "propvar")) {
                        if (b[a] === "{" && data.token[data.token.length - 2] === ":") {
                            data.types[data.types.length - 1] = "pseudo";
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
                        if (b[a] === "}" && data.types[data.types.length - 1] === "item" && data.token[data.token.length - 2] === "{" && data.token[data.token.length - 3] !== undefined && data.token[data.token.length - 3].charAt(data.token[data.token.length - 3].length - 1) === "@") {
                            data.token[data.token.length - 3] = data.token[data.token.length - 3] + "{" +
                                    data.token[data.token.length - 1] + "}";
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
                            properties();
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
                        if (data.types[data.types.length - 1] !== "semi" && data.types[data.types.length - 1] !== "start" && esctest(a) === false) {
                            ltype = "semi";
                            types.push("semi");
                            token.push(b[a]);
                            lines.push(spacer(false));
                            stack.push(structval);
                            begin.push(begin[begin.length - 1]);
                        }
                        space = "";
                    } else if (b[a] === ":" && data.types[data.types.length - 1] !== "end") {
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
                    a = a + 1;
                } while (a < len);
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
            };
        };
        return lexer[options.type](options.source);
    };
    if (typeof module === "object" && typeof module.parent === "object") {
        module.exports = parser;
    }
}());