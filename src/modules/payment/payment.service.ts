/* eslint-disable prefer-const */
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import Stripe from "stripe";
import AppError from "../../errors/AppError";
import PurchaseSubscription from "../purchaseSubscription/purchaseSubscription.model";
import purchaseSubscriptionService from "../purchaseSubscription/purchaseSubscription.service";
import SubscriptionPlan from "../subscriptionPlan/subscriptionPlan.model";
import { User } from "../user/user.model";
import Payment from "./payment.model";
import Course from "../course/course.model";
import { Event } from "../event/event.model";
import JoinMentorCoach from "../JoinMentorsAndCoache/JoinMentorsAndCoach.model";
import PurchaseRecord from "../purchaseRecord/purchaseRecord.model";
import EnrollCourse from "../enrollCourse/enrollCourse.model";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const createPaymentForSubscription = async (
  subscriptionPlanId: string,
  email: string,
) => {
  // 🔹 1. Check User
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(
      "No account found with the provided credentials.",
      StatusCodes.NOT_FOUND,
    );
  }

  // 🔹 2. Check Subscription Plan
  const subscription = await SubscriptionPlan.findById(subscriptionPlanId);
  if (!subscription) {
    throw new AppError("Subscription not found", StatusCodes.NOT_FOUND);
  }

  const now = new Date();

  // ===============================
  // ✅ FREE TRIAL
  // ===============================
  if (subscription.hasTrial) {
    // ❗ prevent multiple trial
    const existingTrial = await PurchaseSubscription.findOne({
      userId: user._id,
      subscriptionId: subscription._id,
    });

    if (existingTrial) {
      throw new AppError(
        "You have already used the trial for this plan",
        StatusCodes.BAD_REQUEST,
      );
    }

    const expirationDate = new Date(
      now.getTime() + (subscription.trialDays || 3) * 24 * 60 * 60 * 1000,
    );

    const newPurchase = await PurchaseSubscription.create({
      userId: user._id,
      subscriptionId: subscription._id,
      paymentId: null,
      purchaseDate: now,
      expirationDate,
      status: "active",
    });

    return {
      subscription: newPurchase,
      message: "Free trial started",
    };
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: user.email,

    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: subscription.title,
            description: subscription.description,
          },
          unit_amount: subscription.price * 100,
        },
        quantity: 1,
      },
    ],

    metadata: {
      userId: user._id.toString(),
      subscriptionId: subscription._id.toString(),
    },

    success_url: `${process.env.FRONT_END_URL}/payment/success`,
    cancel_url: `${process.env.FRONT_END_URL}/payment/cancel`,
  });

  // 🔹 Create unpaid payment (IMPORTANT)
  await Payment.create({
    userId: user._id,
    subscriptionId: subscription._id,
    amount: subscription.price,
    status: "unpaid",
    transactionId: session.id,
  });

  return {
    checkoutUrl: session.url,
  };
};

