document.addEventListener('DOMContentLoaded', function() {
    var saveButton = document.getElementById('saveButton');
    var apiKeyInput = document.getElementById('apiKeyInput');
	var removeShortsCheckbox = document.getElementById('removeShortsCheckbox');

    // Retrieve the settings from Chrome storage
    chrome.storage.sync.get(['apiKey', 'remove_shorts_player'], function(data) {
		// Set the state of the apiKey input box
        var apiKey = data.apiKey;
        if (apiKey) {
            apiKeyInput.value = apiKey;
        }

		// Set the state of the shorts enabled checkbox
		var shortsPlayerEnabled = data.remove_shorts_player;
		if (shortsPlayerEnabled) {
			removeShortsCheckbox.checked = true;
		} else {
			removeShortsCheckbox.checked = false;
		}
    });

    saveButton.addEventListener('click', function() {
        var apiKey = apiKeyInput.value;
		// Save the API key to Chrome storage
        chrome.storage.sync.set({ 'apiKey': apiKey }, function() {});
    });

	// Listen for changes to the shorts enabled checkbox and save the state to Chrome storage
	removeShortsCheckbox.addEventListener('change', function() {
		chrome.storage.sync.set({ 'remove_shorts_player': this.checked }, function() {});
	});
});
