import { Router } from "express";
import auth from "../../middleware/auth";
import { upload } from "../../middleware/multer.middleware";
import { USER_ROLE } from "../user/user.constant";
import JoinMentorsAndCoachController from "./JoinMentorsAndCoach.controller";

/**
 * @swagger
 * tags:
 *   name: JoinMentorsAndCoache
 *   description: Mentors and Coaches joining, discovery, and management
 */

const router = Router();

/**
 * @swagger
 * /api/v1/JoinMentorsAndCoache/join:
 *   post:
 *     summary: Apply to join as a Mentor or Coach
 *     tags: [JoinMentorsAndCoache]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - file
 *               - type
 *               - bio
 *               - about
 *               - bookingLink
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Profile image
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [mentor, coach]
 *               bio:
 *                 type: string
 *               about:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               experienceYears:
 *                 type: number
 *               bookingLink:
 *                 type: string
 *               isPaidSession:
 *                 type: boolean
 *               hourlyRate:
 *                 type: number
 *     responses:
 *       201:
 *         description: Application submitted successfully
 */
router.post(
  "/join",
  auth(USER_ROLE.ADMIN, USER_ROLE.MEMBER, USER_ROLE.NON_MEMBER),
  upload.single("file"),
  JoinMentorsAndCoachController.createJoinMentorsAndCoachIntoDB,
);

/**
 * @swagger
 * /api/v1/JoinMentorsAndCoache/all:
 *   get:
 *     summary: Retrieve all join applications (Admin Only)
 *     tags: [JoinMentorsAndCoache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [mentor, coach]
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
 *         description: List of all applications retrieved
 */
router.get("/all", JoinMentorsAndCoachController.getAllJoinMentorsAndCoaches);

/**
 * @swagger
 * /api/v1/JoinMentorsAndCoache:
 *   get:
 *     summary: Retrieve approved and active Mentors/Coaches (Public)
 *     tags: [JoinMentorsAndCoache]
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [mentor, coach]
 *     responses:
 *       200:
 *         description: List of approved mentors and coaches
 */
router.get(
  "/",
  JoinMentorsAndCoachController.getApprovedJoinMentorsAndCoaches,
);

/**
 * @swagger
 * /api/v1/JoinMentorsAndCoache/{joinMentorsAndCoachId}:
 *   get:
 *     summary: Get details of a single Mentor/Coach profile
 *     tags: [JoinMentorsAndCoache]
 *     parameters:
 *       - in: path
 *         name: joinMentorsAndCoachId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile details retrieved
 */
router.get(
  "/:joinMentorsAndCoachId",
  JoinMentorsAndCoachController.getSingleJoinMentorsAndCoach,
);

/**
 * @swagger
 * /api/v1/JoinMentorsAndCoache/approved/{joinMentorsAndCoachId}:
 *   put:
 *     summary: Approve a Mentor/Coach application (Admin Only)
 *     tags: [JoinMentorsAndCoache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: joinMentorsAndCoachId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Application approved
 */
router.put(
  "/approved/:joinMentorsAndCoachId",
  JoinMentorsAndCoachController.approvedJoinMentorsAndCoach,
);

/**
 * @swagger
 * /api/v1/JoinMentorsAndCoache/toggle/{joinMentorsAndCoachId}:
 *   put:
 *     summary: Toggle active status (show/hide) of a Mentor/Coach (Admin Only)
 *     tags: [JoinMentorsAndCoache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: joinMentorsAndCoachId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active status toggled
 */
router.put(
  "/toggle/:joinMentorsAndCoachId",
  JoinMentorsAndCoachController.toggleMentorAndCoachActive,
);

/**
 * @swagger
 * /api/v1/JoinMentorsAndCoache/bulk-upload:
 *   post:
 *     summary: Bulk upload Mentors and Coaches via CSV (Admin Only)
 *     tags: [JoinMentorsAndCoache]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file containing mentor/coach details
 *     responses:
 *       200:
 *         description: Mentors and coaches uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Bulk upload completed. Successfully created 5, updated 2 records.
 *                 data:
 *                   type: object
 *                   properties:
 *                     createdCount:
 *                       type: integer
 *                       example: 5
 *                     updatedCount:
 *                       type: integer
 *                       example: 2
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: Row 3: Missing required field "firstName"
 */
router.post(
  "/bulk-upload",
  auth(USER_ROLE.ADMIN),
  upload.single("file"),
  JoinMentorsAndCoachController.bulkUploadMentorsAndCoaches,
);

const joinMentorsAndCoachRouter = router;
export default joinMentorsAndCoachRouter;

