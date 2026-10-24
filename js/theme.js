(function() {
	const storageKey = 'runkeeper-report-theme';
	const savedTheme = window.localStorage.getItem(storageKey);
	const initialTheme = savedTheme === 'light' ? 'light' : 'dark';
	document.documentElement.dataset.theme = initialTheme;

	function updateToggle(button) {
		const isDark = document.documentElement.dataset.theme === 'dark';
		button.setAttribute('aria-pressed', String(isDark));
		button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
		button.querySelector('.theme-toggle-label').textContent = isDark ? 'Light' : 'Dark';
	}

	document.addEventListener('DOMContentLoaded', function() {
		const button = document.getElementById('themeToggle');
		if (!button) {
			return;
		}

		updateToggle(button);
		button.addEventListener('click', function() {
			const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
			document.documentElement.dataset.theme = nextTheme;
			window.localStorage.setItem(storageKey, nextTheme);
			updateToggle(button);
			document.dispatchEvent(new CustomEvent('themechange', {detail: {theme: nextTheme}}));
		});
	});
})();
