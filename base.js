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

base.bound.encode = function (instance) {
  //
  // handle base bound types
  //
  return new Buffer([ instance.upper ? 0xff : 0x00 ])
}

//
// value types
//
var sorts = base.sorts

sorts.void.byte = 0xf0

sorts.null.byte = 0x10


var BOOLEAN = sorts.boolean

BOOLEAN.sorts.false.byte = 0x20
BOOLEAN.sorts.true.byte = 0x21


var NUMBER = sorts.number

NUMBER.sorts.min.byte = 0x40
NUMBER.sorts.negative.byte = 0x41
NUMBER.sorts.positive.byte = 0x42
NUMBER.sorts.max.byte = 0x43

NUMBER.sorts.negative.codec = codecs.NEGATIVE_FLOAT
NUMBER.sorts.positive.codec = codecs.POSITIVE_FLOAT


var DATE = sorts.date

DATE.sorts.negative.byte = 0x51
DATE.sorts.positive.byte = 0x52
DATE.sorts.negative.codec = codecs.PRE_EPOCH_DATE
DATE.sorts.positive.codec = codecs.POST_EPOCH_DATE


var BINARY = sorts.binary
BINARY.byte = 0x60
BINARY.codec = codecs.UINT8


var STRING = sorts.string
STRING.byte = 0x70
STRING.codec = codecs.UTF8

STRING.bound.encode = function (instance) {
  if (instance.value === undefined)
    return new Buffer([ instance.upper ? 0x71 : 0x70 ])

  return Buffer.concat([
    new Buffer([ STRING.byte ]),
    STRING.codec.encode(instance.value || ''),
    new Buffer([ instance.upper ? 0xff : 0x00 ])
  ])
}


var ARRAY = sorts.array
ARRAY.byte = 0xa0
ARRAY.codec = codecs.LIST

ARRAY.bound.encode = function (instance) {
  if (instance.value === undefined)
    return new Buffer([ instance.upper ? 0xa1 : 0xa0 ])

  var prefix = ARRAY.codec.encode(instance.value).slice(0, -1)
  if (instance.upper)
    return Buffer.concat([ prefix, new Buffer([ 0xff ]) ])

  return prefix
}


// var OBJECT = sorts.object
// OBJECT.byte = 0xb0
// OBJECT.codec = codecs.HASH

module.exports = base
