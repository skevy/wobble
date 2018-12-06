// rollup.config.js
import resolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import uglify from "rollup-plugin-uglify";
import { minify } from "uglify-es";

const base = {
  input: "src/index.ts",
  plugins: [resolve()]
};

const CACHE_ROOT = `${require("temp-dir")}/.rpt2_cache_${process.env
  .ROLLUP_CONFIG}`;

const browser = {
  ...base,
  output: {
    name: "Wobble",
    format: "iife",
    file: "./dist/wobble.browser.js",
    sourcemap: true
  },
  plugins: [
    ...base.plugins,
    typescript({
      cacheRoot: CACHE_ROOT,
      tsconfigOverride: {
        compilerOptions: {
          declaration: false,
        }
      },
      typescript: require("typescript"),
    }),
  ]
};

const cjs = {
  ...browser,
  output: {
    ...browser.output,
    format: "cjs",
    file: browser.output.file.replace("browser", "cjs"),
  },
};

const es = {
  ...base,
  output: {
    format: "es",
    file: "./dist/wobble.es.js",
    sourcemap: true
  },
  plugins: [
    ...base.plugins,
    typescript({
      cacheRoot: CACHE_ROOT,
      tsconfigOverride: {
        compilerOptions: {
          module: "esnext",
          declaration: false,
        }
      },
      typescript: require("typescript"),
    }),
  ]
};

let config;
switch (process.env.ROLLUP_CONFIG) {
  case "cjs":
    config = cjs;
    break;
  case "browser":
    config = browser;
    break;
  case "es":
    config = es;
    break;
  default:
    throw new Error("Must set ROLLUP_CONFIG");
}

export default [
  config,
  addMinifier(config),
];

function addMinifier(config) {
  return {
    ...config,
    output: {
      ...config.output,
      file: config.output.file.replace(".js", ".min.js"),
    },
    plugins: [
      ...config.plugins,
      uglify({}, minify)
    ]
  };
}
