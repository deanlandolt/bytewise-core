var base = require('typewise-core/base')
var codecs = require('./codecs')

//
// extend core sorts defined by typewise with bytewise-specific functionality
//

// byte represents byte tag prefix in encoded form, enforcing binary total order
// type tag is 1 byte, which gives us plenty of room to grow

//
// boundary types
//
base.boundary.max.byte = 0x00
base.boundary.min.byte = 0xff

//
// value types
//
var sorts = base.sorts

//
// helper for defining nullary types
//
function nullary(config, value) {
  config.is = function (instance) {
    return instance === this.value
  }

  config.value = value
  return config
}

sorts.void.byte = 0xf0
nullary(sorts.void)

sorts.null.byte = 0x10
nullary(sorts.null, null)

sorts.boolean.sorts = {
  true: nullary({ byte: 0x21 }, true),
  false: nullary({ byte: 0x20 }, false)
}

sorts.boolean.boundary = {
  min: sorts.boolean.sorts.false,
  max: sorts.boolean.sorts.true
}

sorts.number.sorts = {
  positiveInfinity: nullary({ byte: 0x43 }, Number.POSITIVE_INFINITY),
  negativeInfinity: nullary({ byte: 0x40 }, Number.NEGATIVE_INFINITY),
  positive: {
    byte: 0x42,
    codec: codecs.POSITIVE_FLOAT,
    is: function (instance) {
      return instance >= 0
    }
  },
  negative: {
    byte: 0x41,
    codec: codecs.NEGATIVE_FLOAT,
    is: function (instance) {
      return instance < 0
    }
  }
}

sorts.number.boundary = {
  min: sorts.number.sorts.NEGATIVE_INFINITY,
  max: sorts.number.sorts.POSITIVE_INFINITY
}

sorts.date.sorts = {
  postEpoch: {
    byte: 0x52,
    // packed identically to a positive numbers
    codec: codecs.POST_EPOCH_DATE,
    is: function (instance) {
      return instance.valueOf() >= 0
    }
  },
  preEpoch: {
    byte: 0x51,
    // packed identically to a negative numbers
    codec: codecs.PRE_EPOCH_DATE,
    is: function (instance) {
      return instance.valueOf() < 0
    }
  }
}

sorts.date.boundary = {
  min: { byte: 0x50 },
  max: { byte: 0x53 }
}

sorts.binary.byte = 0x60
sorts.binary.codec = codecs.UINT8

sorts.binary.boundary = {
  max: { byte: 0x61 },
}

sorts.string.byte = 0x70
sorts.string.codec = codecs.UTF8

sorts.string.boundary = {
  max: { byte: 0x71 },
}

sorts.array.byte = 0xa0
sorts.array.codec = codecs.LIST

sorts.array.boundary = {
  max: { byte: 0xa1 },
}

sorts.object.byte = 0xb0
sorts.object.codec = codecs.HASH

sorts.object.boundary = {
  max: { byte: 0xb1 },
}

module.exports = base
