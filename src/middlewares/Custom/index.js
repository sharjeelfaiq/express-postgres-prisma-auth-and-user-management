import { utility } from "#utility/index.js";

export const validate = {
  dto: (schema) => async (req, res, next) => {
    try {
      const { value, error } = schema.validate(req.body, { abortEarly: false });

      if (error) {
        const errorMessages = error.details.map((detail) => detail.message);

        logger.warn({
          message: "Validation failed",
          method: req.method,
          url: req.originalUrl,
          errors: errorMessages,
        });

        return res.status(400).json({ errors: errorMessages });
      }

      req.body = value;

      next();
    } catch (error) {
      return handleError(error, "Failed to validate request");
    }
  },
  authToken: (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(403).json({ message: "No token provided" });
    }

    try {
      const decoded = utility.verifyToken(token);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized: " + err.message });
    }
  },
  authRole: (admin) => (req, res, next) => {
    if (req.decoded.role !== admin) {
      logger.error("Forbidden: Admin access required");
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    next();
  },
};
