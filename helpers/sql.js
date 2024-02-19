const { BadRequestError } = require("../expressError");

/**
 * Helper to deliver a SET input for partial updating.
 * 
 * @param {Object} dataToUpdate - Object where keys represent the column name to be updated and the values represent the updated values to be input.
 * @param {Object} jsToSql - Object that maps Js variable name to the equivalent column name.
 * @returns {Object} - Object containing a string representing the SET input and an array of updated values. 
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
