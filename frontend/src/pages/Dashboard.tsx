import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLists, createList, deleteList } from "../api/lists";

interface TaskList {
  id: number;
  name: string;
  role: string;
}

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [lists, setLists] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const res = await getLists();
      setLists(res.data.lists);
    } catch {
      setError("Impossible de charger les listes.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      await createList(newListName.trim());
      setNewListName("");
      setShowModal(false);
      fetchLists();
    } catch {
      setError("Erreur lors de la création.");
    }
  };

  const handleDeleteList = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer cette liste ?")) return;
    try {
      await deleteList(id);
      fetchLists();
    } catch {
      setError("Erreur lors de la suppression.");
    }
  };

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.brand}>★ Gestio</div>
        <div style={{ ...styles.navlink, ...styles.navlinkOn }}>▸ Dashboard</div>
        <div style={styles.userBlock}>
          <div style={styles.avatar}>★</div>
          <div style={{ flex: 1 }}>
            <div style={styles.userName}>Mon compte</div>
            <div style={styles.logout} onClick={() => { logout(); navigate("/login"); }}>
              Déconnexion
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={styles.main}>
        <div style={styles.mainHead}>
          <div>
            <div style={styles.eyebrow}>// Vue principale</div>
            <h1>Mes listes de tâches</h1>
          </div>
          <button style={styles.btn} onClick={() => setShowModal(true)}>+ Nouvelle liste</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div style={styles.loading}>Chargement...</div>
        ) : lists.length === 0 ? (
          <div style={styles.empty}>Aucune liste pour le moment. Crée ta première liste !</div>
        ) : (
          <div style={styles.grid}>
            {lists.map(list => (
              <div key={list.id} style={styles.card} onClick={() => navigate(`/lists/${list.id}`)}>
                <div style={styles.cardTag}>{list.role.toUpperCase()}</div>
                <h3 style={{ margin: "8px 0 12px" }}>{list.name}</h3>
                <div style={styles.cardMeta}>
                  <span style={styles.cardDelete} onClick={e => handleDeleteList(list.id, e)}>
                    Supprimer
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <span style={styles.modalClose} onClick={() => setShowModal(false)}>✕ fermer</span>
            <h2 style={{ marginBottom: 18 }}>Nouvelle liste</h2>
            <label style={styles.label}>Titre de la liste</label>
            <input
              type="text"
              placeholder="Ex : Sprint 05"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreateList()}
              autoFocus
            />
            <div style={styles.modalActions}>
              <button style={styles.btn} onClick={handleCreateList}>Créer la liste</button>
              <button style={styles.btnGhost} onClick={() => setShowModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { display: "flex", minHeight: "100vh", position: "relative", zIndex: 5 },
  sidebar: {
    width: 230, flexShrink: 0, background: "var(--bg-panel)",
    borderRight: "1px solid var(--line)", padding: "24px 16px",
    display: "flex", flexDirection: "column",
  },
  brand: {
    fontSize: 20, marginBottom: 32,
    background: "linear-gradient(135deg, var(--rose), var(--primary))",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    fontFamily: "'Chakra Petch', sans-serif",
  },
  navlink: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
    color: "var(--text-dim)", padding: "10px 10px",
    borderLeft: "2px solid transparent", marginBottom: 2,
  },
  navlinkOn: {
    color: "var(--primary)", borderLeft: "2px solid var(--primary)",
    background: "rgba(255,46,196,.06)",
  },
  userBlock: {
    marginTop: "auto", borderTop: "1px solid var(--line)",
    paddingTop: 16, display: "flex", alignItems: "center", gap: 10,
  },
  avatar: {
    width: 34, height: 34, flexShrink: 0,
    background: "linear-gradient(135deg, var(--crimson), var(--primary))",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontFamily: "'Chakra Petch', sans-serif", fontSize: 16,
  },
  userName: { fontSize: 13, fontWeight: 600 },
  logout: { fontSize: 11, color: "var(--text-dim)", fontFamily: "'JetBrains Mono'", cursor: "pointer" },
  main: { flex: 1, padding: 32 },
  mainHead: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12,
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
    color: "var(--primary)", letterSpacing: ".15em",
    textTransform: "uppercase", marginBottom: 4,
  },
  btn: {
    background: "linear-gradient(135deg, var(--crimson), var(--primary))",
    color: "#fff", border: "none", padding: "12px 20px",
    fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600,
    fontSize: 14, letterSpacing: ".03em", textTransform: "uppercase", cursor: "pointer",
  },
  btnGhost: {
    background: "transparent", color: "var(--text-primary)",
    border: "1px solid var(--line)", padding: "12px 20px",
    fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600,
    fontSize: 14, cursor: "pointer",
  },
  error: {
    marginBottom: 16, padding: "10px 12px", fontSize: 13,
    background: "rgba(255,59,92,.1)", border: "1px solid var(--danger)", color: "var(--danger)",
  },
  loading: { color: "var(--text-dim)", fontFamily: "'JetBrains Mono', monospace" },
  empty: { color: "var(--text-dim)", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18,
  },
  card: {
    background: "var(--bg-panel)", border: "1px solid var(--line)",
    padding: 20, cursor: "pointer", transition: ".2s", position: "relative",
  },
  cardTag: {
    fontFamily: "'JetBrains Mono'", fontSize: 10,
    color: "var(--primary)", letterSpacing: ".1em",
  },
  cardMeta: { display: "flex", justifyContent: "flex-end" },
  cardDelete: { fontSize: 11, color: "var(--danger)", fontFamily: "'JetBrains Mono'", cursor: "pointer" },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(10,0,8,.8)",
    backdropFilter: "blur(4px)", zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    width: "100%", maxWidth: 420, background: "var(--bg-panel-2)",
    border: "1px solid var(--primary)", padding: 28, position: "relative",
    boxShadow: "0 0 60px rgba(255,46,196,.2)",
  },
  modalClose: { position: "absolute", top: 14, right: 16, cursor: "pointer", color: "var(--text-dim)", fontFamily: "'JetBrains Mono'", fontSize: 14 },
  modalActions: { display: "flex", gap: 10, marginTop: 20 },
  label: {
    display: "block", fontSize: 12, color: "var(--text-dim)",
    fontFamily: "'JetBrains Mono', monospace", margin: "16px 0 6px",
    textTransform: "uppercase", letterSpacing: ".05em",
  },
};