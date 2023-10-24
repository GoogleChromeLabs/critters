/**
 * @module DOM
 */

/**
 * Essentially `Object.defineProperties()`, except function values are assigned as value descriptors for convenience.
 * @private
 */
export default (_Object, Property) => {
	for (const i in Property) {
		const value = Property[i];
		Object.defineProperty(
			_Object,
			i,
			typeof value === "function" ? { value } : value
		);
	}
};
