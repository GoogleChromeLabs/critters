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

import { selectAll, selectOne } from 'css-select';
import { parseDocument, DomUtils } from 'htmlparser2';
import { Element, Text } from 'domhandler';
import render from 'dom-serializer';

/**
 * Parse HTML into a mutable, serializable DOM Document.
 * The DOM implementation is an htmlparser2 DOM enhanced with basic DOM mutation methods.
 * @param {String} html   HTML to parse into a Document instance
 */
export function createDocument(html) {
  const document = /** @type {HTMLDocument} */ (parseDocument(html));

  defineProperties(document, DocumentExtensions);

  // Extend Element.prototype with DOM manipulation methods.
  defineProperties(Element.prototype, ElementExtensions);

  return document;
}

/**
 * Serialize a Document to an HTML String
 * @param {HTMLDocument} document   A Document, such as one created via `createDocument()`
 */
export function serializeDocument(document) {
  return render(document);
}

/** @typedef {treeAdapter.Document & typeof ElementExtensions} HTMLDocument */

/**
 * Methods and descriptors to mix into Element.prototype
 * @private
 */
const ElementExtensions = {
  /** @extends treeAdapter.Element.prototype */

  nodeName: {
    get() {
      return this.tagName.toUpperCase();
    }
  },

  id: reflectedProperty('id'),

  className: reflectedProperty('class'),

  insertBefore(child, referenceNode) {
    if (!referenceNode) return this.appendChild(child);
    DomUtils.prepend(referenceNode, child);
    return child;
  },

  appendChild(child) {
    DomUtils.appendChild(this, child);
    return child;
  },

  removeChild(child) {
    DomUtils.removeElement(child);
  },

  remove() {
    DomUtils.removeElement(this);
  },

  textContent: {
    get() {
      return DomUtils.getText(this);
    },

    set(text) {
      this.children = [];
      DomUtils.appendChild(this, new Text(text));
    }
  },

  setAttribute(name, value) {
    if (this.attribs == null) this.attribs = {};
    if (value == null) value = '';
    this.attribs[name] = value;
  },

  removeAttribute(name) {
    if (this.attribs != null) {
      delete this.attribs[name];
    }
  },

  getAttribute(name) {
    return this.attribs != null && this.attribs[name];
  },

  hasAttribute(name) {
    return this.attribs != null && this.attribs[name] != null;
  },

  getAttributeNode(name) {
    const value = this.getAttribute(name);
    if (value != null) return { specified: true, value };
  }
};

/**
 * Methods and descriptors to mix into the global document instance
 * @private
 */
const DocumentExtensions = {
  /** @extends treeAdapter.Document.prototype */

  // document is just an Element in htmlparser2, giving it a nodeType of ELEMENT_NODE.
  // TODO: verify if these are needed for css-select
  nodeType: {
    get() {
      return 9;
    }
  },

  contentType: {
    get() {
      return 'text/html';
    }
  },

  nodeName: {
    get() {
      return '#document';
    }
  },

  documentElement: {
    get() {
      // Find the first <html> element within the document
      return this.filter(
        (child) => String(child.tagName).toLowerCase() === 'html'
      );
    }
  },

  head: {
    get() {
      return this.querySelector('head');
    }
  },

  body: {
    get() {
      return this.querySelector('body');
    }
  },

  createElement(name) {
    return new Element(name);
  },

  createTextNode(text) {
    // there is no dedicated createTextNode equivalent exposed in htmlparser2's DOM
    return new Text(text);
  },

  querySelector(sel) {
    return selectOne(sel, this);
  },

  querySelectorAll(sel) {
    if (sel === ':root') {
      return this;
    }
    return selectAll(sel, this);
  }
};

/**
 * Essentially `Object.defineProperties()`, except function values are assigned as value descriptors for convenience.
 * @private
 */
function defineProperties(obj, properties) {
  for (const i in properties) {
    const value = properties[i];
    Object.defineProperty(
      obj,
      i,
      typeof value === 'function' ? { value } : value
    );
  }
}

/**
 * Create a property descriptor defining a getter/setter pair alias for a named attribute.
 * @private
 */
function reflectedProperty(attributeName) {
  return {
    get() {
      return this.getAttribute(attributeName);
    },
    set(value) {
      this.setAttribute(attributeName, value);
    }
  };
}
