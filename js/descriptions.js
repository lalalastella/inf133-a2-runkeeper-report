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
	document.getElementById('clearSearch').addEventListener('click', function() {
		const searchBox = document.getElementById('textFilter');
		searchBox.value = '';
		searchBox.focus();
		updateSearchResults();
	});
}

function updateSearchResults() {
	const searchBox = document.getElementById('textFilter');
	const searchText = searchBox.value.trim();
	const tableBody = document.getElementById('tweetTable');
	const clearButton = document.getElementById('clearSearch');
	const emptyState = document.getElementById('searchEmptyState');
	document.getElementById('searchText').textContent = searchText;
	clearButton.disabled = searchText.length === 0;

	if (searchText.length === 0) {
		document.getElementById('searchCount').textContent = '0';
		tableBody.innerHTML = '';
		emptyState.textContent = 'Start typing to explore user-written Tweets.';
		emptyState.hidden = false;
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
	emptyState.textContent = matches.length === 0 ? 'No matching Tweets. Try a shorter or different word.' : '';
	emptyState.hidden = matches.length > 0;
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	addEventHandlerForSearch();
	loadSavedRunkeeperTweets().then(parseTweets);
});
