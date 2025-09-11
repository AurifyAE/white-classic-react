import React from "react";

const ErrorIcon = () => (
  <svg
    className="w-16 h-16"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 8H6.01M6 16H6.01M6 12H18C20.2091 12 22 10.2091 22 8C22 5.79086 20.2091 4 18 4H6C3.79086 4 2 5.79086 2 8C2 10.2091 3.79086 12 6 12ZM6 12C3.79086 12 2 13.7909 2 16C2 18.2091 3.79086 20 6 20H14"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 16L22 21M22 16L17 21"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ErrorPage500 = () => {
  return (
    <div className="flex h-screen items-center justify-center p-5 bg-gray-100">
      <div className="text-center">
        <div className="inline-flex rounded-full bg-red-100 p-4 mb-6">
          <div className="rounded-full stroke-red-600 bg-red-200 p-4">
            <ErrorIcon />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          500 - Server error
        </h1>
        <h2 className="text-2xl font-semibold text-red-500 mb-4">
          We are very sorry for this inconvenience.
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          We are currently working on something new and we will be back soon
          with awesome new features. Thanks for your patience.
        </p>
        <a
          href="mailto:aurifycontact@gmail.com"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-block transition duration-300"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
};

export default ErrorPage500;