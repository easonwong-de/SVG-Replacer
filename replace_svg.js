/**
 * @author Nick Scialli
 * @param {SVGElement} SVG 
 */
function autoScaleSVG(SVG) {
	const { xMin, xMax, yMin, yMax } = [...SVG.children].reduce((dimension, el) => {
		const { x, y, width, height } = el.getBBox();
		if (!dimension.xMin || x < dimension.xMin) dimension.xMin = x;
		if (!dimension.xMax || x + width > dimension.xMax) dimension.xMax = x + width;
		if (!dimension.yMin || y < dimension.yMin) dimension.yMin = y;
		if (!dimension.yMax || y + height > dimension.yMax) dimension.yMax = y + height;
		return dimension;
	}, {});
	const viewbox = `${xMin} ${yMin} ${xMax - xMin} ${yMax - yMin}`;
	SVG.setAttribute('viewBox', viewbox);
}