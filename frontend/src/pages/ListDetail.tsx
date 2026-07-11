import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTasks, createTask, updateTask, deleteTask } from "../api/tasks";
import StarRating from "../components/StarRating";
import socket from "../socket/client";

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

// Connexion Socket.io + chargement initial
useEffect(() => {
  socket.auth = { token: localStorage.getItem("accessToken") };
  socket.connect();
  socket.emit("join_list", Number(id));

  socket.on("task:created", (task) => {
    setTasks(prev => [task, ...prev]);
  });

  socket.on("task:updated", (updated) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  });

  socket.on("task:deleted", ({ id: deletedId }: { id: number }) => {
    setTasks(prev => prev.filter(t => t.id !== deletedId));
  });

  fetchTasks();

  return () => {
    socket.emit("leave_list", Number(id));
    socket.off("task:created");
    socket.off("task:updated");
    socket.off("task:deleted");
    socket.disconnect();
  };
}, [id]);

// Recharge quand les filtres changent
useEffect(() => {
  fetchTasks();
}, [filterStatus, filterPriority]);

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

  const statusLabel: Record<string, string> = {
    todo: "TODO", in_progress: "IN PROGRESS", done: "DONE",
  };

  const statusColors: Record<string, React.CSSProperties> = {
    todo: { color: "var(--purple)", border: "1px solid var(--purple)", background: "rgba(192,132,252,.06)" },
    in_progress: { color: "var(--amber)", border: "1px solid var(--amber)", background: "rgba(255,184,0,.06)" },
    done: { color: "#3a2a3a", border: "1px solid #2a1a2a", background: "#050005" },
  };

  return (
    <div style={s.shell}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.brand}>★ STARLOG</div>
        <div style={s.navlink} onClick={() => navigate("/dashboard")}>‹ DASHBOARD</div>
        <div style={{ ...s.navlink, ...s.navOn }}>▸ LISTE #{id}</div>
        <div style={s.userBlock}>
          <div style={s.avatar}>★</div>
          <div style={{ flex: 1 }}>
            <div style={s.userName}>MON COMPTE</div>
            <div style={s.logout} onClick={() => { logout(); navigate("/login"); }}>[ DÉCO ]</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.mainHead}>
          <div>
            <div style={s.eyebrow}>// LISTE #{id}</div>
            <div style={s.pageTitle}>TÂCHES</div>
          </div>
          <button style={s.btn} onClick={openCreate}>[ + NOUVELLE TÂCHE ]</button>
        </div>

        {/* Filtres */}
        <div style={s.filters}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={s.select}>
            <option value="">STATUT : TOUS</option>
            <option value="todo">TODO</option>
            <option value="in_progress">IN PROGRESS</option>
            <option value="done">DONE</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={s.select}>
            <option value="">PRIORITÉ : TOUTES</option>
            <option value="low">★☆☆ LOW</option>
            <option value="medium">★★☆ MEDIUM</option>
            <option value="high">★★★ HIGH</option>
          </select>
        </div>

        {error && <div style={s.error}>{error}</div>}

        {loading ? (
          <div style={s.dim}>CHARGEMENT...</div>
        ) : tasks.length === 0 ? (
          <div style={s.dim}>AUCUNE TÂCHE. CRÉE TA PREMIÈRE TÂCHE !</div>
        ) : (
          tasks.map(task => {
            const isDone = task.status === "done";
            return (
              <div key={task.id} style={{ ...s.taskRow, ...(isDone ? s.taskDone : {}) }}>
                <span style={{ ...s.badge, ...statusColors[task.status] }}>
                  {statusLabel[task.status]}
                </span>
                <span style={{ ...s.taskTitle, ...(isDone ? s.taskTitleDone : {}) }}>
                  {task.title}
                </span>
                <StarRating priority={task.priority} dim={isDone} />
                {task.due_date && (
                  <span style={s.taskDue}>
                    ⏱ {new Date(task.due_date).toLocaleDateString("fr-FR")}
                  </span>
                )}
                <div style={s.taskActions}>
                  {!isDone && (
                    <button style={s.actionBtn}
                      onClick={() => handleStatusChange(task, task.status === "todo" ? "in_progress" : "done")}>
                      {task.status === "todo" ? "▶" : "✓"}
                    </button>
                  )}
                  <button style={s.actionBtn} onClick={() => openEdit(task)}>✎</button>
                  <button style={{ ...s.actionBtn, color: "var(--danger)" }}
                    onClick={() => handleDelete(task.id)}>✕</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <span style={s.modalClose} onClick={() => setShowModal(false)}>✕ FERMER</span>
            <div style={s.modalTitle}>{editTask ? "MODIFIER LA TÂCHE" : "NOUVELLE TÂCHE"}</div>

            <label style={s.label}>TITRE</label>
            <input type="text" placeholder="EX : RATE LIMITING"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />

            <label style={s.label}>DESCRIPTION</label>
            <textarea placeholder="DÉTAILS..." value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ minHeight: 70, resize: "vertical" }} />

            <label style={s.label}>PRIORITÉ</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">★☆☆ LOW</option>
              <option value="medium">★★☆ MEDIUM</option>
              <option value="high">★★★ HIGH</option>
            </select>

            <label style={s.label}>DATE LIMITE</label>
            <input type="date" value={form.due_date}
              onChange={e => setForm({ ...form, due_date: e.target.value })} />

            <div style={s.modalActions}>
              <button style={s.btn} onClick={handleSubmit}>
                {editTask ? "[ SAUVEGARDER ]" : "[ CRÉER ]"}
              </button>
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
  filters: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  select: {
    background: "var(--panel)", color: "var(--text)", border: "1px solid var(--line)",
    padding: "9px 12px", fontFamily: "'Share Tech Mono', monospace", fontSize: 11, outline: "none",
  },
  error: {
    marginBottom: 16, padding: "10px 12px", fontSize: 11,
    background: "rgba(255,59,92,.1)", border: "1px solid var(--danger)",
    color: "var(--danger)", fontFamily: "'Share Tech Mono', monospace",
  },
  dim: { color: "var(--text-dim)", fontFamily: "'Share Tech Mono', monospace", fontSize: 12 },
  taskRow: {
    display: "flex", alignItems: "center", gap: 12,
    background: "var(--panel)", border: "1px solid var(--line)",
    padding: "14px 16px", marginBottom: 8, flexWrap: "wrap", transition: ".2s",
  },
  taskDone: {
    background: "#050005", borderColor: "rgba(255,46,196,0.04)",
    opacity: 0.45, filter: "grayscale(0.6)",
  },
  taskTitle: { flex: 1, fontSize: 13, letterSpacing: ".02em" },
  taskTitleDone: { textDecoration: "line-through", color: "var(--text-dim)" },
  taskDue: { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "var(--text-dim)" },
  taskActions: { display: "flex", gap: 4 },
  actionBtn: {
    background: "transparent", border: "1px solid var(--line)",
    color: "var(--text-dim)", padding: "4px 8px", cursor: "pointer",
    fontFamily: "'Share Tech Mono', monospace", fontSize: 11, transition: ".15s",
  },
  badge: {
    fontFamily: "'Share Tech Mono', monospace", fontSize: 9, fontWeight: 700,
    padding: "4px 8px", textTransform: "uppercase", letterSpacing: ".1em", whiteSpace: "nowrap",
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
    color: "var(--text-dim)", fontSize: 11, fontFamily: "'Share Tech Mono', monospace",
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