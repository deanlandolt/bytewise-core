var base = require('typewise-core/base')
var codecs = require('./util/codecs')

//
// extend core types defined by typewise with bytewise-specific functionality
//

function thisValue(source) {
  return source === this.value
}

// prefix represents byte tag prefix in encoding, enforces binary total order
// type tag is 1 byte, which gives us plenty of room to grow
// we leave some space between the various types for possible future extensions

// value types without a `codec` property are nullary
// a `codec` should contain an encode and decode function
// a `codec` may also contain a `length` value indicating a fixed encoding size

//
// boundary types
//
base.boundary.types.TOP.prefix = 0xff

base.boundary.types.BOTTOM.prefix = 0x00

//
// value types
//
var types = base.types

types.UNDEFINED.prefix = 0xf0
types.UNDEFINED.value = void 0

types.NULL.prefix = 0x10
types.NULL.value = null

types.BOOLEAN.subtypes = {
  TRUE: {
    prefix: 0x21,
    value: true,
    is: thisValue
  },
  FALSE: {
    prefix: 0x20,
    value: false,
    is: thisValue
  }
}

types.NUMBER.subtypes = {
  POSITIVE_INFINITY: {
    prefix: 0x43,
    value: Number.POSITIVE_INFINITY,
    is: thisValue
  },
  NEGATIVE_INFINITY: {
    prefix: 0x40,
    value: Number.NEGATIVE_INFINITY,
    is: thisValue
  },
  POSITIVE: {
    prefix: 0x42,
    codec: codecs.POSITIVE_FLOAT,
    is: function (source) {
      return source >= 0
    }
  },
  NEGATIVE: {
    prefix: 0x41,
    codec: codecs.NEGATIVE_FLOAT,
    is: function (source) {
      return source < 0
    }
  }
}

types.DATE.subtypes = {
  POST_EPOCH: {
    prefix: 0x52,
    // packed identically to a positive numbers
    codec: codecs.POST_EPOCH_DATE,
    is: function (source) {
      return source.valueOf() >= 0
    }
  },
  PRE_EPOCH: {
    prefix: 0x51,
    // packed identically to a negative numbers
    codec: codecs.PRE_EPOCH_DATE,
    is: function (source) {
      return source.valueOf() < 0
    }
  }
}

types.BUFFER.prefix = 0x60
types.BUFFER.codec = codecs.BINARY

types.STRING.prefix = 0x70
types.STRING.codec = codecs.UTF8

types.ARRAY.prefix = 0xa0
types.ARRAY.codec = codecs.LIST

types.OBJECT.prefix = 0xb0
types.OBJECT.codec = codecs.HASH

module.exports = base
