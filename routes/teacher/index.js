"use strict"
const { Pool, Client } = require("pg")
const checkReqToken = require("../../modules/checkReqToken")
const getReqTokenData = require("../../modules/getReqTokenData")

const getProperty = (object, property) => {
  if (property in object == false)
    throw new Error(`Свойства ${property} нет в Объекте`)
  return object[property]
}

module.exports = async function (fastify, opts) {
  fastify.register(async (instance, opts, done) => {
    instance.addHook("preHandler", async (request, reply) => {
      await checkReqToken(request, reply, ["teacher"])
    })

    instance.get("/get/subjects", async function (request, reply) {
      try {
        const login = getReqTokenData(request, reply)

        const pool = new Pool()

        const res = await pool.query(
          "select s.subject_id, s.name from teachers as t, subjects_teachers as st, subjects as s where t.login=$1 and t.teacher_id = st.teacher_id and s.subject_id=st.subject_id",
          [login]
        )
        await pool.end()

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.get("/get/groups", async function (request, reply) {
      try {
        const login = getReqTokenData(request, reply)

        const pool = new Pool()

        const res = await pool.query(
          "select g.group_id, g.name from teachers as t, teachers_groups as gt, groups as g where t.login=$1 and t.teacher_id = gt.teacher_id and g.group_id=gt.group_id",
          [login]
        )
        await pool.end()

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.post("/post/lecture", async (request, reply) => {
      try {
        const login = getReqTokenData(request, reply)
        const subject_id = getProperty(request.body, "subject_id")
        const group_id = getProperty(request.body, "group_id")
        const file = getProperty(request.body, "file")
        const type_work = getProperty(request.body, "type_work")
        const name = getProperty(request.body, "name")

        for (let tw of ["home", "class"]) {
          if (tw == type_work) break
          throw new Error("Type work должен быть или home или task")
        }

        const pool = new Pool()
        const res_tg = await pool.query(
          `select exists(select 1 from teachers_groups 
          where teacher_id=(select teacher_id from teachers where login=$1)
          and group_id=$2)`,
          [login, group_id]
        )

        if (!res_tg.rows[0].exists) throw new Error("Нет у Вас такой группы")

        const res_sg = await pool.query(
          `select exists(select 1 from subjects_groups as sg
          join subjects_teachers as st on sg.subject_id=st.subject_id
          where st.teacher_id=(select teacher_id from teachers where login=$1)
          and st.subject_id=$2)`,
          [login, subject_id]
        )

        if (!res_sg.rows[0].exists) throw new Error("То ли у учителя, то ли у группы нет такого предмета")

        await pool.query(
          `insert into tasks
              (subject_teacher, task_date, file, type_work, type_task, group_id, name) values(
              (select subject_teacher from subjects_teachers where subject_id = $1 and teacher_id=
              (select teacher_id from teachers where login=$2)
              ), now(), $3, $4, 'lecture', $5, $6)`,
          [subject_id, login, file, type_work, group_id, name]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.post("/post/goal", async (request, reply) => {
      try {
        const login = getReqTokenData(request, reply)
        const subject_id = getProperty(request.body, "subject_id")
        const group_id = getProperty(request.body, "group_id")
        const file = getProperty(request.body, "file")
        const type_work = getProperty(request.body, "type_work")
        const name = getProperty(request.body, "name")
        const end_date = getProperty(request.body, "end_date")

        for (let tw of ["home", "class"]) {
          if (tw == type_work) break
          throw new Error("Type work должен быть или home или task")
        }

        if(!((end_date).getTime() > 0)) 
          throw new Error("У тебя дата в end_date не валидная")

        const pool = new Pool()
        const res_tg = await pool.query(
          `select exists(select 1 from teachers_groups 
          where teacher_id=(select teacher_id from teachers where login=$1)
          and group_id=$2)`,
          [login, group_id]
        )

        if (!res_tg.rows[0].exists) throw new Error("Нет у Вас такой группы")

        const res_sg = await pool.query(
          `select exists(select 1 from subjects_groups as sg
          join subjects_teachers as st on sg.subject_id=st.subject_id
          where st.teacher_id=(select teacher_id from teachers where login=$1)
          and st.subject_id=$2)`,
          [login, subject_id]
        )

        if (!res_sg.rows[0].exists) throw new Error("То ли у учителя, то ли у группы нет такого предмета")

        await pool.query(
          `insert into tasks
              (subject_teacher, task_date, file, type_work, type_task, group_id, name, extra_data) values(
              (select subject_teacher from subjects_teachers where subject_id = $1 and teacher_id=
              (select teacher_id from teachers where login=$2)
              ), now(), $3, $4, 'lecture', $5, $6, $7)`,
          [subject_id, login, file, type_work, group_id, name, `{"end_date":${end_date}}`]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.delete("/delete/task", async (request, reply) => {
      try {
        const login = getReqTokenData(request, reply)
        const task_id = getProperty(request.body, "task_id")

        const pool = new Pool()

        const res = await pool.query(
          `select exists(select 1 from tasks as t, subjects_teachers as st where st.teacher_id=
          (select teacher_id from teachers where login=$1) and t.subject_teacher=st.subject_teacher
          and t.task_id=$2)`,
          [login, task_id]
        )

        if (!res.rows[0].exists)
          throw new Error("У вас нет такой задачи или вообще ни у кого")

        await pool.query(`delete from tasks where task_id=$1`, [task_id])
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.get("/get/tasks", async function (request, reply) {
      try {
        const login = getReqTokenData(request, reply)
        const subject_id = getProperty(request.query, "subject_id")

        const pool = new Pool()

        const res_st = await pool.query(
          `select exists(select 1 from subjects_teachers where teacher_id=
            (select teacher_id from teachers where login=$1) and subject_id=$2)`,
          [login, subject_id]
        )

        if (!res_st.rows[0].exists)
          throw new Error("ты далбаёб у тебя нет такого предмета")

        const res = await pool.query(
          `select * from subjects_teachers as st, tasks as t 
          where st.subject_teacher=t.subject_teacher and st.teacher_id=
          (select teacher_id from teachers where login=$1) and st.subject_id=$2`,
          [login, subject_id]
        )
        await pool.end()

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.put("/put/task/file", async (request, reply) => {
      try {
        const login = getProperty(request.body, "login")
        const task_id = getProperty(request.body, "task_id")
        const new_file = getProperty(request.body, "new_file")

        const pool = new Pool()
        const res = await pool.query(
          `select exists(select 1 from tasks as t, subjects_teachers as st where st.teacher_id=
          (select teacher_id from teachers where login=$1) and t.subject_teacher=st.subject_teacher
          and t.task_id=$2)`,
          [login, task_id]
        )

        if (!res.rows[0].exists)
          throw new Error("У вас нет такой задачи или вообще ни у кого")

        await pool.query("update tasks set file=$1 where task_id=$2", [
          new_file,
          task_id,
        ])
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })
  })
}
