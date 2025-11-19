/**
 * Email Service
 * Handles all email sending via Resend API
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_JjUFV1GW_27DNiX8wA3rtDBBiPLMS2YSp';
const EMAIL_FROM = process.env.EMAIL_FROM || 'hello@prompt-brush.com';

const resend = new Resend(RESEND_API_KEY);

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Sanitize prompt for use in filenames
 */
function sanitizePrompt(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) || 'artwork';
}

/**
 * Email 1: Send confirmation email to artist when artwork is submitted
 * Includes PNG attachment of their artwork
 */
export async function sendArtworkSubmissionEmail(
  artistEmail: string,
  artistName: string,
  prompt: string,
  imageData: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!validateEmail(artistEmail)) {
      return { success: false, error: 'Invalid email address' };
    }

    const sanitizedPrompt = sanitizePrompt(prompt);
    const timestamp = new Date().toISOString();

    const emailHtml = `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <div style="margin-bottom: 32px;">
    <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; line-height: 1.3;">Thank You for Your Submission</h1>
  </div>

  <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin: 0 0 16px 0;">Hi <strong style="color: #1a1a1a;">${artistName.trim()}</strong>,</p>

  <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin: 0 0 24px 0;">Thank you for submitting your artwork to <strong>Prompt-Brush 1.0</strong>. We've received your submission and it's now pending review.</p>

  <div style="background: #f8f8f8; padding: 20px; border-radius: 6px; margin: 24px 0; border-left: 3px solid #1a1a1a;">
    <p style="margin: 0 0 8px 0; color: #1a1a1a; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Drawing Prompt</p>
    <p style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.6; font-style: italic;">"${prompt.trim()}"</p>
  </div>

  <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin: 24px 0;">We've attached your artwork to this email for your records. You'll receive a notification once your artwork has been approved and published to the gallery.</p>

  <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
    <p style="color: #999; font-size: 14px; margin: 0; line-height: 1.5;">Best regards,<br><strong style="color: #666;">The Prompt-Brush Team</strong></p>
  </div>
</div>`;

    // Extract base64 data (remove "data:image/png;base64," prefix)
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: artistEmail.trim(),
      subject: `Artwork Submitted: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
      html: emailHtml,
      attachments: [
        {
          filename: `${sanitizedPrompt}-${timestamp}.png`,
          content: base64Data,
        },
      ],
    });

    if (error) {
      console.error('[Email Service] Artwork submission email error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email Service] Artwork submission email sent:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email Service] Artwork submission email exception:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Email 2: Notify prompt submitter that someone drew their prompt
 * No attachment
 */
export async function sendPromptUsedEmail(
  promptSubmitterEmail: string,
  prompt: string,
  artistName: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!validateEmail(promptSubmitterEmail)) {
      return { success: false, error: 'Invalid email address' };
    }

    const emailHtml = `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <div style="margin-bottom: 32px;">
    <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; line-height: 1.3;">Your Prompt Has Been Used</h1>
  </div>

  <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin: 0 0 24px 0;">An artist has created artwork based on your prompt. The submission is currently pending review.</p>

  <div style="background: #f8f8f8; padding: 20px; border-radius: 6px; margin: 24px 0; border-left: 3px solid #1a1a1a;">
    <p style="margin: 0 0 8px 0; color: #1a1a1a; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Your Prompt</p>
    <p style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.6; font-style: italic;">"${prompt.trim()}"</p>
  </div>

  <div style="background: #f8f8f8; padding: 20px; border-radius: 6px; margin: 24px 0;">
    <p style="margin: 0 0 8px 0; color: #1a1a1a; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Artist</p>
    <p style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">${artistName.trim()}</p>
  </div>

  <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin: 24px 0;">Once the artwork is approved, it will be published to the gallery and you'll receive another notification.</p>

  <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
    <p style="color: #999; font-size: 14px; margin: 0; line-height: 1.5;">Best regards,<br><strong style="color: #666;">The Prompt-Brush Team</strong></p>
  </div>
