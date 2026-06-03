import { model, Schema } from 'mongoose';
import { ICourse, ILesson } from './course.interface';

/* -------------------- Lesson Schema -------------------- */
const LessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
    duration: { type: String },
    level: { type: String },
    isLocked: { type: Boolean, default: true },
  },
  { _id: false },
);

/* -------------------- Image Schema -------------------- */
const ImageSchema = new Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
  },
  { _id: false },
);

/* -------------------- Course Schema -------------------- */
const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: { type: String, required: true },
    instructorName: { type: String, required: true },
    instructorBio: { type: String, required: true },
    instructorImage: { type: ImageSchema, required: true },
    description: { type: String },
    durationHours: { type: Number, required: true },
    estimatedWeeks: { type: Number, required: true },
    lessons: { type: [LessonSchema], default: [] },
    image: { type: ImageSchema, required: true },
    isLocked: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    price: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'CAD', trim: true },
    totalEnrolled: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Course = model<ICourse>('Course', CourseSchema);
export default Course;
