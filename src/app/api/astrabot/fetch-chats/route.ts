import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../utils/prismaClient";

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ hasAccount: false }, { status: 200 });
    }

    const chatTitles = await prisma.chatTitle.findMany({
      where: { userId },
      select: {
        id: true,
        chatId: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const chatsWithMessages = await Promise.all(
      chatTitles.map(async (chat) => {
        const messages = await prisma.chatMessage.findMany({
          where: { chatId: chat.chatId, userId },
          orderBy: { timestamp: "asc" }, // Order messages from oldest to newest
        });

        return {
          ...chat,
          messages,
        };
      })
    );

    return NextResponse.json({ chats: chatsWithMessages }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching chat messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}