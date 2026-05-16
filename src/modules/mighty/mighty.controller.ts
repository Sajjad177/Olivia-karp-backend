import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { mightyService } from "./mighty.service";
import config from "../../config";
import AppError from "../../errors/AppError";

// const mightyWebhookHandler = catchAsync(async (req: Request, res: Response) => {
//   // Security: Verify secret from Zapier/MN
//   const webhookSecret = req.headers["authorization"];
  
//   if (webhookSecret !== config.mighty.mighty_webhook_secret) {
//     throw new AppError("Unauthorized access", StatusCodes.UNAUTHORIZED);
//   }

//   const result = await mightyService.activateMightyMembership(req.body);

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Membership role updated successfully",
//     data: result,
//   });
// });


const mightyWebhookHandler = catchAsync(async (req: Request, res: Response) => {
  // Middleware handles security completely. Directly execute the business logic here.
  const result = await mightyService.activateMightyMembership(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Membership role updated successfully",
    data: result,
  });
});

const getPlans = catchAsync(async (req: Request, res: Response) => {
  const result = await mightyService.getAllPlansFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Membership plans retrieved successfully",
    data: result,
  });
});

export const mightyController = {
  mightyWebhookHandler,
  getPlans
};