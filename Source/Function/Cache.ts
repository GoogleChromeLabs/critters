/**
 * @module DOM
 *
 */
export default (container) => {
	classCache = new Set();
	idCache = new Set();

	const queue = [container];

	while (queue.length) {
		const node = queue.shift();

		if (node.hasAttribute("class")) {
			const classList = node.getAttribute("class").trim().split(" ");
			classList.forEach((cls) => {
				classCache.add(cls);
			});
		}

		if (node.hasAttribute("id")) {
			const id = node.getAttribute("id").trim();
			idCache.add(id);
		}

		queue.push(...node.children.filter((child) => child.type === "tag"));
	}
};
