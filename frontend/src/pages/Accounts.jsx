import { useEffect, useState } from "react";
import api from "../api/client";
import { searchCustomers } from "../api/customers";

const fmt = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(n||0);

export default function Accounts(){
  const [tab,setTab] = useState("statement"); // statement | summary
  const [q,setQ] = useState("");
  const [list,setList] = useState([]);
  const [customer,setCustomer] = useState(null);
  const [statement,setStatement] = useState(null);
  const [payAmount,setPayAmount] = useState("");
  const [payNotes,setPayNotes] = useState("");

  useEffect(()=>{ (async()=>{ if(q.length>=2) setList(await searchCustomers(q)); else setList([]); })(); },[q]);

  const loadStatement = async (c)=>{
    const r = await api.get(`/accounts/${c.id}/statement`);
    setStatement(r.data);
  };
  const registerPayment = async ()=>{
    if(!customer) return;
    await api.post(`/accounts/${customer.id}/pay`, { amount: Number(payAmount||0), notes: payNotes||"Pago" });
    setPayAmount(""); setPayNotes("");
    await loadStatement(customer);
  };
  const loadSummary = async ()=>{
    const r = await api.get("/accounts/summary");
    setStatement({rows:r.data.rows||[]});
  };

  useEffect(()=>{ if(tab==="summary") loadSummary(); },[tab]);

  return (
    <div style={{padding:16}} className="grid">
      <div className="panel">
        <div className="row" style={{justifyContent:"space-between"}}>
          <div className="row" style={{gap:8}}>
            <button className="btn" onClick={()=>setTab("statement")}>Cuentas corrientes de clientes</button>
            <button className="btn" onClick={()=>setTab("summary")}>Resumen de cuentas corrientes</button>
          </div>
          {tab==="statement" && (
            <div className="row" style={{gap:8}}>
              <input className="input" placeholder="Buscar cliente (2+ letras)..." value={q} onChange={e=>setQ(e.target.value)} />
              <button className="btn" onClick={()=>customer && loadStatement(customer)}>Ver</button>
            </div>
          )}
        </div>
      </div>

      {tab==="statement" && (
        <div className="grid">
          <div className="panel">
            <h3 style={{marginTop:0}}>Seleccionar cliente</h3>
            <div className="row" style={{gap:8,flexWrap:"wrap"}}>
              {list.map(c=>(
                <button key={c.id} className="btn" onClick={()=>{setCustomer(c); loadStatement(c);}}>
                  {c.name}{c.document?` · ${c.document}`:""}
                </button>
              ))}
            </div>
          </div>

          {statement && (
            <div className="panel">
              <h3 style={{marginTop:0}}>Estado de cuenta — {statement.customer?.name}</h3>
              <div style={{marginBottom:8}}><b>Saldo:</b> {fmt(statement.balance||0)}</div>
              <table className="table">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Detalle</th><th className="right">Importe</th></tr></thead>
                <tbody>
                  {statement.entries.map(e=>(
                    <tr key={e.id}>
                      <td>{new Date(e.created_at).toLocaleString('es-AR')}</td>
                      <td>{e.type==="DEBIT"?"Débito":"Crédito"}</td>
                      <td>{e.notes || (e.sale ? `Venta #${e.sale}` : "")}</td>
                      <td className="right">{fmt(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="row" style={{marginTop:10}}>
                <input className="input" placeholder="Monto pago" value={payAmount} onChange={e=>setPayAmount(e.target.value)} />
                <input className="input" placeholder="Notas" value={payNotes} onChange={e=>setPayNotes(e.target.value)} />
                <button className="btn btn-primary" onClick={registerPayment}>Registrar pago</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="summary" && (
        <div className="panel">
          <h3 style={{marginTop:0}}>Resumen de cuentas corrientes</h3>
          <table className="table">
            <thead><tr><th>Cliente</th><th className="right">Saldo</th></tr></thead>
            <tbody>
              {(statement?.rows||[]).map((r,ix)=>(
                <tr key={ix}>
                  <td>{r.customer}</td>
                  <td className="right">{fmt(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
