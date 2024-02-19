const Test = require("supertest/lib/test");
const { sqlForPartialUpdate } = require("./sql");

describe('sqlForPartialUpdate', () => {
    test('Should make sql SET input and updated values', () => {
        const result = sqlForPartialUpdate({ name: 'Test name', numEmployees: 100 }, { numEmployees: num_employees });
        expect(result).toEqual({setCols: '"name"=$1, "num_employees"=$2', values: ['Test name', 100]})
    })
})