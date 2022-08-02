const cartModel = require("../model/cartModel");
const productModel = require("../model/productModel")
const {
    isValidRequestBody,
    isEmpty,
    isValidPhone,
    isValidEmail,
    isValidPassword,
    isValidObjectId,
    isValidPrice,
    isValidSize
} = require("../util/validator");


const createCart = async (req, res) => {
    try {
        const userIdParams = req.params.userId;
        const userIdToken = req.decodedToken.userId;
        const reqBody = req.body;
        // console.log(userIdParams,userIdToken)


        // if (isEmpty(userIdParams)) return res.status(400).send({ status: false, message: "Put user Id in params" })
        if (!isValidObjectId(userIdParams)) return res.status(400).send({ status: false, message: "User Id in params is invalid" })


        if (userIdParams !== userIdToken) return res.status(400).send({ status: false, message: "User authorization failed!" })


        if (isEmpty(reqBody)) return res.status(400).send({ status: false, message: "request body is invalid" })

        reqBody.items = JSON.parse(reqBody.items) //Converting the string input into object🐱‍🏍🐱‍🏍🐱‍🏍🐱‍🏍😍

        const {
            items,
            cartId //There is no requirement of cart id if we use userId to find the cart...so I'am not working with cart Id😈
        } = reqBody;


        if (!isEmpty(items)) {

            if (isEmpty(items.productId)) return res.status(400).send({ status: false, message: "product Id is required" })
            if (isEmpty(items.quantity)) return res.status(400).send({ status: false, message: "Quantity is required" })
            if (items.quantity == 0) return res.status(400).send({ status: false, message: "Product cannot be added with 0 quantity" })

        } else return res.status(400).send({ status: false, message: "put items details in request body" })



        var reqProductId = reqBody.items.productId;
        var reqQuantity = reqBody.items.quantity;

        if (!isValidObjectId(reqProductId)) return res.status(400).send({ status: false, message: "product Id is invalid" })

        let findProduct = await productModel.findOne({ $and: [{ _id: reqProductId }, { isDeleted: false }] })

        if (!findProduct) return res.status(404).send({ status: false, message: "No product is present with this product Id" })

        const isCartPresent = await cartModel.findOne({ userId: userIdParams })

        // If cart present for the specific User then it will increment(update) the cart with new cart request🤩🤩🤩🤗🤗🤗🤩🤩🤩
        if (isCartPresent) {
            var itemsArr = isCartPresent.items;
            var flag = 0;
            for (var i in itemsArr) {
                if (itemsArr[i].productId == reqProductId) {

                    isCartPresent.items[i].quantity += reqQuantity;
                    flag = 1;
                }
            }
            if(flag !== 1) {

                isCartPresent.items.push(reqBody.items)
                isCartPresent.totalItems ++;
            }

            isCartPresent.totalPrice += findProduct.price * reqQuantity
            await isCartPresent.save();
            return res.status(200).send({ status: true, message: "Item added to cart successfully", data: isCartPresent })
        }

        //If cart not present for the specific User then only this block execute and create a new cart altogether🤩🤩🤩🤗🤗🤗🤩🤩🤩
        const createCart = await cartModel.create({
            userId: userIdParams,
            items: [reqBody.items],
            totalPrice: findProduct.price * reqQuantity,
            totalItems: 1
        })
        res.status(200).send({ status: true, message: "Cart created and item added successfully", data: createCart })

    }
    catch (error) {
        res.status(400).send({ status: false, message: error.message })
        console.log(error)
    }

}



