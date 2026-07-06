import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTasks, createTask, updateTask, deleteTask } from "../api/tasks";

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  assigned_to_username: string | null;
}

export default function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", priority: "medium", due_date: "",
  });

  useEffect(() => { fetchTasks(); }, [filterStatus, filterPriority]);

  const fetchTasks = async () => {
    try {
      const res = await getTasks(Number(id), {
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
      });
      setTasks(res.data.tasks);
    } catch {
      setError("Impossible de charger les tâches.");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditTask(null);
    setForm({ title: "", description: "", priority: "medium", due_date: "" });
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      due_date: task.due_date ? task.due_date.slice(0, 10) : "",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    try {
      if (editTask) {
        await updateTask(editTask.id, {
          title: form.title,
          description: form.description,
          priority: form.priority as Task["priority"],
          due_date: form.due_date || undefined,
        });
      } else {
        await createTask(Number(id), {
          title: form.title,
          description: form.description,
          priority: form.priority,
          due_date: form.due_date || undefined,
        });
      }
      setShowModal(false);
      fetchTasks();
    } catch {
      setError("Erreur lors de la sauvegarde.");
    }
  };

  const handleStatusChange = async (task: Task, status: Task["status"]) => {
    try {
      await updateTask(task.id, { status });
      fetchTasks();
    } catch {
      setError("Erreur lors de la mise à jour.");
    }
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    try {
      await deleteTask(taskId);
      fetchTasks();
    } catch {
      setError("Erreur lors de la suppression.");
    }
  };

  const badgeStyle = (type: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      todo: { color: "#c084fc", border: "1px solid #c084fc", background: "rgba(192,132,252,.08)" },
      in_progress: { color: "var(--amber)", border: "1px solid var(--amber)", background: "rgba(255,184,0,.08)" },
      done: { color: "var(--primary)", border: "1px solid var(--primary)", background: "rgba(255,46,196,.08)" },
      low: { color: "#a78bfa", border: "1px solid #a78bfa", background: "rgba(167,139,250,.08)" },
      medium: { color: "var(--amber)", border: "1px solid var(--amber)", background: "rgba(255,184,0,.08)" },
      high: { color: "var(--rose)", border: "1px solid var(--rose)", background: "rgba(255,107,224,.12)" },
    };
    return { ...styles.badge, ...map[type] };
  };

  const statusLabel: Record<string, string> = {
    todo: "Todo", in_progress: "In progress", done: "Done",
  };

  return (
    <div style={styles.shell}>
      <div style={styles.sidebar}>
        <div style={styles.brand}>★ Gestio</div>
        <div style={styles.navlink} onClick={() => navigate("/dashboard")}>‹ Dashboard</div>
        <div style={{ ...styles.navlink, ...styles.navlinkOn }}>▸ Liste #{id}</div>
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

      <div style={styles.main}>
        <div style={styles.mainHead}>
          <div>
            <div style={styles.eyebrow}>// Liste #{id}</div>
            <h1>Tâches</h1>
          </div>
          <button style={styles.btn} onClick={openCreate}>+ Nouvelle tâche</button>
        </div>

        <div style={styles.filters}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={styles.select}>
            <option value="">Statut : Tous</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={styles.select}>
            <option value="">Priorité : Toutes</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div style={styles.loading}>Chargement...</div>
        ) : tasks.length === 0 ? (
          <div style={styles.empty}>Aucune tâche. Crée ta première tâche !</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} style={styles.taskRow}>
              <span style={badgeStyle(task.status)}>{statusLabel[task.status]}</span>
              <span style={styles.taskTitle}>{task.title}</span>
              <span style={badgeStyle(task.priority)}>{task.priority}</span>
              {task.due_date && (
                <span style={styles.taskDue}>⏱ {new Date(task.due_date).toLocaleDateString("fr-FR")}</span>
              )}
              <div style={styles.taskActions}>
                {task.status !== "done" && (
                  <button style={styles.actionBtn} onClick={() => handleStatusChange(task, task.status === "todo" ? "in_progress" : "done")}>
                    {task.status === "todo" ? "▶" : "✓"}
                  </button>
                )}
                <button style={styles.actionBtn} onClick={() => openEdit(task)}>✎</button>
                <button style={{ ...styles.actionBtn, color: "var(--danger)" }} onClick={() => handleDelete(task.id)}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <span style={styles.modalClose} onClick={() => setShowModal(false)}>✕ fermer</span>
            <h2 style={{ marginBottom: 18 }}>{editTask ? "Modifier la tâche" : "Nouvelle tâche"}</h2>

            <label style={styles.label}>Titre</label>
            <input type="text" placeholder="Ex : Ajouter le rate limiting"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />

            <label style={styles.label}>Description</label>
            <textarea placeholder="Détails..." value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ ...styles.textarea }} />

            <label style={styles.label}>Priorité</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={styles.select}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <label style={styles.label}>Date limite</label>
            <input type="date" value={form.due_date}
              onChange={e => setForm({ ...form, due_date: e.target.value })} />

            <div style={styles.modalActions}>
              <button style={styles.btn} onClick={handleSubmit}>
                {editTask ? "Sauvegarder" : "Créer la tâche"}
              </button>
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
    borderLeft: "2px solid transparent", marginBottom: 2, cursor: "pointer",
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
  filters: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  select: {
    background: "var(--bg-panel)", color: "var(--text-primary)",
    border: "1px solid var(--line)", padding: "9px 12px",
    fontFamily: "'JetBrains Mono', monospace", fontSize: 12, outline: "none",
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
  taskRow: {
    display: "flex", alignItems: "center", gap: 14,
    background: "var(--bg-panel)", border: "1px solid var(--line)",
    padding: "14px 16px", marginBottom: 10, flexWrap: "wrap",
  },
  taskTitle: { flex: 1, fontSize: 14, fontWeight: 500 },
  taskDue: { fontFamily: "'JetBrains Mono'", fontSize: 11, color: "var(--text-dim)" },
  taskActions: { display: "flex", gap: 6 },
  actionBtn: {
    background: "transparent", border: "1px solid var(--line)",
    color: "var(--text-dim)", padding: "4px 8px", cursor: "pointer",
    fontFamily: "'JetBrains Mono'", fontSize: 12, transition: ".15s",
  },
  badge: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
    padding: "4px 9px", textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap",
  },
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
  textarea: { minHeight: 70, resize: "vertical" as const },
};