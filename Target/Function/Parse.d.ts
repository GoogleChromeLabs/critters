/**
 * @module CSS
 *
 */
/**
 * Parse a textual CSS Stylesheet into a Stylesheet instance.
 * Stylesheet is a mutable postcss AST with format similar to CSSOM.
 * @see https://github.com/postcss/postcss/
 * @private
 * @param {String} stylesheet
 * @returns {css.Stylesheet} ast
 */
declare const _default: (Stylesheet: any) => Promise<import("postcss/lib/root").default>;
export default _default;
