const { default: mongoose } = require("mongoose")


const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true,
        trim: true
    },
    lname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(email){
                return /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)
            },message:'Please provide a valid email address', isAsync:false
        }
    },
    profileImage: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(phone) {
                return /^(?:(?:\+|0{0,2})91(\s*[\ -]\s*)?|[0]?)?[6789]\d{9}|(\d[ -]?){10}\d$/.test(phone)
            },message: 'Please provide a valid Indian phone number', isAsync: false
        }
    },
    password: {
        type: String,
        required: true,
        min: 8,
        max: 15
    },
    address: {
        shipping: {
            street: {type: String, required: true, trim: true},
            city: {type: String, required: true, trim: true},
            pincode: {type: Number, required: true, trim: true}
        },
        billing: {
            street: {type: String, required: true, trim: true},
            city: {type: String, required: true, trim: true},
            pincode: {type: Number, required: true, trim: true}
        }
    }
},{timestamps: true})


// userSchema.pre("create", async function(next) {
//     if(this.isModified("password")) {
//         console.log(`${this.password}`)
//         this.password = await bcrypt.hash(this.password, 10)
//         console.log(`${this.password}`)
//     }
//     next();
// })


module.exports = mongoose.model('User',userSchema)

// { 
//     fname: {string, mandatory},
//     lname: {string, mandatory},
//     email: {string, mandatory, valid email, unique},
//     profileImage: {string, mandatory}, // s3 link
//     phone: {string, mandatory, unique, valid Indian mobile number}, 
//     password: {string, mandatory, minLen 8, maxLen 15}, // encrypted password
//     address: {
//       shipping: {
//         street: {string, mandatory},
//         city: {string, mandatory},
//         pincode: {number, mandatory}
//       },
//       billing: {
//         street: {string, mandatory},
//         city: {string, mandatory},
//         pincode: {number, mandatory}
//       }
//     },
//     createdAt: {timestamp},
//     updatedAt: {timestamp}
//   }