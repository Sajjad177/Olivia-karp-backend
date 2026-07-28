import { Router } from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import chatbotController from './chatbot.controller';
import chatbotValidation from './chatbot.validation';

const router = Router();

router.post(
  '/',
  auth(
    USER_ROLE.ADMIN,
    USER_ROLE.NON_MEMBER,
    USER_ROLE.MEMBER,
    USER_ROLE.ANNUAL_MEMBER,
    USER_ROLE.MONTHLY_MEMBER,
    USER_ROLE.BEGINNER_MEMBER,
  ),
  validateRequest(chatbotValidation.chatValidationSchema),
  chatbotController.chat,
);

const chatbotRouter = router;
export default chatbotRouter;
