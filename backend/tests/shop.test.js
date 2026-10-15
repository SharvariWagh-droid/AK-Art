const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const request = require("supertest");
const { startApp, makePng } = require("./support/app");

// Razorpay is replaced: orders.create answers what each test decides.
const mockCreateRazorpayOrder = jest.fn();
jest.mock("razorpay", () => jest.fn().mockImplementation((keys) => ({ keys, orders: { create: (...a) => mockCreateRazorpayOrder(...a) } })));

let app;
let Artwork;
let Order;
beforeAll(async () => {
  app = await startApp();
  Artwork = require("../models/artwork");
  Order = require("../models/order");
});
afterAll(() => app.stop());
beforeEach(async () => {
  await Artwork.deleteMany({});
  await Order.deleteMany({});
  mockCreateRazorpayOrder.mockReset();
});

const api = () => request(app.server);

describe("artworks", () => {
  test("adding a base64 image saves the file to uploads and the artwork with it", async () => {
    const png = await makePng();
    const res = await api()
      .post("/api/artworks/add")
      .send({ title: "Sunset", type: "digital", image: `data:image/jpeg;base64,${png.toString("base64")}`, price: 499, description: "Warm", attributes: JSON.stringify([{ key: "Size", value: "A3" }, { key: "Finish", value: "Matte" }]) });
    expect(res.body).toEqual({ message: "Added" });
    const saved = await Artwork.findOne({ title: "Sunset" });
    expect(saved).toMatchObject({ type: "digital", price: 499, description: "Warm" });
    expect(saved.attributes.map(({ key, value }) => [key, value])).toEqual([["Size", "A3"], ["Finish", "Matte"]]);
    expect(saved.image).toMatch(/^art_\d+_\d+\.jpg$/);
    expect(fs.readFileSync(path.join(app.uploadsDir, saved.image)).equals(png)).toBe(true);
  });

  test("a URL image keeps just the file name; title and attributes have defaults", async () => {
    await api().post("/api/artworks/add").send({ type: "published", image: "http://host/uploads/cover.png", attributes: "not json" });
    await api().post("/api/artworks/add").send({ title: "Plain", type: "published", image: "plain.png", attributes: { a: 1 } });
    const [untitled, plain] = await Artwork.find().sort({ _id: 1 });
    expect(untitled).toMatchObject({ image: "cover.png", price: 0 });
    expect(untitled.title).toMatch(/^Artwork \d+$/);
    expect(untitled.attributes.toObject()).toEqual([]);
    expect(plain.attributes.toObject()).toEqual([]);
    // A data URL that does not parse is stored as it is.
    await api().post("/api/artworks/add").send({ title: "Odd", type: "x", image: "data:image/png;notbase64" });
    expect((await Artwork.findOne({ title: "Odd" })).image).toBe("data:image/png;notbase64");
  });

  test("lists all artworks or one type; refuses duplicates and missing fields", async () => {
    await api().post("/api/artworks/add").send({ title: "A", type: "digital", image: "a.png" });
    await api().post("/api/artworks/add").send({ title: "B", type: "published", image: "b.png" });
    expect((await api().get("/api/artworks")).body).toHaveLength(2);
    expect((await api().get("/api/artworks?type=published")).body.map((a) => a.title)).toEqual(["B"]);
    expect((await api().post("/api/artworks/add").send({ title: "A", type: "digital", image: "a.png" })).body).toEqual({ error: "Artwork already exists" });
    expect((await api().post("/api/artworks/add").send({ title: "C" })).body).toEqual({ error: "Missing required fields: type, image" });
  });

  test("update and delete, with 404 for unknown and 500 for malformed ids", async () => {
    await api().post("/api/artworks/add").send({ title: "A", type: "digital", image: "a.png" });
    const art = await Artwork.findOne();
    expect((await api().put(`/api/artworks/${art._id}`).send({ price: 999 })).body.artwork.price).toBe(999);
    expect((await api().put("/api/artworks/0123456789abcdef01234567").send({})).status).toBe(404);
    expect((await api().put("/api/artworks/not-an-id").send({})).status).toBe(500);
    expect((await api().delete(`/api/artworks/${art._id}`)).body).toEqual({ message: "Deleted successfully" });
    expect((await api().delete(`/api/artworks/${art._id}`)).status).toBe(404);
    expect((await api().delete("/api/artworks/not-an-id")).status).toBe(500);
  });

  test("database errors answer 500", async () => {
    jest.spyOn(Artwork, "find").mockRejectedValueOnce(new Error("db down"));
    expect((await api().get("/api/artworks")).body).toEqual({ error: "db down" });
    jest.spyOn(Artwork, "findOne").mockRejectedValueOnce(new Error("db down"));
    expect((await api().post("/api/artworks/add").send({ type: "a", image: "b" })).status).toBe(500);
  });

  // FINDING: the admin login issues a token, but no route checks it: anyone can add, edit or
  // delete artworks (and the same holds for orders, homepage, testimonials, about and agencies).
  test.failing("deleting an artwork needs the admin's token", async () => {
    await api().post("/api/artworks/add").send({ title: "A", type: "digital", image: "a.png" });
    const art = await Artwork.findOne();
    expect((await api().delete(`/api/artworks/${art._id}`)).status).toBe(401);
  });
});

