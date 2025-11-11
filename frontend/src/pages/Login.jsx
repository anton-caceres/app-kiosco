import { useState } from "react";
import api from "../api/client";

export default function Login({ onLogin }){
  const [username,setUsername] = useState("empleado");
  const [password,setPassword] = useState("empleado123");
  const [error,setError] = useState("");

  const submit = async (e)=>{
    e.preventDefault();
    setError("");
    try{
      const r = await api.post("/token/", {username, password});
      localStorage.setItem("token", r.data.access);
      onLogin();
    }catch(err){
      setError("Credenciales inválidas");
    }
  }

  return (
    <div style={{minHeight:"100vh"}} className="green-bg">
      <div style={{display:"grid",placeItems:"center",minHeight:"100vh"}}>
        <form onSubmit={submit} className="panel" style={{width:360}}>
          <h2 style={{marginTop:0}}>Iniciar sesión</h2>
          <div className="grid">
            <input className="input" placeholder="Usuario" value={username} onChange={e=>setUsername(e.target.value)} />
            <input className="input" placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            {error && <div style={{color:"crimson"}}>{error}</div>}
            <button className="btn btn-primary" type="submit">Ingresar</button>
            <small>Demo: <b>admin/admin123</b> o <b>empleado/empleado123</b></small>
          </div>
        </form>
      </div>
    </div>
  );
}
