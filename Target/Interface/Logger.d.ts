/**
 * @module Utility
 *
 */
export default interface Type {
    Trace?: Message;
    Debug?: Message;
    Info?: Message;
    Warn?: Message;
    Error?: Message;
    Silent?: Message;
}
import type Message from "./Message.js";
