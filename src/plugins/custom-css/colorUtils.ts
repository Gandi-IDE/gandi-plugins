/**
 * 颜色工具函数
 */

/**
 * 将十六进制颜色转换为RGB对象
 * @param hex 十六进制颜色字符串 (例如: "#ff0000")
 * @returns RGB对象 {r, g, b}
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // 移除#前缀如果存在
  hex = hex.replace(/^#/, '');

  // 处理缩写形式 (例如 #fff)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * 将RGB对象转换为十六进制颜色字符串
 * @param rgb RGB对象 {r, g, b}
 * @returns 十六进制颜色字符串 (例如: "#ff0000")
 */
export function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  return '#' + ((1 << 24) | (rgb.r << 16) | (rgb.g << 8) | rgb.b).toString(16).slice(1);
}

/**
 * 将RGB对象转换为HSL对象
 * @param rgb RGB对象 {r, g, b}
 * @returns HSL对象 {h, s, l}
 */
export function rgbToHsl(rgb: { r: number; g: number; b: number }): { h: number; s: number; l: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * 将HSL对象转换为RGB对象
 * @param hsl HSL对象 {h, s, l}
 * @returns RGB对象 {r, g, b}
 */
export function hslToRgb(hsl: { h: number; s: number; l: number }): { r: number; g: number; b: number } {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * 调整颜色亮度
 * @param hex 十六进制颜色字符串
 * @param amount 亮度调整量 (-100 到 100)
 * @returns 调整后的十六进制颜色字符串
 */
export function adjustBrightness(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb);
  hsl.l = Math.max(0, Math.min(100, hsl.l + amount));
  const adjustedRgb = hslToRgb(hsl);
  return rgbToHex(adjustedRgb);
}

/**
 * 调整颜色饱和度
 * @param hex 十六进制颜色字符串
 * @param amount 饱和度调整量 (-100 到 100)
 * @returns 调整后的十六进制颜色字符串
 */
export function adjustSaturation(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb);
  hsl.s = Math.max(0, Math.min(100, hsl.s + amount));
  const adjustedRgb = hslToRgb(hsl);
  return rgbToHex(adjustedRgb);
}

/**
 * 混合两种颜色
 * @param hex1 第一个十六进制颜色字符串
 * @param hex2 第二个十六进制颜色字符串
 * @param weight 第二个颜色的权重 (0 到 1)
 * @returns 混合后的十六进制颜色字符串
 */
export function blendColors(hex1: string, hex2: string, weight: number): string {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return hex1;

  const w = Math.max(0, Math.min(1, weight));
  const result = {
    r: Math.round(rgb1.r * (1 - w) + rgb2.r * w),
    g: Math.round(rgb1.g * (1 - w) + rgb2.g * w),
    b: Math.round(rgb1.b * (1 - w) + rgb2.b * w),
  };

  return rgbToHex(result);
}

/**
 * 添加透明度到颜色
 * @param hex 十六进制颜色字符串
 * @param alpha 透明度 (0 到 1)
 * @returns 带透明度的颜色字符串 (例如: "#ff000080")
 */
export function addAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

/**
 * 判断颜色是深色还是浅色
 * @param hex 十六进制颜色字符串
 * @returns 如果是深色返回true，浅色返回false
 */
export function isDarkColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  // 计算亮度 (https://www.w3.org/TR/AERT/#color-contrast)
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness < 128;
}

/**
 * 生成主题颜色变量
 * @param mainColor 主色 (背景色)
 * @param accentColor 强调色 (UI元素色)
 * @param isDark 是否是深色主题
 * @returns 主题颜色变量对象
 */
export function generateThemeColors(mainColor: string, accentColor: string, isDark: boolean): Record<string, string> {
  const colors: Record<string, string> = {};
  
  // 基本颜色
  colors['--theme-yellow-color'] = '#ffc700';
  colors['--theme-brand-color'] = accentColor;
  colors['--theme-error-color'] = 'hsla(30, 100%, 55%, 1)';
  
  // 品牌颜色变体
  colors['--theme-brand-color-p4'] = addAlpha(accentColor, 0.35);
  colors['--theme-brand-color-p3'] = addAlpha(adjustBrightness(accentColor, 10), 0.5);
  colors['--theme-error-color-p3'] = 'hsla(30, 100%, 55%, 0.25)';
  
  // 主题颜色
  colors['--theme-color-700'] = accentColor;
  colors['--theme-color-600'] = adjustBrightness(accentColor, -10);
  
  if (isDark) {
    // 深色主题
    colors['--theme-color-550'] = adjustBrightness(mainColor, 5);
    colors['--theme-color-500'] = mainColor; // 编辑器背景
    colors['--theme-color-400'] = adjustBrightness(mainColor, 5);
    colors['--theme-color-350'] = adjustBrightness(mainColor, 5);
    colors['--theme-color-300'] = adjustBrightness(mainColor, 10); // 编辑器背景点
    colors['--theme-color-200'] = adjustBrightness(mainColor, 5);
    colors['--theme-color-150'] = adjustBrightness(mainColor, 10);
    colors['--theme-color-100'] = mainColor;
    colors['--theme-color-50'] = adjustBrightness(mainColor, 10);
    colors['--theme-color-b100'] = accentColor;
    colors['--theme-color-b200'] = adjustBrightness(mainColor, 5);
    colors['--theme-color-g500'] = '#808080';
    colors['--theme-color-g450'] = 'rgba(156, 163, 175, 0.4)';
    colors['--theme-color-g400'] = '#eeeeee';
    colors['--theme-color-g300'] = '#b3b3b3';
    colors['--theme-text-primary'] = '#eeeeee';
    colors['--theme-border-color-tip'] = addAlpha(accentColor, 0.25);
    colors['--gui-item-active-transparent'] = addAlpha(accentColor, 0.35);
  } else {
    // 浅色主题
    colors['--theme-color-550'] = '#ffffff';
    colors['--theme-color-500'] = mainColor; // 编辑器背景
    colors['--theme-color-400'] = adjustBrightness(mainColor, -5);
    colors['--theme-color-350'] = '#ffffff';
    colors['--theme-color-300'] = adjustBrightness(mainColor, -5); // 编辑器背景点
    colors['--theme-color-200'] = '#ffffff';
    colors['--theme-color-150'] = adjustBrightness(mainColor, -5);
    colors['--theme-color-100'] = mainColor;
    colors['--theme-color-50'] = adjustBrightness(mainColor, -5);
    colors['--theme-color-b100'] = accentColor;
    colors['--theme-color-b200'] = '#ffffff';
    colors['--theme-color-g500'] = '#808080';
    colors['--theme-color-g450'] = 'rgba(156, 163, 175, 0.4)';
    colors['--theme-color-g400'] = '#333333';
    colors['--theme-color-g300'] = '#555555';
    colors['--theme-text-primary'] = '#333333';
    colors['--theme-border-color-tip'] = addAlpha(accentColor, 0.25);
    colors['--gui-item-active-transparent'] = addAlpha(accentColor, 0.35);
  }
  
  return colors;
}

/**
 * 生成CSS样式字符串
 * @param selector CSS选择器
 * @param properties CSS属性对象
 * @returns CSS样式字符串
 */
export function generateCssString(selector: string, properties: Record<string, string>): string {
  let css = `${selector} {\n`;
  
  for (const [property, value] of Object.entries(properties)) {
    css += `  ${property}: ${value};\n`;
  }
  
  css += '}\n';
  return css;
}
