import { Document } from 'mongoose';

/**
 * TMediaType: The only "Type" field needed.
 * This matches your UI dropdown and covers all sections in the Sitemap.
 */
export type TMediaType = 'url' | 'audio' | 'files';

export type TCategory =
    | 'video'
    | 'interest-a-being-speaker'
    | 'event-recording'
    | 'expert-interview'
    | 'insight'
    | 'community';

export interface IMedia extends Document {
    title: string;
    mediaType: TMediaType;
    category: TCategory;
    contentUrl: string;         // The link or file path
    description: string;
    thumbnailImage: string;
    isPublished: boolean;
    isFeatured: boolean;        // Matches the "Featured Listing" requirement
    createdAt: Date;
    updatedAt: Date;
}

// https://www.youtube.com/watch?v=fZfVM8EWKGU