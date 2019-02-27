const DbModel = require('../../../src/models/db/DbModel');

class NoTableName extends DbModel { }

class OkClass extends DbModel {
    static get TABLE_NAME() {
        return 'ok';
    }
}

module.exports = {
    NoTableName,
    OkClass,
};
