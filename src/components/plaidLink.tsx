"use client";

import { useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBank } from "@fortawesome/free-solid-svg-icons";
import React from "react";

interface PlaidLinkProps {
  onAccountCreated: () => void;
}

const PlaidLink = ({ onAccountCreated }: PlaidLinkProps) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    const createLinkToken = async () => {
      try {
        const response = await axios.post("/api/plaid/create-link-token", {
          client_user_id: "user_good",
        });
        setLinkToken(response.data.link_token);
      } catch (error) {
        console.error("Error generating link token:", error);
      }
    };
    createLinkToken();
  }, []);

  const onSuccess = async (public_token: string) => {
    try {
      await axios.post("/api/plaid/exchange-token", {
        public_token,
      });

      if (onAccountCreated) onAccountCreated();
    } catch (error) {
      console.error("Error exchanging public token:", error);
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess,
  });

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-100">
      <FontAwesomeIcon icon={faBank} className="text-blue-600 text-6xl mb-6" />
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Connect Your Bank Account
      </h2>
      <p className="text-gray-600 mb-8 text-center">
        Linking your bank allows us to help you manage your finances with insightful data
      </p>
        {linkToken && (
          <button
            onClick={() => open()}
            disabled={!ready}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            Connect Bank
          </button>
        )}
    </div>
  );
};

export default PlaidLink;