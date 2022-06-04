const { default: mongoose } = require("mongoose");


const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        trim: true,
        // validate: {
        //     validator: function(price) {
        //         return /^(0(?!\.00)|[1-9]\d{0,6})\.\d{2}$/.test(price)
        //     },message:'Invalid price', isAsync: false
        // }
    },
    currencyId: {
        type: String,
        required: true
    },
    currencyFormat: {
        type: String,
        required: true
    },
    isFreeShipping: {
        type: Boolean,
        default: false
    },
    productImage: {
        type: String,
        required: true
    },
    style: {
        type: String,
        trim: true
    },
    availableSizes: {
        type: ["String"],
        // required: true,
        enum: ["S","XS","M","X","L","XXL","XL"]
    },
    installments: {type: Number},
    deletedAt: {type: Date},
    isDeleted: {
        type: Boolean,
        default: false
    }
},{timestamps: true})


module.exports = mongoose.model('Product',productSchema)

// { 
//     title: {string, mandatory, unique},
//     description: {string, mandatory},
//     price: {number, mandatory, valid number/decimal},
//     currencyId: {string, mandatory, INR},
//     currencyFormat: {string, mandatory, Rupee symbol},
//     isFreeShipping: {boolean, default: false},
//     productImage: {string, mandatory},  // s3 link
//     style: {string},
//     availableSizes: {array of string, at least one size, enum["S", "XS","M","X", "L","XXL", "XL"]},
//     installments: {number},
//     deletedAt: {Date, when the document is deleted}, 
//     isDeleted: {boolean, default: false},
//     createdAt: {timestamp},
//     updatedAt: {timestamp},
//   }