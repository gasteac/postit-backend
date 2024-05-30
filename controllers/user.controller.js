import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";
import bcryptjs from "bcryptjs";
//función de prueba para verificar que la api funciona correctamente
export const test = (req, res) => {
  res.status(200).json({
    message: "it works",
  });
};

//función para actualizar los datos del usuario
//el "user" que le llega aca, es el que decodificamos del token en el middleware verifyToken
//por lo que tiene el id del usuario que hizo la petición (si es que esta autorizado)
export const updateUser = async (req, res, next) => {
  //verifico que el id del usuario que hizo la petición sea el mismo que el id del usuario que quiere actualizar
  //req.params.userId es el id que se pasa en la url "http://localhost:3000/api/user/update/6617823d4a6fca588b043c34" ese ultimo código
  //req.user.id es el id del usuario que esta en el token (osea el que esta navegando en este momento)

  // si el id del usuario que hizo la petición no es el mismo que el id del usuario que quiere actualizar, devuelvo un error
  if (req.params.userId !== req.user.id) {
    return next(errorHandler(401, "Unauthorized"));
  }
  // si el usuario quiere actualizar solo la foto de perfil, actualizo solo la foto de perfil
  if (req.body.profilePic !== '' && !req.body.password && !req.body.username && !req.body.email) {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      {
        //si lo encuentra, actualizo la foto en este caso
        //$set es un método de mongoose para actualizar los datos del usuario
        $set: { profilePic: req.body.profilePic },
      },
      //con {new: true} le digo a mongoose que me devuelva el usuario actualizado
      { new: true }
    );
    //devuelvo el usuario actualizado sin la contraseña
   const { password, ...rest } = updatedUser._doc;

   res.status(200).json(rest);

   // si el usuario quiere actualizar otros campos...
  } else {
    const { username, email, profilePic } = req.body;
    //encripto la nueva contraseña antes de guardarla en la base de datos
    const hashedPassword = bcryptjs.hashSync(req.body.password, 10);
    try {
      //busco al usuario por el id que se pasa en la url (o podría haber utilizado req.user.id da igual)
      const updatedUser = await User.findByIdAndUpdate(
        req.params.userId,
        {
          //si lo encuentra, actualiza los datos del usuario
          //$set es un método de mongoose para actualizar los datos del usuario
          $set: { username, password: hashedPassword, email, profilePic },
        },
        //con {new: true} le digo a mongoose que me devuelva el usuario actualizado
        { new: true }
      );
      //devuelvo el usuario actualizado sin la contraseña
      const { password, ...rest } = updatedUser._doc;
      // devuelvo el usuario actualizado
      res.status(200).json(rest);
    } catch (error) {
      next(error);
    }
  }
};

export const deleteUser = async (req, res, next) => {
  // si el id del usuario que hizo la petición (sacado del token en las cookies) no es el mismo que el id del usuario que quiere eliminar, devuelvo un error
  if (req.params.userId !== req.user.id) {
    return next(errorHandler(401, "Unauthorized"));
  }
  try {
    //busco al usuario por el id que se pasa en la url
    await User.findByIdAndDelete(req.params.userId);
    //devuelvo un mensaje de que el usuario fue eliminado
    res.status(200).clearCookie("access_token").json("User has been deleted");
  } catch (error) {
    next(error);
  }
};

export const signOut = (req, res, next) => {
  try {
    //borro la cookie y se borra la sesión del usuario actual.
    res.clearCookie("access_token").status(200).json("Logged out");
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  //si el usuario que hizo la petición no es admin, devuelvo un error
  if (!req.user.isAdmin) {
    return next(errorHandler(401, "You are not allowed to see all users"));
  }
  try {
    // Estos son una serie de parámetros de búsqueda que se pueden pasar en la url para paginar los resultados
    // Por ejemplo: (los nombres les pude yo, puede ser cualquiera)
    // startIndex me trae los resultados a partir de ese índice
    // limit me trae la cantidad de resultados que le diga, por ej 10
    // sortDirection me ordena los resultados de forma ascendente o descendente
    //
    // parseInt convierte el string a número, todo lo que llega de una petición http es un string
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 16;
    // 1 y -1 son los valores que se le pasan al método sort para indicar el orden, si es 1, se ordena de forma ascendente, si es -1, de forma descendente
    const sortDirection = req.query.sort == "asc" ? 1 : -1;

    //busco el usuario y le paso los parámetros de búsqueda antes definidos.
    const users = await User.find()
      .skip(startIndex) // startIndex me trae los resultados a partir de ese índice
      .limit(limit) // limit me trae la cantidad de resultados que le diga, por ej 10
      .sort({ createdAt: sortDirection }); // sortDirection me ordena los resultados de forma ascendente o descendente
    //recorro y devuelvo los usuarios sin la contraseña
    const usersWithoutPassword = users.map((user) => {
      const { password, ...rest } = user._doc;
      return rest;
    });
    //cuento la cantidad total de usuarios en la bdd
    const totalUsers = await User.countDocuments();
    // devuelvo los usuarios, la cantidad total de usuarios y la cantidad de usuarios registrados en el último mes
    // now es la fecha actual
    const now = new Date();
    /// oneMonthAgo es la fecha de hace un mes, se calcula restando un mes a la fecha actual
    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );

    //cuento la cantidad de usuarios registrados en el último mes
    const lastMonth = await User.countDocuments({
      // createdAt es un campo que se crea automáticamente en la bdd, es la fecha de creación del usuario o documento en si
      // $gte es un operador de mongoose que significa "greater than or equal to" osea mayor o igual a xdxdxd
      createdAt: { $gte: oneMonthAgo },
    });
    //devuelvo los usuarios, la cantidad total de usuarios y la cantidad de usuarios registrados en el último mes
    //después en el front uso los q quiera, pero aca ya calculo todos.
    res.status(200).json({
      users: usersWithoutPassword,
      totalUsers,
      lastMonth,
    });
  } catch (error) {
    next(errorHandler(500, "Internal server error"));
  }
};

export const deleteUserAdmin = async (req, res, next) => {
  // si el usuario que hizo la petición no es admin, devuelvo un error
  // dsp esta la opción de que un propio usuario pueda eliminar su cuenta, en deleteUser mas arriba
  if (!req.user.isAdmin) {
    return next(errorHandler(401, "Unauthorized"));
  }
  try {
    await User.findByIdAndDelete(req.params.userId);
    res.status(200).json("User has been deleted");
  } catch (error) {
    next(error);
  }
};

//Solo busca y muestra un usuario y nada mas
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }
    const { password, ...rest } = user._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
}

