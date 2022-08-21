SVGCollection = document.getElementsByTagName("svg");
SVGContentCollection = {};

for (let SVGElement of SVGCollection) {
    if (SVGElement.firstChild.nodeName != "defs") {
        if (SVGElement.firstChild.nodeName === "g") {
            for (let SVGGroup of SVGElement.children) {
                SVGContentCollection[SVGGroup.innerHTML] = "null";
            }
        } else {
            SVGContentCollection[SVGElement.innerHTML] = "null";
        }
    }
}

SVGContentCollection;