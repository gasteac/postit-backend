//Traigo el modelo de User que tiene los métodos de mongoose para interactuar con la bdd, como por ejemplo el save, findOne, etc
import User from "../models/user.model.js";
//Traigo bcryptjs para hashear la contraseña
import bcryptjs from "bcryptjs";
//Traigo el errorHandler que es el que maneja los errores y los pasa al middleware de errores
import { errorHandler } from "../utils/error.js";
//Traigo jwt para generar el token de usuario
import jwt from "jsonwebtoken";
import { trusted } from "mongoose";

//creo un controlador para signup, que recibe req, res y next (next se usa para ejecutar el siguiente middleware)
//este middleware puede ser un manejador de errores, o el siguiente middleware que se va a ejecutar
export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  //si alguno de los campos está vacío, devuelvo un error
  if (
    !username ||
    !email ||
    !password ||
    username === "" ||
    email === "" ||
    password === ""
  ) {
    //le digo, anda al middleware manejador de errores que cree pasándole un error con status 400 y mensaje "All fields are required"
    next(errorHandler(400, "All fields are required"));
  }


   
    //hasheo la contraseña con bcryptjs, le digo cuantas veces quiero que se mezcle o algo asi (cuanto mas mejor)
    const hashedPassword = bcryptjs.hashSync(password, 10);

    //utilizando el modelo User que creé con mongoose en user.model.js, intento crear un nuevo usuario con los datos recibidos en el body
    const newUser = new User({
      username: username,
      email,
      password: hashedPassword,
    });
    //Intento guardar el usuario en la bdd
  try {
    // Verificar si el usuario ya existe, ignorando mayúsculas/minúsculas
    const existingUser = await User.findOne({
      $or: [
        {
          username: {
            $regex: username,
            $options: "i",
          },
        },
        {
          email: {
            $regex: email,
            $options: "i",
          },
        },
       
      ],
    });
    if (existingUser) {
      return next(errorHandler(400, "Username or Email already exists"));
    }

    // Espero a que la bdd guarde el usuario y se cumpla la promesa
    await newUser.save();
    // Una vez cumplida la promesa genero un token con jwt.sign, en el que guardo el id del usuario y si es admin o no
    const token = jwt.sign(
      { id: newUser._id, isAdmin: newUser.isAdmin },
      //le paso el secret que tengo en el .env para que genere el token con él
      process.env.JWT_SECRET
    );
    // creo un objeto del nuevo usuario pero SIN la contraseña
    // rest es un objeto con todos los datos del usuario menos la contraseña
    // al guardarse en la bdd de mongodb, se guarda como un documento
    // Entonces para obtener sus datos puros utilizamos la propiedad _doc
    //Se usa comúnmente para obtener un objeto JavaScript que represente únicamente los datos del documento
    //sin métodos, funciones ni comportamientos adicionales.
    const { password, ...rest } = newUser._doc;
    //devolvemos una respuesta al front con el status 201 (creado) y el token en una cookie (que se guarda en el navegador)
    res
      .status(201)
      .cookie("access_token", token, {
        //httpOnly es para que el token no se pueda acceder desde el frontend, solo desde el backend
        httpOnly: true,
        secure: true, // Asegúrate de que tu servidor esté usando HTTPS
        sameSite: "None"
      })
      //le devuelvo al frontend un json con el usuario que creé en la bdd sin la contraseña
      .json(rest);
  } catch (error) {
    //si hay error, se lo paso al siguiente middleware, en este caso no es el manejador de errores sino
    //el ultimo middleware de mi proceso, osea el que esta en index.js al final (muestra los errores)
    next(error);
  }
};

