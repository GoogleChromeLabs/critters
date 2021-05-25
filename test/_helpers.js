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

import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import CrittersWebpackPlugin from '../packages/critters-webpack-plugin/src';

// parse a string into a JSDOM Document
export const parseDom = (html) =>
  new DOMParser().parseFromString(html, 'text/html');

// returns a promise resolving to the contents of a file
export const readFile = (file) =>
  promisify(fs.readFile)(path.resolve(__dirname, file), 'utf8');

// invoke webpack on a given entry module, optionally mutating the default configuration
export function compile(entry, configDecorator) {
  return new Promise((resolve, reject) => {
    const context = path.dirname(path.resolve(__dirname, entry));
    entry = path.basename(entry);
    let config = {
      context,
      entry: path.resolve(context, entry),
      output: {
        path: path.resolve(__dirname, path.resolve(context, 'dist')),
        filename: 'bundle.js',
        chunkFilename: '[name].chunk.js'
      },
      resolveLoader: {
        modules: [path.resolve(__dirname, '../node_modules')]
      },
      module: {
        rules: []
      },
      plugins: []
    };
    if (configDecorator) {
      config = configDecorator(config) || config;
    }

    webpack(config, (err, stats) => {
      if (err) return reject(err);
      const info = stats.toJson();
      if (stats.hasErrors()) return reject(info.errors.join('\n'));
      resolve(info);
    });
  });
}

// invoke webpack via compile(), applying Critters to inline CSS and injecting `html` and `document` properties into the webpack build info.
export async function compileToHtml(
  fixture,
  configDecorator,
  crittersOptions = {}
) {
  const info = await compile(`fixtures/${fixture}/index.js`, (config) => {
    config = configDecorator(config) || config;
    config.plugins.push(
      new CrittersWebpackPlugin({
        pruneSource: true,
        compress: false,
        logLevel: 'silent',
        ...crittersOptions
      })
    );
  });
  info.html = await readFile(`fixtures/${fixture}/dist/index.html`);
  info.document = parseDom(info.html);
  return info;
}
