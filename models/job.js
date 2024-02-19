"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * */

  static async create({ title, salary, equity, companyHandle }) {

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          companyHandle
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * @param {Object} filters - An object containing the optional filters on the     findAll method
   * @param {string} [filter.name] - The title or partial title to filter by.
   * @param {number} [filter.minSalary] - The minimum salary.
   * @param {string} [filter.hasEquity] - Check if the job has any equity at all.
   * @returns {Array} - Returns an array of objects representing the jobs retrieved with or without filters.
   * 
   * */

  static async findAll({title, minSalary, hasEquity} = {}) {
    
    // Clause that will be constructed after being given available values.
    let filterClause = '';

    // Values that will be gathered base on filters.
    let values = [];

    if (title) {
      // The percent wrappers work with the LIKE action to accept partial matches.
      values.push(`%${title}%`);
      // The LOWER syntax is there to make the operation case-insensitive.
      // Finds jobs whose names are like the name at the dynamically generated index.
      filterClause += `LOWER(title) LIKE LOWER($${values.length}) AND `;
    }

    // If there is a minimum, push that value into the values array then add filtering to the query where the minimum salary must be equal to or greater than the inputed minimum. This inputed minimum is replaced by a placeholder in the query which will later be linked to its corresponding value in the values array.
    if (minSalary) {
      values.push(minSalary);
      filterClause += `salary >= $${values.length} AND `;
    }

    if (hasEquity) {
      filterClause += `equity > 0 AND `;
    }

    // The slice gets rid of the left over ' AND ' at the end of the filterClause.
    if (filterClause.length > 0) {
      filterClause = 'WHERE ' + filterClause.slice(0, -5);
    }

    // Actual query to get jobs based on the filter clause.
    const jobsRes = await db.query(
          `SELECT title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           ${filterClause}
           ORDER BY title`,
           values
    );


    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { title, salary, equity, companyHandle }
   *   where company is [{ handle, name, description, numEmployees, logoUrl }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    const companyRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
         FROM companies
         WHERE handle = $1`,
      [job.companyHandle]);

    job.companyHandle = companyRes.rows[0].handle;

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary,
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
