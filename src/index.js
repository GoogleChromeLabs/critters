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

import path from 'path';
import prettyBytes from 'pretty-bytes';
import sources from 'webpack-sources';
import postcss from 'postcss';
import cssnano from 'cssnano';
import log from 'webpack-log';
import minimatch from 'minimatch';
import { createDocument, serializeDocument, setNodeText } from './dom';
import { parseStylesheet, serializeStylesheet, walkStyleRules, walkStyleRulesWithReverseMirror, markOnly, applyMarkedSelectors } from './css';
import { tap } from './util';

// Used to annotate this plugin's hooks in Tappable invocations
const PLUGIN_NAME = 'critters-webpack-plugin';

/**
 * The mechanism to use for lazy-loading stylesheets.
 * _[JS]_ indicates that a strategy requires JavaScript (falls back to `<noscript>`).
 *
 * - **default:** Move stylesheet links to the end of the document and insert preload meta tags in their place.
 * - **"body":** Move all external stylesheet links to the end of the document.
 * - **"media":** Load stylesheets asynchronously by adding `media="not x"` and removing once loaded. _[JS]_
 * - **"swap":** Convert stylesheet links to preloads that swap to `rel="stylesheet"` once loaded. _[JS]_
 * - **"js":** Inject an asynchronous CSS loader similar to [LoadCSS](https://github.com/filamentgroup/loadCSS) and use it to load stylesheets. _[JS]_
 * - **"js-lazy":** Like `"js"`, but the stylesheet is disabled until fully loaded.
 * @typedef {(default|'body'|'media'|'swap'|'js'|'js-lazy')} PreloadStrategy
 * @public
 */

/**
 * Controls which keyframes rules are inlined.
 *
 * - **"critical":** _(default)_ inline keyframes rules that are used by the critical CSS.
 * - **"all":** Inline all keyframes rules.
 * - **"none":** Remove all keyframes rules.
 * @typedef {('critical'|'all'|'none')} KeyframeStrategy
 * @private
 * @property {String} keyframes     Which {@link KeyframeStrategy keyframe strategy} to use (default: `critical`)_
 */

/**
 * Controls log level of the plugin. Specifies the level the logger should use. A logger will
 * not produce output for any log level beneath the specified level. Available levels and order
 * are:
 *
 * - **"info"** _(default)_
 * - **"warn"**
 * - **"error"**
 * - **"trace"**
 * - **"debug"**
 * - **"silent"**
 * @typedef {('info'|'warn'|'error'|'trace'|'debug'|'silent')} LogLevel
 * @public
 */

/**
 * All optional. Pass them to `new Critters({ ... })`.
 * @public
 * @typedef Options
 * @property {Boolean} external     Inline styles from external stylesheets _(default: `true`)_
 * @property {Number} inlineThreshold Inline external stylesheets smaller than a given size _(default: `0`)_
 * @property {Number} minimumExternalSize If the non-critical external stylesheet would be below this size, just inline it _(default: `0`)_
 * @property {Boolean} pruneSource  Remove inlined rules from the external stylesheet _(default: `true`)_
 * @property {Boolean} mergeStylesheets Merged inlined stylesheets into a single <style> tag _(default: `true`)_
 * @property {String[]} additionalStylesheets Glob for matching other stylesheets to be used while looking for critical CSS _(default: ``)_.
 * @property {String} preload       Which {@link PreloadStrategy preload strategy} to use
 * @property {Boolean} noscriptFallback Add `<noscript>` fallback to JS-based strategies
 * @property {Boolean} inlineFonts  Inline critical font-face rules _(default: `false`)_
 * @property {Boolean} preloadFonts Preloads critical fonts _(default: `true`)_
 * @property {Boolean} fonts        Shorthand for setting `inlineFonts`+`preloadFonts`
 *  - Values:
 *  - `true` to inline critical font-face rules and preload the fonts
 *  - `false` to don't inline any font-face rules and don't preload fonts
 * @property {String} keyframes     Controls which keyframes rules are inlined.
 *  - Values:
 *  - `"critical"`: _(default)_ inline keyframes rules used by the critical CSS
 *  - `"all"` inline all keyframes rules
 *  - `"none"` remove all keyframes rules
 * @property {Boolean} compress     Compress resulting critical CSS _(default: `true`)_
 * @property {String} logLevel      Controls {@link LogLevel log level} of the plugin _(default: `"info"`)_
 */