const updateCart = async(req,res) => {
    try {
        const userIdParams = req.params.userId;
        const userIdToken = req.decodedToken.userId;
        const reqBody = req.body;

        if(isEmpty(userIdParams)) return res.status( 400 ).send({status: false, message: "Put user Id in params"})
        if(!isValidObjectId(userIdParams)) return res.status( 400 ).send({status: false, message: "User Id in params is invalid"})

        if(isEmpty(reqBody)) return res.status( 400 ).send({status: false, message: "Invalid request body"})

        const {
            cartId,
            productId,
            removeProduct
        } = reqBody;

        if(!isEmpty(cartId)) {
            if(!isValidObjectId(cartId)) return res.status( 400 ).send({status: false, message: "This cart Id is invalid"})
        }else return res.status( 400 ).send({status: false,  message: "Put cart Id in request body"})

        if(!isEmpty(productId)) {
            if(!isValidObjectId(productId)) return res.status( 400 ).send({status: false, message: "This product Id is Invalid"})
        }else return res.status( 400 ).send({status: false, message: "Put product Id in request body"})

        if(!isEmpty(removeProduct)) {
            if(isNaN(removeProduct) || removeProduct % 1 !== 0) return res.status( 400 ).send({
                status: false,
                message: "removeProduct only accept integer value & that should be either 0 or 1"
            })
        }else return res.status( 400 ).send({status: false, message: "You need to include removeProduct in request body"})


        if(userIdParams !== userIdToken) return res.status( 400 ).send({status: false, message: "Unauthorised user"})

        const isProductFound = await productModel.findById({_id: productId});
        const isCartFound = await cartModel.findById({_id: cartId});

        if(!isCartFound) return res.status( 404 ).send({status: false, message: "No cart is present with this cart Id"})

        //--------------------------------🐱‍🏍🐱‍🏍🐱‍🏍🐱‍🏍🐱‍🏍🐱‍🏍🐱‍🏍🐱‍🏍🐱‍🏍🐱‍🏍🐱‍🏍🐱‍🏍🐱‍🏍🐱‍🏍🐱‍🏍🐱‍🏍🐱‍🏍----------------------------------//
        
        var itemsArr = isCartFound.items;
        if(itemsArr.length == 0) return res.status( 404 ).send({status: false, message: "This cart is empty"})
        
        var flag = 0;
        for(var i in itemsArr) {
            if(itemsArr[i].productId == productId) {
                
                if(removeProduct == 1 && isCartFound.items[i].quantity !== 1) {
                
                    isCartFound.items[i].quantity -= removeProduct;
                    isCartFound.totalPrice -= isProductFound.price;
                    flag = 1;
                }else {

                    isCartFound.totalItems -= 1;                                                    //[Line no 158 & 159 need to be define before splice otherwise it will give this
                    isCartFound.totalPrice -= isProductFound.price * isCartFound.items[i].quantity; // error(Cannot read properties of undefined (reading 'quantity')) coz after splice quantity will o longer exist]
                    isCartFound.items.splice(isCartFound.items[i],1)                                
                    flag = 1;
                }

            }
            
        }
        if(flag == 0) {
            return res.status( 400 ).send({status: false, message: "No such product is present in cart with the specific product Id"})
        }

        await isCartFound.save();
        res.status( 200 ).send({status: false, message: "Cart updated successfully", data: isCartFound})
        // Done with this handler😪😴😴
    }
    catch(error) {
        res.status( 400 ).send({status: false, message: error.message})
        console.log(error)
    }
}



const getCart = async(req,res) => {
    try {
        const userIdParams = req.params.userId;
        const userIdToken = req.decodedToken.userId
        // console.log(userIdParams,userIdToken)

        if(!isValidObjectId(userIdParams)) return res.status( 400 ).send({status: false, message: "UserId in params invalid"})
        if(userIdParams !== userIdToken) return res.status( 400 ).send({status: false, message: "User authorization faile!"})

        const isCartFound = await cartModel.findOne({userId: userIdParams})
        if(!isCartFound) return res.status( 404 ).send({status: false, message: "No cart found with this user Id"})

        res.status( 200 ).send({status: true, message: "Success", data: isCartFound})
    }
    catch( error ) {
        res.status( 400 ).send({status: false, message: error.message})
        console.log(error)
    }
}



const dltCart = async(req,res) => {
    try {
        const userIdParams = req.params.userId;
        const userIdToken = req.decodedToken.userId;

        if(!isValidObjectId(userIdParams)) return res.status( 400 ).send({status: false, message: "User Id in params invalid"})

        if(userIdParams !== userIdToken) return res.status( 400 ).send({status: false, message: "User authorisation failed!"})

        const isCartFound = await cartModel.findOne({userId: userIdParams})
        if(!isCartFound) res.status( 400 ).send({status: false, message: "No cart found with this userId"})

        isCartFound.items = [];
        isCartFound.totalItems = 0;
        isCartFound.totalPrice = 0;

        await isCartFound.save();

        res.status( 200 ).send({status: false, message: "Cart deleted successfully", data: isCartFound})
    }
    catch(error) { 
        res.status( 400 ).send({status: false, message: error.message})
    }
}




module.exports = {
    createCart,
    updateCart,
    getCart,
    dltCart
}