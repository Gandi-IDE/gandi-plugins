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
