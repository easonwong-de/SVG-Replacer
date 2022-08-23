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
	for (let oldPath in pref_domain_cache) {
		let newPath = pref_domain_cache[oldPath];
		if (typeof newPath != "string" || newPath == "null")
			delete pref_domain_cache[oldPath];
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
	let SVGs = document.getElementsByTagName("svg");
	for (let SVG of SVGs) {
		if ((SVG.firstChild && SVG.firstChild.nodeName === "defs")
			|| SVG.getAttribute("SVG-Replacer")) continue;
		const { marginT, marginB, marginL, marginR } = getSVGMargin(SVG);
		for (let oldPath in pref_domain_cache) {
			let newPath = pref_domain_cache[oldPath];
			replacePaths(newPath, oldPath, SVG);
		}
		const { xMin, xMax, yMin, yMax } = getSVGDimension(SVG);
		const x = xMin - marginL * (xMax - xMin);
		const y = yMin - marginT * (yMax - yMin);
		const width = (1 + marginL + marginR) * (xMax - xMin);
		const height = (1 + marginT + marginB) * (yMax - yMin);
		const viewbox = `${x} ${y} ${width} ${height}`;
		SVG.setAttribute("viewBox", viewbox);
		SVG.setAttribute("SVG-Replacer", "true");
	}
}

/**
 * Replaces all oldPaths in an SVG with newPaths.
 * @param {string} newPath New d attribute of a path.
 * @param {string} oldPath Old d attribute of a path.
 * @param {SVGElement} SVG The SVG element.
 */
function replacePaths(newPath, oldPath, SVG) {
	for (let svgg of SVG.children) {
		if (svgg.nodeName === "g") {
			replacePaths(newPath, oldPath, svgg);
		} else if (svgg.nodeName === "path") {
			if (svgg.getAttribute("d") === oldPath)
				svgg.setAttribute("d", newPath);
		}
	}
}

/**
 * Gets the margins of an SVG.
 * @param {SVGElement} SVG SVG HTML element.
 * @returns Margins on top, bottom, left and right sides in percentages propotional to SVG's size.
 */
function getSVGMargin(SVG) {
	const temp = SVG.getAttribute("viewBox").split(" ");
	const viewBox = {
		xMin: temp[0],
		xMax: temp[0] + temp[2],
		yMin: temp[1],
		yMax: temp[1] + temp[3]
	}
	const { xMin, xMax, yMin, yMax } = getSVGDimension(SVG);
	return {
		marginT: (yMin - viewBox.yMin) / (yMax - yMin),
		marginB: (viewBox.yMax - yMax) / (yMax - yMin),
		marginL: (xMin - viewBox.xMin) / (xMax - xMin),
		marginR: (viewBox.xMax - xMax) / (xMax - xMin)
	}
}

/**
 * Gets boundary coordinates of an SVG.
 * @author Nick Scialli
 * @param {SVGElement} SVG SVG HTML element.
 * @returns Boundary coordinates of the SVG.
 */
function getSVGDimension(SVG) {
	return { xMin, xMax, yMin, yMax } = [...SVG.children].reduce((dims, svgg) => {
		try {
			const { x, y, width, height } = getBetterBBox(svgg);
			if (!dims.xMin || x < dims.xMin) dims.xMin = x;
			if (!dims.xMax || x + width > dims.xMax) dims.xMax = x + width;
			if (!dims.yMin || y < dims.yMin) dims.yMin = y;
			if (!dims.yMax || y + height > dims.yMax) dims.yMax = y + height;
		} catch (error) {
			console.warn("Can't get " + svgg.nodeName + "'s dimension");
		}
		return dims;
	}, { xMin: 0, xMax: 0, yMin: 0, yMax: 0 });
}

/**
 * Gets BBox of an SVG graphics element.
 * @author Diego Mijelshon
 * @param {SVGGraphicsElement} svgg SVG graphics element.
 * @returns The BBox value of the SVG graphics element.
 */
function getBetterBBox(svgg) {
	let bbox = svgg.getBBox();
	if (bbox.width === 0 && bbox.height === 0) {
		tempDiv = document.createElement("div");
		tempDiv.setAttribute("style", "position:absolute; visibility:hidden; width:0; height:0");
		if (svgg.tagName === "svg") {
			tempSvg = svgg.cloneNode(true);
		} else {
			tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			tempSvg.appendChild(svgg.cloneNode(true));
		}
		tempDiv.appendChild(tempSvg);
		document.body.appendChild(tempDiv);
		bbox = tempSvg.getBBox();
		document.body.removeChild(tempDiv);
	}
	return bbox;
}
