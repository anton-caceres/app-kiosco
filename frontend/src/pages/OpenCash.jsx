import { useEffect, useState } from "react";
import api from "../api/client";
import { loadSettings } from "../utils/settings";

export default function OpenCash({ onOpened }){
  const { storeName, brandColor, logoUrl } = loadSettings();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(()=>{
    if(brandColor){
      const r = document.documentElement;
      r.style.setProperty("--brand", brandColor);
    }
  },[brandColor]);

  const openCash = async (mOverride)=>{
    setLoading(true); setErr("");
    try{
      const m = mOverride ?? parseFloat(amount||"0");
      if(isNaN(m) || m<0){ setErr("Monto inválido"); setLoading(false); return; }
      await api.post("/cash/open",{ opening_amount: m });
      onOpened?.();
    }catch{
      setErr("No se pudo abrir la caja");
    }finally{
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:"100vh",
      background: "linear-gradient(135deg, var(--brand), #0b1024 85%)",
      display:"grid", placeItems:"center", padding:16, color:"#fff"
    }}>
      <div style={{width:"min(560px, 96vw)", background:"#0b1024", border:"1px solid rgba(255,255,255,.12)",
                   borderRadius:16, boxShadow:"0 10px 30px rgba(0,0,0,.35)", padding:22}}>
        <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:8}}>
          {logoUrl ? (
            <img src={logoUrl} alt="logo" style={{width:42,height:42,borderRadius:10,objectFit:"cover", background:"#fff"}}/>
          ) : (
            <div style={{width:42,height:42,borderRadius:10,display:"grid",placeItems:"center",background:"rgba(255,255,255,.15)",fontWeight:800}}>
              {String(storeName||"N").slice(0,1).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{fontSize:12,letterSpacing:1,opacity:.8}}>APERTURA DE CAJA</div>
            <div style={{fontSize:22,fontWeight:800}}>{storeName||"Mi Negocio"}</div>
          </div>
        </div>

        <div style={{marginTop:12}}>
          <label style={{fontSize:14,opacity:.9}}>Monto inicial</label>
          <input
            className="input"
            type="number"
            placeholder="$ 0,00"
            value={amount}
            onChange={e=>setAmount(e.target.value)}
            style={{width:"100%", marginTop:6, background:"#11172a", color:"#fff", borderColor:"rgba(255,255,255,.2)"}}
          />
          {err && <div style={{color:"#fca5a5", fontSize:13, marginTop:6}}>{err}</div>}
        </div>

        <div style={{display:"flex", gap:8, marginTop:16}}>
          <button className="brand-btn btn" onClick={()=>openCash()} disabled={loading}>
            {loading ? "Abriendo..." : "Abrir caja"}
          </button>
          <button className="btn" onClick={()=>openCash(0)} disabled={loading} style={{borderColor:"rgba(255,255,255,.3)", color:"#fff"}}>
            Usar $0
          </button>
        </div>
      </div>
    </div>
  );
}
