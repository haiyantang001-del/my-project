import express, { Application } from 'express'
import cors from 'cors'
import compression from 'compression'
import 'express-async-errors'
import { env } from './config/env'
import { errorHandler } from './middleware/errorHandler'
import { httpLogger } from './middleware/logger'
import { systemRouter } from './modules/system'
import { authRouter } from './modules/auth'
import { customerRouter } from './modules/customers'
import { opportunityRouter } from './modules/opportunities'
import { contractRouter } from './modules/contracts'
import { paymentRouter } from './modules/payments'
import { activityRouter } from './modules/activities'
import { dictRouter } from './modules/dict'
import { userRouter } from './modules/users'
import { statsRouter } from './modules/stats'

export const createApp = (): Application => {
  const app = express()

  // HTTP request logging
  app.use(httpLogger)

  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN,
      credentials: env.CORS_ORIGIN !== '*',
    })
  )

  // Body parsing and compression
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(compression())

  // API routes - System & Health
  app.use(env.API_PREFIX, systemRouter)

  // Auth routes
  app.use(`${env.API_PREFIX}/auth`, authRouter)

  // Business routes
  app.use(`${env.API_PREFIX}/customers`, customerRouter)
  app.use(`${env.API_PREFIX}/opportunities`, opportunityRouter)
  app.use(`${env.API_PREFIX}/contracts`, contractRouter)
  app.use(`${env.API_PREFIX}/payments`, paymentRouter)
  app.use(`${env.API_PREFIX}/activities`, activityRouter)
  app.use(`${env.API_PREFIX}/dict`, dictRouter)
  app.use(`${env.API_PREFIX}/users`, userRouter)
  app.use(`${env.API_PREFIX}/stats`, statsRouter)

  // Error handling
  app.use(errorHandler)

  return app
}
