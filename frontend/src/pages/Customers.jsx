import { useEffect, useState } from "react";
import api from "../api/client";

export default function Customers(){
  const empty = {id:null, name:"", document:"", phone:"", address:"", email:"", notes:"", active:true};
  const [q,setQ] = useState("");
  const [rows,setRows] = useState([]);
  const [form,setForm] = useState(empty);
  const [editing,setEditing] = useState(false);

  const load = async ()=>{ const r = await api.get("/customers",{params:{q}}); setRows(r.data||[]); };
  useEffect(()=>{ load(); },[q]);

  const edit = async (id)=>{ const r = await api.get(`/customers/${id}`); setForm(r.data); setEditing(true); };
  const reset = ()=>{ setForm(empty); setEditing(false); };

  const save = async (e)=>{
    e.preventDefault();
    if(editing) await api.put(`/customers/${form.id}`, form);
    else await api.post("/customers", form);
    await load(); reset();
  };
  const del = async (id)=>{
    if(!confirm("¿Desactivar cliente?")) return;
    await api.delete(`/customers/${id}`); await load();
  };

  return (
    <div style={{padding:16}} className="grid grid-2">
      <div className="panel">
        <div className="row" style={{justifyContent:"space-between"}}>
          <h3>Clientes</h3>
          <input className="input" placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)} style={{maxWidth:240}}/>
        </div>
        <table className="table">
          <thead><tr><th>Nombre</th><th>Documento</th><th>Teléfono</th><th>Dirección</th><th></th></tr></thead>
          <tbody>
            {rows.map(c=>(
              <tr key={c.id}>
                <td>{c.name}</td><td>{c.document||""}</td><td>{c.phone||""}</td><td>{c.address||""}</td>
                <td>
                  <button className="btn" onClick={()=>edit(c.id)}>Editar</button>{' '}
                  <button className="btn" onClick={()=>del(c.id)}>Desactivar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h3>{editing ? "Editar cliente" : "Nuevo cliente"}</h3>
        <form onSubmit={save} className="grid">
          <input className="input" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          <input className="input" placeholder="Documento" value={form.document||""} onChange={e=>setForm({...form,document:e.target.value})}/>
          <input className="input" placeholder="Teléfono" value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})}/>
          <input className="input" placeholder="Dirección" value={form.address||""} onChange={e=>setForm({...form,address:e.target.value})}/>
          <input className="input" placeholder="Email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})}/>
          <textarea className="input" placeholder="Notas" value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})}/>
          <div className="row">
            <button className="btn btn-primary" type="submit">{editing?"Guardar":"Crear"}</button>
            <button className="btn" type="button" onClick={reset}>Limpiar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
