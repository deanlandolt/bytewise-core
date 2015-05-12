var bytewise = require('../')
var util = require('typewise-core/test/util')
var tape = module.exports = require('tape')

var ARRAY = bytewise.sorts.array
var STRING = bytewise.sorts.string

function eqHex(t, data, hex) {
  t.equal(bytewise.encode(data).toString('hex'), hex)
}

function decodeThrows(t, range) {
  t.throws(function () {
    bytewise.decode(bytewise.encode(range))
  }, 'cannot decode a range')
}

tape('lower bound', function (t) {
  var range = bytewise.bound.lower()
  eqHex(t, range, '00')
  decodeThrows(t, range)
  t.end()
})

tape('upper bound', function (t) {
  var range = bytewise.bound.upper()
  eqHex(t, range, 'ff')
  decodeThrows(t, range)
  t.end()
})

tape('lower bound in array', function (t) {
  eqHex(t, [ 'foo' ], 'a070666f6f0000')
  var range = [ 'foo', bytewise.bound.lower() ]
  eqHex(t, range, 'a070666f6f000000')
  decodeThrows(t, range)
  t.end()
})

tape('upper bound in array', function (t) {
  var range = [ 'foo', bytewise.bound.upper() ]
  eqHex(t, range, 'a070666f6f00ff00')
  decodeThrows(t, range)
  t.end()
})

// tape('lower bound on array prefix', function (t) {
//   var range = ARRAY.bound.lower([ 'foo' ])
//   var inArray = bytewise.encode([ 'foo', bytewise.bound.lower() ])
//   t.equal(range.toString('hex'), inArray.toString('hex').slice(0, -4))
//   decodeThrows(t, range)
//   t.end()
// })

// tape('upper bound on array prefix', function (t) {
//   var range = ARRAY.bound.upper([ 'foo' ])
//   var inArray = bytewise.encode([ 'foo', bytewise.bound.upper() ])
//   t.equal(range.toString('hex'), inArray.toString('hex').slice(0, -4))
//   decodeThrows(t, range)
//   t.end()
// })

tape('lower bound in nested array', function (t) {
  eqHex(t, [ 'foo', [ 'bar' ] ], 'a070666f6f00a070626172000000')
  var range = [ 'foo', [ 'bar', bytewise.bound.lower() ] ]
  eqHex(t, range, 'a070666f6f00a07062617200000000')
  decodeThrows(t, range)
  t.end()
})

tape('upper bound in nested array', function (t) {
  eqHex(t, [ 'foo', [ 'bar' ] ], 'a070666f6f00a070626172000000')
  var range = [ 'foo', [ 'bar', bytewise.bound.upper() ] ]
  eqHex(t, range, 'a070666f6f00a07062617200ff0000')
  decodeThrows(t, range)
  t.end()
})

tape('lower bound on string prefix', function (t) {
  eqHex(t, 'baz', '7062617a')
  var range = STRING.bound.lower('baz')
  eqHex(t, range, '7062617a00')
  // decodeThrows(t, range)
  t.end()
})

tape('upper bound on string prefix', function (t) {
  var range = STRING.bound.upper('baz')
  eqHex(t, range, '7062617aff')
  // decodeThrows(t, range)
  t.end()
})

tape('lower bound on nested string prefix', function (t) {
  eqHex(t, [ 'foo', [ 'bar', 'baz' ] ], 'a070666f6f00a070626172007062617a000000')
  var range = [ 'foo', [ 'bar', STRING.bound.lower('baz') ] ]
  // TODO: work through this more closely
  // eqHex(t, range, 'a070666f6f00a070626172007062617a00000000')
  eqHex(t, range, 'a070666f6f00a070626172007062617a000000')
  // decodeThrows(t, range)
  t.end()
})

tape('upper bound on nested string prefix', function (t) {
  var range = [ 'foo', [ 'bar', STRING.bound.upper('baz') ] ]
  // eqHex(t, range, 'a070666f6f00a070626172007062617aff000000')
  eqHex(t, range, 'a070666f6f00a070626172007062617aff0000')
  decodeThrows(t, range)
  t.end()
})
