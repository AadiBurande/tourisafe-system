import { z } from 'zod';

export const RegistrationSchema = z.object({
  fullName: z.string().min(3, { message: 'Full name must be at least 3 characters.' }),
  governmentId: z.string().min(5, { message: 'Government ID must be at least 5 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phoneNumber: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }),
  destination: z.string().min(2, { message: 'Destination is required.' }),
  travelStartDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'A valid start date is required.' }),
  travelEndDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'A valid end date is required.' }),
  emergencyContactName: z.string().min(3, { message: 'Emergency contact name is required.' }),
  emergencyContactPhone: z.string().min(10, { message: 'Emergency contact phone is required.' }),
  consent: z.boolean().refine((val) => val === true, { message: 'You must agree to the terms to proceed.' }),
});

export type RegistrationFormValues = z.infer<typeof RegistrationSchema>;
