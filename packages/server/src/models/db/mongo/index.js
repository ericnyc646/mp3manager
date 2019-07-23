// import _ from 'underscore';
const mongoose = require('mongoose');
const config = require('../../../config/getConfig');

/**
 * It bootstraps mongoose connection
 */
async function bootstrapMongoose() {
    const { dns, mongooseOptions, mongooseDebug } = config.db.mongo;

    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
    mongoose.set('debug', mongooseDebug);
    mongoose.Promise = global.Promise;

    return new Promise((resolve, reject) => {
        mongoose.connect(dns, mongooseOptions, (err) => {
            if (err) {
                return reject(err);
            }
        
            return resolve(true);
        });
    });
}

module.exports = bootstrapMongoose;
