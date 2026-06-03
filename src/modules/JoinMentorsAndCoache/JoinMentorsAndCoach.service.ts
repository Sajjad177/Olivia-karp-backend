import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { User } from "../user/user.model";
import { IJoinMentorsAndCoach } from "./JoinMentorsAndCoach.interface";
import JoinMentorCoach from "./JoinMentorsAndCoach.model";
import fs from "fs";
import { parseCSV } from "../../utils/csvParser";

const createJoinMentorsAndCoachIntoDB = async (
  file: Express.Multer.File,
  payload: IJoinMentorsAndCoach,
  email: string,
) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(
      "No account found with the provided credentials.",
      StatusCodes.NOT_FOUND,
    );
  }

  const existingUser = await JoinMentorCoach.findOne({
    userId: user._id,
    isApproved: true,
  });
if (existingUser && user.role !== "admin") {
  throw new AppError(
    `You are already join as a ${existingUser.type}`,
    StatusCodes.BAD_REQUEST,
  );
}

  const existingEmail = await JoinMentorCoach.findOne({
    userId: user._id,
    isApproved: false,
  });
if (existingEmail && user.role !== "admin") {
  throw new AppError(
    `You have already applied as a ${existingEmail.type}, please wait for admin approval`,
    StatusCodes.BAD_REQUEST,
  );
}

  const emailExists = await JoinMentorCoach.findOne({ email: payload.email });
  if (emailExists) {
    throw new AppError("This email already exists", StatusCodes.BAD_REQUEST);
  }

  if (file) {
    const imageData = await uploadToCloudinary(file.path, "mentors-coaches");

    payload.image = {
      url: imageData.secure_url,
      public_id: imageData.public_id,
    };
  } else {
    throw new AppError("Image is required", StatusCodes.BAD_REQUEST);
  }

  const result = await JoinMentorCoach.create({
    ...payload,
    userId: user._id,
    isApproved: user.role === "admin" ? true : false,
  });

  return result;
};

const getAllJoinMentorsAndCoaches = async (query: any) => {
  const { searchTerm, type, page = 1, limit = 10 } = query;

  const filter: any = {};

  // filter mentor / coach
  if (type) {
    filter.type = type;
  }

  // search
  if (searchTerm) {
    filter.$or = [
      { firstName: { $regex: searchTerm, $options: "i" } },
      { lastName: { $regex: searchTerm, $options: "i" } },
      { skills: { $regex: searchTerm, $options: "i" } },
    ];
  }

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const result = await JoinMentorCoach.find(filter)
    .skip(skip)
    .limit(limitNumber)
    .sort({ createdAt: -1 });

  const total = await JoinMentorCoach.countDocuments(filter);

  return {
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPage: Math.ceil(total / limitNumber),
    },
    data: result,
  };
};

const getApprovedJoinMentorsAndCoaches = async (query: any) => {
  const { searchTerm, type, page = 1, limit = 10 } = query;

  const filter: any = { isApproved: true, isActive: true };

  // filter mentor / coach
  if (type) {
    filter.type = type;
  }

  // search
  if (searchTerm) {
    filter.$or = [
      { firstName: { $regex: searchTerm, $options: "i" } },
      { lastName: { $regex: searchTerm, $options: "i" } },
      { skills: { $regex: searchTerm, $options: "i" } },
    ];
  }

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const result = await JoinMentorCoach.find(filter)
    .skip(skip)
    .limit(limitNumber)
    .sort({ createdAt: -1 });

  const total = await JoinMentorCoach.countDocuments(filter);

  return {
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPage: Math.ceil(total / limitNumber),
    },
    data: result,
  };
};

const getSingleJoinMentorsAndCoach = async (id: string) => {
  const result = await JoinMentorCoach.findById(id);
  if (!result) {
    throw new AppError(
      "Join mentors and coaches not found",
      StatusCodes.NOT_FOUND,
    );
  }

  return result;
};

const approvedJoinMentorsAndCoach = async (id: string) => {
  const result = await JoinMentorCoach.findById(id);
  if (!result) {
    throw new AppError(
      "Join mentors and coaches not found",
      StatusCodes.NOT_FOUND,
    );
  }

  await JoinMentorCoach.findByIdAndUpdate(
    { _id: id },
    { isApproved: true },
    { new: true },
  );
};

const toggleMentorAndCoachActive = async (id: string) => {
  const result = await JoinMentorCoach.findById(id);
  if (!result) {
    throw new AppError(
      "Join mentors and coaches not found",
      StatusCodes.NOT_FOUND,
    );
  }

  await JoinMentorCoach.findByIdAndUpdate(
    { _id: id },
    { isActive: !result.isActive },
    { new: true },
  );
};

