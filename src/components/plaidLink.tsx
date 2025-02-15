"use client";

import { useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBank } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import Loading from "./loading";

interface PlaidLinkProps {
  onAccountCreated: () => void;
}

const PlaidLink = ({ onAccountCreated }: PlaidLinkProps) => {
  const [loading, setLoading] = useState(true);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    const createLinkToken = async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/plaid/create-link-token", {
          client_user_id: "user_good",
        });
        setLinkToken(response.data.link_token);
      } catch (error) {
        console.error("Error generating link token:", error);
      } finally {
        setLoading(false);
      }
    };

    createLinkToken();
  }, []);

  const onSuccess = async (public_token: string) => {
    try {
      setLoading(true);

      await axios.post("/api/plaid/exchange-token", {
        public_token,
      });

      if (onAccountCreated) onAccountCreated();

      setLoading(false);
    } catch (error) {
      console.error("Error exchanging public token:", error);
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess,
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="w-full h-full flex justify-center items-center bg-gray-800">
      <div className="w-auto h-auto p-8 flex flex-col justify-center items-center bg-gray-900 rounded-xl shadow-2xl">
        <FontAwesomeIcon icon={faBank} className="text-blue-600 text-6xl mb-8" />

        <h2 className="text-2xl font-semibold text-white mb-4">
          Connect Your Bank Account
        </h2>

        <p className="text-white mb-8 text-center">
          Linking your bank allows us to help you manage your finances with insightful data
        </p>

        {linkToken && (
          <button
            onClick={() => open()}
            disabled={!ready}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition mt-4"
          >
            Connect Bank
          </button>
        )}
      </div>
    </div>
  );
};

export default PlaidLink;