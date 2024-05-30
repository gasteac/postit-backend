import Comment from "../models/comment.model.js";
import { errorHandler } from "../utils/error.js";

export const createComment = async (req, res, next) => {
  try {
    //al crear un comentario, enviamos el contenido del comentario, el id del post y el id del usuario
    const { content, postId, userId } = req.body;
    //si el token del usuario intentando hacer el comentario, no es el mismo que el del navegador, devolvemos un error
    if (req.user.id !== userId) {
      return next(errorHandler(401, "Unauthorized"));
    }
    //creamos un nuevo comentario
    const newComment = new Comment({
      content,
      postId,
      userId,
    });
    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
};

//función para obtener los comentarios de un solo post
export const getPostComments = async (req, res, next) => {
  try {
    //buscamos los comentarios que tengan el id del post que se pasa como parámetro
    const comments = await Comment.find({ postId: req.params.postId })
    // ordenamos los comentarios por fecha de creación, de mas recientes a mas viejos. 
    .sort({
      createdAt: -1,
    });
    //devolvemos LOS comentarios 
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

//función para asignar un like de un usuario a un comentario
export const likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    // si el comentario no existe, devolvemos un error
    if (!comment) {
      return next(errorHandler(404, "Comment not found"));
    }
    // si existe, buscamos si el usuario ya le dio like al comentario
    // buscamos en el arreglo likes de comment, si existe un id del usuario que esta dando like ahora
    const userIndex = comment.likes.indexOf(req.user.id);
    // si existe el id del usuario en el arreglo likes, lo eliminamos (para sacar el like)
    if (userIndex === -1) {
      comment.numberOfLikes += 1;
      comment.likes.push(req.user.id);
      // si no existe, lo agregamos
    } else {
      comment.numberOfLikes -= 1;
      comment.likes = comment.likes.filter((id) => id !== req.user.id);
    }
    // guardamos el comentario con su nuevo numero de likes.
    await comment.save();
    res.status(200).json(comment);
  } catch (error) {
    next(error);
  }
};

//función para eliminar un comentario.
export const deleteComment = async (req, res, next) => {
  try {
    //buscamos el comentario que se quiere eliminar
    const look4comment = await Comment.findById(req.params.commentId);
    //si el usuario que quiere eliminar el comentario no es el dueño del comentario o no es admin, devolvemos un error
    if (req.user.id !== look4comment.userId && !req.user.isAdmin) {
      return next(errorHandler(401, "Unauthorized"));
    }
    // si el usuario es el dueño del comentario o es admin, eliminamos el comentario
    const comment = await Comment.findByIdAndDelete(req.params.commentId);
    //si el comentario no existe, devolvemos un error
    if (!comment) {
      return next(errorHandler(404, "Comment not found"));
    }
    //si el comentario se elimino enviamos un msj al front diciendo que se elimino
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
};


//aca hacemos lo mismo que cuando buscamos los posts, o los usuarios, pero con los comentarios
export const getComments = async (req, res, next) => {
   try {
     //parseInt convierte el string en un número
     //startIndex es un numero que indica desde que post se empieza a buscar
     //cuando recién buscamos este es 0, pero como establecimos el limite en 9, la segunda vez que busquemos, va a ignorar los primeros 9 (porque ya se estan mostrando en la pagina) y va a empezar a buscar desde el 10
     const startIndex = parseInt(req.query.startIndex) || 0;
     //limit es la cantidad de posts que se van a buscar (por eso startIndex es importante, porque si no se establece, siempre se va a buscar desde el principio y se van a mostrar los mismos posts una y otra vez)
     const limit = parseInt(req.query.limit) || 16;
     //sortDirection es un número que indica si los posts se van a mostrar en orden ascendente o descendente
     const sortDirection = req.query.order === "asc" ? 1 : -1;
     // if (req.params.length < 1 || req.body.length < 1 || req.query.length <1) return;
     const comments = await Comment.find({
       //... es un spread operator, si el campo no esta vacio (haciendo la comprobación en el paréntesis) lo agrega al objeto
       //entonces los tres puntos "obtienen" los campos del objeto que no estan vacíos y los agrega al objeto para la consulta
       ...(req.query.userId && { userId: req.query.userId }),
       //el método sort ordena los posts por la fecha de actualización, el valor de sortDirection indica si se ordena de forma ascendente o descendente
       //el método skip saltea los primeros startIndex posts (para mostrar los siguientes posts de los que ya se están mostrando)
       //el método limit limita la cantidad de posts que se muestran
     })
       .sort({ updatedAt: sortDirection })
       .skip(startIndex)
       .limit(limit);
     //el método countDocuments cuenta la cantidad de posts que se encontraron
     const totalComments = await Comment.countDocuments();
     const now = new Date();
     //creamos una fecha que sea un mes antes de la fecha actual
     const oneMonthAgo = new Date(
       now.getFullYear(),
       now.getMonth() - 1,
       now.getDate()
     );
     //contamos la cantidad de posts que se crearon en el último mes
     const lastMonth = await Comment.countDocuments({
       createdAt: { $gte: oneMonthAgo },
     });

     res.status(200).json({
       //devolvemos los posts, la cantidad total de posts y la cantidad de posts creados en el último mes
       comments,
       totalComments,
       lastMonth,
     });
   } catch (error) {
     next(error);
   }
}