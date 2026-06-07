import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
  personEmail: string,
  otp: string,
): Promise<void> {
  const { error } = await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: [personEmail],
    subject: 'Verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>Email Verification</h2>

        <p>Your verification code is:</p>

        <div
          style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 6px;
            margin: 20px 0;
          "
        >
          ${otp}
        </div>

        <p>
          This code will expire in <strong>5 minutes</strong>.
        </p>

        <p>
          If you did not request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send verification email');
  }
}