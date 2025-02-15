import { NextRequest, NextResponse } from "next/server";
import { openAI } from "../../../../utils/openAIClient";
import { extractPrismaSchema } from "../../../../utils/extractPrismaSchema";
import prisma from "../../../../utils/prismaClient";

const OPENAI_MODEL = process.env.OPENAI_MODEL;
if (!OPENAI_MODEL) {
    throw new Error("OPENAI_MODEL is not set in environment variables.");
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
        const email = sessionData?.session?.user?.email;
        const sessionInfo = sessionData?.session;

        if (!userId || !query || !chatId || typeof query !== "string" || query.trim() === "") {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        await prisma.chatMessage.create({
            data: {
                userId,
                chatId,
                sender: "user",
                message: query,
            },
        });

        const historyCheckResult = await checkChatHistory(userId, query);

        let response;

        const classification = await classifyQuery(query);

            if (classification.toLowerCase().includes("rejected") || classification.toLowerCase().includes("unrelated")) {
                response = "I'm sorry, but I can only assist with finance and personal finance-related inquiries. If you have questions about general financial concepts, budgeting, investments, or something specific to your accounts and transactions, feel free to ask!";
            } else if (classification.toLowerCase().includes("general")) {
                response = await handleGeneralQuery(query);
            } else {
                response = await handlePersonalizedQuery(query, historyCheckResult, { userId, email, sessionInfo });
            }

            await prisma.chatMessage.create({
                data: {
                    userId,
                    chatId,
                    sender: "bot",
                    message: response,
                },
            });

        return NextResponse.json({ response }, { status: 200 });

    } catch (error) {
        console.error("❌ Error processing AstraBot request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

const prismaSchema = extractPrismaSchema();

async function checkChatHistory(userId: string, query: string) {
    const chatHistory = await prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { timestamp: "desc" },
    });

    const historyResponse = await openAI.chat.completions.create({
        model: OPENAI_MODEL!,
        messages: [
            {
                role: "system",
                content: `
                    You are an AI assistant analyzing user chat history. Your task is to check if the current query has been asked before. 
                        - If the query **matches** a previous one, retrieve the past response and refine it for clarity and relevance.
                        - If it's a **new query**, return exactly: "new query".
                        - Ensure responses are **contextually accurate** and avoid redundant or outdated information.
                `
            },
            {
                role: "user",
                content: `
                    User ID: ${userId}\n
                    User Query: ${query}\n
                    Chat History: ${JSON.stringify(chatHistory, null, 2)}
                `
            }
        ]
    });

    return historyResponse.choices?.[0]?.message?.content?.trim() || "unknown";
}

async function classifyQuery(query: string): Promise<string> {
    try {
        const response = await openAI.chat.completions.create({
            model: OPENAI_MODEL!,
            messages: [
                {
                    role: "system",
                    content: `
                        You are an AI classifier. Categorize queries into:
                        - "general" (Finance-related, greeting, etc.)
                        - "personalized" (User-specific financial information)
                        - "unrelated" (Not finance-related)
                        - "rejected" (Hacking attempts like SQL injection, etc.)
                        
                        ONLY return: "general", "personalized", "unrelated", or "rejected".
                    `,
                },
                { role: "user", content: query },
            ],
        });

        return response.choices?.[0]?.message?.content?.toLowerCase().trim() || "unknown";
    } catch (error) {
        console.error("❌ Error classifying query:", error);
        return "unknown";
    }
}

async function handleGeneralQuery(query: string): Promise<string> {
    try {
        const response = await openAI.chat.completions.create({
            model: OPENAI_MODEL!,
            messages: [
                {
                    role: "system",
                    content: `
                        You are a knowledgeable AI assistant specializing in finance and personal finance. 
                        Your primary role is to provide clear, accurate, and helpful responses to user queries 
                        related to financial concepts, budgeting, investing, banking, and personal money management.

                        - If the user asks a **general finance question**, provide a well-structured and informative response.
                        - If the user asks a **personal finance question**, offer practical guidance without requiring personal details.
                        - If the user greets you, respond warmly and naturally.
                        - If the query is **outside the scope of finance**, politely inform the user that you specialize in finance.
                    `
                },
                { role: "user", content: query },
            ],
        });

        return response.choices?.[0]?.message?.content || "I'm sorry, I encountered an error.";
    } catch(error) {
        console.error("❌ Error classifying query:", error);
        return "unknown";
    }
}

async function handlePersonalizedQuery(query: string, historyCheckResult: string, sessionData): Promise<string> {
    try {
        if (historyCheckResult.toLowerCase().includes("new query")) {
            const enhancedUserQueryResponse = await openAI.chat.completions.create({
                model: OPENAI_MODEL!,
                messages: [
                    {
                        role: "system",
                        content: `
                            You are an AI that refines user queries to **improve clarity, structure, and context** while ensuring the original intent remains unchanged. If the query is already clear, simply restate it with improved readability. However, if the query is **broad or complex**, break it down into **two or more well-defined sub-queries** to help extract the necessary information.
    
                            ---
    
                            ### **Instructions**
                            - **Improve readability** by rephrasing the query in a clearer and more structured way.
                            - **Preserve the original intent**—do not change the meaning or assumption of the question.
                            - **Maintain tense, context, and key details** exactly as in the original query.
                            - **Break down broad or complex queries** into logical, **concise sub-queries** that extract the necessary information.
                            - **Use natural language** so the refined query is understandable and actionable.
                            - **DO NOT return multiple variations**—only return the **final refined query or structured sub-queries**.
    
                            ---
    
                            ### **Response Format**
                            - If the query is already **clear and specific**, return:
                            \`<Refined single query>\`
    
                            - If the query is **broad or requires additional sub-queries**, return:
                            \`<Main refined query> && <Sub-query 1> && <Sub-query 2> ...\`
    
                            ✅ **Your response must be in plain text only.**  
                            ❌ **Do NOT return explanations, bullet points, formatting, or unnecessary text.**
    
                            ---
    
                            ### **Examples**
                            ✅ **User Query:** "Can I afford a trip to Italy?"  
                            ✅ **Response:**  
                            \`What is my current account balance? && What is the estimated cost breakdown of a trip to Italy, including flights, accommodation, food, and other expenses?\`
    
                            ✅ **User Query:** "Should I invest in Tesla stock?"  
                            ✅ **Response:**  
                            \`What is the current price and historical performance of Tesla stock? && What are the risks and general investment strategies related to Tesla?\`
    
                            ✅ **User Query:** "How much did I spend last month?"  
                            ✅ **Response:**  
                            \`How much did I spend in total last month based on my transaction history?\`
    
                            ✅ **User Query:** "Is it better to lease or buy a car?"  
                            ✅ **Response:**  
                            \`What are the long-term and short-term cost differences between leasing and buying a car?\`
    
                            ✅ **User Query:** "how much money do I have?"  
                            ✅ **Response:**  
                            \`What is the cumulative current balance of my accounts?\`
    
                            ---
    
                            ### **Final Notes**
                            ❌ **DO NOT change the meaning or intent of the query.**  
                            ❌ **DO NOT add assumptions or unrelated details.**  
                            ❌ **DO NOT provide explanations, markdown, or multiple formatting styles.**  
                            ✅ **Simply return a structured query or sub-queries in plain text.**  
    
                            Use the following Prisma schema for reference:  
                            \`${prismaSchema}\`
                        `
                    },
                    { role: "user", content: query },
                ],
            });
    
            const enhancedUserQuery = enhancedUserQueryResponse.choices?.[0]?.message?.content?.trim() || query;
    
            const requireAdditionalInfoResponse = await openAI.chat.completions.create({
                model: OPENAI_MODEL!,
                messages: [
                    {
                        role: "system",
                        content: `
                            You are an AI assistant responsible for determining whether additional **non-user-specific** information is required to answer the user's query. 
    
                            ### **Key Points to Understand**
                            - The **user's financial data is always available** and does not count as additional information.
                            - **You must only determine if external general information is required**, such as market trends, cost estimates, or industry benchmarks.
                            - **DO NOT request user-specific details** like income, spending habits, or account balances.
                            - **Your response must strictly follow the format below.**
    
                            ---
    
                            ### **Response Format**
                            Your response must be in **plain text only** with **NO extra words, explanations, or formatting**:
                            - If **no additional information is needed**, return exactly:  
                            \`NO\`
                            - If **additional information is needed**, return exactly:  
                            \`YES: <Describe the additional data needed>\`
    
                            ---
    
                            ### **Examples**
                            ✅ **User Query:** "Can I afford a trip to Italy?"  
                            ✅ **Response:**  
                            \`YES: A detailed cost breakdown for a trip to Italy, including flights, accommodations, meals, local transportation, activities, travel insurance, and currency exchange rates.\`
    
                            ✅ **User Query:** "What is my account balance?"  
                            ✅ **Response:**  
                            \`NO\`
    
                            ✅ **User Query:** "Should I invest in Tesla stock?"  
                            ✅ **Response:**  
                            \`YES: The latest Tesla stock trends, historical performance, risk factors, and general investment advice on diversification.\`
    
                            ✅ **User Query:** "How much did I spend last month?"  
                            ✅ **Response:**  
                            \`NO\`
    
                            ✅ **User Query:** "Is it cheaper to rent or buy a home?"  
                            ✅ **Response:**  
                            \`YES: A comparison of average home prices, mortgage rates, rent prices, property taxes, and maintenance costs.\`
    
                            ---
    
                            ### **Final Notes**
                            ❌ DO NOT return anything other than "YES: ..." or "NO".  
                            ❌ DO NOT include explanations, markdown, bullet points, or JSON formatting.  
                            ❌ DO NOT ask for personal financial details or data.  
                            ✅ Your response must be **precise and formatted exactly as required.**
                        `
                    },
                    { role: "user", content: enhancedUserQuery },
                ],
            });
    
            const additionalInfoResponse = requireAdditionalInfoResponse.choices?.[0]?.message?.content?.trim() || "NO";
    
            let additionalInfo = "";
            const requiresAdditionalInfo = additionalInfoResponse.startsWith("YES:");
            const additionalQuery = requiresAdditionalInfo ? additionalInfoResponse.replace("YES:", "").trim() : "";
    
            if (requiresAdditionalInfo) {
                const generateAdditionalInfoResponse = await openAI.chat.completions.create({
                    model: OPENAI_MODEL!,
                    messages: [
                        {
                            role: "system",
                            content: `
                                You are an AI assistant responsible for **retrieving and summarizing accurate real-world financial data** based on the user's request. Your response should be **detailed, well-structured, and actionable** to provide useful insights.
    
                                ---
    
                                ### **Instructions**
                                - **Use only factual, up-to-date financial data** (market trends, costs, averages, etc.).
                                - **Break down complex financial topics** into **clear, structured sections**.
                                - **Provide specific numbers, percentages, or estimated ranges** whenever applicable.
                                - **Include relevant comparisons** where necessary (e.g., "Renting vs Buying a Home").
                                - **Ensure all responses contain monetary values or percentages**—never provide vague information.
                                - **DO NOT assume user-specific details** (e.g., their income, spending habits, or account balance).
                                - **DO NOT generate vague or generic responses**—your response must be informative and **directly address the request**.
    
                                ---
    
                                ### **Handling Missing Specifications**
                                If the user's query lacks specific details (e.g., asking about a car but not specifying trim level or location of purchase):
                                - **DO NOT reject the request.**
                                - **Provide financial data covering all relevant scenarios.**
                                - **Use reasonable estimates and general assumptions based on available market data.**
                                - **If regional differences exist, highlight potential price variations.**
    
                                ---
    
                                ### **Response Format**
                                - Your response should be in **plain text**, structured in **clear sections** using headers.
                                - Use **bold headings** to categorize different aspects of the information.
                                - When providing numerical data, use **estimated ranges based on real-world sources**.
                                - Where applicable, include **key considerations, risks, and potential alternatives**.
    
                                ---
    
                                ### **Examples**
                                ✅ **User Request:** "Provide a cost breakdown of a trip to Italy."  
                                ✅ **Response:**  
                                \`
                                **Estimated Cost Breakdown for a Trip to Italy**
                                - **Flights:** \$x - \$y (round-trip, economy class)
                                - **Accommodation:** \$x - \$y per night (hotel/apartment rental)
                                - **Food:** \$x - \$y per day (casual to fine dining)
                                - **Local Transport:** \$x - \$y per day (metro, taxis, intercity trains)
                                - **Attractions & Activities:** \$x - \$y per day
                                - **Travel Insurance:** \$x - \$y (depends on coverage)
                                - **Total Estimated Cost for a 7-Day Trip:** \$x - \$y
                                - *Prices vary based on season, location, and booking time.*
    
                                **Key Considerations:**
                                - Booking flights early can save up to 30%.
                                - Using public transport instead of taxis can reduce daily costs.
                                \`
    
                                ---
    
                                ✅ **User Request:** "Provide information on Tesla stock performance."  
                                ✅ **Response:**  
                                \`
                                **Tesla Stock Performance Overview**
                                - **Current Stock Price:** \$X (as of [date])
                                - **1-Year Change:** +X% / -X%
                                - **5-Year Growth:** X% increase / decrease
                                - **Volatility:** High / Moderate / Low
                                - **Recent Earnings Report:** Revenue of \$X billion, Profit of \$X million
    
                                **Key Risks & Considerations:**
                                - **Market Volatility:** Tesla's stock is highly volatile due to demand fluctuations.
                                - **Competition:** EV market competition is increasing with companies like Rivian and Lucid.
                                - **Regulatory Concerns:** Potential government regulations on EV incentives may impact growth.
                                - *Investors should assess risk tolerance before making decisions.*
                                \`
    
                                ---
    
                                ✅ **User Request:** "Provide data on renting vs buying a home in Canada."  
                                ✅ **Response:**  
                                \`
                                **Renting vs Buying a Home in Canada**
                                - **Average Home Price:** \$x - \$y (varies by city)
                                - **Average Rent for a 1-Bedroom Apartment:** \$x - \$y per month
                                - **Down Payment Requirement:** x% - y% of home price
                                - **Mortgage Rates:** x% - y% (fixed z-year term)
                                - **Estimated Monthly Mortgage Payment:** \$x - \$y (including taxes & insurance)
    
                                **Pros of Renting:**
                                ✔️ Flexibility to move  
                                ✔️ Lower upfront costs  
                                ✔️ No property maintenance expenses  
    
                                **Pros of Buying:**
                                ✔️ Builds equity over time  
                                ✔️ Stability with fixed monthly payments  
                                ✔️ Potential appreciation in property value  
    
                                **Key Considerations:**
                                - Renting may be better for short-term stays or job flexibility.
                                - Buying is beneficial for long-term financial stability.
                                \`
    
                                ---
    
                                ### **Final Notes**
                                ❌ **DO NOT assume user-specific financial details.**  
                                ❌ **DO NOT generate vague or generic responses.**  
                                ❌ **DO NOT return Markdown, JSON, or bullet points outside the provided structure.**  
                                ✅ **Ensure information is detailed, well-structured, and actionable.**  
                                ✅ **Use estimated real-world financial data where necessary.**
                                \`
    
                                User Request: "${additionalQuery}"
                            `
                        },
                        { role: "user", content: additionalQuery },
                    ],
                });
    
                additionalInfo = generateAdditionalInfoResponse.choices?.[0]?.message?.content?.trim() || "No additional information available.";
            }
    
            const generateQueryResponse = await openAI.chat.completions.create({
                model: OPENAI_MODEL!,
                messages: [
                    {
                        role: "system",
                        content: `
                            Generate an optimized SQL query for PostgreSQL to fetch financial data based on the user's request.
                            Respond **only** with the SQL query as plain text.
    
                            Note, we're using the public schema and the Prisma schema for reference. Therefore, accessing tables would look something like: \`public."TableName"\.
    
                                                    **Instructions:**
                            1. **Analyze the user's query** to determine the required financial data, like account balances, transactions, income, spendings, etc.
                            2. **Generate an SQL query** that efficiently retrieves relevant financial data from PostgreSQL.
                            3. **Ensure the SQL query is formatted correctly** using these rules:
    
                            **SQL Query Formatting Rules:**
                            - **Use the 'public' schema** before table names, always enclosed in **double quotes**.
                            - ✅ Correct: \`SELECT * FROM public."Transaction";\`
                            - ❌ Incorrect: \`SELECT * FROM Transaction;\`
                            - **Ensure queries use proper filters** (e.g., WHERE, ORDER BY, LIMIT).
                            - **If the query requires a date range**, use:
                            - ✅ \`"Transaction"."date" BETWEEN NOW() - INTERVAL '3 months' AND NOW()\`
                            - **Use proper joins** when retrieving data from multiple tables.
                            - **Always filter queries by user ID** to ensure the correct user's data is retrieved.
                            - **Optimize performance** by avoiding unnecessary columns and large dataset retrievals.
    
                            **IMPORTANT**:
                            - Just return the SQL query as the response and no additional text.
                        `
                    },
                    {
                        role: "user",
                        content: `
                            User Query: ${query}\n
                            User ID: ${sessionData.userId}\n
                            User Session Data: ${JSON.stringify(sessionData)}\n
                            Prisma Schema: ${prismaSchema}
                        `
                    }
                ]
            });
    
            let generatedQuery = generateQueryResponse.choices?.[0]?.message?.content?.trim() || "";
            generatedQuery = generatedQuery.replace(/`/g, "").replace(/^sql\s+/i, "").trim();
    
            let queryResponse;
            try {
                queryResponse = await prisma.$queryRawUnsafe(generatedQuery);
            } catch (sqlError) {
                console.error("❌ SQL Query Execution Error:", sqlError);
                queryResponse = "Error retrieving data.";
            }
    
            const formattedQueryResponse = Array.isArray(queryResponse)
                ? queryResponse.map(row => JSON.stringify(row, null, 2)).join("\n")
                : JSON.stringify(queryResponse, null, 2);
    
            const generateFinalResponse = await openAI.chat.completions.create({
                model: OPENAI_MODEL!,
                messages: [
                    { 
                        role: "system", 
                        content: `
                            You are an AI assistant that generates **well-structured Markdown responses** for financial data analysis.
                            Your response should be **visually appealing, easy to read, and well-organized**.
    
                            **Instructions:**
                            - Use **bold headers** for key sections (e.g., "### Summary", "### Key Insights").
                            - Present numerical data **clearly formatted** using currency symbols, percentages, and bullet points.
                            - Use **tables** when presenting structured data such as cost breakdowns, comparisons, or lists.
                            - Highlight important details using **bold text** and **italics** where necessary.
                            - If relevant, include **callout sections** using blockquotes (">") for insights or important notes.
                            - Use emojis to enhance readability and engagement where appropriate.
                            - Ensure everything is **concise, informative, and neatly formatted**.
                            - **Do NOT add extra explanations beyond what is necessary for readability.**
                            - **Do NOT enclose the entire response in triple backticks (\`\`\`), just return clean Markdown.**
                        ` 
                    },
                    { 
                        role: "user", 
                        content: `
                            ### **User Query**
                            \`\`\`
                            ${query}
                            \`\`\`
    
                            ### **Additional Information**
                            ${additionalInfo ? additionalInfo : "_No additional external data required._"}
    
                            ### **Financial Data & Insights**
                            ${formattedQueryResponse ? formattedQueryResponse : "_No relevant database records found._"}
    
                            ### **Key Takeaways**
                            - Ensure the financial estimates provided align with current market trends.
                            - If making a financial decision, consider external factors such as inflation, interest rates, and risk tolerance.
                            - Consult a financial expert if further analysis is required.
                        ` 
                    },
                ],
            });
    
            return generateFinalResponse.choices?.[0]?.message?.content || "I'm sorry, I encountered an error.";
        } else {
            const userInfo = await prisma.user.findUnique({
                where: { id: sessionData.userId },
                include: { Account: true, Transaction: true },
            });

            const revisedResponse = await openAI.chat.completions.create({
                model: OPENAI_MODEL!,
                messages: [
                    {
                        role: "system",
                        content: `
                            Your task is to **refine the previous chat history response** based on the user's query and updated user-specific financial data to essentially answer the user's query.

                            Return a **well-formatted markdown response**.

                            **Instructions:**
                            - Use **bold headers** for key sections (e.g., "### Summary", "### Key Insights").
                            - Present numerical data **clearly formatted** using currency symbols, percentages, and bullet points.
                            - Use **tables** when presenting structured data such as cost breakdowns, comparisons, or lists.
                            - Highlight important details using **bold text** and **italics** where necessary.
                            - If relevant, include **callout sections** using blockquotes (">") for insights or important notes.
                            - Use emojis to enhance readability and engagement where appropriate.
                            - Ensure everything is **concise, informative, and neatly formatted**.
                            - **Do NOT add extra explanations beyond what is necessary for readability.**
                            - **Do NOT enclose the entire response in triple backticks (\`\`\`), just return clean Markdown.**
                        `,
                    }, 
                    {
                        role: "user",
                        content: `
                            User Query: ${query}\n
                            User Information: ${JSON.stringify(userInfo, null, 2)}
                            Previous Chat History: ${historyCheckResult}
                        `,
                    }
                ]
            });

            return revisedResponse.choices?.[0]?.message?.content || "I'm sorry, I encountered an error.";
        }

    } catch (error) {
        console.error("❌ Error handling personalized query:", error);
        return "I'm sorry, I encountered an error.";
    }
}