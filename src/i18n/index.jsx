import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import ru from './ru';
import kk from './kk';
const Context = createContext(null);
const dictionaries = { ru, kk };
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('nova-language') === 'kk' ? 'kk' : 'ru';
    } catch {
      return 'ru';
    }
  });
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('nova-language', lang);
    } catch {}
  }, [lang]);
  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (path, params = {}) => {
        let value = path.split('.').reduce((a, k) => a?.[k], dictionaries[lang]);
        if (typeof value !== 'string') return value ?? path;
        return value.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
      },
    }),
    [lang],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useT = () => useContext(Context);