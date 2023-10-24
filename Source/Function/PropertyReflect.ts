/**
 * @module DOM
 *
 */
/**
 * Create a property descriptor defining a getter/setter pair alias for a named attribute.
 * @private
 */
export default (Attribute) => ({
	get() {
		return this.getAttribute(Attribute);
	},
	set(value) {
		this.setAttribute(Attribute, value);
	},
});
