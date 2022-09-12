var pref_domain_cache = {};

browser.storage.local.get(pref => {
	pref_domain_cache = pref[document.domain];
	for (let oldPath in pref_domain_cache) {
		let newPath = pref_domain_cache[oldPath];
		if (typeof newPath != "string" || newPath == "null")
			delete pref_domain_cache[oldPath];
	}
	if (pref_domain_cache) {
		update();
		let mutationObs = new MutationObserver((mutaions) => {
			for (let mutation of mutaions) {
				if (mutation.addedNodes.length === 0) {
					break;
				} else {
					update();
				}
			}
		});
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
			|| SVG.getAttribute("SVG-Replacer")
			|| SVG.getAttribute("SVG-Ignore")) continue;
		const { marginT, marginB, marginL, marginR } = getSVGMargin(SVG);
		const marginMin = Math.min(marginT, marginB, marginL, marginR);
		let path_changed = false;
		for (let oldPath in pref_domain_cache) {
			let newPath = pref_domain_cache[oldPath];
			path_changed = path_changed || replacePaths(newPath, oldPath, SVG);
		}
		if (path_changed) {
			const { xMin, xMax, yMin, yMax } = getSVGDimension(SVG);
			const x = xMin - marginMin * (xMax - xMin);
			const y = yMin - marginMin * (yMax - yMin);
			const width = (1 + marginMin + marginMin) * (xMax - xMin);
			const height = (1 + marginMin + marginMin) * (yMax - yMin);
			const viewbox = `${x} ${y} ${width} ${height}`;
			SVG.setAttribute("viewBox", viewbox);
			SVG.setAttribute("SVG-Replacer", "true");
		} else {
			SVG.setAttribute("SVG-Ignore", "true");
		}
	}
}

/**
 * Replaces all oldPaths in an SVG with newPaths.
 * @param {string} newPath New d attribute of a path.
 * @param {string} oldPath Old d attribute of a path.
 * @param {SVGElement} SVG The SVG element.
 * @return {boolean} True if some paths have been changed.
 */
function replacePaths(newPath, oldPath, SVG) {
	let path_changed = false;
	for (let svgg of SVG.children) {
		if (svgg.nodeName === "g") {
			path_changed = replacePaths(newPath, oldPath, svgg);
		} else if (svgg.nodeName === "path") {
			if (svgg.getAttribute("d") === oldPath) {
				path_changed = true;
				svgg.setAttribute("d", newPath);
			}
		}
	}
	return path_changed;
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

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {sendResponse(collectPaths())});

/**
 * Collects SVG paths on the website.
 * @returns Object containing SVG paths as keys.
 */
function collectPaths() {
	let SVGs = document.getElementsByTagName("svg");
	let paths = {};
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
	for (let SVG of SVGs) {
		if (SVG.getAttribute("SVG-Replacer")) continue;
		getPaths(SVG);
	}
	return paths;
}
