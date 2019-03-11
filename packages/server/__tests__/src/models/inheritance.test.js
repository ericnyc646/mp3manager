const { NoTableName, OkClass, Fields } = require('./classes');

describe('Inheritance tests', () => {
    it('verifies that the static methods are correctly working', () => {
        expect(() => NoTableName.getFields()).toThrowError(/You must implement/);
        expect(() => OkClass.getFields()).not.toThrow();

        expect(OkClass.getFields()).toEqual('d,e,f');
        expect(Fields.getFields()).toEqual('a,b,c');
        expect(Fields.getPlaceholders()).toEqual(':a,:b,:c');
        expect(Fields.getPlaceholders({ forUpdate: true })).toEqual('a=:a,b=:b,c=:c');
        expect(Fields.getValuesExpressions()).toEqual('a=VALUES(a),b=VALUES(b),c=VALUES(c)');
    });
});
