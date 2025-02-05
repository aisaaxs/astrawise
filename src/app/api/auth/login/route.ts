import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../utils/prismaClient';
import bcrypt from 'bcryptjs';

export const POST = async (req: NextRequest) => {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Please fill all the fields' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
        }

        const sessionData = {
            id: user.id,
            email: user.email,
            fullname: user.fullname,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        const token = await bcrypt.hash(JSON.stringify(sessionData), 10);

        const existingSession = await prisma.session.findUnique({
            where: { userId: user.id },
        });

        if (existingSession) {
            await prisma.session.update({
                where: { id: existingSession.id },
                data: { token },
            });
        } else {
            await prisma.session.create({
                data: {
                    userId: user.id,
                    token,
                },
            });
        }

        const response = NextResponse.json({ message: 'User logged in successfully', user }, { status: 201 });

        response.cookies.set('sessionToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        });

        return response;
    } catch (error) {
        console.error('Error during login:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
};