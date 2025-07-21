import winston from 'winston'
import 'winston-mongodb'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.MongoDB({
      db: process.env.MONGO_URI as string,
      // RIMUOVI options: { useUnifiedTopology: true },
      collection: 'logs'
    })
  ]
})
