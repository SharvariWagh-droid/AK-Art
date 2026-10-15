const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { startApp, makePng } = require("./support/app");

let app;
let models;
beforeAll(async () => {
  app = await startApp();
  models = {
    Homepage: require("../models/Homepage"),
    Testimonial: require("../models/Testimonial"),
    TestimonialStyle: require("../models/TestimonialStyle"),
    About: require("../models/About"),
    AboutStyle: require("../models/AboutStyle"),
    Agency: require("../models/Agency"),
  };
});
afterAll(() => app.stop());
beforeEach(async () => {
  for (const model of Object.values(models)) await model.deleteMany({});
});

const api = () => request(app.server);

describe("homepage", () => {
  test("the first read creates defaults and fills the footer, print and portfolio texts", async () => {
    const { body } = await api().get("/api/homepage");
    expect(body).toMatchObject({ heroTitle: "Default Title", heroSubtitle: "Default Subtitle", footerTitle: "Abhilasha Khatri", footerFontFamily: "Poppins", digitalPrintTitle: "Digital Prints", portfolioTitle: "Explore Art & Works", portfolioTitleSize: "48px" });
    expect(await models.Homepage.countDocuments()).toBe(1);
  });

  test("updates only the fields that are sent, and drops empty image slots", async () => {
    const fields = {
      heroTitle: "Magic", heroSubtitle: "Worlds", heroColorPalette: "p", heroTitleColor: "#111", heroSubtitleColor: "#222", heroTitleSize: "40px", heroSubtitleSize: "20px", heroTitleFont: "Lora", heroSubtitleFont: "Inter", globalFont: "Inter", theme: { primaryColor: "#000000", hoverColor: "#111111" },
      footerTitle: "AK", footerDescription: "d", footerTextColor: "#333", footerFontSize: "14px", footerFontFamily: "Lato", footerPalette: "fp", footerTitleColor: "#444", footerDescColor: "#555",
      digitalPrintTitle: "Prints", digitalPrintDescription: "pd", digitalPrintTitleSize: "30px", digitalPrintDescSize: "15px", digitalPrintTextColor: "#666", digitalPrintPalette: "dp", digitalPrintTitleColor: "#777", digitalPrintDescColor: "#888",
      portfolioTitle: "Works", portfolioSubtitle: "ps", portfolioTitleColor: "#999", portfolioSubtitleColor: "#aaa", portfolioTitleSize: "44px", portfolioSubtitleSize: "18px", portfolioPalette: "pp",
      heroImages: ["a.png", null, "b.png"],
    };
    const { body } = await api().put("/api/homepage").send(fields);
    expect(body.message).toBe("Homepage updated successfully");
    const saved = (await models.Homepage.findOne()).toObject();
    expect(saved.heroImages).toEqual(["a.png", "b.png"]);
    const { heroImages, ...rest } = fields;
    expect(saved).toMatchObject(rest);

    await api().put("/api/homepage").send({ heroTitle: "Only this" });
    expect((await models.Homepage.findOne()).footerTitle).toBe("AK");
  });

  test("hero images upload to uploads; none is a 400", async () => {
    const png = await makePng();
    const res = await api().post("/api/homepage/upload").attach("heroImages", png, "hero.png").attach("heroImages", png, "second.png");
    expect(res.body.success).toBe(true)
    expect(res.body.filenames).toHaveLength(2);
    for (const name of res.body.filenames) expect(fs.existsSync(path.join(app.uploadsDir, name))).toBe(true);
    expect((await api().post("/api/homepage/upload")).body).toEqual({ message: "No images uploaded" });
  });

  test("errors answer 500", async () => {
    jest.spyOn(models.Homepage, "findOne").mockRejectedValueOnce(new Error("db down")).mockRejectedValueOnce(new Error("db down"));
    expect((await api().get("/api/homepage")).body).toEqual({ error: "db down" });
    expect((await api().put("/api/homepage").send({})).status).toBe(500);
    // heroImages that is not a list cannot be filtered.
    expect((await api().put("/api/homepage").send({ heroImages: "a.png" })).status).toBe(500);
    const express = require("express");
    jest.spyOn(express.response, "json").mockImplementationOnce(() => {
      throw new Error("serialise");
    });
    expect((await api().post("/api/homepage/upload").attach("heroImages", await makePng(), "x.png")).status).toBe(500);
  });

  // FINDING: the upload accepts any file type (no filter) into a folder served as a website, so an
  // HTML or SVG file with script can be uploaded and served from the site (stored XSS). There is
  // no login check either.
  test.failing("only images can be uploaded", async () => {
    const res = await api().post("/api/homepage/upload").attach("heroImages", Buffer.from("<script>alert(1)</script>"), "evil.html");
    expect(res.status).toBe(400);
  });
});