//creo un controlador para signin, que recibe req, res y next (next se usa para ejecutar el siguiente middleware)
//este middleware puede ser un manejador de errores, o el siguiente middleware que se va a ejecutar
export const signin = async (req, res, next) => {
  //extraigo email y password del body
  //el body esta en el request (solicitud) que es lo que me manda el frontend en el fetch
  //el fetch es el que se encarga de hacer las peticiones http
  //en este caso el fetch es un post a /api/auth/signin
  const { email, password } = req.body;

  //si alguno de los campos está vacío, devuelvo un error
  if (!email || !password) {
    //le digo, anda al siguiente middleware que es el manejador de errores y pasale un error con status 400 y mensaje "All fields are required"
    next(errorHandler(400, "All fields are required"));
  }
  try {
    // busco un usuario en la bdd que tenga el email que me pasaron, utilizo el método FindOne de mongoose
    const validUser = await User.findOne({ email });
    //si no encuentro un usuario con ese email, devuelvo un error
    if (!validUser) {
      return next(errorHandler(404, "Email not registered"));
    }
    //si existe el usuario, osea si se registró previamente con ese email, comparo la contraseña que me pasaron con la que tengo en la bdd
    //con bcryptjs.compareSync comparo la contraseña que me pasaron con la contraseña del usuario en la bdd
    const validPassword = bcryptjs.compareSync(password, validUser.password);

    //si la contraseña no es válida, devuelvo un error
    if (!validPassword) {
      return next(errorHandler(400, "Invalid password"));
    }

    //si la contraseña es correcta, genero un token con jwt.sign
    //jwt.sign es una función que recibe un objeto con los datos que quiero que tenga el token
    const token = jwt.sign(
      //en este caso le paso el id del usuario que encontré en la bdd, y si es admin o no, para que quede guardado en el navegador si es admin o no
      { id: validUser._id, isAdmin: validUser.isAdmin },
      //le paso la clave secreta que tengo en el .env para que genere el token
      process.env.JWT_SECRET
    );

    //desestructuro el usuario que encontré en la bdd y le saco la contraseña
    //le cambio el nombre de password a pass, porque ya estoy usando password como argumento de la función
    const { password: pass, ...rest } = validUser._doc;
    //le devuelvo al frontend el usuario que encontré en la bdd sin la contraseña, y el token "access_token"
    res
      .status(200)
      .cookie("access_token", token, {
        //httpOnly es para que el token no se pueda acceder desde el frontend, solo desde el backend
        //mediante el protocolo http, osea desde el servidor, no desde el cliente
        //esto proporciona una capa de seguridad extra
        httpOnly: true,
        secure: true, // Asegúrate de que tu servidor esté usando HTTPS
        sameSite: "None",
      })
      //le devuelvo al frontend el usuario que encontré en la bdd sin la contraseña y el token (recién ahi el cliente puede tener el token)
      //este rest es un objeto con los datos del usuario
      .json(rest);
  } catch (error) {
    next(error);
  }
};

//creo un controlador para google signin o signup, que recibe req, res y next (next se usa para ejecutar el siguiente middleware)
//este middleware puede ser un manejador de errores, o el siguiente middleware que se va a ejecutar
export const google = async (req, res, next) => {
  //extraigo email, nombre y foto de google del body
  //esto lo envié desde el front, si queres ver como desestructure la photo anda a OAuth.jsx
  const { email, name, googlePhotoUrl } = req.body;
  try {
    //busco un usuario en la bdd que tenga el email que me pasaron
    //si no tiene el email, voy a tener que crear el usuario
    const user = await User.findOne({ email });
    if (user) {
      //si existe el usuario en la bdd, genero un token con jwt.sign
      const token = jwt.sign(
        // en este caso le paso el id del usuario que encontré en la bdd, y si es admin o no, para que quede guardado en el navegador
        { id: user._id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET
      );
      // desestructuro el usuario que encontré en la bdd y le saco la contraseña
      const { password, ...rest } = user._doc;

      //le devuelvo al frontend el usuario que encontré en la bdd sin la contraseña, y el token en las cookies
      res
        .status(200)
        .cookie("access_token", token, {
          httpOnly: true,
          secure: true, // Asegúrate de que tu servidor esté usando HTTPS
          sameSite: "None"
        })
        //este rest es un objeto con los datos del usuario
        .json(rest);

      //si no existe el usuario, genero uno, genero una password y un nombre de usuario
    } else {
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);

      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);

      const newUser = new User({
        username:
          //le saco los espacios al nombre y lo paso a minúsculas, le agrego un número random al final
          name.toLowerCase().split(" ")[0] +
          Math.random().toString(9).slice(-4),
        email,
        // le paso la contraseña hasheada
        password: hashedPassword,
        //le paso la foto de google que viene de la request
        profilePic: googlePhotoUrl,
      });
      //intento guardar el usuario en la bdd y genero un token
      await newUser.save();
      const token = jwt.sign(
        { id: newUser._id, isAdmin: newUser.isAdmin },
        process.env.JWT_SECRET
      );
      const { password, ...rest } = newUser._doc;
      //le devuelvo al frontend el usuario que encontré en la bdd sin la contraseña, y el token
      res
        .status(200)
        .cookie("access_token", token, {
          httpOnly: true,  
          secure: true, // Asegúrate de que tu servidor esté usando HTTPS
          sameSite: "None" })
        .json(rest);
    }
  } catch (error) {
    next(error);
  }
};
