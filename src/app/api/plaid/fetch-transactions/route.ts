import { NextRequest, NextResponse } from "next/server";
import { client } from "../../../../utils/plaidClient";
import prisma from "../../../../utils/prismaClient";
import { pinecone } from "@/utils/pineconeClient";
import { openAI } from "@/utils/openAIClient";

export async function POST(request: NextRequest) {
  try {
    const sessionResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate`,
      { headers: request.headers, credentials: "include" }
    );
    const data = await sessionResponse.json();
    const userId = data.session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const plaidItem = await prisma.plaidItem.findFirst({ where: { userId } });
    if (!plaidItem) {
      return NextResponse.json({ error: "PlaidItem not found for user" }, { status: 404 });
    }

    const access_token = plaidItem.accessToken;
    if (!access_token) {
      return NextResponse.json({ error: "Missing access_token" }, { status: 400 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 730);
    const endDate = new Date();

    const response = await client.transactionsGet({
      access_token,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      options: { count: 100 },
    });

    const transactions = response.data?.transactions;
    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: "No transactions found in Plaid" }, { status: 404 });
    }

    const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME!);

    const upsertOperations = transactions.map((transaction) => ({
      where: { transactionId: transaction.transaction_id },
      update: {
        accountId: transaction.account_id,
        userId,
        amount: transaction.amount,
        date: new Date(transaction.date),
        authorizedDate: transaction.authorized_date ? new Date(transaction.authorized_date) : null,
        category: transaction.category?.[0] ?? null,
        subCategory: transaction.category?.[1] ?? null,
        categoryId: transaction.category_id ?? null,
        merchantName: transaction.merchant_name ?? null,
        merchantLogoUrl: transaction.logo_url ?? null,
        paymentChannel: transaction.payment_channel ?? null,
        pending: transaction.pending || false,
        currencyCode: transaction.iso_currency_code ?? null,
        transactionType: transaction.transaction_type ?? null,
        website: transaction.website ?? null,
        updatedAt: new Date(),
        plaidItemId: plaidItem.id,
        personalFinanceCategory: transaction.personal_finance_category?.toString() ?? null,
        personalFinanceCategoryIconUrl: transaction.personal_finance_category_icon_url ?? null,
      },
      create: {
        transactionId: transaction.transaction_id,
        accountId: transaction.account_id,
        userId,
        amount: transaction.amount,
        date: new Date(transaction.date),
        authorizedDate: transaction.authorized_date ? new Date(transaction.authorized_date) : null,
        category: transaction.category?.[0] ?? null,
        subCategory: transaction.category?.[1] ?? null,
        categoryId: transaction.category_id ?? null,
        merchantName: transaction.merchant_name ?? null,
        merchantLogoUrl: transaction.logo_url ?? null,
        paymentChannel: transaction.payment_channel ?? null,
        pending: transaction.pending || false,
        currencyCode: transaction.iso_currency_code ?? null,
        transactionType: transaction.transaction_type ?? null,
        website: transaction.website ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        plaidItemId: plaidItem.id,
        personalFinanceCategory: transaction.personal_finance_category?.toString() ?? null,
        personalFinanceCategoryIconUrl: transaction.personal_finance_category_icon_url ?? null,
      },
    }));

    await prisma.$transaction(upsertOperations.map((op) => prisma.transaction.upsert(op)));

    const transactionDescriptions = transactions.map(
      (transaction) => `
        Transaction ID: ${transaction.transaction_id}
        User ID: ${userId}
        Account ID: ${transaction.account_id}
        Plaid Item ID: ${plaidItem.itemId}
        Amount: ${transaction.amount} ${transaction.iso_currency_code || "N/A"}
        Date: ${new Date(transaction.date).toLocaleString()}
        Authorized Date: ${transaction.authorized_date ? new Date(transaction.authorized_date).toLocaleString() : "N/A"}
        Category: ${transaction.category?.[0] || "Uncategorized"}
        Subcategory: ${transaction.category?.[1] || "N/A"}
        Personal Finance Category ID: ${transaction.category_id || "N/A"}
        Merchant Name: ${transaction.merchant_name || "Unknown Merchant"}
        Payment Channel: ${transaction.payment_channel || "N/A"}
        Pending: ${transaction.pending ? "Yes" : "No"}
        Transaction Type: ${transaction.transaction_type || "N/A"}
        Website: ${transaction.website || "N/A"}
      `.trim()
    );

    const embeddingResponses = await Promise.all(
      transactionDescriptions.map((desc) =>
        openAI.embeddings.create({ model: "text-embedding-3-small", input: desc })
      )
    );

    const pineconeUpserts = transactions.map((transaction, index) => ({
      id: transaction.transaction_id,
      values: embeddingResponses[index]?.data[0]?.embedding ?? [],
      metadata: {
        transactionId: transaction.transaction_id,
        accountId: transaction.account_id,
        userId,
        amount: transaction.amount,
        date: new Date(transaction.date).toISOString(),
        authorizedDate: transaction.authorized_date
          ? new Date(transaction.authorized_date).toISOString()
          : "N/A",
        category: transaction.category?.[0] || "N/A",
        subCategory: transaction.category?.[1] || "N/A",
        categoryId: transaction.category_id || "N/A",
        merchantName: transaction.merchant_name || "N/A",
        merchantLogoUrl: transaction.logo_url || "N/A",
        paymentChannel: transaction.payment_channel || "N/A",
        pending: transaction.pending || false,
        currencyCode: transaction.iso_currency_code || "N/A",
        transactionType: transaction.transaction_type || "N/A",
        website: transaction.website || "N/A",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        plaidItemId: plaidItem.id,
        personalFinanceCategory: transaction.personal_finance_category?.toString() || "N/A",
        personalFinanceCategoryIconUrl: transaction.personal_finance_category_icon_url?.toString() || "N/A",
      },
    }));

    await pineconeIndex.namespace("transactions").upsert(pineconeUpserts);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing Plaid transactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