</div>`;

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: promptSubmitterEmail.trim(),
      subject: `Someone Drew Your Prompt: "${prompt.substring(0, 40)}${prompt.length > 40 ? '...' : ''}"`,
      html: emailHtml,
    });

    if (error) {
      console.error('[Email Service] Prompt used email error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email Service] Prompt used email sent:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email Service] Prompt used email exception:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Email 3: Notify artist that their artwork has been approved
 * No attachment (they already have it from submission)
 */
export async function sendArtworkApprovedEmail(
  artistEmail: string,
  artistName: string,
  prompt: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!validateEmail(artistEmail)) {
      return { success: false, error: 'Invalid email address' };
    }

    const emailHtml = `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <div style="margin-bottom: 32px;">
    <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; line-height: 1.3;">Your Artwork is Now Live</h1>
  </div>

  <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin: 0 0 16px 0;">Hi <strong style="color: #1a1a1a;">${artistName.trim()}</strong>,</p>

  <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin: 0 0 24px 0;">Your artwork has been approved and is now published in the gallery. Thank you for contributing to <strong>Prompt-Brush 1.0</strong>.</p>

  <div style="background: #f8f8f8; padding: 20px; border-radius: 6px; margin: 24px 0; border-left: 3px solid #1a1a1a;">
    <p style="margin: 0 0 8px 0; color: #1a1a1a; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Drawing Prompt</p>
    <p style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.6; font-style: italic;">"${prompt.trim()}"</p>
  </div>

  <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
    <p style="color: #999; font-size: 14px; margin: 0; line-height: 1.5;">Best regards,<br><strong style="color: #666;">The Prompt-Brush Team</strong></p>
  </div>
</div>`;

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: artistEmail.trim(),
      subject: `Your Artwork: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
      html: emailHtml,
    });

    if (error) {
      console.error('[Email Service] Artwork approved email error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email Service] Artwork approved email sent:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email Service] Artwork approved email exception:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Email 4: Send confirmation email to user when they submit a prompt
 * No attachment
 */
export async function sendPromptSubmissionEmail(
  email: string,
  prompt: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' };
    }

    const emailHtml = `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <div style="margin-bottom: 32px;">
    <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; line-height: 1.3;">Thank You for Your Prompt</h1>
  </div>

  <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin: 0 0 24px 0;">Thank you for submitting your prompt to <strong>Prompt-Brush 1.0</strong>. Your prompt has been successfully added to the system.</p>

  <div style="background: #f8f8f8; padding: 20px; border-radius: 6px; margin: 24px 0; border-left: 3px solid #1a1a1a;">
    <p style="margin: 0 0 8px 0; color: #1a1a1a; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Your Prompt</p>
    <p style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.6; font-style: italic;">"${prompt.trim()}"</p>
  </div>

  <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin: 24px 0;">When an artist creates artwork based on your prompt, you'll receive an email notification.</p>

  <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
    <p style="color: #999; font-size: 14px; margin: 0; line-height: 1.5;">Best regards,<br><strong style="color: #666;">The Prompt-Brush Team</strong></p>
  </div>
</div>`;

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email.trim(),
      subject: `Prompt Submitted: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
      html: emailHtml,
    });

    if (error) {
      console.error('[Email Service] Prompt submission email error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email Service] Prompt submission email sent:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email Service] Prompt submission email exception:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Email 5: Notify prompt submitter that their prompt's artwork has been approved
 * No attachment
 */
export async function sendPromptArtworkApprovedEmail(
  promptSubmitterEmail: string,
  prompt: string,
  artistName: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!validateEmail(promptSubmitterEmail)) {
      return { success: false, error: 'Invalid email address' };
    }

    const emailHtml = `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <div style="margin-bottom: 32px;">
    <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; line-height: 1.3;">Your Prompt is Now Live in the Gallery</h1>
  </div>

  <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin: 0 0 24px 0;">An artwork based on your prompt has been approved and is now published in the gallery.</p>

  <div style="background: #f8f8f8; padding: 20px; border-radius: 6px; margin: 24px 0; border-left: 3px solid #1a1a1a;">
    <p style="margin: 0 0 8px 0; color: #1a1a1a; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Your Prompt</p>
    <p style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.6; font-style: italic;">"${prompt.trim()}"</p>
  </div>

  <div style="background: #f8f8f8; padding: 20px; border-radius: 6px; margin: 24px 0;">
    <p style="margin: 0 0 8px 0; color: #1a1a1a; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Artist</p>
    <p style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">${artistName.trim()}</p>
  </div>

  <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin: 24px 0;">Thank you for contributing to <strong>Prompt-Brush 1.0</strong>.</p>

  <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
    <p style="color: #999; font-size: 14px; margin: 0; line-height: 1.5;">Best regards,<br><strong style="color: #666;">The Prompt-Brush Team</strong></p>
  </div>
</div>`;

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: promptSubmitterEmail.trim(),
      subject: `Your Prompt is Live: "${prompt.substring(0, 40)}${prompt.length > 40 ? '...' : ''}"`,
      html: emailHtml,
    });

    if (error) {
      console.error('[Email Service] Prompt artwork approved email error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email Service] Prompt artwork approved email sent:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email Service] Prompt artwork approved email exception:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfig(): Promise<{ success: boolean; error?: string }> {
  try {
    // Just validate that Resend API key is set
    if (!RESEND_API_KEY || RESEND_API_KEY === 'your-resend-api-key-here') {
      return { success: false, error: 'RESEND_API_KEY not configured' };
    }

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}
