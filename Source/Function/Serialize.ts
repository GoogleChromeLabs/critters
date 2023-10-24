/**
 * @module CSS
 *
 */

/**
 * Serialize a postcss Stylesheet to a String of CSS.
 * @private
 * @param {css.Stylesheet} ast          A Stylesheet to serialize, such as one returned from `parseStylesheet()`
 * @param {Object} options              Options used by the stringify logic
 * @param {Boolean} [options.compress]  Compress CSS output (removes comments, whitespace, etc)
 */
export default (AST, Option) => {
	let cssStr = "";

	stringify(AST, (result, node, type) => {
		if (!Option.compress) {
			cssStr += result;
			return;
		}

		// Simple minification logic
		if (node?.type === "comment") return;

		if (node?.type === "decl") {
			const prefix = node.prop + node.raws.between;

			cssStr += result.replace(prefix, prefix.trim());
			return;
		}

		if (type === "start") {
			if (node.type === "rule" && node.selectors) {
				cssStr += node.selectors.join(",") + "{";
			} else {
				cssStr += result.replace(/\s\{$/, "{");
			}
			return;
		}

		if (type === "end" && result === "}" && node?.raws?.semicolon) {
			cssStr = cssStr.slice(0, -1);
		}

		cssStr += result.trim();
	});

	return cssStr;
};