describe("orders and downloads", () => {
  const order = { userId: "u1", userName: "Asha", email: "asha@example.com", artworkName: "Sunset", price: 499, image: "http://host/uploads/sunset.png", paymentId: "pay_1" };

  test("an order is saved as paid; listed for the admin, the user, and by payment id", async () => {
    const res = await api().post("/api/orders/create").send({ ...order, status: "Pending" });
    expect(res.body.message).toBe("Order saved");
    const saved = await Order.findById(res.body.orderId);
    expect(saved).toMatchObject({ artName: "Sunset", image: "sunset.png", status: "Paid", userId: "u1" });
    await api().post("/api/orders/create").send({ ...order, artworkName: undefined, artName: "Other", image: "local.png", userId: "u2", paymentId: "pay_2" });
    await api().post("/api/orders/create").send({ ...order, image: undefined, paymentId: "pay_3" });

    expect((await api().get("/api/orders")).body).toHaveLength(3);
    expect((await api().get("/api/orders/user/u1")).body.map((o) => o.paymentId)).toEqual(["pay_1", "pay_3"]);
    expect((await api().get("/api/orders/payment/pay_2")).body.artName).toBe("Other");
    expect((await api().get("/api/orders/payment/nope")).status).toBe(404);
  });

  test("an order needs a user, a payment id and an artwork name", async () => {
    for (const missing of ["userId", "paymentId", "artworkName"]) {
      const res = await api().post("/api/orders/create").send({ ...order, [missing]: undefined });
      expect(res.status).toBe(400);
    }
  });

  test("database errors answer 500", async () => {
    jest.spyOn(Order, "find").mockRejectedValueOnce(new Error("db down")).mockRejectedValueOnce(new Error("db down"));
    expect((await api().get("/api/orders")).status).toBe(500);
    expect((await api().get("/api/orders/user/u1")).status).toBe(500);
    jest.spyOn(Order, "findOne").mockRejectedValueOnce(new Error("db down"));
    expect((await api().get("/api/orders/payment/p")).status).toBe(500);
    jest.spyOn(Order.prototype, "save").mockRejectedValueOnce(new Error("db down"));
    expect((await api().post("/api/orders/create").send(order)).status).toBe(500);
  });

  test("the original file downloads; missing files 404", async () => {
    const png = await makePng();
    fs.writeFileSync(path.join(app.uploadsDir, "test_download.png"), png);
    const res = await api().get("/api/orders/download/test_download.png").buffer(true).parse((r, cb) => {
      const chunks = [];
      r.on("data", (c) => chunks.push(c));
      r.on("end", () => cb(null, Buffer.concat(chunks)));
    });
    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toContain("test_download.png");
    expect(res.body.equals(png)).toBe(true);
    expect((await api().get("/api/orders/download/nope.png")).status).toBe(404);
  });

  test("a resized print in JPG or PNG; bad sizes, formats and files are refused", async () => {
    fs.writeFileSync(path.join(app.uploadsDir, "test_resize.png"), await makePng());
    const jpg = await api().get("/api/orders/download/test_resize.png/6x7/jpg?title=Sunset");
    expect(jpg.status).toBe(200);
    expect(jpg.headers["content-type"]).toBe("image/jpeg");
    expect(jpg.headers["content-disposition"]).toBe('attachment; filename="Sunset.jpg"');
    const meta = await require("sharp")(jpg.body).metadata();
    expect([meta.width, meta.height]).toEqual([1800, 2100]);
    const png = await api().get("/api/orders/download/test_resize.png/8x12/PNG");
    expect(png.headers["content-disposition"]).toBe('attachment; filename="artwork.PNG"');
    expect((await api().get("/api/orders/download/test_resize.png/9x9/jpg")).body).toEqual({ message: "Invalid size" });
    expect((await api().get("/api/orders/download/test_resize.png/6x7/gif")).body).toEqual({ message: "Invalid format" });
    expect((await api().get("/api/orders/download/nope.png/6x7/jpg")).status).toBe(404);
    fs.writeFileSync(path.join(app.uploadsDir, "test_broken.png"), "not an image");
    expect((await api().get("/api/orders/download/test_broken.png/6x7/jpg")).status).toBe(500);
  });

  test("a failed transfer is reported", async () => {
    fs.writeFileSync(path.join(app.uploadsDir, "test_fail.png"), "x");
    const express = require("express");
    jest.spyOn(express.response, "download").mockImplementationOnce(function (_p, cb) {
      cb(new Error("aborted"));
    });
    expect((await api().get("/api/orders/download/test_fail.png")).body).toEqual({ error: "Download failed" });
    jest.spyOn(express.response, "download").mockImplementationOnce(function (_p, cb) {
      this.status(200).end("partial");
      cb(new Error("aborted"));
    });
    expect((await api().get("/api/orders/download/test_fail.png")).text).toBe("partial");
    jest.spyOn(fs, "existsSync").mockImplementationOnce(() => {
      throw new Error("disk");
    });
    expect((await api().get("/api/orders/download/test_fail.png")).body).toEqual({ error: "disk" });
  });

  // FINDING: the file name from the URL is joined to the uploads path without checks, so an
  // encoded "../" downloads any file the server can read — here the server's own source, and
  // equally backend/.env with the database password and the Razorpay secret.
  test.failing("files outside uploads cannot be downloaded", async () => {
    const res = await api().get("/api/orders/download/..%2Fserver.js").buffer(true).parse((r, cb) => {
      let text = "";
      r.on("data", (c) => (text += c));
      r.on("end", () => cb(null, text));
    });
    // Today this is backend/server.js itself.
    expect(res.body).not.toContain("async function startServer()");
  });

  // FINDING: downloads need no proof of purchase: anyone can fetch every original (file names
  // are listed by /api/artworks).
  test.failing("a paid artwork downloads only for someone who bought it", async () => {
    fs.writeFileSync(path.join(app.uploadsDir, "test_paid.png"), await makePng());
    expect((await api().get("/api/orders/download/test_paid.png")).status).toBe(401);
  });

  // FINDING: orders are saved as "Paid" without checking the payment with Razorpay, so anyone
  // can record a paid order with a made-up payment id.
  test.failing("an order is only recorded as paid after the payment is verified", async () => {
    const res = await api().post("/api/orders/create").send({ ...order, paymentId: "made_up" });
    expect(res.status).toBe(400);
  });

  // FINDING: every customer's order (names, emails) is listed to anyone.
  test.failing("the order list needs the admin's token", async () => {
    expect((await api().get("/api/orders")).status).toBe(401);
  });
});

