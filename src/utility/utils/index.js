import { jwt, createError, winston, bcrypt } from "#packages/index.js";
import { blacklistedToken } from "#models/index.js";
import { env } from "../env/index.js";

const {
  NODE_ENV,
  JWT_SECRET_KEY,
  JWT_SHORT_EXPIRATION_TIME,
  JWT_LONG_EXPIRATION_TIME,
} = env;

const createLogger = () => {
  const logConfig = {
    levels: {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    },
    colors: {
      error: "red",
      warn: "yellow",
      info: "green",
      debug: "blue",
    },
  };

  winston.addColors(logConfig.colors);

  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  );

  return winston.createLogger({
    levels: logConfig.levels,
    transports: [
      new winston.transports.Console({
        format: consoleFormat,
        level: NODE_ENV === "production" ? "warn" : "debug",
        handleExceptions: true,
      }),
    ],
    exitOnError: false,
  });
};

const logger = createLogger();

const handleError = (error, message) => {
  logger.error("Error: ", error);

  if (!error.status) {
    error = createError(500, message);
  }

  return {
    status: error.status || 500,
    message: error.message || "Internal Server Error",
  };
};

export const utility = {
  hashPassword: async (password) => {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      return handleError(error, "Error hashing password");
    }
  },
  comparePassword: async (password, hashedPassword) => {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      return handleError(error, "Error comparing password");
    }
  },
  generateToken: (isRemembered, userId) => {
    try {
      const token = jwt.sign({ id: userId }, JWT_SECRET_KEY, {
        expiresIn:
          isRemembered ? JWT_LONG_EXPIRATION_TIME : JWT_SHORT_EXPIRATION_TIME,
      });
      return token;
    } catch (error) {
      return handleError(error, "Error generating token");
    }
  },
  verifyToken: async (token) => {
    try {
      const expiredToken = await blacklistedToken.findUnique({
        where: { token },
      });

      if (expiredToken) {
        throw createError(401, "Token has been invalidated");
      }

      const decoded = jwt.verify(token, JWT_SECRET_KEY);
      return decoded.id;
    } catch (error) {
      return handleError(error, "Error verifying token");
    }
  },
  handleError,
  logger,
};
