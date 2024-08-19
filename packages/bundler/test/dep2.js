import afunc from "./dep1.js";

const a = 1;

export const c = a + 2;

export const logger = function () {
  afunc(1, 2);
  console.log(123);
};
