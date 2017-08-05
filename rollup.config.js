// rollup.config.js
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";
import uglify from "rollup-plugin-uglify";
import { minify } from "uglify-es";

export default {
  entry: "src/index.js",
  sourceMap: true,
  moduleName: "Wobble",
  plugins: [
    resolve(),
    commonjs(),
    babel({
      exclude: "node_modules/**" // only transpile our source code
    }),
    uglify({}, minify)
  ]
};
