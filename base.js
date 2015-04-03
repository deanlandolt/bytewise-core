var base = require('typewise-core')
var codecs = require('./util/codecs')

//
// extend core sorts defined by typewise with bytewise-specific functionality
//

function _thisValue(source) {
  return source === this.value
}

// prefix represents byte tag prefix in encoding, enforces binary total order
// type tag is 1 byte, which gives us plenty of room to grow
// we leave some space between the various sorts for possible future extensions

// value types without a `codec` property are nullary
// a `codec` should contain an encode and decode function
// a `codec` may also contain a `length` value indicating a fixed encoding size

//
// boundary types
//
base.boundary.HIGH.prefix = 0x00
base.boundary.LOW.prefix = 0xff

//
// value types
//
var sorts = base.sorts

sorts.UNDEFINED.prefix = 0xf0
sorts.UNDEFINED.value = void 0

sorts.NULL.prefix = 0x10
sorts.NULL.value = null

sorts.BOOLEAN.subtypes = {
  TRUE: {
    prefix: 0x21,
    value: true,
    is: _thisValue
  },
  FALSE: {
    prefix: 0x20,
    value: false,
    is: _thisValue
  }
}

sorts.BOOLEAN.boundary = {
  LOW: sorts.BOOLEAN.subtypes.FALSE,
  HIGH: sorts.BOOLEAN.subtypes.TRUE
}

sorts.NUMBER.subtypes = {
  POSITIVE_INFINITY: {
    prefix: 0x43,
    value: Number.POSITIVE_INFINITY,
    is: _thisValue
  },
  NEGATIVE_INFINITY: {
    prefix: 0x40,
    value: Number.NEGATIVE_INFINITY,
    is: _thisValue
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

sorts.BOOLEAN.boundary = {
  LOW: sorts.NUMBER.subtypes.NEGATIVE_INFINITY,
  HIGH: sorts.NUMBER.subtypes.POSITIVE_INFINITY
}

sorts.DATE.subtypes = {
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

sorts.DATE.boundary = {
  LOW: { prefix: 0x50 },
  HIGH: { prefix: 0x53 }
}

sorts.BINARY.prefix = 0x60
sorts.BINARY.codec = codecs.UINT8

sorts.BINARY.boundary = {
  HIGH: { prefix: 0x61 },
}

sorts.STRING.prefix = 0x70
sorts.STRING.codec = codecs.UTF8

sorts.STRING.boundary = {
  HIGH: { prefix: 0x71 },
}

sorts.ARRAY.prefix = 0xa0
sorts.ARRAY.codec = codecs.LIST

sorts.ARRAY.boundary = {
  HIGH: { prefix: 0xa1 },
}

sorts.OBJECT.prefix = 0xb0
sorts.OBJECT.codec = codecs.HASH

sorts.OBJECT.boundary = {
  HIGH: { prefix: 0xb1 },
}

module.exports = base
