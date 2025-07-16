import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function openDb() {
  return open({
    filename: __dirname + '/database.sqlite',
    driver: sqlite3.Database
  })
}

export default openDb