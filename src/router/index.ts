import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { ApplyBlogRoutes } from "../modules/applyBlog/applyBlog.routes";
import applyJobRouter from "../modules/applyJob/applyJob.router";
import authRouter from "../modules/auth/auth.router";
import { BlogRoutes } from "../modules/blog/blog.routes";
import chatbotRouter from "../modules/chatbot/chatbot.router";
import contactRouter from "../modules/contact/contact.router";
import courseRouter from "../modules/course/course.router";
import { CourseIdeaRoutes } from "../modules/courseIdea/courseIdea.routes";
import { EventRoutes } from "../modules/event/event.routes";
import InterviewRouter from "../modules/Interview/Interview.router";
import jobRouter from "../modules/job/job.router";
import joinMentorsAndCoachRouter from "../modules/JoinMentorsAndCoache/JoinMentorsAndCoach.router";
import { MediaRoutes } from "../modules/media/media.routes";
import { NewsletterRoutes } from "../modules/newsletter/newsletter.routes";
import paymentRouter from "../modules/payment/payment.router";
import purchaseSubscriptionRouter from "../modules/purchaseSubscription/purchaseSubscription.router";
import { ReviewRoutes } from "../modules/review/review.routes";
import speakerRouter from "../modules/speaker/speaker.router";
import subscriptionPlanRouter from "../modules/subscriptionPlan/subscriptionPlan.router";
import surveyRouter from "../modules/survey/survey.router";
import userRouter from "../modules/user/user.router";
import { purchaseRecordRoutes } from "../modules/purchaseRecord/purchaseRecord.router";
import enrollCourseRouter from "../modules/enrollCourse/enrollCourse.router";
import analyticsRouter from "../modules/analytics/analytics.router";
import notificationRouter from "../modules/notification/notification.router";
import { OpportunityRoutes } from "../modules/oppurtunity/opportunity.routes";
import teamRoutes from "../modules/team/team.routes";
import { mightyRoutes } from "../modules/mighty/mighty.route";


const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRouter,
  },
  {
    path: "/auth",
    route: authRouter,
  },
  {
    path: "/contact",
    route: contactRouter,
  },
  {
    path: "/event",
    route: EventRoutes,
  },
  {
    path: "/media",
    route: MediaRoutes,
  },
  {
    path: "/blog",
    route: BlogRoutes,
  },
  {
    path: "/courseIdea",
    route: CourseIdeaRoutes,
  },
  {
    path: "/jobs",
    route: jobRouter,
  },
  {
    path: "/apply-job",
    route: applyJobRouter,
  },
  {
    path: "/review",
    route: ReviewRoutes,
  },
  {
    path: "/mentors-coaches",
    route: joinMentorsAndCoachRouter,
  },
  {
    path: "/apply-blog",
    route: ApplyBlogRoutes,
  },
  {
    path: "/course",
    route: courseRouter,
  },
  {
    path: "/speaker",
    route: speakerRouter,
  },
  {
    path: "/interview",
    route: InterviewRouter,
  },
  {
    path: "/survey",
    route: surveyRouter,
  },
  {
    path: "/subscription",
    route: subscriptionPlanRouter,
  },
  {
    path: "/newsletter",
    route: NewsletterRoutes,
  },
  {
    path: "/purchase-subscription",
    route: purchaseSubscriptionRouter,
  },
  {
    path: "/payment",
    route: paymentRouter,
  },
  {
    path: "/chatbot",
    route: chatbotRouter,
  },
  {
    path: "/purchase-records",
    route: purchaseRecordRoutes,
  },
  {
    path: "/enrollment",
    route: enrollCourseRouter,
  },
  {
    path: "/analytics",
    route: analyticsRouter,
  },
  {
    path: "/notifications",
    route: notificationRouter,  
  },
  {
    path: "/opportunity",
    route: OpportunityRoutes,
  },
  {
    path: "/team",
    route: teamRoutes,
  },
  {
    path: "/mighty",
    route: mightyRoutes,
  }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

router.get("/", (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Welcome to Olivia Karp API v1",
    data: null,
  });
});

export default router;
