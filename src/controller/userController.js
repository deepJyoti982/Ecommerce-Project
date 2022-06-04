const userModel = require("../model/userModel");
const aws = require("../aws/aws")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")


const {
    isValidRequestBody,
    isEmpty,
    isValidEmail,
    isValidPassword,
    isValidPhone,
    isValidObjectId
} = require("../util/validator");


const userRegister = async (req, res) => {
    try {
        const filesData = req.files
        const bodyData = req.body
        // console.log(filesData)

        if (!isValidRequestBody(bodyData)) return res.status(400).send({ status: false, msg: "Request body is empty!" })
        bodyData.address = JSON.parse(bodyData.address)
        var {
            fname,
            lname,
            email,
            phone,
            password,
            address
        } = bodyData;
        

        if (isEmpty(fname)) return res.status(400).send({ status: false, msg: "fname is required" })
        if (isEmpty(lname)) return res.status(400).send({ status: false, msg: "lname is required" })

        if (!isEmpty(email)) {
            if (!isValidEmail(email)) return res.status(400).send({ status: false, msg: `${email} is not a valid email Id` })
        } else return res.status(400).send({ status: false, msg: "email Id is required" })

        if (filesData.length == -1) return res.status(400).send({ status: false, msg: "profileImage is required" })

        if (!isEmpty(phone)) {
            if (!isValidPhone(phone)) return res.status(400).send({ status: false, msg: `${phone} is not a valid Indian phone number` })
        } else return res.status(400).send({ status: false, msg: "phone is required" })

        if (!isEmpty(password)) {
            if (!isValidPassword(password)) return res.status(400).send({ status: false, msg: "password should contain atleast one special character, one number, min length 8 and max length 15" })
        } else return res.status(400).send({ status: false, msg: "password is required" })

        if (!isEmpty(address)) {

            if (isEmpty(address.shipping)) return res.status(400).send({ status: false, msg: "shipping address is required" })
            if (isEmpty(address.shipping.street)) return res.status(400).send({ status: false, msg: "shipping street is required" })
            if (isEmpty(address.shipping.city)) return res.status(400).send({ status: false, msg: "shipping city is required" })
            if (isEmpty(address.shipping.pincode)) return res.status(400).send({ status: false, msg: "shipping pincode is required" })

            if (isEmpty(address.billing)) return res.status(400).send({ status: false, msg: "billing address is required" })
            if (isEmpty(address.billing.street)) return res.status(400).send({ status: false, msg: "billing street is required" })
            if (isEmpty(address.billing.city)) return res.status(400).send({ status: false, msg: "billing city is required" })
            if (isEmpty(address.billing.pincode)) return res.status(400).send({ status: false, msg: "billing pincode is required" })

        } else return res.status(400).send({ status: false, msg: "Address is required" })

        //===========😪😪DB calls to check unique fields😪😪===============

        if (await userModel.findOne({ email: email })) return res.status(400).send({ status: false, msg: "this email is already in use" })
        if (await userModel.findOne({ phone: phone })) return res.status(400).send({ status: false, msg: "this phone is already in use" })

        if (!(filesData && filesData.length > 0)) return res.status(400).send({ status: false, msg: "file (profile image) is a required field!" })
        // console.log(filesData[0])
        let uploadedFileURL = await aws.uploadFile(filesData[0])
        

        
        console.log(`${password}`)
        const newPassword = await bcrypt.hash(password, 10)
        console.log(`${newPassword}`)

        const creatUser = await userModel.create({
            fname,
            lname,
            email,
            profileImage: uploadedFileURL,
            phone,
            password: newPassword,
            address
        })

        if(!creatUser) return res.status( 503 ).send({status: false, message: "User registration faild!"})
        return res.status(201).send({ status: true, msg: "User registration successfull", data: creatUser })
    }
    catch (error) {
        res.status( 400 ).send({ msg: error.message })
    }
}



const userLogin = async (req,res) => {
    
    try {
        const loginData = req.body;


        if(!isValidRequestBody(loginData)) return res.status( 400 ).send({status: false, msg: "please provide login credentials!"})

        const {email,password} = loginData;

        if(isEmpty(email)) return res.status( 400 ).send({status: false, msg: "enter your email Id!"})
        if(!isValidEmail) return res.status( 400 ).send({status: false, msg: `${email} is not a valid email Id`})

        if(isEmpty(password)) return res.status( 400 ).send({status: false, msg: "enter your password"})
        if(!isValidPassword(password)) return res.status( 400 ).send({status: false, msg: "Invalid password"})

        const user = await userModel.findOne({email: email})
        if(!user) return res.status( 400 ).send({status: false, msg: "Invalid credentials"})

        const isMatch = await bcrypt.compare(password,user.password)
        // console.log(isMatch)

        if(isMatch == false) return res.status( 400 ).send({status: false, msg: "wrong password"})

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                batch: "Uranium",
                organisation: "FunctionUp",
                exp: Math.floor(Date.now() / 1000) + (60 * 60)
            },
            "functionUp-Uranium"
        )

        const data = {
            userId: user._id,
            token: token
        }

        res.status( 200 ).send({status: true, msg: "user login successfull", data})
    }
    catch(error) {
        res.status( 500 ).send({status: false, msg: error.message})
    }
}


