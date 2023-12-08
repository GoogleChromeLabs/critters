export default interface Type {
    path?: string;
    publicPath?: string;
    external?: boolean;
    inlineThreshold?: number;
    minimumExternalSize?: number;
    pruneSource?: boolean;
    mergeStylesheets?: boolean;
    additionalStylesheets?: string[];
    preload?: "body" | "media" | "swap" | "js" | "js-lazy";
    noscriptFallback?: boolean;
    inlineFonts?: boolean;
    preloadFonts?: boolean;
    fonts?: boolean;
    keyframes?: string;
    compress?: boolean;
    logLevel?: "Info" | "Warn" | "Error" | "Trace" | "Debug" | "Silent";
    reduceInlineStyles?: boolean;
    logger?: Logger;
}
import type Logger from "../Interface/Logger.js";
