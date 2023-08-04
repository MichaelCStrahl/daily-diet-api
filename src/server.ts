import fastify from 'fastify'
import { env } from './env'
import { mealsRoutes } from './routes/meals'
import { knex } from './database'
import { usersRoutes } from './routes/users'
import cookie from '@fastify/cookie'

const app = fastify()

app.register(cookie)

app.register(usersRoutes, {
  prefix: 'users',
})

app.register(mealsRoutes, {
  prefix: 'meals',
})

app.get('/hello', async () => {
  const tables = await knex('sqlite_schema').select('*')

  return tables
})

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log('HTTP Server Running!')
  })
