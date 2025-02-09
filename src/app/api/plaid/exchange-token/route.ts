import { NextResponse } from 'next/server';
import { client } from '../../../../utils/plaidClient';
import prisma from '../../../../utils/prismaClient';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { public_token } = await request.json();

  try {
    const response = await client.itemPublicTokenExchange({ public_token });

    const { access_token, item_id } = response.data;

    const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate`, {
        headers: request.headers,
        credentials: 'include',
    });

    const data = await sessionResponse.json();
    const userId = data.session.user.id;

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    await prisma.plaidItem.upsert({
        where: { itemId: item_id },
        update: { accessToken: access_token, updatedAt: new Date() },
        create: {
            itemId: item_id,
            accessToken: access_token,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error exchanging public token or storing data:', error);
    return NextResponse.json({ error: 'Error exchanging public token or storing data' }, { status: 500 });
  }
}