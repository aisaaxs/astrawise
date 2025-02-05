import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../utils/prismaClient';
import bcrypt from 'bcryptjs';

export const POST = async (req: NextRequest) => {
    try {
        const { fullname, email, password } = await req.json();

        if (!fullname || !email || !password) {
            return NextResponse.json({ error: 'Please fill all the fields' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                fullname,
                email,
                password: hashedPassword,
            },
        });

        const sessionData = {
            id: newUser.id,
            email: newUser.email,
            fullname: newUser.fullname,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
        };

        const token = await bcrypt.hash(JSON.stringify(sessionData), 10);

        await prisma.session.create({
            data: {
                userId: newUser.id,
                token,
            },
        });

        const response = NextResponse.json({ message: 'User created successfully', user: newUser }, { status: 201 });

        response.cookies.set('sessionToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            expires: new Date(Date.now() + 1000 * 60),
        });

        return response;
    } catch (error) {
        console.error('Error during signup:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
};