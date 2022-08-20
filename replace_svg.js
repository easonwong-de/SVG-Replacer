/**
 * @author Nick Scialli
 * @param {SVGElement} svg 
 */
function autoScaleSVG(svg) {
	const { xMin, xMax, yMin, yMax } = [...svg.children].reduce((acc, el) => {
		const { x, y, width, height } = el.getBBox();
		if (!acc.xMin || x < acc.xMin) acc.xMin = x;
		if (!acc.xMax || x + width > acc.xMax) acc.xMax = x + width;
		if (!acc.yMin || y < acc.yMin) acc.yMin = y;
		if (!acc.yMax || y + height > acc.yMax) acc.yMax = y + height;
		return acc;
	}, {});
	const viewbox = `${xMin} ${yMin} ${xMax - xMin} ${yMax - yMin}`;
	svg.setAttribute('viewBox', viewbox);
}