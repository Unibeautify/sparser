(function style_init() {
    "use strict";
    const sparser:sparser = global.sparser,
        style = function lexer_style(source:string):data {
            let a:number = 0,
                ltype:string       = "",
                ltoke:string       = "";
            const parse:parse     = sparser.parse,
                data:data        = parse.data,
                options:any = sparser.options,
                colors:string[]      = [],
                colorNames  = {
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
                b:string[]           = source.split(""),
                len:number         = source.length,
                mapper:number[]      = [],
                nosort:boolean[]      = [],
                recordPush = function lexer_style_recordPush(structure:string):void {
                    const record = {
                        begin: parse.structure[parse.structure.length - 1][1],
                        ender: -1,
                        lexer: "style",
                        lines: parse.linesSpace,
                        stack: parse.structure[parse.structure.length - 1][0],
                        token: ltoke,
                        types: ltype
                    };
                    parse.push(data, record, structure);
                },
                esctest     = function lexer_style_esctest(index:number):boolean {
                    const slashy:number = index;
                    do {
                        index = index - 1;
                    } while (b[index] === "\\" && index > 0);
                    if ((slashy - index) % 2 === 1) {
                        return true;
                    }
                    return false;
                },
                // Since I am already identifying value types this is a good place to do some
                // quick analysis and clean up on certain value conditions. These things are
                // being corrected:
                // * fractional values missing a leading 0 are    provided a leading 0
                // * 0 values with a dimension indicator    (px, em) have the dimension
                // indicator    removed
                // * eliminate unnecessary leading 0s
                // * url values that are not quoted are wrapped    in double quote characters
                // * color values are set to lowercase and    reduced from 6 to 3 digits if
                // appropriate
                value       = function lexer_style_value(val:string):string {
                    const x:string[]          = val.replace(/\s*!important/, " !important").split(""),
                        values:string[]     = [],
                        transition:boolean = (/-?transition$/).test(data.token[parse.count - 2]),
                        colorPush  = function lexer_style_value_colorPush(value:string):string {
                            const vl = value.toLowerCase();
                            if ((/^(#[0-9a-f]{3,6})$/).test(vl) === true) {
                                colors.push(value);
                            } else if ((/^(rgba?\()/).test(vl) === true) {
                                colors.push(value);
                            } else if (colorNames[vl] !== undefined) {
                                colors.push(value);
                            }
                            return value;
                        },
                        valueSpace = function lexer_style_value_valueSpace(find:string) {
                            find = find.replace(/\s*/g, "");
                            if ((/\/\d/).test(find) === true && val.indexOf("url(") === 0) {
                                return find;
                            }
                            return ` ${find.charAt(0)} ${find.charAt(1)}`;
                        },
                        zerofix     = function lexer_style_value_zerofix(find:string):string {
                            if (options.lexer_options.style.no_lead_zero === true) {
                                const scrub = function lexer_style_value_zerofix_scrub(search:string) {
                                    return search.replace(/0+/, "");
                                };
                                return find.replace(/^-?\D0+(\.|\d)/, scrub);
                            }
                            if ((/0*\./).test(find) === true) {
                                return find.replace(/0*\./, "0.");
                            }
                            if ((/0+/).test((/\d+/).exec(find)[0]) === true) {
                                if ((/^\D*0+\D*$/).test(find) === true) {
                                    return find.replace(/0+/, "0");
                                }
                                return find.replace((/\d+/).exec(find)[0], (/\d+/).exec(find)[0].replace(/^0+/, ""));
                            }
                            return find;
                        },
                        commaspace  = function lexer_style_value_commaspace(find:string):string {
                            return find.replace(",", ", ");
                        },
                        diFix = function lexer_style_value_diFix(di:string):string {
                            return `${di} `;
                        },
                        slash = function lexer_style_value_slash():boolean {
                            const start:number = cc - 1;
                            let xx:number = start;
                            if (start < 1) {
                                return true;
                            }
                            do {
                                xx = xx - 1;
                            } while (xx > 0 && x[xx] === "\\");

                            // report true for odd numbers (escaped)
                            if ((start - xx) % 2 === 1) {
                                return true;
                            }
                            return false;
                        },
                        zerodotstart:RegExp    = (/^-?0+\.\d+[a-z]/),
                        dotstart:RegExp        = (/^-?\.\d+[a-z]/),
                        zerodot:RegExp         = (/(\s|\(|,)-?0+\.?\d+([a-z]|\)|,|\s)/g),
                        dot:RegExp             = (/(\s|\(|,)-?\.?\d+([a-z]|\)|,|\s)/g),
                        dimensions:string = "%|cap|ch|cm|deg|dpcm|dpi|dppx|em|ex|fr|grad|Hz|ic|in|kHz|lh|mm|ms|mS|pc|pt|px|Q|rad|rem|rlh|s|turn|vb|vh|vi|vmax|vmin|vw";
                    let cc:number         = 0,
                        dd:number         = 0,
                        block:string      = "",
                        leng:number       = x.length,
                        items:string[]      = [];
                    // this loop identifies containment so that tokens/sub-tokens are correctly
                    // taken
                    if (cc < leng) {
                        do {
                            items.push(x[cc]);
                            if (x[cc - 1] !== "\\" || slash() === false) {
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
                            if (options.lexer_options.style.no_lead_zero === true && zerodotstart.test(values[cc]) === true) {
                                values[cc] = values[cc].replace(/0+\./, ".");
                            } else if ((options.lexer_options.style.no_lead_zero === false || options.lexer_options.style.no_lead_zero === undefined) && dotstart.test(values[cc]) === true) {
                                values[cc] = values[cc].replace(".", "0.");
                            } else if (zerodot.test(values[cc]) === true || dot.test(values[cc]) === true) {
                                values[cc] = values[cc].replace(zerodot, zerofix).replace(dot, zerofix);
                            } else if ((/^(0+([a-z]{2,3}|%))$/).test(values[cc]) === true && transition === false) {
                                values[cc] = "0";
                            } else if ((/^(0+)/).test(values[cc]) === true) {
                                values[cc] = values[cc].replace(/0+/, "0");
                                if ((/\d/).test(values[cc].charAt(1)) === true) {
                                    values[cc] = values[cc].substr(1);
                                }
                            } else if ((/^url\((?!('|"))/).test(values[cc]) === true && values[cc].charAt(values[cc].length - 1) === ")") {
                                block = values[cc].charAt(values[cc].indexOf("url(") + 4);
                                if (block !== "@" && block !== "{" && block !== "<") {
                                    if (options.lexer_options.style.quote_convert === "double") {
                                        values[cc] = values[cc]
                                            .replace(/url\(/, "url(\"")
                                            .replace(/\)$/, "\")");
                                    } else {
                                        values[cc] = values[cc]
                                            .replace(/url\(/, "url('")
                                            .replace(/\)$/, "')");
                                    }
                                }
                            }
                            if ((/^(\+|-)?\d+(\.\d+)?(e-?\d+)?\D+$/).test(values[cc]) === true) {
                                if (dimensions.indexOf(values[cc].replace(/(\+|-)?\d+(\.\d+)?(e-?\d+)?/, "")) < 0) {
                                    values[cc] = values[cc].replace(/(\+|-)?\d+(\.\d+)?(e-?\d+)?/, diFix);
                                }
                            }
                            if (
                                (/^\w+\(/).test(values[cc]) === true &&
                                values[cc].charAt(values[cc].length - 1) === ")" &&
                                (values[cc].indexOf("url(") !== 0 || (values[cc].indexOf("url(") === 0 && values[cc].indexOf(" ") > 0))
                            ) {
                                values[cc] = values[cc].replace(/,\S/g, commaspace);
                            }
                            cc = cc + 1;
                        } while (cc < leng);
                    }
                    block = values.join(" ");
                    return block.charAt(0) + block.slice(1)
                        .replace(/\s*(\/|\+|\*)\s*(\d|\$)/, valueSpace);
                },
                //the generic token builder
                buildtoken  = function lexer_style_build():void {
                    let aa:number         = a,
                        bb:number         = 0,
                        out:string[]        = [],
                        outy:string       = "",
                        funk:boolean      = null,
                        mappy:number      = 0;
                    const block:string[]      = [],
                        qc:"none"|"double"|"single" = (options.lexer_options.style.quote_convert === undefined)
                            ? "none"
                            : options.lexer_options.style.quote_convert,
                        spacestart = function lexer_style_build_spacestart():void {
                            out.push(b[aa]);
                            if ((/\s/).test(b[aa + 1]) === true) {
                                do {
                                    aa = aa + 1;
                                } while (aa < len && (/\s/).test(b[aa + 1]) === true);
                            }
                        };
                    if (aa < len) {
                        //this loop accounts for grouping mechanisms
                        do {
                            if (b[aa] === "\"" || b[aa] === "'") {
                                if (funk === null) {
                                    funk = false;
                                }
                                if (block[block.length - 1] === b[aa] && (b[aa - 1] !== "\\" || esctest(aa - 1) === false)) {
                                    block.pop();
                                    if (qc === "double") {
                                        b[aa] = "\"";
                                    } else if (qc === "single") {
                                        b[aa] = "'";
                                    }
                                } else if (block[block.length - 1] !== "\"" && block[block.length - 1] !== "'" && (b[aa - 1] !== "\\" || esctest(aa - 1) === false)) {
                                    block.push(b[aa]);
                                    if (qc === "double") {
                                        b[aa] = "\"";
                                    } else if (qc === "single") {
                                        b[aa] = "'";
                                    }
                                } else if (b[aa - 1] === "\\" && qc !== "none") {
                                    if (esctest(aa - 1) === true) {
                                        if (qc === "double" && b[aa] === "'") {
                                            out.pop();
                                        } else if (qc === "single" && b[aa] === "\"") {
                                            out.pop();
                                        }
                                    }
                                } else if (qc === "double" && b[aa] === "\"") {
                                    b[aa] = "\\\"";
                                } else if (qc === "single" && b[aa] === "'") {
                                    b[aa] = "\\'";
                                }
                                out.push(b[aa]);
                            } else if (b[aa - 1] !== "\\" || esctest(aa - 1) === false) {
                                if (b[aa] === "(") {
                                    if (funk === null) {
                                        funk = true;
                                    }
                                    mappy = mappy + 1;
                                    block.push(")");
                                    spacestart();
                                } else if (b[aa] === "[") {
                                    funk = false;
                                    block.push("]");
                                    spacestart();
                                } else if ((b[aa] === "#" || b[aa] === "@") && b[aa + 1] === "{") {
                                    funk = false;
                                    out.push(b[aa]);
                                    aa = aa + 1;
                                    block.push("}");
                                    spacestart();
                                } else if (b[aa] === block[block.length - 1]) {
                                    out.push(b[aa]);
                                    block.pop();
                                } else {
                                    out.push(b[aa]);
                                }
                            } else {
                                out.push(b[aa]);
                            }
                            if (parse.structure[parse.structure.length - 1][0] === "map" && block.length === 0 && (
                                b[aa + 1] === "," || b[aa + 1] === ")"
                            )) {
                                if (b[aa + 1] === ")" && data.token[parse.count] === "(") {
                                    parse.pop(data);
                                    parse.structure.pop();
                                    out.splice(0, 0, "(");
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
                            if (block.length === 0) {
                                if (
                                    (b[aa + 1] === ";" && esctest(aa + 1) === true) ||
                                    (
                                        b[aa + 1] === ":" &&
                                        b[aa] !== ":" &&
                                        b[aa + 2] !== ":" &&
                                        outy !== "filter" &&
                                        outy !== "progid"
                                    ) ||
                                    b[aa + 1] === "}" ||
                                    b[aa + 1] === "{" ||
                                    (b[aa + 1] === "/" && (b[aa + 2] === "*" || b[aa + 2] === "/"))
                                ) {
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
                                if (b[aa + 1] === ",") {
                                    break;
                                }
                            }
                            aa = aa + 1;
                        } while (aa < len);
                    }
                    a = aa;
                    if (parse.structure[parse.structure.length - 1][0] === "map" && out[0] === "(") {
                        mapper[mapper.length - 1] = mapper[mapper.length - 1] - 1;
                    }
                    ltoke = out
                        .join("")
                        .replace(/\s+/g, " ")
                        .replace(/^\s/, "")
                        .replace(/\s$/, "");
                    if (funk === true) {
                        ltoke = ltoke.replace(/\s+\(/g, "(").replace(/\s+\)/g, ")").replace(/,\(/g, ", (");
                    }
                    if (parse.count > -1 && data.token[parse.count].indexOf("extend(") === 0) {
                        ltype = "pseudo";
                    } else if (
                        funk === true &&
                        (/\d/).test(ltoke.charAt(0)) === false &&
                        (/^rgba?\(/).test(ltoke) === false &&
                        ltoke.indexOf("url(") !== 0 &&
                        (ltoke.indexOf(" ") < 0 || ltoke.indexOf(" ") > ltoke.indexOf("(")) &&
                        ltoke.charAt(ltoke.length - 1) === ")"
                    ) {
                        if (data.token[parse.count] === ":") {
                            ltype = "value";
                        } else {
                            ltoke = ltoke.replace(/,\u0020?/g, ", ");
                            ltype = "function";
                        }
                        ltoke = value(ltoke);
                    } else if (parse.count > -1 && "\"'".indexOf(data.token[parse.count].charAt(0)) > -1 && data.types[parse.count] === "variable") {
                        ltype = "item";
                    } else if (out[0] === "@" || out[0] === "$") {
                        if (data.types[parse.count] === "colon" && options.language === "css" && (data.types[parse.count - 1] === "property" || data.types[parse.count - 1] === "variable")) {
                            ltype = "value";
                        } else if (parse.count > -1) {
                            ltype = "item";
                            outy  = data.token[parse.count];
                            aa    = outy.indexOf("(");
                            if (outy.charAt(outy.length - 1) === ")" && aa > 0) {
                                outy                    = outy.slice(aa + 1, outy.length - 1);
                                data.token[parse.count] = data
                                    .token[parse.count]
                                    .slice(0, aa + 1) + value(outy) + ")";
                            }
                        }
                        ltoke = value(ltoke);
                    } else {
                        ltype = "item";
                    }
                    recordPush("");
                },
                // Some tokens receive a generic type named 'item' because their type is unknown
                // until we know the following syntax.  This function replaces the type 'item'
                // with something more specific.
                item        = function lexer_style_item(type:string):void {
                    let aa:number     = parse.count,
                        bb:number     = 0,
                        first:string  = "";
                    const comsa:string[]   = [],
                        priors = function lexer_style_item_priors() {
                            //backtrack through immediately prior comments to find the correct token
                            if (data.types[aa] === "comment" || data.types[aa] === "ignore") {
                                do {
                                    aa = aa - 1;
                                    comsa.push(data.token[aa]);
                                } while (aa > 0 && data.lexer[aa] === "style" && (data.types[aa] === "comment" || data.types[aa] === "ignore"));
                            }
                            bb = aa - 1;
                            if (data.types[bb] === "comment" || data.types[bb] === "ignore") {
                                do {
                                    bb = bb - 1;
                                } while (bb > 0 && data.lexer[aa] === "style" && (data.types[bb] === "comment" || data.types[bb] === "ignore"));
                            }
                            first = data.token[aa].charAt(0);
                        },
                        selectorPretty = function lexer_style_item_selectorPretty(index:number):void {
                            let cc:number = index,
                                dd:number = data.begin[cc];
                            data.token[index] = data.token[index]
                                .replace(/\s*&/, " &")
                                .replace(/(\s*>\s*)/g, " > ")
                                .replace(/:\s+/g, ": ")
                                .replace(/^(\s+)/, "")
                                .replace(/(\s+)$/, "")
                                .replace(/\s+::\s+/, "::");
                            if (data.token[cc - 1] === "," || data.token[cc - 1] === ":" || data.types[cc - 1] === "comment") {
                                do {
                                    cc = cc - 1;
                                    if (data.begin[cc] === dd) {
                                        if (data.token[cc] === ";") {
                                            break;
                                        }
                                        if (data.token[cc] !== "," && data.types[cc] !== "comment") {
                                            data.types[cc] = "selector";
                                        }
                                        if (data.token[cc] === ":") {
                                            data.token[cc - 1] = `${data.token[cc - 1]}:${data.token[cc + 1]}`;
                                            parse.splice({
                                                data: data,
                                                howmany: 2,
                                                index: cc
                                            });
                                        }
                                    } else {
                                        break;
                                    }
                                } while (cc > 0);
                            }
                            // sorts comma separated lists of selectors
                            cc = parse.count;
                            if (options.lexer_options.style.object_sort === true && data.token[cc - 1] === ",") {
                                const store:string[] = [data.token[cc]];
                                do {
                                    cc = cc - 1;
                                    if (data.types[cc] === "comment" || data.types[cc] === "ignore") {
                                        do {
                                            cc = cc - 1;
                                        } while (cc > 0 && (data.types[cc] === "comment" || data.types[cc] === "ignore"));
                                    }
                                    if (data.token[cc] === ",") {
                                        cc = cc - 1;
                                    }
                                    store.push(data.token[cc]);
                                } while (cc > 0 && (data.token[cc - 1] === "," || data.types[cc - 1] === "selector" || data.types[cc - 1] === "comment" || data.types[cc - 1] === "ignore"));
                                store.sort();
                                cc = parse.count;
                                data.token[cc] = store.pop();
                                do {
                                    cc = cc - 1;
                                    if (data.types[cc] === "comment" || data.types[cc] === "ignore") {
                                        do {
                                            cc = cc - 1;
                                        } while (cc > 0 && (data.types[cc] === "comment" || data.types[cc] === "ignore"));
                                    }
                                    if (data.token[cc] === ",") {
                                        cc = cc - 1;
                                    }
                                    data.token[cc] = store.pop();
                                } while (cc > 0 && (data.token[cc - 1] === "," || data.token[cc - 1] === "selector" || data.types[cc - 1] === "comment" || data.types[cc - 1] === "ignore"));
                            }
                            aa = parse.count;
                            priors();
                        };
                    priors();
                    //if the last non-comment type is 'item' then id it
                    if (type === "start" && (data.types[aa] === "value" || data.types[aa] === "variable")) {
                        data.types[aa] = "item";
                    }
                    if (data.lexer[parse.count - 1] !== "style" || bb < 0) {
                        if (type === "colon") {
                            if (first === "$" || first === "@") {
                                data.types[aa] = "variable";
                            } else {
                                data.types[aa] = "property";
                            }
                        } else if (data.lexer[aa] === "style") {
                            data.types[aa] = "selector";
                            selectorPretty(aa);
                        }
                    } else if (type === "start" && data.types[aa] === "function" && data.lexer[aa] === "style") {
                        data.types[aa] = "selector";
                        selectorPretty(aa);
                    } else if (data.types[aa] === "item" && data.lexer[aa] === "style") {
                        if (type === "start") {
                            selectorPretty(aa);
                            data.types[aa] = "selector";
                            if (data.token[aa] === ":") {
                                data.types[bb] = "selector";
                            }
                            if (data.token[aa].indexOf("=\u201c") > 0) {
                                sparser.parseerror = `Quote looking character (\u201c, \\201c) used instead of actual quotes on line number ${parse.lineNumber}`;
                            } else if (data.token[aa].indexOf("=\u201d") > 0) {
                                sparser.parseerror = `Quote looking character (\u201d, \\201d) used instead of actual quotes on line number ${parse.lineNumber}`;
                            }
                        } else if (type === "end") {
                            if (first === "$" || first === "@") {
                                data.types[aa] = "variable";
                            } else {
                                data.types[aa] = "value";
                            }
                            data.token[aa] = value(data.token[aa]);
                        } else if (type === "separator") {
                            if (data.types[bb] === "colon" || data.token[bb] === "," || data.token[bb] === "{") {
                                if (b[a] !== ";" && (data.types[bb] === "selector" || data.token[bb] === "{")) {
                                    data.types[aa] = "selector";
                                    selectorPretty(aa);
                                } else if (data.token[aa].charAt(0) === "$" || data.token[aa].charAt(0) === "@") {
                                    data.types[aa] = "variable";
                                } else {
                                    data.types[aa] = "value";
                                }
                                data.token[aa] = value(data.token[aa]);
                                if (data.token[aa].charAt(0) === "\u201c") {
                                    sparser.parseerror = `Quote looking character (\u201c, \\201c) used instead of actual quotes on line number ${parse.lineNumber}`;
                                } else if (data.token[aa].charAt(0) === "\u201d") {
                                    sparser.parseerror = `Quote looking character (\u201d, \\201d) used instead of actual quotes on line number ${parse.lineNumber}`;
                                }
                            } else {
                                if (first === "$" || first === "@") {
                                    data.types[aa] = "variable";
                                } else if (data.types[bb] === "value" || data.types[bb] === "variable") {
                                    data.token[bb] = data.token[bb] + data.token[aa];
                                    parse.pop(data);
                                } else {
                                    data.types[aa] = "value";
                                }
                            }
                        } else if (type === "colon") {
                            if (first === "$" || first === "@") {
                                data.types[aa] = "variable";
                            } else {
                                data.types[aa] = "property";
                            }
                        } else if (data.token[bb].charAt(0) === "@" && ((data.types[bb - 2] !== "variable" && data.types[bb - 2] !== "property") || data.types[bb - 1] === "separator")) {
                            data.types[bb] = "variable";
                            ltype          = "variable";
                            data.token[bb] = value(data.token[bb]);
                        }
                    }
                },
                semiComment = function lexer_style_separatorComment():void {
                    let x:number = parse.count;
                    do {
                        x = x - 1;
                    } while (x > 0 && (data.types[x] === "comment"));
                    if (data.token[x] === ";") {
                        return;
                    }
                    parse.splice({
                        data: data,
                        howmany: 0,
                        index: x + 1,
                        record: {
                            begin: parse.structure[parse.structure.length - 1][1],
                            ender: -1,
                            lexer: "style",
                            lines: parse.linesSpace,
                            stack: parse.structure[parse.structure.length - 1][0],
                            token: ";",
                            types: "separator"
                        }
                    });
                },
                template    = function lexer_style_template(open:string, end:string):void {
                    let quote:string  = "",
                        name:string   = "",
                        start:number  = open.length,
                        endlen:number = 0;
                    const store:string[]  = [],
                        exit   = function lexer_style_template_exit(typename:string):void {
                            const endtype:string = data.types[parse.count - 1];
                            if (ltype === "item") {
                                if (endtype === "colon") {
                                    data.types[parse.count] = "value";
                                } else {
                                    item(endtype);
                                }
                            }
                            ltype = typename;
                            if (ltype.indexOf("start") > -1 || ltype.indexOf("else") > -1) {
                                recordPush(ltoke);
                            } else {
                                recordPush("");
                            }
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
                                        if (ltype === "item" && data.types[parse.count - 1] === "colon" && (data.types[parse.count - 2] === "property" || data.types[parse.count - 2] === "variable")) {
                                            ltype                   = "value";
                                            data.types[parse.count] = "value";
                                            if (Number.isNaN(Number(data.token[parse.count])) === true && data.token[parse.count].charAt(data.token[parse.count].length - 1) !== ")") {
                                                data.token[parse.count] = data.token[parse.count] + quote;
                                            } else {
                                                data.token[parse.count] = data.token[parse.count] + " " + quote;
                                            }
                                            return;
                                        }
                                        ltoke = quote;
                                        if (open === "{%") {
                                            const templateNames:string[] = [
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
                                            let namesLen:number = templateNames.length - 1;
                                            name = name.slice(0, name.indexOf(" "));
                                            if (name.indexOf("(") > 0) {
                                                name = name.slice(0, name.indexOf("("));
                                            }
                                            if (name === "else" || name === "elseif" || name === "when" || name === "elif") {
                                                exit("template_else");
                                                return;
                                            }
                                            namesLen = templateNames.length - 1;
                                            if (namesLen > -1) {
                                                do {
                                                    if (name === templateNames[namesLen]) {
                                                        exit("template_start");
                                                        return;
                                                    }
                                                    if (name === "end" + templateNames[namesLen]) {
                                                        exit("template_end");
                                                        return;
                                                    }
                                                    namesLen = namesLen - 1;
                                                } while (namesLen > -1);
                                            }
                                        } else if (open === "{{") {
                                            let group:string = quote.slice(2),
                                                ending:number = group.length,
                                                begin:number = 0;
                                            do {
                                                begin = begin + 1;
                                            } while (
                                                begin < ending && (/\s/).test(group.charAt(begin)) === false && group.charAt(start) !== "("
                                            );
                                            group = group.slice(0, begin);
                                            if (group.charAt(group.length - 2) === "}") {
                                                group = group.slice(0, group.length - 2);
                                            }
                                            if (group === "end") {
                                                exit("template_end");
                                                return;
                                            }
                                            if (group === "block" || group === "define" || group === "form" || group === "if" || group === "range" || group === "with") {
                                                exit("template_start");
                                                return;
                                            }
                                        }
                                        if ((/\{\s*\?>$/).test(ltoke) === true) {
                                            if ((/^<\?(=|(php))\s*\}\s*else/).test(ltoke) === true) {
                                                exit("template_else");
                                                return;
                                            }
                                            exit("template_start");
                                            return;
                                        }
                                        if ((/^<\?(=|(php))\s*\}/).test(ltoke) === true) {
                                            if ((/^<\?(=|(php))\s*\}\s*else/).test(ltoke) === true) {
                                                exit("template_else");
                                                return;
                                            }
                                            exit("template_end");
                                            return;
                                        }
                                        exit("template");
                                        return;
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
                //finds comments including those JS looking '//' comments
                comment     = function lexer_style_comment(line:boolean):void {
                    let comm:[string, number] = (line === true)
                        ? parse.wrapCommentLine({
                            chars: b,
                            end: len,
                            lexer: "style",
                            opening: "//",
                            start: a,
                            terminator: "\n"
                        })
                        : parse.wrapCommentBlock({
                            chars: b,
                            end: len,
                            lexer: "style",
                            opening: "/*",
                            start: a,
                            terminator: "\u002a/"
                        });
                    ltoke = comm[0];
                    ltype = ((/^(\/\*\s*parse-ignore-start)/).test(ltoke) === true)
                        ? "ignore"
                        : "comment";
                    recordPush("");
                    a = comm[1];
                },
                //consolidate margin and padding values
                margin_padding  = function lexer_style_marginPadding():void {
                    const lines:number = parse.linesSpace,
                        props:style_properties = {
                            data: {
                                margin: ["", "", "", "", false],
                                padding: ["", "", "", "", false]
                            },
                            last: {
                                margin: 0,
                                padding: 0
                            },
                            removes: []
                        },
                        begin:number = parse.structure[parse.structure.length - 1][1],
                        populate = function lexer_style_marginPadding_populate(prop:"margin"|"padding"):void {
                            if (data.token[aa - 2] === prop) {
                                const values:string[] = data.token[aa].replace(/\s*!important\s*/g, "").split(" "),
                                    vlen:number = values.length;
                                if (data.token[aa].indexOf("!important") > -1) {
                                    props.data[prop[4]] = true;
                                }
                                if (vlen > 3) {
                                    if (props.data[prop][0] === "") {
                                        props.data[prop][0] = values[0];
                                    }
                                    if (props.data[prop][1] === "") {
                                        props.data[prop][1] = values[1];
                                    }
                                    if (props.data[prop][2] === "") {
                                        props.data[prop][2] = values[2];
                                    }
                                    if (props.data[prop][3] === "") {
                                        props.data[prop][3] = values[3];
                                    }
                                } else if (vlen > 2) {
                                    if (props.data[prop][0] === "") {
                                        props.data[prop][0] = values[0];
                                    }
                                    if (props.data[prop][1] === "") {
                                        props.data[prop][1] = values[1];
                                    }
                                    if (props.data[prop][2] === "") {
                                        props.data[prop][2] = values[2];
                                    }
                                    if (props.data[prop][3] === "") {
                                        props.data[prop][3] = values[1];
                                    }
                                } else if (vlen > 1) {
                                    if (props.data[prop][0] === "") {
                                        props.data[prop][0] = values[0];
                                    }
                                    if (props.data[prop][1] === "") {
                                        props.data[prop][1] = values[1];
                                    }
                                    if (props.data[prop][2] === "") {
                                        props.data[prop][2] = values[0];
                                    }
                                    if (props.data[prop][3] === "") {
                                        props.data[prop][3] = values[1];
                                    }
                                } else {
                                    if (props.data[prop][0] === "") {
                                        props.data[prop][0] = values[0];
                                    }
                                    if (props.data[prop][1] === "") {
                                        props.data[prop][1] = values[0];
                                    }
                                    if (props.data[prop][2] === "") {
                                        props.data[prop][2] = values[0];
                                    }
                                    if (props.data[prop][3] === "") {
                                        props.data[prop][3] = values[0];
                                    }
                                }
                            } else if (data.token[aa - 2] === `${prop}-bottom`) {
                                if (props.data[prop][2] === "") {
                                    props.data[prop][2] = data.token[aa];
                                }
                            } else if (data.token[aa - 2] === `${prop}-left`) {
                                if (props.data[prop][3] === "") {
                                    props.data[prop][3] = data.token[aa];
                                }
                            } else if (data.token[aa - 2] === `${prop}-right`) {
                                if (props.data[prop][1] === "") {
                                    props.data[prop][1] = data.token[aa];
                                }
                            } else if (data.token[aa - 2] === `${prop}-top`) {
                                if (props.data[prop][0] === "") {
                                    props.data[prop][0] = data.token[aa];
                                }
                            } else {
                                return;
                            }
                            props.removes.push([aa, prop]);
                            props.last[prop] = aa;
                        },
                        removes = function lexer_style_marginPadding_removes():void {
                            let cc:number = 0,
                                values:string = "";
                            const zero:RegExp     = (/^(0+([a-z]+|%))/),
                                bb:number = props.removes.length,
                                tmargin:boolean = (props.data.margin[0] !== "" && props.data.margin[1] !== "" && props.data.margin[2] !== "" && props.data.margin[3] !== ""),
                                tpadding:boolean = (props.data.padding[0] !== "" && props.data.padding[1] !== "" && props.data.padding[2] !== "" && props.data.padding[3] !== ""),
                                applyValues = function lexer_style_marginPadding_removes_applyValues(prop:"margin"|"padding") {
                                    if (zero.test(props.data[prop][0]) === true) {
                                        props.data[prop][0] = "0";
                                    }
                                    if (zero.test(props.data[prop][1]) === true) {
                                        props.data[prop][1] = "0";
                                    }
                                    if (zero.test(props.data[prop][2]) === true) {
                                        props.data[prop][2] = "0";
                                    }
                                    if (zero.test(props.data[prop][3]) === true) {
                                        props.data[prop][3] = "0";
                                    }
                                    if (props.data[prop][0] === props.data[prop][1] && props.data[prop][0] === props.data[prop][2] && props.data[prop][0] === props.data[prop][3]) {
                                        values = props.data[prop][0];
                                    } else if (props.data[prop][0] === props.data[prop][2] && props.data[prop][1] === props.data[prop][3] && props.data[prop][0] !== props.data[prop][1]) {
                                        values = `${props.data[prop][0]} ${props.data[prop][1]}`;
                                    } else if (props.data[prop][1] === props.data[prop][3] && props.data[prop][0] !== props.data[prop][2]) {
                                        values = `${props.data[prop][0]} ${props.data[prop][1]} ${props.data[prop][2]}`;
                                    } else {
                                        values = `${props.data[prop][0]} ${props.data[prop][1]} ${props.data[prop][2]} ${props.data[prop][3]}`;
                                    }
                                    if (props.data[prop[4]] === true) {
                                        values = `${values.replace(" !important", "")} !important`;
                                    }
                                    if (props.last[prop] > parse.count) {
                                        cc = (begin < 1)
                                            ? 1
                                            : begin + 1;
                                        do {
                                            if (data.begin[cc] === begin && data.types[cc] === "value" && data.token[cc - 2].indexOf(prop) === 0) {
                                                props.last[prop] = cc;
                                                break;
                                            }
                                            cc = cc + 1;
                                        } while (cc < parse.count)
                                    }
                                    data.token[props.last[prop]] = values;
                                    data.token[props.last[prop] - 2] = prop;
                                };
                            if (bb > 1 && (tmargin === true || tpadding === true)) {
                                do {
                                    if (props.removes[cc][0] !== props.last.margin && props.removes[cc][0] !== props.last.padding && ((tmargin === true && props.removes[cc][1] === "margin") || (tpadding === true && props.removes[cc][1] === "padding"))) {
                                        parse.splice({
                                            data: data,
                                            howmany: (data.types[props.removes[cc][0] + 1] === "separator")
                                                ? 4
                                                : 3,
                                            index: props.removes[cc][0] - 2
                                        });
                                    }
                                    cc = cc + 1;
                                } while (cc < bb - 1);
                            }
                            if (tmargin === true) {
                                applyValues("margin");
                            }
                            if (tpadding === true) {
                                applyValues("padding");
                            }
                            // this is necessary to fix the "begin" values of descendent blocks
                            if (endtest === true) {
                                if (begin < 0) {
                                    sparser.parseerror = "Brace mismatch.  There appears to be more closing braces than starting braces.";
                                } else {
                                    parse.sortCorrection(begin, parse.count + 1);
                                }
                            }
                        };
                    let aa:number = parse.count,
                        endtest:boolean = false;
                    do {
                        aa = aa - 1;
                        if (data.begin[aa] === begin) {
                            if (data.types[aa] === "value" && data.types[aa - 2] === "property") {
                                if (data.token[aa - 2].indexOf("margin") === 0) {
                                    populate("margin");
                                } else if (data.token[aa - 2].indexOf("padding") === 0) {
                                    populate("padding");
                                }
                            }
                        } else {
                            endtest = true;
                            aa = data.begin[aa];
                        }
                    } while (aa > begin);
                    removes();
                    parse.linesSpace = lines;
                };
            //token building loop
            do {
                if ((/\s/).test(b[a]) === true) {
                    a = parse.spacer({array: b, end: len, index: a});
                } else if (b[a] === "/" && b[a + 1] === "*") {
                    comment(false);
                } else if (b[a] === "/" && b[a + 1] === "/") {
                    comment(true);
                } else if (b[a] === "<" && b[a + 1] === "?" && b[a + 2] === "p" && b[a + 3] === "h" && b[a + 4] === "p") {
                    //php
                    template("<?php", "?>");
                } else if (b[a] === "<" && b[a + 1] === "?" && b[a + 2] === "=") {
                    //php
                    template("<?=", "?>");
                } else if (b[a] === "<" && b[a + 1] === "%") {
                    //asp
                    template("<%", "%>");
                } else if (b[a] === "{" && b[a + 1] === "%") {
                    //asp
                    template("{%", "%}");
                } else if (b[a] === "{" && b[a + 1] === "{" && b[a + 2] === "{") {
                    //mustache
                    template("{{{", "}}}");
                } else if (b[a] === "{" && b[a + 1] === "{") {
                    //handlebars
                    template("{{", "}}");
                } else if (b[a] === "<" && b[a + 1] === "!" && b[a + 2] === "-" && b[a + 3] === "-" && b[a + 4] === "#") {
                    //ssi
                    template("<!--#", "-->");
                } else if (b[a] === "@" && b[a + 1] === "e" && b[a + 2] === "l" && b[a + 3] === "s" && b[a + 4] === "e" && (b[a + 5] === "{" || (/\s/).test(b[a + 5]) === true)) {
                    ltoke = "@else";
                    ltype = "template_else";
                    recordPush("");
                    a           = a + 4;
                } else if (b[a] === "{" || (b[a] === "(" && data.token[parse.count] === ":" && data.types[parse.count - 1] === "variable")) {
                    item("start");
                    ltype = "start";
                    ltoke = b[a];
                    if (b[a] === "(") {
                        recordPush("map");
                        mapper.push(0);
                    } else if (data.types[parse.count] === "selector" || data.types[parse.count] === "variable") {
                        recordPush(data.token[parse.count]);
                    } else if (data.types[parse.count] === "colon") {
                        recordPush(data.token[parse.count - 1]);
                    } else {
                        recordPush("block");
                    }
                    nosort.push(false);
                } else if (b[a] === "}" || (b[a] === ")" && parse.structure[parse.structure.length - 1][0] === "map" && mapper[mapper.length - 1] === 0)) {
                    if (b[a] === "}" && data.types[parse.count] === "item" && data.token[parse.count - 1] === "{" && data.token[parse.count - 2] !== undefined && data.token[parse.count - 2].charAt(data.token[parse.count - 2].length - 1) === "@") {
                        data.token[parse.count - 2] = data.token[parse.count - 2] + "{" + data.token[parse.count] +
                                "}";
                        parse.pop(data);
                        parse.pop(data);
                        parse.structure.pop();
                    } else {
                        if (b[a] === ")") {
                            mapper.pop();
                        }
                        item("end");
                        if (b[a] === "}" && data.token[parse.count] !== ";") {
                            if (data.types[parse.count] === "value" || data.types[parse.count] === "function"  || (
                                data.types[parse.count] === "variable" && (
                                    data.token[parse.count - 1] === ":" || data.token[parse.count - 1] === ";"
                                )
                            )) {
                                if (options.correct === true) {
                                    ltoke = ";";
                                } else {
                                    ltoke = "x;";
                                }
                                ltype = "separator";
                                recordPush("");
                            } else if (data.types[parse.count] === "comment") {
                                semiComment();
                            }
                        }
                        ltype = "end";
                        nosort.pop();
                        ltoke = b[a];
                        ltype = "end";
                        if (b[a] === "}") {
                            margin_padding();
                        }
                        if (options.lexer_options.style.object_sort === true && b[a] === "}") {
                            parse.object_sort(data);
                        }
                        recordPush("");
                    }
                } else if (b[a] === ";" || b[a] === ",") {
                    if (data.types[parse.count - 1] === "selector" || (data.token[parse.count - 1] === "}" && data.types[parse.count] !== "function")) {
                        item("start");
                    } else {
                        item("separator");
                    }
                    if (data.types[parse.count] !== "separator" && esctest(a) === true) {
                        ltoke = b[a];
                        ltype = "separator";
                        recordPush("");
                    }
                } else if (b[a] === ":" && data.types[parse.count] !== "end") {
                    item("colon");
                    ltoke = ":";
                    ltype = "colon";
                    recordPush("");
                } else {
                    if (parse.structure[parse.structure.length - 1][0] === "map" && b[a] === "(") {
                        mapper[mapper.length - 1] = mapper[mapper.length - 1] + 1;
                    }
                    buildtoken();
                }
                a = a + 1;
            } while (a < len);
            if (options.lexer_options.style.object_sort === true) {
                parse.object_sort(data);
            }

            return data;
        };

    sparser.lexers.style  = style;
}());
