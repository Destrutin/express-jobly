"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  testIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 999,
          equity: "0.9",
          companyHandle: "c1"})
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "new",
        salary: 999,
        equity: "0.9",
        companyHandle: "c1"
      }
    });
  });

  test("unauthorized for non-admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "new",
            salary: 999,
            equity: "0.9",
            companyHandle: "c1" 
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new"
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: "not-a-salary",
          equity: "0.9",
          companyHandle: "c1"
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              title: "j1",
              salary: 100,
              equity: "0.1",
              companyHandle: "c1"
            },
            {
              title: "j2",
              salary: 200,
              equity: "0.2",
              companyHandle: "c1"
            },
            {
              title: "j3",
              salary: 300,
              equity: "0.3",
              companyHandle: "c1"
            }
          ],
    });
  });

  test("works: filtering", async function () {
    const res = await request(app)
      .get("/jobs")
      .query({ minSalary: 200 });
    expect(res.body).toEqual({
      jobs: [
        {
          title: "j2",
          salary: 200,
          equity: "0.2",
          companyHandle: "c1"
        },
        {
          title: "j3",
          salary: 300,
          equity: "0.3",
          companyHandle: "c1"
        }
      ]
    })
  })

  test("fails: invalid filter", async function () {
    const resp = await request(app)
        .get("/jobs")
        .query({ huh: "what" });
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${testIds[0]}`);
    expect(resp.body).toEqual({
      job: {
        id: testIds[0],
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1"
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/999`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testIds[0]}`)
        .send({
          title: "new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "new",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1"
      },
    });
  });

  test("unauth for user", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testIds[0]}`)
        .send({
          name: "new"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testIds[0]}`)
        .send({
          name: "new"
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/999`)
        .send({
          name: "new nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testIds[0]}`)
        .send({
          id: 989,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testIds[0]}`)
        .send({
          salary: "not-a-salary"
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testIds[0]}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: testIds[0] });
  });

  test("unauth for user", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
  
  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/999`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
