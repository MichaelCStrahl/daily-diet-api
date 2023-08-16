import { beforeAll, afterAll, describe, it, beforeEach, expect } from 'vitest'
import { execSync } from 'child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('User routes', () => {
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

  it('should be able to create a new user', async () => {
    await request(app.server)
      .post('/users')
      .send({
        name: 'New User',
      })
      .expect(201)
  })

  it('should be able to list user', async () => {
    const createNewUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'New User',
      })

    const cookies = createNewUserResponse.get('Set-Cookie')

    const listUserResponse = await request(app.server)
      .get('/users')
      .set('Cookie', cookies)
      .expect(200)

    expect(listUserResponse.body.users).toEqual([
      expect.objectContaining({
        name: 'New User',
      }),
    ])
  })

  it('should be able to delete user', async () => {
    const createNewUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'New User',
      })

    const cookies = createNewUserResponse.get('Set-Cookie')

    const listUserResponse = await request(app.server)
      .get('/users')
      .set('Cookie', cookies)
      .expect(200)

    const userId = listUserResponse.body.users[0].id

    await request(app.server)
      .delete(`/users/${userId}`)
      .set('Cookie', cookies)
      .expect(204)
  })
})
