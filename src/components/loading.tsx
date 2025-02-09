import React from "react";

export default function Loading() {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white z-50">
        <div className="flex flex-col items-center space-y-4">
          <svg
            className="animate-spin h-12 w-12 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C6.477 0 2 4.477 2 10s4.477 10 10 10v-2a8 8 0 01-8-8z"
            ></path>
          </svg>
          <p className="text-white font-semibold">Loading, please wait...</p>
        </div>
      </div>
    );
} 