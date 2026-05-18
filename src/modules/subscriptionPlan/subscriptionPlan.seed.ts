import SubscriptionPlan from "./subscriptionPlan.model";
import logger from "../../logger";

export const seedSubscriptionPlans = async () => {
  try {
    const count = await SubscriptionPlan.countDocuments();
    if (count > 0) {
      logger.info("[Seeder] Subscription plans already exist. Skipping seed.");
      return;
    }

    const defaultPlans = [
      {
        title: "Beginner Member",
        description: "Perfect for getting started with climate action and learning the basics.",
        planTier: "beginner",
        price: 0,
        currency: "CAD",
        billingType: "monthly",
        features: [
          "Access to Blog and Podcast",
          "Limited Mighty Networks",
          "Standard AI Chatbot"
        ],
        accessLevels: {
          blogAndPodcast: "free",
          mightyNetworks: "limited",
          aiChatbot: "limited",
          events: "paid",
          courses: "paid",
          careerServices: "paid",
          mentorship: "not_available"
        },
        discounts: {
          aiChatbot: 0,
          events: 0,
          courses: 0,
          careerServices: 0
        },
        hasTrial: false,
        trialDays: 0,
        isHighlighted: false,
        status: "active",
        order: 1,
        link: "https://actonclimate.com/beginner"
      },
      {
        title: "Monthly Member",
        description: "Standard monthly membership with balanced benefits, discounts, and chatbot access.",
        planTier: "monthly",
        price: 29,
        currency: "CAD",
        billingType: "monthly",
        features: [
          "Full Blog & Podcast",
          "Standard Mighty Networks Access",
          "Unlimited AI Chatbot",
          "10% off Courses",
          "10% off Events"
        ],
        accessLevels: {
          blogAndPodcast: "full_access",
          mightyNetworks: "included",
          aiChatbot: "free_unlimited",
          events: "discounted",
          courses: "discounted",
          careerServices: "discounted",
          mentorship: "not_available"
        },
        discounts: {
          aiChatbot: 100,
          events: 10,
          courses: 10,
          careerServices: 10
        },
        hasTrial: true,
        trialDays: 3,
        isHighlighted: true,
        status: "active",
        order: 2,
        link: "https://actonclimate.com/monthly"
      },
      {
        title: "Yearly Member",
        description: "Ultimate access with maximum discounts, free courses, free events, and premium mentoring.",
        planTier: "yearly",
        price: 249,
        currency: "CAD",
        billingType: "yearly",
        features: [
          "Full Blog & Podcast",
          "VIP Mighty Networks Access",
          "Unlimited AI Chatbot",
          "Free Courses Access",
          "Free Events Access",
          "20% off Career Services"
        ],
        accessLevels: {
          blogAndPodcast: "full_access",
          mightyNetworks: "included",
          aiChatbot: "free_unlimited",
          events: "free_access",
          courses: "free_access",
          careerServices: "discounted",
          mentorship: "long_term_matching"
        },
        discounts: {
          aiChatbot: 100,
          events: 100,
          courses: 100,
          careerServices: 20
        },
        hasTrial: true,
        trialDays: 3,
        isHighlighted: false,
        status: "active",
        order: 3,
        link: "https://actonclimate.com/yearly"
      }
    ];

    await SubscriptionPlan.insertMany(defaultPlans);
    logger.info("[Seeder] Subscription plans seeded successfully with a 3-day free trial!");
  } catch (error) {
    logger.error(error, "[Seeder] Error seeding subscription plans");
  }
};
