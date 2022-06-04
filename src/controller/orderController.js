const cartModel = require("../model/cartModel");
const orderModel = require("../model/orderModel")
const {
    isEmpty,
    isValidEmail,
    isValidObjectId,
    isValidRequestBody
} = require("../util/validator")


const createOrder = async(req,res) => {
    try {
        const userIdParams = req.params.userId;
        const userIdToken = req.decodedToken.userId;
        const reqBody = req.body;


        if(!isValidObjectId(userIdParams)) return res.status( 400 ).send({status: false, message: "User Id in params is invalid"})

        if(isEmpty(reqBody)) return res.status( 400 ).send({status: false, message: "Request body is empty"})
        var {cartId,cancellable} = reqBody;

        if(isEmpty(cartId)) return res.status( 400 ).send({status: false, message: "cartId is required"})
        if(!isValidObjectId(cartId)) return res.status( 400 ).send({status: false, message: "Cart Id is invalid"})
        
        if(!isEmpty(cancellable)) {
// console.log(cancellable)
            if(cancellable !== ('false' || 'true')) return res.status( 400 ).send({
                status: false,
                message: "cancellable should be 'true' or 'false'"
            })
        }


        if(userIdParams !== userIdToken) return res.status( 401 ).send({status: false, message: "User authorisation failed!"})

        const isCardFound = await cartModel.findById({_id: cartId})
        if(!isCardFound) return res.status( 404 ).send({status: false, message: "There is no cart with this cart Id"})

        if(isCardFound.userId.toString() !== userIdParams) return res.status( 400 ).send({status: false, message: "This cart belongs to a different user"})

        var itemsArr = isCardFound.items;

        if(itemsArr.length == 0) return res.status( 404 ).send({status: false, message: "This cart is empty"})

        var countQuant = 0;
        for(var i in itemsArr) {
            countQuant += isCardFound.items[i].quantity;
        }


        const order = await orderModel.create({
            userId: userIdParams,
            items: [isCardFound.items[i]],
            totalPrice: isCardFound.totalPrice,
            totalItems: isCardFound.totalItems,
            totalQuantity: countQuant,
            cancellable : cancellable
        })

        if(!order) res.status( 503 ).send({status: false, message: "service unavailable"})
        res.status( 400 ).send({status: false, message: "Order created successfully", data: order})
    }
    catch(error) {
        res.status( 500 ).send({status: false, message: error.message})
        console.log(error)
    }
}



const updateOrder = async(req,res) => {
    try {
        const userIdParams = req.params.userId;
        const userIdToken = req.decodedToken.userId;
        const {orderId,status} = req.body;


        if(!isValidObjectId(userIdParams)) return res.status( 400 ).send({status: false, message: "user Id in params is invalid"})
        if(isEmpty(orderId)) return res.status( 400 ).send({status: false, message: "Put order Id in request body"})
        if(!isValidObjectId(orderId)) return res.status( 400 ).send({status: false, message: "order Id invalid"})

        if(isEmpty(status)) return res.status( 400 ).send({status: false, message: "Need to put status in request body"})
        
        if(userIdParams !== userIdToken) return res.status( 401 ).send({status: false, message: "User authorisation failed!"})
        

        const isOrder = await orderModel.findById({_id: orderId})
        if(!isOrder) return res.status( 404 ).send({status: false, message: "No order found with this order Id"})
        
        if(isOrder.userId.toString() !== userIdParams) return res.status( 400 ).send({status: false, message: "This Order belongs to a different user"})
        
        if(isOrder.cancellable !== true) return res.status( 400 ).send({status: false, message: "This order couldn't be cancelled"})
     

        if(isOrder.status[0] !== 'pending') return res.status( 400 ).send({status: false, message: `This order is already ${isOrder.status}. cannot change the status now`})
        if(['completed','cancelled'].indexOf(status) == -1) return res.status( 400 ).send({
            status: false,
            message: "The status value should be 'completed' or 'cancelled'"
        })

        isOrder.status = [status];

        await isOrder.save()
        res.status( 200 ).send({status: true, message: `Order ${status} successfully`, data: isOrder})
    }
    catch(error) {
        res.status( 400 ).send({status: false, message: error.message})
        console.log(error)
    }
}



module.exports = {
    createOrder,
    updateOrder
}