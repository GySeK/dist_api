"use strict"
require("dotenv").config()
const { Pool, Client } = require("pg")
const checkReqToken = require("../../modules/checkReqToken")
const { v4: uuidv4 } = require("uuid")
const fs = require("fs-extra")

const getProperty = (object, property) => {
  if (property in object == false)
    throw new Error(`Свойства ${property} нет в Объекте`)
  return object[property]
}

module.exports = async function (fastify, opts) {
  fastify.register(async (instance, opts, done) => {
    instance.addHook("preHandler", async (request, reply) => {
      await checkReqToken(request, reply, ["admin"])
    })

    instance.post("/post/files", async function (request, reply) {
      try {
        const files = []
        for (let file of request.body) {
          const name = getProperty(file, "name") //C расширением
          const data = getProperty(file, "data")

          const p_name = name.split(".")
          if (p_name[1] == null && p_name.length == 2)
            throw new Error(
              `Мудила гороховый, у тебя расширение файла ${name} пустое`
            )

          files.push({ name, file: data, id: uuidv4() })
        }

        const pool = new Pool()
        for (let file of files) {
          await pool.query(
            `insert into storage (file_id, file_name, file_date)
            values($1, $2, now())`,
            [file.id, file.name]
          )
        }
        await pool.end()

        for (let file of files) {
          const fc = file.name.split(".")
          if (fc.length == 2) {
            await fs.outputFile(
              `./routes/storage/true_storage/${file.id}.${fc[1]}`,
              file.file
            )
          } else {
            await fs.outputFile(
              `./routes/storage/true_storage/${file.id}`,
              file.file
            )
          }
        }

        let files_ids = []
        for (let file of files) files_ids.push(file.id)

        return files_ids
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.delete("/delete/files", async (request, reply) => {
      try {
        const files = fs
          .readdirSync("./routes/storage/true_storage/", {
            withFileTypes: true,
          })
          .filter((item) => !item.isDirectory())
          .map((item) => item.name)

        const pool = new Pool()
        for (let id of request.body) {
          await pool.query(`delete storage where file_id=$1`, [id])
          await fs.remove(`./routes/storage/true_storage/${id}`)
        }
        await pool.end()

        return null
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })

    instance.get("/get/files/data", async function (request, reply) {
      try {
        const ids_str = getProperty(request.query, "ids_str")

        const files = []
        const ids = ids_str.split(",")
        const pool = new Pool()
        for (let id of ids) {
          const res = await pool.query(
            "select * from storage where file_id=$1",
            [id]
          )
          if(res.rows.length != 0)
            files.push(res.rows)
        }
        await pool.end()
  
        return files
      } catch (err) {
        console.log(err)
        reply.code(500).send(err.message)
      }
    })
  })
}

/*
µ@]░╫▓▓▓╣╢▓▓▓▓▓█▓█▓█▓█▓▓▓█████████████▓▓▓██████▓██████████████▓█████████████████

▓▓Ñ╣╙╜║▓▓▓▓███▓▓▓█▓▓▓▓▓▓█▓▓▓▓▓▓█▓███▓██████████▓█▓█▓▓█████████████████████████▓▀

▒▒▒▒▓▓▓█▓▓██▓███▓█▓█▓▓▓▓▓▓▓▓▓▓▓▓╢▓╬▓▓▓▓▓▓▓▓███████▓▓██▓▓▓█████████████████████▀H

▓▓▓▓▓▓▓▓▓▒. ╙╙╜╬▓▓"╙▓▓▓▓▓▓█▓▓▓▓▒▌╢╣▓▓╫▓╬▓╢▓▓▓███▓██████▓██████▓███████████▀▌╘▌▒▓

▓▓▓▓▓▓▀▒╣▓▌╗@ `▒`▒▒░╙▓║▓▓╢▌▓▓▓▌╣╫╢▒╢╣▓▒▓╢╫▌▌▓▓▓▓▓██████████▓████████▓▓▓╣▀╥╣▄▓▓▓▓

╫▀▓▀▓─ ░╜,▒░║ ▒┘──*▒]▒╫╫▓▌╣░▒░▌▒▒░╢╙╟▒╢▒Ñ▒╣╣▓▓▓▓█▓▓▓█▓████████▓███▓▓▓▄▓█▓░▀╙╙▓▐░

╣╢▒▒╗░▒╖░ ╜╫╢░╫▒~ `╠░░╢▒▒╢╢╫▒╦▒░░░▒▒▒░░╫▒▒▒╣╫╢╢▓▓╣▓▓▓▓█████████▓╝─░░▀▀▌Ü▓▄░░▒▓░░

▒▓╫▀▒▒▓▀`┌,░ `"▒B╗▄╬ ,▌▓▒▐▓▓▓▓▓▓╣▒▒▒▒,▒╟░░╫▒╣▓▓█▓▓▓▓▓▓▓▓███████▌░░░░░]▄▓▓▓▓▄▄▄▓█

▓▓▓▓▓▒▓. └▓▓╗╗,▄▓▓▓╣┌░▓▓▓▓██████▓▓▓▓@╨▒║╢╢╣▓╬▓▓▓▓▓▓███████▓▓████▄░░░▓▄████████▓█

▓▓▓▓▓▒@╫╫▒▓▓▓▓▓▓▌▓╜`░╫▓█▓▓▓▓██▀██████▒▒▒╢╢▓▓▓█████████████▓████▓▓▓█▓▓▓▓▓█▓▓██▓▓█

Ñ▀▓▀▀▓▓▓▓▓▓▓██▓█▓▀╙`╓▓▓█▓▓▓▒╨▀▒╢█████╬▒╫║▓████▓▒▀▀▒▓██████▓▓▓▓▓▓█▓▓▓▓▓▓▓█▓▓████▓

╖╖▄▄▓▓@▓▒▀▓╩█▓▓▓▓▌]╫▓▓▓▓▓▓▓▓▓▓▓███▓▓▓╣▒╨▒▓████▓▓██▓████▓▓▓▓▓▓▓▓▓▓▓█▓▓█▓▓████████

. .≡▒▒╢║▒N,╓┐ ▀█▓.▒╫▓╢▓▓║╫▓▓▓▓▓█▓▓▓▓▌╢,░░▓▓▓████▓▓██▓▓▓▓╢▓▓▓█▓▓▓███▓██▓█████████

,▒▒▒╣▒▒▒▒╣╢▓▀8"╙▌]░╣╣▒▓▓▓▀▒▌║▓▒╣╬▒▒╢▒▒░]▒▐█▓▓██▓▓▓▓▓▓▓█▓▓▓▓██▓████▓▓██▓▓████████

ß╣░▒▒╫╣╢╣▒▓▌╢@▒╢▒╨▒╬▓▒╢▒▒▓╢▒╫╜╢░▒▓▓▓╣▒ß▒╫╫▓▓██▓▓▓╣▓▓╬▓▓▓▓▓▓████▓█▓▓▓▓▓▓██████▄▓█

╣╫╣▓▒▓╢▒╢▒▓▒╫▓▒▒░╥╣╣╢▒└░▓▓▓▒▒▓▓▓▓▓█▓▓▒▒▒▓▓▓▓▓▓█▓█▓▓▓▓▓▓██▓██▓███▓██▓████████████

╖▒▓▓▒╫▓▓▓▓▓▓▌╣╢▓░▒▒╫╫▓╫▒╣▒╣▓▓███▓░▓╣▓▒░▓▓╫▓▓██▓█▓█▓▓▓▓█▓▓▓██▓█▓██▓██▓▓██████████

╣╫▒▒╟╢╬▓▓▓▓▓▓▓▓▓▒▒╣▒▒╟▒╢▓▓████▓▓╫╟▌╣▒░░╢╫▒╣▓▓▓▓▓████▓█▓████████▓█████▓▓█████████

å▒▒▓▓▒╣╢▓▓▓▓▓▓▓▓░╫▒▒╫╢▓▓███▓▓▓▓████▓▓▌▄╢▓▓▓▓▓█████████▓▓▓██▓█▓██████▓▓████████▓█

╣▓╣▓▓▒▓▓▓▓╫▒▀╫▓▓▒╣▒╫▒▓▓███▓▓▓▓▓██████████▓█████████████▓████████████████████▓█▓█

▓▓▓▓▓▒▀▌▒▒▌║▌╙#╣▌░]╫▓▓███▓▓▌▌▌▓▓▓▓▓█████████████████████▓▓▓▓▓██████████████▓█▓▓█

▓╣▓╣▓▓╣▀▒▓▓▒╠▓╣▓▒▒╢╢▓▓███▓▓▓▒╢╫╢╫▓▓▀▓▓▓▓█▓█▓██████▓█████████▓▓▀▀███████████▓▓▓██

▓▓▓▓▓▓▓▓▒╣▓╫▓▓▓╢╢▄▓▒▓▓▓▓▓▓▓▓█▓▓▓▒╫▒╣╝╩▒▓▓▒▓▓▓▓▓▓▓█████████████ .──   `╙▀▀▀█████▓

▓▓▓█▓██▓▓▓▓█▓╢╢▓▓▓▓╫▓╢╫▓▓▓█████████████▓██████████▓███████████▌║▒╣H░  ░░░░░░▀███

▓█▓▓▓▓▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▀▓▓▓▀▓▓▓▓▓▓▓█████▓▓████▓█▓▓▓█▓▓H░░░░░░░░░░─

╣▒╣▓▓█▓▓▓▓█████▓▓▓▓▓▓█▓▓▓▓▓▓▓▓▓▓▓▓╣▓▒▒╠╬╢▒▓▓▓▓██████████▓██████▓█▓▓▀░░░░░░░░░░░░

▓▓▓██▓█▓█▀███▓█▓▓▓╣▓▓▓▓▓████████▓██████████████████████████▓▓█████▓▓▓▓╣╖░░░░░░░░

██▓▓█████████▓███▓▓▓▓▓████████████████████████████████████████▓█▓█▓██▓▓▌░░░░░░░░

█▓▓██▓█████▓██▓██▓▓▓██████████████████████████████████████▓██████▓▀▒▒╜▒░░░░░░░░░

▓▓█▓█▓▓▓█████▓▓▓▓▓▓▓██████████████▓▓█████▓█▓█▓█▓█▓██████████████▓▒▒▒░░░░░░░░░▒▒░

▓▓██▓████▓▓████▓█▓▓▓▓█▓▓▓▓███████▓▓█▓████▓█▓▓▓▓█▓███████████████▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒

█▓▓██▓▓████▓▓██▓▓████▓▓▓▓▓█████████▓███▓▓▓█████████████████████▓█▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒

█▓█████▓▓██████████▓█▓▓▓▓▓████████████████████████████████████████╫╣╣╣╣╣╣╣╣╣▒▒╣▓

▓▓█████▓███▓████▓▓▓▓▓▓▓▓▓█▓█▓█████████████████████▓███████████████▓╫╣╣╣╣╣╢╫▓▓▓▓▓

╢╣▒▓█▓█▓▓███▓█▓▓▓▓▓▓▓▓▓▓███▓███████████████████████████████████████▓▓▓▓▓╣╣╫▓▓▓▓▓

╢╢╣╫█▓█▓████▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓███████████████████████████████████████▓▓▓▓▓▓▓▓▓███
*/
