import "../globals.css";
import Navbar from "@/components/Navbar";
import React from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-full grid grid-rows-[80px_auto]">
        <div className="w-full h-full">
            <Navbar />
        </div>

        <div className="w-full h-full">
            {children}
        </div>
    </div>
  );
}
