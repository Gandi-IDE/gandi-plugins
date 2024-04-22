type Rgb = [number, number, number];

/**
 * Takes a number and clamps it to within the provided bounds.
 * @param value The input number.
 * @param min The minimum value to return.
 * @param max The maximum value to return.
 * @return The input number if it is within bounds, or the nearest
 *     number within the bounds.
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Helper for isValidHexColor_.
 * @private
 */
const validHexColorRe_ = /^#(?:[0-9a-f]{3}){1,2}$/i;

/**
 * Checks if a string is a valid hex color.  We expect strings of the format
 * #RRGGBB (ex: #1b3d5f) or #RGB (ex: #3CA == #33CCAA).
 * @param str String to check.
 * @return Whether the string is a valid hex color.
 * @private
 */
export const isValidHexColor = (str: string) => {
  return validHexColorRe_.test(str);
};

/**
 * Regular expression for extracting the digits in a hex color triplet.
 * @private
 */
const hexTripletRe_ = /#(.)(.)(.)/;

/**
 * Normalize an hex representation of a color
 * @param hexColor an hex color string.
 * @return hex color in the format '#rrggbb' with all lowercase
 *     literals.
 */
export const normalizeHex = (hexColor: string) => {
  if (!isValidHexColor(hexColor)) {
    throw Error("'" + hexColor + "' is not a valid hex color");
  }
  if (hexColor.length == 4) {
    // of the form #RGB
    hexColor = hexColor.replace(hexTripletRe_, "#$1$1$2$2$3$3");
  }
  return hexColor.toLowerCase();
};

/**
 * Converts a hex representation of a color to RGB.
 * @param hexColor Color to convert.
 * @return rgb representation of the color.
 */
export const hexToRgb = (hexColor: string): Rgb => {
  hexColor = normalizeHex(hexColor);
  const rgb = parseInt(hexColor.slice(1), 16);
  const r = rgb >> 16;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;
  return [r, g, b];
};

/**
 * Blend two colors together, using the specified factor to indicate the weight
 * given to the first color
 * @param {goog.color.Rgb} rgb1 First color represented in rgb.
 * @param {goog.color.Rgb} rgb2 Second color represented in rgb.
 * @param {number} factor The weight to be given to rgb1 over rgb2. Values
 *     should be in the range [0, 1]. If less than 0, factor will be set to 0.
 *     If greater than 1, factor will be set to 1.
 * @return {!goog.color.Rgb} Combined color represented in rgb.
 */
export const blend = (rgb1: Rgb, rgb2: Rgb, factor: number): Rgb => {
  factor = clamp(factor, 0, 1);

  return [
    Math.round(rgb2[0] + factor * (rgb1[0] - rgb2[0])),
    Math.round(rgb2[1] + factor * (rgb1[1] - rgb2[1])),
    Math.round(rgb2[2] + factor * (rgb1[2] - rgb2[2])),
  ];
};

/**
 * Adds black to the specified color, darkening it
 * @param rgb rgb representation of the color.
 * @param factor Number in the range [0, 1]. 0 will do nothing, while
 *     1 will return black. If less than 0, factor will be set to 0. If greater
 *     than 1, factor will be set to 1.
 * @return Combined rgb color.
 */
export const darken = (rgb: Rgb, factor: number): Rgb => {
  return blend([0, 0, 0], rgb, factor);
};

/**
 * Converts a color from RGB to hex representation.
 * @param r Amount of red, int between 0 and 255.
 * @param g Amount of green, int between 0 and 255.
 * @param b Amount of blue, int between 0 and 255.
 * @return hex representation of the color.
 */
export const rgbToHex = (r: number, g: number, b: number) => {
  r = Number(r);
  g = Number(g);
  b = Number(b);
  if (r != (r & 255) || g != (g & 255) || b != (b & 255)) {
    throw Error('"(' + r + "," + g + "," + b + '") is not a valid RGB color');
  }
  const rgb = (r << 16) | (g << 8) | b;
  if (r < 0x10) {
    return "#" + (0x1000000 | rgb).toString(16).slice(1);
  }
  return "#" + rgb.toString(16);
};

/**
 * Converts a color from RGB to hex representation.
 * @param rgb rgb representation of the color.
 * @return hex representation of the color.
 */
export const rgbArrayToHex = (rgb: Rgb) => {
  return rgbToHex(rgb[0], rgb[1], rgb[2]);
};
