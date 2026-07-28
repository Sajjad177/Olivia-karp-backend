import bcrypt from 'bcrypt';
import { model, Schema } from 'mongoose';
import config from '../../config';
import { applyEncryption } from '../../middleware/encryptionMiddleware';
import { IUser, userModel } from './user.interface';

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
    },
    password: {
      type: String,
      // required: true,
    },
    street: {
      type: String,
    },
    location: {
      type: String,
    },
    postalCode: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    role: {
      type: String,
      enum: ['admin', 'non-member', 'member'],
      default: 'non-member',
    },
    // ⬇️ ADD THESE TWO FIELDS ⬇️
    mightyMemberId: {
      type: String,
      default: null,
    },
    memberSince: {
      type: Date,
      default: null,
    },
    last_mn_sync: {
      type: Date,
      default: null,
    },
    image: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isSurvey: {
      type: Boolean,
      default: false,
    },
    auth: [
      {
        provider: {
          type: String,
          enum: ['google', 'facebook', 'linkedin', 'apple', 'credentials'],
          default: 'credentials',
        },
        providerId: {
          type: String,
        },
      },
    ],
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    resetPasswordOtp: { type: String, default: null },
    resetPasswordOtpExpires: { type: Date, default: null },
    freeChatUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.pre('save', async function (this: any, next: (err?: Error) => void) {
  // 🔹 password change না হলে hash করো না
  if (!this.isModified('password')) {
    return next();
  }

  // 🔹 password না থাকলে stop
  if (!this.password) {
    return next(new Error('Password is required'));
  }

  const saltRounds = Number(config.bcryptSaltRounds);

  // 🔹 saltRounds valid কিনা check
  if (!saltRounds) {
    return next(new Error('Bcrypt salt rounds not configured'));
  }

  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

userSchema.post('save', function (doc: any, next: (err?: Error) => void) {
  doc.password = '';
  next();
});

userSchema.statics.isPasswordMatch = async function (password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword);
};

userSchema.statics.isUserExistByEmail = async function (email: string): Promise<IUser | null> {
  return await User.findOne({ email });
};

userSchema.statics.isUserExistById = async function (_id: string): Promise<IUser | null> {
  return await User.findOne({ _id });
};

applyEncryption(userSchema, ['phone', 'street', 'location', 'postalCode']);

export const User = model<IUser, userModel>('User', userSchema);
