"use client";

import { useState } from "react";
import Link from "next/link";
import loginBG from "../../../../public/pexels-adrien-olichon-1257089-2387533.jpg";
import Image from "next/image";
import { z } from "zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
    password: z
        .string()
        .min(1, "Please Enter Your Password"),
});

export default function Login() {
    const router = useRouter();

    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const email = (e.currentTarget.querySelector("#email") as HTMLInputElement).value;
        const password = (e.currentTarget.querySelector("#password") as HTMLInputElement).value;

        const result = loginSchema.safeParse({ email, password });

        if (!result.success) {
            const fieldErrors: { email?: string; password?: string } = {};
            result.error.errors.forEach((err) => {
                if (err.path.includes("email")) fieldErrors.email = err.message;
                if (err.path.includes("password")) fieldErrors.password = err.message;
            });
            setErrors(fieldErrors);
        } else {
            setErrors({});
            try {
                const response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                });
            
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Something went wrong during login.");
                } else {
                    const data = await response.json();
                    
                    if (data.error) {
                        throw new Error(data.error);
                    } else {
                        router.push("/dashboard");
                    }
                }
            } catch (error) {
                if (error instanceof Error) {
                    if (error.message.includes("already exists")) {
                        setErrors({ email: "An account with this email already exists!" });
                    } else {
                        alert(error.message);
                    }
                } else {
                    console.error("An unexpected error occurred:", error);
                    alert("An unexpected error occurred.");
                }
            }      
        }
    };

    return (
        <div className="w-full h-full bg-black grid lg:grid-cols-[auto_450px] max-lg:grid-rows-[auto_300px]">
            <div className="w-full h-full relative flex justify-center items-center">
                <Image src={loginBG} alt="login background" className="w-full h-full object-cover" />

                <form className="absolute w-96 h-auto p-6 bg-white rounded-lg shadow-lg flex flex-col" onSubmit={handleSubmit}>
                    <div className="w-full flex flex-col gap-y-2 justify-center items-center">
                        <h2 className="text-4xl text-black font-sans font-bold">Login</h2>
                        <p>Welcome back. It&apos;s good to see you!</p>
                    </div>

                    <div className="mt-6 flex justify-center items-center gap-y-4 flex-col">
                        <section className="w-full flex flex-col justify-center items-start gap-y-1">
                            <label htmlFor="email" className="text-black font-sans font-bold">Email</label>
                            <input
                                type="email"
                                id="email"
                                className={`w-full h-10 p-2 border-2 rounded-md ${
                                    errors.email ? "border-red-500" : "border-black"
                                }`}
                                autoComplete="email"
                                required
                            />
                            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                        </section>

                        <section className="w-full flex flex-col justify-center items-start gap-y-1 relative">
                            <label htmlFor="password" className="text-black font-sans font-bold">Password</label>

                            <div className="w-full relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    className={`w-full h-10 p-2 pr-10 border-2 rounded-md ${
                                        errors.password ? "border-red-500" : "border-black"
                                    }`}
                                    autoComplete="current-password"
                                    required
                                />

                                <FontAwesomeIcon
                                    icon={showPassword ? faEyeSlash : faEye}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black cursor-pointer"
                                    onClick={() => setShowPassword(!showPassword)}
                                />
                            </div>

                            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                        </section>
                    </div>

                    <button type="submit" className="w-full h-10 bg-black hover:bg-opacity-80 text-white font-sans font-bold rounded-md mt-10 capitalize">
                        Submit
                    </button>
                </form>
            </div>

            <div className="w-full h-full bg-gradient-to-br from-red-500 to-yellow-500 flex justify-center items-center flex-col gap-y-6 p-4">
                <h2 className="text-white capitalize lg:text-5xl max-lg:text-4xl font-sans font-bold text-center">New here?</h2>
                <p className="text-white capitalize lg:text-md max-lg:text-sm font-sans font-medium text-center">
                    Sign up and discover a great amount of AI-powered tools that can help you unlock some pretty cool financial superpowers!
                </p>
                <Link href="/signup" className="bg-white hover:bg-zinc-100 text-black font-sans font-bold rounded-full p-2 px-6 capitalize shadow-lg">
                    Sign Up
                </Link>
            </div>
        </div>
    );
}