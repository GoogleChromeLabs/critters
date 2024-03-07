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

import { compile, compileToHtml, parseDom, readFile } from './_helpers.js';

function configureEmit(config) {
  config.module.rules.push(
    {
      test: /\.html$/,
      loader: 'file-loader?name=[name].[ext]'
    },
    {
      test: /\.css$/,
      loader: 'file-loader?name=[name].[ext]&emitFile=true'
    }
  );
}

function configureNoEmit(config) {
  config.module.rules.push(
    {
      test: /\.html$/,
      loader: 'file-loader?name=[name]-fd.[ext]'
    },
    {
      test: /\.css$/,
      loader: 'file-loader?name=[name].[ext]&emitFile=false'
    }
  );
}

test('webpack compilation', async () => {
  const info = await compile('fixtures/fromDisk/index.js', configureEmit);
  expect(info.assets).toHaveLength(3);
  const html = await readFile('fixtures/fromDisk/index.html');
  expect(html).toMatchSnapshot();
  expect(html).toMatch(/link\srel="stylesheet"\shref=".*?"/);
});

describe('Usage without comp.assets with loading from disk',() => {
  let html, document;
  beforeAll(async () => {
    await compileToHtml('fromDisk', configureNoEmit);
    html = await readFile('fixtures/fromDisk/dist/index-fd.html');
    document = parseDom(html);
  });
  it('should process the first html asset',() => {
    expect(html).toMatchSnapshot();
    expect(html).toMatch(/link\srel="preload".*?as="style"/);
    expect(document.querySelectorAll('style')).toHaveLength(1);
  });
});

describe('Usage with comp.assets',() => {
  let output;
  beforeAll(async () => {
    output = await compileToHtml('fromDisk', configureEmit);
  });
  it('should process the first html asset', () => {
    const { html, document } = output;
    expect(html).toMatchSnapshot();
    expect(html).toMatch(/link\srel="preload".*?as="style"/);
    expect(document.querySelectorAll('style')).toHaveLength(1);
  });
});
