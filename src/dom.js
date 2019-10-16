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
import { JSDOM } from 'jsdom';

/**
 * Parse HTML into a mutable, serializable DOM Document, provided by JSDOM.
 * @private
 * @param {String} html   HTML to parse into a Document instance
 */
export function createDocument (html) {
  const jsdom = new JSDOM(html, {
    contentType: 'text/html'
  });
  const { window } = jsdom;
  const document = window.document;
  document.$jsdom = jsdom;
  return document;
}
/**
 * Serialize a Document to an HTML String
 * @private
 * @param {Document} document   A Document, such as one created via `createDocument()`
 */
export function serializeDocument (document) {
  return document.$jsdom.serialize();
}

/** Like node.textContent, except it works */
export function setNodeText (node, text) {
  while (node.lastChild) {
    node.removeChild(node.lastChild);
  }
  node.appendChild(node.ownerDocument.createTextNode(text));
}
