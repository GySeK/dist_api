"use strict"
require("dotenv").config()
const { Pool, Client } = require("pg")
const checkReqToken = require("../../modules/checkReqToken")
const jwt = require("jsonwebtoken")
const argon2 = require("argon2")

const getProperty = (object, property) => {
  if (property in object == false)
    throw new Error(`Свойства ${property} нет в Объекте`)
  return object[property]
}

module.exports = async function (fastify, opts) {
  fastify.get("/", async function (request, reply) {
    try {
      //return checkReqToken(request, reply, "admin")
      return "zalupas"
    } catch (err) {
      console.log(err)
      reply.code(500).send(err.message)
    }
  })
  fastify.get("/get/token", async function (request, reply) {
    try {
      const login = getProperty(request.query, "login")
      const password = getProperty(request.query, "password")

      const pool = new Pool()
      const res = await pool.query(
        "select password from users where login=$1",
        [login]
      )
      await pool.end()

      if (res.rowCount == 0) return null

      if (!(await argon2.verify(res.rows[0].password, password))) return null
      return jwt.sign({ login }, process.env.JWT_SECRET)
    } catch (err) {
      console.log(err)
      reply.code(500).send(err.message)
    }
  })

  fastify.register(async (instance, opts, done) => {
    instance.addHook("preHandler", async (request, reply) => {
      await checkReqToken(request, reply, ["admin"])
    })

    //Пользователь

    instance.get("/get/users", async function (request, reply) {
      try {
        const pool = new Pool()
        const res = await pool.query("select * from users", [])
        await pool.end()

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.post("/post/user", async (request, reply) => {
      try {
        const login = getProperty(request.body, "login")
        const name = getProperty(request.body, "name")
        const password = getProperty(request.body, "password")

        const pool = new Pool()
        const res = await pool.query(
          "insert into users(login, password, name) values($1, $2, $3)",
          [login, await argon2.hash(password), name]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.delete("/delete/user", async (request, reply) => {
      try {
        const login = getProperty(request.body, "login")

        const pool = new Pool()
        const res = await pool.query("delete from users where login=$1", [
          login,
        ])
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.put("/put/user/name", async (request, reply) => {
      try {
        const login = getProperty(request.body, "login")
        const new_name = getProperty(request.body, "new_name")

        const pool = new Pool()
        const res = await pool.query(
          "update users set name=$1 where login=$2",
          [new_name, login]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.post("/post/user/role", async (request, reply) => {
      try {
        const login = getProperty(request.body, "login")
        const role_id = getProperty(request.body, "role_id")

        const pool = new Pool()
        const res = await pool.query(
          "insert into users_roles(login, role_id) values($1, $2)",
          [login, role_id]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.delete("/delete/user/role", async (request, reply) => {
      try {
        const login = getProperty(request.body, "login")
        const role_id = getProperty(request.body, "role_id")

        const pool = new Pool()
        const res = await pool.query(
          "delete from users_roles where login=$1 and role_id=$2",
          [login, role_id]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    //Группа

    instance.get("/get/groups", async function (request, reply) {
      try {
        const pool = new Pool()
        const res = await pool.query("select * from groups", [])
        await pool.end()

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.post("/post/group", async (request, reply) => {
      try {
        const name = getProperty(request.body, "name")

        const pool = new Pool()
        const res = await pool.query("insert into groups(name) values($1)", [
          name,
        ])
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.delete("/delete/group", async (request, reply) => {
      try {
        const group_id = getProperty(request.body, "group_id")

        const pool = new Pool()
        const res = await pool.query("delete from groups where group_id=$1", [
          group_id,
        ])
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.put("/put/group/name", async (request, reply) => {
      try {
        const group_id = getProperty(request.body, "group_id")
        const new_name = getProperty(request.body, "new_name")

        const pool = new Pool()
        const res = await pool.query(
          "update groups set name=$1 where group_id=$2",
          [new_name, group_id]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    //Предмет

    instance.get("/get/subjects", async function (request, reply) {
      try {
        const pool = new Pool()
        const res = await pool.query("select * from subjects", [])
        await pool.end()

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.post("/post/subject", async (request, reply) => {
      try {
        const name = getProperty(request.body, "name")

        const pool = new Pool()
        const res = await pool.query("insert into subject(name) values($1)", [
          subject,
        ])
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.delete("/delete/subject", async (request, reply) => {
      try {
        const subject_id = getProperty(request.body, "subject_id")

        const pool = new Pool()
        const res = await pool.query(
          "delete from subjects where subject_id=$1",
          [subject_id]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.put("/put/subject/name", async (request, reply) => {
      try {
        const subject_id = getProperty(request.body, "subject_id")
        const new_name = getProperty(request.body, "new_name")

        const pool = new Pool()
        const res = await pool.query(
          "update subjects set name=$1 where group_id=$2",
          [new_name, subject_id]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    //Ученик

    instance.post("/post/pupil", async (request, reply) => {
      try {
        const login = getProperty(request.body, "login")
        const name = getProperty(request.body, "name")
        const password = getProperty(request.body, "password")
        const group_id = getProperty(request.body, "group_id")
        const role_id = getProperty(request.body, "role_id")

        const pool = new Pool()
        const trunc_err = await (async () => {
          const client = await pool.connect()
          try {
            await client.query("BEGIN")

            await client.query(
              "insert into users(login, password, name) values($1, $2, $3)",
              [login, await argon2.hash(password), name]
            )

            const res = await client.query(
              "select exists(select 1 from roles where attribute=$1 and role_id=$2)",
              ["pupil", role_id]
            )

            if (!res.rows[0].exists)
              throw new Error("Роль с нужным аттрибутом не найдена")

            await client.query(
              "insert into users_roles(login, role_id) values($1, $2)",
              [login, role_id]
            )

            await client.query(
              "insert into pupils(login, group_id) values($1, $2)",
              [login, group_id]
            )

            await client.query("COMMIT")
          } catch (e) {
            await client.query("ROLLBACK")
            throw e
          } finally {
            client.release()
          }
        })().catch((e) => e)

        if (trunc_err) throw trunc_err

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.put("/put/pupil/group", async (request, reply) => {
      try {
        const pupil_id = getProperty(request.body, "pupil_id")
        const new_group_id = getProperty(request.body, "new_group_id")

        const pool = new Pool()

        await pool.query("update pupils set group_id=$1 where pupil_id=$2", [
          new_group_id,
          pupil_id,
        ])
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.get("/get/pupil/subjects/all", async function (request, reply) {
      try {
        const pool = new Pool()

        const res = await pool.query("select * from subjects_groups", [])
        await pool.end()

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.get(
      "/get/pupil/subjects/group_id",
      async function (request, reply) {
        try {
          const group_id = getProperty(request.body, "group_id")

          const pool = new Pool()

          const res = await pool.query(
            "select * from subjects_groups where group_id=$1",
            [group_id]
          )
          await pool.end()

          return res.rows
        } catch (err) {
          console.log(err)
          reply.code(500).send(err.message)
        }
      }
    )

    instance.get(
      "/get/pupil/subjects/subject_id",
      async function (request, reply) {
        try {
          const subject_id = getProperty(request.body, "subject_id")

          const pool = new Pool()

          const res = await pool.query(
            "select * from subjects_groups where subject_id=$1",
            [subject_id]
          )
          await pool.end()

          return res.rows
        } catch (err) {
          console.log(err)
          reply.code(500).send(err.message)
        }
      }
    )

    instance.post("/post/pupil/subject", async (request, reply) => {
      try {
        const subject_id = getProperty(request.body, "subject_id")
        const group_id = getProperty(request.body, "group_id")

        const pool = new Pool()
        const res = await pool.query(
          "insert into subjects_groups (subject_id group_id) values($1, $2)",
          [subject_id, group_id]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.delete("/delete/pupil/subject", async (request, reply) => {
      try {
        const subject_id = getProperty(request.body, "subject_id")
        const group_id = getProperty(request.body, "group_id")

        const pool = new Pool()
        const res = await pool.query(
          "delete from subjects_groups where subject_id=$1 and group_id=$2",
          [subject_id, group_id]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    //Учитель

    instance.post("/post/teacher", async (request, reply) => {
      try {
        const login = getProperty(request.body, "login")
        const name = getProperty(request.body, "name")
        const password = getProperty(request.body, "password")
        const role_id = getProperty(request.body, "role_id")

        const pool = new Pool()
        const trunc_err = await (async () => {
          const client = await pool.connect()
          try {
            await client.query("BEGIN")

            await client.query(
              "insert into users(login, password, name) values($1, $2, $3)",
              [login, await argon2.hash(password), name]
            )

            const res = await client.query(
              "select exists(select 1 from roles where attribute=$1 and role_id=$2)",
              ["teacher", role_id]
            )

            if (!res.rows[0].exists)
              throw new Error("Роль с нужным аттрибутом не найдена")

            await client.query(
              "insert into users_roles(login, role_id) values($1, $2)",
              [login, role_id]
            )

            await client.query("insert into teachers(login) values($1)", [
              login,
            ])

            await client.query("COMMIT")
          } catch (e) {
            await client.query("ROLLBACK")
            throw e
          } finally {
            client.release()
          }
        })().catch((e) => e)

        if (trunc_err) throw trunc_err

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.get("/get/teacher/subjects/all", async function (request, reply) {
      try {
        const pool = new Pool()

        const res = await pool.query("select * from subjects_teachers", [])
        await pool.end()

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.get(
      "/get/teacher/subjects/subject_id",
      async function (request, reply) {
        try {
          const subject_id = getProperty(request.body, "subject_id")

          const pool = new Pool()

          const res = await pool.query(
            "select * from subjects_groups where subject_id=$1",
            [subject_id]
          )
          await pool.end()

          return res.rows
        } catch (err) {
          console.log(err)
          reply.code(500).send(err.message)
        }
      }
    )

    instance.get(
      "/get/teacher/subjects/teacher_id",
      async function (request, reply) {
        try {
          const teacher_id = getProperty(request.body, "teacher_id")

          const pool = new Pool()

          const res = await pool.query(
            "select * from subjects_groups where teacher_id=$1",
            [teacher_id]
          )
          await pool.end()

          return res.rows
        } catch (err) {
          console.log(err)
          reply.code(500).send(err.message)
        }
      }
    )

    instance.post("/post/teacher/subject", async (request, reply) => {
      try {
        const teacher_id = getProperty(request.body, "teacher_id")
        const subject_id = getProperty(request.body, "subject_id")

        const pool = new Pool()
        const res = await pool.query(
          "insert into subjects_teachers(teacher_id, subject_id) values($1, $2)",
          [teacher_id, subject_id]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.delete("/delete/teacher/subject", async (request, reply) => {
      try {
        const teacher_id = getProperty(request.body, "teacher_id")
        const subject_id = getProperty(request.body, "subject_id")

        const pool = new Pool()
        const res = await pool.query(
          "delete from subjects_teachers where teacher_id=$1 and subject_id=$2",
          [teacher_id, subject_id]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.get("/get/teacher/groups/all", async function (request, reply) {
      try {
        const pool = new Pool()

        const res = await pool.query("select * from teachers_groups", [])
        await pool.end()

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.get(
      "/get/teacher/groups/teacher_id",
      async function (request, reply) {
        try {
          const teacher_id = getProperty(request.body, "teacher_id")

          const pool = new Pool()

          const res = await pool.query(
            "select * from teachers_groups where teacher_id=$1",
            [teacher_id]
          )
          await pool.end()

          return res.rows
        } catch (err) {
          console.log(err)
          reply.code(500).send(err.message)
        }
      }
    )

    instance.get(
      "/get/teacher/groups/group_id",
      async function (request, reply) {
        try {
          const group_id = getProperty(request.body, "group_id")

          const pool = new Pool()

          const res = await pool.query(
            "select * from teachers_groups where group_id=$1",
            [group_id]
          )
          await pool.end()

          return res.rows
        } catch (err) {
          console.log(err)
          reply.code(500).send(err.message)
        }
      }
    )

    instance.post("/post/teacher/group", async (request, reply) => {
      try {
        const teacher_id = getProperty(request.body, "teacher_id")
        const group_id = getProperty(request.body, "group_id")

        const pool = new Pool()
        const res = await pool.query(
          "insert into teachers_groups(teacher_id, group_id) values($1, $2)",
          [teacher_id, group_id]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.delete("/delete/teacher/group", async (request, reply) => {
      try {
        const teacher_id = getProperty(request.body, "teacher_id")
        const group_id = getProperty(request.body, "group_id")

        const pool = new Pool()
        const res = await pool.query(
          "delete from teachers_groups where teacher_id=$1 and group_id=$2",
          [teacher_id, group_id]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    //Остальное

    instance.get("/get/roles/all", async function (request, reply) {
      try {
        const pool = new Pool()

        const res = await pool.query("select * from roles", [])
        await pool.end()

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.get("/get/roles/attribute", async function (request, reply) {
      try {
        const attribute = getProperty(request.query, "attribute")
        const pool = new Pool()

        const res = await pool.query("select * from roles where attribute=$1", [
          attribute,
        ])
        await pool.end()

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    done()
  })
}
