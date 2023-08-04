import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies

    const userId = await knex('users')
      .select('id')
      .where('session_id', sessionId)

    const meals = await knex('meals').where('user_id', userId[0].id).select('*')

    return { meals }
  })

  app.post(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const createMealsBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        date: z.coerce.date(),
        isOnDiet: z.boolean(),
      })

      const { name, description, date, isOnDiet } = createMealsBodySchema.parse(
        request.body,
      )

      const userId = await knex('users')
        .select('id')
        .where('session_id', sessionId)

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        date,
        is_on_diet: isOnDiet,
        user_id: userId[0].id,
      })

      return reply.status(201).send()
    },
  )
}
