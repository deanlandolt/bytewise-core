'use strict'

var assert = require('assert')
var bops = require('bops')
var base = require('./base')
var codecs = require('./util/codecs')

var bytewise = exports


// TODO: figure out how to do proper subclassing with bops
function patchBuffer(buffer) {
  //
  // override buffer string decoding when no encoding explicitly specified
  //
  buffer.toString = function (encoding) {
    if (!encoding)
      return bytewise.stringCodec.decode(buffer)

    return Buffer.prototype.toString.apply(buffer, arguments)
  }

  return buffer
}

//
// generate a buffer with type prefix from source value
//
function serialize(type, source) {
  var prefix = type.prefix
  assert.ok(prefix >= 0 && prefix < 256, 'Invalid type prefix: ' + prefix)

  var codec = type.codec
  if (!codec)
    return patchBuffer(bops.from([ prefix ]))

  var buffer = codec.encode(source, bytewise)
  var hint = typeof codec.length === 'number' ? (codec.length + 1) : void 0 
  return patchBuffer(bops.join([ bops.from([ prefix ]), buffer ], hint))

}

//
// core encode logic
//
bytewise.encode = function(source) {
  //
  // check for invalid/incomparable values
  //
  assert.equal(base.incomparable.is(source), false, 'Invalid value')

  //
  // encode boundary types
  //
  var types = base.boundary.types
  var type
  for (var key in types) {
    type = types[key]
    if (type.is(source))
      return serialize(type, source)
  }

  //
  // encode standard value types
  //
  types = base.types
  var order = base.order
  for (var i = 0, length = order.length; i < length; ++i) {
    type = types[order[i]]

    if (type.is(source)) {
      //
      // loop over any subtypes defined on type
      //
      var subtypes = type.subtypes ||  { '': type } // TODO: clean up
      for (key in subtypes) {
        var subtype = subtypes[key]
        if (subtype.is(source)) 
          return serialize(subtype, source)
      }
      //
      // source is an unsupported subtype
      //
      assert.fail(source, type, 'Unsupported subtype value')
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

  var prefix = buffer[0];
  var type = bytewise.getType(prefix)

  assert.ok(type, 'Invalid encoding: ' + buffer)

  //
  // if type provides a decoder it is passed the base type system as second arg
  //
  var codec = type.codec
  if (codec)
    return codec.decode(bops.subarray(buffer, 1), bytewise)

  //
  // nullary types without a codec must provide a value for their decoded form
  //
  assert('value' in type, 'Unsupported encoding')
  return type.value
}

var PREFIX_MAP

function addPrefixes(target, types) {
  var key, type, prefix
  for (key in types) {
    type = types[key]
    prefix = type && type.prefix
    if (prefix) {
      if (prefix in target)
        assert.strictEqual(type, target[prefix], 'Duplicate prefix: ' + prefix)

      target[type.prefix] = type
    }
  }
}

bytewise.getType = function (prefix) {
  //
  // memoize prefix map on first run
  //
  if (!PREFIX_MAP) {
    PREFIX_MAP = {}
    addPrefixes(PREFIX_MAP, base.boundary.types)
    var types = base.types
    var type
    for (var key in types) {
      type = types[key]
      addPrefixes(PREFIX_MAP, type.subtypes || { '': type })
    }
  }

  return PREFIX_MAP[prefix]
}

bytewise.buffer = true
bytewise.stringCodec = codecs.HEX
bytewise.type = 'bytewise-core'

//
// expose type information
//
bytewise.types = base.types
bytewise.compare = base.compare
bytewise.equal = base.equal
