var bops = require('bops')
var util = require('./')

var FLOAT_LENGTH = 8

function identity(value) {
  return value
}

function shortlexEncode(codec) {
  return function (source, base) {
    // stupid lazy implementation
    // TODO: allow length getter to be provided
    var length = util.encodeFloat(source.length)
    var body = codec.encode(source, base)
    return bops.join([ length, body ])
  }
}

function shortlexDecode(codec) {
  return function (buffer) {
    // stupid lazy implementation
    return codec.decode(this, bops.subarray(buffer, FLOAT_LENGTH))
  }
}

function shortlexParse(codec) {
  // TODO
  return function (buffer, base) {
    throw new Error('NYI')
  }
}

function shortlex(codec) {
  return {
    encode: shortlexEncode(codec),
    decode: shortlexDecode(codec),
    parse: shortlexParse(codec)
  }
}

//
// pairs of encode/decode functions
//
var codecs = exports

codecs.HEX = {
  encode: function (source) {
    return bops.from(source, 'hex')
  },
  decode: function (buffer) {
    return bops.to(buffer, 'hex')
  }
}

codecs.UINT8 = {
  encode: identity,
  decode: identity,
  escape: util.escapeFlat,
  unescape: util.unescapeFlat
}

codecs.UINT8_SHORTLEX = shortlex(codecs.UINT8)

codecs.UTF8 = {
  encode: function (source) {
    return bops.from(source, 'utf8')
  },
  decode: function (buffer) {
    return bops.to(buffer, 'utf8')
  },
  escape: util.escapeFlat,
  unescape: util.unescapeFlat
}

codecs.UTF8_SHORTLEX = shortlex(codecs.UTF8)

codecs.POSITIVE_FLOAT = {
  length: FLOAT_LENGTH,
  encode: util.encodeFloat,
  decode: util.decodeFloat
}

codecs.NEGATIVE_FLOAT = {
  length: FLOAT_LENGTH,
  encode: util.encodeFloat,
  decode: function (buffer) {
    return util.decodeFloat(buffer, null, true)
  }
}

codecs.POST_EPOCH_DATE = {
  length: FLOAT_LENGTH,
  encode: util.encodeFloat,
  decode: function (buffer) {
    return new Date(util.decodeFloat(buffer))
  }
}

codecs.PRE_EPOCH_DATE = {
  length: FLOAT_LENGTH,
  encode: util.encodeFloat,
  decode: function (buffer) {
    return new Date(util.decodeFloat(buffer, null, true))
  }
}

// base encoding for complex structures
codecs.LIST = {
  encode: util.encodeList,
  decode: util.decodeList
}

codecs.TUPLE = shortlex(codecs.LIST)

// member order is preserved and accounted for in collation (like in couchdb)
codecs.HASH = {
  encode: util.encodeHash,
  decode: util.decodeHash
}

codecs.RECORD = shortlex(codecs.HASH)
