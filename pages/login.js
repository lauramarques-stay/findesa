import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

const B = {
  orange:"#ff561c", bg:"#080808", surface:"#111111", card:"#161616",
  offwhite:"#f7f5f0", muted:"rgba(247,245,240,0.42)", border:"rgba(255,255,255,0.07)",
};

const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body{background:${B.bg};color:${B.offwhite};font-family:'DM Sans',sans-serif;}
  ::selection{background:${B.orange};color:#fff;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
  input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px ${B.card} inset!important;-webkit-text-fill-color:${B.offwhite}!important;}
`;

export default function Login() {
  const router  = useRouter();
  const [mode,  setMode]  = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [name,  setName]  = useState("");
  const [err,   setErr]   = useState("");
  const [busy,  setBusy]  = useState(false);
  const [sent,  setSent]  = useState(false);

  const inp = (val, set) => ({
    value: val, onChange: e => { set(e.target.value); setErr(""); },
    style: {
      width:"100%", padding:"13px 16px", background:"rgba(255,255,255,.06)",
      border:`1px solid ${B.border}`, borderRadius:12, color:B.offwhite,
      fontSize:15, outline:"none", marginBottom:12,
      fontFamily:"'DM Sans',sans-serif",
    }
  });

  const submit = async () => {
    if (!email || !pass) return setErr("Preencha todos os campos.");
    setBusy(true); setErr("");
    try {
      if (mode === "signup") {
        if (!name) return setErr("Digite seu nome.");
        const { error } = await supabase.auth.signUp({
          email, password: pass,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        router.push("/");
      }
    } catch (e) {
      setErr(e.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : e.message);
    } finally { setBusy(false); }
  };

  if (sent) return (
    <div style={{ minHeight:"100vh", background:B.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{CSS}</style>
      <div style={{ textAlign:"center", maxWidth:400 }}>
        <div style={{ fontSize:56, marginBottom:20 }}>📬</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:26, marginBottom:12 }}>Confirme seu e-mail</h2>
        <p style={{ color:B.muted, lineHeight:1.7 }}>Enviamos um link de confirmação para <strong style={{color:B.offwhite}}>{email}</strong>. Clique nele para ativar sua conta e depois faça login.</p>
        <button onClick={()=>{setSent(false);setMode("login");}} style={{ marginTop:28, padding:"12px 28px", background:B.orange, border:"none", borderRadius:12, color:"#fff", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14, cursor:"pointer" }}>
          Ir para o login
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>Stay – {mode === "login" ? "Entrar" : "Criar conta"}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      </Head>
      <style>{CSS}</style>

      <div style={{ minHeight:"100vh", background:B.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-5%", left:"50%", transform:"translateX(-50%)", width:600, height:600, background:`radial-gradient(circle,${B.orange}18 0%,transparent 62%)`, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)`, backgroundSize:"60px 60px", pointerEvents:"none" }}/>

        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:420, animation:"fadeUp .4s ease both" }}>
          {/* Logo */}
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <img src="/logo.png" alt="Stay" style={{ height:44, margin:"0 auto", display:"block" }}/>
          </div>

          <div style={{ background:B.card, border:`1px solid ${B.border}`, borderRadius:24, padding:"32px 28px" }}>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22, marginBottom:6 }}>
              {mode === "login" ? "Bem-vinda de volta 👋" : "Criar sua conta"}
            </h1>
            <p style={{ color:B.muted, fontSize:14, marginBottom:26 }}>
              {mode === "login" ? "Entre para ver seu histórico e desafios." : "Comece a rastrear seus gastos agora."}
            </p>

            {mode === "signup" && (
              <input placeholder="Seu nome" {...inp(name, setName)}/>
            )}
            <input placeholder="E-mail" type="email" {...inp(email, setEmail)}/>
            <input placeholder="Senha" type="password" {...inp(pass, setPass)}
              onKeyDown={e => e.key === "Enter" && submit()}
            />

            {err && <p style={{ color:"#ff4444", fontSize:13, marginBottom:12 }}>{err}</p>}

            <button
              onClick={submit} disabled={busy}
              style={{ width:"100%", padding:"13px", background:B.orange, border:"none", borderRadius:12, color:"#fff", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, cursor:busy?"not-allowed":"pointer", opacity:busy?.7:1, transition:"opacity .2s" }}
            >
              {busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>

            <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:B.muted }}>
              {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
              <span onClick={() => { setMode(mode==="login"?"signup":"login"); setErr(""); }} style={{ color:B.orange, cursor:"pointer", fontWeight:700 }}>
                {mode === "login" ? "Criar agora" : "Fazer login"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
