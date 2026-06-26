import { Router } from "express";
import { authenticate, AuthRequest } from "../middlewares/authenticate";
import { pool } from "../db/pool";

const router = Router();

// GET /users/me — route protégée, retourne le profil de l'utilisateur connecté
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, username, created_at FROM users WHERE id = $1",
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Utilisateur introuvable." });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Erreur /me:", err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

export default router;
