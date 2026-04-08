import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-glass relative mt-auto">
      <div className="relative max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="HostelHub"
                  fill
                  className="object-contain"
                  onError={(e) => { e.currentTarget.style.display="none"; }}
                />
              </div>
              <span className="font-extrabold text-2xl text-white" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                Hostel<span className="text-[#F59E0B]">Hub</span>
              </span>
            </Link>
            <p className="text-blue-200/80 text-sm leading-relaxed max-w-xs">
              The #1 hostel discovery platform for UMaT students. Find verified, affordable accommodation near campus — fast.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <span className="text-xs text-blue-300/60 uppercase tracking-widest font-semibold">UMaT · Tarkwa · Ghana</span>
            </div>
          </div>

          {/* Students */}
          <div>
            <p className="font-bold text-sm text-white/90 mb-4 uppercase tracking-widest">Students</p>
            <div className="flex flex-col gap-2.5">
              {[
                ["Sign Up Free", "/signup"],
                ["Sign In", "/login"],
                ["Browse Hostels", "/"],
                ["My Dashboard", "/student/dashboard"],
              ].map(([l, h]) => (
                <Link key={l} href={h} className="text-sm text-blue-200/70 hover:text-[#F59E0B] transition-colors duration-200">
                  {l}
                </Link>
              ))}
            </div>
          </div>

          {/* Hosts */}
          <div>
            <p className="font-bold text-sm text-white/90 mb-4 uppercase tracking-widest">Hosts</p>
            <div className="flex flex-col gap-2.5">
              {[
                ["List Your Hostel", "/signup"],
                ["Host Sign In", "/login"],
                ["Host Dashboard", "/host/dashboard"],
                ["Add a Hostel", "/host/add-hostel"],
              ].map(([l, h]) => (
                <Link key={l} href={h} className="text-sm text-blue-200/70 hover:text-[#F59E0B] transition-colors duration-200">
                  {l}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-blue-300/50">
            © {year} HostelHub. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-xs text-blue-300/50">Platform online</span>
          </div>
        </div>
      </div>
    </footer>
  );
}