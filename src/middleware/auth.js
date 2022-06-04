const jwt = require("jsonwebtoken")
const validator = require("../util/validator")

const authenticate = (req,res,next) => {
    
    try {
        
        const bearerToken = req.headers.authorization;

        // console.log(bearerToken)
        
        if(validator.isEmpty(bearerToken)) return res.status( 400 ).send({status: false, msg: "token is required"})
        
        jwt.verify(bearerToken.split(" ")[1], 'functionUp-Uranium', (err, decode) => {
            if (err) {
                return res.status( 401 ).send({
                    status: false, 
                    msg: err.message
                })
            }else {
                req.decodedToken = decode
                next()
            }
        
        })
    
    }
    catch(error) {
        res.status( 500 ).send({status: false, msg: error.message})
    }
    
}



module.exports = {authenticate}