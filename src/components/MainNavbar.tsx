"use client";

import Link from "next/link";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faEnvelope, faChartBar, faLightbulb, faMessage, faBullseye } from "@fortawesome/free-solid-svg-icons";
import { usePathname } from "next/navigation";

export default function MainNavbar() {
    const pathname = usePathname();

    const NavLinks = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: faChartBar,
        },
        {
            name: "Insights",
            href: "/insights",
            icon: faLightbulb,
        },
        {
            name: "AstraBot",
            href: "/astrabot",
            icon: faMessage,
        },
        {
            name: "Milestone Hub",
            href: "/milestone-hub",
            icon: faBullseye,
        },
    ]
    return (
        <div className="w-full h-full flex justify-center items-center">
            <Link className="absolute left-5 drop-shadow-xl text-4xl text-white bg-blue-700 p-2 px-6 rounded-tl-full rounded-br-full italic font-sans font-extrabold" href="/dashboard">
                AW
            </Link>

            <div className="w-auto h-auto p-2 px-4 bg-gray-800 flex flex-row justify-evenly items-center gap-x-4">
                {
                    NavLinks.map((link, index) => (
                        <Link key={index} href={link.href} className={`w-auto h-full ${pathname === link.href ? "border-b-4 border-blue-600" : "hover:border-b-4 hover:border-gray-300"} px-4 py-2 flex justify-center items-center gap-x-2`}>
                            <FontAwesomeIcon icon={link.icon} className={`${pathname === link.href ? "text-blue-500" : "text-gray-300"} text-xl`} />

                            <p className={`${pathname === link.href ? "text-blue-500" : "text-gray-300"} font-sans font-bold text-xl text-center`}>{link.name}</p>
                        </Link>
                    ))
                }
            </div>

            <div className="w-auto h-auto absolute right-5 flex justify-end items-center flex-row gap-x-8 max-xl:hidden">
                <FontAwesomeIcon icon={faEnvelope} className="text-gray-300 hover:text-white text-2xl cursor-pointer" />

                <FontAwesomeIcon icon={faGear} className="text-gray-300 hover:text-white text-2xl cursor-pointer" />
            </div>
        </div>
    );
}