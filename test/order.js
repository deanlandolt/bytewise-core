var bytewise = require('../');
var typewise = require('typewise-core');
var util = require('typewise-core/test/util');
var test = require('tape');
var bops = require('bops');

var expected = [
  -4,
  -0.304958230,
  0,
  0.304958230,
  4,
  'bar',
  'baz',
  'foo',
  [ 0, 0, 'foo' ],
  [ 0, 1, 'foo' ],
  [ 0, 1, 'foo', 0 ],
  [ 0, 1, 'foo', 1 ],
  [ 0, 'bar', 'baz' ],
  [ 0, 'foo' ],
  [ 0, 'foo', 'bar' ],
  [ 0, 'foo', [] ],
  [ 0, 'foo', [ 'bar' ] ],
  [ 0, 'foo', [ 'bar' ], [] ],
  [ 0, 'foo', [ 'bar' ], [ 'foo' ] ],
  [ 0, 'foo', [ 'bar', 'baz' ] ],
  [ 1, 'bar', 'baz' ],
  [ 1, 'bar', 'baz' ],
  [ 'foo', 'bar', 'baz' ],
  [ 'foo', [ 'bar', 'baz' ] ],
  [ 'foo', [ 'bar', [ 'baz' ] ] ],
];

var shuffled = util.shuffle(expected.slice());

test('sorts in expected order', function (t) {
  t.equal(
    bops.to(bytewise.encode(shuffled.sort(typewise.compare)), 'hex'),
    bops.to(bytewise.encode(expected), 'hex')
  );
  t.end();
});

test('sorts with same order when encoded', function (t) {
  var decoded = shuffled
    .map(bytewise.encode)
    .sort(bytewise.compare)
    .map(bytewise.decode);

  t.equal(
    bops.to(bytewise.encode(decoded), 'hex'),
    bops.to(bytewise.encode(expected), 'hex')
  );
  t.end();
});
