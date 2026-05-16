// import { NextFunction, Request, Response } from "express";
// import { StatusCodes } from "http-status-codes";
// import config from "../config";
// import AppError from "../errors/AppError";
// import logger from "../logger";
// import { verifyToken } from "../utils/tokenGenerate";

// const auth = (...roles: string[]) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const extractedToken = req.headers.authorization;
//       const token = extractedToken?.split(" ")[1];
//       if (!token) {
//         throw new AppError("Invalid token", StatusCodes.UNAUTHORIZED);
//       }

//       const verifyUserData = verifyToken(token, config.JWT_SECRET as string);

//       req.user = verifyUserData as any;

//       if (roles.length && !roles.includes(verifyUserData.role)) {
//         throw new AppError("You are not authorized!", StatusCodes.UNAUTHORIZED);
//       }

//       next();
//     } catch (error: any) {
//       logger.error("Authorization error:", error);
//       throw new AppError("You are not authorized", StatusCodes.UNAUTHORIZED);
//     }
//   };
// };

// export default auth;






import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import config from "../config";
import AppError from "../errors/AppError";
import logger from "../logger";
import { verifyToken } from "../utils/tokenGenerate";

const auth = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const extractedToken = req.headers.authorization;
      if (!extractedToken) {
        throw new AppError("Invalid token", StatusCodes.UNAUTHORIZED);
      }

      // Extract the string cleanly whether it has "Bearer " or not
      const token = extractedToken.startsWith("Bearer ")
        ? extractedToken.split(" ")[1]
        : extractedToken;

      // Check if it's the Mighty Networks Webhook secret
      if (token === config.mighty.mighty_webhook_secret) {
        // Mock a user object so following controllers don't crash if they check req.user
        req.user = { role: "system_webhook" } as any; 
        return next();
      }

      // Otherwise, treat it as a standard user JWT
      const verifyUserData = verifyToken(token, config.JWT_SECRET as string);
      req.user = verifyUserData as any;

      if (roles.length && !roles.includes(verifyUserData.role)) {
        throw new AppError("You are not authorized!", StatusCodes.UNAUTHORIZED);
      }

      next();
    } catch (error: any) {
      logger.error("Authorization error:", error);
      throw new AppError("You are not authorized", StatusCodes.UNAUTHORIZED);
    }
  };
};

export default auth;