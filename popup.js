document.addEventListener('DOMContentLoaded', function() {
    var saveButton = document.getElementById('saveButton');
    var apiKeyInput = document.getElementById('apiKeyInput');

    // Retrieve the API key from Chrome storage
    chrome.storage.sync.get('apiKey', function(data) {
        var apiKey = data.apiKey;
        if (apiKey) {
            apiKeyInput.value = apiKey;
        }
    });

    saveButton.addEventListener('click', function() {
        var apiKey = apiKeyInput.value;
		// Save the API key to Chrome storage
        chrome.storage.sync.set({ 'apiKey': apiKey }, function() {});
    });
});