"use client";

import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navbarLinks = [
    { name: "home", href: "/" },
    { name: "about", href: "/about" },
    { name: "services", href: "/services" },
    { name: "contact", href: "/contact" },
  ];

    return (
        <nav className="w-full h-full flex flex-row justify-start items-center z-50 bg-black">
        <div className="w-auto h-full flex justify-center items-center px-6">
          <Link className="text-white text-4xl font-serif italic font-extrabold capitalize" href="/">AstraWise</Link>
        </div>

        <div className="w-full h-full flex flex-row justify-end items-center lg:px-6">
          <div className="w-auto h-full flex justify-center items-center flex-row gap-x-4 px-6 max-lg:hidden">
            {navbarLinks.map((link, index) => (
                  <Link key={index} href={link.href} className={`font-medium font-sans text-md capitalize ${pathname === link.href ? "bg-yellow-400 text-black" : "bg-transparent text-white hover:bg-zinc-300"} hover:text-black p-2 flex justify-center items-center rounded-md`}>{link.name}</Link>
                )
              )
            }
          </div>
          <div className="w-auto h-full flex justify-evenly items-center gap-x-4 max-lg:hidden">
            <Link className="bg-transparent hover:bg-white hover:text-black border-2 border-white rounded-md flex justify-center items-center px-4 py-1 text-white font-sans text-md font-semibold capitalize" href="/login">
              login
            </Link>

            <Link className="border-2 border-green-500 bg-green-500 hover:bg-green-600 hover:border-green-600 rounded-md flex justify-center items-center px-4 py-1 text-black font-sans text-md font-semibold capitalize" href="/signup">
              signup
            </Link>
          </div>

          <div className="w-auto h-full px-6 flex justify-center items-center lg:hidden">
            <FontAwesomeIcon icon={faBars} className="text-white text-2xl cursor-pointer" />
          </div>
        </div>
      </nav>
    )
}