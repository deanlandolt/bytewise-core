var bytewise = require('../');
var tape = module.exports = require('tape');

var sample = [
  'foo √',
  null,
  '',
  '💩 foo',
  new Date('2000-01-01T00:00:00Z'),
  42,
  undefined,
  [ undefined ],
  -1.1,
  // {},
  [],
  true,
  // { bar: 1 },
  // [ { bar: 1 }, { bar: [ 'baz' ] } ],
  -Infinity,
  false
]

var sorted = [
  null,
  false,
  true,
  -Infinity,
  -1.1,
  42,
  new Date('2000-01-01Z'),
  '',
  'foo √',
  '💩 foo',
  [],
  // [ { bar: 1 }, { bar: [ 'baz' ] } ],
  [ undefined ],
  // {},
  // { bar: 1 },
  undefined
]

tape('round trip and compare complex value', function (t) {
  var result = sample.map(bytewise.encode).map(bytewise.decode)
  t.deepEqual(result, sample)
  t.deepEqual(result, result.map(bytewise.encode).map(bytewise.decode))

  result = sample.map(bytewise.encode).sort(bytewise.compare).map(bytewise.decode)
  t.deepEqual(result, sorted)
  t.end()
})
