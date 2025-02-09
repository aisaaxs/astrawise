"use client";

import Image from "next/image";
import React from "react";
import { useState, useEffect } from "react";

interface Account {
    accountId: string;
    officialName: string;
    mask: string;
    subtype: string;
    currentBalance: number;
    isoCurrencyCode: string;
}

interface Transaction {
    id: string;
    amount: number;
    accountId: string;
    merchantName: string;
    category: string;
    date: string;
    merchantLogoUrl: string;
}

export default function Dashboard() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
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

        async function getTransactions() {
            try {
                const response = await fetch("/api/user/get-transactions", { credentials: "include" });
                const data = await response.json();
               
                setTransactions(data.transactions);
            } catch (error) {
                console.error("Error getting user transactions:", error);
            }
        }

        getAccounts();
        getTransactions();
    }, []);

    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [income, setIncome] = useState(0);
    const [spendings, setSpendings] = useState(0);
    const [filterYears, setFilterYears] = useState<number[]>([]);
    const [filterMonths, setFilterMonths] = useState<number[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const selectedAccId = accounts[selectedAccount]?.accountId;
        if (!selectedAccId) return;
    
        const filtered = transactions.filter((t) => {
            const transactionDate = new Date(t.date);
            const transactionYear = transactionDate.getFullYear();
            const transactionMonth = transactionDate.getMonth();
    
            return (
                t.accountId === selectedAccId &&
                (selectedYear === null || transactionYear === selectedYear) &&
                (selectedMonth === null || transactionMonth === selectedMonth)
            );
        });
    
        setIncome(filtered.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0));
        setSpendings(filtered.filter((t) => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0));
    
        const uniqueYears = new Set<number>();
        transactions.forEach((t) => {
            if (t.accountId === selectedAccId) {
                uniqueYears.add(new Date(t.date).getFullYear());
            }
        });
        setFilterYears([...uniqueYears].sort((a, b) => b - a));
    
        if (selectedYear !== null) {
            const uniqueMonths = new Set<number>();
            transactions.forEach((t) => {
                const transactionDate = new Date(t.date);
                if (t.accountId === selectedAccId && transactionDate.getFullYear() === selectedYear) {
                    uniqueMonths.add(transactionDate.getMonth());
                }
            });
            setFilterMonths([...uniqueMonths].sort((a, b) => a - b));
        } else {
            setFilterMonths([]);
        }
    
        setFilteredTransactions(filtered);
    }, [selectedAccount, transactions, accounts, selectedYear, selectedMonth]);    

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

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
                                <div className="w-full h-full max-h-[150px] flex justify-center items-center flex-row flex-wrap gap-4 p-4 overflow-y-scroll no-scrollbar">
                                    {filterYears.map((year) => (
                                        <div
                                            key={year}
                                            className={`w-auto h-auto p-1 px-3 flex justify-center items-center rounded-full cursor-pointer group border-2 bg-opacity-50 ${selectedYear === year ? "bg-sky-500 border-sky-500" : "hover:bg-gray-600 border-gray-500 hover:border-white"}`}
                                            onClick={() => {
                                                if (!filterYears.includes(year)) {
                                                    return;
                                                } else {
                                                    if (selectedYear === year) {
                                                        setSelectedYear(null);
                                                    } else {
                                                        setSelectedYear(year);
                                                    }

                                                    setSelectedMonth(null);
                                                }
                                            }}
                                        >
                                            <p className={`font-sans text-md font-medium ${selectedYear === year ? "text-sky-300": "text-gray-400 group-hover:text-white"}`}>
                                                {year}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="w-full h-full max-h-[150px] flex justify-center items-center flex-row flex-wrap gap-4 p-4 overflow-y-scroll no-scrollbar border-t-4 border-gray-800">
                                    {
                                        selectedYear ? (
                                        monthNames.map((month) => (
                                            <div
                                                key={month}
                                                className={`w-auto h-auto p-1 px-3 flex justify-center items-center rounded-full bg-opacity-50 border-2 group
                                                ${selectedMonth === monthNames.indexOf(month) ? "bg-sky-500 border-sky-500" : filterMonths.includes(monthNames.indexOf(month)) ? "hover:bg-gray-600 border-gray-500 hover:border-white cursor-pointer" : "border-gray-800"}`}
                                                onClick={() => {
                                                    if (!filterMonths.includes(monthNames.indexOf(month))) {
                                                        return;
                                                    } else {
                                                        if (selectedMonth === monthNames.indexOf(month)) {
                                                            setSelectedMonth(null);
                                                        } else {
                                                            setSelectedMonth(monthNames.indexOf(month));
                                                        }
                                                    }
                                                }}
                                            >
                                                <p className={`${selectedMonth === monthNames.indexOf(month) ? "text-sky-300" : filterMonths.includes(monthNames.indexOf(month)) ? "text-gray-400 group-hover:text-white" : "text-gray-700"} font-sans text-md font-medium capitalize`}>
                                                    {month}
                                                </p>
                                            </div>
                                        ))) : (
                                            <div className="w-full h-full flex justify-center items-center">
                                                <p className="text-gray-400 font-sans text-md font-medium capitalize">
                                                    please select a year
                                                </p>
                                            </div>
                                        )
                                    }
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
                                            {income % 1 !== 0 ? income.toFixed(2) : income}
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
                                            {spendings % 1 !== 0 ? spendings.toFixed(2) : spendings}
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
                        <div className="w-full h-full bg-gray-900  shadow-xl rounded-t-lg grid grid-rows-[auto_85%]">
                            <div className="w-full h-full flex justify-center items-center">
                                <h3 className="text-white text-xl font-sans font-bold capitalize">
                                    list of transactions
                                </h3>
                            </div>

                            <div className="w-full h-full max-h-[315px] overflow-auto no-scrollbar">
                                <table className="w-full border-collapse">
                                    <thead className="sticky top-0 bg-gray-800 text-white">
                                        <tr className="text-lg">
                                            <th className="p-3 text-left border-b border-gray-600">Date</th>
                                            <th className="p-3 text-left border-b border-gray-600">Logo</th>
                                            <th className="p-3 text-left border-b border-gray-600">Merchant</th>
                                            <th className="p-3 text-left border-b border-gray-600">Category</th>
                                            <th className="p-3 text-right border-b border-gray-600">Amount</th>
                                        </tr>
                                    </thead>

                                    <tbody className="text-white">
                                        {filteredTransactions.length > 0 ? (
                                            filteredTransactions.map((transaction) => (
                                                <tr key={transaction.id} className="border-b border-gray-700 hover:bg-gray-800 transition-all">
                                                    <td className="p-3">{new Date(transaction.date).toLocaleDateString()}</td>

                                                    <td className="p-3">
                                                        {transaction.merchantLogoUrl ? (
                                                            <Image
                                                                loader={() => transaction.merchantLogoUrl}
                                                                src={transaction.merchantLogoUrl || "/fallback-logo.png"}
                                                                alt="Merchant Logo"
                                                                width={30} 
                                                                height={30} 
                                                                className="rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-gray-400">null</span>
                                                        )}
                                                    </td>

                                                    <td className="p-3">{transaction.merchantName || "Unknown Merchant"}</td>

                                                    <td className="p-3">{transaction.category || "Uncategorized"}</td>

                                                    <td className={`p-3 text-right font-medium ${
                                                        transaction.amount > 0 ? "text-green-400" : "text-red-400"
                                                    }`}>
                                                        ${Math.abs(transaction.amount).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td className="p-5 text-center text-gray-400">
                                                    No transactions available for the selected period.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
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