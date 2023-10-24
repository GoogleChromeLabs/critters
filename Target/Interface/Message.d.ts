/**
 * @module Utility
 *
 */
export default interface Type {
    (Message: Message): void;
}
import type Message from "../Type/Message.js";
