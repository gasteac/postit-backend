
//este middleware se encarga de manejar inyectar nuestro mensaje y statusCode del error en un objeto error
//básicamente lo que haces es crear un error con un status code y un mensaje que le pasas como argumento
//ese error que se crea aca (con nuestro argumentos) lo recibe y muestra el middleware de error de index.js al final
//si NO sabemos que error ocurre, ignoramos esto y enviamos el error mediante next(error) y ya
//next es una función que se ejecuta cuando termina el middleware actual y pasa al siguiente middleware
export const errorHandler = (statusCode, message) =>{
    //creo un nuevo error y le asigno el status code y el mensaje que le paso como argumento
    const error = new Error()
    error.statusCode = statusCode
    error.message = message
    return error
}