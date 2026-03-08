import { z } from "zod";

export const leadFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  address: z.string().trim().min(5, "Please enter a valid address").max(200),
  zip_code: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code"),
  phone: z.string().trim().regex(/^[\d\s\-\(\)\+]{7,20}$/, "Please enter a valid phone number"),
  email: z.string().trim().email("Please enter a valid email").max(255),
  roof_age: z.string().min(1, "Please select your roof age"),
  concerns: z.string().trim().max(1000).optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const companyFormSchema = z.object({
  name: z.string().trim().min(2, "Company name is required").max(200),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  service_area: z.string().trim().max(500).optional(),
  website: z.string().trim().url("Invalid URL").max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional(),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;

export const ROOF_AGE_OPTIONS = [
  { value: "0-5", label: "0–5 years" },
  { value: "5-10", label: "5–10 years" },
  { value: "10-15", label: "10–15 years" },
  { value: "15-20", label: "15–20 years" },
  { value: "20+", label: "20+ years" },
  { value: "unknown", label: "I'm not sure" },
];
