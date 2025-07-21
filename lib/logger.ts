import pino, { Logger } from 'pino'
import pinoMongo from 'pino-mongodb'

let loggerInstance: Logger | null = null

export async function getLogger(): Promise<Logger> {
  if (!loggerInstance) {
    const stream = await pinoMongo({
      uri: process.env.MONGO_URI as string,
      database: process.env.MONGO_DB_NAME as string,
      collection: 'logs'
    })
    loggerInstance = pino(
      {
        level: 'info',
        timestamp: pino.stdTimeFunctions.isoTime,
      },
      pino.multistream([
        { stream: process.stdout },
        { stream: stream.stream }
      ])
    )
  }
  return loggerInstance
}