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

declare module 'critters' {
  export interface Options {
    path?: string;
    publicPath?: string;
    external?: boolean;
    inlineThreshold?: number;
    minimumExternalSize?: number;
    pruneSource?: boolean;
    mergeStylesheets?: boolean;
    additionalStylesheets?: string[];
    preload?: 'body' | 'media' | 'swap' | 'js' | 'js-lazy';
    noscriptFallback?: boolean;
    inlineFonts?: boolean;
    preloadFonts?: boolean;
    fonts?: boolean;
    keyframes?: string;
    compress?: boolean;
    logLevel?: 'info' | 'warn' | 'error' | 'trace' | 'debug' | 'silent';
    reduceInlineStyles?: boolean;
    logger?: Logger;
  }

  export interface Logger {
    trace?: (message: string) => void;
    debug?: (message: string) => void;
    info?: (message: string) => void;
    warn?: (message: string) => void;
    error?: (message: string) => void;
  }

  class Critters {
    constructor(options: Options);
    process(html: string): Promise<string>;
  }

  export default Critters;
}
