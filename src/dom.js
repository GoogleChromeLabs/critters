/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import parse5 from 'parse5';
import nwmatcher from 'nwmatcher';

// htmlparser2 has a relatively DOM-like tree format, which we'll massage into a DOM elsewhere
const treeAdapter = parse5.treeAdapters.htmlparser2;

const PARSE5_OPTS = {
  treeAdapter
};

/**
 * Parse HTML into a mutable, serializable DOM Document.
 * The DOM implementation is an htmlparser2 DOM enhanced with basic DOM mutation methods.
 * @param {String} html   HTML to parse into a Document instance
 */
export function createDocument (html) {
  const document = parse5.parse(html, PARSE5_OPTS);

  defineProperties(document, DocumentExtensions);
  // Find the first <html> element within the document

  // Extend Element.prototype with DOM manipulation methods.
  //   Note: document.$$scratchElement is also used by createTextNode()
  const scratch = document.$$scratchElement = document.createElement('div');
  const elementProto = Object.getPrototypeOf(scratch);
  defineProperties(elementProto, ElementExtensions);
  elementProto.ownerDocument = document;

  // nwmatcher is a selector engine that happens to work with Parse5's htmlparser2 DOM (they form the base of jsdom).
  // It is exposed to the document so that it can be used within Element.prototype methods.
  document.$match = nwmatcher({ document });
  document.$match.configure({
    CACHING: false,
    USE_QSAPI: false,
    USE_HTML5: false
  });

  return document;
}

/**
 * Serialize a Document to an HTML String
 * @param {Document} document   A Document, such as one created via `createDocument()`
 */
export function serializeDocument (document) {
  return parse5.serialize(document, PARSE5_OPTS);
}

/**
 * Methods and descriptors to mix into Element.prototype
 */
const ElementExtensions = {
  /** @extends htmlparser2.Element.prototype */

  nodeName: {
    get () {
      return this.tagName.toUpperCase();
    }
  },

  id: reflectedProperty('id'),

  className: reflectedProperty('class'),

  insertBefore (child, referenceNode) {
    if (!referenceNode) return this.appendChild(child);
    treeAdapter.insertBefore(this, child, referenceNode);
    return child;
  },

  appendChild (child) {
    treeAdapter.appendChild(this, child);
    return child;
  },

  removeChild (child) {
    treeAdapter.detachNode(child);
  },

  setAttribute (name, value) {
    if (this.attribs == null) this.attribs = {};
    if (value == null) value = '';
    this.attribs[name] = value;
  },

  removeAttribute (name) {
    if (this.attribs != null) {
      delete this.attribs[name];
    }
  },

  getAttribute (name) {
    return this.attribs != null && this.attribs[name];
  },

  hasAttribute (name) {
    return this.attribs != null && this.attribs[name] != null;
  },

  getAttributeNode (name) {
    const value = this.getAttribute(name);
    if (value != null) return { specified: true, value };
  },

  getElementsByTagName
};

/**
 * Methods and descriptors to mix into the global document instance
 * @private
 */
const DocumentExtensions = {
  /** @extends htmlparser2.Document.prototype */

  // document is just an Element in htmlparser2, giving it a nodeType of ELEMENT_NODE.
  // nwmatcher requires that it at least report a correct nodeType of DOCUMENT_NODE.
  nodeType: {
    get () {
      return 9;
    }
  },

  nodeName: {
    get () {
      return '#document';
    }
  },

  documentElement: {
    get () {
      // Find the first <html> element within the document
      return this.childNodes.filter(child => String(child.tagName).toLowerCase() === 'html')[0];
    }
  },

  body: {
    get () {
      return this.querySelector('body');
    }
  },

  createElement (name) {
    return treeAdapter.createElement(name, null, []);
  },

  createTextNode (text) {
    // there is no dedicated createTextNode equivalent in htmlparser2's DOM, so
    // we have to insert Text and then remove and return the resulting Text node.
    const scratch = this.$$scratchElement;
    treeAdapter.insertText(scratch, text);
    const node = scratch.lastChild;
    treeAdapter.detachNode(node);
    return node;
  },

  querySelector (sel) {
    return this.$match.first(sel, this.documentElement);
  },

  querySelectorAll (sel) {
    return this.$match.select(sel, this.documentElement);
  },

  getElementsByTagName,

  // Bugfix: nwmatcher uses inexistence of `document.addEventListener` to detect IE:
  // @see https://github.com/dperini/nwmatcher/blob/3edb471e12ce7f7d46dc1606c7f659ff45675a29/src/nwmatcher.js#L353
  addEventListener: Object
};

/**
 * Essentially `Object.defineProperties()`, except function values are assigned as value descriptors for convenience.
 * @private
 */
function defineProperties (obj, properties) {
  for (const i in properties) {
    const value = properties[i];
    Object.defineProperty(obj, i, typeof value === 'function' ? { value } : value);
  }
}

/**
 * A simple implementation of Element.prototype.getElementsByTagName().
 * This is the only tree traversal method nwmatcher uses to implement its selector engine.
 * @private
 * @note
 *    If perf issues arise, 2 faster but more verbose implementations are benchmarked here:
 *      https://esbench.com/bench/5ac3b647f2949800a0f619e1
 */
function getElementsByTagName (tagName) {
  // Only return Element/Document nodes
  if ((this.nodeType !== 1 && this.nodeType !== 9) || this.type === 'directive') return [];
  return Array.prototype.concat.apply(
    // Add current element if it matches tag
    (tagName === '*' || (this.tagName && (this.tagName === tagName || this.nodeName === tagName.toUpperCase()))) ? [this] : [],
    // Check children recursively
    this.children.map(child => getElementsByTagName.call(child, tagName))
  );
}

/**
 * Create a property descriptor defining a getter/setter pair alias for a named attribute.
 * @private
 */
function reflectedProperty (attributeName) {
  return {
    get () {
      return this.getAttribute(attributeName);
    },
    set (value) {
      this.setAttribute(attributeName, value);
    }
  };
}
