import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as loginApi } from "../api/auth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      login(res.data.accessToken, res.data.refreshToken);
      navigate("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.panel}>
        <div style={styles.starDeco}>★</div>
        <div style={styles.eyebrow}>// Authentification</div>
        <h1 style={styles.title}>Connexion</h1>

        <label style={styles.label}>Email</label>
        <input
          type="email"
          placeholder="agent@gestio.io"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <label style={styles.label}>Mot de passe</label>
        <input
          type="password"
          placeholder="••••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
        />

        {error && <div style={styles.error}>{error}</div>}

        <button style={styles.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? "Connexion..." : "Se connecter →"}
        </button>

        <div style={styles.switchLink}>
          Pas encore de compte ?{" "}
          <Link to="/register" style={styles.link}>S'inscrire</Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", padding: "40px 20px", position: "relative", zIndex: 5,
  },
  panel: {
    width: "100%", maxWidth: 400,
    background: "var(--bg-panel)", border: "1px solid var(--line)",
    padding: 36, position: "relative",
    boxShadow: "0 0 60px rgba(255,46,196,.08)",
  },
  starDeco: {
    position: "absolute", top: 10, right: 14, fontSize: 18,
    opacity: .35, color: "var(--primary)",
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
    color: "var(--primary)", letterSpacing: ".15em",
    textTransform: "uppercase", marginBottom: 8,
  },
  title: { fontSize: 28, marginBottom: 24 },
  label: {
    display: "block", fontSize: 12, color: "var(--text-dim)",
    fontFamily: "'JetBrains Mono', monospace", margin: "16px 0 6px",
    textTransform: "uppercase", letterSpacing: ".05em",
  },
  error: {
    marginTop: 12, padding: "10px 12px", fontSize: 13,
    background: "rgba(255,59,92,.1)", border: "1px solid var(--danger)",
    color: "var(--danger)",
  },
  btn: {
    width: "100%", marginTop: 22,
    background: "linear-gradient(135deg, var(--crimson), var(--primary))",
    color: "#fff", border: "none", padding: "12px 20px",
    fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600,
    fontSize: 14, letterSpacing: ".03em", textTransform: "uppercase",
    cursor: "pointer",
  },
  switchLink: { marginTop: 18, fontSize: 13, color: "var(--text-dim)", textAlign: "center" },
  link: { color: "var(--primary)", textDecoration: "none", fontWeight: 600 },
};