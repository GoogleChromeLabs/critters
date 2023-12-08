/**
 * @module DOM
 *
 */
/**
 * Methods and descriptors to mix into Element.prototype
 * @private
 */
declare const _default: {
    nodeName: {
        get(): any;
    };
    id: any;
    className: any;
    insertBefore(child: any, referenceNode: any): any;
    appendChild(child: any): any;
    removeChild(child: any): void;
    remove(): void;
    textContent: {
        get(): any;
        set(text: any): void;
    };
    setAttribute(name: any, value: any): void;
    removeAttribute(name: any): void;
    getAttribute(name: any): any;
    hasAttribute(name: any): boolean;
    getAttributeNode(name: any): {
        specified: boolean;
        value: any;
    } | undefined;
    exists(sel: any): any;
    querySelector(sel: any): any;
    querySelectorAll(sel: any): any;
};
export default _default;
