"use client";

import { useState } from "react";
import Link from "next/link";
import signupBG from "../../../../public/pexels-adrien-olichon-1257089-2387533.jpg";
import Image from "next/image";
import { z } from "zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

// Zod Schema for Sign-Up Validation
const signupSchema = z.object({
    fullName: z.string().min(1, "Full Name is required."),
    email: z.string().email("Please enter a valid email address."),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long.")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
        .regex(/[0-9]/, "Password must contain at least one number.")
        .regex(/[@#$%^&*!]/, "Password must contain at least one special character."),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

export default function Signup() {
    const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string; confirmPassword?: string }>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const fullName = (e.currentTarget.querySelector("#fullName") as HTMLInputElement).value;
        const email = (e.currentTarget.querySelector("#email") as HTMLInputElement).value;
        const password = (e.currentTarget.querySelector("#password") as HTMLInputElement).value;
        const confirmPassword = (e.currentTarget.querySelector("#confirmPassword") as HTMLInputElement).value;

        const result = signupSchema.safeParse({ fullName, email, password, confirmPassword });

        if (!result.success) {
            const fieldErrors: { fullName?: string; email?: string; password?: string; confirmPassword?: string } = {};
            result.error.errors.forEach((err) => {
                if (err.path.includes("fullName")) fieldErrors.fullName = err.message;
                if (err.path.includes("email")) fieldErrors.email = err.message;
                if (err.path.includes("password")) fieldErrors.password = err.message;
                if (err.path.includes("confirmPassword")) fieldErrors.confirmPassword = err.message;
            });
            setErrors(fieldErrors);
        } else {
            setErrors({});
            console.log("Form submitted successfully!", { fullName, email, password });
        }
    };

    return (
        <div className="w-full h-full bg-black grid lg:grid-cols-[auto_450px] max-lg:grid-rows-[auto_200px]">
            <div className="w-full h-full relative flex justify-center items-center">
                <Image src={signupBG} alt="signup background" className="w-full h-full object-cover" />

                <form className="absolute w-96 h-auto p-6 bg-white rounded-lg shadow-lg flex flex-col" onSubmit={handleSubmit}>
                    <div className="w-full flex flex-col gap-y-2 justify-center items-center">
                        <h2 className="text-4xl text-black font-sans font-bold">Sign Up</h2>
                        <p>Join us today and unlock powerful tools!</p>
                    </div>

                    <div className="mt-6 flex justify-center items-center gap-y-4 flex-col">
                        <section className="w-full flex flex-col justify-center items-start gap-y-1">
                            <label htmlFor="fullName" className="text-black font-sans font-bold">Full Name</label>
                            <input
                                type="text"
                                id="fullName"
                                className={`w-full h-10 p-2 border-2 rounded-md ${
                                    errors.fullName ? "border-red-500" : "border-black"
                                }`}
                                autoComplete="name"
                                required
                            />
                            {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
                        </section>

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
                                    autoComplete="new-password"
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

                        <section className="w-full flex flex-col justify-center items-start gap-y-1 relative">
                            <label htmlFor="confirmPassword" className="text-black font-sans font-bold">Confirm Password</label>
                            <div className="w-full relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    className={`w-full h-10 p-2 pr-10 border-2 rounded-md ${
                                        errors.confirmPassword ? "border-red-500" : "border-black"
                                    }`}
                                    autoComplete="new-password"
                                    required
                                />
                                <FontAwesomeIcon
                                    icon={showConfirmPassword ? faEyeSlash : faEye}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black cursor-pointer"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                />
                            </div>
                            {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
                        </section>
                    </div>

                    <button type="submit" className="w-full h-10 bg-black hover:bg-opacity-80 text-white font-sans font-bold rounded-md mt-10 capitalize">
                        Sign Up
                    </button>
                </form>
            </div>

            <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 flex justify-center items-center flex-col gap-y-6 p-4">
                <h2 className="text-white capitalize lg:text-5xl max-lg:text-4xl font-sans font-bold text-center">Already have an account?</h2>
                <p className="text-white capitalize lg:text-md max-lg:text-sm font-sans font-medium text-center">
                    Login now to access your account and explore powerful features!
                </p>
                <Link href="/login" className="bg-white hover:bg-zinc-100 text-black font-sans font-bold rounded-full p-2 px-6 capitalize shadow-lg">
                    Login
                </Link>
            </div>
        </div>
    );
}