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

import { compile, compileToHtml, readFile } from './_helpers.js';

function configure(config) {
  config.module.rules.push(
    {
      test: /\.css$/,
      loader: 'css-loader'
    },
    {
      test: /\.html$/,
      loader: 'file-loader?name=[name].[ext]'
    }
  );
}

test('webpack compilation', async () => {
  const info = await compile('fixtures/raw/index.js', configure);
  expect(info.assets).toHaveLength(2);
  expect(await readFile('fixtures/raw/dist/index.html')).toMatchSnapshot();
});

describe('Usage without html-webpack-plugin', () => {
  let output;
  beforeAll(async () => {
    output = await compileToHtml('raw', configure);
  });

  it('should process the first html asset', () => {
    const { html, document } = output;
    expect(document.querySelectorAll('style')).toHaveLength(1);
    expect(document.getElementById('unused')).toBeNull();
    expect(document.getElementById('used')).not.toBeNull();
    expect(document.getElementById('used').textContent).toMatchSnapshot();
    expect(html).toMatchSnapshot();
  });
});
