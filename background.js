// Listen for connections from the connected port
chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(message) {
        chrome.storage.sync.get('apiKey', function(data) {
            var apiKey = data.apiKey;
            // Make a fetch request to the YouTube API with the provided query and API key
            fetch("https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&q=" + message.q + "&regionCode=US&relevanceLanguage=EN&fields=items(id%2FvideoId%2Csnippet%2Ftitle)&key=" + apiKey)
                .then(r => r.text())
                .then(result => {
                    message.result = result; // Store the fetched result in the message object
                    port.postMessage(message); // Send the message containing the result back through the port
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
        });
    });
});