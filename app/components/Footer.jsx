import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1E3A8A] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <span className="font-extrabold text-xl" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Hostel<span className="text-[#F59E0B]">Hub</span>
          </span>
          <p className="mt-2 text-blue-200 text-sm leading-relaxed">
            The #1 hostel discovery platform for UMaT students. Find verified, affordable accommodation near campus.
          </p>
        </div>
        <div>
          <p className="font-semibold text-sm mb-3 text-blue-100 uppercase tracking-wide">Students</p>
          <div className="flex flex-col gap-2 text-sm text-blue-200">
            <Link href="/student/signup" className="hover:text-white transition">Create Account</Link>
            <Link href="/student/login" className="hover:text-white transition">Login</Link>
            <Link href="/" className="hover:text-white transition">Browse Hostels</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-sm mb-3 text-blue-100 uppercase tracking-wide">Hosts</p>
          <div className="flex flex-col gap-2 text-sm text-blue-200">
            <Link href="/host/signup" className="hover:text-white transition">List Your Hostel</Link>
            <Link href="/host/login" className="hover:text-white transition">Host Login</Link>
            <Link href="/host/dashboard" className="hover:text-white transition">Host Dashboard</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-blue-800 py-4 text-center text-xs text-blue-300">
        © {new Date().getFullYear()} HostelHub — Built for UMaT Students · Tarkwa, Ghana
      </div>
    </footer>
  );
}
