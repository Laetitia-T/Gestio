import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { register as registerApi } from "../api/auth";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await registerApi(email, username, password);
      login(res.data.accessToken, res.data.refreshToken);
      navigate("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrap}>
      <div style={s.panel}>
        <div style={s.cornerTL} /><div style={s.cornerBR} />
        {/* <div style={s.eyebrow}>// NOUVEL AGENT</div> */}
        <div style={s.brand}>STARLOG</div>

        <label style={s.label}>EMAIL</label>
        <input type="email" placeholder="agent@starlog.io" value={email} onChange={e => setEmail(e.target.value)} />

        <label style={s.label}>NOM D'UTILISATEUR</label>
        <input type="text" placeholder="star_runner" value={username} onChange={e => setUsername(e.target.value)} />

        <label style={s.label}>MOT DE PASSE</label>
        <input type="password" placeholder="••••••••••" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()} />

        {error && <div style={s.error}>{error}</div>}

        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? "[ ... ]" : "[ CRÉER MON COMPTE ]"}
        </button>

        <div style={s.switchLink}>
          Déjà inscrit ? <Link to="/login" style={s.link}>SE CONNECTER</Link>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", padding: "40px 20px", position: "relative", zIndex: 5,
  },
  panel: {
    width: "100%", maxWidth: 420,
    background: "var(--panel)", border: "1px solid var(--line)",
    padding: 36, position: "relative",
    boxShadow: "0 0 40px rgba(255,46,196,.06)",
  },
  cornerTL: {
    position: "absolute", top: -2, left: -2, width: 12, height: 12,
    background: "var(--pink)", borderRadius: 2,
    boxShadow: "0 0 8px var(--pink), 0 0 16px var(--pink-glow)",
  },
  cornerBR: {
    position: "absolute", bottom: -2, right: -2, width: 12, height: 12,
    background: "var(--pink)", borderRadius: 2,
    boxShadow: "0 0 8px var(--pink), 0 0 16px var(--pink-glow)",
  },
  eyebrow: {
    fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
    color: "var(--pink)", letterSpacing: ".2em",
    textTransform: "uppercase", marginBottom: 12,
    textShadow: "0 0 8px var(--pink-glow)",
  },
  brand: {
    fontFamily: "'Press Start 2P', monospace", fontSize: 22,
    color: "var(--pink)", marginBottom: 28, letterSpacing: ".1em",
    textShadow: "0 0 10px var(--pink), 0 0 20px var(--pink-glow)",
  },
  label: {
    display: "block", fontSize: 10, color: "var(--text-dim)",
    fontFamily: "'Share Tech Mono', monospace",
    margin: "18px 0 6px", textTransform: "uppercase", letterSpacing: ".1em",
  },
  error: {
    marginTop: 12, padding: "10px 12px", fontSize: 11,
    background: "rgba(255,59,92,.1)", border: "1px solid var(--danger)",
    color: "var(--danger)", fontFamily: "'Share Tech Mono', monospace",
  },
  btn: {
    width: "100%", marginTop: 24,
    background: "var(--pink)", color: "var(--black)",
    border: "none", padding: "14px 20px",
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 10, letterSpacing: ".05em", textTransform: "uppercase",
    cursor: "pointer", boxShadow: "0 0 16px var(--pink-glow)",
  },
  switchLink: {
    marginTop: 18, fontSize: 10, color: "var(--text-dim)",
    textAlign: "center", letterSpacing: ".05em",
    fontFamily: "'Share Tech Mono', monospace",
  },
  link: { color: "var(--pink)", textDecoration: "none", textShadow: "0 0 6px var(--pink-glow)" },
};