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
  assert.equal(base.invalid(source), false, 'Invalid value')

  //
  // encode boundary types
  //
  if (base.boundary.HIGH.is(source))
    return serialize(base.boundary.HIGH, source)

  if (base.boundary.LOW.is(source))
    return serialize(base.boundary.LOW, source)

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
      var subsorts = sort.subtypes ||  { '': sort } // TODO: clean up
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
  // no sort descriptor found
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
  var sort = bytewise.getSort(prefix)

  assert.ok(sort, 'Invalid encoding: ' + buffer)

  //
  // if sort provides a decoder it is passed the base type system as second arg
  //
  var codec = sort.codec
  if (codec)
    return codec.decode(bops.subarray(buffer, 1), bytewise)

  //
  // nullary sorts without a codec must provide a value for their decoded form
  //
  assert('value' in sort, 'Unsupported encoding')
  return sort.value
}

var SORT_REGISTRY

function registerSort(sort) {
  var prefix = sort && sort.prefix
  if (!prefix)
    return
  if (prefix in SORT_REGISTRY)
    assert.deepEqual(sort, SORT_REGISTRY[prefix], 'Duplicate prefix: ' + prefix)

  SORT_REGISTRY[sort.prefix] = sort
}

function registerSorts(sorts) {
  for (var key in sorts) {
    registerSort(sorts[key])
  }
}

bytewise.getSort = function (prefix) {
  //
  // memoize byte prefixes on first run
  //
  if (!SORT_REGISTRY) {
    SORT_REGISTRY = {}

    //
    // register boundary types
    //
    registerSort(base.boundary.HIGH)
    registerSort(base.boundary.LOW)

    var sorts = base.sorts
    var sort
    for (var key in sorts) {
      sort = sorts[key]
      if (sort.subtypes)
        registerSorts(sort.subtypes)
      else
        registerSort(sort)
    }
  }

  return SORT_REGISTRY[prefix]
}

bytewise.buffer = true
bytewise.stringCodec = codecs.HEX
bytewise.type = 'bytewise-core'

//
// expose type information
//
bytewise.sorts = base.sorts
bytewise.compare = base.compare
bytewise.equal = base.equal
