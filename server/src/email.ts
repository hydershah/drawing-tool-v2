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

    const emailHtml = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Thank You for Your Submission!</h2>
  <p style="color: #666; line-height: 1.6;">Hi <strong>${artistName.trim()}</strong>,</p>
  <p>Thank you for submitting your artwork to <strong>Prompt-Brush 1.0</strong>!</p>
  <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; color: #333;"><strong>Drawing Prompt:</strong></p>
    <p style="margin: 8px 0 0 0; color: #666; font-style: italic;">"${prompt.trim()}"</p>
  </div>
  <p>We've attached your artwork for your records. You'll receive another email once it's approved!</p>
  <p style="color: #999; font-size: 12px; margin-top: 40px;">- The Prompt-Brush Team</p>
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

    const emailHtml = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Your Prompt Has Been Used! 🎨</h2>
  <p style="color: #666; line-height: 1.6;">Great news! An artist has created artwork based on your prompt.</p>
  <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; color: #333;"><strong>Your Prompt:</strong></p>
    <p style="margin: 8px 0 0 0; color: #666; font-style: italic;">"${prompt.trim()}"</p>
  </div>
  <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; color: #333;"><strong>Artist:</strong></p>
    <p style="margin: 8px 0 0 0; color: #666;">${artistName.trim()}</p>
  </div>
  <p>The artwork is currently pending review. Once approved, it will appear in the gallery!</p>
  <p style="color: #999; font-size: 12px; margin-top: 40px;">- The Prompt-Brush Team</p>
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

    const emailHtml = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Your Artwork is Now Live! 🎉</h2>
  <p style="color: #666; line-height: 1.6;">Hi <strong>${artistName.trim()}</strong>,</p>
  <p>Congratulations! Your artwork has been approved and is now live in the gallery.</p>
  <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; color: #333;"><strong>Drawing Prompt:</strong></p>
    <p style="margin: 8px 0 0 0; color: #666; font-style: italic;">"${prompt.trim()}"</p>
  </div>
  <p>Thank you for contributing to <strong>Prompt-Brush 1.0</strong>!</p>
  <p style="color: #999; font-size: 12px; margin-top: 40px;">- The Prompt-Brush Team</p>
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
