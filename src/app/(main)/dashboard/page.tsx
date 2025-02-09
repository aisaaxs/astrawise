"use client";

import React from "react";
import { useState, useEffect } from "react";

interface Account {
    officialName: string;
    mask: string;
    subtype: string;
    currentBalance: number;
    isoCurrencyCode: string;
}

export default function Dashboard() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState(0);
    const [accountColors, setAccountColors] = useState<string[]>([]);

    useEffect(() => {
        async function getAccounts() {
            try {
                const response = await fetch("/api/user/get-accounts", { credentials: "include" });
                const data = await response.json();
               
                setAccounts(data.accounts);

                const colors = [
                    "bg-red-400",
                    "bg-green-400",
                    "bg-sky-400",
                    "bg-yellow-400",
                    "bg-orange-400",
                    "bg-amber-400",
                    "bg-lime-400",
                    "bg-emerald-400",
                    "bg-teal-400",
                    "bg-cyan-400",
                    "bg-blue-400",
                    "bg-indigo-400",
                    "bg-violet-400",
                    "bg-purple-400",
                    "bg-fuchsia-400",
                    "bg-pink-400",
                    "bg-rose-400",
                ];
        
                const randomColors = data.accounts.map(() => colors[Math.floor(Math.random() * colors.length)]);
        
                setAccountColors(randomColors);
            } catch (error) {
                console.error("Error getting user accounts:", error);
            }
        }

        getAccounts();
    }, []);

    return (
        <div className="w-full h-full grid grid-cols-[65%_auto]">
            <div className="w-full h-full grid grid-cols-[30%_auto]">
                <div className="w-full h-full grid grid-rows-2 p-4">
                    <div className="w-full h-full flex justify-center items-center pb-4">
                        <div className="w-full h-full bg-gray-900 rounded-lg grid grid-rows-[12%_auto]">
                            <div className="w-full h-full flex justify-center items-center border-b-4 border-gray-800">
                                <h3 className="text-white text-xl font-sans font-bold capitalize">
                                    Select An Account
                                </h3>
                            </div>

                            <div className="w-full h-full max-h-[305px] flex flex-col justify-start items-center overflow-y-scroll no-scrollbar py-1 gap-y-1">
                                {
                                    accounts.map((account, index) => {
                                        return (
                                            <div key={index} className={`w-full h-24 grid grid-cols-[5%_auto] ${selectedAccount === index ? "bg-gray-700 bg-opacity-70" : "hover:bg-gray-800 hover:bg-opacity-50"} cursor-pointer`} onClick={() => {
                                                setSelectedAccount(index);
                                            }}>
                                                <div className={`w-full h-full ${accountColors[index]}`}></div>

                                                <div className="w-full h-full flex flex-col justify-between items-start p-2">
                                                    <h4 className="text-white text-sm font-sans font-bold capitalize">
                                                        {account.officialName}
                                                    </h4>

                                                    <div className="w-full h-auto flex flex-row justify-between items-center">
                                                        <p className="text-white text-sm font-sans font-medium">
                                                            {account.mask}
                                                        </p>

                                                        <p className="text-white text-sm font-sans font-medium capitalize">
                                                            {account.subtype}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-full flex justify-center items-center pt-4">
                        <div className="w-full h-full bg-gray-900 rounded-lg grid grid-rows-[12%_auto]">
                            <div className="w-full h-full flex justify-center items-center border-b-4 border-gray-800">
                                <h3 className="text-white text-xl font-sans font-bold capitalize">
                                    filter by year & month
                                </h3>
                            </div>

                            <div className="w-full h-full grid grid-rows-2">
                                <div className="w-full h-full max-h-[150px] flex justify-center items-center flex-row flex-wrap gap-4 p-2 overflow-y-scroll no-scrollbar">
                                    <div className="w-auto h-auto p-1 px-3 flex justify-center items-center hover:bg-gray-600 hover:bg-opacity-50 border-2 border-gray-500 hover:border-white rounded-full cursor-pointer group">
                                        <p className="text-gray-400 group-hover:text-white font-sans text-md font-medium">
                                            2025
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full h-full max-h-[150px] flex justify-center items-center flex-row flex-wrap gap-4 p-2 overflow-y-scroll no-scrollbar border-t-4 border-gray-800">
                                    <div className="w-auto h-auto p-1 px-3 flex justify-center items-center hover:bg-gray-600 hover:bg-opacity-50 border-2 border-gray-500 hover:border-white rounded-full cursor-pointer group">
                                        <p className="text-gray-400 group-hover:text-white font-sans text-md font-medium capitalize">
                                            january
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full h-full grid grid-rows-2">
                    <div className="w-full h-full grid grid-rows-[40%_auto]">
                        <div className="w-full h-full grid grid-cols-3">
                        <div className="w-full h-full flex justify-center items-center p-4">
                                <div className="w-full h-full bg-gradient-to-br from-lime-400 to-emerald-700 shadow-xl rounded-lg grid grid-rows-3">
                                    <div className="w-full h-full flex justify-center items-center">
                                        <h3 className="text-white text-xl font-sans font-bold capitalize">
                                            Income
                                        </h3>
                                    </div>

                                    <div className="w-full h-full flex justify-center items-center">
                                        <p className="text-white text-4xl font-sans font-medium capitalize">
                                            {accounts[selectedAccount]?.currentBalance % 1 !== 0 ? accounts[selectedAccount]?.currentBalance.toFixed(2) : accounts[selectedAccount]?.currentBalance}
                                        </p>
                                    </div>

                                    <div className="w-full h-full flex justify-center items-center">
                                        <p className="text-white text-lg font-sans font-medium capitalize">
                                            {accounts[selectedAccount]?.isoCurrencyCode}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-full flex justify-center items-center p-4">
                                <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-700 shadow-xl rounded-lg grid grid-rows-3">
                                    <div className="w-full h-full flex justify-center items-center">
                                        <h3 className="text-white text-xl font-sans font-bold capitalize">
                                            Current Balance
                                        </h3>
                                    </div>

                                    <div className="w-full h-full flex justify-center items-center">
                                        <p className="text-white text-4xl font-sans font-medium capitalize">
                                            {accounts[selectedAccount]?.currentBalance % 1 !== 0 ? accounts[selectedAccount]?.currentBalance.toFixed(2) : accounts[selectedAccount]?.currentBalance}
                                        </p>
                                    </div>

                                    <div className="w-full h-full flex justify-center items-center">
                                        <p className="text-white text-lg font-sans font-medium capitalize">
                                            {accounts[selectedAccount]?.isoCurrencyCode}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-full flex justify-center items-center p-4">
                                <div className="w-full h-full bg-gradient-to-br from-rose-400 to-red-700 shadow-xl rounded-lg grid grid-rows-3">
                                    <div className="w-full h-full flex justify-center items-center">
                                        <h3 className="text-white text-xl font-sans font-bold capitalize">
                                            Spendings
                                        </h3>
                                    </div>

                                    <div className="w-full h-full flex justify-center items-center">
                                        <p className="text-white text-4xl font-sans font-medium capitalize">
                                            {accounts[selectedAccount]?.currentBalance % 1 !== 0 ? accounts[selectedAccount]?.currentBalance.toFixed(2) : accounts[selectedAccount]?.currentBalance}
                                        </p>
                                    </div>

                                    <div className="w-full h-full flex justify-center items-center">
                                        <p className="text-white text-lg font-sans font-medium capitalize">
                                            {accounts[selectedAccount]?.isoCurrencyCode}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="w-full h-full grid grid-cols-2">
                            <div className="w-full h-full flex justify-center items-center p-4">
                                <div className="w-full h-full bg-gray-900  shadow-xl rounded-lg">

                                </div>
                            </div>

                            <div className="w-full h-full flex justify-center items-center p-4">
                                <div className="w-full h-full bg-gray-900  shadow-xl rounded-lg">

                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-full flex justify-center items-end px-4 pt-4">
                        <div className="w-full h-full bg-gray-900  shadow-xl rounded-t-lg">

                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full h-full grid grid-rows-3">
                <div className="w-full h-full p-4 flex justify-center items-center">
                    <div className="w-full h-full bg-gray-900 shadow-xl rounded-lg">

                    </div>
                </div>

                <div className="w-full h-full p-4 flex justify-center items-center">
                    <div className="w-full h-full bg-gray-900 shadow-xl rounded-lg">

                    </div>
                </div>

                <div className="w-full h-full p-4 flex justify-center items-center">
                    <div className="w-full h-full bg-gray-900 shadow-xl rounded-lg">

                    </div>
                </div>
            </div>
        </div>
    )
}