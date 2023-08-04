import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { checkMealWithIdExists } from '../middlewares/check-meal-with-id-exists'
import { checkMealsExists } from '../middlewares/check-meal-exists'
import { checkUserExists } from '../middlewares/check-user-exists'

interface Metrics {
  inDietPercentage: number
  bestSequency: number
  total: number
  totalInDiet: number
  totalOutDiet: number
}

export async function mealsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preHandler: [checkSessionIdExists, checkUserExists, checkMealsExists] },
    async (request) => {
      const { sessionId } = request.cookies

      const userId = await knex('users')
        .select('id')
        .where('session_id', sessionId)

      const meals = await knex('meals')
        .where('user_id', userId[0].id)
        .select('*')

      return { meals }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [
        checkSessionIdExists,
        checkUserExists,
        checkMealWithIdExists,
      ],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      const userId = await knex('users')
        .select('id')
        .where('session_id', sessionId)

      const meal = await knex('meals')
        .where({
          id,
          user_id: userId[0].id,
        })
        .first()

      if (!meal) {
        return reply.status(404).send()
      }

      return { meal }
    },
  )

  app.get(
    '/metrics',
    {
      preHandler: [checkSessionIdExists, checkUserExists, checkMealsExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const metrics = {
        total: 0,
        bestSequency: 0,
        inDietPercentage: 0,
        totalInDiet: 0,
        totalOutDiet: 0,
      } as Metrics

      const userId = await knex('users')
        .select('id')
        .where('session_id', sessionId)

      const meals = await knex('meals')
        .where('user_id', userId[0].id)
        .orderBy('date', 'desc')
        .select('*')

      let auxBestSequency = 0

      meals.map((meal) => {
        console.log(meal)

        if (meal.is_on_diet === 1) {
          metrics.totalInDiet++
          auxBestSequency++

          if (auxBestSequency > metrics.bestSequency) {
            metrics.bestSequency = auxBestSequency
          }
        } else {
          metrics.totalOutDiet++
          auxBestSequency = 0
        }

        return metrics
      })

      metrics.total = meals.length
      metrics.inDietPercentage = metrics.totalInDiet / metrics.total

      return { metrics }
    },
  )

  app.put(
    '/:id',
    {
      preHandler: [
        checkSessionIdExists,
        checkUserExists,
        checkMealWithIdExists,
      ],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      const getMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        date: z.coerce.date().optional(),
        isOnDiet: z.boolean().optional(),
      })

      const { name, description, date, isOnDiet } = getMealBodySchema.parse(
        request.body,
      )

      const userId = await knex('users')
        .select('id')
        .where('session_id', sessionId)

      await knex('meals')
        .where({
          id,
          user_id: userId[0].id,
        })
        .update({
          name,
          description,
          date,
          is_on_diet: isOnDiet,
        })

      return reply.status(204).send()
    },
  )

  app.delete(
    '/:id',
    {
      preHandler: [
        checkSessionIdExists,
        checkUserExists,
        checkMealWithIdExists,
      ],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      const userId = await knex('users')
        .select('id')
        .where('session_id', sessionId)

      await knex('meals')
        .where({
          id,
          user_id: userId[0].id,
        })
        .del()

      return reply.status(204).send()
    },
  )

  app.post(
    '/',
    {
      preHandler: [checkSessionIdExists, checkUserExists],
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