const createGeneralCheckoutForEntity = async (
  userId: string,
  itemType: "course" | "event" | "careerService",
  itemId: string,
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  let item: any;
  let title = "";
  let basePrice = 0;

  if (itemType === "course") {
    item = await Course.findById(itemId);
    if (!item) throw new AppError("Course not found", StatusCodes.NOT_FOUND);
    title = item.title;
    basePrice = item.price || 0;
  } else if (itemType === "event") {
    item = await Event.findById(itemId);
    if (!item) throw new AppError("Event not found", StatusCodes.NOT_FOUND);
    title = item.title || "Event";
    basePrice = item.price || 0;
  } else if (itemType === "careerService") {
    item = await JoinMentorCoach.findById(itemId);
    if (!item) throw new AppError("Career Service not found", StatusCodes.NOT_FOUND);
    title = `${item.firstName} ${item.lastName} Session`;
    basePrice = item.hourlyRate || 0;
  } else {
    throw new AppError("Invalid item type", StatusCodes.BAD_REQUEST);
  }

  // Get User Benefits to handle Act On Pricing discounts
  const benefits = await purchaseSubscriptionService.getUserBenefits(userId);

  let finalPrice = basePrice;
  let discountPercentage = 0;

  if (basePrice > 0 && benefits.hasActiveSubscription) {
    let accessStatus = "paid";
    if (itemType === "course") {
      accessStatus = benefits.accessLevels?.courses || "paid";
      discountPercentage = benefits.discounts?.courses || 0;
    } else if (itemType === "event") {
      accessStatus = benefits.accessLevels?.events || "paid";
      discountPercentage = benefits.discounts?.events || 0;
    } else if (itemType === "careerService") {
      accessStatus = benefits.accessLevels?.careerServices || "paid";
      discountPercentage = benefits.discounts?.careerServices || 0;
    }

    if (accessStatus === "free_access" || accessStatus === "free_unlimited") {
      finalPrice = 0;
      discountPercentage = 100;
    } else if (discountPercentage > 0) {
      finalPrice = basePrice - (basePrice * discountPercentage) / 100;
    }
  }

  // If item is completely free or fully discounted, grant directly
  if (finalPrice <= 0) {
    const record = await PurchaseRecord.create({
      userId: user._id,
      itemType,
      itemId: item._id,
      paymentId: null,
      basePrice,
      discountApplied: discountPercentage,
      finalPrice: 0,
      currency: "CAD",
      status: "free",
    });

    if (itemType === "course") {
      await EnrollCourse.findOneAndUpdate(
        { userId: user._id, courseId: item._id },
        {
          userId: user._id,
          courseId: item._id,
          transactionId: "free_access",
          paymentStatus: "completed",
        },
        { upsert: true, new: true }
      );

      await Course.findByIdAndUpdate(item._id, {
        $inc: { totalEnrolled: 1 },
      });
    }

    return {
      message: "Access granted for free based on active subscription",
      purchaseRecord: record,
      checkoutUrl: null,
    };
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: user.email,

    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: title,
          },
          unit_amount: Math.round(finalPrice * 100),
        },
        quantity: 1,
      },
    ],

    metadata: {
      userId: user._id.toString(),
      itemType,
      itemId: item._id.toString(),
      isGeneralCheckout: "true",
    },

    success_url: `${process.env.FRONT_END_URL}/payment/success`,
    cancel_url: `${process.env.FRONT_END_URL}/payment/cancel`,
  });

  await PurchaseRecord.create({
    userId: user._id,
    itemType,
    itemId: item._id,
    paymentId: null,
    basePrice,
    discountApplied: discountPercentage,
    finalPrice,
    currency: "CAD",
    transactionId: session.id,
    status: "unpaid",
  });

  return {
    checkoutUrl: session.url,
  };
};

