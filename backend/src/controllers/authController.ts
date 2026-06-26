import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool";
import { User } from "../types/index";

const SALT_ROUNDS = 12;

// POST /auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    res.status(400).json({ error: "Tous les champs sont requis." });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
    return;
  }

  try {
    // Vérifie si l'email ou le username existe déjà
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Email ou nom d'utilisateur déjà utilisé." });
      return;
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query<User>(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, username, created_at`,
      [email, username, password_hash]
    );

    const user = result.rows[0];

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      user: { id: user.id, email: user.email, username: user.username },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Erreur register:", err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email et mot de passe requis." });
    return;
  }

  try {
    const result = await pool.query<User>(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      // Message volontairement générique pour ne pas révéler si l'email existe
      res.status(401).json({ error: "Identifiants incorrects." });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      res.status(401).json({ error: "Identifiants incorrects." });
      return;
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      user: { id: user.id, email: user.email, username: user.username },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Erreur login:", err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

// Helpers JWT
function generateAccessToken(userId: number): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { expiresIn: "15m" }
  );
}

function generateRefreshToken(userId: number): string {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: "7d" }
  );
}
