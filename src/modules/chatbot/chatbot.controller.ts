import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import purchaseSubscriptionService from '../purchaseSubscription/purchaseSubscription.service';
import chatbotService from './chatbot.service';
import { User } from '../user/user.model';
import sendResponse from '../../utils/sendResponse';

const chat = catchAsync(async (req, res): Promise<void> => {
  const userId = (req.user as any)?._id || (req.user as any)?.id;

  if (!userId) {
    throw new AppError('You are not authorized', StatusCodes.UNAUTHORIZED);
  }

  // Check subscription
  const benefits = await purchaseSubscriptionService.getUserBenefits(userId.toString());

  // Free user limit check
  if (!benefits.hasActiveSubscription) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    if (user.freeChatUsed >= 3) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Your free chatbot limit has been reached. Please subscribe to continue.',
        requiresSubscription: true,
      });
      return;
    }

    // Increase free chat count
    await User.findByIdAndUpdate(userId, {
      $inc: {
        freeChatUsed: 1,
      },
    });
  }

  // Call FastAPI chatbot
  const result = await chatbotService.sendMessageToChatbot(req.body, userId.toString());

  if (result.statusCode >= 400) {
    throw new AppError('Chatbot request failed', result.statusCode);
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Chatbot response generated successfully.',
    data: {
      answer: result.data.text.answer,
    },
  });
});

const chatbotController = {
  chat,
};

export default chatbotController;
