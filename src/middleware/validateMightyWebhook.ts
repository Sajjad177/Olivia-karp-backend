import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import config from "../config";
import AppError from "../errors/AppError";
import logger from "../logger";

const validateMightyWebhook = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new AppError("Authorization header missing", StatusCodes.UNAUTHORIZED);
      }

      // 1. Extract the token cleanly and remove any accidental whitespaces
      let token = authHeader.trim();
      if (token.startsWith("Bearer ")) {
        token = token.substring(7).trim(); // Safely cuts off "Bearer " and trims the rest
      }

      const expectedSecret = config.mighty.mighty_webhook_secret;

      // Temporary debug logs to see EXACTLY what strings are hitting the comparison in your terminal
      console.log("--- WEBHOOK AUTH DEBUG ---");
      console.log("Extracted Token:", JSON.stringify(token));
      console.log("Expected Secret :", JSON.stringify(expectedSecret));
      console.log("--------------------------");

      if (!expectedSecret || token !== expectedSecret.trim()) {
        throw new AppError("Invalid webhook secret token", StatusCodes.UNAUTHORIZED);
      }

      next();
    } catch (error: any) {
      logger.error("Mighty Webhook Authorization error:", error);
      
      // If it's already an instance of AppError, pass it down cleanly 
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("You are not authorized", StatusCodes.UNAUTHORIZED);
    }
  };
};

export default validateMightyWebhook;