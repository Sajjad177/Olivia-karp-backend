import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { uploadToCloudinary } from "../../utils/cloudinary";
import EnrollCourse from "../enrollCourse/enrollCourse.model";
import { ILesson } from "./course.interface";
import Course from "./course.model";
import purchaseSubscriptionService from "../purchaseSubscription/purchaseSubscription.service";


const CreateNewCourse = async (
  payload: any,
  files: Record<string, Express.Multer.File[]> | undefined,
) => {
  let lessons: ILesson[] = [];

  // Parse lessons if sent as a JSON string from form-data
  if (payload.lessons) {
    lessons =
      typeof payload.lessons === "string"
        ? JSON.parse(payload.lessons)
        : payload.lessons;
  }

  // Handle Cloudinary Image Upload
  let image = { url: "", public_id: "" };

  if (files && files.image && files.image.length > 0) {
    const imageFile = files.image[0];

    // Call your Cloudinary utility (ensure it's imported)
    const cloudinaryResult = await uploadToCloudinary(
      imageFile.path,
      "courses",
    );

    image = {
      url: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
    };
  }

  const lessonsData = lessons.map((lesson) => ({
    title: lesson.title,
    duration: lesson.duration,
    level: lesson.level,
    videoUrl: lesson.videoUrl,
    isLocked: lesson.isLocked !== undefined ? lesson.isLocked : true,
  }));

  const totalDurationMinutes = lessonsData.reduce((total, lesson) => {
    return total + (parseInt(lesson.duration) || 0);
  }, 0);

  const courseData = {
    ...payload,
    lessons: lessonsData,
    lessonCount: lessonsData.length,
    totalDuration: `${totalDurationMinutes} min`,
    price: Number(payload.price) || 0,
    currency: payload.currency || "CAD",
    image,
  };

  const result = await Course.create(courseData);
  return result;
};

const getAllCourses = async (query: Record<string, any>, user?: any) => {
  const { page = 1, limit = 10, searchTerm, category, sort } = query;

  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.max(Number(limit), 1);
  const skip = (pageNumber - 1) * limitNumber;

  const filter: any = {};

  // 1. Efficient Search: Use Text Index if searchTerm exists
  if (searchTerm) {
    filter.$or = [
      { title: { $regex: searchTerm, $options: "i" } },
      { category: { $regex: searchTerm, $options: "i" } },
    ];
  }

  // 2. Exact Category Filter: Avoid regex for fixed categories
  if (category && !["all", "all courses"].includes(category.toLowerCase())) {
    // Standardize: "Business Courses" -> "Business"
    const cleanCategory = category.replace(/\s*courses$/i, "").trim();

    // Exact match is much faster than regex
    filter.category = new RegExp(`^${cleanCategory}$`, "i");
  }

  // 3. Optimized Execution: Lean queries and parallel counting
  const [data, total] = await Promise.all([
    Course.find(filter)
      .sort(sort ? sort : { createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean(),
    Course.countDocuments(filter),
  ]);

  let finalData: any = data;

  if (user && user.role === "admin") {
    finalData = data.map((course: any) => ({ ...course, isLocked: false }));
  } else {
    let enrolledCourseIds: string[] = [];
    let hasFreeCourseAccess = false;

    if (user) {
      const enrollments = await EnrollCourse.find({
        userId: user._id || user.id,
        paymentStatus: "completed",
      });
      enrolledCourseIds = enrollments.map((e) => e.courseId.toString());

      try {
        const benefits = await purchaseSubscriptionService.getUserBenefits((user._id || user.id).toString());
        if (benefits.hasActiveSubscription) {
          const accessStatus = benefits.accessLevels?.courses;
          if (accessStatus === "free_access" || accessStatus === "free_unlimited") {
            hasFreeCourseAccess = true;
          }
        }
      } catch (err) {
        // Log error and fallback gracefully
      }
    }

    finalData = data.map((course: any) => {
      const price = course.price || 0;
      const isEnrolled = enrolledCourseIds.includes(course._id.toString());
      return {
        ...course,
        isLocked: price > 0 && !isEnrolled && !hasFreeCourseAccess,
      };
    });
  }

  return {
    data: finalData,
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPage: Math.ceil(total / limitNumber),
    },
  };
};

const getSingleCourse = async (id: string, user?: any) => {
  const result = await Course.findById(id).lean();
  if (!result) throw new AppError("Course not found", httpStatus.NOT_FOUND);

  let hasAccess = false;

  if (user && user.role === "admin") {
    hasAccess = true;
  } else if (user) {
    const isEnrolled = await EnrollCourse.findOne({
      userId: user._id || user.id,
      courseId: id,
      paymentStatus: "completed",
    });
    if (isEnrolled) {
      hasAccess = true;
    } else {
      try {
        const benefits = await purchaseSubscriptionService.getUserBenefits((user._id || user.id).toString());
        if (benefits.hasActiveSubscription) {
          const accessStatus = benefits.accessLevels?.courses;
          if (accessStatus === "free_access" || accessStatus === "free_unlimited") {
            hasAccess = true;
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    }
  }

  result.isLocked = !hasAccess && (result.price || 0) > 0;

  if (!hasAccess) {
    if (result.lessons) {
      result.lessons = result.lessons.map((lesson: any) => {
        // Assume true unless explicitly set to false to secure old courses!
        if (lesson.isLocked !== false) {
          lesson.videoUrl = "LOCKED";
        }
        return lesson;
      });
    }
  }

  return result;
};

const updateCourse = async (
  id: string,
  payload: any,
  files: Record<string, Express.Multer.File[]> | undefined,
) => {
  const course = await Course.findById(id);

  if (!course) {
    throw new AppError("Course not found", httpStatus.NOT_FOUND);
  }

  let lessonsData = course.lessons;

  // 1. Properly parse and update lessons
  if (payload.lessons) {
    const lessons: ILesson[] =
      typeof payload.lessons === "string"
        ? JSON.parse(payload.lessons)
        : payload.lessons;

    if (lessons.length > 0) {
      lessonsData = lessons.map((lesson) => ({
        title: lesson.title,
        duration: lesson.duration,
        level: lesson.level,
        videoUrl: lesson.videoUrl,
        isLocked: lesson.isLocked !== undefined ? lesson.isLocked : true,
      }));
    }
  }

  // 2. Handle image from Multer fields object
  let image = course.image;
  if (files && files.image && files.image.length > 0) {
    const imageFile = files.image[0];
    image = {
      url: `/uploads/${imageFile.filename}`,
      public_id: imageFile.filename,
    };
  }

  // 3. Recalculate derived data
  const lessonCount = lessonsData.length;
  const totalMinutes = lessonsData.reduce((total, lesson) => {
    return total + (parseInt(lesson.duration) || 0);
  }, 0);

  // 4. Construct update object
  const updatedData = {
    ...payload, // Spread the rest (title, category, etc.)
    lessons: lessonsData,
    lessonCount,
    totalDuration: `${totalMinutes} min`,
    price: payload.price ? Number(payload.price) : course.price,
    image,
  };

  const result = await Course.findByIdAndUpdate(id, updatedData, {
    new: true,
    runValidators: true,
  });

  return result;
};

const updateCourseAvailability = async (id: string) => {
  const course = await Course.findById(id);
  if (!course) throw new AppError("Course not found", httpStatus.NOT_FOUND);

  return await Course.findByIdAndUpdate(
    id,
    { isAvailable: !course.isAvailable },
    { new: true },
  );
};

const courseService = {
  CreateNewCourse,
  getAllCourses,
  getSingleCourse,
  updateCourse,
  updateCourseAvailability,
};
export default courseService;
