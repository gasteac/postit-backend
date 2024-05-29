import mongoose from "mongoose";

// Schema es una clase de mongoose que nos permite definir la estructura de los datos que vamos a guardar en la bdd
const userSchema = new mongoose.Schema(
  //aca le paso los campos que va a tener el usuario
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default:
        "https://gifdb.com/images/high/eren-yeager-blowing-hair-o63aaatimhxaojbu.webp",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } //quiero que cuando se crea o modifique quede guardado la fecha y hora
);

// User es un modelo de mongoose que nos permite interactuar con la colección de usuarios en la bdd
// Le pasamos el nombre de la colección y el schema que definimos arriba (y esto se guarda en la bdd)
//en mongoDB se guarda con una s al final, porque es la base de datos de usuarioS no de 1 solo usuario.
const User = mongoose.model("User", userSchema);

//exporto el modelo User. que incluye los métodos o query's de mongoose para interactuar con la bdd
//como por ejemplo find, findOne, findById, save, update, delete, etc
export default User;
