const getFixture = () => ({
    string: 'fixture',
    string2: 'fixture',
    number: 1337,
    object: {
        fixture: 'string',
        has: 'to',
        deep: ['equal', 'this', 1337],
        me: 1337
    },
    objectWithSameValues: {
        val1: 'fixture',
        val2: 'fixture',
        val3: 'fixture',
        val4: 'fixture',
    },
    array: ['fixture', { object: 'foo' }, 1337],
    negative: -1,
    zero: 0,
    one: 1,
    two: 2,
    three: 3
});

module.exports = getFixture();
module.exports.clone = getFixture;
