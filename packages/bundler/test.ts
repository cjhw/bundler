import fs from "fs";
import { rollup } from "./src/rollup";

async function build() {
  const bundle = await rollup({
    input: "./test/index.js",
    output: "",
  });
  const res = bundle.generate();
  fs.writeFileSync("./test/bundle.js", res.code);
}

build();
