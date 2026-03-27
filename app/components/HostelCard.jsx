import Image from "next/image";
import Link from "next/link";

export default function HostelCard({ hostel }) {
  return (
    <Link href={`/hostel/${hostel.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer">
        <Image
          src={hostel.images[0]}
          alt={hostel.name}
          width={600}
          height={400}
          className="rounded-t-lg h-48 w-full object-cover"
        />

        <div className="p-4">
          <h2 className="font-bold text-lg">{hostel.name}</h2>
          <p className="text-gray-500 text-sm">{hostel.location}, UMaT</p>
          <p className="mt-2 font-semibold text-blue-600">{hostel.rooms} rooms available</p>
        </div>
      </div>
    </Link>
  );
}