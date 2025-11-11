export const loadSettings = () => {
  const raw = localStorage.getItem("kiosco_settings");
  const def = {
    storeName: "Mi Negocio",
    brandColor: "#1e40af",   // azul por defecto
    logoUrl: "",             // pegá aquí una URL de tu logo (opcional)
    autoPrint: false
  };
  if (!raw) return def;
  try { return { ...def, ...JSON.parse(raw) }; } catch { return def; }
};

export const saveSettings = (cfg) => {
  localStorage.setItem("kiosco_settings", JSON.stringify(cfg));
};

export const resetSettings = () => {
  localStorage.removeItem("kiosco_settings");
};
