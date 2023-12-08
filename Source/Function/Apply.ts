/**
 * Apply filtered selectors to a rule from a previous markOnly run.
 * @private
 * @param {css.Rule} rule The Rule to apply marked selectors to (if they exist).
 */
export default (Rule) => {
	if (Rule.$$markedSelectors) {
		Rule.selectors = Rule.$$markedSelectors;
	}
	if (Rule._other) {
		applyMarkedSelectors(Rule._other);
	}
};
