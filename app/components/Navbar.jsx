"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center py-4 px-4">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          HostelHub
        </Link>

        <div className="flex gap-6 text-gray-700">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <Link href="/list-your-hostel" className="hover:text-blue-600">
            Become a Host
          </Link>
        </div>
      </div>
    </nav>
  );
}