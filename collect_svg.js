SVGCollection = document.getElementsByTagName("svg");
SVGContentCollection = {};
for (let SVGElement of SVGCollection) {
    SVGContentCollection[SVGElement.innerHTML] = "";
}
SVGContentCollection;