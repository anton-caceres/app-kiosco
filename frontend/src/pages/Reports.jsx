import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const fmt = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(n||0);

/* Utils CSV */
function downloadCSV(filename, headers, rows){
  const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${String(v??"").replace(/"/g,'""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

export default function Reports(){
  const today = new Date().toISOString().slice(0,10);
  const [from,setFrom] = useState(today);
  const [to,setTo] = useState(today);
  const [tab,setTab] = useState("date"); // date | detailed | category | product | method

  // data stores
  const [sales,setSales] = useState([]);            // ventas por fecha
  const [detailed,setDetailed] = useState([]);      // ventas con items
  const [byCat,setByCat] = useState([]);            // por rubros
  const [byProd,setByProd] = useState([]);          // por artículos
  const [byMethod,setByMethod] = useState([]);      // por medios

  const load = async ()=>{
    if(tab==="date"){
      const r = await api.get("/reports/sales",{params:{date_from:from,date_to:to}});
      setSales(r.data.sales||[]);
    }else if(tab==="detailed"){
      const r = await api.get("/reports/sales_detailed",{params:{date_from:from,date_to:to}});
      setDetailed(r.data.sales||[]);
    }else if(tab==="category"){
      const r = await api.get("/reports/by_category",{params:{date_from:from,date_to:to}});
      setByCat(r.data.rows||[]);
    }else if(tab==="product"){
      const r = await api.get("/reports/by_product",{params:{date_from:from,date_to:to}});
      setByProd(r.data.rows||[]);
    }else if(tab==="method"){
      const r = await api.get("/reports/by_method",{params:{date_from:from,date_to:to}});
      setByMethod(r.data.rows||[]);
    }
  };

  useEffect(()=>{ load(); },[tab]);
  const reload = ()=> load();

  // CSV para cada pestaña
  const csvDate = ()=>{
    downloadCSV(`ventas_${from}_${to}.csv`,
      ["ID","FechaHora","Usuario","Medio","Subtotal","IVA","Total","Items"],
      sales.map(r=>[r.id, new Date(r.datetime).toLocaleString('es-AR'), r.user, r.payment_method, r.subtotal, r.tax_total, r.total, r.items])
    );
  };
  const csvDetailed = ()=>{
    // una fila por ítem
    const rows = [];
    detailed.forEach(s=>{
      s.items.forEach(i=>{
        rows.push([s.id, new Date(s.datetime).toLocaleString('es-AR'), s.user, s.payment_method, i.product_name, i.qty, i.price, i.total, s.total]);
      });
    });
    downloadCSV(`ventas_detalle_${from}_${to}.csv`,
      ["Venta","FechaHora","Usuario","Medio","Producto","Cant","Precio","Total Item","Total Venta"],
      rows
    );
  };
  const csvCat = ()=>{
    downloadCSV(`ventas_rubros_${from}_${to}.csv`,
      ["Rubro","Cantidad","Total"],
      byCat.map(r=>[r.category, r.qty, r.total])
    );
  };
  const csvProd = ()=>{
    downloadCSV(`ventas_articulos_${from}_${to}.csv`,
      ["Codigo","Articulo","Cantidad","Total"],
      byProd.map(r=>[r.barcode, r.product, r.qty, r.total])
    );
  };
  const csvMethod = ()=>{
    downloadCSV(`ventas_medios_${from}_${to}.csv`,
      ["Medio","Cantidad Ventas","Total"],
      byMethod.map(r=>[r.method, r.count, r.total])
    );
  };

  const totalSales = useMemo(()=> sales.reduce((s,r)=>s+Number(r.total||0),0),[sales]);

  // colores para gráficos
  const COLORS = ["#2e7d32","#0ea5e9","#f59e0b","#a78bfa","#ef4444","#10b981","#f472b6","#22d3ee"];

  return (
    <div style={{padding:16}} className="grid">
      <div className="panel">
        <div className="row" style={{justifyContent:"space-between", flexWrap:"wrap", gap:8}}>
          <div className="row" style={{gap:8, flexWrap:"wrap"}}>
            <button className="btn" onClick={()=>setTab("date")}>Ventas por fecha</button>
            <button className="btn" onClick={()=>setTab("detailed")}>Ventas detalle por fecha</button>
            <button className="btn" onClick={()=>setTab("category")}>Ventas por rubros</button>
            <button className="btn" onClick={()=>setTab("product")}>Ventas por artículos</button>
            <button className="btn" onClick={()=>setTab("method")}>Ventas por medios de pago</button>
          </div>
          <div className="row" style={{gap:8}}>
            <input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} />
            <input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)} />
            <button className="btn" onClick={reload}>Buscar</button>
            {tab==="date" && <button className="btn btn-primary" onClick={csvDate}>CSV</button>}
            {tab==="detailed" && <button className="btn btn-primary" onClick={csvDetailed}>CSV</button>}
            {tab==="category" && <button className="btn btn-primary" onClick={csvCat}>CSV</button>}
            {tab==="product" && <button className="btn btn-primary" onClick={csvProd}>CSV</button>}
            {tab==="method" && <button className="btn btn-primary" onClick={csvMethod}>CSV</button>}
          </div>
        </div>
      </div>

      {/* TAB: Ventas por fecha */}
      {tab==="date" && (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Fecha/Hora</th><th>Usuario</th><th>Medio</th>
                <th className="right">Subtotal</th><th className="right">IVA</th><th className="right">Total</th><th className="right">Items</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(r=>(
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{new Date(r.datetime).toLocaleString('es-AR')}</td>
                  <td>{r.user}</td>
                  <td>{r.payment_method}</td>
                  <td className="right">{fmt(r.subtotal)}</td>
                  <td className="right">{fmt(r.tax_total)}</td>
                  <td className="right"><b>{fmt(r.total)}</b></td>
                  <td className="right">{r.items}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row" style={{justifyContent:"flex-end"}}><b>Total:</b>&nbsp;{fmt(totalSales)}</div>
        </div>
      )}

      {/* TAB: Ventas con detalle */}
      {tab==="detailed" && (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Venta</th><th>Fecha/Hora</th><th>Usuario</th><th>Medio</th><th>Detalle</th><th className="right">Total</th>
              </tr>
            </thead>
            <tbody>
              {detailed.map(s=>(
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{new Date(s.datetime).toLocaleString('es-AR')}</td>
                  <td>{s.user}</td>
                  <td>{s.payment_method}</td>
                  <td>
                    {s.items.map((i,ix)=>(
                      <div key={ix}>{i.qty}× {i.product_name} — ${Number(i.total).toFixed(2)}</div>
                    ))}
                  </td>
                  <td className="right"><b>{fmt(s.total)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: Por rubros (tabla + barras) */}
      {tab==="category" && (
        <div className="panel">
          <div className="grid">
            <div style={{height:320}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCat}>
                  <XAxis dataKey="category" hide />
                  <YAxis />
                  <Tooltip formatter={(v)=>fmt(v)} />
                  <Bar dataKey="total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table className="table">
              <thead><tr><th>Rubro</th><th className="right">Cant.</th><th className="right">Total</th></tr></thead>
              <tbody>
                {byCat.map((r,ix)=>(
                  <tr key={ix}>
                    <td>{r.category}</td>
                    <td className="right">{r.qty}</td>
                    <td className="right"><b>{fmt(r.total)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Por artículos (tabla + barras top 15) */}
      {tab==="product" && (
        <div className="panel">
          <div className="grid">
            <div style={{height:320}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byProd.slice(0,15)}>
                  <XAxis dataKey="product" hide />
                  <YAxis />
                  <Tooltip formatter={(v)=>fmt(v)} />
                  <Bar dataKey="total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table className="table">
              <thead><tr><th>Código</th><th>Artículo</th><th className="right">Cant.</th><th className="right">Total</th></tr></thead>
              <tbody>
                {byProd.map((r,ix)=>(
                  <tr key={ix}>
                    <td>{r.barcode}</td>
                    <td>{r.product}</td>
                    <td className="right">{r.qty}</td>
                    <td className="right"><b>{fmt(r.total)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Por medios de pago (torta + tabla) */}
      {tab==="method" && (
        <div className="panel">
          <div className="grid">
            <div style={{height:300}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="total" data={byMethod} nameKey="method" innerRadius={60} outerRadius={100} label>
                    {byMethod.map((entry, index) => <Cell key={index} />)}
                  </Pie>
                  <Tooltip formatter={(v)=>fmt(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <table className="table">
              <thead><tr><th>Medio</th><th className="right">Cant. ventas</th><th className="right">Total</th></tr></thead>
              <tbody>
                {byMethod.map((r,ix)=>(
                  <tr key={ix}>
                    <td>{r.method}</td>
                    <td className="right">{r.count}</td>
                    <td className="right"><b>{fmt(r.total)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
