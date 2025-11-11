import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import CashBox from "../components/CashBox";
import { printReceipt } from "../utils/print";
import { loadSettings } from "../utils/settings";
import { searchCustomers } from "../api/customers";

const fmt = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(n||0);

export default function POS(){
  const [q,setQ] = useState("");
  const [products,setProducts] = useState([]);
  const [cart,setCart] = useState([]);
  const [method,setMethod] = useState("efectivo");
  const [lastSale, setLastSale] = useState(null);

  // Cliente
  const [customer, setCustomer] = useState(null);
  const [custQuery, setCustQuery] = useState("");
  const [custList, setCustList] = useState([]);

  // Estado de cuenta (panel)
  const [showStatement, setShowStatement] = useState(false);
  const [statement, setStatement] = useState(null);
  const [loadingStmt, setLoadingStmt] = useState(false);

  const search = async (qq="")=>{
    const r = await api.get("/products",{ params:{ query: qq }});
    setProducts(r.data);
  };
  useEffect(()=>{ search(""); },[]);
  useEffect(()=>{ (async()=>{ 
    if(custQuery.length>=2){ setCustList(await searchCustomers(custQuery)); } else { setCustList([]); }
  })(); },[custQuery]);

  const add = (p)=>{
    const currentQty = cart.filter(x=>x.product.id===p.id).reduce((s,i)=>s+i.qty,0);
    if (p.stock <= currentQty){
      alert(`Stock insuficiente de "${p.name}". Disponible: ${p.stock}`);
      return;
    }
    setCart(prev=>{
      const idx = prev.findIndex(x=>x.product.id===p.id);
      if(idx>=0){ const cp=[...prev]; cp[idx].qty +=1; return cp;}
      return [...prev, {product:p, qty:1, price:Number(p.price)}];
    });
  };
  const setQty = (i,v)=>{
    const q = Math.max(1, parseInt(v||"1",10));
    const p = cart[i].product;
    const others = cart.reduce((s,it,idx)=> idx===i ? s : (it.product.id===p.id ? s+it.qty : s), 0);
    if(q + others > p.stock){
      alert(`No podés superar el stock (${p.stock}) de "${p.name}"`);
      return;
    }
    setCart(prev=> prev.map((it,idx)=> idx===i? {...it, qty:q}: it));
  };
  const removeAt = (i)=> setCart(prev=> prev.filter((_,idx)=> idx!==i));

  const totals = useMemo(()=>{
    const subtotal = cart.reduce((s,i)=> s + i.price*i.qty, 0);
    const iva = cart.reduce((s,i)=> s + (i.price*i.qty)*(Number(i.product.tax_rate)/100), 0);
    return {subtotal, iva, total: subtotal+iva};
  },[cart]);

  const charge = async ()=>{
    const st = await api.get("/cash/status");
    if(!st.data.open){
      const m = window.prompt("No hay caja abierta. Monto inicial:","0");
      if(m===null) return;
      await api.post("/cash/open",{opening_amount:Number(m)||0});
    }
    if(cart.length===0){ alert("Carrito vacío"); return; }
    if(method==="cta" && !customer){ alert("Seleccioná un cliente para Cuenta Corriente."); return; }

    const payload = {
      subtotal: totals.subtotal, tax_total: totals.iva, discount: 0, total: totals.total,
      payment_method: method, pos_id:"PV-0001",
      customer: customer?.id,
      items: cart.map(i=>({product:i.product.id, qty:i.qty, price:i.price, tax_rate:i.product.tax_rate, total:(i.price*i.qty)*(1+Number(i.product.tax_rate)/100)}))
    };
    try{
      const r = await api.post("/sales", payload);
      setLastSale(r.data);
      alert("Venta OK: "+fmt(r.data.total));
      setCart([]); search(q);
      const cfg = loadSettings();
      if(cfg.autoPrint) printReceipt(r.data);
    }catch(err){
      const data = err?.response?.data;
      if(data?.detail === "Stock insuficiente"){
        const msg = (data.items||[]).map(x=>`• ${x.name}: necesita ${x.need}, disponible ${x.available}`).join('\n');
        alert("No se pudo completar la venta por stock:\n"+msg);
      }else{
        alert("Error al cobrar.");
      }
    }
  };

  const printTicket = ()=>{
    if(!lastSale){ alert("No hay venta para imprimir"); return; }
    printReceipt(lastSale);
  };

  // Abrir estado de cuenta
  const openStatement = async ()=>{
    if(!customer) return;
    setLoadingStmt(true); setShowStatement(true);
    try{
      const r = await api.get(`/accounts/${customer.id}/statement`);
      setStatement(r.data);
    }finally{
      setLoadingStmt(false);
    }
  };

  // Atajos F9/F10
  useEffect(()=>{
    const onKey = (e)=>{
      if(e.key === "F9"){ e.preventDefault(); charge(); }
      if(e.key === "F10"){ e.preventDefault(); printTicket(); }
    };
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  }, [charge, printTicket]);

  return (
    <div style={{padding:16}}>
      <div className="grid grid-2">
        <div className="panel">
          {/* Cliente para CC */}
          <div className="row" style={{marginBottom:8, alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <input className="input" placeholder="Buscar cliente (2+ letras)..." value={custQuery} onChange={e=>setCustQuery(e.target.value)} />
              {custList.length>0 && (
                <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,marginTop:4,maxHeight:160,overflow:"auto"}}>
                  {custList.map(c=>(
                    <div key={c.id} style={{padding:"6px 10px",cursor:"pointer"}} onClick={()=>{setCustomer(c); setCustQuery(c.name); setCustList([]);}}>
                      {c.name} {c.document ? `· ${c.document}`:""}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{minWidth:300}}>
              <div><b>Cliente:</b> {customer ? customer.name : "—"}</div>
              <div className="row" style={{marginTop:6}}>
                {customer && <button className="btn" onClick={()=>{setCustomer(null); setCustQuery("");}}>Quitar</button>}
                {customer && <button className="btn btn-primary" onClick={openStatement}>Ver cuenta</button>}
              </div>
            </div>
          </div>

          <div className="row">
            <input className="input" placeholder="Buscar o escanear..." value={q} onChange={e=>{setQ(e.target.value); search(e.target.value);}} />
          </div>
          <table className="table">
            <thead><tr><th>Descripción</th><th className="right">Stock</th><th className="right">Precio</th><th></th></tr></thead>
            <tbody>
              {products.map(p=>(
                <tr key={p.id} style={p.stock<=0 ? {opacity:.5} : {}}>
                  <td>{p.name}</td>
                  <td className="right">{p.stock}</td>
                  <td className="right">{fmt(p.price)}</td>
                  <td><button className="btn" disabled={p.stock<=0} onClick={()=>add(p)}>+</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h3 style={{marginTop:0}}>Carrito</h3>
          <table className="table">
            <thead><tr><th>Item</th><th>Stock</th><th>Cant.</th><th className="right">Importe</th><th></th></tr></thead>
            <tbody>
              {cart.map((it,idx)=>(
                <tr key={idx}>
                  <td>{it.product.name}</td>
                  <td>{it.product.stock}</td>
                  <td><input className="input" style={{width:90}} type="number" min="1" value={it.qty} onChange={e=>setQty(idx,e.target.value)} /></td>
                  <td className="right">{fmt(it.price*it.qty)}</td>
                  <td><button className="btn" onClick={()=>removeAt(idx)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{marginTop:8}}>
            <div className="row"><div>Subtotal</div><div style={{marginLeft:"auto"}}><b>{fmt(totals.subtotal)}</b></div></div>
            <div className="row"><div>IVA</div><div style={{marginLeft:"auto"}}><b>{fmt(totals.iva)}</b></div></div>
            <div className="row"><div>Total</div><div style={{marginLeft:"auto"}}><b>{fmt(totals.total)}</b></div></div>
          </div>
          <div className="row" style={{marginTop:8}}>
            <select className="input" value={method} onChange={e=>setMethod(e.target.value)}>
              <option value="efectivo">Efectivo</option>
              <option value="qr">QR/Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="cta">Cuenta Corriente</option>
            </select>
            <button className="btn btn-primary" onClick={charge}>Cobrar (F9)</button>
            <button className="btn" onClick={printTicket}>Imprimir Ticket (F10)</button>
          </div>
        </div>
      </div>

      {/* Panel de Estado de cuenta (modal simple) */}
      {showStatement && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,.35)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000
        }}>
          <div className="panel" style={{width:"min(900px, 96vw)", maxHeight:"85vh", overflow:"auto"}}>
            <div className="row" style={{justifyContent:"space-between"}}>
              <h3 style={{margin:0}}>Cuenta de {customer?.name}</h3>
              <button className="btn" onClick={()=>setShowStatement(false)}>Cerrar</button>
            </div>
            {loadingStmt && <div style={{padding:12}}>Cargando…</div>}
            {!loadingStmt && statement && (
              <>
                <div style={{margin:"8px 0"}}><b>Saldo:</b> {fmt(statement.balance||0)}</div>
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
              </>
            )}
          </div>
        </div>
      )}

      <div style={{marginTop:16}}>
        <CashBox/>
      </div>
    </div>
  );
}
