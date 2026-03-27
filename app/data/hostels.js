const hostels = [
  {
    id: 1,
    name: "Abitjack Hostel",
    city: "Winneba",
    landmark: "Behind Radio Peace FM Station",
    address: "Odobikese St.",
    ghanaPostAddress: "CE-150-9723",
    campusDistance: "30 mins to North Campus",
    type: "Private",
    gender: "Mixed",
    roomsAvailable: 0,
    ownerContact: "0544862114",
    ownerEmail: "martha.adasi94@gmail.com",
    about: "Abitjack Hostel, Winneba is located in a peaceful area behind Ali & Sons Block Factory on Windy-Bay Avenue. It offers comfortable and secure lodging ideal for students.",
    amenities: ["24/7 Water Supply"],
    images: [
      "/images/hostels/campus1.png",
      "/images/hostels/campus2.png",
      "/images/hostels/green1.png",
    ],
    roomTypes: [
      { name: "Four In A Room (shared)", price: 2750, billing: "Yearly", bathroom: "Shared washrooms and kitchenette", status: "available" },
      { name: "Four In A Room", price: 3000, billing: "Yearly", bathroom: "Self-contained with balcony kitchenette", status: "available" },
      { name: "Two In A Room", price: 3000, billing: "Yearly", bathroom: "Self-contained with balcony kitchenette", status: "available" },
      { name: "Two In A Room (shared)", price: 3000, billing: "Semester", bathroom: "Shared kitchenette and washroom", status: "available" },
      { name: "One In A Room", price: 8000, billing: "Yearly", bathroom: "Self-contained with balcony kitchenette", status: "available" },
    ],
    availableFor: ["University of Education, Winneba", "Winneba Nursing Training School"]
  },
  // Add more hostels here...
];

export default hostels;