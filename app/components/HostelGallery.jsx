import Image from "next/image";

export default function HostelGallery({ images }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
      {images.map((img, idx) => (
        <Image
          key={idx}
          src={img}
          width={300}
          height={200}
          alt={`Gallery image ${idx + 1}`}
          className="rounded-lg"
        />
      ))}
    </div>
  );
}