const checkToken = require("./checkToken")

module.exports = async (request, reply, roles) => {
  try {
    if ("authorization" in request.headers == false)
      throw new Error("А токена, то нет в заголовке authorization")
    const auth = request.headers.authorization

    const authItems = auth.split(" ")
    const token = authItems[1]

    if (!(await checkToken(token, roles))) {
      reply
        .code(401)
        .header("WWW-Authenticate", "Bearer")
        .send("Ты не авторизован, долбаеб")
    }
  } catch (err) {
    console.log(err)
    reply.code(401).header("WWW-Authenticate", "Bearer").send(err.message)
  }
}
