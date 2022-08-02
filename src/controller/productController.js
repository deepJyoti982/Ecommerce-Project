const productModel = require('../model/productModel');
const aws = require('../aws/aws');
const {
    isEmpty,
    isValidRequestBody,
    isValidObjectId,
    isValidEmail,
    isValidPassword,
    isValidPhone,
    isValidPrice,
    isValidSize
} = require('../util/validator');


const createProduct = async(req,res) => {

    try {
        const bodyData = req.body;
        const filesData = req.files;
        

        if(!isValidRequestBody(bodyData)) return res.status( 400 ).send({status: false, message: "Request body is empty!"})

        var {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments,
            deletedAt,
            isDeleted
        } = bodyData;
        
        if(isEmpty(description)) return res.status( 400 ).send({status: false, message: "Please provide a description!"})
        
        if(!isEmpty(price)) {
            if(!isValidPrice(price)) return res.status( 400 ).send({status: false, message: "Price should be in number or decimal value"})
        }else return res.status( 400 ).send({status: false, message: "Please provide product price"})

        if(!isEmpty(currencyId)) {
            if(currencyId !== "INR") return res.status( 400 ).send({status: false, message: "The currency Id should always 'INR'"})
        }else return res.status( 400 ).send({status: false, message: "Please provide currency Id"})

        if(!isEmpty(currencyFormat)) {
            if(currencyFormat !== "₹") return res.status( 400 ).send({status: false,message: "Invalid currency format"})
        }else return res.status( 400 ).send({status: false, message: "Currency format is required!"})

        if(!isEmpty(isFreeShipping)) {
            if(isFreeShipping !== (true || false)) return res.status( 400 ).send({status: false, message: "'isFeeShipping should true or false!'"})
        }

        if(!isEmpty(style)) {
            if(isNaN(style) !== true) return res.status( 400 ).send({status: false, message: "Style value should be in string"})
        }

        if(!isEmpty(availableSizes)) {
            let tempSizes = availableSizes.split(",")
            // console.log(availableSizes)
            // console.log(tempSizes)
            for(var i in tempSizes) {
                
                if(["S","XS","M","X","L","XXL","XL"].indexOf(tempSizes[i]) == -1) {
                    return res.status( 400 ).send({status: false, message: `'${tempSizes[i]}' is a invalid input!`})
                }
            }
            availableSizes = tempSizes;

        }

        if(!isEmpty(installments)) {
            if(isNaN(installments)) return res.status( 400 ).send({status: false, message: "Installments only takes number"})
        }

        // ==========DB calls==========
        if(!isEmpty(title)) {
            if(await productModel.findOne({title: title})) return res.status( 400 ).send({status: false, message: "title is already exist"})
        }else return res.status( 400 ).send({status: false, message: "Please provide a title"})


        if(! (filesData && filesData.length > 0)) return res.status( 400 ).send({status: false, message: "file (product image) is required"})
        
        let uploadedFileURL = await aws.uploadFile(filesData[0])
        

        const createProduct = await productModel.create({
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            productImage: uploadedFileURL,
            style,
            availableSizes,
            installments,
        })

        if(!createProduct) return res.status( 503 ).send({status: false, message: "Product creation failed!"})
        res.status( 201 ).send({status: true, message: "Product created successfully", data: createProduct})
    }
    catch(error) {
        res.status( 500 ).send({status: false, message: error.message})
        console.log(error)
    }
}



const getProducts = async(req,res) => {
    try {
        const filters = req.body;

        if(!isValidRequestBody(filters)) return res.status( 400 ).send({
            status: false, 
            message: "Use these following filters to get products: size,name,priceGreaterThan,priceLessThan"
        })

        const {
            size,
            name,
            priceGreaterThan,
            priceLessThan,
            priceSort
        } = filters;
        
        const filterObj = {
            isDeleted: false
        }

        if(size) {
            if(!isValidSize(size)) return res.status( 400 ).send({
                status: false,
                message: "enter sizes that is comma seperated and sizes should be in capital"
            })

            if(["S","XS","M","X","L","XXL","XL"].indexOf(size) == -1) return res.status( 400 ).send({
                status: false,
                message: `${size} is a invalid input`
            })
            filterObj.availableSizes = size;
        }

        if(name) {
            // { <field>: { $regex: /pattern/<options> } }
            filterObj.title = {$regex: new RegExp(name,"i")}
        }

        if(priceGreaterThan && priceLessThan || priceGreaterThan || priceLessThan) {
            if(priceGreaterThan && priceLessThan) {
                filterObj.price = {$gte: priceGreaterThan,$lte: priceLessThan}
            }
            if(priceGreaterThan) {
                filterObj.price = {$gte: priceGreaterThan}
            }
            if(priceLessThan) {
                filterObj.price = {$lte: priceLessThan}
            }
        }

        const srt = {}
        if(priceSort) {
            if(priceSort == 1 || priceSort == -1) {
                (priceSort > 0) ? srt.price = 1 : srt.price = -1
            }else return res.status( 400 ).send({status: false,message: "priceSort always should be '1' or '-1'"})
        }

        const findProduct = await productModel.find(filterObj).sort(srt)

        if(findProduct.length == 0) return res.status( 404 ).send({status: false,message: "No data match with your filter!"})
        res.status( 200 ).send({status: true,data: findProduct})
    }
    catch(error) {
        res.status( 500 ).send({status: false, message: error.message})
    }
}



