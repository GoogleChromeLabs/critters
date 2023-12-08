/**
 * @module DOM
 *
 */
/**
 * Create a property descriptor defining a getter/setter pair alias for a named attribute.
 * @private
 */
declare const _default: (Attribute: any) => {
    get(): any;
    set(value: any): void;
};
export default _default;
