import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { updateTask, deleteTask } from "../controllers/taskController";

const router = Router();

router.use(authenticate);

router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;