const DbModel = require('../../../src/models/db/DbModel');
const { NoTableName, OkClass } = require('./fakeClasses');

describe('Inheritance tests', () => {
    it('verifies that a DbModel instance cannot be created', () => {
        expect(() => new DbModel()).toThrowError(/Cannot construct DbModel/);
        expect(() => new NoTableName()).toThrowError(/You must implement/);
        expect(() => new OkClass()).not.toThrow();
    });
});