const getProductsById = async(req,res) => {
    try {
        const productId = req.params.productId;
    

        if(!isValidObjectId(productId)) return res.status( 400 ).send({status: false,message: "product Id in params is invalid"})
    
        const findData = await productModel.findOne({$and: [{_id: productId},{isDeleted: false}] }) 
    
        if(!findData) return res.status( 404 ).send({status: false, message: "No data found"})
        res.status( 200 ).send({status: true, data: findData})
    }
    catch(error) {
        res.status( 400 ).send({status: false, message: error.message})
        console.log(error)
    }
}


const updateProductById = async(req,res) => {
    try {
        const productId = req.params.productId;
        const updateData = req.body;
        const files = req.files
        
    
    
        if(!isValidObjectId(productId)) return res.status( 400 ).send({status: false, message: "the product Id in params is invalid"})


        let checkDlt = await productModel.findById({_id: productId}).select({_id: 0, isDeleted: 1})
        if(checkDlt.isDeleted) return res.status( 400 ).send({status: false, message: "No product match with this product Id"})


        if(!isValidRequestBody(updateData)) return res.status( 400 ).send({status: false, message: "request body is empty"})

        const {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments
        } = updateData; // Objet destructuring😪

        const tempObj = {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments
        }   // Object for temporary uses🥱

        const tempArr = Object.keys(tempObj)
        
        for(var [key] of Object.entries(updateData)) {
            // console.log(`${key}`)
            if(tempArr.indexOf(`${key}`) == -1) return res.status( 400 ).send({
                status: false,
                message: `${key} it's not a appropriate field to modify, put proper field to perform update operation`
            })
            
        }


        const updateObj = {
            isDeleted: false
        }

        if(description) {
            if(!isEmpty(description)) {
                if(isNaN(description) !== true) return res.status( 400 ).send({status: false, message: "description should be in string"})
            } else return res.status( 400 ).send({status: false, message: "description key need some value"})
            updateObj.description = description;
        }


        if(price) {
            if(isEmpty(price)) return res.status( 400 ).send({status: false, message: "you cannot checked price key with empty value"})
            if(!isValidPrice(price)) return res.status( 400 ).send({status: false, message: "price should be in number or decimal value"})
            updateObj.price = price;
        }

        if(currencyId) return res.status( 400 ).send({status: false, message: "you cannot change or modify currency Id"})
        if(currencyFormat) return res.status( 400 ).send({status: false, message: "you cannot change or modify currency format"})

        if(isFreeShipping) {
// console.log(isFreeShipping)
            if(updateData.isFreeShipping == 'true' || updateData.isFreeShipping == 'false') return res.status(400).send({status: false,message: "isFreeShipping value should be true or false"})
            (updateData.isFreeShipping !== 'false') ? updateObj.isFreeShipping = true : updateObj.isFreeShipping = false
        }

        if(files && files.length > 0) {
            let productImageUrl = await aws.uploadFile(files[0])
            updateObj.productImage = productImageUrl;
        }

        if(style) {
            if(isEmpty(style)) return res.status( 400 ).send({status: false, message: "style key need some value"})
            if(isNaN(style) !== true) return res.status( 400 ).send({status: false, message:"style field only accept string value"})
            updateObj.style = style;
        }

        if(availableSizes) {
            if(isEmpty(availableSizes)) return res.status( 400 ).send({status: false, message: "availableSizes should't be empty if it's checked"})
            if(!isValidSize(availableSizes)) return res.status( 400 ).send({
                status: false,
                message: "Enter sizes that is comma seperated and sizes should be in capital"
            })

            let tempSizes = availableSizes.split(",")
            for(var i in tempSizes) {
                
                if(["S","XS","M","X","L","XXL","XL"].indexOf(tempSizes[i]) == -1) {
                    return res.status( 400 ).send({status: false, message: `'${tempSizes[i]}' is a invalid input!`})
                }
            }
            updateObj.availableSizes = tempSizes;
        }

        if(title) {
            if(isEmpty(title)) return res.status( 400 ).send({status: false, message: "please provide title value"})
            if(!isNaN(title)) return res.status( 400 ).send({status: false, message: "title only accept string value"})
            
            let findTitle = await productModel.find({_id: productId})
            for(var i in findTitle) {
                if(title == findTitle[i].title) return res.status( 400 ).send({status: false, message: "This title is already in use"})
            }

            updateObj.title = title
        }

        if(installments) {
            if(isNaN(installments) || installments % 1 !== 0) return res.status( 400 ).send({
                status: false, 
                message: "installments only accepts intiger value"
            }) 

            updateObj.installments = installments;
        }

        const updatedData = await productModel.findByIdAndUpdate({_id: productId}, {$set: updateObj}, {new: true})

        if(!updatedData) return res.status( 503 ).send({status: false, message: "Data not updated"})
        res.status( 200 ).send({status: true, message: "Product updated successfully", data: updatedData})
    }
    catch(error) {
        res.status( 400 ).send({status: false, message: error.message})
        console.log(error)
    }


}



const deleteProductById = async(req,res) => {
    try {
        const productId = req.params.productId;

        if(!isValidObjectId(productId)) return res.status( 400 ).send({status: false, message: "product Id in params is invalid"})

        let checkIsDelete = await productModel.findById({_id: productId}).select({isDeleted: 1, _id: 0})

        if(checkIsDelete.isDeleted == true) return res.status( 400 ).send({status: false, message: "No product match with this product Id"})

        let del = await productModel.findByIdAndUpdate({_id: productId}, {isDeleted: true}, {deletedAt: Date.now()})
        res.status(200).send({status: true, message: "deletion successfull",data: del})
        
    }
    catch(error) {
        res.status( 400 ).send({status: false, message: error.message})
        console.log(error)
    }
}



module.exports = {
    createProduct,
    getProducts,
    getProductsById,
    updateProductById,
    deleteProductById
}