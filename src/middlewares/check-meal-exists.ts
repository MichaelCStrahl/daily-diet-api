import { FastifyReply, FastifyRequest } from 'fastify'
import { knex } from '../database'

export async function checkMealsExists(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { sessionId } = request.cookies

  const userId = await knex('users').select('id').where('session_id', sessionId)

  const meals = await knex('meals').where('user_id', userId[0].id).select('*')

  if (!meals) {
    return reply.status(404).send()
  }
}
