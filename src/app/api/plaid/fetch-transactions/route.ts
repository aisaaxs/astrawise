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

    // Since Plaid only allows 730 days of transactions, we'll fetch the last 2 years
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 730);
    const endDate = new Date();

    const response = await client.transactionsGet({ 
        access_token,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        options: { count: 100 },
    });

    if (!response.data || !response.data.transactions) {
      return NextResponse.json({ error: 'Invalid response from Plaid' }, { status: 500 });
    }

    for (const transaction of response.data.transactions) {
      await prisma.transaction.upsert({
        where: {
            transactionId: transaction.transaction_id,
          },
          update: {
            accountId: transaction.account_id,
            userId: userId,
            amount: transaction.amount,
            date: new Date(transaction.date),
            authorizedDate: transaction.authorized_date
              ? new Date(transaction.authorized_date)
              : null,
            category: transaction.category?.[0] || null,
            subCategory: transaction.category?.[1] || null,
            categoryId: transaction.category_id || null,
            merchantName: transaction.merchant_name || null,
            merchantLogoUrl: transaction.logo_url || null,
            paymentChannel: transaction.payment_channel || null,
            pending: transaction.pending || false,
            currencyCode: transaction.iso_currency_code || null,
            transactionType: transaction.transaction_type || null,
            website: transaction.website || null,
            updatedAt: new Date(),
            plaidItemId: plaidItem.id,
          },
          create: {
            transactionId: transaction.transaction_id,
            accountId: transaction.account_id,
            userId: userId,
            amount: transaction.amount,
            date: new Date(transaction.date),
            authorizedDate: transaction.authorized_date
              ? new Date(transaction.authorized_date)
              : null,
            category: transaction.category?.[0] || null,
            subCategory: transaction.category?.[1] || null,
            categoryId: transaction.category_id || null,
            merchantName: transaction.merchant_name || null,
            merchantLogoUrl: transaction.logo_url || null,
            paymentChannel: transaction.payment_channel || null,
            pending: transaction.pending || false,
            currencyCode: transaction.iso_currency_code || null,
            transactionType: transaction.transaction_type || null,
            website: transaction.website || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            plaidItemId: plaidItem.id,
          },
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing Plaid transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}