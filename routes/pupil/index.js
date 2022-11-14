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
      await checkReqToken(request, reply, ["pupil"])
    })

    instance.post("/post/answer", async (request, reply) => {
      try {
        const login = getReqTokenData(request, reply)
        const task_id = getProperty(request.body, "task_id")
        const files = getProperty(request.body, "files")

        if(files.constructor !== Array)
          throw new Error("Ссылки на файлы или сами файлы должны быть в массивах")

        const pool = new Pool()

        const res = await pool.query(
          `select type_task from tasks where group_id=(select group_id from pupils where login=$1) and task_id=$2`,
          [login, task_id]
        )

        if (res.rows.length == 0)
          throw new Error("У твоей группы или вообще нет такой задачи")

        if (res.rows[0].type_task == "lecture")
          throw new Error("Нельзя блять добавить ответ к лекции, олух")

        await pool.query(
          `insert into answers(pupil_id, task_id, answer_date, files)
          values((select pupil_id from pupils where login=$1), $2, now(), $3)`,
          [login, task_id, files]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.post("/post/answer/file", async (request, reply) => {
      try {
        const login = getReqTokenData(request, reply)
        const task_id = getProperty(request.body, "task_id")
        const file = getProperty(request.body, "file")

        const pool = new Pool()

        const res = await pool.query(
          `select exists(select 1 from answers 
          where pupil_id=(select pupil_id from pupils where login=$1) and task_id=$2)`,
          [login, task_id]
        )

        if(!res.rows[0].exists)
            throw new Error("Такого answer-а нет у тебя")

        await pool.query(
          `update answers set files = array_append(files, $1) where pupil_id=$2 and task_id=$3`,
          [file, login, task_id]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.delete("/delete/answer/file", async (request, reply) => {
      try {
        const login = getReqTokenData(request, reply)
        const task_id = getProperty(request.body, "task_id")
        const file = getProperty(request.body, "file")

        const pool = new Pool()

        const res = await pool.query(
          `select exists(select 1 from answers 
          where pupil_id=(select pupil_id from pupils where login=$1) and task_id=$2)`,
          [login, task_id]
        )

        if(!res.rows[0].exists)
            throw new Error("Такого answer-а нет у тебя")

        await pool.query(
          `update answers set files = array_remove(files, $1) where pupil_id=$2 and task_id=$3`,
          [file, login, task_id]
        )
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })
    
    instance.get("/get/answer", async function (request, reply) {
      try {
        const login = getReqTokenData(request, reply)
        const task_id = getProperty(request.query, "task_id")

        const pool = new Pool()

        const res = await pool.query(
          `select * from answers where pupil_id=(select pupil_id from pupils where login=$1) and task_id=$2`,
          [login, task_id]
        )
        await pool.end()

        if (res.rows.length == 0)
          throw new Error(
            "У тебя нет такого ответа или он вообще не существует"
          )

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.get("/get/task", async function (request, reply) {
      try {
        const login = getReqTokenData(request, reply)
        const task_id = getProperty(request.query, "task_id")

        const pool = new Pool()

        const res = await pool.query(
          `select t.task_id, t.name, t.task_date, t.file, t.extra_data, t.type_task, s.name as subject_name, u.name as teacher_name from tasks as t 
          join subjects_teachers as st on t.subject_teacher=st.subject_teacher
          join subjects as s on st.subject_id=s.subject_id
          join teachers as tc on st.teacher_id=tc.teacher_id
          join users as u on tc.login=u.login
          where t.group_id=(select group_id from pupils where login=$1)
          and t.task_id=$2`,
          [login, task_id]
        )
        await pool.end()

        if (res.rows.length == 0)
          throw new Error(
            "У твоей группы нет такой задачи или она вообще не существует"
          )

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.get("/get/homework/all", async function (request, reply) {
      try {
        const login = getReqTokenData(request, reply)

        const pool = new Pool()

        const res = await pool.query(
          `select t.task_id, t.name, t.task_date, s.name as subject_name, u.name as teacher_name from tasks as t 
          join subjects_teachers as st on t.subject_teacher=st.subject_teacher
          join subjects as s on st.subject_id=s.subject_id
          join teachers as tc on st.teacher_id=tc.teacher_id
          join users as u on tc.login=u.login
          where t.group_id=(select group_id from pupils where login=$1)
          and t.type_work='home'`,
          [login]
        )
        await pool.end()

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.get("/get/homework/subject_name", async function (request, reply) {
      try {
        const login = getReqTokenData(request, reply)
        const subject_id = getProperty(request.query, "subject_id")

        const pool = new Pool()

        const res = await pool.query(
          `select t.task_id, t.name, t.task_date, u.name as teacher_name from tasks as t
          join subjects_teachers as st on t.subject_teacher=st.subject_teacher
          join teachers as tc on st.teacher_id=tc.teacher_id
          join users as u on tc.login=u.login
          where t.group_id=(select group_id from pupils where login=$1)
          and t.type_work='home' and st.subject_id=$2`,
          [login, subject_id]
        )
        await pool.end()

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.get("/get/work/subject_id", async function (request, reply) {
      try {
        const login = getReqTokenData(request, reply)
        const subject_id = getProperty(request.query, "subject_id")

        const pool = new Pool()

        const res = await pool.query(
          `select t.task_id, t.name, t.task_date, u.name as teacher_name from tasks as t
          join subjects_teachers as st on t.subject_teacher=st.subject_teacher
          join teachers as tc on st.teacher_id=tc.teacher_id
          join users as u on tc.login=u.login
          where t.group_id=(select group_id from pupils where login=$1)
          and t.type_work='work' and st.subject_id=$2`,
          [login, subject_id]
        )
        await pool.end()

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.delete("/delete/answer", async (request, reply) => {
      try {
        const login = getReqTokenData(request, reply)
        const answer_id = getProperty(request.body, "answer_id")

        const pool = new Pool()

        const res = await pool.query(
          `select exists(select 1 from answers as a, pupils as p where p.pupil_id=
          (select pupil-id from pupils where login=$1) and a.pupil_id=p.pupil_id
          and a.answer_id=$2)`,
          [login, answer_id]
        )

        if (!res.rows[0].exists)
          throw new Error("У вас нет такого ответа или вообще ни у кого")

        await pool.query(`delete from answers where answer_id=$1`, [answer_id])
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.get("/get/subjects", async function (request, reply) {
      try {
        const login = getReqTokenData(request, reply)

        const pool = new Pool()

        const res = await pool.query(
          `select s.* from subjects_groups as sg, subjects as s 
          where sg.group_id=(select group_id from pupils where login=$1) and s.subject_id=sg.subject_id`,
          [login]
        )
        await pool.end()

        return res.rows
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })
  })
}
