/**
 * @module CSS
 *
 */

// Checks if a node has nested rules, like @media
// @keyframes are an exception since they are evaluated as a whole
export default (Rule) =>
	Rule.nodes?.length &&
	Rule.nodes.some((n) => n.type === "rule" || n.type === "atrule") &&
	Rule.name !== "keyframes" &&
	Rule.name !== "-webkit-keyframes";
