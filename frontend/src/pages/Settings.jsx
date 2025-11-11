import { useEffect, useState } from "react";
import { loadSettings, saveSettings, resetSettings } from "../utils/settings";

export default function Settings(){
  const [cfg,setCfg] = useState(loadSettings());
  useEffect(()=>{
    // aplica color vivo en tiempo real
    if(cfg.brandColor) document.documentElement.style.setProperty("--brand", cfg.brandColor);
  },[cfg.brandColor]);

  const save = ()=>{
    saveSettings(cfg);
    alert("Guardado ✅");
    location.reload();
  };
  const reset = ()=>{
    if(confirm("¿Restablecer configuración?")){ resetSettings(); location.reload(); }
  };

  return (
    <div style={{padding:16, maxWidth:720}}>
      <h2>Configuración</h2>
      <div className="panel">
        <div className="row">
          <div style={{flex:1}}>
            <label>Nombre del negocio</label>
            <input className="input" value={cfg.storeName} onChange={e=>setCfg({...cfg, storeName: e.target.value})}/>
          </div>
        </div>
        <div className="row" style={{marginTop:8, gap:12}}>
          <div>
            <label>Color de marca</label>
            <input className="input" type="color" value={cfg.brandColor} onChange={e=>setCfg({...cfg, brandColor: e.target.value})} style={{width:80, padding:0, height:40}} />
          </div>
          <div style={{flex:1}}>
            <label>Logo (URL)</label>
            <input className="input" value={cfg.logoUrl} onChange={e=>setCfg({...cfg, logoUrl: e.target.value})} placeholder="https://mi-logo.png" />
          </div>
        </div>
        <div className="row" style={{marginTop:8}}>
          <label style={{display:"flex",alignItems:"center",gap:8}}>
            <input type="checkbox" checked={!!cfg.autoPrint} onChange={e=>setCfg({...cfg, autoPrint: e.target.checked})}/>
            Imprimir ticket automáticamente
          </label>
        </div>
        <div className="row" style={{marginTop:12, gap:8}}>
          <button className="btn btn-primary" onClick={save}>Guardar</button>
          <button className="btn" onClick={reset}>Restablecer</button>
        </div>
      </div>
    </div>
  );
}
