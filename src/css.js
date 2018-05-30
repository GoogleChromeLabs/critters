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

import css from 'css';

/**
 * Parse a textual CSS Stylesheet into a Stylesheet instance.
 * Stylesheet is a mutable ReworkCSS AST with format similar to CSSOM.
 * @see https://github.com/reworkcss/css
 * @private
 * @param {String} stylesheet
 * @returns {css.Stylesheet} ast
 */
export function parseStylesheet (stylesheet) {
  return css.parse(stylesheet);
}

/**
 * Serialize a ReworkCSS Stylesheet to a String of CSS.
 * @private
 * @param {css.Stylesheet} ast          A Stylesheet to serialize, such as one returned from `parseStylesheet()`
 * @param {Object} options              Options to pass to `css.stringify()`
 * @param {Boolean} [options.compress]  Compress CSS output (removes comments, whitespace, etc)
 */
export function serializeStylesheet (ast, options) {
  return css.stringify(ast, options);
}

/**
 * Recursively walk all rules in a stylesheet.
 * @private
 * @param {css.Rule} node       A Stylesheet or Rule to descend into.
 * @param {Function} iterator   Invoked on each node in the tree. Return `false` to remove that node.
 */
export function walkStyleRules (node, iterator) {
  if (node.stylesheet) return walkStyleRules(node.stylesheet, iterator);

  node.rules = node.rules.filter(rule => {
    if (rule.rules) {
      walkStyleRules(rule, iterator);
    }
    return iterator(rule) !== false;
  });
}
