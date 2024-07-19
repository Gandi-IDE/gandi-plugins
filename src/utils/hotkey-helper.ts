import { isMac } from "lib/client-info";

export const transitionHotkeysToString = (keys: string[]) =>
  keys.map((i) => {
    switch (i) {
      case "ctrlKey":
        return isMac ? "Command" : "Ctrl";
      case "altKey":
        return isMac ? "Option" : "Alt";
      case "shiftKey":
        return "Shift";
      default:
        return i;
    }
  });

export const FUNCTION_KEYS = {
  ctrlKey: isMac ? "metaKey" : "ctrlKey",
  altKey: "altKey",
  shiftKey: "shiftKey",
};

export const hotkeyIsDown = (keys: string[], event: KeyboardEvent) => {
  return keys.every((key) => {
    if (FUNCTION_KEYS[key]) {
      return event[FUNCTION_KEYS[key]];
    }
    return event.code === `Key${key}`;
  });
};

export const hotkeyIsUp = (keys: string[], event: KeyboardEvent) => {
  return keys.every((key) => {
    if (FUNCTION_KEYS[key]) {
      return !event[FUNCTION_KEYS[key]];
    }
    return event.code !== `Key${key}`;
  });
}