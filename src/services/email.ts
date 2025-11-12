/**
 * Email Service
 * Calls the email API server to send notifications
 */

// Get email API URL from environment variable
// Default to localhost for development
const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3001';

/**
 * Send prompt submission confirmation email
 */
export async function sendPromptSubmissionEmail(
  email: string,
  prompt: string
): Promise<void> {
  try {
    await fetch(`${EMAIL_API_URL}/api/emails/prompt-submission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, prompt }),
    });
    // Don't throw on email failure - it's not critical
  } catch (error) {
    console.error('[Email Service] Failed to send prompt submission email:', error);
  }
}

/**
 * Send artwork submission confirmation email
 */
export async function sendArtworkSubmissionEmail(
  artistEmail: string,
  artistName: string,
  prompt: string,
  imageData: string
): Promise<void> {
  try {
    await fetch(`${EMAIL_API_URL}/api/emails/artwork-submission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ artistEmail, artistName, prompt, imageData }),
    });
    // Don't throw on email failure - it's not critical
  } catch (error) {
    console.error('[Email Service] Failed to send artwork submission email:', error);
  }
}

/**
 * Send artwork approval emails (to both artist and prompt submitter)
 */
export async function sendArtworkApprovalEmails(
  artistEmail: string | undefined,
  artistName: string | undefined,
  promptSubmitterEmail: string | undefined,
  prompt: string
): Promise<void> {
  try {
    await fetch(`${EMAIL_API_URL}/api/emails/artwork-approved`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        artistEmail,
        artistName,
        promptSubmitterEmail,
        prompt,
      }),
    });
    // Don't throw on email failure - it's not critical
  } catch (error) {
    console.error('[Email Service] Failed to send artwork approval emails:', error);
  }
}