/**
 * Create a Critters plugin instance with the given options.
 * @public
 * @param {Options} options Options to control how Critters inlines CSS.
 * @example
 * // webpack.config.js
 * module.exports = {
 *   plugins: [
 *     new Critters({
 *       // Outputs: <link rel="preload" onload="this.rel='stylesheet'">
 *       preload: 'swap',
 *
 *       // Don't inline critical font-face rules, but preload the font URLs:
 *       preloadFonts: true
 *     })
 *   ]
 * }
 */
export default class Critters {
  /** @private */
  constructor (options) {
    this.options = Object.assign({ logLevel: 'info', externalStylesheets: [] }, options || {});
    this.options.pruneSource = this.options.pruneSource !== false;
    this.urlFilter = this.options.filter;
    if (this.urlFilter instanceof RegExp) {
      this.urlFilter = this.urlFilter.test.bind(this.urlFilter);
    }
    this.logger = log({ name: 'Critters', unique: true, level: this.options.logLevel });
  }

  /**
   * Invoked by Webpack during plugin initialization
   */
  apply (compiler) {
    // hook into the compiler to get a Compilation instance...
    tap(compiler, 'compilation', PLUGIN_NAME, false, compilation => {
      // ... which is how we get an "after" hook into html-webpack-plugin's HTML generation.
      if (compilation.hooks && compilation.hooks.htmlWebpackPluginAfterHtmlProcessing) {
        tap(compilation, 'html-webpack-plugin-after-html-processing', PLUGIN_NAME, true, (htmlPluginData, callback) => {
          this.process(compiler, compilation, htmlPluginData.html)
            .then(html => { callback(null, { html }); })
            .catch(callback);
        });
      } else {
        // If html-webpack-plugin isn't used, process the first HTML asset as an optimize step
        tap(compilation, 'optimize-assets', PLUGIN_NAME, true, (assets, callback) => {
          let htmlAssetName;
          for (const name in assets) {
            if (name.match(/\.html$/)) {
              htmlAssetName = name;
              break;
            }
          }
          if (!htmlAssetName) return callback(Error('Could not find HTML asset.'));
          const html = assets[htmlAssetName].source();
          if (!html) return callback(Error('Empty HTML asset.'));

          this.process(compiler, compilation, String(html))
            .then(html => {
              assets[htmlAssetName] = new sources.RawSource(html);
              callback();
            })
            .catch(callback);
        });
      }
    });
  }

  /**
   * Read the contents of a file from Webpack's input filesystem
   */
  readFile (compilation, filename) {
    const fs = this.fs || compilation.outputFileSystem;
    return new Promise((resolve, reject) => {
      const callback = (err, data) => {
        if (err) reject(err);
        else resolve(data);
      };
      if (fs && fs.readFile) {
        fs.readFile(filename, callback);
      } else {
        require('fs').readFile(filename, 'utf8', callback);
      }
    });
  }

  /**
   * Apply critical CSS processing to html-webpack-plugin
   */
  async process (compiler, compilation, html) {
    const outputPath = compiler.options.output.path;
    const publicPath = compiler.options.output.publicPath;

    // Parse the generated HTML in a DOM we can mutate
    const document = createDocument(html);

    if (this.options.additionalStylesheets) {
      const styleSheetsIncluded = [];
      (this.options.additionalStylesheets || []).forEach(cssFile => {
        if (styleSheetsIncluded.includes(cssFile)) {
          return;
        }
        styleSheetsIncluded.push(cssFile);
        const webpackCssAssets = Object.keys(compilation.assets).filter(file => minimatch(file, cssFile));
        webpackCssAssets.map(asset => {
          const tag = document.createElement('style');
          tag.innerHTML = compilation.assets[asset].source();
          document.head.appendChild(tag);
        });
      });
    }

    // `external:false` skips processing of external sheets
    if (this.options.external !== false) {
      const externalSheets = [].slice.call(document.querySelectorAll('link[rel="stylesheet"]'));
      await Promise.all(externalSheets.map(
        link => this.embedLinkedStylesheet(link, compilation, outputPath, publicPath)
      ));
    }

    // go through all the style tags in the document and reduce them to only critical CSS
    const styles = [].slice.call(document.querySelectorAll('style'));
    await Promise.all(styles.map(
      style => this.processStyle(style, document)
    ));

    if (this.options.mergeStylesheets !== false && styles.length !== 0) {
      await this.mergeStylesheets(document);
    }

    // serialize the document back to HTML and we're done
    return serializeDocument(document);
  }

