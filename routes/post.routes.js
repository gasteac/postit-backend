import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
const router = express.Router();
import { createPost, deletePost, getposts, updatePost } from "../controllers/post.controller.js";
router.post("/create", verifyToken, createPost);
router.get("/getposts", getposts);
router.delete("/deletepost/:postId/:userId", verifyToken, deletePost);
router.put("/updatepost/:postId/:userId", verifyToken, updatePost);
export default router;

//comentarios en auth.routes.js y user.routes.js