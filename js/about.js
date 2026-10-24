function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	const tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});

	const setTextByClass = function(className, value) {
		document.querySelectorAll('.' + className).forEach(function(element) {
			element.textContent = value;
		});
	};
	const percentage = function(count, total) {
		return total === 0 ? '0.00%' : ((count / total) * 100).toFixed(2) + '%';
	};

	const categoryCounts = {
		completed_event: 0,
		live_event: 0,
		achievement: 0,
		miscellaneous: 0
	};
	tweet_array.forEach(function(tweet) {
		categoryCounts[tweet.source] += 1;
	});

	const completedTweets = tweet_array.filter(function(tweet) {
		return tweet.source === 'completed_event';
	});
	const writtenTweets = completedTweets.filter(function(tweet) {
		return tweet.written;
	});
	const dateOptions = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	};
	const dates = tweet_array.map(function(tweet) {
		return tweet.time;
	});
	const firstDate = new Date(Math.min.apply(null, dates));
	const lastDate = new Date(Math.max.apply(null, dates));

	document.getElementById('numberTweets').textContent = tweet_array.length;
	document.getElementById('firstDate').textContent = firstDate.toLocaleDateString('en-US', dateOptions);
	document.getElementById('lastDate').textContent = lastDate.toLocaleDateString('en-US', dateOptions);
	setTextByClass('completedEvents', categoryCounts.completed_event);
	setTextByClass('completedEventsPct', percentage(categoryCounts.completed_event, tweet_array.length));
	setTextByClass('liveEvents', categoryCounts.live_event);
	setTextByClass('liveEventsPct', percentage(categoryCounts.live_event, tweet_array.length));
	setTextByClass('achievements', categoryCounts.achievement);
	setTextByClass('achievementsPct', percentage(categoryCounts.achievement, tweet_array.length));
	setTextByClass('miscellaneous', categoryCounts.miscellaneous);
	setTextByClass('miscellaneousPct', percentage(categoryCounts.miscellaneous, tweet_array.length));
	setTextByClass('written', writtenTweets.length);
	setTextByClass('writtenPct', percentage(writtenTweets.length, completedTweets.length));
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});
