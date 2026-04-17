(function (global) {
	const DEFAULT_DURATION = 4500;
	const TYPE_CONFIG = {
		danger: { cssClass: "notification-error" },
		warning: { cssClass: "notification-warning" },
		success: { cssClass: "notification-success" },
		info: { cssClass: "notification-info" },
		general: { cssClass: "notification-info" }
	};

	function escapeHtml(value) {
		return String(value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function normalizeType(type) {
		const value = String(type || "general").toLowerCase();
		return Object.prototype.hasOwnProperty.call(TYPE_CONFIG, value) ? value : "general";
	}

	function normalizeDuration(time) {
		const duration = Number(time);
		if (Number.isFinite(duration) && duration > 0) {
			return duration;
		}

		return DEFAULT_DURATION;
	}

	function ensureContainer() {
		let container = document.getElementById("notification-stack");
		if (container) {
			return container;
		}

		const region = document.createElement("div");
		region.className = "notification-region";
		region.setAttribute("aria-live", "polite");
		region.setAttribute("aria-atomic", "true");

		container = document.createElement("div");
		container.id = "notification-stack";
		container.className = "notification-stack";

		region.appendChild(container);
		document.body.appendChild(region);

		return container;
	}

	function removeNotification(notificationElement) {
		if (!notificationElement || notificationElement.dataset.state === "leaving") {
			return;
		}

		notificationElement.dataset.state = "leaving";
		notificationElement.classList.remove("is-visible");
		notificationElement.classList.add("is-leaving");

		const cleanup = () => notificationElement.remove();
		notificationElement.addEventListener("transitionend", cleanup, { once: true });
		setTimeout(cleanup, 320);
	}

	function createNotificationElement(mainText, subText, type) {
		const normalizedType = normalizeType(type);
		const config = TYPE_CONFIG[normalizedType];
		const element = document.createElement("article");

		element.className = `notification ${config.cssClass}`;
		element.setAttribute("role", "status");
		element.setAttribute("aria-live", "polite");
		element.dataset.state = "entering";

		element.innerHTML = [
			'<div class="notification-toprow">',
			'<button class="notification-close" type="button" aria-label="Benachrichtigung schließen">',
			'<img src="/img/icons/cancel.svg" alt="Benachrichtigung schließen">',
			'</button>',
			'</div>',
			`<h2 class="notification-title">${escapeHtml(mainText)}</h2>`,
			subText ? `<p class="notification-text">${escapeHtml(subText)}</p>` : ''
		].join('');

		const closeButton = element.querySelector(".notification-close");
		closeButton.addEventListener("click", () => removeNotification(element));

		element.addEventListener("click", () => removeNotification(element));

		return element;
	}

	function send(mainText, subText, type, time) {
		if (!mainText) {
			return null;
		}

		const stack = ensureContainer();
		const notificationElement = createNotificationElement(mainText, subText, type);
		const duration = normalizeDuration(time);

		stack.prepend(notificationElement);

		requestAnimationFrame(() => {
			notificationElement.dataset.state = "visible";
			notificationElement.classList.add("is-visible");
		});

		setTimeout(() => {
			removeNotification(notificationElement);
		}, duration);

		return notificationElement;
	}

	global.notification = {
		send: send,
		close: removeNotification
	};
})(globalThis);
