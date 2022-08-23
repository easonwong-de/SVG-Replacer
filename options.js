var pref_cache = {};
var domain_cache = "";
var SVG_cache = { r: 0, c: 0 };

let loading = document.getElementById("loading");
let main = document.getElementById("main");
let domain_selector = document.getElementById("domain_selector");
let delete_domain_button = document.getElementById("delete_domain");
let svg_table = document.getElementById("svg_table");
let old_svg_display = document.getElementById("original_svg");
let new_svg_display = document.getElementById("target_svg");
let old_path_textarea = document.getElementById("original_text");
let new_path_textarea = document.getElementById("target_text");
let save_svg_button = document.getElementById("save_svg");
let restore_svg_button = document.getElementById("delete_svg");
let import_button = document.getElementById("import");
let export_button = document.getElementById("export");

browser.storage.onChanged.addListener(load);

delete_domain_button.onclick = () => {
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

save_svg_button.onclick = () => {
	if (selectedDomain() && selectedSVG()) {
		if (old_path_textarea.value === new_path_textarea.value) {
			pref_cache[selectedDomain()][old_path_textarea.value] = "null";
			selectedSVG().classList.remove("edited");
		} else {
			pref_cache[selectedDomain()][old_path_textarea.value] = new_path_textarea.value;
			selectedSVG().classList.add("edited");
		}
		browser.storage.local.set(pref_cache);
	}
}

restore_svg_button.onclick = () => {
	if (selectedDomain() && selectedSVG()) {
		new_svg_display.innerHTML = old_svg_display.innerHTML;
		pref_cache[selectedDomain()][old_path_textarea.value] = "null";
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
	for (let path in pref_cache[domain]) {
		let current_cell = current_row.insertCell();
		if (pref_cache[domain][path] != "null") {
			current_cell.innerHTML = `<svg><path d="${pref_cache[domain][path]}"></path></svg>`;
			current_cell.classList.add("edited");
		} else {
			current_cell.innerHTML = `<svg><path d="${path}"></path></svg>`;
		}
		current_cell.onclick = () => {
			if (selectedSVG()) selectedSVG().classList.remove("selected");
			current_cell.classList.add("selected");
			loadSVGToEditor(path);
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
	old_svg_display.innerHTML = "";
	old_path_textarea.value = "";
	new_svg_display.innerHTML = "";
	new_path_textarea.value = "";
}

function selectedDomain() {
	return domain_selector.selectedIndex === -1 ? false : domain_selector.options[domain_selector.selectedIndex].text;
}

function selectedSVG() {
	return document.getElementsByClassName("selected")[0];
}

function loadSVGToEditor(oldPath) {
	old_svg_display.innerHTML = `<svg><path d="${oldPath}"></path></svg>`;
	old_path_textarea.value = oldPath;
	let newPath = pref_cache[selectedDomain()][oldPath];
	if (newPath === "null") {
		new_svg_display.innerHTML = `<svg><path d="${oldPath}"></path></svg>`;
		new_path_textarea.value = oldPath;
	} else {
		new_svg_display.innerHTML = `<svg><path d="${newPath}"></path></svg>`;
		new_path_textarea.value = newPath;
	}
	autoScaleSVGInSquare(old_svg_display.firstChild);
	autoScaleSVGInSquare(new_svg_display.firstChild);
}

function autoScaleAllSVG() {
	let SVGs = document.getElementsByTagName("svg");
	for (let SVG of SVGs) {
		autoScaleSVGInSquare(SVG);
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