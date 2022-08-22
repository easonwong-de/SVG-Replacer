function update() {
	browser.storage.local.get(pref => {
		let SVGReplacement = pref[document.domain];
		if (SVGReplacement) updateSVGOnWebsite(SVGReplacement);
	});
}

/**
 * Finds customized SVGs on the websites and replaces them.
 * @param {object} SVGReplacement Object containing SVG replacement rules
 */
function updateSVGOnWebsite(SVGReplacement) {
	let SVGCollection = document.getElementsByTagName("svg");
	for (let oldSVGContent in SVGReplacement) {
		let newSVGContent = SVGReplacement[oldSVGContent];
		if (newSVGContent != null && newSVGContent != "null") {
			if (newSVGContent === "") newSVGContent = "<g></g>";
			for (let SVGElement of SVGCollection) {
				if (SVGElement.firstChild.nodeName === "g") {
					for (let SVGGroup of SVGElement.children) {
						if (!SVGGroup.getAttribute("SVG-Replacer") && SVGGroup.innerHTML === oldSVGContent)
							replaceSVG(SVGElement, newSVGContent);
					}
				} else {
					if (!SVGElement.getAttribute("SVG-Replacer") && SVGElement.innerHTML === oldSVGContent)
						replaceSVG(SVGElement, newSVGContent);
				}
			}
		}
	}
}

/**
 * Replaces the content of SVGElement with newSVGContent and auto scales it.
 * @param {SVGElement} SVGElement SVG HTML element
 * @param {HTMLElement} newSVGContent innerHTML of new SVG HTML element
 */
function replaceSVG(SVGElement, newSVGContent) {
	const { marginT, marginB, marginL, marginR } = getSVGMargin(SVGElement);
	SVGElement.innerHTML = newSVGContent;
	SVGElement.setAttribute("SVG-Replacer", "true");
	const { xMin, xMax, yMin, yMax } = getSVGDimension(SVGElement);
	const x = xMin - marginL * (xMax - xMin);
	const y = yMin - marginT * (yMax - yMin);
	const width = (1 + marginL + marginR) * (xMax - xMin);
	const height = (1 + marginT + marginB) * (yMax - yMin);
	const viewbox = `${x} ${y} ${width} ${height}`;
	console.log(viewbox);
	SVGElement.setAttribute("viewBox", viewbox);
}

/**
 * Gets the margins of an SVG.
 * @param {SVGElement} SVGElement SVG HTML element
 * @returns Margins on top, bottom, left and right sides in percentages propotional to SVG's size
 */
function getSVGMargin(SVGElement) {
	const temp = SVGElement.getAttribute("viewBox").split(" ");
	const viewBox = {
		xMin: temp[0],
		xMax: temp[0] + temp[2],
		yMin: temp[1],
		yMax: temp[1] + temp[3]
	}
	const { xMin, xMax, yMin, yMax } = getSVGDimension(SVGElement);
	return {
		marginT: (yMin - viewBox.yMin) / (yMax - yMin),
		marginB: (viewBox.yMax - yMax) / (yMax - yMin),
		marginL: (xMin - viewBox.xMin) / (xMax - xMin),
		marginR: (viewBox.xMax - xMax) / (xMax - xMin)
	}
}

/**
 * Gets coordinates and size of an SVG.
 * @author Nick Scialli
 * @param {SVGElement} SVGElement SVG HTML element
 * @returns Smallest viewbox of te SVG
 */
function getSVGDimension(SVGElement) {
	return { xMin, xMax, yMin, yMax } = [...SVGElement.children].reduce((dimension, el) => {
		try {
			const { x, y, width, height } = el.getBBox();
			if (!dimension.xMin || x < dimension.xMin) dimension.xMin = x;
			if (!dimension.xMax || x + width > dimension.xMax) dimension.xMax = x + width;
			if (!dimension.yMin || y < dimension.yMin) dimension.yMin = y;
			if (!dimension.yMax || y + height > dimension.yMax) dimension.yMax = y + height;
		} catch (error) {
			console.warn("Can't get " + el.nodeName + "'s dimension");
		}
		return dimension;
	}, { xMin: 0, xMax: 0, yMin: 0, yMax: 0 });
}

var obs = new MutationObserver(update);
obs.observe(document.body, { childList: true, subtree: true, attributes: false, characterData: false });
update();