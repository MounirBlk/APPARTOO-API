import winston from "winston";

const OPTIONS = {
    file: {
        level: "info",
        filename: "./logs/app.log",
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
        format: winston.format.combine(
            winston.format.timestamp({ format: "MMM-DD-YYYY hh:mm:ss" }),
            winston.format.align(),
            winston.format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`)
        ),
    },
};

export const logger: any = winston.createLogger({
    transports: [new winston.transports.File(OPTIONS.file)],
    exitOnError: false, // do not exit on handled exceptions
});

logger.stream = {
    write: (message: any, encoding: any) => {
        logger.info(message);
    },
};

export const errorLogger: winston.Logger = winston.createLogger({
    transports: [new winston.transports.File({ ...OPTIONS.file, level: "error", filename: "./logs/error.log" })],
    exitOnError: false, // do not exit on handled exceptions
});