const stripeWebhookHandler = async (sig: any, payload: Buffer) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  // 🔐 Verify Signature
  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    throw new AppError(
      `Webhook Error: ${err.message}`,
      StatusCodes.BAD_REQUEST,
    );
  }

  // ===============================
  // ✅ HANDLE SUCCESS PAYMENT
  // ===============================
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Handle course enrollments à la carte (EnrollCourse flow)
    if (session.metadata?.isCourseEnrollment === "true") {
      const transactionId = session.id;
      const enrollment = await EnrollCourse.findOne({ transactionId });
      
      if (!enrollment) {
        throw new AppError("Enrollment record not found", StatusCodes.NOT_FOUND);
      }

      if (enrollment.paymentStatus === "completed") {
        return { message: "Enrollment already completed" };
      }

      const updatedEnrollment = await EnrollCourse.findOneAndUpdate(
        { transactionId, paymentStatus: "pending" },
        { paymentStatus: "completed" },
        { new: true }
      );

      if (updatedEnrollment) {
        await Course.findByIdAndUpdate(enrollment.courseId, {
          $inc: { totalEnrolled: 1 },
        });
      }

      return updatedEnrollment;
    }

    // Handle generalized checkouts
    if (session.metadata?.isGeneralCheckout === "true") {
      const transactionId = session.id;
      const record = await PurchaseRecord.findOne({ transactionId });
      
      if (!record) {
        throw new AppError("Purchase record not found", StatusCodes.NOT_FOUND);
      }

      if (record.status === "paid") {
        return { message: "General payment already processed" };
      }

      await PurchaseRecord.updateOne(
        { transactionId },
        { $set: { status: "paid" } }
      );

      // If it's a course checkout, we should ALSO create/update an EnrollCourse record as completed so courseService behaves correctly!
      if (record.itemType === "course") {
        await EnrollCourse.findOneAndUpdate(
          { userId: record.userId, courseId: record.itemId },
          { 
            userId: record.userId, 
            courseId: record.itemId, 
            transactionId: transactionId, 
            paymentStatus: "completed" 
          },
          { upsert: true, new: true }
        );
        
        await Course.findByIdAndUpdate(record.itemId, {
          $inc: { totalEnrolled: 1 }
        });
      }

      return record;
    }

    // Handle normal subscription plan checkouts
    const userId = session.metadata?.userId;
    const subscriptionId = session.metadata?.subscriptionId;

    if (!userId || !subscriptionId) {
      throw new AppError("Missing metadata", StatusCodes.BAD_REQUEST);
    }

    const userObjectId = new Types.ObjectId(userId);
    const subscriptionObjectId = new Types.ObjectId(subscriptionId);

    // 🔹 Get Subscription Plan
    const subscription = await SubscriptionPlan.findById(subscriptionObjectId);
    if (!subscription) {
      throw new AppError("Subscription not found", StatusCodes.NOT_FOUND);
    }

    // 🔹 Calculate Expiration
    const now = new Date();
    let expirationDate = new Date(now);

    if (subscription.billingType === "monthly") {
      expirationDate.setMonth(expirationDate.getMonth() + 1);
    } else if (subscription.billingType === "yearly") {
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    }

    // 🔹 Find existing payment
    const payment = await Payment.findOne({
      transactionId: session.id,
    });

    if (!payment) {
      throw new AppError("Payment not found", StatusCodes.NOT_FOUND);
    }

    // 🔹 Prevent duplicate webhook execution
    if (payment.status === "paid") {
      return { message: "Payment already processed" };
    }

    // 🔹 Update payment
    // payment.status = "paid";
    // await payment.save();

    await Payment.updateOne(
      { transactionId: session.id },
      { $set: { status: "paid" } },
    );

    // 🔹 Prevent duplicate subscription
    const existingSubscription = await PurchaseSubscription.findOne({
      paymentId: payment._id,
    });

    if (existingSubscription) {
      return existingSubscription;
    }

    // 🔹 Create subscription
    const purchase = await PurchaseSubscription.create({
      userId: userObjectId,
      subscriptionId: subscriptionObjectId,
      paymentId: payment._id,
      purchaseDate: now,
      expirationDate,
      status: "active",
    });

    return purchase;
  }

  return { message: `Unhandled event type: ${event.type}` };
};

const getAllPayment = async (query: any) => {
  // ✅ 1️⃣ Pagination params
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // ✅ 2️⃣ Filter (optional)
  const filter: any = {};

  if (query.userId) {
    filter.userId = query.userId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  // ✅ 3️⃣ Search (optional transactionId)
  if (query.search) {
    filter.transactionId = {
      $regex: query.search,
      $options: "i",
    };
  }

  // ✅ 4️⃣ Query execution
  const payments = await Payment.find(filter)
    .populate({
      path: "userId",
      select: "firstName lastName email image",
    })
    .populate({
      path: "subscriptionPlan",
      select: "title description price",
    })
    .sort({ createdAt: -1 }) // latest first
    .skip(skip)
    .limit(limit);

  // ✅ 5️⃣ Total count
  const total = await Payment.countDocuments(filter);

  // ✅ 6️⃣ Meta return
  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: payments,
  };
};

const getSinglePayment = async (id: string) => {
  const payment = await Payment.findById(id)
    .populate({
      path: "userId",
      select: "firstName lastName email image",
    })
    .populate({
      path: "subscriptionPlan",
      select: "title description price",
    });
  if (!payment) {
    throw new AppError("Payment not found", StatusCodes.NOT_FOUND);
  }
  return payment;
};

const getMyPayment = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }
  const payments = await Payment.find({ userId: user._id })
    .populate({
      path: "userId",
      select: "firstName lastName email image",
    })
    .populate({
      path: "subscriptionPlan",
      select: "title description price",
    });
  return payments;
};

const paymentService = {
  createPaymentForSubscription,
  createGeneralCheckoutForEntity,
  stripeWebhookHandler,
  getAllPayment,
  getSinglePayment,
  getMyPayment,
};

export default paymentService;
