/**
 * @author Nick Scialli
 * @param {SVGElement} SVG 
 */
function autoScaleSVG(SVG) {
	const { xMin, xMax, yMin, yMax } = [...SVG.children].reduce((acc, el) => {
		const { x, y, width, height } = el.getBBox();
		if (!acc.xMin || x < acc.xMin) acc.xMin = x;
		if (!acc.xMax || x + width > acc.xMax) acc.xMax = x + width;
		if (!acc.yMin || y < acc.yMin) acc.yMin = y;
		if (!acc.yMax || y + height > acc.yMax) acc.yMax = y + height;
		return acc;
	}, {});
	const viewbox = `${xMin} ${yMin} ${xMax - xMin} ${yMax - yMin}`;
	SVG.setAttribute('viewBox', viewbox);
}