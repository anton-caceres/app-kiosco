import { useEffect, useState } from "react";
import api from "../api/client";

const fmt = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(n||0);

export default function CashBox(){
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Ingreso");
  const [reason, setReason] = useState("");
  const [closing, setClosing] = useState("");

  const refresh = async ()=>{
    setLoading(true);
    const r = await api.get("/cash/status");
    setStatus(r.data);
    setLoading(false);
  };
  useEffect(()=>{ refresh(); },[]);

  const openCash = async ()=>{
    const m = parseFloat(amount||"0");
    await api.post("/cash/open",{opening_amount:m});
    setAmount("");
    refresh();
  };
  const moveCash = async ()=>{
    const m = parseFloat(amount||"0");
    if(!m){ alert("Monto inválido"); return; }
    await api.post("/cash/move",{type:type.toLowerCase(), amount:m, notes:reason});
    setAmount(""); setReason("");
    refresh();
  };
  const closeCash = async ()=>{
    const m = parseFloat(closing||status?.estimated||0);
    await api.post("/cash/close",{closing_amount:m});
    setClosing("");
    refresh();
  };

  if(loading) return <div className="panel">Cargando caja...</div>;

  return (
    <div className="panel" style={{marginTop:20}}>
      {status.open ? (
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h3 style={{margin:0, color:"green"}}>🟢 Caja Abierta</h3>
            <div><b>Efectivo estimado:</b> {fmt(status.estimated||0)}</div>
          </div>

          <div style={{marginTop:10, background:"#f3f4f6",padding:10,borderRadius:8}}>
            <h4 style={{marginTop:0}}>Registrar movimiento</h4>
            <div className="row" style={{alignItems:"center",gap:8}}>
              <select className="input" value={type} onChange={e=>setType(e.target.value)}>
                <option>Ingreso</option>
                <option>Egreso</option>
              </select>
              <input className="input" style={{width:140}} placeholder="Monto" type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
              <input className="input" style={{flex:1}} placeholder="Motivo (opcional)" value={reason} onChange={e=>setReason(e.target.value)} />
              <button className="btn btn-primary" onClick={moveCash}>Registrar</button>
            </div>
          </div>

          <div style={{marginTop:10, background:"#f9fafb",padding:10,borderRadius:8}}>
            <h4 style={{marginTop:0}}>Resumen de caja</h4>
            <div>💵 Ventas: {Object.entries(status.sales_by_method||{}).map(([m,v])=>`${m}: ${fmt(v)}`).join(" · ")}</div>
            <div>📈 Ingresos: {fmt(status.incomes||0)} · 📉 Egresos: {fmt(status.expenses||0)}</div>
          </div>

          <div style={{marginTop:10, background:"#fff0f0",padding:10,borderRadius:8}}>
            <h4 style={{marginTop:0}}>Cerrar caja</h4>
            <div className="row" style={{alignItems:"center",gap:8}}>
              <input className="input" style={{width:160}} placeholder="Monto cierre" value={closing} onChange={e=>setClosing(e.target.value)} />
              <button className="btn" onClick={closeCash}>Cerrar caja</button>
              <button className="btn" onClick={refresh}>↻ Actualizar</button>
            </div>
          </div>
        </>
      ):(
        <>
          <h3 style={{margin:0, color:"darkred"}}>🔴 Caja Cerrada</h3>
          <p>Antes de registrar ventas, debés abrir la caja.</p>
          <div className="row" style={{alignItems:"center",gap:8}}>
            <input className="input" style={{width:160}} placeholder="Monto inicial" type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
            <button className="btn btn-primary" onClick={openCash}>Abrir caja</button>
          </div>
        </>
      )}
    </div>
  );
}
