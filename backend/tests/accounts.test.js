const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { startApp } = require("./support/app");

let app;
let User;
let Admin;
beforeAll(async () => {
  app = await startApp();
  User = require("../models/user");
  Admin = require("../models/Admin");
});
afterAll(() => app.stop());
beforeEach(async () => {
  await User.deleteMany({});
  await Admin.deleteMany({});
});

const post = (path, body) => request(app.server).post(path).send(body);

describe("customer accounts (/api/auth)", () => {
  test("register, then log in with the right password only", async () => {
    expect((await post("/api/auth/register", { name: "Asha", email: "asha@example.com", password: "secret1" })).body).toEqual({ message: "Registration successful" });
    const saved = await User.findOne({ email: "asha@example.com" });
    expect(await bcrypt.compare("secret1", saved.password)).toBe(true);

    expect((await post("/api/auth/register", { name: "Again", email: "asha@example.com", password: "x" })).body).toEqual({ message: "User already exists" });
    const ok = await post("/api/auth/login", { email: "asha@example.com", password: "secret1" });
    expect(ok.body).toEqual({ message: "Login successful", user: { _id: String(saved._id), name: "Asha", email: "asha@example.com" } });
    expect((await post("/api/auth/login", { email: "asha@example.com", password: "nope" })).body).toEqual({ message: "Incorrect password" });
    expect((await post("/api/auth/login", { email: "x@example.com", password: "nope" })).body).toEqual({ message: "User not found" });
  });

  test("forgot and reset password", async () => {
    await post("/api/auth/register", { name: "Asha", email: "asha@example.com", password: "secret1" });
    expect((await post("/api/auth/forgot-password", { email: "x@example.com" })).body).toEqual({ message: "User not found" });
    const { body } = await post("/api/auth/forgot-password", { email: "asha@example.com" });
    expect(body).toMatchObject({ success: true, message: "Reset link sent" });
    const user = await User.findOne({ email: "asha@example.com" });
    expect(user.resetPasswordToken).toMatch(/^[0-9a-f]{40}$/);

    expect((await post("/api/auth/reset-password", { token: "wrong", password: "x" })).body).toEqual({ message: "Invalid or expired token" });
    expect((await post("/api/auth/reset-password", { token: user.resetPasswordToken, password: "new-pass" })).body).toEqual({ message: "Password reset successful" });
    const after = await User.findOne({ email: "asha@example.com" });
    expect(await bcrypt.compare("new-pass", after.password)).toBe(true);
    expect(after.resetPasswordToken).toBeUndefined();
  });

  test("an expired reset token is refused", async () => {
    await User.create({ name: "A", email: "a@x.com", password: "h", resetPasswordToken: "t", resetPasswordExpires: Date.now() - 1000 });
    expect((await post("/api/auth/reset-password", { token: "t", password: "x" })).body).toEqual({ message: "Invalid or expired token" });
  });

  test("database and input errors answer 500", async () => {
    expect((await post("/api/auth/register", { name: "A", email: "a@x.com" })).status).toBe(500); // no password to hash
    for (const path of ["login", "forgot-password", "reset-password"]) {
      jest.spyOn(User, "findOne").mockRejectedValueOnce(new Error("db down"));
      const res = await post(`/api/auth/${path}`, { email: "a@x.com", token: "t", password: "p" });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "db down" });
    }
  });

  // FINDING: the reset token is sent back in the API response (and printed to the server log),
  // so anyone who knows a customer's email can reset that customer's password.
  test.failing("the reset token is not returned to whoever asked", async () => {
    await post("/api/auth/register", { name: "Asha", email: "asha@example.com", password: "secret1" });
    const { body } = await post("/api/auth/forgot-password", { email: "asha@example.com" });
    expect(body.token).toBeUndefined();
  });

  // FINDING: wrong passwords and unknown accounts answer 200 OK with a message, and the
  // message says which emails have accounts.
  test.failing("a failed login answers 401 without saying whether the account exists", async () => {
    await post("/api/auth/register", { name: "Asha", email: "asha@example.com", password: "secret1" });
    const unknown = await post("/api/auth/login", { email: "x@example.com", password: "p" });
    const wrong = await post("/api/auth/login", { email: "asha@example.com", password: "p" });
    expect(unknown.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
  });
});

