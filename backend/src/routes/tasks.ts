import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { createTask, getTasks, updateTask, deleteTask } from "../controllers/taskController";

const router = Router();

router.use(authenticate);

router.post("/:id/tasks", createTask);
router.get("/:id/tasks", getTasks);
router.patch("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);

export default router;