/* 
Data structure:
pref = {
	"www.youtube.com": { //pref_domain
		//innerHTML of svg tag (SVGContent)
		"<path>...</path>": "<path>...</path>",
		"<path>...</path>": "<path>...</path>"
	},
	"www.example.com": {
		"<path>...</path>": "<path>...</path>",
		"<g>...</g>": "<g>...</g>"
	}
} */

let collect_SVG = document.getElementById("collect_SVG");
let block_info = document.getElementById("block_info");
let open_settings = document.getElementById("open_settings");

open_settings.onclick = () => browser.runtime.openOptionsPage();

browser.tabs.query({ active: true, currentWindow: true }, tabs => {
	let url = tabs[0].url;
	let id = tabs[0].id;
	if (url.startsWith("http:") || url.startsWith("https:")) {
		block_info.parentElement.hidden = true;
		collect_SVG.parentElement.hidden = false;
		collect_SVG.onclick = () => {
			browser.tabs.executeScript(id, { file: "collect_SVG.js" }).then(
				SVGContentCollection => storeSVG(url, SVGContentCollection[0])
			);
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
 * @param {object} SVGContentCollection 
 */
function storeSVG(url, SVGContentCollection) {
	browser.storage.local.get(pref => {
		let domain = url.split(/\/|\?/)[2];
		let pref_domain = Object.assign({}, pref[domain]);
		for (let SVGContent in SVGContentCollection) {
			if (!pref_domain[SVGContent]) pref_domain[SVGContent] = "";
		}
		pref[domain] = pref_domain;
		browser.storage.local.set(pref);
	});
}