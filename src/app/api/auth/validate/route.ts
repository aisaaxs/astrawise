import { NextResponse } from 'next/server';
import prisma from '../../../../utils/prismaClient';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('sessionToken')?.value;

  if (!token) {
    return NextResponse.json({ valid: false, session: null }, { status: 401 });
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) {
    return NextResponse.json({ valid: false, session: null }, { status: 401 });
  }

  return NextResponse.json({
    valid: true,
    session: {
      id: session.id,
      token: session.token,
      user: {
        id: session.user.id,
        email: session.user.email,
        fullname: session.user.fullname,
        createdAt: session.user.createdAt,
        updatedAt: session.user.updatedAt,
      },
    },
  }, { status: 200 });
}