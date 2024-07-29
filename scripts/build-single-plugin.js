const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const handlebars = require("handlebars");
const argv = require("yargs").argv;

/**
 * Convert a spinal-case string to PascalCase.
 * @param {string} spinalCaseString - The spinal-case string to convert.
 * @returns {string} The resulting PascalCase string.
 */
function spinalToPascal(spinalCaseString) {
  // Split the string by hyphens to get an array of words
  const words = spinalCaseString.split("-");

  // Capitalize the first letter of each word and join them together
  const pascalCaseString = words
    .map((word) => {
      // Capitalize the first letter of each word
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");

  return pascalCaseString;
}

/**
 * Read a manifest file and extract the object content.
 * @param {string} filePath - The path to the manifest file.
 * @param {string} [suffix=".ts"] - The file extension (default is ".ts").
 * @returns {object|null} The extracted object content or null if not found.
 */
function readManifestFile(filePath, suffix = ".ts") {
  try {
    const data = fs.readFileSync(filePath + suffix, "utf8");
    const match = data.match(/export default (\{[\s\S]*?\});/);

    if (!match || match.length < 2) {
      return null;
    }

    return eval("(" + match[1] + ")");
  } catch (error) {
    if (suffix === ".ts") {
      return readManifestFile(filePath, ".js");
    }
    return null;
  }
}

// Try to read the manifest file
let manifest = readManifestFile(`./src/plugins/${argv.name}/manifest`);

// If JavaScript read failed, try to read as TypeScript file
if (!manifest) {
  console.error("Couldn't find the plugin's manifest file.");
  return;
}

const wrapperFileName = `temp-wrapper.${manifest.type === "component" ? "jsx" : "js"}`;

/**
 * Build the plugin using webpack.
 * @param {Function} onComplete - Callback function to execute on completion.
 * @param {boolean} noDevServer - Whether to start the dev server or not.
 */
function buildPlugin(onComplete, noDevServer) {
  console.log("Start building plugin...");
  const pluginName = spinalToPascal(argv.name);
  const entryFilePath = `./src/plugins/${argv.name}/${wrapperFileName}`;
  const webpackConfig = {
    mode: "development",
    entry: {
      [pluginName]: entryFilePath,
    },
    output: {
      path: path.join(__dirname, "../dist"),
      libraryTarget: "window",
      library: pluginName,
      filename: "[name].js",
      chunkFilename: "[name].[hash:5].js",
      clean: true, // Clean the output directory before emit.
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.less$/,
          use: [
            "style-loader",
            {
              loader: "@teamsupercell/typings-for-css-modules-loader",
            },
            {
              loader: "css-loader",
              options: {
                sourceMap: true,
                modules: {
                  localIdentName: "addons_[local]_[hash:base64:5]",
                  exportLocalsConvention: "camelCaseOnly",
                },
              },
            },
            {
              loader: "postcss-loader",
            },
            {
              loader: "less-loader",
            },
          ],
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.svg$/i,
          type: "asset",
          resourceQuery: /url/, // *.svg?url
        },
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          resourceQuery: { not: [/url/] }, // exclude react component if *.svg?url
          use: ["@svgr/webpack"],
        },
      ],
    },
    plugins: [new webpack.ProgressPlugin()],
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      alias: {
        src: path.resolve(__dirname, "../src"),
        plugins: path.resolve(__dirname, "../src/plugins"),
        assets: path.resolve(__dirname, "../src/assets"),
        lib: path.resolve(__dirname, "../src/lib"),
        utils: path.resolve(__dirname, "../src/utils"),
        components: path.resolve(__dirname, "../src/components"),
        hooks: path.resolve(__dirname, "../src/hooks"),
        types: path.resolve(__dirname, "../src/types"),
      },
    },
    optimization: {
      minimize: true,
    },
    target: ["web", "es6"],
  };

  const compiler = webpack(webpackConfig);
  if (noDevServer) {
    compiler.run((err, stats) => {
      if (err) {
        console.error(err.stack || err);
        if (err.details) {
          console.error(err.details);
        }
        return;
      }
      if (stats.hasErrors()) {
        const errors = stats.compilation.errors;
        errors.forEach((error) => {
          console.error(error.message || error);
        });
        console.error("Plug-in build failed.");
      } else {
        console.log(`Plug-in(${pluginName}) built successfully.`);
      }
      if (onComplete) onComplete();
    });
    return;
  }
  compiler.watch(
    {
      aggregateTimeout: 200,
      poll: 1000,
    },
    (err, stats) => {
      if (err) {
        console.error(err.stack || err);
        if (err.details) {
          console.error(err.details);
        }
        return;
      }
      if (stats.hasErrors()) {
        const errors = stats.compilation.errors;
        errors.forEach((error) => {
          console.error(error.message || error);
        });
        console.error("Plug-in build failed.");
      } else {
        console.log(`Plug-in(${pluginName}) built successfully.`);
      }
      if (onComplete) onComplete();
    },
  );

  const server = new WebpackDevServer({}, compiler);

  server.startCallback(() => {
    console.log("Successfully started server on http://localhost:8081");
  });
}

const wrapperFilePath = `${manifest.type === "component" ? "rc" : "func"}-plugin-wrapper.hbs`;

/**
 * Read the source file and modify it to include the plugin name.
 * Then write the modified content to a target file.
 * Finally, build the plugin.
 */
fs.readFile(path.join(__dirname, wrapperFilePath), "utf8", (err, data) => {
  if (err) {
    console.error("Error reading source file:", err);
    return;
  }
  // Modify the source file content to include the plugin name
  const modifiedData = handlebars.compile(data)({
    pluginName: argv.name,
  });
  const targetDirectory = `./src/plugins/${argv.name}/`;

  // Create the target directory if it doesn't exist
  if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory);
  }

  // Write the modified content to the target file
  const targetFile = path.join(targetDirectory, wrapperFileName);
  fs.writeFile(targetFile, modifiedData, "utf8", (err) => {
    if (err) {
      console.error("Error writing target file:", err);
      return;
    }
    console.log(`Target file added: ${targetFile}`);
    // Build the plugin after writing the target file
    buildPlugin(() => {
      console.log("Build success");
    }, argv.single);
  });
});
