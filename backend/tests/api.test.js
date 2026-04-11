const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/server");
const { Student, Host, Hostel, Room } = require("../src/models");

let mongod;
let studentToken, hostToken, studentId, hostId, hostelId;

// ─── Setup & Teardown ────────────────────────────────────────
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Clean up between test groups if needed
});

// ─── AUTH TESTS ───────────────────────────────────────────────
describe("Authentication", () => {

  test("POST /api/auth/signup-student — creates a student", async () => {
    const res = await request(app)
      .post("/api/auth/signup-student")
      .send({
        firstName: "Kwame", lastName: "Asante",
        email: "kwame@umat.edu.gh", phone: "0244123456",
        password: "password123", umatId: "UMaT/2022/ME/001",
        program: "Mining Engineering", year: "L300",
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user.role).toBe("student");
    studentToken = res.body.accessToken;
    studentId = res.body.user.id;
  });

  test("POST /api/auth/signup-student — rejects duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/signup-student")
      .send({
        firstName: "Ama", lastName: "Mensah",
        email: "kwame@umat.edu.gh", phone: "0244999999",
        password: "password123", umatId: "UMaT/2022/ME/999",
        program: "Mining Engineering", year: "L200",
      });
    expect(res.status).toBe(400);
  });

  test("POST /api/auth/signup-host — creates a host", async () => {
    const res = await request(app)
      .post("/api/auth/signup-host")
      .send({
        fullName: "Martha Adasi", email: "martha@gmail.com",
        phone: "0544862114", password: "securepass123",
      });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("host");
    hostToken = res.body.accessToken;
    hostId = res.body.user.id;
  });

  test("POST /api/auth/login — logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "kwame@umat.edu.gh", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user.role).toBe("student");
  });

  test("POST /api/auth/login — rejects wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "kwame@umat.edu.gh", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  test("POST /api/auth/login — rejects unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@nowhere.com", password: "abc12345" });
    expect(res.status).toBe(401);
  });

  test("POST /api/auth/refresh-token — returns new access token", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "kwame@umat.edu.gh", password: "password123" });

    const res = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken: loginRes.body.refreshToken });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  });
});

// ─── STUDENT TESTS ────────────────────────────────────────────
describe("Student", () => {

  test("GET /api/students/me — returns own profile", async () => {
    const res = await request(app)
      .get("/api/students/me")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.student.email).toBe("kwame@umat.edu.gh");
  });

  test("GET /api/students/me — rejects unauthenticated", async () => {
    const res = await request(app).get("/api/students/me");
    expect(res.status).toBe(401);
  });
});

// ─── HOSTEL TESTS ─────────────────────────────────────────────
describe("Hostels", () => {

  test("GET /api/hostels — returns approved hostels list", async () => {
    // Seed one approved hostel directly
    const hostel = await Hostel.create({
      ownerId: hostId,
      name: "Test Hostel",
      description: "A great test hostel near UMaT campus for students.",
      location: "Umat",
      status: "approved",
      priceFrom: 2500,
    });
    hostelId = hostel._id;

    const res = await request(app).get("/api/hostels");
    expect(res.status).toBe(200);
    expect(res.body.hostels.length).toBeGreaterThan(0);
  });

  test("GET /api/hostels — filters by location", async () => {
    const res = await request(app).get("/api/hostels?location=Umat");
    expect(res.status).toBe(200);
    res.body.hostels.forEach(h => expect(h.location).toBe("Umat"));
  });

  test("GET /api/hostels — search by name", async () => {
    const res = await request(app).get("/api/hostels?search=Test+Hostel");
    expect(res.status).toBe(200);
    expect(res.body.hostels.length).toBeGreaterThan(0);
  });

  test("GET /api/hostels/:id — returns single hostel", async () => {
    const res = await request(app).get(`/api/hostels/${hostelId}`);
    expect(res.status).toBe(200);
    expect(res.body.hostel.name).toBe("Test Hostel");
  });

  test("GET /api/hostels/:id — 404 for pending hostel", async () => {
    const pending = await Hostel.create({
      ownerId: hostId,
      name: "Pending One",
      description: "Not yet approved at all by admin review.",
      location: "Tarkwa",
      status: "pending",
    });
    const res = await request(app).get(`/api/hostels/${pending._id}`);
    expect(res.status).toBe(404);
  });
});

// ─── RESERVATION TESTS ───────────────────────────────────────
describe("Reservations", () => {
  let roomId;

  test("seed room type for reservations", async () => {
    const room = await Room.create({
      hostelId,
      name: "2 in a room",
      price: 3000,
      billing: "Yearly",
      totalRooms: 5,
      reservedRooms: 0,
    });
    roomId = room._id;
    expect(roomId).toBeTruthy();
  });

  test("POST /api/reservations — student creates reservation", async () => {
    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        hostelId: hostelId.toString(),
        roomId: roomId.toString(),
        numberOfPeople: 1,
        message: "Interested in viewing",
      });
    expect(res.status).toBe(201);
    expect(res.body.reservation.status).toBe("pending");
  });

  test("POST /api/reservations — duplicate active reservation rejected", async () => {
    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ hostelId: hostelId.toString(), roomId: roomId.toString(), numberOfPeople: 1 });
    expect(res.status).toBe(400);
  });

  test("GET /api/reservations/mine — student lists reservations", async () => {
    const res = await request(app)
      .get("/api/reservations/mine")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.reservations.length).toBeGreaterThan(0);
  });

  test("GET /api/reservations/host — host lists reservations", async () => {
    const res = await request(app)
      .get("/api/reservations/host")
      .set("Authorization", `Bearer ${hostToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.reservations)).toBe(true);
  });
});

// ─── FILTER TESTS ─────────────────────────────────────────────
describe("Filtering & Search", () => {

  test("Filters by price range", async () => {
    const res = await request(app).get("/api/hostels?minPrice=2000&maxPrice=3000");
    expect(res.status).toBe(200);
    res.body.hostels.forEach(h => {
      expect(h.priceFrom).toBeGreaterThanOrEqual(2000);
      expect(h.priceFrom).toBeLessThanOrEqual(3000);
    });
  });

  test("Sorts by lowest price", async () => {
    const res = await request(app).get("/api/hostels?sort=Lowest+Price");
    expect(res.status).toBe(200);
    const prices = res.body.hostels.map(h => h.priceFrom);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test("Pagination works", async () => {
    const res = await request(app).get("/api/hostels?page=1&limit=5");
    expect(res.status).toBe(200);
    expect(res.body.hostels.length).toBeLessThanOrEqual(5);
    expect(res.body).toHaveProperty("pages");
  });
});