var pref_cache = {};
var domain_cache = "";
var SVG_cache = { r: 0, c: 0 };

let loading = document.getElementById("loading");
let main = document.getElementById("main");
let domain_selector = document.getElementById("domain_selector");
let delete_domain = document.getElementById("delete_domain");
let svg_table = document.getElementById("svg_table");
let original_svg = document.getElementById("original_svg");
let target_svg = document.getElementById("target_svg");
let original_text = document.getElementById("original_text");
let target_text = document.getElementById("target_text");
let save_svg = document.getElementById("save_svg");
let delete_svg = document.getElementById("delete_svg");
let import_button = document.getElementById("import");
let export_button = document.getElementById("export");

browser.storage.onChanged.addListener(load);

delete_domain.onclick = () => {
	if (selectedDomain()) {
		SVG_cache = { r: 0, c: 0 };
		delete pref_cache[selectedDomain()];
		browser.storage.local.clear();
		browser.storage.local.set(pref_cache).then(load);
	}
}

domain_selector.onchange = () => {
	SVG_cache = { r: 0, c: 0 };
	loadSVGs();
};

save_svg.onclick = () => {
	if (selectedDomain() && selectedSVG()) {
		if (original_text.value === target_text.value) {
			pref_cache[selectedDomain()][original_text.value] = "null";
			selectedSVG().classList.remove("edited");
		} else {
			pref_cache[selectedDomain()][original_text.value] = target_text.value;
			selectedSVG().classList.add("edited");
		}
		browser.storage.local.set(pref_cache);
	}
}

delete_svg.onclick = () => {
	if (selectedDomain() && selectedSVG()) {
		target_svg.value = original_svg.value;
		pref_cache[selectedDomain()][original_text.value] = "null";
		selectedSVG().classList.remove("edited");
		browser.storage.local.set(pref_cache);
	}
}

import_button.onchange = () => {
	SVG_cache = { r: 0, c: 0 };
	var fileReader = new FileReader();
	fileReader.onload = () => {
		let import_pref = JSON.parse(fileReader.result);
		browser.storage.local.set(import_pref);
		for (let domain in import_pref) {
			if (typeof import_pref[domain] != "object") return false;
		}
	};
	fileReader.readAsText(import_button.files[0]);
}

export_button.onclick = () => {
	browser.storage.local.get(pref => {
		let export_pref = pref;
		for (let domain in export_pref) {
			for (let oldSVG in export_pref[domain]) {
				if (export_pref[domain][oldSVG] == "null")
					delete export_pref[domain][oldSVG];
			}
		}
		download(JSON.stringify(export_pref, null, 2), "SVG-Replacer_pref.json", "application/json");
	});
}

function load() {
	browser.storage.local.get(pref => {
		pref_cache = pref;
		if (selectedDomain()) domain_cache = selectedDomain();
		domain_selector.innerHTML = null;
		Object.keys(pref).forEach(domain => {
			let option = document.createElement("option");
			option.text = domain;
			domain_selector.add(option);
		});
		//finds the selected domain before
		if (domain_cache != "") {
			for (let i = 0; i < domain_selector.options.length; i++) {
				if (domain_selector.options[i].text === domain_cache) {
					domain_selector.selectedIndex = i;
					break;
				}
			}
		}
		loadSVGs();
	});
}

function loadSVGs() {
	clearSVGs();
	let domain = selectedDomain();
	let cell_count = 0;
	let current_row = svg_table.insertRow();
	for (let SVGContent in pref_cache[domain]) {
		let current_cell = current_row.insertCell();
		if (pref_cache[domain][SVGContent] != "null") {
			current_cell.innerHTML = `<svg>${pref_cache[domain][SVGContent]}</svg>`;
			current_cell.classList.add("edited");
		} else {
			current_cell.innerHTML = `<svg>${SVGContent}</svg>`;
		}
		current_cell.onclick = () => {
			if (selectedSVG()) selectedSVG().classList.remove("selected");
			current_cell.classList.add("selected");
			loadSVGToEditor(SVGContent);
			SVG_cache.r = current_cell.parentNode.rowIndex;
			SVG_cache.c = current_cell.cellIndex;
		};
		if (cell_count++ == 7) {
			cell_count = 0;
			current_row = svg_table.insertRow();
		}
	}
	//finds the SVG selected before
	if (svg_table.firstChild.children[SVG_cache.r] && svg_table.firstChild.children[SVG_cache.r].children[SVG_cache.c])
		svg_table.firstChild.children[SVG_cache.r].children[SVG_cache.c].click();
	autoScaleAllSVG();
}

function clearSVGs() {
	svg_table.innerHTML = "";
	original_svg.innerHTML = "";
	original_text.value = "";
	target_svg.innerHTML = "";
	target_text.value = "";
}

function selectedDomain() {
	return domain_selector.selectedIndex === -1 ? false : domain_selector.options[domain_selector.selectedIndex].text;
}

function selectedSVG() {
	return document.getElementsByClassName("selected")[0];
}

function loadSVGToEditor(originalSVG) {
	original_svg.innerHTML = `<svg>${originalSVG}</svg>`;
	original_text.value = originalSVG;
	let replacementSVG = pref_cache[selectedDomain()][originalSVG];
	if (replacementSVG === "null") {
		target_svg.innerHTML = `<svg>${originalSVG}</svg>`;
		target_text.value = originalSVG;
	} else {
		target_svg.innerHTML = `<svg>${replacementSVG}</svg>`;
		target_text.value = replacementSVG;
	}
	autoScaleSVGInSquare(original_svg.firstChild);
	autoScaleSVGInSquare(target_svg.firstChild);
}

function autoScaleAllSVG() {
	let SVGCollection = document.getElementsByTagName("svg");
	for (let SVGElement of SVGCollection) {
		autoScaleSVGInSquare(SVGElement);
	}
}

/**
 * @author Nick Scialli
 * @param {SVGElement} SVG 
 */
function autoScaleSVGInSquare(SVG) {
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

/**
 * @author Kanchu
 */
function download(data, filename, type) {
	var file = new Blob([data], { type: type });
	if (window.navigator.msSaveOrOpenBlob) // IE10+
		window.navigator.msSaveOrOpenBlob(file, filename);
	else { // Others
		var a = document.createElement("a"),
			url = URL.createObjectURL(file);
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		setTimeout(function () {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		}, 0);
	}
}

load();