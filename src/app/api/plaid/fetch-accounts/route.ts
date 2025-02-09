import { NextRequest, NextResponse } from 'next/server';
import { client } from '../../../../utils/plaidClient';
import prisma from '../../../../utils/prismaClient';

export async function POST(request: NextRequest) {
  try {
    const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate`, {
        headers: request.headers,
        credentials: 'include',
    });

    const data = await sessionResponse.json();
    const userId = data.session.user.id;

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const plaidItem = await prisma.plaidItem.findFirst({
        where: { userId },
    });
  
    if (!plaidItem) {
    return NextResponse.json({ error: 'PlaidItem not found for user' }, { status: 404 });
    }

    const access_token = plaidItem.accessToken;

    if (!access_token) {
      return NextResponse.json({ error: 'Missing access_token' }, { status: 400 });
    }

    const response = await client.accountsGet({ access_token });

    if (!response.data || !response.data.accounts) {
      return NextResponse.json({ error: 'Invalid response from Plaid' }, { status: 500 });
    }

    for (const account of response.data.accounts) {
      await prisma.account.upsert({
        where: { accountId: account.account_id },
        update: {
          availableBalance: account.balances.available || 0,
          currentBalance: account.balances.current || 0,
          isoCurrencyCode: account.balances.iso_currency_code || null,
          mask: account.mask || null,
          name: account.name || "Unnamed Account",
          officialName: account.official_name || null,
          persistentAccId: account.persistent_account_id || "",
          subtype: account.subtype || "",
          type: account.type || "",
          userId: userId,
          plaidItemId: plaidItem.id,
          updatedAt: new Date(),
        },
        create: {
          accountId: account.account_id,
          availableBalance: account.balances.available || 0,
          currentBalance: account.balances.current || 0,
          isoCurrencyCode: account.balances.iso_currency_code || null,
          mask: account.mask || null,
          name: account.name || "Unnamed Account",
          officialName: account.official_name || null,
          persistentAccId: account.persistent_account_id || "",
          subtype: account.subtype || "",
          type: account.type || "",
          userId: userId,
          plaidItemId: plaidItem.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing Plaid accounts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}