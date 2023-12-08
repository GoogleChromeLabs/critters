/**
 * @module CSS
 *
 */

/**
 * Converts a walkStyleRules() iterator to mark nodes with `.$$remove=true` instead of actually removing them.
 * This means they can be removed in a second pass, allowing the first pass to be nondestructive (eg: to preserve mirrored sheets).
 * @private
 * @param {Function} iterator   Invoked on each node in the tree. Return `false` to remove that node.
 * @returns {(rule) => void} nonDestructiveIterator
 */
export default (predicate) => (rule) => {
	const sel = rule.selectors;
	if (predicate(rule) === false) {
		rule.$$remove = true;
	}
	rule.$$markedSelectors = rule.selectors;
	if (rule._other) {
		rule._other.$$markedSelectors = rule._other.selectors;
	}
	rule.selectors = sel;
};
