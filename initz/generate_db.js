const { Pool } = require("pg")
const argon2 = require("argon2")
const conf = require('./config.json')

const z = async () => {
  try {
    console.log('Начало генерации БД')

    const pool = new Pool({
      user: conf.PGUSER,
      host: conf.PGHOST,
      database: conf.PGDATABASE,
      password: conf.PGPASSWORD,
      port: conf.PGPORT,
    })
    
    const trunc_err = await (async () => {
      const client = await pool.connect()
      try {
        await client.query("BEGIN")

        await client.query(
          `create table if not exists users
          (
              login character varying(15) primary key,
              password character varying(150) not null,
              name character varying(40) not null
          )`
        )

        await client.query(
          "insert into users(login, password, name) values($1, $2, $3) ON CONFLICT (login) DO NOTHING",
          ["admin", await argon2.hash("admin"), "admin"]
        )

        await client.query(
          `create table if not exists roles
          (
              role_id serial primary key,
              attribute CHARACTER VARYING(30) not null
          )`
        )

        await client.query("insert into roles(attribute) values($1) ON CONFLICT (role_id) DO NOTHING", ["admin"])

        await client.query("insert into roles(attribute) values($1) ON CONFLICT (role_id) DO NOTHING", ["pupil"])

        await client.query("insert into roles(attribute) values($1) ON CONFLICT (role_id) DO NOTHING", [
          "teacher",
        ])

        await client.query(
          `create table if not exists users_roles
          (
              login character varying(15),
              role_id integer,
              FOREIGN KEY (role_id) REFERENCES Roles (role_id) ON UPDATE CASCADE ON DELETE CASCADE,
              FOREIGN KEY (login) REFERENCES Users (login) ON UPDATE CASCADE ON DELETE CASCADE,
              primary key(login, role_id)
          )`
        )

        const res = await client.query(
          "select role_id from roles where attribute=$1 limit 1",
          ["admin"]
        )

        await client.query(
          "insert into users_roles(login, role_id) values($1, $2) ON CONFLICT (login, role_id) DO NOTHING",
          ["admin", res.rows[0].role_id]
        )

        await client.query(
          `create table if not exists groups
          (
              group_id serial primary key not null,
              name CHARACTER VARYING(30) not null
          )`
        )

        await client.query(
          `create table if not exists pupils
          (
              pupil_id serial primary key,
              login character varying(15) not null,
              group_id integer not null,
              FOREIGN KEY (group_id) REFERENCES groups (group_id) ON UPDATE CASCADE ON DELETE CASCADE,
              FOREIGN KEY (login) REFERENCES Users (login) ON UPDATE CASCADE ON DELETE CASCADE
          )`
        )

        await client.query(
          `create table if not exists teachers
          (
              teacher_id serial primary key,
              login character varying(15) not null,
              FOREIGN KEY (login) REFERENCES Users (login) ON UPDATE CASCADE ON DELETE CASCADE
          )`
        )

        await client.query(
          `create table if not exists teachers_groups
          (
              teacher_id integer,
              group_id integer,
              FOREIGN KEY (teacher_id) REFERENCES teachers (teacher_id) ON UPDATE CASCADE ON DELETE CASCADE,
              FOREIGN KEY (group_id) REFERENCES groups (group_id) ON UPDATE CASCADE ON DELETE CASCADE,
              primary key(teacher_id, group_id)
          )`
        )

        await client.query(
          `create table if not exists subjects(
            subject_id serial primary key,
            name CHARACTER VARYING(30) not null
        )`
        )

        await client.query(
          `create table if not exists subjects_teachers
          (
              subject_id integer,
              teacher_id integer,
              FOREIGN KEY (subject_id) REFERENCES subjects (subject_id) ON UPDATE CASCADE ON DELETE CASCADE,
              FOREIGN KEY (teacher_id) REFERENCES teachers (teacher_id) ON UPDATE CASCADE ON DELETE CASCADE,
              primary key(subject_id, teacher_id)
          )`
        )

        await client.query(
          `create table if not exists subjects_groups
          (
              subject_id integer,
              group_id integer,
              FOREIGN KEY (subject_id) REFERENCES subjects (subject_id) ON UPDATE CASCADE ON DELETE CASCADE,
              FOREIGN KEY (group_id) REFERENCES groups (group_id) ON UPDATE CASCADE ON DELETE CASCADE,
              primary key(subject_id, group_id)
          )`
        )

        await client.query(
          `create table if not exists tasks
          (
              subject_teacher integer,
              task_id serial primary key,
              task_date timestamp with time zone not null,
              file text not null,
              name CHARACTER VARYING(50) not null,
              type_work CHARACTER VARYING(10) not null,
              type_task CHARACTER VARYING(10) not null,
              group_id integer,
              extra_data jsonb,
              FOREIGN KEY (subject_teacher) REFERENCES subjects_teachers (subject_teacher) ON UPDATE CASCADE ON DELETE CASCADE,
              FOREIGN KEY (group_id) REFERENCES groups (group_id) ON UPDATE CASCADE ON DELETE CASCADE
          )`
        )

        await client.query(
          `create table if not exists answers
          (
              pupil_id integer,
              task_id integer,
              answer_date timestamp with time zone not null,
              files text[],
              FOREIGN KEY (pupil_id) REFERENCES pupils (pupil_id) ON UPDATE CASCADE ON DELETE CASCADE,
              FOREIGN KEY (task_id) REFERENCES tasks (task_id) ON UPDATE CASCADE ON DELETE CASCADE,
              primary key(pupil_id, task_id)
          )`
        )

        await client.query(
          `create table if not exists storage
          (
              file_id character varying(50) primary key,
              file_name character varying(50),
              file_date timestamp with time zone not null
          )`
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

    console.log('БД сгенерирована\n')
  } catch (err) {
    console.log(err)
  }
}

z()