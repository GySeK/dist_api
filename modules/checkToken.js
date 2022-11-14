const jwt = require("jsonwebtoken")
const { Pool } = require("pg")
require('dotenv').config()

module.exports = async (token, roles = []) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const pool = new Pool()
    const res = await pool.query(
      "select r.attribute from users_roles as ur, roles as r where ur.login=$1 and ur.role_id = r.role_id",
      [decoded.login]
    )
    await pool.end()

    if(roles.length == 0)
      return true

    for(let role of roles) 
      for(let row of res.rows)
        if(row.attribute == role)
          return true
    return false
  } catch (err) {
    console.log(err)
    return false
  }
}