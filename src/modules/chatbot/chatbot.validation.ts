import { z } from "zod";

const chatValidationSchema = z.object({
  body: z.object({
    message: z.string({
      required_error: "Message is required",
    }).min(1, "Message is required"),
  }),
});

const chatbotValidation = {
  chatValidationSchema,
};

export default chatbotValidation;
