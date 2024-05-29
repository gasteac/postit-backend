import Post from "../models/post.model.js";
import { errorHandler } from "../utils/error.js";

export const createPost = async (req, res, next) => {
  //si el usuario no esta autenticado, devuelvo un error (este user me devuelve el verifyToken)
  //un usuario no registrado no puede crearse una cuenta
  if (!req.user) {
    return next(errorHandler(403, "You are not allowed to create a post"));
  }
  // si alguno de los campos del post esta vacío, devuelvo un error
  if (!req.body.title || !req.body.content) {
    return next(errorHandler(400, "All fields are required"));
  }
  //slug es el título del post en minúsculas, sin espacios y sin caracteres especiales
  //se utiliza para acceder a cierto post a traves de la url (asi sabemos donde estamos parados leyendo la url)
  const slug = req.body.title
    .toLowerCase()
    // split separa el string en un array de strings, en este caso separa el string en un array de strings donde cada string es una palabra
    //  osea separa por los espacios
    .split(" ")
    // join une los elementos de un array en un string, en este caso une los elementos del array con un guión hola-quedaría-asi
    .join("-")
    // replace reemplaza los caracteres que le pasamos por el segundo argumento, en este caso reemplaza los caracteres que no sean letras o números por un string vacío
    .replace(/[^a-zA-Z0-9-]/g, "");

  //creamos un nuevo post con los datos que vienen en el body de la petición, el slug que creamos y el id del usuario que esta creando el post
  const newPost = new Post({
    ...req.body,
    slug,
    //asi dejamos constancia de quien creó el post.
    //asi después este puede editar o borrar su propio post.
    userId: req.user.id,
  });
  //intentamos guardar el post en la base de datos
  try {
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    next(error);
  }
};

export const getposts = async (req, res, next) => {
  try {
    //parseInt convierte el string en un número
    //startIndex es un numero que indica desde que post se empieza a buscar
    //cuando recién buscamos este es 0, pero como establecimos el limite en 4, la segunda vez que busquemos, va a ignorar los primeros 4 (porque ya se estan mostrando en la pagina) y va a empezar a buscar desde el 5
    const startIndex = parseInt(req.query.startIndex) || 0;
    //limit es la cantidad de posts que se van a buscar (por eso startIndex es importante, porque si no se establece, siempre se va a buscar desde el principio y se van a mostrar los mismos posts una y otra vez)
    const limit = parseInt(req.query.limit) || 4;
    //sortDirection es un número que indica si los posts se van a mostrar en orden ascendente o descendente
    // 1 y -1 son los valores que se le pasan al método sort para indicar el orden, si es 1, se ordena de forma ascendente, si es -1, de forma descendente
    const sortDirection = req.query.order === "asc" ? 1 : -1;
    // la función diacriticSensitiveRegex reemplaza las vocales con tilde por un regex que busca todas las posibles combinaciones de esa vocal
    // Sirve para luego cuando busco algo en el buscador ignore las tildes
    function diacriticSensitiveRegex(string = "") {
      return string
        .replace(/a/g, "[a,á,à,ä,â]")
        .replace(/A/g, "[A,a,á,à,ä,â]")
        .replace(/e/g, "[e,é,ë,è]")
        .replace(/E/g, "[E,e,é,ë,è]")
        .replace(/i/g, "[i,í,ï,ì]")
        .replace(/I/g, "[I,i,í,ï,ì]")
        .replace(/o/g, "[o,ó,ö,ò]")
        .replace(/O/g, "[O,o,ó,ö,ò]")
        .replace(/u/g, "[u,ü,ú,ù]")
        .replace(/U/g, "[U,u,ü,ú,ù]");
    }
    //buscamos los posts que coincidan con los parámetros de búsqueda que mandamos antes (pueden estar o no)
    const posts = await Post.find({
      //... es un spread operator, si el campo no esta vacio (haciendo la comprobación en el paréntesis) lo agrega al objeto
      //no podemos hacerlo solamente preguntando si req.query.userId existe porque si existe pero esta vacio, lo va a agregar como undefined
      //entonces los tres puntos "obtienen" los campos del objeto que no estan vacíos y los agrega al objeto para la consulta

      /// ... = che agregame los campos de este componente. (valor && parámetro = valor) = che si existe valor agregalo a parámetro
      ...(req.query.userId && { userId: req.query.userId }),
      ...(req.query.category && { category: req.query.category }),
      ...(req.query.slug && { slug: req.query.slug }),
      ...(req.query.postId && { _id: req.query.postId }),
      //si searchTerm existe, se busca en el título y en el contenido
      ...(req.query.searchTerm && {
        //$or es un operador de mongoose que busca en varios campos ( en este caso titulo y contenido )
        //el operador $regex busca el string que le pasamos en el campo que le pasamos
        //regex = regular expression, es una forma de buscar strings que coincidan con un patrón
        //options i = case insensitive, no importa si las letras son mayúsculas o minúsculas
        $or: [
          //el operador $options: 'i' hace que la búsqueda no sea case sensitive
          {
            title: {
              $regex: diacriticSensitiveRegex(req.query.searchTerm),
              $options: "i",
            },
          },
          {
            content: {
              $regex: diacriticSensitiveRegex(req.query.searchTerm),
              $options: "i",
            },
          },
        ],
      }),
      //el método sort ordena los posts por la fecha de actualización, el valor de sortDirection indica si se ordena de forma ascendente o descendente
      //el método skip saltea los primeros startIndex posts (para mostrar los siguientes posts de los que ya se están mostrando)
      //el método limit limita la cantidad de posts que se muestran
    })
      .sort({ updatedAt: sortDirection })
      .skip(startIndex)
      .limit(limit);
    //el método countDocuments cuenta la cantidad de posts que se encontraron
    const totalPosts = await Post.countDocuments();
    const now = new Date();
    //creamos una fecha que sea un mes antes de la fecha actual
    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    //contamos la cantidad de posts que se crearon en el último mes
    const lastMonth = await Post.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });

    res.status(200).json({
      //devolvemos los posts, la cantidad total de posts y la cantidad de posts creados en el último mes
      posts,
      totalPosts,
      lastMonth,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  // si el usuario no es el dueño del post o no es admin, devuelvo un error
  if (req.params.userId !== req.user.id && req.user.isAdmin !== true) {
    return next(errorHandler(403, "You are not allowed to delete this post"));
  }
  // si el usuario intentando eliminar es el dueño o es admin, continuo con la eliminación
  try {
    const del = await Post.findByIdAndDelete(req.params.postId);
    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    next(error);
  }
};


export const updatePost = async (req, res, next) => {
  // si el usuario no es el dueño del post o no es admin, devuelvo un error
  if (req.params.userId !== req.user.id && !req.user.isAdmin) {
    return next(errorHandler(403, "You are not allowed to update this post"));
  }
  // si el usuario intentando eliminar es el dueño o es admin, continuo con la actualización
  try {
    // si cambia el titulo debo cambiar el slug
    const slug = req.body.title
      .toLowerCase()
      .split(" ")
      .join("-")
      .replace(/[^a-zA-Z0-9-]/g, "");

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      //set aca solo actualiza los campos que le pasamos, los demás quedan igual
      //osea si aca recibe undefined, no cambia nada en la bdd
      {
        $set: {
          title: req.body.title,
          content: req.body.content,
          category: req.body.category,
          image: req.body.image,
          slug,
        },
      },
      //new true hace que devuelva el post actualizado
      { new: true }
    );
    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};
