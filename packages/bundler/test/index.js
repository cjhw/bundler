import * as dep1 from "./dep1.js";
import { logger, c } from "./dep2.js";
import testDefaultFunc from "./dep3.js";

export const cc = dep1.b;
export const bb = testDefaultFunc();
export const aa = dep1.testFunc();
console.log(logger);

export default dep1.multi;
