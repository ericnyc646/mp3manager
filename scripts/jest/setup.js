module.exports = async function setup() {
    // catch avoid unhandled promise warnings and stop tests execution
    try {
        console.log('setup');
    } catch (e) {
        throw new Error(e);
    }
};
