function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}
	
	const tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});

	const completedActivityTweets = tweet_array.filter(function(tweet) {
		return tweet.source === 'completed_event' && tweet.activityType !== 'unknown';
	});
	const distanceTweets = completedActivityTweets.filter(function(tweet) {
		return Number.isFinite(tweet.distance) && tweet.distance > 0;
	});
	const activityCounts = {};
	completedActivityTweets.forEach(function(tweet) {
		activityCounts[tweet.activityType] = (activityCounts[tweet.activityType] || 0) + 1;
	});

	const activityData = Object.keys(activityCounts).map(function(activityType) {
		return { activityType: activityType, count: activityCounts[activityType] };
	}).sort(function(a, b) {
		return b.count - a.count;
	});
	const topActivities = activityData.slice(0, 3).map(function(activity) {
		return activity.activityType;
	});

	document.getElementById('numberActivities').textContent = activityData.length;
	document.getElementById('firstMost').textContent = topActivities[0] || 'unknown';
	document.getElementById('secondMost').textContent = topActivities[1] || 'unknown';
	document.getElementById('thirdMost').textContent = topActivities[2] || 'unknown';

	const topActivityTweets = distanceTweets.filter(function(tweet) {
		return topActivities.includes(tweet.activityType);
	});
	const averageDistances = topActivities.map(function(activityType) {
		const matchingTweets = topActivityTweets.filter(function(tweet) {
			return tweet.activityType === activityType;
		});
		const totalDistance = matchingTweets.reduce(function(total, tweet) {
			return total + tweet.distance;
		}, 0);
		return {
			activityType: activityType,
			average: matchingTweets.length === 0 ? 0 : totalDistance / matchingTweets.length
		};
	}).sort(function(a, b) {
		return b.average - a.average;
	});

	document.getElementById('longestActivityType').textContent = averageDistances.length ? averageDistances[0].activityType : 'unknown';
	document.getElementById('shortestActivityType').textContent = averageDistances.length ? averageDistances[averageDistances.length - 1].activityType : 'unknown';

	const weekdayWeekend = topActivityTweets.reduce(function(result, tweet) {
		const day = tweet.time.getDay();
		const period = day === 0 || day === 6 ? 'weekends' : 'weekdays';
		result[period].total += tweet.distance;
		result[period].count += 1;
		return result;
	}, {
		weekdays: { total: 0, count: 0 },
		weekends: { total: 0, count: 0 }
	});
	const weekdayAverage = weekdayWeekend.weekdays.count ? weekdayWeekend.weekdays.total / weekdayWeekend.weekdays.count : 0;
	const weekendAverage = weekdayWeekend.weekends.count ? weekdayWeekend.weekends.total / weekdayWeekend.weekends.count : 0;
	document.getElementById('weekdayOrWeekendLonger').textContent = weekendAverage > weekdayAverage ? 'weekends' : 'weekdays';

	const activityVisSpec = {
	  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
	  "description": "A graph of the number of Tweets containing each type of activity.",
	  "data": {
	    "values": activityData
	  },
	  "mark": "bar",
	  "encoding": {
		"x": {"field": "activityType", "type": "nominal", "sort": "-y", "title": "Activity type"},
		"y": {"field": "count", "type": "quantitative", "title": "Number of Tweets"},
		"tooltip": [
		  {"field": "activityType", "type": "nominal", "title": "Activity"},
		  {"field": "count", "type": "quantitative", "title": "Tweets"}
		]
	  }
	};
	vegaEmbed('#activityVis', activityVisSpec, {actions:false});

	const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const distanceData = topActivityTweets.map(function(tweet) {
		return {
			activityType: tweet.activityType,
			distance: tweet.distance,
			dayOfWeek: dayOrder[tweet.time.getDay()]
		};
	});
	const commonEncoding = {
		x: {field: 'dayOfWeek', type: 'ordinal', sort: dayOrder, title: 'Day of week'},
		color: {field: 'activityType', type: 'nominal', title: 'Activity type'}
	};
	const distanceVisSpec = {
		$schema: 'https://vega.github.io/schema/vega-lite/v5.json',
		description: 'Distances of the three most common activities by day of the week.',
		data: {values: distanceData},
		mark: {type: 'point', opacity: 0.3},
		encoding: {
			x: commonEncoding.x,
			y: {field: 'distance', type: 'quantitative', title: 'Distance (miles)'},
			color: commonEncoding.color,
			tooltip: [
				{field: 'activityType', type: 'nominal', title: 'Activity'},
				{field: 'dayOfWeek', type: 'ordinal', title: 'Day'},
				{field: 'distance', type: 'quantitative', title: 'Miles', format: '.2f'}
			]
		}
	};
	const distanceVisAggregatedSpec = {
		$schema: 'https://vega.github.io/schema/vega-lite/v5.json',
		description: 'Mean distances of the three most common activities by day of the week.',
		data: {values: distanceData},
		mark: 'bar',
		encoding: {
			x: commonEncoding.x,
			xOffset: {field: 'activityType'},
			y: {aggregate: 'mean', field: 'distance', type: 'quantitative', title: 'Mean distance (miles)'},
			color: commonEncoding.color,
			tooltip: [
				{field: 'activityType', type: 'nominal', title: 'Activity'},
				{field: 'dayOfWeek', type: 'ordinal', title: 'Day'},
				{aggregate: 'mean', field: 'distance', type: 'quantitative', title: 'Mean miles', format: '.2f'}
			]
		}
	};

	vegaEmbed('#distanceVis', distanceVisSpec, {actions:false});
	vegaEmbed('#distanceVisAggregated', distanceVisAggregatedSpec, {actions:false});

	const rawChart = document.getElementById('distanceVis');
	const aggregatedChart = document.getElementById('distanceVisAggregated');
	const aggregateButton = document.getElementById('aggregate');
	let showingMeans = false;
	aggregatedChart.style.display = 'none';
	aggregateButton.addEventListener('click', function() {
		showingMeans = !showingMeans;
		rawChart.style.display = showingMeans ? 'none' : 'block';
		aggregatedChart.style.display = showingMeans ? 'block' : 'none';
		aggregateButton.textContent = showingMeans ? 'Show individual activities' : 'Show means';
	});
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});
