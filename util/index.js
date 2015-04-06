var assert = require('assert')
var bops = require('bops')

var util = exports

var FLOAT_LENGTH = 8

util.invertBytes = function (buffer) {
  var bytes = []
  for (var i = 0, end = buffer.length; i < end; ++i) {
    bytes.push(~buffer[i])
  }

  return bops.from(bytes)
}

util.encodeFloat = function (value) {
  var buffer = bops.create(FLOAT_LENGTH)
  if (value < 0) {
    //
    // write negative numbers as positive values with the byte inverted
    //
    bops.writeDoubleBE(buffer, -value.valueOf(), 0)
    return util.invertBytes(buffer)
  }

  //
  // normalize -0 values to 0
  //
  bops.writeDoubleBE(buffer, value.valueOf() || 0, 0)
  return buffer
}

util.decodeFloat = function (buffer, base, negative) {
  assert.equal(buffer.length, FLOAT_LENGTH, 'Invalid float encoding length')

  if (negative)
    buffer = util.invertBytes(buffer)

  var value = bops.readDoubleBE(buffer, 0)
  return negative ? -value : value
}

util.escapeFlat = function (buffer) {
  //
  // escape high and low bytes 0x00 and 0xff (and by necessity, 0x01 and 0xfe)
  //
  var b, bytes = []
  for (var i = 0, end = buffer.length; i < end; ++i) {
    b = buffer[i]

    //
    // escape low bytes with 0x01 and by adding 1
    //
    if (b === 0x01 || b === 0x00)
      bytes.push(0x01, b + 1)

    //
    // escape high bytes with 0xfe and by subtracting 1
    //
    else if (b === 0xfe || b === 0xff)
      bytes.push(0xfe, b - 1)

    //
    // no escapement needed
    //
    else
      bytes.push(b)
  }

  //
  // add end byte
  //
  bytes.push(0x00)
  return bops.from(bytes)
}

util.unescapeFlat = function (buffer) {
  var b, bytes = []
  // Don't escape last byte
  for (var i = 0, end = buffer.length; i < end; ++i) {
    b = buffer[i]

    //
    // if low-byte escape tag use the following byte minus 1
    //
    if (b === 0x01)
      bytes.push(buffer[++i] - 1)

    //
    // if high-byte escape tag use the following byte plus 1
    //
    else if (b === 0xfe)
      bytes.push(buffer[++i] + 1)

    //
    // no unescapement needed
    //
    else
      bytes.push(b)
  }
  return bops.from(bytes)
}

util.encodeList = function (source, base) {
  // TODO: pass around a map of references already encoded to detect cycles
  var buffers = []

  for (var i = 0, end = source.length; i < end; ++i) {
    var buffer = base.encode(source[i])
    var sort = base.getType(buffer[0])
    assert.ok(sort, 'List encoding failure: ' + buffer)

    //
    // sorts which need escapement when nested have an escape function on codec
    //
    if (sort.codec && sort.codec.escape)
      buffers.push(sort.codec.escape(buffer))

    else
      buffers.push(buffer)
  }

  //
  // close the list with an end byte
  //
  buffers.push(bops.from([ 0x00 ]))
  return bops.join(buffers)
}

util.decodeList = function (buffer, base) {
  var result = util.parse(buffer, base)

  assert.equal(result[1], buffer.length, 'Invalid encoding')
  return result[0]
}

util.encodeHash = function (source, base) {
  //
  // packs hash into an array, e.g. `[ k1, v1, k2, v2, ... ]`
  //
  var list = []
  Object.keys(source).forEach(function(key) {
    list.push(key)
    list.push(source[key])
  })
  return util.encodeList(list, base)
}

util.decodeHash = function (buffer, base) {
  var list = util.decodeList(buffer, base)
  var hash = Object.create(null)

  for (var i = 0, end = list.length; i < end; ++i) {
    hash[list[i]] = list[++i]
  }

  return hash
}

//
// base parser for nested/recursive sorts
//
util.parse = function (buffer, base, sort) {
  //
  // parses and returns the first sort on the buffer and total bytes consumed
  //
  var codec = sort && sort.codec
  var index, end

  //
  // nullary
  //
  if (sort && !codec) 
    return [ base.decode(bops.from([ sort.byte ])), 0 ]

  //
  // custom parse implementation provided by sort
  //
  if (codec && codec.parse)
    return codec.parse(buffer, base, sort)

  //
  // fixed length sort, decode fixed bytes
  //
  var length = codec && codec.length
  if (typeof length === 'number')
    return [ codec.decode(bops.subarray(buffer, 0, length)), length ]

  //
  // escaped sort, seek to end byte and unescape
  //
  if (codec && codec.unescape) {
    for (index = 0, end = buffer.length; index < end; ++index) {
      if (buffer[index] === 0x00)
        break
    }

    assert(index < buffer.length, 'No closing byte found for sequence')
    var unescaped = codec.unescape(bops.subarray(buffer, 0, index))

    //
    // add 1 to index to account for closing tag byte
    //
    return [ codec.decode(unescaped), index + 1 ]
  }

  //
  // recursive sort, resolve each item iteratively
  //
  index = 0
  var list = []
  var next
  while ((next = buffer[index]) !== 0x00) {
    sort = base.getType(next)
    var result = util.parse(bops.subarray(buffer, index + 1), base, sort)
    list.push(result[0])

    //
    // offset current index by bytes consumed (plus a byte for the sort tag)
    //
    index += result[1] + 1
    assert(index < buffer.length, 'No closing byte found for nested sequence')
  }

  //
  // return parsed list and bytes consumed (plus a byte for the closing tag)
  //
  return [ list, index + 1 ]
}
