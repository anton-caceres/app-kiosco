import { useEffect, useMemo, useState } from "react";
import api from "../api/client";

const fmt = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(n||0);

export default function Admin(){
  const empty = {id:null, barcode:"", name:"", category:"", cost:"", price:"", tax_rate:"21", stock:"0", min_stock:"0"};
  const [items,setItems] = useState([]);
  const [cats,setCats] = useState([]);
  const [q,setQ] = useState("");
  const [form,setForm] = useState(empty);
  const [loading,setLoading] = useState(false);
  const [editing,setEditing] = useState(false);

  const load = async ()=>{
    const [p,c] = await Promise.all([
      api.get("/products",{params:{query:q}}),
      api.get("/categories")
    ]);
    setItems(p.data);
    setCats(c.data);
  };
  useEffect(()=>{ load(); },[q]);

  const startNew = ()=>{ setEditing(false); setForm(empty); };
  const startEdit = async (id)=>{
    const r = await api.get(`/products/${id}`);
    setForm({
      id:r.data.id, barcode:r.data.barcode, name:r.data.name,
      category:r.data.category || "",
      cost:r.data.cost, price:r.data.price, tax_rate:r.data.tax_rate,
      stock:r.data.stock, min_stock:r.data.min_stock
    });
    setEditing(true);
  };

  const save = async (e)=>{
    e.preventDefault();
    setLoading(true);
    try{
      const payload = {
        barcode: form.barcode, name: form.name,
        category: form.category || null,
        cost: Number(form.cost||0), price: Number(form.price||0),
        tax_rate: Number(form.tax_rate||0), stock: Number(form.stock||0),
        min_stock: Number(form.min_stock||0)
      };
      if(editing){
        await api.put(`/products/${form.id}`, payload);
      }else{
        await api.post("/products", payload);
      }
      await load(); startNew();
    }finally{ setLoading(false); }
  };

  const del = async (id)=>{
    if(!confirm("¿Eliminar producto?")) return;
    await api.delete(`/products/${id}`);
    await load();
  };

  return (
    <div style={{padding:16}}>
      <div className="grid grid-2">
        <div className="panel">
          <div className="row" style={{justifyContent:"space-between"}}>
            <h3 style={{margin:0}}>Productos</h3>
            <input className="input" placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)} style={{maxWidth:260}}/>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Código</th><th>Descripción</th><th className="right">Precio</th><th className="right">Stock</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(p=>(
                <tr key={p.id}>
                  <td>{p.barcode}</td>
                  <td>{p.name}</td>
                  <td className="right">{fmt(p.price)}</td>
                  <td className="right">{p.stock}</td>
                  <td style={{whiteSpace:"nowrap"}}>
                    <button className="btn" onClick={()=>startEdit(p.id)}>Editar</button>{' '}
                    <button className="btn" onClick={()=>del(p.id)}>Borrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h3 style={{marginTop:0}}>{editing ? "Editar producto" : "Nuevo producto"}</h3>
          <form onSubmit={save} className="grid">
            <input className="input" placeholder="Código de barras" value={form.barcode} onChange={e=>setForm({...form, barcode:e.target.value})}/>
            <input className="input" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
            <select className="input" value={form.category||""} onChange={e=>setForm({...form, category:e.target.value||null})}>
              <option value="">(Sin categoría)</option>
              {cats.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="row">
              <input className="input" style={{flex:1}} placeholder="Costo" type="number" step="0.01" value={form.cost} onChange={e=>setForm({...form, cost:e.target.value})}/>
              <input className="input" style={{flex:1}} placeholder="Precio" type="number" step="0.01" value={form.price} onChange={e=>setForm({...form, price:e.target.value})}/>
            </div>
            <div className="row">
              <input className="input" style={{flex:1}} placeholder="IVA %" type="number" step="0.01" value={form.tax_rate} onChange={e=>setForm({...form, tax_rate:e.target.value})}/>
              <input className="input" style={{flex:1}} placeholder="Stock" type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})}/>
              <input className="input" style={{flex:1}} placeholder="Stock mín." type="number" value={form.min_stock} onChange={e=>setForm({...form, min_stock:e.target.value})}/>
            </div>
            <div className="row">
              <button className="btn btn-primary" disabled={loading} type="submit">{editing ? "Guardar cambios" : "Crear"}</button>
              <button className="btn" type="button" onClick={startNew}>Limpiar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
