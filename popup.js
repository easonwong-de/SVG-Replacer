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

let collect_SVG_button = document.getElementById("collect_SVG");

browser.tabs.query({ active: true, currentWindow: true }, tabs => {
	let url = tabs[0].url;
	let id = tabs[0].id;
	if (url.startsWith("http:") || url.startsWith("https:")) {
		collect_SVG_button.disabled = false;
		collect_SVG_button.onclick = () => {
			browser.tabs.executeScript(id, { file: "collect_SVG.js" }).then(SVGContentCollection => storeSVG(url, SVGContentCollection[0]));
		};
	} else {
		collect_SVG_button.disabled = true;
		collect_SVG_button.onclick = null;
		console.log("This page is protected by browser");
	}
});

/**
 * 
 * @param {string} url 
 * @param {object} SVGContentCollection 
 */
function storeSVG(url, SVGContentCollection) {
	let pref_domain = {};
	let domain = url.split(/\/|\?/)[2];
	browser.storage.local.get(pref => {
		for (let SVGContent in SVGContentCollection) {
			if (!pref_domain[SVGContent]) pref_domain[SVGContent] = "";
		}
		pref[domain] = pref_domain;
		browser.storage.local.set(pref);
	});
}