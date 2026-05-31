import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

/*
  POST /api/auth/register
  Creates a new user account with email + password.
  Google OAuth users are handled automatically by Auth.js.

  Body: { fullName, email, phoneNumber, password }
*/
export async function POST(req: NextRequest) {
  // 5 registrations per IP per minute
  const limited = rateLimit(req, { limit: 5, windowSeconds: 60 });
  if (limited) return limited;

  const body = await req.json();
  const { fullName, email, phoneNumber, password, roles } = body;

  // 1. Make sure all fields are present
  if (!fullName || !email || !phoneNumber || !password) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 }
    );
  }

  // Validate roles if provided
  const validRoles = ["TENANT", "LANDLORD", "ARTISAN"];
  const userRoles: string[] = Array.isArray(roles) && roles.every((r: string) => validRoles.includes(r))
    ? roles
    : ["TENANT"];

  // 2. Password strength check
  // Must be at least 8 chars, with one uppercase, one lowercase, one number, one special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return NextResponse.json(
      {
        error:
          "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.",
      },
      { status: 400 }
    );
  }

  // 3. Check if email or phone is already taken
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phoneNumber }],
    },
  });

  if (existing?.email === email) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  if (existing?.phoneNumber === phoneNumber) {
    return NextResponse.json(
      { error: "An account with this phone number already exists." },
      { status: 409 }
    );
  }

  // 4. Hash the password — never store plain text
  const passwordHash = await bcrypt.hash(password, 12);

  // 5. Create the user
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      phoneNumber,
      passwordHash,
      roles: userRoles as any,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      roles: true,
      createdAt: true,
    },
  });

  // 6. Generate an email verification token (expires in 24 hours)
  const verificationToken = crypto.randomBytes(32).toString("hex");

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: verificationToken,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
    },
  });

  // 7. Send the verification email
  // TODO: swap the console.log below with your email provider (Resend, Nodemailer, etc.)
  // Example with Resend:
  //   await resend.emails.send({
  //     from: "Hausevo <no-reply@hausevo.com.ng>",
  //     to: email,
  //     subject: "Verify your Hausevo account",
  //     html: `<p>Hi ${fullName}, click the link below to verify your account:</p>
  //            <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}">
  //              Verify my account
  //            </a>`
  //   });
  console.log(
    `[DEV] Verify account → ${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}`
  );

  return NextResponse.json(
    {
      message: "Account created. Please check your email to verify your account.",
      user,
    },
    { status: 201 }
  );
}
