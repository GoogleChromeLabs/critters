/**
 * @module CSS
 *
 */
// can be invoked on a style rule to subset its selectors (with reverse mirroring)
export default (predicate) => {
	if (this._other) {
		const [a, b] = splitFilter(
			this.selectors,
			this._other.selectors,
			predicate
		);
		this.selectors = a;
		this._other.selectors = b;
	} else {
		this.selectors = this.selectors.filter(predicate);
	}
};
