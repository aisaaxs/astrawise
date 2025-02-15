import { NextRequest, NextResponse } from "next/server";
import { client } from "../../../../utils/plaidClient";
import prisma from "../../../../utils/prismaClient";
import { pinecone } from "../../../../utils/pineconeClient";
import { openAI } from "../../../../utils/openAIClient";

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

    const response = await client.accountsGet({ access_token });
    const accounts = response.data?.accounts;
    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ error: "No accounts found in Plaid" }, { status: 404 });
    }

    const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME!);

    const upsertOperations = accounts.map((account) => ({
      where: { accountId: account.account_id },
      update: {
        availableBalance: account.balances.available ?? 0,
        currentBalance: account.balances.current ?? 0,
        isoCurrencyCode: account.balances.iso_currency_code ?? null,
        mask: account.mask ?? null,
        name: account.name || "Unnamed Account",
        officialName: account.official_name ?? null,
        persistentAccId: account.persistent_account_id ?? "",
        subtype: account.subtype ?? "",
        type: account.type ?? "",
        userId,
        plaidItemId: plaidItem.id,
        updatedAt: new Date(),
      },
      create: {
        accountId: account.account_id,
        availableBalance: account.balances.available ?? 0,
        currentBalance: account.balances.current ?? 0,
        isoCurrencyCode: account.balances.iso_currency_code ?? null,
        mask: account.mask ?? null,
        name: account.name || "Unnamed Account",
        officialName: account.official_name ?? null,
        persistentAccId: account.persistent_account_id ?? "",
        subtype: account.subtype ?? "",
        type: account.type ?? "",
        userId,
        plaidItemId: plaidItem.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }));

    await prisma.$transaction(
      upsertOperations.map((operation) =>
        prisma.account.upsert(operation)
      )
    );

    const accountDescriptions = accounts.map(
      (account) => `
        Account Name: ${account.name}
        Official Name: ${account.official_name ?? "N/A"}
        Type: ${account.type}
        Subtype: ${account.subtype}
        Current Balance: ${account.balances.current} ${account.balances.iso_currency_code ?? "N/A"}
        Available Balance: ${account.balances.available ?? "N/A"}
        Mask: ${account.mask ?? "N/A"}
        Persistent ID: ${account.persistent_account_id}
        User ID: ${userId}
        Account ID: ${account.account_id}
      `.trim()
    );

    const embeddingResponses = await Promise.all(
      accountDescriptions.map((desc) =>
        openAI.embeddings.create({ model: "text-embedding-3-small", input: desc })
      )
    );

    const pineconeUpserts = accounts.map((account, index) => ({
      id: account.account_id,
      values: embeddingResponses[index]?.data[0]?.embedding ?? [],
      metadata: {
        accountId: account.account_id,
        name: account.name,
        officialName: account.official_name ?? "N/A",
        type: account.type,
        subtype: account.subtype ?? "N/A",
        currentBalance: account.balances.current ?? 0,
        availableBalance: account.balances.available ?? 0,
        isoCurrencyCode: account.balances.iso_currency_code ?? "N/A",
        mask: account.mask ?? "N/A",
        persistentAccId: account.persistent_account_id ?? "N/A",
        userId,
        plaidItemId: plaidItem.itemId,
      },
    }));

    await pineconeIndex.namespace("accounts").upsert(pineconeUpserts);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing Plaid accounts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}