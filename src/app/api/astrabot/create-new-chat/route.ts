import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../utils/prismaClient";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
    try {
        const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate`, {
            headers: request.headers,
            credentials: "include",
        });

        if (!sessionResponse.ok) {
            return NextResponse.json({ error: "Failed to validate session" }, { status: 401 });
        }

        const sessionData = await sessionResponse.json();
        const userId = sessionData.session?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
        }

        const chatId = uuidv4();

        const newChat = await prisma.chatTitle.create({
            data: {
                userId,
                chatId,
                title: "New Chat",
            },
        });

        return NextResponse.json({ chatId: newChat.chatId, title: newChat.title }, { status: 201 });

    } catch (error) {
        console.error("❌ Error creating a new chat:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
