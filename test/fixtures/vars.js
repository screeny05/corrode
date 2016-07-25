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
    arrayWithSameValues: ['fixture', 'fixture', 'fixture', 'fixture'],
    array: ['fixture', { object: 'foo' }, 1337],
    objectArray: [{ id: 1, name: 'foobar' }, { id: 2, name: 'lorem' }, { id: 2, name: 'ipsum' }, { id: 4, name: 'quxbaz' }],
    negative: -1,
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    id: 4,
    untrimmed: '\r\nfoobar  ',
    trimmed: 'foobar',
    bitmask1: 0b10000000,
    bitmask2: 0b01000000,
    bitmaskMatch: 0b10111110
});

module.exports = getFixture();
module.exports.clone = getFixture;
