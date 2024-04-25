/**
 * Convert a string from spinal case to camel case.
 * @param {string} str - The string to convert.
 * @returns {string} The string converted to camel case.
 */
export function spinalToCamel(str: string): string {
  return str.replace(/-([a-z])/g, function (match, letter: string) {
    return letter.toUpperCase();
  });
}

/**
 * Convert a spinal-case string to PascalCase.
 * @param {string} spinalCaseString - The spinal-case string to convert.
 * @returns {string} The resulting PascalCase string.
 */
export function spinalToPascal(spinalCaseString: string): string {
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
 * Extracts the file name from a given string containing both file name and extension.
 * @param {string} nameExt - The string containing the file name and extension.
 * @returns {string} The extracted file name.
 */
export const extractFileName = (nameExt: string): string => nameExt.split(".", 1)[0];

/**
 * Converts a string from camelCase to kebab-case.
 * @param {string} input - The camelCase string to be converted.
 * @returns {string} The kebab-case version of the input string.
 */
export const camelToKebab = (input: string): string => {
  return input.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
};
