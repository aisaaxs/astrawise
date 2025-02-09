"use client";

import "../globals.css";
import React, { useEffect, useState } from "react";
import MainNavbar from "../../components/MainNavbar";
import PlaidLink from "@/components/plaidLink";
import Loading from "@/components/loading";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkUserAccount() {
      try {
        const response = await fetch("/api/user/has-account", { credentials: "include" });
        const data = await response.json();
        setHasAccount(data.hasAccount);
      } catch (error) {
        console.error("Error checking user account:", error);
        setHasAccount(false);
      } finally {
        setLoading(false);
      }
    }

    checkUserAccount();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="w-full h-full bg-gray-800 grid grid-rows-[100px_auto]">
      <MainNavbar />

      {hasAccount === false ? (
        <PlaidLink
          onAccountCreated={async () => {
            await fetch("/api/plaid/fetch-accounts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
              credentials: "include",
            });

            window.location.reload();
          }}
        />
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}