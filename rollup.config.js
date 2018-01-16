// rollup.config.js
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import uglify from "rollup-plugin-uglify";
import { minify } from "uglify-es";

const base = {
  input: "src/index.ts",
  plugins: [resolve()]
};

const CACHE_ROOT = `${require("temp-dir")}/.rpt2_cache_${process.env
  .ROLLUP_CONFIG}`;

const browser = Object.assign({}, base, {
  output: {
    name: "Wobble",
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
    commonjs(),
    uglify({}, minify)
  ]
});

const es = Object.assign({}, base, {
  output: {
    format: "es",
    sourcemap: true
  },
  plugins: [
    ...base.plugins,
    typescript({
      cacheRoot: CACHE_ROOT,
      tsconfigOverride: {
        compilerOptions: {
          module: 'esnext',
          declaration: false,
        }
      },
      typescript: require("typescript"),
    }),
    commonjs(),
    uglify({}, minify)
  ]
});

let config;
switch (process.env.ROLLUP_CONFIG) {
  case "cjs":
  case "browser":
    config = browser;
    break;
  case "es":
    config = es;
    break;
  default:
    throw new Error("Must set ROLLUP_CONFIG");
}

export default config;
