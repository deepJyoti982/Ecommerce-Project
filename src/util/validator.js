const { default: mongoose } = require("mongoose");


const isEmpty = function (value) {
    if (typeof value === 'undefined' || value === null) return true;
    if (typeof value === 'string' && value.trim().length === 0) return true;
    return false;
}


const isValidRequestBody = function (body) {
    if (Object.keys(body).length === 0) return false;
    return true;
}


const isValidPhone = function (number) {
    let phoneRegex = /^(?:(?:\+|0{0,2})91(\s*[\ -]\s*)?|[0]?)?[6789]\d{9}|(\d[ -]?){10}\d$/;
    return phoneRegex.test(number);
}


const isValidEmail = function (email) {
    let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    return emailRegex.test(email)
}

const isValidPassword = function (password) {
    let passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/
    return passwordRegex.test(password)
}

const isValidObjectId = function (ObjectId) {
    return mongoose.isValidObjectId(ObjectId)
}

const isValidPrice = function (price) {
    if((parseFloat(price) !== NaN) && isFinite(price)){
        return true;
    }
}

const isValidSize = function(size) {
    let sizeRegex = /^([A-Z]+((,)?([A-Z]+))*)+$/
    return sizeRegex.test(size)
}
    



module.exports = {
    isValidRequestBody,
    isEmpty,
    isValidPhone,
    isValidEmail,
    isValidPassword,
    isValidObjectId,
    isValidPrice,
    isValidSize
}