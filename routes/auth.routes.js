import express from "express";
// Importo los controllers de autenticación.
import { signup, signin, google } from "../controllers/auth.controller.js";

//creo un router con express para manejar las peticiones a las rutas de autenticación, en este caso solo POST.
const router = express.Router();

// los controladores son funciones que se ejecutan cuando se hace una petición a una ruta
// ya sea para crear un usuario, loguearse, etc
// allí se escribe la lógica de negocio de la aplicación
// la lógica de negocio se encarga de manejar la información, la base de datos, etc. depende de cada negocio y como decide manejar la información.

//le digo que si es un post en esa dirección "/api/auth/signup" aplique el controlador de signup
router.post("/signup", signup);
//le digo que si es un post en esa dirección "/api/auth/signin" aplique el controlador de signin
router.post("/signin", signin);
//le digo que si es un post en esa dirección "/api/auth/google" aplique el controlador de google
router.post("/google", google);

//lo exporto como "router" pero en el index.js donde lo llamo le doy el nombre que quiero, en estos casos userRoute, authRoute, commentRoute, postRoute
export default router;
