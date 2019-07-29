// YOU NEED TO EDIT THIS: https://console.developers.google.com/projectselector/apis/credentials?pli=1&supportedpurview=project
var apiKey = "x";

chrome.extension.onConnect.addListener(function(port) {
	port.onMessage.addListener(function(message) {
		fetch("https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&q=" + message.q + "&regionCode=US&relevanceLanguage=EN&fields=items(id%2FvideoId%2Csnippet%2Ftitle)&key=" + apiKey).then(r => r.text()).then(result => {
			message.result = result;
			port.postMessage(message);
		});
	});
})