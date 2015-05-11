var bytewise = require('../')
var util = require('typewise-core/test/util')
var tape = require('tape')

function eqHex(t, data, hex) {
  t.equal(bytewise.encode(data).toString('hex'), hex)
}

function decodeThrows(t, range) {
  t.throws(function () {
    bytewise.decode(bytewise.encode(range))
  }, 'cannot decode a range')
}

tape('lower bound', function (t) {
  var range = bytewise.bound.lower
  eqHex(t, range, '00')
  decodeThrows(t, range)
  t.end()
})

tape('upper bound', function (t) {
  var range = bytewise.bound.upper
  eqHex(t, range, 'ff')
  decodeThrows(t, range)
  t.end()
})

tape('lower bound in array', function (t) {
  eqHex(t, [ 'foo' ], 'a070666f6f0000')
  var range = [ 'foo', bytewise.bound.lower ]
  eqHex(t, range, 'a070666f6f000000')
  decodeThrows(t, range)
  t.end()
})

tape('upper bound in array', function (t) {
  var range = [ 'foo', bytewise.bound.upper ]
  decodeThrows(t, range)
  t.end()
})

// tape('lower bound on array', function (t) {
//   var range = bytewise.sort.array.bound.lower([ 'foo' ]))
//   var inArray = bytewise.encode([ 'foo', bytewise.bound.lower ])
//   t.equal(range.toString('hex'), inArray.toString('hex').slice(0, -4))
//   decodeThrows(t, range)
//   t.end()
// })

// tape('upper bound on array', function (t) {
//   var range = bytewise.sort.array.bound.upper([ 'foo' ]))
//   var inArray = bytewise.encode([ 'foo', bytewise.bound.upper ])
//   t.equal(range.toString('hex'), inArray.toString('hex').slice(0, -4))
//   decodeThrows(t, range)
//   t.end()
// })

tape('lower bound in nested array', function (t) {
  eqHex(t, [ 'foo', [ 'bar' ] ], 'a070666f6f00a070626172000000')
  var range = [ 'foo', [ 'bar', bytewise.bound.lower ] ]
  eqHex(t, range, 'a070666f6f00a07062617200000000')
  decodeThrows(t, range)
  t.end()
})

tape('upper bound in nested array', function (t) {
  eqHex(t, [ 'foo', [ 'bar' ] ], 'a070666f6f00a070626172000000')
  var range = [ 'foo', [ 'bar', bytewise.bound.upper ] ]
  eqHex(t, range, 'a070666f6f00a07062617200ff0000')
  decodeThrows(t, range)
  t.end()
})

// tape('lower bound on substring', function (t) {
//   var range = bytewise.encode(bytewise.sort.string.bound.lower('foo'))
//   // t.equal ...
//   decodeThrows(t, range)
//   t.end()
// })

// tape('lower bound on nested substring', function (t) {
//   var range = bytewise.encode([ 'foo', [ 'bar', bytewise.sort.string.bound.lower('foo') ] ])
//   // t.equal ...
//   decodeThrows(t, range)
//   t.end()
// })
