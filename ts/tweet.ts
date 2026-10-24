class Tweet {
	private text:string;
	time:Date;

	constructor(tweet_text:string, tweet_time:string) {
        this.text = tweet_text;
		this.time = new Date(tweet_time);//, "ddd MMM D HH:mm:ss Z YYYY"
	}

	//returns either 'live_event', 'achievement', 'completed_event', or 'miscellaneous'
    get source():string {
        const normalizedText = this.text.trim().toLowerCase();

        if (normalizedText.startsWith("watch my") || normalizedText.includes("#rklive")) {
            return "live_event";
        }
        if (normalizedText.startsWith("achieved") || normalizedText.startsWith("i just set a goal")) {
            return "achievement";
        }
        if (normalizedText.startsWith("just completed") || normalizedText.startsWith("just posted")) {
            return "completed_event";
        }
        return "miscellaneous";
    }

    //returns a boolean, whether the text includes any content written by the person tweeting.
    get written():boolean {
        return this.extractWrittenText().length > 0;
    }

    get writtenText():string {
        return this.extractWrittenText();
    }

    get activityType():string {
        if (this.source != 'completed_event') {
            return "unknown";
        }
        const activityMatch = this.text.match(
            /^Just (?:completed|posted) a \d+(?:\.\d+)?\s+(?:km|mi)\s+(.+?)(?=\s+(?:with\s+@?Runkeeper|with\s+Runkeeper|-\s|in\s+\d|https?:\/\/|#Runkeeper|$))/i
        );
        if (activityMatch) {
            return activityMatch[1].trim().toLowerCase();
        }

        const timedActivityMatch = this.text.match(
            /^Just (?:completed|posted) an? (.+?) in \d+:\d+(?::\d+)?\b/i
        );
        return timedActivityMatch ? timedActivityMatch[1].trim().toLowerCase() : "unknown";
    }

    get distance():number {
        if(this.source != 'completed_event') {
            return 0;
        }
        const distanceMatch = this.text.match(
            /^Just (?:completed|posted) a (\d+(?:\.\d+)?)\s+(km|mi)\b/i
        );
        if (!distanceMatch) {
            return 0;
        }

        const distance = Number.parseFloat(distanceMatch[1]);
        return distanceMatch[2].toLowerCase() === "km" ? distance / 1.609 : distance;
    }

    // A lightweight bonus feature: label user-written text with a transparent
    // word-list heuristic rather than claiming the result is a full NLP model.
    get sentiment():string {
        if (!this.written) {
            return "Neutral";
        }

        const positiveWords = new Set([
            "amazing", "awesome", "best", "cool", "excellent", "fantastic",
            "fun", "good", "great", "happy", "love", "loved", "nice",
            "perfect", "proud", "strong", "wonderful", "yay"
        ]);
        const negativeWords = new Set([
            "awful", "bad", "brutal", "exhausted", "hard", "hate", "hated",
            "horrible", "hurt", "pain", "painful", "slow", "sore", "tired",
            "tough", "worst"
        ]);
        const words = this.writtenText.toLowerCase().match(/[a-z']+/g) || [];
        const score = words.reduce(function(total:number, word:string):number {
            if (positiveWords.has(word)) {
                return total + 1;
            }
            if (negativeWords.has(word)) {
                return total - 1;
            }
            return total;
        }, 0);

        if (score > 0) {
            return "Positive";
        }
        if (score < 0) {
            return "Negative";
        }
        return "Neutral";
    }

    getHTMLTableRow(rowNumber:number):string {
        const escapedActivity = this.escapeHTML(this.activityType);
        const escapedTweet = this.linkifyTweetText();
        const sentimentClass = "sentiment-" + this.sentiment.toLowerCase();

        return `<tr class="${sentimentClass}"><th scope="row">${rowNumber}</th><td><span class="activity-tag">${escapedActivity}</span></td><td>${this.sentiment}</td><td>${escapedTweet}</td></tr>`;
    }

    private linkifyTweetText():string {
        const urlPattern = /https?:\/\/[^\s]+/gi;
        let result = "";
        let previousIndex = 0;
        let match:RegExpExecArray | null;
        let linkNumber = 0;

        while ((match = urlPattern.exec(this.text)) !== null) {
            result += this.escapeHTML(this.text.slice(previousIndex, match.index));
            const escapedURL = this.escapeHTML(match[0]);
            linkNumber += 1;
            const linkLabel = linkNumber === 1 ? "Open activity ↗" : `Open link ${linkNumber} ↗`;
            result += `<a href="${escapedURL}" class="activity-link" target="_blank" rel="noopener noreferrer" aria-label="${linkLabel} in a new tab">${linkLabel}</a>`;
            previousIndex = match.index + match[0].length;
        }

        return result + this.escapeHTML(this.text.slice(previousIndex));
    }

    private extractWrittenText():string {
        let cleanedText = this.text
            .replace(/https?:\/\/[^\s]+/gi, "")
            .replace(/#Runkeeper\b/gi, "")
            .replace(/#RKLive\b/gi, "")
            .trim();

        if (this.source === "completed_event") {
            const separatorIndex = cleanedText.indexOf(" - ");
            if (separatorIndex === -1) {
                return "";
            }

            cleanedText = cleanedText.slice(separatorIndex + 3).trim();
            const normalizedComment = cleanedText.toLowerCase().replace(/\s+/g, " ");
            if (normalizedComment === "tomtom mysports watch") {
                return "";
            }
            return cleanedText;
        }

        // Live and achievement tweets are generated by RunKeeper templates.
        if (this.source === "live_event" || this.source === "achievement") {
            return "";
        }

        return cleanedText.replace(/\s+/g, " ").trim();
    }

    private escapeHTML(value:string):string {
        return value.replace(/[&<>"']/g, function(character:string):string {
            const entities:{[key:string]:string} = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;",
                "'": "&#039;"
            };
            return entities[character];
        });
    }
}
