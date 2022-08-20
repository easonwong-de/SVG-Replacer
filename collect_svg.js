const SVGCollection = document.getElementsByTagName("svg");
const SVGContentCollection = {};
for (let SVGElement of SVGCollection) {
    SVGContentCollection[SVGElement.innerHTML] = "";
}
SVGContentCollection;