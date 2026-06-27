import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { createTask, getTasks, updateTask, deleteTask } from "../controllers/taskController";

const router = Router();

router.use(authenticate); // toutes les routes tâches sont protégées

// Routes rattachées à une liste
router.post("/lists/:id/tasks", createTask);
router.get("/lists/:id/tasks", getTasks);

// Routes sur une tâche directe
router.patch("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);

export default router;
