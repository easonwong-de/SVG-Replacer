SVGCollection = document.getElementsByTagName("svg");
SVGContentCollection = {};

for (let SVGElement of SVGCollection) {
    if (SVGElement.firstChild.nodeName != "defs") {
        if (SVGElement.firstChild.nodeName === "g") {
            for (let SVGGroup of SVGElement.children) {
                if (!SVGGroup.getAttribute("SVG-Replacer"))
                    SVGContentCollection[SVGGroup.innerHTML] = "null";
            }
        } else {
            if (!SVGElement.getAttribute("SVG-Replacer"))
                SVGContentCollection[SVGElement.innerHTML] = "null";
        }
    }
}

SVGContentCollection;