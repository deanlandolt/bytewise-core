var assert = require('assert')
var base = require('./base')
var codecs = require('./codecs')

var bytewise = exports

//
// expose type information
//
var bound = bytewise.bound = base.bound
var sorts = bytewise.sorts = base.sorts
bytewise.compare = base.compare
bytewise.equal = base.equal

//
// generate a buffer with type's byte prefix from source value
//
function serialize(type, source) {
  var codec = type.codec
  if (!codec)
    return bytewise.finalizeEncoding(new Buffer([ type.byte ]))

  var buffer = codec.encode(source, bytewise)
  var hint = typeof codec.length === 'number' ? (codec.length + 1) : void 0 
  var buffers = [ new Buffer([ type.byte ]), buffer ]
  return bytewise.finalizeEncoding(Buffer.concat(buffers, hint))
}

function initializeBound(buffer) {
  //
  // add some metadata to let the encoder know not to assert
  //
  buffer.undecodable = true
  return bytewise.finalizeEncoding(buffer)
}

//
// core encode logic
//
bytewise.encode = function(source, options) {
  //
  // check for invalid/incomparable values
  //
  assert(!base.invalid(source), 'Invalid value')

  //
  // encode bound types (ranges)
  //
  if (base.bound.type(source))
    return initializeBound(source.bound.encode(source))

  //
  // encode standard value-typed sorts
  //
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
      assert(false, 'Unsupported sort value')
    }
  }

  //
  // no type descriptor found
  //
  assert(false, 'Unknown value')
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

  assert(type, 'Invalid encoding: ' + buffer)

  //
  // if type provides a decoder it is passed the base type system as second arg
  //
  var codec = type.codec
  if (codec)
    return bytewise.finalizeDecoding(codec.decode(buffer.slice(1), bytewise))

  //
  // nullary types without a codec must provide a value for their decoded form
  //
  assert('value' in type, 'Unsupported encoding: ' + buffer)
  return bytewise.finalizeDecoding(type.value)
}


//
// invoked after encoding with encoded buffer instance
//
bytewise.finalizeEncoding = function (buffer) {

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
bytewise.finalizeDecoding = function (value) {
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
    // register sorts
    //
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