const bulkUploadMentorsAndCoaches = async (file: Express.Multer.File) => {
  const csvText = fs.readFileSync(file.path, "utf-8");

  // Clean up the uploaded temp file after reading
  try {
    fs.unlinkSync(file.path);
  } catch (err) {
    console.error("Failed to delete temp file:", err);
  }

  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    throw new AppError(
      "CSV file is empty or missing data rows",
      StatusCodes.BAD_REQUEST,
    );
  }

  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  const errors: string[] = [];
  let createdCount = 0;
  let updatedCount = 0;

  for (let idx = 0; idx < dataRows.length; idx++) {
    const row = dataRows[idx];
    if (row.length === 0 || (row.length === 1 && row[0] === "")) {
      continue; // Skip empty rows
    }

    // Map row columns to object by headers
    const rawData: any = {};
    headers.forEach((header, colIdx) => {
      rawData[header] = row[colIdx] !== undefined ? row[colIdx].trim() : "";
    });

    const rowNum = idx + 2; // CSV is 1-indexed, header is row 1

    try {
      // Validate required fields
      const requiredFields = [
        "firstName",
        "lastName",
        "email",
        "bio",
        "about",
        "type",
        "experienceYears",
        "isPaidSession",
        "bookingLink",
      ];
      for (const field of requiredFields) {
        if (!rawData[field]) {
          throw new Error(`Row ${rowNum}: Missing required field "${field}"`);
        }
      }

      const email = rawData.email.toLowerCase();

      // Validate type
      if (rawData.type !== "mentor" && rawData.type !== "coach") {
        throw new Error(
          `Row ${rowNum}: Invalid type "${rawData.type}". Must be 'mentor' or 'coach'`,
        );
      }

      // Parse experienceYears
      const experienceYears = parseInt(rawData.experienceYears, 10);
      if (isNaN(experienceYears)) {
        throw new Error(`Row ${rowNum}: experienceYears must be a valid number`);
      }

      // Parse hourlyRate
      let hourlyRate = 0;
      if (rawData.hourlyRate) {
        hourlyRate = parseFloat(rawData.hourlyRate);
        if (isNaN(hourlyRate)) {
          throw new Error(`Row ${rowNum}: hourlyRate must be a number`);
        }
      }

      // Parse isPaidSession
      const isPaidSession =
        rawData.isPaidSession.toLowerCase() === "true" ||
        rawData.isPaidSession === "1" ||
        rawData.isPaidSession.toLowerCase() === "yes";

      // Parse arrays (skills, languages)
      const skills = rawData.skills
        ? rawData.skills
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];
      const languages = rawData.languages
        ? rawData.languages
            .split(",")
            .map((l: string) => l.trim())
            .filter(Boolean)
        : [];

      // Parse JSON sub-arrays if present, otherwise default to empty arrays
      let support = [];
      if (rawData.support) {
        try {
          support = JSON.parse(rawData.support);
        } catch (e) {
          // Fallback
        }
      }

      let experience = [];
      if (rawData.experience) {
        try {
          experience = JSON.parse(rawData.experience);
        } catch (e) {
          // Fallback
        }
      }

      // Retrieve or create User profile to associate userId
      let user = await User.findOne({ email });
      if (!user) {
        // Create a non-member user
        user = await User.create({
          firstName: rawData.firstName,
          lastName: rawData.lastName,
          email: email,
          phone: rawData.phone || undefined,
          role: "non-member",
          isVerified: true,
        });
      }

      // Build payload for JoinMentorCoach
      const payload: any = {
        userId: user._id,
        firstName: rawData.firstName,
        lastName: rawData.lastName,
        email: email,
        phone: rawData.phone || undefined,
        address: rawData.address || undefined,
        designation: rawData.designation || undefined,
        bio: rawData.bio,
        about: rawData.about,
        type: rawData.type,
        skills,
        languages,
        experienceYears,
        linkedin: rawData.linkedin || "",
        website: rawData.website || "",
        isPaidSession,
        hourlyRate,
        bookingLink: rawData.bookingLink,
        motivation: rawData.motivation || "",
        goal: rawData.goal || "",
        isApproved: true, // Auto-approved because the admin is uploading them
        isActive: true,
        support,
        experience,
      };

      if (rawData.imageUrl) {
        payload.image = {
          url: rawData.imageUrl,
          public_id: "",
        };
      } else {
        payload.image = {
          url: "https://res.cloudinary.com/default-placeholder-mentor-coach.png",
          public_id: "",
        };
      }

      // Upsert into JoinMentorCoach based on email
      const existingMentorCoach = await JoinMentorCoach.findOne({ email });
      if (existingMentorCoach) {
        await JoinMentorCoach.findByIdAndUpdate(
          existingMentorCoach._id,
          payload,
          { new: true },
        );
        updatedCount++;
      } else {
        await JoinMentorCoach.create(payload);
        createdCount++;
      }
    } catch (err: any) {
      errors.push(err.message || String(err));
    }
  }

  return {
    createdCount,
    updatedCount,
    errors,
  };
};

const JoinMentorsAndCoachService = {
  createJoinMentorsAndCoachIntoDB,
  getAllJoinMentorsAndCoaches,
  getSingleJoinMentorsAndCoach,
  approvedJoinMentorsAndCoach,
  toggleMentorAndCoachActive,
  getApprovedJoinMentorsAndCoaches,
  bulkUploadMentorsAndCoaches,
};

export default JoinMentorsAndCoachService;
