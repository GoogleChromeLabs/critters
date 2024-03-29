<p align="center">
  <img src="https://i.imgur.com/J0jv1Sz.png" width="240" height="240" alt="critters-webpack-plugin">
  <h1 align="center">Critters Webpack plugin</h1>
</p>

> critters-webpack-plugin inlines your app's [critical CSS] and lazy-loads the rest.

## critters-webpack-plugin [![npm](https://img.shields.io/npm/v/critters-webpack-plugin.svg?style=flat)](https://www.npmjs.org/package/critters-webpack-plugin)

It's a little different from [other options](#similar-libraries), because it **doesn't use a headless browser** to render content. This tradeoff allows Critters to be very **fast and lightweight**. It also means Critters inlines all CSS rules used by your document, rather than only those needed for above-the-fold content. For alternatives, see [Similar Libraries](#similar-libraries).

Critters' design makes it a good fit when inlining critical CSS for prerendered/SSR'd Single Page Applications. It was developed to be an excellent compliment to [prerender-loader](https://github.com/GoogleChromeLabs/prerender-loader), combining to dramatically improve first paint time for most Single Page Applications.

## Features

*   Fast - no browser, few dependencies
*   Integrates with [html-webpack-plugin]
*   Works with `webpack-dev-server` / `webpack serve`
*   Supports preloading and/or inlining critical fonts
*   Prunes unused CSS keyframes and media queries
*   Removes inlined CSS rules from lazy-loaded stylesheets

## Installation

First, install Critters as a development dependency:

```sh
npm i -D critters-webpack-plugin
```

Then, import Critters into your Webpack configuration and add it to your list of plugins:

```diff
// webpack.config.js
+const Critters = require('critters-webpack-plugin');

module.exports = {
  plugins: [
+    new Critters({
+      // optional configuration (see below)
+    })
  ]
}
```

That's it! Now when you run Webpack, the CSS used by your HTML will be inlined and the imports for your full CSS will be converted to load asynchronously.

## Usage

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### CrittersWebpackPlugin

**Extends Critters**

Create a Critters plugin instance with the given options.

#### Parameters

*   `options` **Options** Options to control how Critters inlines CSS. See <https://github.com/GoogleChromeLabs/critters#usage>

#### Examples

```javascript
// webpack.config.js
module.exports = {
  plugins: [
    new Critters({
      // Outputs: <link rel="preload" onload="this.rel='stylesheet'">
      preload: 'swap',

      // Don't inline critical font-face rules, but preload the font URLs:
      preloadFonts: true
    })
  ]
}
```

## Similar Libraries

There are a number of other libraries that can inline Critical CSS, each with a slightly different approach. Here are a few great options:

*   [Critical](https://github.com/addyosmani/critical)
*   [Penthouse](https://github.com/pocketjoso/penthouse)
*   [webpack-critical](https://github.com/lukeed/webpack-critical)
*   [webpack-plugin-critical](https://github.com/nrwl/webpack-plugin-critical)
*   [html-critical-webpack-plugin](https://github.com/anthonygore/html-critical-webpack-plugin)
*   [react-snap](https://github.com/stereobooster/react-snap)

## License

[Apache 2.0](LICENSE)

This is not an official Google product.

[critical css]: https://www.smashingmagazine.com/2015/08/understanding-critical-css/

[html-webpack-plugin]: https://github.com/jantimon/html-webpack-plugin
