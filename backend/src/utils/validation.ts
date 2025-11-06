import Joi from 'joi';

export const uploadSchema = Joi.object({
  encryptedData: Joi.string().required().description('Base64 encoded encrypted file'),
  encryptedFileKey: Joi.string().required().description('Base64 encoded encrypted file key'),
  salt: Joi.string().required().description('Base64 encoded salt'),
  passwordHash: Joi.string().optional().description('SHA256 password hash'),
  fileName: Joi.string().max(255).required(),
  fileSize: Joi.number().positive().required(),
  mimeType: Joi.string().required(),
  expirationHours: Joi.number().positive().max(720).required(), // max 30 days
  maxDownloads: Joi.number().positive().optional(),
});

export const downloadInfoSchema = Joi.object({
  shareLink: Joi.string().required(),
});

export const downloadRequestSchema = Joi.object({
  password: Joi.string().optional(),
  shareLink: Joi.string().required(),
});

export function validate(schema: Joi.Schema, data: any) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return { valid: false, errors: details, value: null };
  }

  return { valid: true, errors: null, value };
}
