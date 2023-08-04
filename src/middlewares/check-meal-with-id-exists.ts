import { FastifyReply, FastifyRequest } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'

export async function checkMealWithIdExists(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { sessionId } = request.cookies

  const userId = await knex('users').select('id').where('session_id', sessionId)

  const getMealParamsSchema = z.object({
    id: z.string().uuid(),
  })

  const { id } = getMealParamsSchema.parse(request.params)

  const meals = await knex('meals')
    .where({
      id,
      user_id: userId[0].id,
    })
    .first()

  if (!meals) {
    return reply.status(404).send()
  }
}
