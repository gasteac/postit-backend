import express from "express";
// Importo los controllers de user.
import {
  test,
  updateUser,
  deleteUser,
  signOut,
  getUsers,
  deleteUserAdmin,
  getUser,
} from "../controllers/user.controller.js";
import { verifyToken } from "../utils/verifyUser.js";


const router = express.Router();
//test solo para probar el funcionamiento de la api al inicio del proyecto.
router.get("/test", test);

//Ruta para manejar usuarios, se pasa el id (o no en algunos casos), luego con el 
//middleware verifyToken se verifica que el usuario esta autorizado a por ejemplo editar datos
//y luego se llama a la función updateUser, deleteUser, etc.
//Con verifyToken al obtener el token del usuario en los cookies, sabemos si es admin, si inicio sesión, o si es dueño de un post, comentario, etc.

//aclaración: este userId es el que se compara con el id de usuario que devuelve el token en verifyToken
//lo vas a ver en el controlador updateUser al principio de la función
//sirve para comprobar que el usuario que quiere editar o borrar, sea el dueño de la cuenta o post o comentario -- (o admin)
router.put("/update/:userId", verifyToken, updateUser);
//en este caso se pasa el userId como parámetro en la url, para comprobar que el usuario puede borrar la cuenta
router.delete("/delete/:userId", verifyToken, deleteUser);
//en este caso se pasa el userId como parámetro en la url, pero se utiliza para que un admin pueda borrar la cuenta de un usuario
router.delete("/deleteuser/:userId", verifyToken, deleteUserAdmin);
// en este caso no se pasa nada, ni se verifica nada, simplemente se borra la cookie del usuario y se lo desloguea
router.post("/logout", signOut);
// en este caso no se pasa nada, simplemente se obtienen todos los usuarios de la bdd (solo un admin puede verlo)
router.get("/getusers", verifyToken, getUsers);
// en este caso se pasa el userId como parámetro en la url, sin verificar nada, sirve para mostrar un usuario
// por ejemplo quien creo el comentario o post.
router.get("/:userId", getUser);

//lo exporto como "router" pero en el index.js donde lo llamo le doy el nombre que quiero, en estos casos userRoute, authRoute, commentRoute, postRoute, etc
export default router;
