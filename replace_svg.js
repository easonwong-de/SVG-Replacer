var obs = new MutationObserver(update);
obs.observe(document.body, { childList: true, subtree: true, attributes: false, characterData: false });

function update() {
	browser.storage.local.get(pref => {
		let SVGReplacement = pref[document.domain];
		if (SVGReplacement) {
			replaceSVG(SVGReplacement);
		}
	});
}

function replaceSVG(SVGReplacement) {
	let SVGCollection = document.getElementsByTagName("svg");
	for (let oldSVG in SVGReplacement) {
		let newSVG = SVGReplacement[oldSVG];
		if (newSVG != null && newSVG != "null") {
			if (newSVG === "") newSVG = "<g></g>";
			for (let SVGElement of SVGCollection) {
				if (SVGElement.firstChild.nodeName === "g") {
					for (let SVGGroup of SVGElement.children) {
						if (!SVGGroup.getAttribute("SVG-Replacer") && SVGGroup.innerHTML === oldSVG) {
							SVGGroup.innerHTML = newSVG;
							SVGGroup.setAttribute("SVG-Replacer", "true");
							autoScaleSVG(SVGElement);
						}
					}
				} else {
					if (!SVGElement.getAttribute("SVG-Replacer") && SVGElement.innerHTML === oldSVG) {
						SVGElement.innerHTML = newSVG;
						SVGGroup.setAttribute("SVG-Replacer", "true");
						autoScaleSVG(SVGElement);
					}
				}
			}
		}
	}
}

/**
 * @author Nick Scialli
 * @param {SVGElement} SVG 
 */
function autoScaleSVG(SVG) {
	const { xMin, xMax, yMin, yMax } = [...SVG.children].reduce((dimension, el) => {
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
	}, {
		xMin: 0,
		xMax: 0,
		yMin: 0,
		yMax: 0
	});
	let x = xMin;
	let y = yMin;
	let width = xMax - xMin;
	let height = yMax - yMin;
	if (width > height) {
		y = y - (width - height) / 2;
		height = width;
	} else {
		x = x - (height - width) / 2;
		width = height;
	}
	if (width === 0) width = height = 1;
	const viewbox = `${x} ${y} ${width} ${height}`;
	SVG.setAttribute('viewBox', viewbox);
}