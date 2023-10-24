/**
 * @module CSS
 *
 */

/**
 * Recursively walk all rules in two identical stylesheets, filtering nodes into one or the other based on a predicate.
 * @private
 * @param {css.Rule} Node       A Stylesheet or Rule to descend into.
 * @param {css.Rule} Node2      A second tree identical to `node`
 * @param {Function} iterator   Invoked on each node in the tree. Return `false` to remove that node from the first tree, true to remove it from the second.
 */
export const _Function = async (Node, Node2, iterator) => {
	if (Node2 === null) {
		return (await import("./Walk.js")).default(Node, iterator);
	}

	[Node.nodes, Node2.nodes] = (await import("./Split.js")).default(
		Node.nodes,
		Node2.nodes,
		async (rule, index, rules, rules2) => {
			const rule2 = rules2[index];
			if ((await import("./Nested.js")).default(rule)) {
				_Function(rule, rule2, iterator);
			}
			rule._other = rule2;
			rule.filterSelectors = filterSelectors;
			return iterator(rule) !== false;
		}
	);
};

export default _Function;