describe("admin account (/api/admin)", () => {
  test("the first login with the built-in credentials creates the admin and answers a 24h token", async () => {
    const res = await post("/api/admin/login", { username: "abhilasha", password: "admin123" });
    expect(res.status).toBe(200);
    const claims = jwt.verify(res.body.token, "test-admin-secret");
    expect(claims.username).toBe("abhilasha");
    expect(claims.exp - claims.iat).toBe(24 * 60 * 60);
    expect(await Admin.countDocuments()).toBe(1);
    // Once an admin exists, the built-in pair is just a normal login.
    expect((await post("/api/admin/login", { username: "abhilasha", password: "admin123" })).status).toBe(200);
    expect(await Admin.countDocuments()).toBe(1);
  });

  test("wrong username or password: 401", async () => {
    await post("/api/admin/login", { username: "abhilasha", password: "admin123" });
    expect((await post("/api/admin/login", { username: "x", password: "admin123" })).status).toBe(401);
    expect((await post("/api/admin/login", { username: "abhilasha", password: "nope" })).body).toEqual({ message: "Invalid credentials" });
  });

  test("update changes the credentials; forgot/reset password", async () => {
    expect((await post("/api/admin/update", { username: "x" })).status).toBe(404);
    await post("/api/admin/login", { username: "abhilasha", password: "admin123" });
    expect((await post("/api/admin/update", { username: "owner", email: "owner@akart.com", password: "n3w-pass" })).body).toEqual({ message: "Credentials updated successfully" });
    expect((await post("/api/admin/login", { username: "owner", password: "n3w-pass" })).status).toBe(200);
    await post("/api/admin/update", {});

    expect((await post("/api/admin/forgot-password", { email: "nobody@x.com" })).body).toEqual({ message: "Admin with this email not found" });
    await post("/api/admin/forgot-password", { email: "owner@akart.com" });
    const admin = await Admin.findOne();
    expect((await post("/api/admin/reset-password", { token: "wrong", password: "x" })).body).toEqual({ message: "Invalid or expired token" });
    expect((await post("/api/admin/reset-password", { token: admin.resetToken, password: "reset-1" })).body).toEqual({ message: "Password reset successful" });
    expect((await post("/api/admin/login", { username: "owner", password: "reset-1" })).status).toBe(200);
  });

  test("database errors answer 500", async () => {
    jest.spyOn(Admin, "countDocuments").mockRejectedValueOnce(new Error("db down"));
    expect((await post("/api/admin/login", { username: "a", password: "b" })).status).toBe(500);
    for (const path of ["update", "forgot-password", "reset-password"]) {
      jest.spyOn(Admin, "findOne").mockRejectedValueOnce(new Error("db down"));
      expect((await post(`/api/admin/${path}`, { email: "a", token: "t", password: "p" })).body).toEqual({ error: "db down" });
    }
  });

  // FINDING: /api/admin/update has no login check: anyone can change the admin's username and
  // password and take over the shop's admin.
  test.failing("changing the admin credentials needs the admin's token", async () => {
    await post("/api/admin/login", { username: "abhilasha", password: "admin123" });
    expect((await post("/api/admin/update", { username: "attacker", password: "pwned" })).status).toBe(401);
  });

  // FINDING: the admin reset token is returned in the response, so anyone who knows (or guesses,
  // e.g. the default admin@akart.com) the admin email can reset the admin password.
  test.failing("the admin reset token is not returned to whoever asked", async () => {
    await post("/api/admin/login", { username: "abhilasha", password: "admin123" });
    const { body } = await post("/api/admin/forgot-password", { email: "admin@akart.com" });
    expect(body.token).toBeUndefined();
  });

  // FINDING: with no admin yet, the username/password pair written in the code creates one.
  // Whoever logs in first with it (e.g. on a fresh database) becomes the admin.
  test.failing("no built-in admin credentials are accepted", async () => {
    expect((await post("/api/admin/login", { username: "abhilasha", password: "admin123" })).status).toBe(401);
  });

  test("without JWT_SECRET the token is signed with a secret written in the code", async () => {
    jest.resetModules();
    const secret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
      const controller = require("../controllers/adminController");
      const res = { json: jest.fn(), status: jest.fn(() => res) };
      jest.spyOn(require("../models/Admin"), "countDocuments").mockResolvedValue(1);
      jest.spyOn(require("../models/Admin"), "findOne").mockResolvedValue({ _id: "a1", username: "x", password: await bcrypt.hash("p", 4) });
      await controller.loginAdmin({ body: { username: "x", password: "p" } }, res);
      const { token } = res.json.mock.calls[0][0];
      expect(() => jwt.verify(token, "test-admin-secret")).toThrow();
      expect(jwt.decode(token).username).toBe("x");
    } finally {
      process.env.JWT_SECRET = secret;
    }
  });
});
