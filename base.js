var base = require('typewise-core')
var codecs = require('./util/codecs')

//
// extend core sorts defined by typewise with bytewise-specific functionality
//

// prefix represents byte tag prefix in encoding, enforces binary total order
// type tag is 1 byte, which gives us plenty of room to grow

//
// boundary types
//
base.boundary.HIGH.prefix = 0x00
base.boundary.LOW.prefix = 0xff

//
// value types
//
var sorts = base.sorts

//
// helper for defining nullary types
//
function nullary(config) {
  config.is = function (instance) {
    return instance === this.value
  }
  return config
}

sorts.UNDEFINED.prefix = 0xf0
sorts.UNDEFINED.value = void 0
nullary(sorts.UNDEFINED)

sorts.NULL.prefix = 0x10
sorts.NULL.value = null
nullary(sorts.NULL)

sorts.BOOLEAN.sorts = {
  TRUE: nullary({
    prefix: 0x21,
    value: true
  }),
  FALSE: nullary({
    prefix: 0x20,
    value: false
  })
}

sorts.BOOLEAN.boundary = {
  LOW: sorts.BOOLEAN.sorts.FALSE,
  HIGH: sorts.BOOLEAN.sorts.TRUE
}

sorts.NUMBER.sorts = {
  POSITIVE_INFINITY: nullary({
    prefix: 0x43,
    value: Number.POSITIVE_INFINITY
  }),
  NEGATIVE_INFINITY: nullary({
    prefix: 0x40,
    value: Number.NEGATIVE_INFINITY
  }),
  POSITIVE: {
    prefix: 0x42,
    codec: codecs.POSITIVE_FLOAT,
    is: function (instance) {
      return instance >= 0
    }
  },
  NEGATIVE: {
    prefix: 0x41,
    codec: codecs.NEGATIVE_FLOAT,
    is: function (instance) {
      return instance < 0
    }
  }
}

sorts.NUMBER.boundary = {
  LOW: sorts.NUMBER.sorts.NEGATIVE_INFINITY,
  HIGH: sorts.NUMBER.sorts.POSITIVE_INFINITY
}

sorts.DATE.sorts = {
  POST_EPOCH: {
    prefix: 0x52,
    // packed identically to a positive numbers
    codec: codecs.POST_EPOCH_DATE,
    is: function (instance) {
      return instance.valueOf() >= 0
    }
  },
  PRE_EPOCH: {
    prefix: 0x51,
    // packed identically to a negative numbers
    codec: codecs.PRE_EPOCH_DATE,
    is: function (instance) {
      return instance.valueOf() < 0
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
