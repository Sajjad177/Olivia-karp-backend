import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { IChatbotRequest } from './chatbot.interface';

const CHATBOT_API_URL = 'https://bot.actonclimate.co/api/chat';

const sendMessageToChatbot = async (
  payload: {
    message: string;
  },
  userId: string,
) => {
  try {
    const formData = new URLSearchParams();

    formData.append('user_id', userId);

    formData.append('query', payload.message);

    const response = await fetch(CHATBOT_API_URL, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },

      body: formData.toString(),
    });

    const contentType = response.headers.get('content-type');

    const data = contentType?.includes('application/json')
      ? await response.json()
      : await response.text();

    return {
      statusCode: response.status,
      data,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      'Chatbot service is currently unavailable. Please try again later.',
      StatusCodes.BAD_GATEWAY,
    );
  }
};

const chatbotService = {
  sendMessageToChatbot,
};

export default chatbotService;
