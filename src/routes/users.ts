import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { checkUserExists } from '../middlewares/check-user-exists'

export async function usersRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const users = await knex('users').where('session_id', sessionId)

      return { users }
    },
  )

  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExists, checkUserExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      await knex('users').where({ id, session_id: sessionId }).del()

      return reply.status(204).send()
    },
  )

  app.post('/', async (request, reply) => {
    const createUsersBodySchema = z.object({
      name: z.string(),
    })

    const { name } = createUsersBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
