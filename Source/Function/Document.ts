/**
 * @module DOM
 * 
 */

/**
 * Parse HTML into a mutable, serializable DOM Document.
 * The DOM implementation is an htmlparser2 DOM enhanced with basic DOM mutation methods.
 * @param {String} html   HTML to parse into a Document instance
 */
export function createDocument(html) {
	const document = /** @type {HTMLDocument} */ (
		parseDocument(html, { decodeEntities: false })
	);

	defineProperties(document, DocumentExtensions);

	// Extend Element.prototype with DOM manipulation methods.
	defineProperties(Element.prototype, ElementExtensions);

	// Critters container is the viewport to evaluate critical CSS
	let crittersContainer = document.querySelector("[data-critters-container]");

	if (!crittersContainer) {
		document.documentElement.setAttribute("data-critters-container", "");
		crittersContainer = document.documentElement;
	}

	document.crittersContainer = crittersContainer;
	buildCache(crittersContainer);

	return document;
}
