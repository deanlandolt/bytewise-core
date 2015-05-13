var bytewise = require('../');
var compare = require('../util').compare
var tape = require('tape');
var util = require('typewise-core/test/util');

function toHex(buffer) {
  return buffer.toString('hex')
}

function push(prefix, levels) {
  sample.push(prefix)

  if (!levels--)
    return

  var i
  for (var i = 0; i <= 2; i++)
    push(prefix + toHex(Buffer([ i ])), levels)

  for (var i = 253; i <= 255; i++)
    push(prefix + toHex(Buffer([ i ])), levels)
}

var sample = []
push('', 3)
sample = sample.sort().map(function (s) {
  return Buffer(s, 'hex')
})

tape('buffers should round trip', function (t) {
  for (var i = 0; i < sample.length; i++) {
    var expected = sample[i]
    var result = bytewise.decode(bytewise.encode(expected))
    t.equal(toHex(result), toHex(expected))
  }
  t.end()
})

tape('nested buffers should round trip', function (t) {
  var result = bytewise.decode(bytewise.encode(sample))
  t.deepEqual(result.map(toHex), sample.map(toHex))
  t.end()
})

tape('buffers should sort correctly', function (t) {
  var result = sample.map(bytewise.encode)
    .sort(bytewise.compare)
    .map(bytewise.decode)

  t.deepEqual(result.map(toHex), sample.map(toHex))
  t.end()
})

tape('nested buffers should sort correctly', function (t) {
  var nested = sample.map(function (s) {
      return [ s ]
    })

  var result = nested.map(bytewise.encode)
    .sort(bytewise.compare)
    .map(bytewise.decode)

  t.deepEqual(result.map(toHex), nested.map(toHex))
  t.end()
})

tape('nested buffers should encode same as top level', function (t) {
  var value = Buffer('00ff01ff', 'hex')
  var result = bytewise.encode(value)
  var nested = bytewise.encode([ value ])
  //
  // slice off the array encoding components of nested value to compare
  //
  t.equal(nested.slice(1, -2).toString('hex'), result.toString('hex'))
  t.end()
})
