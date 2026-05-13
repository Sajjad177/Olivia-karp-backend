import { Schema, model } from 'mongoose';
import { IMedia } from './media.interface';

const mediaSchema = new Schema<IMedia>(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        mediaType: {
            type: String,
            enum: ['url', 'audio', 'files'],
            required: true
        },
        category: {
            type: String,
            enum: [
                'video',
                'interest-being-speaker',
                'event-recording',
                'expert-interview',
                'insight',
                'community'
            ],
            required: true
        },
        contentUrl: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        thumbnailImage: {
            type: String,
            required: true
        },
        isPublished: {
            type: Boolean,
            default: false
        },
        isFeatured: {
            type: Boolean,
            default: false
        },
    },
    {
        timestamps: true
    }
);

/**
 * ELITE PERFORMANCE INDEXING:
 * 1. Compound index for filtering by type and status (Main Media Page).
 * 2. Compound index for fetching featured content (Home Page).
 * 3. Text index for search functionality.
 */
mediaSchema.index({ category: 1, isPublished: 1 });
mediaSchema.index({ mediaType: 1, isPublished: 1 });
mediaSchema.index({ isFeatured: 1, isPublished: 1 });
mediaSchema.index({ title: 'text' });

export const Media = model<IMedia>('Media', mediaSchema);