const fs = require("fs");
const path = require("path");

/**
 * Inserts content before the last line of a file.
 * @param {string} filePath - The path of the file to insert content into.
 * @param {string} contentToInsert - The content to insert.
 * @param {number} line
 * @returns {void}
 */
function insertContent(filePath, contentToInsert, line) {
  try {
    // Read the content of the file
    let data = fs.readFileSync(filePath, "utf8").toString().split("\n");

    const insertIndex = typeof line === "number" ? line : data.length - 2;
    data.splice(insertIndex, 0, contentToInsert);

    // Write the modified content back to the file
    fs.writeFileSync(filePath, data.join("\n"));
  } catch (err) {
    console.error(err);
  }
}

function validateSpinalCaseInput(input) {
  const regex = /^([a-z]+(?:-[a-z]+)*)+$/;
  return regex.test(input);
}

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

function spinalToTitleCase(spinalCaseString) {
  // Split the string by hyphens to get an array of words
  const words = spinalCaseString.split("-");

  // Capitalize the first letter of each word and join them together with a space
  const titleCaseString = words
    .map((word) => {
      // Capitalize the first letter of each word and lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  return titleCaseString;
}

function hyphenToCamelCase(str) {
  return str.replace(/-([a-z])/g, function (match, letter) {
    return letter.toUpperCase();
  });
}

/**
 * Extracts names and links from a string and returns an array of objects.
 * @param {string} inputString - The input string containing names and links.
 * @returns {Array<{name: string}>} An array of objects containing extracted names and links.
 */
function extractLinks(inputString) {
  // Define regular expression pattern to match names and links
  var pattern = /(\w+)(?:\((https?:\/\/\S+)?\))?/g;
  // Find all matches using regular expression
  var matches = inputString.matchAll(pattern);
  var result = [];

  // Iterate over matches and store names and links as objects in an array
  for (var match of matches) {
    var name = match[1];
    var link = match[2] || null; // Set link to null if it doesn't exist
    result.push({
      name: name,
      link: link,
    });
  }

  return result;
}

const PluginTypeMap = {
  "React Component(TS)": "react-ts",
  "React Component(JS)": "react-js",
  "Function(TS)": "ts",
  "Function(JS)": "js",
};

/**
 * Plop generator for creating an plugin.
 * @param {object} plop - The plop instance.
 */
module.exports = function (plop) {
  plop.setGenerator("createPlugin", {
    description: "Creating a Plugin",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Please enter an plugin name(aaa-bbb): ",
        validate: (input) => {
          if (!validateSpinalCaseInput(input)) {
            return "The name does not meet (aaa-bbb) convention.";
          }
          const contents = fs.readdirSync("./src/plugins");
          const subFolders = contents.filter((item) => {
            const itemPath = path.join("./src/plugins", item);
            return fs.statSync(itemPath).isDirectory();
          });
          if (subFolders.includes(input)) {
            return "Name check failed due to duplication.";
          }
          return true;
        },
      },
      {
        type: "list",
        name: "pluginType",
        message: "Please select the implementation method of the plugin: ",
        choices: Object.keys(PluginTypeMap),
        default: "React Component(TS)",
      },
      {
        type: "input",
        name: "description",
        message: "Please enter an plugin description: ",
      },
      {
        type: "input",
        name: "authors",
        message: "Please enter the author's name of the plugin: ",
      },
    ],
    actions: function (data) {
      const { name, pluginType, description, authors } = data;

      const titleName = spinalToTitleCase(name);
      const componentName = spinalToPascal(name);
      const authorList = extractLinks(authors);
      let credits = "";
      authorList.forEach((author, index) => {
        if (author.link) {
          if (index < authorList.length - 1) {
            credits += `{
      name: "${author.name}",
      link: "${author.link}",
    },
    `;
          } else {
            credits += `{
      name: "${author.name}",
      link: "${author.link}",
    },`;
          }
        } else {
          if (index < authorList.length - 1) {
            credits += `{
      name: "${author.name}",
    },
    `;
          } else {
            credits += `{
      name: "${author.name}",
    },`;
          }
        }
      });
      const nameKey = name.split("-").length > 1 ? `"${name}"` : name;

      insertContent("./src/plugins/plugins-manager/index.tsx", `  "${name}",`, 11);

      // Update the entry file.
      insertContent(
        "./src/plugins-entry.ts",
        `  ${nameKey}: () => import(/* webpackChunkName: "plugin-${name}" */ "src/plugins/${name}"),`,
      );
      // Update the manifest.
      const pluginsManifestFilePath = "./src/plugins-manifest.ts";
      const fileContent = fs.readFileSync(pluginsManifestFilePath, "utf8");
      const match = fileContent.match(/export\s+default\s+\{/);
      let nextPluginLine = 0;
      if (match) {
        nextPluginLine = fileContent.substr(0, match.index).split("\n").length - 2;
      }
      const moduleName = hyphenToCamelCase(name);
      insertContent(
        pluginsManifestFilePath,
        `import ${moduleName} from "src/plugins/${name}/manifest";`,
        nextPluginLine,
      );
      insertContent(pluginsManifestFilePath, `  ${nameKey}: ${moduleName},`);
      const actions = [];
      if (name) {
        actions.push(
          {
            type: "add",
            path: `./src/plugins/${name}/manifest.ts`,
            templateFile: "./plugin-template/plugin-manifest.hbs",
            data: {
              name: titleName,
              type: pluginType.startsWith("Function") ? "function" : "component",
              description,
              credits,
            },
            transform: (templateContent) => {
              return templateContent.replace(/&quot;/g, '"');
            },
          },
          {
            type: "add",
            path: `./src/plugins/${name}/index.${pluginType.endsWith("(JS)") ? "js" : "ts"}${pluginType.startsWith("React Component") ? "x" : ""}`,
            templateFile: `./plugin-template/plugin-index-${PluginTypeMap[pluginType]}.hbs`,
            data: {
              componentName,
            },
          },
          {
            type: "add",
            path: `./src/plugins/${name}/styles.less`,
            templateFile: "./plugin-template/styles.hbs",
          },
        );
      }
      return actions;
    },
  });
};
