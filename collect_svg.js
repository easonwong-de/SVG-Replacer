SVGCollection = document.getElementsByTagName("svg");
SVGContentCollection = {};
for (let SVGElement of SVGCollection) {
    if (SVGElement.firstChild.nodeName === "defs") {
        SVGContentCollection[SVGElement.firstChild.innerHTML] = "";
    } else {
        SVGContentCollection[SVGElement.innerHTML] = "";
    }
}
SVGContentCollection;