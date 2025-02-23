import { NextRequest, NextResponse } from "next/server";
import { openAI } from "../../../../utils/openAIClient";
import prisma from "@/utils/prismaClient";

const OPENAI_MODEL = process.env.OPENAI_MODEL;
if (!OPENAI_MODEL) {
    throw new Error("OPENAI_MODEL is not set in environment variables.");
}

const MAX_RETRIES = 3; // Max number of retries for classification

async function classifyQueryWithRetry(query: string, retries = MAX_RETRIES): Promise<string | null> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const classifyQuery = await openAI.chat.completions.create({
                model: OPENAI_MODEL!,
                messages: [
                    { role: "system", content: `
                        You're a personal finance AI tool query classifier. Analyze the following user query and classify it into one of the predefined categories based on its intent. Respond with only the category name.

                        ### Categories:
                        1. **"GREETING"**
                        2. **"GENERAL FINANCE/PERSONAL FINANCE QUESTION"**
                        3. **"USER ACCOUNTS AND TRANSACTIONS (BANK ACCOUNT, BALANCE, AFFORDABILITY, EXPENDITURES, INCOME, MERCHANTS ETC.)"**
                            a. This includes questions like "Can I afford a trip to x location?", "Can I buy a house in y location?", "Can I afford a z car?", etc.
                        4. **"CYBER ATTACK ATTEMPT (FRAUD, SCAM, UNAUTHORIZED ACCESS)"**
                        5. **"OTHER OR UNRELATED"**
                    ` },
                    { role: "user", content: query },
                ],
                max_tokens: 30,
                temperature: 0.0,
                top_p: 1.0,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
            });

            const response = classifyQuery.choices?.[0]?.message?.content?.trim().toUpperCase();

            if (response && (response.includes("GREETING") || response.includes("GENERAL") || response.includes("FINANCE") || response.includes("ACCOUNTS") || response.includes("TRANSACTIONS") || response.includes("CYBER ATTACK") || response.includes("OTHER") || response.includes("UNRELATED"))) {
                return response;
            }

            console.warn(`🔁 Retry ${attempt}/${retries}: Classification failed, retrying...`);
        } catch (error) {
            console.error(`❌ Classification attempt ${attempt} failed:`, error);
        }
    }

    return null;
}

export async function POST(request: NextRequest) {
    try {
        const [{ query, chatId }, sessionResponse] = await Promise.all([
            request.json(),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate`, {
                headers: request.headers,
                credentials: "include",
            }),
        ]);

        if (!sessionResponse.ok) {
            return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
        }

        const sessionData = await sessionResponse.json();
        const userId = sessionData?.session?.user?.id;

        if (!userId || !query || !chatId || typeof query !== "string" || query.trim() === "") {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const classifyQueryResponse = await classifyQueryWithRetry(query);

        if (!classifyQueryResponse) {
            return NextResponse.json({ error: "Failed to classify user query" }, { status: 500 });
        }

        console.log(classifyQueryResponse);

        let response;

        if (classifyQueryResponse.includes("OTHER") || classifyQueryResponse.includes("UNRELATED") || classifyQueryResponse.includes("CYBER ATTACK")) {
            response = "I specialize in personal finance! Try asking me about budgeting, savings, expenses, or your transactions. I'd be happy to help! 💰😊";
        } else if (classifyQueryResponse.includes("GREETING")) {
            const generateGreeting = await openAI.chat.completions.create({
                model: OPENAI_MODEL!,
                messages: [{ role: "system", content: `Generate a concise, friendly greeting. Use emojis where applicable. Return response in markdown format.` }, { role: "user", content: query }],
                max_tokens: 30,
                temperature: 0.7,
                top_p: 1.0,
                frequency_penalty: 0.3,
                presence_penalty: 0.5,
            });

            response = generateGreeting.choices?.[0]?.message?.content || "Hello!";
        } else if (classifyQueryResponse.includes("GENERAL") || classifyQueryResponse.includes("GENERAL/PERSONAL") || classifyQueryResponse.includes("FINANCE")) {
            const generateFinanceResponse = await openAI.chat.completions.create({
                model: OPENAI_MODEL!,
                messages: [{ role: "system", content: `Generate a response to the user's general finance-related question. Use tables, bullet points, and emojis, where applicable. Limit response to 600 characters. Return response in markdown format.` }, { role: "user", content: query }],
                max_tokens: 200,
                temperature: 0.5,
                top_p: 0.7,
                frequency_penalty: 0.2,
                presence_penalty: 0.6,
            });

            response = generateFinanceResponse.choices?.[0]?.message?.content;
        } else if (classifyQueryResponse.includes("ACCOUNTS") || classifyQueryResponse.includes("TRANSACTIONS")) {
            const [accounts, transactions] = await Promise.all([
                prisma.account.findMany({
                    where: {
                        userId: userId,
                    },
                }),
                prisma.transaction.findMany({
                    where: {
                        userId: userId,
                    },
                })
            ]);

            const finalResponse = await openAI.chat.completions.create({
                model: OPENAI_MODEL!,
                messages: [
                    { 
                        role: "system", 
                        content: `
                            Steps:
                            1. Understand the user's query and intent.
                            2. When a user asks if they can afford something, provide a detailed cost breakdown for that specific item, compare it with the user's current financial situation, and give a recommendation.
                            3. If no additional information is needed, then simply answer the user's query given the user's financial information.
                            4. If some of the user's financial information is irrelevant to the query, do not include it in the response. For example, if the query requires information about the user's accounts, then don't include transaction details, and vice versa.
                            5. Keep the response under 2400 characters.
                            6. The response should be in markdown format. You must use bullet points, tables, emojis, and other visual elements where applicable.
                        `
                    }, 
                    { 
                        role: "user", 
                        content: JSON.stringify({ query: query, accounts: accounts, transactions: transactions })
                    }
                ],
                max_tokens: 600,
                temperature: 0.3,
                top_p: 0.4,
            });

            response = finalResponse.choices?.[0]?.message?.content;
        }

        if (!response) {
            response = "I'm sorry, I don't have an answer to that question.";
        }

        return NextResponse.json({ response }, { status: 200 });

    } catch (error) {
        console.error("❌ Error processing AstraBot request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}