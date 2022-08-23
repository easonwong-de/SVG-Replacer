/* 
Data structure:
pref = {
	"www.youtube.com": { //pref_domain
		//innerHTML of svg tag (SVGContent)
		"path d": "null",
		"path d": "path d"
	},
	"www.example.com": {
		"path d": "path d",
		"path d": "null"
	}
} */

let collect_SVG = document.getElementById("collect_SVG");
let block_info = document.getElementById("block_info");
let open_settings = document.getElementById("open_settings");

open_settings.onclick = () => {
	browser.runtime.openOptionsPage();
	window.close();
}

browser.tabs.query({ active: true, currentWindow: true }, tabs => {
	let url = tabs[0].url;
	let id = tabs[0].id;
	let title = tabs[0].title;
	if (url.startsWith("http:")
		|| url.startsWith("https:")
		|| (url.startsWith("file:") && !(url.endsWith(".pdf") || title.endsWith(".pdf")))
	) {
		block_info.parentElement.hidden = true;
		collect_SVG.parentElement.hidden = false;
		collect_SVG.onclick = () => {
			browser.tabs.executeScript(id, { file: "collect_SVG.js" }).then(paths => {
				if (url.startsWith("http:") || url.startsWith("https:")) {
					domain = url.split(/\/|\?/)[2];
					storeSVG(domain, paths[0]);
				} else {
					storeSVG(title, paths[0]);
				}
			});
		};
	} else {
		block_info.parentElement.hidden = false;
		collect_SVG.parentElement.hidden = true;
		collect_SVG.onclick = null;
	}
});

/**
 * 
 * @param {string} url 
 * @param {object} paths 
 */
function storeSVG(domain, paths) {
	browser.storage.local.get(pref => {
		let pref_cache_domain = Object.assign({}, pref[domain]);
		for (let path in paths) {
			if (pref_cache_domain[path] == null) pref_cache_domain[path] = "null";
		}
		pref[domain] = pref_cache_domain;
		browser.storage.local.set(pref).then(() => window.close());
	});
}