  async mergeStylesheets (document) {
    const styles = [].slice.call(document.querySelectorAll('style'));
    if (styles.length === 0) {
      this.logger.warn('Merging inline stylesheets into a single <style> tag skipped, no inline stylesheets to merge');
      return;
    }
    const first = styles[0];
    let sheet = first.textContent;
    for (let i = 1; i < styles.length; i++) {
      const node = styles[i];
      sheet += node.textContent;
      node.remove();
    }
    if (this.options.compress !== false) {
      const before = sheet;
      const processor = postcss([cssnano()]);
      const result = await processor.process(before, { from: undefined });
      // @todo sourcemap support (elsewhere first)
      sheet = result.css;
    }
    setNodeText(first, sheet);
  }

  /**
   * Inline the target stylesheet referred to by a <link rel="stylesheet"> (assuming it passes `options.filter`)
   */
  async embedLinkedStylesheet (link, compilation, outputPath, publicPath) {
    const href = link.getAttribute('href');
    const media = link.getAttribute('media');
    const document = link.ownerDocument;

    const preloadMode = this.options.preload;

    // skip filtered resources, or network resources if no filter is provided
    if (this.urlFilter ? this.urlFilter(href) : href.match(/^(https?:)?\/\//)) return Promise.resolve();

    // path on disk (with output.publicPath removed)
    let normalizedPath = href.replace(/^\//, '');
    const pathPrefix = (publicPath || '').replace(/(^\/|\/$)/g, '') + '/';
    if (normalizedPath.indexOf(pathPrefix) === 0) {
      normalizedPath = normalizedPath.substring(pathPrefix.length).replace(/^\//, '');
    }
    const filename = path.resolve(outputPath, normalizedPath);

    // try to find a matching asset by filename in webpack's output (not yet written to disk)
    const relativePath = path.relative(outputPath, filename).replace(/^\.\//, '');
    const asset = compilation.assets[relativePath];

    // Attempt to read from assets, falling back to a disk read
    let sheet = asset && asset.source();
    if (!sheet) {
      try {
        sheet = await this.readFile(compilation, filename);
        this.logger.warn(`Stylesheet "${relativePath}" not found in assets, but a file was located on disk.${this.options.pruneSource ? ' This means pruneSource will not be applied.' : ''}`);
      } catch (e) {
        this.logger.warn(`Unable to locate stylesheet: ${relativePath}`);
        return;
      }
    }

    // CSS loader is only injected for the first sheet, then this becomes an empty string
    let cssLoaderPreamble = `function $loadcss(u,m,l){(l=document.createElement('link')).rel='stylesheet';l.href=u;document.head.appendChild(l)}`;
    const lazy = preloadMode === 'js-lazy';
    if (lazy) {
      cssLoaderPreamble = cssLoaderPreamble.replace('l.href', `l.media='only x';l.onload=function(){l.media=m};l.href`);
    }

    // the reduced critical CSS gets injected into a new <style> tag
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(sheet));
    link.parentNode.insertBefore(style, link);

    if (this.options.inlineThreshold && sheet.length < this.options.inlineThreshold) {
      style.$$reduce = false;
      this.logger.info(`\u001b[32mInlined all of ${href} (${sheet.length} was below the threshold of ${this.options.inlineThreshold})\u001b[39m`);
      if (asset) {
        delete compilation.assets[relativePath];
      } else {
        this.logger.warn(`  > ${href} was not found in assets. the resource may still be emitted but will be unreferenced.`);
      }
      link.parentNode.removeChild(link);
      return;
    }

    // drop references to webpack asset locations onto the tag, used for later reporting and in-place asset updates
    style.$$name = href;
    style.$$asset = asset;
    style.$$assetName = relativePath;
    style.$$assets = compilation.assets;
    style.$$links = [link];

    // Allow disabling any mutation of the stylesheet link:
    if (preloadMode === false) return;

    let noscriptFallback = false;

    if (preloadMode === 'body') {
      document.body.appendChild(link);
    } else {
      link.setAttribute('rel', 'preload');
      link.setAttribute('as', 'style');
      if (preloadMode === 'js' || preloadMode === 'js-lazy') {
        const script = document.createElement('script');
        const js = `${cssLoaderPreamble}$loadcss(${JSON.stringify(href)}${lazy ? (',' + JSON.stringify(media || 'all')) : ''})`;
        script.appendChild(document.createTextNode(js));
        link.parentNode.insertBefore(script, link.nextSibling);
        style.$$links.push(script);
        cssLoaderPreamble = '';
        noscriptFallback = true;
      } else if (preloadMode === 'media') {
        // @see https://github.com/filamentgroup/loadCSS/blob/af1106cfe0bf70147e22185afa7ead96c01dec48/src/loadCSS.js#L26
        link.setAttribute('rel', 'stylesheet');
        link.removeAttribute('as');
        link.setAttribute('media', 'only x');
        link.setAttribute('onload', `this.media='${media || 'all'}'`);
        noscriptFallback = true;
      } else if (preloadMode === 'swap') {
        link.setAttribute('onload', "this.rel='stylesheet'");
        noscriptFallback = true;
      } else {
        const bodyLink = document.createElement('link');
        bodyLink.setAttribute('rel', 'stylesheet');
        if (media) bodyLink.setAttribute('media', media);
        bodyLink.setAttribute('href', href);
        document.body.appendChild(bodyLink);
        style.$$links.push(bodyLink);
      }
    }

    if (this.options.noscriptFallback !== false && noscriptFallback) {
      const noscript = document.createElement('noscript');
      const noscriptLink = document.createElement('link');
      noscriptLink.setAttribute('rel', 'stylesheet');
      noscriptLink.setAttribute('href', href);
      if (media) noscriptLink.setAttribute('media', media);
      noscript.appendChild(noscriptLink);
      link.parentNode.insertBefore(noscript, link.nextSibling);
      style.$$links.push(noscript);
    }
  }

  /**
   * Parse the stylesheet within a <style> element, then reduce it to contain only rules used by the document.
   */
  async processStyle (style) {
    if (style.$$reduce === false) return;

    const name = style.$$name ? style.$$name.replace(/^\//, '') : 'inline CSS';
    const options = this.options;
    const document = style.ownerDocument;
    const head = document.querySelector('head');
    let keyframesMode = options.keyframes || 'critical';
    // we also accept a boolean value for options.keyframes
    if (keyframesMode === true) keyframesMode = 'all';
    if (keyframesMode === false) keyframesMode = 'none';

    // basically `.textContent`
    let sheet = style.childNodes.length > 0 && [].map.call(style.childNodes, node => node.nodeValue).join('\n');

    // store a reference to the previous serialized stylesheet for reporting stats
    const before = sheet;

    // Skip empty stylesheets
    if (!sheet) return;

    const ast = parseStylesheet(sheet);
    const astInverse = options.pruneSource ? parseStylesheet(sheet) : null;

    // a string to search for font names (very loose)
    let criticalFonts = '';

    const failedSelectors = [];

    const criticalKeyframeNames = [];

    // Walk all CSS rules, marking unused rules with `.$$remove=true` for removal in the second pass.
    // This first pass is also used to collect font and keyframe usage used in the second pass.
    walkStyleRules(ast, markOnly(rule => {
      if (rule.type === 'rule') {
        // Filter the selector list down to only those match
        rule.filterSelectors(sel => {
          // Strip pseudo-elements and pseudo-classes, since we only care that their associated elements exist.
          // This means any selector for a pseudo-element or having a pseudo-class will be inlined if the rest of the selector matches.
          if (sel !== ':root') {
            sel = sel.replace(/(?:>\s*)?::?[a-z-]+\s*(\{|$)/gi, '$1').trim();
          }
          if (!sel) return false;

          try {
            return document.querySelector(sel) != null;
          } catch (e) {
            failedSelectors.push(sel + ' -> ' + e.message);
            return false;
          }
        });
        // If there are no matched selectors, remove the rule:
        if (rule.selectors.length === 0) {
          return false;
        }

        if (rule.declarations) {
          for (let i = 0; i < rule.declarations.length; i++) {
            const decl = rule.declarations[i];

            // detect used fonts
            if (decl.property && decl.property.match(/\bfont(-family)?\b/i)) {
              criticalFonts += ' ' + decl.value;
            }

            // detect used keyframes
            if (decl.property === 'animation' || decl.property === 'animation-name') {
              // @todo: parse animation declarations and extract only the name. for now we'll do a lazy match.
              const names = decl.value.split(/\s+/);
              for (let j = 0; j < names.length; j++) {
                const name = names[j].trim();
                if (name) criticalKeyframeNames.push(name);
              }
            }
          }
        }
      }

      // keep font rules, they're handled in the second pass:
      if (rule.type === 'font-face') return;

      // If there are no remaining rules, remove the whole rule:
      const rules = rule.rules && rule.rules.filter(rule => !rule.$$remove);
      return !rules || rules.length !== 0;
    }));

    if (failedSelectors.length !== 0) {
      this.logger.warn(`${failedSelectors.length} rules skipped due to selector errors:\n  ${failedSelectors.join('\n  ')}`);
    }

    const shouldPreloadFonts = options.fonts === true || options.preloadFonts === true;
    const shouldInlineFonts = options.fonts !== false && options.inlineFonts === true;

    const preloadedFonts = [];
    // Second pass, using data picked up from the first
    walkStyleRulesWithReverseMirror(ast, astInverse, rule => {
      // remove any rules marked in the first pass
      if (rule.$$remove === true) return false;

      applyMarkedSelectors(rule);

      // prune @keyframes rules
      if (rule.type === 'keyframes') {
        if (keyframesMode === 'none') return false;
        if (keyframesMode === 'all') return true;
        return criticalKeyframeNames.indexOf(rule.name) !== -1;
      }

      // prune @font-face rules
      if (rule.type === 'font-face') {
        let family, src;
        for (let i = 0; i < rule.declarations.length; i++) {
          const decl = rule.declarations[i];
          if (decl.property === 'src') {
            // @todo parse this properly and generate multiple preloads with type="font/woff2" etc
            src = (decl.value.match(/url\s*\(\s*(['"]?)(.+?)\1\s*\)/) || [])[2];
          } else if (decl.property === 'font-family') {
            family = decl.value;
          }
        }

        if (src && shouldPreloadFonts && preloadedFonts.indexOf(src) === -1) {
          preloadedFonts.push(src);
          const preload = document.createElement('link');
          preload.setAttribute('rel', 'preload');
          preload.setAttribute('as', 'font');
          preload.setAttribute('crossorigin', 'anonymous');
          preload.setAttribute('href', src.trim());
          head.appendChild(preload);
        }

        // if we're missing info, if the font is unused, or if critical font inlining is disabled, remove the rule:
        if (!family || !src || criticalFonts.indexOf(family) === -1 || !shouldInlineFonts) return false;
      }
    });

    sheet = serializeStylesheet(ast, { compress: this.options.compress !== false }).trim();

    // If all rules were removed, get rid of the style element entirely
    if (sheet.trim().length === 0) {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
      return;
    }

    let afterText = '';
    if (options.pruneSource) {
      const sheetInverse = serializeStylesheet(astInverse, { compress: this.options.compress !== false });
      const asset = style.$$asset;
      if (asset) {
        // if external stylesheet would be below minimum size, just inline everything
        const minSize = this.options.minimumExternalSize;
        if (minSize && sheetInverse.length < minSize) {
          this.logger.info(`\u001b[32mInlined all of ${name} (non-critical external stylesheet would have been ${sheetInverse.length}b, which was below the threshold of ${minSize})\u001b[39m`);
          setNodeText(style, before);
          // remove any associated external resources/loaders:
          if (style.$$links) {
            for (const link of style.$$links) {
              const parent = link.parentNode;
              if (parent) parent.removeChild(link);
            }
          }
          // delete the webpack asset:
          delete style.$$assets[style.$$assetName];
          return;
        }

        const percent = sheetInverse.length / before.length * 100;
        afterText = `, reducing non-inlined size ${percent | 0}% to ${prettyBytes(sheetInverse.length)}`;
        style.$$assets[style.$$assetName] = new sources.LineToLineMappedSource(sheetInverse, style.$$assetName, before);
      } else {
        this.logger.warn('pruneSource is enabled, but a style (' + name + ') has no corresponding Webpack asset.');
      }
    }

    // replace the inline stylesheet with its critical'd counterpart
    setNodeText(style, sheet);

    // output stats
    const percent = sheet.length / before.length * 100 | 0;
    this.logger.info('\u001b[32mInlined ' + prettyBytes(sheet.length) + ' (' + percent + '% of original ' + prettyBytes(before.length) + ') of ' + name + afterText + '.\u001b[39m');
  }
}
