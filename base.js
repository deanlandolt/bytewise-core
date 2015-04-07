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
base.bound.upper.byte = 0x00
base.bound.lower.byte = 0xff

//
// value types
//
var sorts = base.sorts

sorts.void.byte = 0xf0

sorts.null.byte = 0x10

sorts.boolean.sorts.false.byte = 0x20
sorts.boolean.sorts.true.byte = 0x21


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

DATE.bound.lower.byte = 0x50
DATE.bound.upper.byte = 0x53


var BINARY = sorts.binary
BINARY.byte = 0x60
BINARY.codec = codecs.UINT8
BINARY.bound.upper = 0x61


var STRING = sorts.string
STRING.byte = 0x70
STRING.codec = codecs.UTF8
STRING.bound.upper.byte = 0x71


var ARRAY = sorts.array
ARRAY.byte = 0xa0
ARRAY.codec = codecs.LIST
ARRAY.bound.upper.byte = 0xa1


var OBJECT = sorts.object
OBJECT.byte = 0xb0
OBJECT.codec = codecs.HASH

OBJECT.bound.upper.byte = 0xb1

module.exports = base
