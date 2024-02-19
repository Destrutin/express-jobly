"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * @param {Object} filters - An object containing the optional filters on the     findAll method
   * @param {string} [filter.name] - The name or partial name to filter by.
   * @param {number} [filter.minEmployees] - The minimum number of employees.
   * @param {number} [filter.maxEmployees] - The maximum number of employees.
   * @returns {Array} - Returns an array of objects representing the companies retrieved with or without filters.
   * 
   * */

  static async findAll({name, minEmployees, maxEmployees} = {}) {
    if (minEmployees && maxEmployees && minEmployees > maxEmployees) {
      throw new BadRequestError('The minimum number of employees cannot be greater than the maximum number of employees');
    }

    // Clause that will be constructed after being given available values.
    let filterClause = '';

    // Values that will be gathered base on filters.
    let values = [];

    if (name) {
      // The percent wrappers work with the LIKE action to accept partial matches.
      values.push(`%${name}%`);
      // The LOWER syntax is there to make the operation case-insensitive.
      // Finds companies whose names are like the name at the dynamically generated index.
      filterClause += `LOWER(name) LIKE LOWER($${values.length}) AND `;
    }

    // If there is a minimum, push that value into the values array then add filtering to the query where the num of employees must be equal to or greater than the inputed minimum. This inputed minimum is replaced by a placeholder in the query which will later be linked to its corresponding value in the values array.
    if (minEmployees) {
      values.push(minEmployees);
      filterClause += `num_employees >= $${values.length} AND `;
    }

    if (maxEmployees) {
      values.push(maxEmployees);
      filterClause += `num_employees <= $${values.length} AND `;
    }

    // The slice gets rid of the left over ' AND ' at the end of the filterClause.
    if (filterClause.length > 0) {
      filterClause = 'WHERE ' + filterClause.slice(0, -5);
    }

    // Actual query to get companies based on the filter clause.
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ${filterClause}
           ORDER BY name`,
           values
    );


    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
        FROM companies
        WHERE handle = $1`,
    [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    const jobsRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity
       FROM jobs
       WHERE company_handle = $1`,
    [handle]);

    company.jobs = jobsRes.rows;

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
