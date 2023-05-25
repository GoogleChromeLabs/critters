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

import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { compile, compileToHtml, readFile } from './_helpers.js';

function configure(config) {
  config.module.rules.push({
    test: /\.css$/,
    use: [MiniCssExtractPlugin.loader, 'css-loader']
  });

  config.plugins.push(
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name].chunk.css'
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true,
      compile: true,
      minify: false
    })
  );
}

test('webpack compilation', async () => {
  const info = await compile('fixtures/basic/index.js', configure);
  expect(info.assets).toHaveLength(2);

  const html = await readFile('fixtures/basic/dist/index.html');
  expect(html).toMatchSnapshot();

  expect(html).toMatch(/\.extra-style/);
});

describe('Inline <style> pruning', () => {
  it('should remove unused rules', async () => {
    const { html } = await compileToHtml('basic', configure);
    expect(html).not.toMatch(/\.extra-style/);
    expect(html).toMatchSnapshot();
  });

  it('should remove entire unused stylesheets', async () => {
    const { document } = await compileToHtml('unused', configure);
    expect(document.querySelectorAll('style')).toHaveLength(1);
    expect(document.getElementById('unused')).toBeNull();
    expect(document.getElementById('used')).not.toBeNull();
    expect(document.getElementById('used').textContent).toMatchSnapshot();
  });
});

describe('External CSS', () => {
  let output;
  beforeAll(async () => {
    output = await compileToHtml('external', configure);
  });

  it('should inline critical styles', () => {
    expect(output.html).toMatch(/ul\.navbar\s*\{/);
  });

  it('should omit non-critical styles', () => {
    expect(output.html).not.toMatch(/\.extra-style/);
  });

  it('should replace rel="stylesheet" with a preload', () => {
    const link = output.document.querySelector('link[rel="stylesheet"]');
    expect(link).not.toBeNull();
    expect(link).toHaveProperty('href', 'main.css');
  });

  it('should match snapshot', () => {
    expect(output.html).toMatchSnapshot();
  });

  it('should prune external sheet', async () => {
    const externalCss = await readFile('fixtures/external/dist/main.css');
    expect(externalCss).toMatch(/\.extra-style\s*\{/);
    expect(externalCss).toMatchSnapshot();
  });
});

describe('publicPath', () => {
  let output;
  beforeAll(async () => {
    output = await compileToHtml('external', (config) => {
      configure(config);
      config.output.publicPath = '/_public/';
    });
  });

  it('should inline critical styles', () => {
    expect(output.html).toMatch(/ul\.navbar\s*\{/);
  });

  it('should omit non-critical styles', () => {
    expect(output.html).not.toMatch(/\.extra-style/);
  });

  it('should reference from publicPath', () => {
    const link = output.document.querySelector('link[rel="stylesheet"]');
    expect(link).not.toBeNull();
    expect(link).toHaveProperty('href', '/_public/main.css');
  });

  it('should preload from publicPath', () => {
    const link = output.document.querySelector('link[rel="preload"]');
    expect(link).not.toBeNull();
    expect(link).toHaveProperty('href', '/_public/main.css');
  });

  it('should match snapshot', () => {
    expect(output.html).toMatchSnapshot();
  });

  it('should prune external sheet', async () => {
    const externalCss = await readFile('fixtures/external/dist/main.css');
    expect(externalCss).toMatch(/\.extra-style\s*\{/);
    expect(externalCss).toMatchSnapshot();
  });
});

describe('options', () => {
  describe('{ additionalStylesheets:["*.css"] }', () => {
    let output;
    beforeAll(async () => {
      output = await compileToHtml('additionalStylesheets', configure, {
        additionalStylesheets: ['*.css']
      });
    });

    it('should include additional styles', () => {
      expect(output.html).toMatch(/\.additional-style/);
    });

    it('should match snapshot', () => {
      expect(output.html).toMatchSnapshot();
    });
  });

  describe('{ async:true }', () => {
    let output;
    beforeAll(async () => {
      output = await compileToHtml('external', configure, {
        async: true
      });
    });

    it('should omit non-critical styles', () => {
      expect(output.html).not.toMatch(/\.extra-style/);
    });

    it('should place a link rel="preload" in <head>', () => {
      const preload = output.document.querySelector('link[rel="preload"]');
      expect(preload).not.toBeNull();
      expect(preload).toHaveProperty('href', 'main.css');
      expect(preload.parentNode).toBe(output.document.head);
    });

    it('should place a link rel="stylesheet" at the end of <body>', () => {
      const link = output.document.querySelector('link[rel="stylesheet"]');
      expect(link).not.toBeNull();
      expect(link).toHaveProperty('href', 'main.css');
      expect(output.document.body.lastElementChild).toBe(link);
    });

    it('should match snapshot', () => {
      expect(output.html).toMatchSnapshot();
    });
  });

  describe('inlineThreshold', () => {
    it('should fully inline sheets below the given size', async () => {
      const { document, html } = await compileToHtml(
        'inlineThreshold',
        configure,
        {
          inlineThreshold: 1000
        }
      );
      expect(document.querySelectorAll('style')).toHaveLength(1);
      expect(html).toMatch(/\.extra-style/);
    });
  });

  describe('keyframes', () => {
    it('keyframes=critical (default)', async () => {
      const output = await compileToHtml('keyframes', configure, {});
      expect(output.html).toMatch(/@keyframes present/);
      expect(output.html).not.toMatch(/@keyframes not-present/);
    });

    it('keyframes=all', async () => {
      const output = await compileToHtml('keyframes', configure, {
        keyframes: 'all'
      });
      expect(output.html).toMatch(/@keyframes present/);
      expect(output.html).toMatch(/@keyframes not-present/);
    });

    it('keyframes=none', async () => {
      const output = await compileToHtml('keyframes', configure, {
        keyframes: 'none'
      });
      expect(output.html).not.toMatch(/@keyframes/);
    });
  });
});
