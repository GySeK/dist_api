require('dotenv').config()
const jwt = require("jsonwebtoken")

module.exports = (request, reply) => {
  try {
    if ("authorization" in request.headers == false)
      throw new Error("А токена, то нет в заголовке authorization")
    const auth = request.headers.authorization

    const authItems = auth.split(" ")
    const token = authItems[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    return decoded.login
  } catch (err) {
    console.log(err)
    reply.code(500).send(err.message)
  }
}
