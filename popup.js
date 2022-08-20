let collect_svg = document.getElementById("collect_svg");

collect_svg.onclick = () => {
	browser.tabs.query({ active: true, currentWindow: true }, tabs => {
		let url = tabs[0].url;
		let id = tabs[0].id;
		if (url.startsWith("http:") || url.startsWith("https:")) {
			browser.tabs.executeScript(id, { file: "collect_svg.js" }).then(svgCollection => {
				
			});
		} else {
			pp_info_display.innerHTML = "This page is protected by browser";
		}
	});
};