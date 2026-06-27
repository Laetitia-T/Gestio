import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { createList, getLists, deleteList } from "../controllers/listConstroller";

const router = Router();

router.use(authenticate); // toutes les routes listes sont protégées

router.post("/", createList);
router.get("/", getLists);
router.delete("/:id", deleteList);

export default router;
