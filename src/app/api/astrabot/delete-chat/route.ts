import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../utils/prismaClient";

export async function DELETE(request: NextRequest) {
    try {
        const { chatId } = await request.json();

        const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate`, {
            headers: request.headers,
            credentials: "include",
        });

        if (!sessionResponse.ok) {
            return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
        }

        const sessionData = await sessionResponse.json();
        const userId = sessionData?.session?.user?.id;

        if (!userId || !chatId) {
            return NextResponse.json({ error: "Invalid request. Chat ID is required." }, { status: 400 });
        }

        const chat = await prisma.chatTitle.findUnique({
            where: { chatId },
        });

        if (!chat || chat.userId !== userId) {
            return NextResponse.json({ error: "Chat not found or unauthorized access." }, { status: 403 });
        }

        await prisma.chatMessage.deleteMany({
            where: { chatId },
        });

        await prisma.chatTitle.delete({
            where: { chatId },
        });

        return NextResponse.json({ message: "Chat deleted successfully." }, { status: 200 });
    } catch (error) {
        console.error("❌ Error deleting chat:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}