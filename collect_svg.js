console.log("COLLECT");
SVGs = document.getElementsByTagName("svg");
paths = {};

for (let SVG of SVGs) {
    if (SVG.getAttribute("SVG-Replacer")) break;
    getPaths(SVG);
}

/**
 * Collects all paths from an SVG.
 * @param {*} SVG The SVG element.
 */
function getPaths(SVG) {
    for (let svgg of SVG.children) {
        if (svgg.nodeName === "g") {
            getPaths(svgg);
        } else if (svgg.nodeName === "path") {
            paths[svgg.getAttribute("d")] = "null";
        }
    }
}

console.log(paths);
paths;