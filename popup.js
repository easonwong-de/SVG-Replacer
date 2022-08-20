let collect_SVG = document.getElementById("collect_SVG");

browser.tabs.query({ active: true, currentWindow: true }, tabs => {
	let url = tabs[0].url;
	let id = tabs[0].id;
	if (url.startsWith("http:") || url.startsWith("https:")) {
		collect_SVG.disabled = false;
		collect_SVG.onclick = () => {
			browser.tabs.executeScript(id, { file: "collect_SVG.js" }).then(SVGCollection => storeSVG(url, SVGCollection));
		};
	} else {
		collect_SVG.disabled = true;
		console.log("This page is protected by browser");
	}
});

function storeSVG(url, SVGCollection) {
	let domain = url.split(/\/|\?/)[2];
	let domain_pref = {};
	domain_pref[domain] = "";
	browser.storage.local.set(domain_pref);
}

/* pref = {
	"www.youtube.com": {
		"<path>...</path>": "<path>...</path>",
		"<path>...</path>": "<path>...</path>",
	}
} */
