const DbModel = require('../../../src/models/db/DbModel');

class NoTableName extends DbModel { }

class OkClass extends DbModel {
    static get TABLE_NAME() {
        return 'ok';
    }

    static get FIELDS() {
        return ['d', 'e', 'f'];
    }
}

class Fields extends DbModel {
    static get TABLE_NAME() {
        return 'ok';
    }

    static get FIELDS() {
        return ['a', 'b', 'c'];
    }
}

module.exports = {
    NoTableName,
    OkClass,
    Fields,
};