describe("payments", () => {
  test("creates a Razorpay order in paise with the configured keys", async () => {
    mockCreateRazorpayOrder.mockResolvedValue({ id: "order_1", amount: 49950 });
    const res = await api().post("/api/payment/create-order").send({ amount: 499.5 });
    expect(res.body).toEqual({ id: "order_1", amount: 49950 });
    const [options] = mockCreateRazorpayOrder.mock.calls[0];
    expect(options).toMatchObject({ amount: 49950, currency: "INR" });
    expect(options.receipt).toMatch(/^receipt_\d+$/);
    const Razorpay = require("razorpay");
    expect(Razorpay.mock.results.at(-1).value.keys).toEqual({ key_id: "rzp_test_key", key_secret: "rzp_test_secret" });
  });

  test("refuses a bad amount and reports Razorpay errors", async () => {
    for (const amount of [undefined, "abc", 0, -5]) {
      expect((await api().post("/api/payment/create-order").send({ amount })).text).toBe("Invalid amount");
    }
    mockCreateRazorpayOrder.mockRejectedValue(new Error("Authentication failed"));
    const res = await api().post("/api/payment/create-order").send({ amount: 10 });
    expect(res.status).toBe(500);
    expect(res.text).toBe("Error creating order: Authentication failed");
  });

  test("verifies the Razorpay signature", async () => {
    const sign = (o, p) => crypto.createHmac("sha256", "rzp_test_secret").update(`${o}|${p}`).digest("hex");
    const good = await api().post("/api/payment/verify").send({ razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: sign("order_1", "pay_1") });
    expect(good.body).toEqual({ success: true, message: "Payment verified successfully" });
    const bad = await api().post("/api/payment/verify").send({ razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "forged" });
    expect(bad.status).toBe(400);
    const secret = process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_KEY_SECRET;
    try {
      expect((await api().post("/api/payment/verify").send({})).body).toEqual({ success: false, message: "Internal Server Error!" });
    } finally {
      process.env.RAZORPAY_KEY_SECRET = secret;
    }
  });
});
