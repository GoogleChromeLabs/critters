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
 * Converts a walkStyleRules() iterator to mark nodes with `.$$remove=true` instead of actually removing them.
 * This means they can be removed in a second pass, allowing the first pass to be nondestructive (eg: to preserve mirrored sheets).
 * @private
 * @param {Function} iterator   Invoked on each node in the tree. Return `false` to remove that node.
 * @returns {(rule) => void} nonDestructiveIterator
 */
export function markOnly (predicate) {
  return rule => {
    const sel = rule.selectors;
    if (predicate(rule) === false) {
      rule.$$remove = true;
    }
    rule.$$markedSelectors = rule.selectors;
    if (rule._other) {
      rule._other.$$markedSelectors = rule._other.selectors;
    }
    rule.selectors = sel;
  };
}

/**
 * Apply filtered selectors to a rule from a previous markOnly run.
 * @private
 * @param {css.Rule} rule The Rule to apply marked selectors to (if they exist).
*/
export function applyMarkedSelectors (rule) {
  if (rule.$$markedSelectors) {
    rule.selectors = rule.$$markedSelectors;
  }
  if (rule._other) {
    applyMarkedSelectors(rule._other);
  }
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
    rule._other = undefined;
    rule.filterSelectors = filterSelectors;
    return iterator(rule) !== false;
  });
}

/**
 * Recursively walk all rules in two identical stylesheets, filtering nodes into one or the other based on a predicate.
 * @private
 * @param {css.Rule} node       A Stylesheet or Rule to descend into.
 * @param {css.Rule} node2      A second tree identical to `node`
 * @param {Function} iterator   Invoked on each node in the tree. Return `false` to remove that node from the first tree, true to remove it from the second.
 */
export function walkStyleRulesWithReverseMirror (node, node2, iterator) {
  if (node2 === null) return walkStyleRules(node, iterator);

  if (node.stylesheet) return walkStyleRulesWithReverseMirror(node.stylesheet, node2.stylesheet, iterator);

  [node.rules, node2.rules] = splitFilter(node.rules, node2.rules, (rule, index, rules, rules2) => {
    const rule2 = rules2[index];
    if (rule.rules) {
      walkStyleRulesWithReverseMirror(rule, rule2, iterator);
    }
    rule._other = rule2;
    rule.filterSelectors = filterSelectors;
    return iterator(rule) !== false;
  });
}

// Like [].filter(), but applies the opposite filtering result to a second copy of the Array without a second pass.
// This is just a quicker version of generating the compliment of the set returned from a filter operation.
function splitFilter (a, b, predicate) {
  const aOut = [];
  const bOut = [];
  for (let index = 0; index < a.length; index++) {
    if (predicate(a[index], index, a, b)) {
      aOut.push(a[index]);
    } else {
      bOut.push(a[index]);
    }
  }
  return [aOut, bOut];
}

// can be invoked on a style rule to subset its selectors (with reverse mirroring)
function filterSelectors (predicate) {
  if (this._other) {
    const [a, b] = splitFilter(this.selectors, this._other.selectors, predicate);
    this.selectors = a;
    this._other.selectors = b;
  } else {
    this.selectors = this.selectors.filter(predicate);
  }
}
