let writtenTweets = [];

function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	writtenTweets = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	}).filter(function(tweet) {
		return tweet.written;
	});

	updateSearchResults();
}

function addEventHandlerForSearch() {
	document.getElementById('textFilter').addEventListener('input', updateSearchResults);
}

function updateSearchResults() {
	const searchBox = document.getElementById('textFilter');
	const searchText = searchBox.value.trim();
	const tableBody = document.getElementById('tweetTable');
	document.getElementById('searchText').textContent = searchText;

	if (searchText.length === 0) {
		document.getElementById('searchCount').textContent = '0';
		tableBody.innerHTML = '';
		return;
	}

	const normalizedSearch = searchText.toLowerCase();
	const matches = writtenTweets.filter(function(tweet) {
		return tweet.writtenText.toLowerCase().includes(normalizedSearch);
	});

	document.getElementById('searchCount').textContent = matches.length;
	tableBody.innerHTML = matches.map(function(tweet, index) {
		return tweet.getHTMLTableRow(index + 1);
	}).join('');
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	addEventHandlerForSearch();
	loadSavedRunkeeperTweets().then(parseTweets);
});
