import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  transports: [
    new transports.File({
      filename: 'logs/info.log',
      level: 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.align(),
        format.printf(
          (info) => `${info.timestamp} [${info.level}] ${info.message}`
        )
      ),
    }),
  ],
});

export default logger;
