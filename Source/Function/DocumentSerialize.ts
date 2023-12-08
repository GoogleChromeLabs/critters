/**
 * @module DOM
 */
/**
 * Serialize a Document to an HTML String
 * @param {HTMLDocument} document   A Document, such as one created via `createDocument()`
 */
export function serializeDocument(document) {
	return render(document, { decodeEntities: false });
}
