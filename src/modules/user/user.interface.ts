import { Model } from 'mongoose';
import { USER_ROLE } from './user.constant';

export interface IAuthInterface {
  provider: 'google' | 'facebook' | 'linkedin' | 'apple' | 'credentials';
  providerId: string;
}

export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  street: string;
  location: string;
  postalCode: string;
  dateOfBirth: Date;
  role: string;
  mightyMemberId?: string; // New: To link to MN account
  memberSince?: Date; // New: To track upgrade date
  last_mn_sync?: Date;
  image: {
    public_id: string;
    url: string;
  };
  auth: IAuthInterface[];
  isVerified: boolean;
  isSurvey: boolean;
  otp?: string | null;
  otpExpires?: Date | null;
  resetPasswordOtp?: string | null;
  resetPasswordOtpExpires?: Date | null;
  freeChatUsed: number;
}

export interface userModel extends Model<IUser> {
  isPasswordMatch(password: string, hashedPassword: string): Promise<boolean>;
  isUserExistByEmail(email: string): Promise<IUser | null>;
  isUserExistById(_id: string): Promise<IUser | null>;
}

export type TUserRole = keyof typeof USER_ROLE;