describe("testimonials", () => {
  test("add, list newest first, update, delete", async () => {
    expect((await api().post("/api/testimonials").send({ name: "Ravi" })).status).toBe(400);
    const first = (await api().post("/api/testimonials").send({ name: "Ravi", message: "Lovely", image: "r.png" })).body.testimonial;
    await new Promise((r) => setTimeout(r, 5));
    await api().post("/api/testimonials").send({ name: "Meera", message: "Beautiful" });
    expect((await api().get("/api/testimonials")).body.map((t) => t.name)).toEqual(["Meera", "Ravi"]);
    expect((await api().put(`/api/testimonials/${first._id}`).send({ name: "Ravi K", message: "Lovely!" })).body.testimonial.name).toBe("Ravi K");
    expect((await api().put("/api/testimonials/0123456789abcdef01234567").send({ name: "x", message: "y" })).status).toBe(404);
    expect((await api().delete(`/api/testimonials/${first._id}`)).body).toEqual({ message: "Testimonial deleted successfully" });
    expect((await api().delete(`/api/testimonials/${first._id}`)).status).toBe(404);
  });

  test("style settings are saved and read back", async () => {
    expect((await api().get("/api/testimonials/style")).body).toEqual({});
    await api().post("/api/testimonials/style").send({ testimonialTextSize: "16px", testimonialNameSize: "18px", testimonialTextColor: "#333", testimonialColorPalette: "warm" });
    expect((await api().get("/api/testimonials/style")).body).toMatchObject({ textSize: "16px", nameSize: "18px", textColor: "#333", palette: "warm" });
  });

  test("malformed ids and database errors answer 500", async () => {
    expect((await api().put("/api/testimonials/bad").send({ name: "x", message: "y" })).status).toBe(500);
    expect((await api().delete("/api/testimonials/bad")).status).toBe(500);
    jest.spyOn(models.Testimonial, "find").mockReturnValueOnce({ sort: () => Promise.reject(new Error("db down")) });
    expect((await api().get("/api/testimonials")).status).toBe(500);
    jest.spyOn(models.Testimonial.prototype, "save").mockRejectedValueOnce(new Error("db down"));
    expect((await api().post("/api/testimonials").send({ name: "a", message: "b" })).status).toBe(500);
    jest.spyOn(models.TestimonialStyle, "findOne").mockRejectedValueOnce(new Error("db down"));
    expect((await api().get("/api/testimonials/style")).status).toBe(500);
    jest.spyOn(models.TestimonialStyle, "findOneAndUpdate").mockRejectedValueOnce(new Error("db down"));
    expect((await api().post("/api/testimonials/style").send({})).status).toBe(500);
  });
});

describe("about", () => {
  test("create, overwrite and update the about section", async () => {
    expect((await api().get("/api/about")).body).toBeNull();
    const created = await api().post("/api/about").send({ name: "Abhilasha", bio: "Illustrator", image: "http://host/uploads/me.png", publishedWorks: [{ title: "Book A", link: "https://example.com/a" }] });
    expect(created.status).toBe(201);
    expect(created.body.about).toMatchObject({ name: "Abhilasha", image: "me.png", publishedWorks: [{ title: "Book A", details: "", link: "https://example.com/a" }] });
    await api().post("/api/about").send({ name: "A. Khatri", bio: "b", image: "local.png" });
    expect(await models.About.countDocuments()).toBe(1);
    expect((await api().get("/api/about")).body).toMatchObject({ name: "A. Khatri", image: "local.png" });
    expect((await api().put("/api/about").send({ bio: "Updated" })).body.about.bio).toBe("Updated");
  });

  test("style settings accept either field naming", async () => {
    expect((await api().get("/api/about/style")).body).toEqual({});
    await api().post("/api/about/style").send({ aboutNameSize: "30px", bioSize: "16px", aboutWorksSize: "14px", textColor: "#222", aboutPalette: "cool" });
    expect((await api().get("/api/about/style")).body).toMatchObject({ nameSize: "30px", bioSize: "16px", worksSize: "14px", textColor: "#222", palette: "cool" });
  });

  test("database errors answer 500", async () => {
    for (const [model, method, call] of [
      ["AboutStyle", "findOne", () => api().get("/api/about/style")],
      ["AboutStyle", "findOneAndUpdate", () => api().post("/api/about/style").send({})],
      ["About", "findOne", () => api().get("/api/about")],
      ["About", "findOne", () => api().post("/api/about").send({})],
      ["About", "findOneAndUpdate", () => api().put("/api/about").send({})],
    ]) {
      jest.spyOn(models[model], method).mockRejectedValueOnce(new Error("db down"));
      expect((await call()).status).toBe(500);
    }
  });
});

describe("agencies", () => {
  test("add, list oldest first, rename, delete", async () => {
    expect((await api().post("/api/agencies").send({})).status).toBe(400);
    const a = (await api().post("/api/agencies").send({ name: "Penguin" })).body.agency;
    await new Promise((r) => setTimeout(r, 5));
    await api().post("/api/agencies").send({ name: "Scholastic" });
    expect((await api().get("/api/agencies")).body.map((x) => x.name)).toEqual(["Penguin", "Scholastic"]);
    expect((await api().put(`/api/agencies/${a._id}`).send({ name: "Penguin RH" })).body.agency.name).toBe("Penguin RH");
    expect((await api().put("/api/agencies/0123456789abcdef01234567").send({ name: "x" })).status).toBe(404);
    expect((await api().delete(`/api/agencies/${a._id}`)).status).toBe(200);
    expect((await api().delete(`/api/agencies/${a._id}`)).status).toBe(404);
  });

  test("malformed ids and database errors answer 500", async () => {
    expect((await api().put("/api/agencies/bad").send({ name: "x" })).status).toBe(500);
    expect((await api().delete("/api/agencies/bad")).status).toBe(500);
    jest.spyOn(models.Agency, "find").mockReturnValueOnce({ sort: () => Promise.reject(new Error("db down")) });
    expect((await api().get("/api/agencies")).status).toBe(500);
    jest.spyOn(models.Agency.prototype, "save").mockRejectedValueOnce(new Error("db down"));
    expect((await api().post("/api/agencies").send({ name: "x" })).status).toBe(500);
  });
});

describe("the server", () => {
  test("serves the shop and admin pages and a health check", async () => {
    expect((await api().get("/")).text).toContain("<html");
    expect((await api().get("/shop.html")).status).toBe(200);
    expect((await api().get("/admin/admin-login.html")).status).toBe(200);
    expect((await api().get("/health")).body).toEqual({ status: "ok", db: 1 });
  });
});
