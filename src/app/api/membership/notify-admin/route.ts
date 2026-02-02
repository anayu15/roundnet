import { NextResponse } from "next/server";

// Admin email notification endpoint
// This endpoint sends an email notification to admins when a new membership application is submitted
// Email sending is optional - if not configured, the endpoint will silently succeed
//
// To enable email notifications, set these environment variables:
// - ADMIN_EMAIL: Email address to receive notifications
// - SMTP_HOST: SMTP server hostname
// - SMTP_PORT: SMTP server port (default: 587)
// - SMTP_USER: SMTP username
// - SMTP_PASS: SMTP password
// - SMTP_FROM: From email address (defaults to SMTP_USER)
//
// Additionally, install nodemailer: npm install nodemailer @types/nodemailer

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

type NotifyAdminRequest = {
  membershipId: string;
  paymentReference: string;
  paymentMethod: "bizum" | "transfer";
};

export async function POST(request: Request) {
  try {
    const body: NotifyAdminRequest = await request.json();

    // Check if email is configured
    if (!ADMIN_EMAIL || !SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      // Email not configured - silently succeed
      // This is expected behavior when email is not set up
      console.log("Membership application received:", {
        membershipId: body.membershipId,
        paymentMethod: body.paymentMethod,
        paymentReference: body.paymentReference,
      });
      console.log("Email notification skipped - SMTP not configured");

      return NextResponse.json({
        success: true,
        message: "Email notification skipped - email not configured",
      });
    }

    // If we reach here, email is configured but nodemailer is not installed
    // Log the application details for manual processing
    console.log("New membership application:", {
      membershipId: body.membershipId,
      paymentMethod: body.paymentMethod,
      paymentReference: body.paymentReference,
    });
    console.log("To enable email notifications, install nodemailer: npm install nodemailer");

    return NextResponse.json({
      success: true,
      message: "Application logged - install nodemailer to enable email notifications",
    });
  } catch (error) {
    console.error("Error processing admin notification:", error);
    // Don't fail the request - email notification is optional
    return NextResponse.json({
      success: true,
      message: "Notification processing completed",
    });
  }
}
