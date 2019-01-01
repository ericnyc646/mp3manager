module.exports = async function teardown() {
    // catch avoid unhandled promise warnings and stop tests execution
    try {
        console.log('teardown');
    } catch (e) {
        throw new Error(e);
    }
};
