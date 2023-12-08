/**
 * @module DOM
 *
 */

/**
 * Methods and descriptors to mix into the global document instance
 * @private
 */
export default {
	/** @extends treeAdapter.Document.prototype */

	// document is just an Element in htmlparser2, giving it a nodeType of ELEMENT_NODE.
	// TODO: verify if these are needed for css-select
	nodeType: {
		get() {
			return 9;
		},
	},

	contentType: {
		get() {
			return "text/html";
		},
	},

	nodeName: {
		get() {
			return "#document";
		},
	},

	documentElement: {
		get() {
			// Find the first <html> element within the document
			return this.children.find(
				(child) => String(child.tagName).toLowerCase() === "html"
			);
		},
	},

	head: {
		get() {
			return this.querySelector("head");
		},
	},

	body: {
		get() {
			return this.querySelector("body");
		},
	},

	createElement(name) {
		return new Element(name);
	},

	createTextNode(text) {
		// there is no dedicated createTextNode equivalent exposed in htmlparser2's DOM
		return new Text(text);
	},

	exists(sel) {
		return cachedQuerySelector(sel, this);
	},

	querySelector(sel) {
		return selectOne(sel, this);
	},

	querySelectorAll(sel) {
		if (sel === ":root") {
			return this;
		}
		return selectAll(sel, this);
	},
};
