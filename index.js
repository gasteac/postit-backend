/**
 * @file Entry point of the API server
 * @module index
 */

// express es un framework de node que nos permite hacer un servidor web de manera más sencilla
import express from "express";
// mongoose es una librería que nos permite conectarnos a una base de datos de mongodb, y hacer queries de manera más sencilla
import mongoose from "mongoose";
// dotenv es una librería que nos permite leer variables de entorno de un archivo .env
import dotenv from "dotenv";
// importamos cookie-parser que nos permite parsear cookies, osea leerlas y escribirlas
import cookieParser from "cookie-parser";
// importamos path que es una librería de node que nos permite manipular rutas de archivos
// sirve para que __dirname funcione en los módulos de ES6 (porque __dirname no existe en ES6)
import path from "path";
//esto va a setear las variables del .env en process.env osea en el entorno
dotenv.config(); 
// importamos las rutas de user, auth, post y comment
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/post.routes.js";
import commentRoutes from "./routes/comment.routes.js";

//nos conectamos a la bdd de mongodb mediante mongoose pasándole la url de la bdd que esta en .env
mongoose
  .connect(process.env.MONGO)
  .then(console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

//esto es para que __dirname funcione en los módulos de ES6 (porque __dirname no existe en ES6)
const __dirname = path.resolve();

//Creamos una instancia de express que va a ser nuestro server y la guardamos con el nombre app
const app = express();

//middleware que permite parsear JSON del backend a lenguaje usable (string) y manipulable (objeto u string) en el frontend
//sino, el front no podría interpretar la resp del backend porque vendría en formato JSON
app.use(express.json());

//middleware que permite parsear cookies, se usa  en el login y en el logout, para guardar el token en una cookie y para borrarla
app.use(cookieParser());

///////////RUTAS///////////

//se pone api para que se pueda redireccionar a la url de la api mediante un proxy en la conf del server en el frontend (vite.config.js)
//aca le paso la lógica de negocio, CRUD, etc, para user/auth/post/comment como "USE" (middleware) 
//y todas las peticiones que lleguen a esas url van a tratarse en esos archivos js.
app.use("/api/user", userRoutes); // paso a -> user.routes.js que tiene la lógica de negocio de user
app.use("/api/auth", authRoutes); // paso a -> auth.routes.js que tiene la lógica de negocio de auth
app.use("/api/post", postRoutes); // paso a -> post.routes.js que tiene la lógica de negocio de post
app.use("/api/comment", commentRoutes); // paso a -> comment.routes.js que tiene la lógica de negocio de comment

//puerto en el que va a correr el server, si no hay una variable de entorno PORT, va a correr en el puerto 3000
const port = process.env.PORT || 4000;

//Le decimos al server que escuche en el puerto
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

//middleware que permite servir archivos estáticos (como los html, css, js, imágenes, etc) de la carpeta client/dist
//basicamente para que se pueda ver la página web en el navegador, ya que el frontend se compila en esa carpeta
// app.use(express.static(path.join(__dirname, "/client/dist")));

//middleware que permite servir el archivo index.html de la carpeta client/dist cuando se hace una petición a una ruta que no existe
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
// });


// este middleware maneja los errores que se lanzan en la aplicación
// cuando yo invoco a next() con un error como argumento, este middleware se va a ejecutar
// ( a no ser que le envie mi propio manejador de errores (errorHandler) )
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error MW";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
