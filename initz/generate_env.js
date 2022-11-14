const fs = require('fs-extra')
const conf = require('./config.json')

async function copyFiles () {
  try {
    console.log("Начата генерация env")
    let env_rows = []
    for(conf_item in conf)
      env_rows.push(`${conf_item}=${conf[conf_item]}`)

    let env_str = ""
    for(let i = 0;i < Object.keys(conf).length - 1;i++)
      env_str += env_rows[i] + "\n"
    
    env_str += env_rows[Object.keys(conf).length - 1]

    await fs.outputFile("./.env", env_str)

    //await fs.copy('./.env', '../.env')
    console.log("Завершена генерация env\n")
  } catch (err) {
    console.error(err)
  }
}

copyFiles()