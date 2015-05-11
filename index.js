var assert = require('assert')
var base = require('./base')
var codecs = require('./codecs')

var bytewise = exports

//
// generate a buffer with type's byte prefix from source value
//
function serialize(type, source) {
  var byte = type.byte
  assert.ok(byte >= 0 && byte < 256, 'Invalid type byte prefix: ' + byte)

  var codec = type.codec
  if (!codec)
    return bytewise.postEncode(new Buffer([ byte ]))

  var buffer = codec.encode(source, bytewise)
  var hint = typeof codec.length === 'number' ? (codec.length + 1) : void 0 
  return bytewise.postEncode(Buffer.concat([ new Buffer([ byte ]), buffer ], hint))

}

//
// core encode logic
//
bytewise.encode = function(source, options) {
  //
  // check for invalid/incomparable values
  //
  assert.equal(base.invalid(source), false, 'Invalid value')

  //
  // encode boundary types
  //
  if (base.bound.upper.is(source))
    return serialize(base.bound.upper, source)

  if (base.bound.lower.is(source))
    return serialize(base.bound.lower, source)

  //
  // encode standard value-typed sorts
  //
  var sorts = base.sorts
  var order = base.order
  var sort
  for (var i = 0, length = order.length; i < length; ++i) {
    sort = sorts[order[i]]

    if (sort.is(source)) {
      //
      // loop over any subsorts defined on sort
      //
      var subsorts = sort.sorts ||  { '': sort } // TODO: clean up
      for (key in subsorts) {
        var subsort = subsorts[key]
        if (subsort.is(source)) 
          return serialize(subsort, source)
      }
      //
      // source is an unsupported subsort
      //
      assert.fail(source, sort, 'Unsupported sort value')
    }
  }

  //
  // no type descriptor found
  //
  assert.fail(source, null, 'Unknown value')
}

//
// core decode logic
//
bytewise.decode = function (buffer) {
  //
  // attempt to decode string input using configurable codec
  //
  if (typeof buffer === 'string')
    buffer = bytewise.stringCodec.encode(buffer)

  var byte = buffer[0]
  var type = bytewise.getType(byte)

  assert.ok(type, 'Invalid encoding: ' + buffer)

  //
  // if type provides a decoder it is passed the base type system as second arg
  //
  var codec = type.codec
  if (codec)
    return bytewise.postDecode(codec.decode(buffer.slice(1), bytewise))

  //
  // nullary types without a codec must provide a value for their decoded form
  //
  assert('value' in type, 'Unsupported encoding: ' + buffer)
  return bytewise.postDecode(type.value)
}


//
// invoked after encoding with encoded buffer instance
//
bytewise.postEncode = function (buffer) {

  //
  // override buffer string decoding to hex by default to help coercion issues
  //
  buffer.toString = function (encoding) {
    if (!encoding)
      return bytewise.stringCodec.decode(buffer)

    return Buffer.prototype.toString.apply(buffer, arguments)
  }

  return buffer
}

//
// invoked after decoding with decoded value
//
bytewise.postDecode = function (value) {
  return value
}


//
// registry mapping byte prefixes to type descriptors
//
var PREFIX_REGISTRY

function registerType(type) {
  var byte = type && type.byte
  if (byte == null)
    return

  if (byte in PREFIX_REGISTRY)
    assert.deepEqual(type, PREFIX_REGISTRY[byte], 'Duplicate prefix: ' + byte)

  PREFIX_REGISTRY[type.byte] = type
}

function registerTypes(types) {
  for (var key in types) {
    registerType(types[key])
  }
}

//
// look up type descriptor associated with a given byte prefix
//
bytewise.getType = function (byte) {
  //
  // construct and memoize byte prefix registry on first run
  //
  if (!PREFIX_REGISTRY) {
    PREFIX_REGISTRY = {}

    //
    // register boundary types
    //
    registerType(base.bound.upper)
    registerType(base.bound.lower)

    //
    // register sorts
    //
    var sorts = base.sorts
    var sort
    for (var key in sorts) {
      sort = sorts[key]
      //
      // if sort has subsorts register these instead
      //
      if (sort.sorts)
        registerTypes(sort.sorts)
      else
        registerType(sort)
    }
  }

  return PREFIX_REGISTRY[byte]
}

bytewise.buffer = true
bytewise.stringCodec = codecs.HEX
bytewise.type = 'bytewise-core'

//
// expose type information
//
bytewise.bound = base.bound
bytewise.sorts = base.sorts
bytewise.compare = base.compare
bytewise.equal = base.equal
