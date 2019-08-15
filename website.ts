/*eslint-env browser*/
(function website():void {
    "use strict";
    const  svg_left:HTMLElement = document.getElementById("svg_left"),
        svg_right:HTMLElement = document.getElementById("svg_right");
    if (window.innerWidth > 800) {
        let width:number = (window.innerWidth / 10),
            height:number = (window.innerHeight / 10),
            a:number = 0;
        const blob:HTMLElement = document.getElementById("blobs"),
            screen:HTMLElement = blob.getElementsByTagName("div")[0],
            style:HTMLElement = document.createElement("style"),
            blobs:number = 8,
            ff:boolean = (navigator.userAgent.indexOf("Gecko/") > 0),
            size:number = width / 4,
            content:HTMLElement = document.getElementById("content"),
            resize = function website_resize():void {
                let styletext:string = style.innerHTML,
                    wscale:number = ((window.innerWidth / 10) - 100) / 12.5;
                height = (window.innerHeight / 10);
                width = (window.innerWidth / 10);
                if (content.clientHeight / 10 < height - 6.1) {
                    content.style.height = `${height - 6.1}em`;
                }
                svg_left.style.width = `${(width - 100) / 2}em`;
                svg_left.style.height = `${height}em`;
                svg_left.style.backgroundPositionX = `-${wscale}em`;
                svg_right.style.width = `${(width - 100) / 2}em`;
                svg_right.style.height = `${height}em`;
                svg_right.style.backgroundPositionX = `-${wscale + 2}em`;
                screen.style.height = `${height}em`;
                screen.style.width = `${width}em`;
                blob.style.height = `${height - size}em`;
                blob.style.width = `${width}em`;
                styletext = styletext.replace(/from\{\}to\{left:\d+em/g, `from{}to{left:${width}em`);
                styletext = styletext.replace(/bottom:\d+em/g, `bottom:${height}em`);
                style.innerHTML = styletext;
            },
            createBlob = function website_createBlob():void {
                const rand:[number, number, number] = [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)],
                    div:HTMLElement = document.createElement("div"),
                    inner:HTMLElement = document.createElement("span"),
                    randa:number = Math.floor(Math.random() * 100),
                    randb:number = Math.floor(Math.random() * 100);
                let back:[string, string, string] = [rand[0].toString(16), rand[1].toString(16), rand[2].toString(16)];
                if (back[0].length < 2) {
                    back[0] = `0${back[0]}`;
                }
                if (back[1].length < 2) {
                    back[1] = `0${back[1]}`;
                }
                if (back[2].length < 2) {
                    back[2] = `0${back[2]}`;
                }
                div.appendChild(inner);
                inner.style.background = `#${back.join("")}`;
                inner.style.position = "absolute";
                div.style.left = `${randa.toString()}%`;
                div.style.top = `${randb.toString()}%`;
                div.style.height = `${size}em`;
                div.style.width = `${size}em`;
                inner.style.height = `${size}em`;
                inner.style.width = `${size}em`;
                inner.style.opacity = (ff === true)
                    ? "0.1"
                    : "0.25";
                inner.style.filter = (ff === true)
                    ? `blur(${size}em)`
                    : `blur(${size / 2}em)`;
                /*if (chrome === true) {
                    if (a % 2 === 1) {
                        style.innerHTML = `${style.innerHTML} @keyframes moving${a}{from{left:0}to{left:${width - size}em}}@keyframes inner${a}{0%,100%{bottom:0;animation-timing-function:ease-out}50%{bottom:${height - size}em;animation-timing-function:ease-in}}`;
                    } else {
                        style.innerHTML = `${style.innerHTML} @keyframes moving${a}{from{left:${width - size}em}to{left:0}}@keyframes inner${a}{0%,100%{bottom:${height - size}em;animation-timing-function:ease-out}50%{bottom:0;animation-timing-function:ease-in}}`;
                    }
                    div.style.animationName = `moving${a}`;
                    div.style.animationTimingFunction = "linear";
                    div.style.animationIterationCount = "infinite";
                    div.style.animationDirection = "alternate";
                    div.style.animationDuration = `${randa * 4}s`;
                    inner.style.animationDuration = `${randb * 4}s`;
                    inner.style.animationName = `inner${a}`;
                    inner.style.animationIterationCount = "infinite";
                }*/
                blob.appendChild(div);
            };
        style.setAttribute("type", "text/css");
        document.getElementsByTagName("head")[0].appendChild(style);
        screen.style.position = "relative";
        screen.style.zIndex = "4";
        if (content.clientHeight / 10 < height - 6.1) {
            content.style.height = `${height - 6.1}em`;
        }
        window.onresize = resize;
        resize();
        if (blobs > 0) {
            do {
                createBlob();
                a = a + 1;
            } while (a < blobs);
        }
    } else {
        svg_left.parentNode.removeChild(svg_left);
        svg_right.parentNode.removeChild(svg_right);
    }
    // web sockets
    if (location.href.indexOf("//localhost:") > 0) {
        let port:number = (function port():number {
            const uri = location.href;
            let str:string = uri.slice(location.href.indexOf("host:") + 5),
                ind:number = str.indexOf("/");
            if (ind > 0) {
                str = str.slice(0, ind);
            }
            ind = str.indexOf("?");
            if (ind > 0) {
                str = str.slice(0, ind);
            }
            ind = str.indexOf("#");
            if (ind > 0) {
                str = str.slice(0, ind);
            }
            ind = Number(str);
            if (isNaN(ind) === true) {
                return 8080;
            }
            return ind;
        }()),
        ws = new WebSocket("ws://localhost:" + (port + 1));
        ws.addEventListener("message", function web_sockets(event) {
            if (event.data === "reload") {
                location.reload();
            }
        });
    }
}());