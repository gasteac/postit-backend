import express from "express";
import { createComment, deleteComment, getComments, getPostComments, likeComment } from "../controllers/comment.controller.js";
import { verifyToken } from "../utils/verifyUser.js";
const route = express.Router();
route.post("/create", verifyToken ,createComment);
route.get("/getPostComments/:postId", getPostComments);
route.put("/likeComment/:commentId", verifyToken, likeComment);
route.delete("/deleteComment/:commentId", verifyToken, deleteComment);
route.get("/getComments/", verifyToken, getComments);
export default route;

//comentarios en auth.routes.js y user.routes.js