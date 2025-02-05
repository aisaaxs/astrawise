import { NextResponse } from 'next/server';
import prisma from '../../../../utils/prismaClient';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('sessionToken')?.value;

  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const session = await prisma.session.findUnique({
    where: { token },
  });

  if (!session) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({ valid: true }, { status: 200 });
}