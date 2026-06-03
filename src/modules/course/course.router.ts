import { Router } from 'express';

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Video course modules, lessons, and base pricing configurations.
 */
import auth from '../../middleware/auth';
import optionalAuth from '../../middleware/optionalAuth';
import { upload } from '../../middleware/multer.middleware';
import { USER_ROLE } from '../user/user.constant';
import courseController from './course.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/course/create:
 *   post:
 *     summary: Create a new course with Image and Lessons
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Course thumbnail image
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               lessons:
 *                 type: string
 *                 description: JSON string of lessons array. Example '[{"title":"Intro","duration":"10"}]'
 *     responses:
 *       201:
 *         description: Course created
 */
router.post(
  '/create',
  auth(USER_ROLE.ADMIN),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'instructorImage', maxCount: 1 },
  ]),
  courseController.CreateNewCourse,
);

/**
 * @swagger
 * /api/v1/course/all:
 *   get:
 *     summary: Retrieve courses with search and category filtering
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Search by title or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [
 *             'all courses',
 *             'beginner courses',
 *             'professional development courses',
 *             'business courses',
 *             'educational courses',
 *             'insight courses'
 *           ]
 *         description: Filter by specific category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of filtered courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/all', optionalAuth(), courseController.getAllCourses);

/**
 * @swagger
 * /api/v1/course/{courseId}:
 *   get:
 *     summary: Get a single course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details and lessons
 */
router.get('/:courseId', optionalAuth(), courseController.getSingleCourse);

/**
 * @swagger
 * /api/v1/course/{courseId}:
 *   put:
 *     summary: Update an existing course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               lessons:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course updated successfully
 */
router.put(
  '/:courseId',
  auth(USER_ROLE.ADMIN),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'instructorImage', maxCount: 1 },
  ]),
  courseController.updateCourse,
);

/**
 * @swagger
 * /api/v1/course/availability/{courseId}:
 *   put:
 *     summary: Update course availability (publish/unpublish)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPublish:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Availability updated successfully
 */
router.put('/availability/:courseId', courseController.updateCourseAvailability);

const courseRouter = router;
export default courseRouter;
