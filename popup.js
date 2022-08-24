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

let block_info = document.getElementById("block_info");
let collect_SVG_buton = document.getElementById("collect_SVG");
let open_settings_button = document.getElementById("open_settings");

open_settings_button.onclick = () => {
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
		collect_SVG_buton.parentElement.hidden = false;
		collect_SVG_buton.onclick = () => {
			browser.tabs.sendMessage(id, {}, paths => {
				if (url.startsWith("http:") || url.startsWith("https:")) {
					domain = url.split(/\/|\?/)[2];
					storeSVG(domain, paths);
				} else {
					storeSVG(title, paths);
				}
			});
		};
	} else {
		block_info.parentElement.hidden = false;
		collect_SVG_buton.parentElement.hidden = true;
		collect_SVG_buton.onclick = null;
	}
});

/**
 * Stores a path replacement rule under the domain.
 * @param {string} domain The domain.
 * @param {object} paths The path replacement rules.
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