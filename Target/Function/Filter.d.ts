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
export declare const _Function: (Node: any, Node2: any, iterator: any) => Promise<void>;
export default _Function;
