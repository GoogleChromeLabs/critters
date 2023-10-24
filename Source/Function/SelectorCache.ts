/**
 * @module DOM
 *
 */
export default (sel, node) => {
	const selectorTokens = selectorParser(sel);
	for (const tokens of selectorTokens) {
		// Check if the selector is a class selector
		if (tokens.length === 1) {
			const token = tokens[0];
			if (token.type === "attribute" && token.name === "class") {
				return classCache.has(token.value);
			}
			if (token.type === "attribute" && token.name === "id") {
				return idCache.has(token.value);
			}
		}
	}
	return !!selectOne(sel, node);
};
