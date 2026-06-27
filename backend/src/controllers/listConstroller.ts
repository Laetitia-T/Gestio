import { Response } from "express";
import { pool } from "../db/pool";
import { AuthRequest } from "../middlewares/authenticate";

// POST /lists
export const createList = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body;
  const userId = req.userId!;

  if (!name || name.trim() === "") {
    res.status(400).json({ error: "Le nom de la liste est requis." });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO lists (name, owner_id)
       VALUES ($1, $2)
       RETURNING id, name, owner_id, created_at`,
      [name.trim(), userId]
    );

    const list = result.rows[0];

    // Ajoute automatiquement le créateur comme owner dans list_members
    await pool.query(
      `INSERT INTO list_members (list_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [list.id, userId]
    );

    res.status(201).json({ list });
  } catch (err) {
    console.error("Erreur createList:", err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

// GET /lists
export const getLists = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;

  try {
    // Retourne toutes les listes dont l'utilisateur est membre
    const result = await pool.query(
      `SELECT l.id, l.name, l.owner_id, l.created_at, lm.role
       FROM lists l
       INNER JOIN list_members lm ON l.id = lm.list_id
       WHERE lm.user_id = $1
       ORDER BY l.created_at DESC`,
      [userId]
    );

    res.json({ lists: result.rows });
  } catch (err) {
    console.error("Erreur getLists:", err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

// DELETE /lists/:id
export const deleteList = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.userId!;

  try {
    // Vérifie que l'utilisateur est bien l'owner
    const list = await pool.query(
      "SELECT id FROM lists WHERE id = $1 AND owner_id = $2",
      [id, userId]
    );

    if (list.rows.length === 0) {
      res.status(403).json({ error: "Liste introuvable ou accès refusé." });
      return;
    }

    await pool.query("DELETE FROM lists WHERE id = $1", [id]);
    res.json({ message: "Liste supprimée." });
  } catch (err) {
    console.error("Erreur deleteList:", err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};
