import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ListYourHostel() {
  return (
    <main>
      <Navbar />

      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-center">List Your Hostel</h1>
        <p className="text-center text-gray-600">
          Sign up and add your hostel for UMaT students.
        </p>

        <form className="mt-8 bg-white p-6 shadow rounded-lg space-y-4">

          <input
            type="text"
            placeholder="Owner Email"
            className="w-full border p-3 rounded"
          />

          <input
            type="text"
            placeholder="Hostel Name"
            className="w-full border p-3 rounded"
          />

          <input
            type="text"
            placeholder="Location (e.g., Tarkwa)"
            className="w-full border p-3 rounded"
          />

          <textarea
            placeholder="Hostel Description"
            className="w-full border p-3 rounded h-24"
          />

          <button className="w-full bg-blue-600 text-white py-3 rounded">
            Submit Hostel
          </button>
        </form>
      </div>

      <Footer />
    </main>
  );
}