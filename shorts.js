if (window.location.href.indexOf("/shorts/") > -1) {
    // Retrieve the settings from Chrome storage
    chrome.storage.sync.get(['remove_shorts_player'], function(data) {
        // Set the state of the shorts enabled checkbox
        var shortsPlayerEnabled = data.remove_shorts_player;
        console.log("shorts enabled?", shortsPlayerEnabled);

        if (shortsPlayerEnabled) {
            var url = window.location.href;
            var id = url.split("shorts/").pop();
            var newurl = "https://www.youtube.com/watch?v=" + id;
            open(newurl, "_self");
        }
    });
}

let lastUrl = location.href;
new MutationObserver(() => {
    const urlx = location.href;
    if (urlx !== lastUrl) {
        lastUrl = urlx;
        onUrlChange();
    }
})
.observe(document, {
    subtree: true,
    childList: true
});

function onUrlChange() {
    if (window.location.href.indexOf("/shorts/") > -1) {
        var url = window.location.href;
        var id = url.split("shorts/").pop();
        var newurl = "https://www.youtube.com/watch?v=" + id;
        open(newurl, "_self");
    }
}