chrome.runtime.onMessage.addListener(function(request, sender) {
	if (request.action == "getSource") {
		message.innerText = request.source;
	}
});

// Your use of the YouTube API must comply with the Terms of Service:
// https://developers.google.com/youtube/terms

// Helper function to display JavaScript value on HTML page.
function showResponse(response) {
	var responseString = JSON.stringify(response, '', 2);
	document.getElementById('response').innerHTML += responseString;
}

// Called automatically when JavaScript client library is loaded.
function onWindowLoad() {
	gapi.client.load('youtube', 'v3', onYouTubeApiLoad);
}

// Called automatically when YouTube API interface is loaded (see line 9).
function onYouTubeApiLoad() {
	gapi.client.setApiKey(apiKey);
	search();
}

function search() {
	// Use the JavaScript client library to create a search.list() API call.
	var request = gapi.client.youtube.search.list({
		part: 'snippet',
		relevanceLanguage: "EN",
		regionCode: "US",
		maxResults: "50",
		fields: "items(id/videoId,snippet/title)",
		q: "tag"
		
	});

	// Send the request to the API server,
	// and invoke onSearchRepsonse() with the response.
	request.execute(onSearchResponse);
}

// Called automatically with the response of the YouTube API request.
function onSearchResponse(response) {
	showResponse(response);
}



window.onload = onWindowLoad;
