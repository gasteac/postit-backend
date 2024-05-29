// Description: Middleware que verifica si el token es correcto


// Importamos json web token, que es una librería que nos permite trabajar con tokens
// El token es un string que se envía en la cabecera de la petición HTTP
// y que se utiliza para verificar la identidad del usuario
// Si el token es correcto, se pasa a la siguiente tarea o middleware
// Si el token no es correcto, se envía un error 401 (Unauthorized)
// El token no es correcto cuando no existe, cuando está mal formado o cuando ha expirado
// Lo que significa que el usuario no está autenticado o que no tiene permisos para acceder a la información
import jwt from 'jsonwebtoken';
// Importamos la función errorHandler que nos permite enviar errores al frontend
import { errorHandler } from './error.js';

export const verifyToken = (req, res, next) => {
  //obtengo el token de la petición ( request ) del front
  //asi se accede a las cookies que estan almacenadas en el front
  //(Estas se almacenan o cuando ingresas o cuando te registras )

  //Aclaración: YO le llame "access_token" a la cookie que guarda el token (en auth.controller.js) en signin y signup
  const token = req.cookies.access_token;
  //Si no hay token en las cookies, significa q el usuario no esta ingresado o registrado
  if (!token) {
    return next(errorHandler(401, 'Unauthorized'));
  }
  //si existe el token, lo verifico con jwt.verify
  //verify recibe el token y la clave secreta y lo decodifica 
  //la clave secreta es la que se usa para generar el token, y es la misma que se usa para verificarlo
  //la escribo yo en el .env, es una cadena de texto que puede ser cualquier cosa
  //jwt.verify devuelve el usuario que estaba en el token en las cookies
  //si es correcto significa que el usuario que esta enviando la petición es el que dice ser.
  //recibe un callback con dos parámetros, el error y el usuario (que esta en el token)
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    // si hay un error, devuelvo un error 401 (Unauthorized), porque el token no coincide o no existe
    if (err) {
      return next(errorHandler(401, "Unauthorized"));
    }
    //si no hay error, obtengo el usuario que estaba en el token
    //guardo el usuario en req.user, osea se lo envió al frontend para que lo use (yo ahora soy el backend)
    req.user = user;
    //paso a la siguiente tarea o middleware, en este caso, updateUser u otro (ver en routes)
    //como ya verifique que el token es correcto, puedo seguir con la tarea que me pidieron
    //en este caso, actualizar el usuario, por ende llamo a alguna función en routes, ya sea de usuario, posts, autenticación, etc
    // osea router.delete("/deletepost/:postId/:userId", verifyToken, -> paso a -> deletePost) con next()
    next();
  });
};