import "../globals.css";
import React from "react";
import MainNavbar from "../../components/MainNavbar";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-full grid grid-rows-[60px_auto]">
        <div className="w-full h-full">
            <MainNavbar />
        </div>

        <div className="w-full h-full">
            {children}
        </div>
    </div>
  );
}