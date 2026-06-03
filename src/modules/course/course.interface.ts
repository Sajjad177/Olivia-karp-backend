export interface ILesson {
  title: string;
  videoUrl: string;
  duration?: string;
  level?: string;
  isLocked?: boolean;
}

export interface IImage {
  url: string;
  public_id: string;
}

export interface ICourse {
  title: string;
  category: string;
  difficulty: string;
  instructorName: string;
  instructorBio: string;
  instructorImage: IImage;
  description?: string;
  durationHours: number;
  estimatedWeeks: number;
  lessons: ILesson[];
  image: IImage;
  isLocked?: boolean;
  isAvailable?: boolean;
  price?: number;
  currency?: string;
  totalEnrolled?: number;
  createdAt?: string;
  updatedAt?: string;
}
