var pref_domain_cache = {};

var mutationObs = new MutationObserver((mutaions) => {
	let found_svg_mutation = false;
	for (let mutation of mutaions) {
		for (let addedNode of mutation.addedNodes) {
			if (addedNode.nodeName === "svg") {
				found_svg_mutation = true;
				update();
			}
			if (found_svg_mutation) break;
		}
		if (found_svg_mutation) break;
	}
});

browser.storage.local.get(pref => {
	pref_domain_cache = pref[document.domain];
	for (let oldSVGContent in pref_domain_cache) {
		let newSVGContent = pref_domain_cache[oldSVGContent];
		if (typeof newSVGContent === "string" && newSVGContent != "null") {
			if (newSVGContent === "") newSVGContent = "<g></g>";
		} else {
			delete pref_domain_cache[oldSVGContent];
		}
	}
	if (pref_domain_cache) {
		update();
		mutationObs.observe(document.body, { childList: true, subtree: true });
	}
});


/**
 * Finds customized SVGs on the websites and replaces them.
 */
function update() {
	console.log("UPDATE " + Date.now());
	let SVGCollection = document.getElementsByTagName("svg");
	for (let oldSVGContent in pref_domain_cache) {
		let newSVGContent = pref_domain_cache[oldSVGContent];
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