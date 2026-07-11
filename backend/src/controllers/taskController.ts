import { Response } from "express";
import { pool } from "../db/pool";
import { AuthRequest } from "../middlewares/authenticate";
import { TaskStatus, TaskPriority } from "../types/index";
import { io } from "../server";

// Vérifie que l'utilisateur est membre de la liste
async function assertListMember(listId: string, userId: number): Promise<boolean> {
  const result = await pool.query(
    "SELECT 1 FROM list_members WHERE list_id = $1 AND user_id = $2",
    [listId, userId]
  );
  return result.rows.length > 0;
}

// POST /lists/:id/tasks
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: listId } = req.params;
  const userId = req.userId!;
  const { title, description, priority, due_date, assigned_to } = req.body;

  if (!title || title.trim() === "") {
    res.status(400).json({ error: "Le titre de la tâche est requis." });
    return;
  }

  try {
    const isMember = await assertListMember(listId, userId);
    if (!isMember) {
      res.status(403).json({ error: "Accès refusé à cette liste." });
      return;
    }

    const result = await pool.query(
      `INSERT INTO tasks (list_id, title, description, priority, due_date, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        listId,
        title.trim(),
        description ?? null,
        priority ?? "medium",
        due_date ?? null,
        assigned_to ?? null,
        userId,
      ]
    );
    io.to(`list:${listId}`).emit("task:created", result.rows[0]);
    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    console.error("Erreur createTask:", err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

// GET /lists/:id/tasks
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: listId } = req.params;
  const userId = req.userId!;
  const { status, priority } = req.query;

  try {
    const isMember = await assertListMember(listId, userId);
    if (!isMember) {
      res.status(403).json({ error: "Accès refusé à cette liste." });
      return;
    }

    let query = `
      SELECT t.*, 
             u.username AS assigned_to_username
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.list_id = $1
    `;
    const params: (string | number)[] = [listId];

    if (status) {
      params.push(status as string);
      query += ` AND t.status = $${params.length}`;
    }

    if (priority) {
      params.push(priority as string);
      query += ` AND t.priority = $${params.length}`;
    }

    query += " ORDER BY t.created_at DESC";

    const result = await pool.query(query, params);
    res.json({ tasks: result.rows });
  } catch (err) {
    console.error("Erreur getTasks:", err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

// PATCH /tasks/:id
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.userId!;
  const { title, description, status, priority, due_date, assigned_to } = req.body;

  const validStatuses: TaskStatus[] = ["todo", "in_progress", "done"];
  const validPriorities: TaskPriority[] = ["low", "medium", "high"];

  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: `Statut invalide. Valeurs acceptées : ${validStatuses.join(", ")}` });
    return;
  }

  if (priority && !validPriorities.includes(priority)) {
    res.status(400).json({ error: `Priorité invalide. Valeurs acceptées : ${validPriorities.join(", ")}` });
    return;
  }

  try {
    // Vérifie que la tâche existe et que l'user est membre de la liste
    const taskResult = await pool.query(
      `SELECT t.* FROM tasks t
       INNER JOIN list_members lm ON t.list_id = lm.list_id
       WHERE t.id = $1 AND lm.user_id = $2`,
      [id, userId]
    );

    if (taskResult.rows.length === 0) {
      res.status(403).json({ error: "Tâche introuvable ou accès refusé." });
      return;
    }

    const task = taskResult.rows[0];

    const result = await pool.query(
      `UPDATE tasks SET
         title = $1,
         description = $2,
         status = $3,
         priority = $4,
         due_date = $5,
         assigned_to = $6,
         updated_at = now()
       WHERE id = $7
       RETURNING *`,
      [
        title ?? task.title,
        description ?? task.description,
        status ?? task.status,
        priority ?? task.priority,
        due_date ?? task.due_date,
        assigned_to ?? task.assigned_to,
        id,
      ]
    );

    io.to(`list:${result.rows[0].list_id}`).emit("task:updated", result.rows[0]);
    res.json({ task: result.rows[0] });
  } catch (err) {
    console.error("Erreur updateTask:", err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

// DELETE /tasks/:id
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.userId!;

  try {
    // Seul le créateur ou l'owner de la liste peut supprimer
    const taskToDelete = await pool.query(
      `SELECT t.id, t.list_id FROM tasks t
      INNER JOIN list_members lm ON t.list_id = lm.list_id
      WHERE t.id = $1 AND lm.user_id = $2
        AND (t.created_by = $2 OR lm.role = 'owner')`,
      [id, userId]
    );

    if (taskToDelete.rows.length === 0) {
      res.status(403).json({ error: "Tâche introuvable ou accès refusé." });
      return;
    }

    await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    io.to(`list:${taskToDelete.rows[0].list_id}`).emit("task:deleted", { id: Number(id) });
    res.json({ message: "Tâche supprimée." });
    } catch (err) {
      console.error("Erreur deleteTask:", err);
      res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
