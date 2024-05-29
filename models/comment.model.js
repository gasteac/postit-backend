import mongoose from "mongoose";
// Schema es una clase de mongoose que nos permite definir la estructura de los datos que vamos a guardar en la bdd
// Modelo o Schema de los comentarios
const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    postId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    //aca guardamos los id de los usuarios q dieron like al comentario
    likes: {
      type: Array,
      default: [],
    },
    numberOfLikes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);
const Comment = mongoose.model("Comment", commentSchema);
export default Comment;

//Comentarios en user.model.js
