import { beforeAll, afterAll, describe, it, beforeEach, expect } from 'vitest'
import { execSync } from 'child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new meal', async () => {
    const createNewUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'New User',
      })

    const cookies = createNewUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .send({
        name: 'New Meal',
        description: 'Description new meal',
        date: new Date('2023-08-04T00:00:00.000Z'),
        isOnDiet: false,
      })
      .set('Cookie', cookies)
      .expect(201)
  })

  it('should be able to list meals', async () => {
    const createNewUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'New User',
      })

    const cookies = createNewUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'First New Meal',
        description: 'Description first new meal',
        date: new Date('2023-08-04T00:00:00.000Z'),
        isOnDiet: false,
      })

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Second New Meal',
        description: 'Description second new meal',
        date: new Date('2023-08-05T00:00:00.000Z'),
        isOnDiet: true,
      })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    expect(listMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'First New Meal',
        description: 'Description first new meal',
        date: '2023-08-04T00:00:00.000Z',
        is_on_diet: 0,
      }),
      expect.objectContaining({
        name: 'Second New Meal',
        description: 'Description second new meal',
        date: '2023-08-05T00:00:00.000Z',
        is_on_diet: 1,
      }),
    ])
  })

  it('should be able to list one meal', async () => {
    const createNewUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'New User',
      })

    const cookies = createNewUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'First New Meal',
        description: 'Description first new meal',
        date: new Date('2023-08-04T00:00:00.000Z'),
        isOnDiet: false,
      })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    const listMealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(listMealResponse.body.meal).toEqual(
      expect.objectContaining({
        name: 'First New Meal',
        description: 'Description first new meal',
        date: '2023-08-04T00:00:00.000Z',
        is_on_diet: 0,
      }),
    )
  })

  it('should be albe to edit one meal', async () => {
    const createNewUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'New User',
      })

    const cookies = createNewUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'First New Meal',
        description: 'Description first new meal',
        date: new Date('2023-08-04T00:00:00.000Z'),
        isOnDiet: false,
      })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    await request(app.server)
      .put(`/meals/${mealId}`)
      .send({
        name: 'Update Meal',
        description: 'Update description new meal',
        date: new Date('2023-08-16T00:00:00.000Z'),
        isOnDiet: true,
      })
      .set('Cookie', cookies)
      .expect(204)

    const listMealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(listMealResponse.body.meal).toEqual(
      expect.objectContaining({
        name: 'Update Meal',
        description: 'Update description new meal',
        date: '2023-08-16T00:00:00.000Z',
        is_on_diet: 1,
      }),
    )
  })

  it('should be able to get metrics of meals', async () => {
    const createNewUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'New User',
      })

    const cookies = createNewUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'First New Meal',
        description: 'Description first new meal',
        date: new Date('2023-08-04T00:00:00.000Z'),
        isOnDiet: false,
      })

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Second New Meal',
        description: 'Description second new meal',
        date: new Date('2023-08-05T00:00:00.000Z'),
        isOnDiet: true,
      })

    const listMealsResponse = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', cookies)
      .expect(200)

    expect(listMealsResponse.body.metrics).toEqual(
      expect.objectContaining({
        bestSequency: 1,
        inDietPercentage: 0.5,
        total: 2,
        totalInDiet: 1,
        totalOutDiet: 1,
      }),
    )
  })

  it('should be able to delete one meal', async () => {
    const createNewUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'New User',
      })

    const cookies = createNewUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'First New Meal',
        description: 'Description first new meal',
        date: new Date('2023-08-04T00:00:00.000Z'),
        isOnDiet: false,
      })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(204)
  })
})
