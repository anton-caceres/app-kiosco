import { useEffect, useState } from "react";
import "./index.css";
import Login from "./pages/Login";
import POS from "./pages/POS";
import api from "./api/client";
import Admin from "./pages/Admin";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Customers from "./pages/Customers";
import Accounts from "./pages/Accounts";
import OpenCash from "./pages/OpenCash";
import { initTheme } from "./utils/theme";
import { loadSettings } from "./utils/settings";

export default function App(){
  const [auth,setAuth] = useState(false);
  const [user,setUser] = useState(null);
  const [view,setView] = useState("pos");
  const [needsOpenCash, setNeedsOpenCash] = useState(false);
  const { storeName, brandColor, logoUrl } = loadSettings();

  // aplica color de marca como CSS var
  useEffect(()=>{
    const r = document.documentElement;
    if(brandColor) r.style.setProperty("--brand", brandColor);
  }, [brandColor]);

  const loadMe = async ()=>{
    try{ const r = await api.get("/me"); setUser(r.data); setAuth(true); }
    catch{ setAuth(false); }
  };
  const checkCash = async ()=>{
    try{ const r = await api.get("/cash/status"); setNeedsOpenCash(!r.data.open); }
    catch{ setNeedsOpenCash(true); }
  };

  useEffect(()=>{ initTheme?.(); },[]);
  useEffect(()=>{ if(localStorage.getItem("token")) loadMe(); },[]);
  useEffect(()=>{ if(auth) checkCash(); },[auth]);

  if(!auth) return <Login onLogin={loadMe} />;

  const isAdmin = !!user?.is_staff;

  const Header = (
    <div className="brand-bg" style={{padding:"10px 16px"}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, maxWidth:1320, margin:"0 auto"}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          {logoUrl ? (
            <img src={logoUrl} alt="logo" style={{width:36, height:36, borderRadius:8, objectFit:"cover", background:"#fff"}} />
          ) : (
            <div style={{width:36,height:36,borderRadius:8,display:"grid",placeItems:"center",background:"rgba(255,255,255,.15)",fontWeight:700}}>
              {String(storeName||"N").slice(0,1).toUpperCase()}
            </div>
          )}
          <div style={{fontWeight:800}}>{storeName||"Mi Negocio"}</div>
          <div className="brand-chip" style={{marginLeft:8}}>POS</div>
          <div style={{display:"flex", gap:6, marginLeft:12}}>
            <button className="btn" onClick={()=>setView("pos")}>Caja/Ventas</button>
            {isAdmin && <button className="btn" onClick={()=>setView("admin")}>Administrar</button>}
            {isAdmin && <button className="btn" onClick={()=>setView("reports")}>Reportes</button>}
            {isAdmin && <button className="btn" onClick={()=>setView("customers")}>Clientes</button>}
            {isAdmin && <button className="btn" onClick={()=>setView("accounts")}>Cuentas</button>}
            {isAdmin && <button className="btn" onClick={()=>setView("settings")}>Configuración</button>}
          </div>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <span>Usuario: {user?.username} {isAdmin ? "(admin)" : ""}</span>
          <button className="btn" onClick={()=>{localStorage.removeItem("token"); location.reload();}}>Salir</button>
        </div>
      </div>
    </div>
  );

  if(needsOpenCash){
    return <OpenCash onOpened={()=>{ setNeedsOpenCash(false); setView("pos"); }} />;
  }

  return (
    <>
      {Header}
      {view==="pos" && <POS/>}
      {view==="admin" && <Admin/>}
      {view==="reports" && <Reports/>}
      {view==="customers" && <Customers/>}
      {view==="accounts" && <Accounts/>}
      {view==="settings" && <Settings/>}
    </>
  );
}
