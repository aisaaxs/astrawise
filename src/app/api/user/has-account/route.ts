import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../utils/prismaClient";

export async function GET(request: NextRequest) {
  try {
    const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate`, {
      headers: request.headers,
      credentials: "include",
    });

    if (!sessionResponse.ok) {
      return NextResponse.json({ error: "Failed to validate session" }, { status: 401 });
    }

    const data = await sessionResponse.json();
    const userId = data.session?.user?.id;

    if (!userId) {
      return NextResponse.json({ hasAccount: false }, { status: 200 });
    }

    const account = await prisma.account.findFirst({
      where: { userId },
    });

    return NextResponse.json({ hasAccount: !!account }, { status: 200 });
  } catch (error) {
    console.error("Error checking user account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
