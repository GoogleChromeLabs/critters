/**
 * @module DOM
 *
 */

/**
 * Methods and descriptors to mix into Element.prototype
 * @private
 */
export default {
	nodeName: {
		get() {
			return this.tagName.toUpperCase();
		},
	},

	id: reflectedProperty("id"),

	className: reflectedProperty("class"),

	insertBefore(child, referenceNode) {
		if (!referenceNode) return this.appendChild(child);
		DomUtils.prepend(referenceNode, child);
		return child;
	},

	appendChild(child) {
		DomUtils.appendChild(this, child);
		return child;
	},

	removeChild(child) {
		DomUtils.removeElement(child);
	},

	remove() {
		DomUtils.removeElement(this);
	},

	textContent: {
		get() {
			return DomUtils.getText(this);
		},

		set(text) {
			this.children = [];
			DomUtils.appendChild(this, new Text(text));
		},
	},

	setAttribute(name, value) {
		if (this.attribs == null) this.attribs = {};
		if (value == null) value = "";
		this.attribs[name] = value;
	},

	removeAttribute(name) {
		if (this.attribs != null) {
			delete this.attribs[name];
		}
	},

	getAttribute(name) {
		return this.attribs != null && this.attribs[name];
	},

	hasAttribute(name) {
		return this.attribs != null && this.attribs[name] != null;
	},

	getAttributeNode(name) {
		const value = this.getAttribute(name);
		if (value != null) return { specified: true, value };
	},

	exists(sel) {
		return cachedQuerySelector(sel, this);
	},

	querySelector(sel) {
		return selectOne(sel, this);
	},

	querySelectorAll(sel) {
		return selectAll(sel, this);
	},
};
