/**
 * Aggregates all tool definitions from sub-modules.
 */

import { sessionToolDefs } from "./session.js";
import { browserToolDefs } from "./browser.js";
import { coordinateToolDefs } from "./coordinate.js";
import { networkToolDefs } from "./network.js";
import { storageToolDefs } from "./storage.js";
import { devtoolsToolDefs } from "./devtools.js";
import { extraToolDefs } from "./extra.js";

export function buildToolDefinitions() {
  return [
    ...sessionToolDefs(),
    ...browserToolDefs(),
    ...coordinateToolDefs(),
    ...networkToolDefs(),
    ...storageToolDefs(),
    ...devtoolsToolDefs(),
    ...extraToolDefs(),
  ];
}
