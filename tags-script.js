// YOU NEED TO EDIT THIS: https://console.developers.google.com/projectselector/apis/credentials?pli=1&supportedpurview=project
var apiKey = "";

// YouTube™ utilizes the history.pushState() API to navigate to/between videos. Content scripts
// do not run again after a history state change. To work around that, this content script keeps
// running to periodically check if a new video was loaded.
// 
// I've considered using the webNavigation API, but that requires a browser-wide "Access your
// browsing activity" permission. That's just not very user-friendly.

function httpGetAsync(theUrl, i, callback) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() { 
	if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
		callback(xmlHttp.responseText, i);
	}
	xmlHttp.open("GET", theUrl, true); // true for asynchronous 
	xmlHttp.send(null);
}

(function () {
	var IS_MATERIAL = document.body.id !== 'body';

	// "Material" refers to YouTube™'s new "material design" layout, which currently seems to
	// be in beta. To enable it, open youtube.com and run this via the Developer Console (F12):
	//
	// document.cookie="PREF=f6=4;path=/;domain=.youtube.com";

	var UPDATE_INTERVAL = IS_MATERIAL ? 100 : 500;

	// Updates run more frequently in the material design layout: its UI works differently, making
	// delays a lot more noticeable. Updates are very lightweight anyhow. Just a check if the URL
	// has changed, if it hasn't, nothing else happens.

	var TAG_ELEMENT_STYLE = "display: inline-block;"
		+ "padding-top: 4px;"
		+ "padding-bottom: 4px;"
		+ "padding-right: 15px;"
		+ "font-size: 1.4rem;"
		+ "color: var(--yt-primary-text-color);";

	var OUTPUT_ELEMENT_ID = "TFYT_OUTPUT";
	var OUTPUT_ELEMENT_STYLE_OLD = "float: left; width: 70%;";
	var MATERIAL_MORE_BUTTON_SELECTOR = "#meta paper-button#more";
	var MATERIAL_LESS_BUTTON_SELECTOR = "#meta paper-button#less";
	var MATERIAL_LINK_ELEMENT_STYLE = "text-decoration: none;"
		+ "color: hsl(206.1, 79.3%, 52.7%);"
		+ "cursor: pointer;"
		+ "display: inline-block";

	var lastPageUrl = null;
	var youtubeSearchData = [];
	var ranks = [];
	var tagsInShowMore = false;

	/**
	 * Returns `true` if the current page is a YouTube™ video page.
	 */
	function isVideoPage() {
		return location.href.indexOf("/watch") !== -1;
	}

	/**
	 * Returns `true` if the user has navigated to a new page since the last update.
	 */
	function hasNavigated() {
		return location.href !== lastPageUrl;
	}

	/**
	 * Runs periodically. Updates the video tags if needed.
	 */
	function update() {
		if (isVideoPage() && hasNavigated()) {
			youtubeSearchData = [];
			ranks = [];
			lastPageUrl = location.href;
			loadTagsHtml(function (html) {
				var tags = parseTagsHtml(html);
				displayTags(tags);
			});
		}
	}

	/**
	 * Loads an HTML string containing the current video tags, buried somewhere in a JSON blob. 
	 */
	function loadTagsHtml(callback) {
		// When a video was loaded through AJAX, as opposed to navigating to it directly, the tags
		// are not present in the DOM. So yup, this script has to send a GET to the *current* URL,
		// and parse the tags from the HTML in the response.
		// So this might look silly...:

		var xhr = new XMLHttpRequest();
		xhr.open("GET", location.href, true);

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4 && xhr.status === 200) {
				callback(xhr.responseText);
			}
		};

		// ...but just using `document.body.innerHTML` or similar wouldn't work, the correct video
		// tags would not always be present. Could be a previously viewed video's tags, etc.

		xhr.send();
	}

	/**
	 * Parses the HTML loaded by `loadTagsHtml` and returns an array of tags.
	 */
	function parseTagsHtml(html) {

		function decode(tag) {
			// Decode escaped Unicode strings ("\u0123"):
			tag = tag.replace(/\\u([\d\w]{4})/gi, function (_, group) {
				return String.fromCharCode(parseInt(group, 16));
			});

			return decodeURIComponent(tag);
		}

		var match = /"keywords":\[(.*?)\]/.exec(html);

		if (match) {
			return match[1].split(",").map(decode).filter(function (tag) {
				return tag !== "";
			});
		}
		
		return ["ERROR"];
	}

	function setYouTubeData(jsonData, i) {
		youtubeSearchData[i] = jsonData;
	}

	/**
	 * Displays the given tags on the current video page.
	 */
	function displayTags(tags) {
		var outputElement = tryLoadOutputElement();

		if (!outputElement) {
			// The YouTube™ UI was probably not fully initialized yet, so the output element could
			// not be created. Either that, or they made a breaking change to the code. Wait a
			// moment and try again.
			//
			// Note: if the browser tab isn't currently open, the UI may not even get initialized
			// until it's (re)opened. That's why there's no limit to the number of retries.
			setTimeout(function () {
				displayTags(tags);
			}, 1000);

			return;
		}

		// (Re)set initial output element state
		// ====================================
		outputElement.innerHTML = "";

		if (IS_MATERIAL) {
			// Apply spacing ONLY if tags are present, so there's no large blank space in the page:
			outputElement.style.marginTop = tags.length > 0 ? "20px" : "0";
			outputElement.style.marginBottom = tags.length > 0 ? "10px" : "0";
			tryCollapseMaterialOutputElement(outputElement);
		}

		// Generate tag elements
		// =====================
		for (var i = 0; i < tags.length; i++) {
			var tag = tags[i];
			// get video tag rank data
			q = tag.replace(/\s+/g, '+');
			httpGetAsync(
				"https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&q=" + q + "&regionCode=US&relevanceLanguage=EN&fields=items(id%2FvideoId%2Csnippet%2Ftitle)&key=" + apiKey,
				i,
				setYouTubeData);
			generateRank(tag, i);

			// Create span:
			var tagElement = document.createElement("span");
			tagElement.setAttribute("style", TAG_ELEMENT_STYLE);
			outputElement.appendChild(tagElement);

			// Create a[href="/results?search_query={tag}"]:
			var linkElement = document.createElement("a");
			linkElement.setAttribute("target", "_blank");
			linkElement.setAttribute("href", "/results?search_query=" + encodeURIComponent(tag));
			linkElement.innerText = tag;
			tagElement.appendChild(linkElement);

			if (IS_MATERIAL) {
				linkElement.setAttribute("style", MATERIAL_LINK_ELEMENT_STYLE);
			}
		}
	}

	function generateRank(tag, id) {
		var video_id = window.location.search.split('v=')[1];
		var ampersandPosition = video_id.indexOf('&');

		if(ampersandPosition != -1) {
			video_id = video_id.substring(0, ampersandPosition);
		}

		if (youtubeSearchData[id]) {
			var lines = youtubeSearchData[id].split('\n');
			var idIndex = 1;
			var doesVideoRank = false;
			for (var j = 0; j < lines.length; j++) {
				if(lines[j].includes("title")) {
					idIndex++;
				}
				if (lines[j].includes(video_id)) {
					//console.log(tag + " ranks at pos " + idIndex);
					ranks[id] = idIndex;
					doesVideoRank = true;
				}
			}

			if (!doesVideoRank) {
				//console.log(tag + " does not rank in the top 50.")
				ranks[id] = "50+";
			}

			// get tags div
			var divobj = document.getElementById('TFYT_OUTPUT');
			// add rank to current tag
			//console.log(tag + " --> " + ranks[id]);
			divobj.innerHTML = divobj.innerHTML.replace(">" + tag + "</a>", (">" + tag + "</a> <a>" + ranks[id] + "</a>"));
		} else {
			setTimeout(function() {
				generateRank(tag, id);
			}, 1000);
		}
	}
	/**
	 * Attempts to load and return the tags output element. Returns `null` on failure.
	 */
	function tryLoadOutputElement() {
		var outputElement = document.getElementById(OUTPUT_ELEMENT_ID);

		if (outputElement) {
			return outputElement;
		}

		return IS_MATERIAL ? tryLoadMaterialOutputElement() : tryLoadOldOutputElement();
	}

	/**
	 * Attempts to create and return a tags output element in the material design layout.
	 */
	function tryLoadMaterialOutputElement() {
		if (tagsInShowMore) {
			var containerElement = document.querySelector("ytd-expander ytd-metadata-row-container-renderer");
		} else {
			var containerElement = document.querySelector("ytd-video-secondary-info-renderer");
		}

		if (!containerElement) {
			return null;
		}

		// The official video metadata elements are found in a "#container" element, which can be
		// expanded/collapsed with buttons. Ideally, the tags would be inside this collapsible
		// element, and everything would work as intended out of the box.
		//
		// Unfortunately, the "#container" element isn't just hidden on collapse: all its child
		// elements are deleted from the DOM. This makes it impractical to place the tags inside 
		// that element - they'd be lost on collapse.
		//
		// The simplest workaround is just to place the tags in their own <div>...:

		var outputElement = document.createElement("div");
		outputElement.id = OUTPUT_ELEMENT_ID;
		containerElement.appendChild(outputElement);

		// ...and hook them up to the expand/collapse buttons separately:
		var showMoreButton = document.querySelector(MATERIAL_MORE_BUTTON_SELECTOR);
		var showLessButton = document.querySelector(MATERIAL_LESS_BUTTON_SELECTOR);
		if (showMoreButton && showLessButton && tagsInShowMore) {
			showMoreButton.addEventListener("click", function (e)  {
				outputElement.style.display = "block";
			});
			showLessButton.addEventListener("click", function (e) {
				outputElement.style.display = "none";
			});
		}
		
		return outputElement;
	}

	/**
	 * Attempts to create and return a tags output element in the old layout.
	 */
	function tryLoadOldOutputElement() {
		var containerElement = document.querySelector("ul.watch-extras-section");

		if (!containerElement) {
			return null;
		}

		// Create li.watch-meta-item > div.content:
		var outputElement = document.createElement("div");
		outputElement.id = OUTPUT_ELEMENT_ID;
		outputElement.className = "content";
		outputElement.setAttribute("style", OUTPUT_ELEMENT_STYLE_OLD);

		// Create li.watch-meta-item > h4.title:
		var titleElement = document.createElement("h4");
		titleElement.setAttribute("class", "title");
		titleElement.innerText = "Tags";

		// Create li.watch-meta-item:
		var tagsElement = document.createElement("li");
		tagsElement.className = "watch-meta-item yt-uix-expander-body";
		tagsElement.appendChild(titleElement);
		tagsElement.appendChild(outputElement);
		containerElement.appendChild(tagsElement);

		return outputElement;
	}

	/**
	 * Collapses the output element for the material design layout, if the YouTube™ UI allows it.
	 */
	function tryCollapseMaterialOutputElement(outputElement) {
		if(tagsInShowMore) {
			outputElement.style.display = "none";
		} else { 
			outputElement.style.display = "block";
		}

		// If a video has no metadata, its expand/collapse buttons are hidden, which would of
		// course prevent the user from viewing the tags that were collapsed by the line above.
		// 
		// Unfortunately, this only becomes apparent/definitive once the YouTube™ UI is fully
		// loaded up. Which isn't necessarily the case when this function runs. So the check below
		// is set up with a timeout. And repeated a few times for good measure.

		function expandIfButtonsAreHidden() {
			var showMoreButton = document.querySelector(MATERIAL_MORE_BUTTON_SELECTOR);
			var showLessButton = document.querySelector(MATERIAL_LESS_BUTTON_SELECTOR);

			if (showMoreButton.getAttribute("hidden") !== null
				&& showLessButton.getAttribute("hidden") !== null) {

				outputElement.style.display = "block";
			}
		}

		setTimeout(expandIfButtonsAreHidden, 500);
		setTimeout(expandIfButtonsAreHidden, 1000);
		setTimeout(expandIfButtonsAreHidden, 3000);
	}

	setInterval(update, UPDATE_INTERVAL);

}());
