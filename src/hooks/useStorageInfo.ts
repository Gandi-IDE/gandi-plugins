import { useCallback, useMemo } from "react";

function useStorageInfo<T>(key: string, defaultValue: T) {
  const defaultStr = useMemo(() => JSON.stringify(defaultValue), [defaultValue]);
  const storageValue: string = localStorage.getItem(key) || defaultStr;

  const value: T = useMemo(() => JSON.parse(storageValue) || defaultValue, [storageValue]);

  const setValue = useCallback(
    (data: T) => {
      localStorage.setItem(key, JSON.stringify(data));
    },
    [key],
  );

  return [value, setValue] as const;
}

export default useStorageInfo;
