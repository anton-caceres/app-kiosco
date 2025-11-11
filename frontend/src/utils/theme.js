import { loadSettings } from "./settings";

/** Aplica el tema agregando un atributo data-theme al <html> */
export function applyTheme(themeName){
  const theme = themeName || loadSettings().theme || "blue";
  document.documentElement.setAttribute("data-theme", theme);
}

/** Llamalo una vez al inicio */
export function initTheme(){
  applyTheme(loadSettings().theme);
}
