/**
 * @module DOM
 *
 */
/**
 * Methods and descriptors to mix into the global document instance
 * @private
 */
declare const _default: {
    /** @extends treeAdapter.Document.prototype */
    nodeType: {
        get(): number;
    };
    contentType: {
        get(): string;
    };
    nodeName: {
        get(): string;
    };
    documentElement: {
        get(): any;
    };
    head: {
        get(): any;
    };
    body: {
        get(): any;
    };
    createElement(name: any): Element;
    createTextNode(text: any): Text;
    exists(sel: any): any;
    querySelector(sel: any): any;
    querySelectorAll(sel: any): any;
};
export default _default;
