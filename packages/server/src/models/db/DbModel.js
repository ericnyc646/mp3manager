class DbModel {
    /**
     * It mimics an abstract Java class design pattern
     */
    constructor() {
        if (this.constructor === DbModel) {
            throw new TypeError('Cannot construct DbModel instances directly');
        }

        const { TABLE_NAME } = this.constructor;

        if (TABLE_NAME === undefined) {
            throw new TypeError('You must implement the static property TABLE_NAME');
        }
    }
}

module.exports = DbModel;
