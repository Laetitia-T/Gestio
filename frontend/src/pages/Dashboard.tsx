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

  useEffect(() => { fetchLists(); }, []);

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
    <div style={s.shell}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.brand}>★ STARLOG</div>
        <div style={{ ...s.navlink, ...s.navOn }}>▸ DASHBOARD</div>
        <div style={s.navlink}>MES LISTES</div>
        <div style={s.navlink}>ÉQUIPE</div>
        <div style={s.userBlock}>
          <div style={s.avatar}>★</div>
          <div style={{ flex: 1 }}>
            <div style={s.userName}>MON COMPTE</div>
            <div style={s.logout} onClick={() => { logout(); navigate("/login"); }}>
              [ DÉCO ]
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.mainHead}>
          <div>
            <div style={s.eyebrow}>// VUE PRINCIPALE</div>
            <div style={s.pageTitle}>MES LISTES</div>
          </div>
          <button style={s.btn} onClick={() => setShowModal(true)}>
            [ + NOUVELLE LISTE ]
          </button>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          <div style={s.statChip}>
            <span style={s.statVal}>{String(lists.length).padStart(2, "0")}</span>
            <div style={s.statLabel}>LISTES</div>
          </div>
        </div>

        {error && <div style={s.error}>{error}</div>}

        {loading ? (
          <div style={s.dim}>CHARGEMENT...</div>
        ) : lists.length === 0 ? (
          <div style={s.dim}>AUCUNE LISTE. CRÉE TA PREMIÈRE LISTE !</div>
        ) : (
          <div style={s.grid}>
            {lists.map(list => (
              <div key={list.id} style={s.card} onClick={() => navigate(`/lists/${list.id}`)}>
                <div style={s.cardTag}>★ {list.role.toUpperCase()}</div>
                <div style={s.cardTitle}>{list.name.toUpperCase()}</div>
                <div style={s.cardMeta}>
                  <span
                    style={s.cardDelete}
                    onClick={e => handleDeleteList(list.id, e)}
                  >
                    [ SUPPRIMER ]
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <span style={s.modalClose} onClick={() => setShowModal(false)}>✕ FERMER</span>
            <div style={s.modalTitle}>NOUVELLE LISTE</div>
            <label style={s.label}>TITRE</label>
            <input
              type="text" placeholder="EX : SPRINT 05"
              value={newListName} onChange={e => setNewListName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreateList()}
              autoFocus
            />
            <div style={s.modalActions}>
              <button style={s.btn} onClick={handleCreateList}>[ CRÉER ]</button>
              <button style={s.btnGhost} onClick={() => setShowModal(false)}>[ ANNULER ]</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  shell: { display: "flex", minHeight: "100vh", position: "relative", zIndex: 5 },
  sidebar: {
    width: 220, flexShrink: 0, background: "var(--panel)",
    borderRight: "1px solid var(--line)", padding: "24px 14px",
    display: "flex", flexDirection: "column",
  },
  brand: {
    fontFamily: "'Press Start 2P', monospace", fontSize: 13,
    color: "var(--pink)", marginBottom: 32, letterSpacing: ".1em",
    textShadow: "0 0 10px var(--pink), 0 0 20px var(--pink-glow)",
  },
  navlink: {
    fontFamily: "'Share Tech Mono', monospace", fontSize: 12,
    color: "var(--text-dim)", padding: "10px 10px",
    borderLeft: "2px solid transparent", marginBottom: 2, cursor: "pointer",
  },
  navOn: {
    color: "var(--pink)", borderLeft: "2px solid var(--pink)",
    background: "rgba(255,46,196,.05)",
    textShadow: "0 0 6px rgba(255,46,196,.4)",
  },
  userBlock: {
    marginTop: "auto", borderTop: "1px solid var(--line)",
    paddingTop: 16, display: "flex", alignItems: "center", gap: 10,
  },
  avatar: {
    width: 32, height: 32, flexShrink: 0,
    background: "var(--black)", border: "1px solid var(--pink)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "var(--pink)",
    boxShadow: "0 0 8px var(--pink-glow)",
  },
  userName: { fontSize: 11, letterSpacing: ".05em", fontFamily: "'Share Tech Mono', monospace" },
  logout: { fontSize: 10, color: "var(--text-dim)", cursor: "pointer", marginTop: 2 },
  main: { flex: 1, padding: "28px 32px" },
  mainHead: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12,
  },
  eyebrow: {
    fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
    color: "var(--pink)", letterSpacing: ".2em",
    textTransform: "uppercase", marginBottom: 8,
    textShadow: "0 0 8px var(--pink-glow)",
  },
  pageTitle: {
    fontFamily: "'Press Start 2P', monospace", fontSize: 14,
    color: "var(--pink)", textShadow: "0 0 10px var(--pink), 0 0 20px var(--pink-glow)",
    lineHeight: 1.6,
  },
  statsRow: { display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" },
  statChip: {
    background: "var(--panel)", border: "1px solid var(--line)",
    padding: "14px 18px", minWidth: 100,
  },
  statVal: {
    fontFamily: "'Press Start 2P', monospace", fontSize: 20,
    color: "var(--pink)", textShadow: "0 0 10px var(--pink-glow)",
    display: "block", marginBottom: 6,
  },
  statLabel: { fontSize: 9, color: "var(--text-dim)", letterSpacing: ".1em" },
  error: {
    marginBottom: 16, padding: "10px 12px", fontSize: 11,
    background: "rgba(255,59,92,.1)", border: "1px solid var(--danger)",
    color: "var(--danger)", fontFamily: "'Share Tech Mono', monospace",
  },
  dim: { color: "var(--text-dim)", fontFamily: "'Share Tech Mono', monospace", fontSize: 12 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 },
  card: {
    background: "var(--panel)", border: "1px solid var(--line)",
    padding: 18, cursor: "pointer", transition: ".2s",
  },
  cardTag: {
    fontSize: 9, color: "var(--pink)", letterSpacing: ".15em",
    textTransform: "uppercase", marginBottom: 8,
    textShadow: "0 0 6px var(--pink-glow)",
    fontFamily: "'Share Tech Mono', monospace",
  },
  cardTitle: {
    fontFamily: "'Share Tech Mono', monospace", fontSize: 14,
    marginBottom: 14, letterSpacing: ".02em",
  },
  cardMeta: { display: "flex", justifyContent: "flex-end" },
  cardDelete: {
    fontSize: 10, color: "var(--danger)",
    fontFamily: "'Share Tech Mono', monospace", cursor: "pointer",
  },
  btn: {
    background: "var(--pink)", color: "var(--black)", border: "none",
    padding: "12px 18px", fontFamily: "'Press Start 2P', monospace",
    fontSize: 9, letterSpacing: ".05em", textTransform: "uppercase",
    cursor: "pointer", boxShadow: "0 0 16px var(--pink-glow)",
  },
  btnGhost: {
    background: "transparent", color: "var(--text)", border: "1px solid var(--line)",
    padding: "12px 18px", fontFamily: "'Press Start 2P', monospace",
    fontSize: 9, cursor: "pointer",
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.9)",
    backdropFilter: "blur(4px)", zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    width: "100%", maxWidth: 400, background: "var(--panel2)",
    border: "1px solid var(--pink)", padding: 28, position: "relative",
    boxShadow: "0 0 60px rgba(255,46,196,.25)",
  },
  modalClose: {
    position: "absolute", top: 12, right: 14, cursor: "pointer",
    color: "var(--text-dim)", fontSize: 11,
    fontFamily: "'Share Tech Mono', monospace",
  },
  modalTitle: {
    fontFamily: "'Press Start 2P', monospace", fontSize: 11,
    color: "var(--pink)", marginBottom: 20, paddingLeft: 18,
    textShadow: "0 0 8px var(--pink-glow)", lineHeight: 1.6,
  },
  modalActions: { display: "flex", gap: 10, marginTop: 20 },
  label: {
    display: "block", fontSize: 10, color: "var(--text-dim)",
    fontFamily: "'Share Tech Mono', monospace",
    margin: "16px 0 6px", textTransform: "uppercase", letterSpacing: ".1em",
  },
};