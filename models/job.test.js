"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 999,
    equity: "0",
    companyHandle: "c1"
  };

  test("works", async function () {
    try {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            ...newJob,
            id: expect.any(Number)
    });
    } catch (err) {
        console.error('Error creating job:', err);
        throw err
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll({});
    expect(jobs).toEqual([
      {
        title: "j0",
        salary: 1,
        equity: "0",
        companyHandle: "c1"
      },
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
    ]);
  });

  test("works: title filter", async function () {
    let jobs = await Job.findAll({title: '1'});
    expect(jobs).toEqual([
      {
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1"
      }
    ]);
  });

  test("works: title with no matches", async function () {
    let jobs = await Job.findAll({title: 'nothing'});
    expect(jobs).toEqual([]);
  });

  test("works: min salary filter", async function () {
    let jobs = await Job.findAll({minSalary: 200});
    expect(jobs).toEqual([
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
    ]);
  });

  test("works: equity filter", async function () {
    let jobs = await Job.findAll({hasEquity: true});
    expect(jobs).toEqual([
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
    ]);
  });

  test("works: min salary and equity filter", async function () {
    let jobs = await Job.findAll({minSalary: 200, hasEquity: true});
    expect(jobs).toEqual([
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
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(testIds[0]);
    console.log(testIds[0]);
    expect(job).toEqual({
      id:testIds[0],
      title: "j0",
      salary: 1,
      equity: "0",
      companyHandle: "c1"

    });
  });

  test("not found if no such company", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 999,
    equity: "0.9"
  };

  test("works", async function () {
    let job = await Job.update(testIds[0], updateData);
    expect(job).toEqual({
      id: testIds[0],
      companyHandle: "c1",
      ...updateData
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("j1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(testIds[0]);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", [testIds[0]]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
