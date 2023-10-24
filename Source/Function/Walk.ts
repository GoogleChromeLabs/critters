/**
 * @module CSS
 * 
 */

/**
 * Recursively walk all rules in a stylesheet.
 * @private
 * @param {css.Rule} node       A Stylesheet or Rule to descend into.
 * @param {Function} iterator   Invoked on each node in the tree. Return `false` to remove that node.
 */
export const _Function = (node, iterator) => {
	node.nodes = node.nodes.filter((rule) => {
		if (hasNestedRules(rule)) {
			_Function(rule, iterator);
		}
		rule._other = undefined;
		rule.filterSelectors = filterSelectors;
		return iterator(rule) !== false;
	});
};

export default _Function;
