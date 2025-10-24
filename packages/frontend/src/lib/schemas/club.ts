import { z } from 'zod';

export const createClubSchema = z.object({
  name: z.string().min(2, 'Club name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z
    .string()
    .min(5, 'Short description must be at least 5 characters'),
  website: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  socialLinks: z.object({
    twitter: z
      .string()
      .url('Please enter a valid Twitter URL')
      .optional()
      .or(z.literal('')),
    instagram: z
      .string()
      .url('Please enter a valid Instagram URL')
      .optional()
      .or(z.literal('')),
    linkedin: z
      .string()
      .url('Please enter a valid LinkedIn URL')
      .optional()
      .or(z.literal('')),
    facebook: z
      .string()
      .url('Please enter a valid Facebook URL')
      .optional()
      .or(z.literal('')),
  }),
  category: z.string().min(1, 'Please select a category'),
  contactEmail: z.string().email('Please enter a valid email address'),
  membershipRequirements: z
    .string()
    .min(10, 'Membership requirements must be at least 10 characters'),
  tags: z.array(z.string()).min(1, 'Please add at least one tag'),
  isPublic: z.boolean(),
  acceptsMembers: z.boolean(),
});

export type CreateClubFormData = z.infer<typeof createClubSchema>;