const getUserProfile = async (req,res) => {

    try {
        const userParamsId = req.params.userId;
        const userTokenId = req.decodedToken.userId;

        
        if(!isValidObjectId(userParamsId)) return res.status( 400 ).send({status: false, msg: "userId in params is invalid"})

        if(userParamsId !== userTokenId) return res.status( 401 ).send({status: false, msg: "User authorisation failed!"})

        let userProfile = await userModel.findById({_id: userParamsId})
        res.status( 200 ).send({status: true, msg: "User profile details",data: userProfile})
    }
    catch(error) {
        res.status( 500 ).send({status: false, msg: error.message})
    }
}


const updateUserProfile = async (req,res) => {

    try {
        const userParamsId = req.params.userId;
        const userTokenId = req.decodedToken.userId;
        const updateBodyData = req.body;
        const updateFilesData = req.files;


        if(!isValidObjectId(userParamsId)) return res.status( 400 ).send({status: false, msg: "userId in params is invalid"})

        if(userParamsId !== userTokenId) return res.status( 401 ).send({status: false, msg: "User authorisation failed"})

        if(!isValidRequestBody(updateBodyData)) return res.status( 400 ).send({status: false, message: "request body is empty!"})
        
        const {
            fname,
            lname,
            email,
            phone,
            password,
            address
        } = updateBodyData

        const updateObj = {

        }

        if(fname) {
            if(isEmpty(fname)) return res.status( 400 ).send({status: false, message: "fname should not be empty!"})
            updateObj.fname = fname;
        }
        if(lname) {
            if(isEmpty(lname)) return res.status( 400 ).send({status: false, message: "lname should not be empty!"})
            updateObj.lname = lname
        }
        if(email) {
            let checkEmail = await userModel.findById({_id: userParamsId})
            if(email !== checkEmail.email) return res.status( 400 ).send({status: false, message: "you cannot change or modify your email Id once it registered!"})
            updateObj.email = checkEmail.email;

        }
        
        if(updateFilesData && updateFilesData.length > 0) {

            let uploadedFileURL = await uploadFile.uploadFile(updateFilesData[0])
            updateObj.profileImage = uploadedFileURL;
        }

        if(phone) {
            if(!isValidPhone) return res.status( 400 ).send({status: false, message: "please enter a valid Indian phone number"})
            updateObj.phone = phone
        }
        if(password) {
            if(!isValidPassword(password)) return res.status( 400 ).send({status: false, message: "password should contain atleast one special character, one number, min length 8 and max length 15"})
            updateObj.password = password;
        }
        if(address) {
            let address = JSON.parse(updateBodyData.address)

            if (isEmpty(address.shipping)) return res.status(400).send({ status: false, msg: "shipping address is required" })
            if (isEmpty(address.shipping.street)) return res.status(400).send({ status: false, msg: "shipping street is required" })
            if (isEmpty(address.shipping.city)) return res.status(400).send({ status: false, msg: "shipping city is required" })
            if (isEmpty(address.shipping.pincode)) return res.status(400).send({ status: false, msg: "shipping pincode is required" })

            if (isEmpty(address.billing)) return res.status(400).send({ status: false, msg: "billing address is required" })
            if (isEmpty(address.billing.street)) return res.status(400).send({ status: false, msg: "billing street is required" })
            if (isEmpty(address.billing.city)) return res.status(400).send({ status: false, msg: "billing city is required" })
            if (isEmpty(address.billing.pincode)) return res.status(400).send({ status: false, msg: "billing pincode is required" })

            updateObj.address = address;
        }


        const updated = await userModel.findByIdAndUpdate({_id: userParamsId}, {$set: updateObj}, {new: true})
        
        if(!updated) return res.status( 409 ).send({status: false, message: "The request could not be completed due to a conflict with the current state of the resource"})
        return res.status( 200 ).send({status: true, message: "User profile updated", data: updated})

    }
    catch(error) {
        res.status( 400 ).send({status: false, message: error.message})
        console.log(error)
    }
}




module.exports = { 
    userRegister,
    userLogin,
    getUserProfile,
    updateUserProfile
}