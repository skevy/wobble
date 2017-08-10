// rollup.config.js
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";
import uglify from "rollup-plugin-uglify";
import { minify } from "uglify-es";

const base = {
  entry: "src/index.js",
  plugins: [resolve(), commonjs()]
};

const browser = Object.assign({}, base, {
  sourceMap: true,
  moduleName: "Wobble",
  plugins: [
    ...base.plugins,
    babel({
      exclude: "node_modules/**", // only transpile our source code
      babelrc: false,
      presets: [
        [
          "env",
          {
            targets: {
              browsers: ["last 2 versions", "safari >= 7"]
            },
            modules: false
          }
        ],
        "stage-0"
      ],
      plugins: ["external-helpers", "transform-flow-strip-types"]
    }),
    uglify({}, minify)
  ]
});

const es = Object.assign({}, base, {
  format: "es",
  sourceMap: true,
  plugins: [
    ...base.plugins,
    babel({
      exclude: "node_modules/**", // only transpile our source code
      babelrc: false,
      presets: [
        [
          "env",
          {
            targets: {
              node: true
            },
            modules: false
          }
        ],
        "stage-0"
      ],
      plugins: ["external-helpers", "transform-flow-strip-types"]
    }),
    uglify({}, minify)
  ]
});

let config;
switch (process.env.ROLLUP_CONFIG) {
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
