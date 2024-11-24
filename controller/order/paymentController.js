const stripe = require('../../config/stripe');
const userModel = require('../../models/userModel');

const paymentController = async (request, response) => {
    try {
        const { cartItems } = request.body;

        // Ensure user is authenticated and retrieve user data
        const user = await userModel.findOne({ _id: request.userId });
        if (!user) {
            return response.status(404).json({ message: 'User not found', success: false });
        }

        const params = {
            submit_type: 'pay',
            mode: 'payment',
            payment_method_types: ['card'],
            billing_address_collection: 'auto',
            shipping_options: [
                {
                    shipping_rate: 'shr_1Q5PQQHr0z21NC8mw5LoNGYf' // Ensure this is a valid shipping rate
                }
            ],
            customer_email: user.email,
            metadata : {
                userId : request.userId
            },
            line_items: cartItems.map((item) => {
                return {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: item.productId.productName,
                            images: item.productId.productImage,
                            metadata: {
                                productId: item.productId._id
                            }
                        },
                        
                        unit_amount: item.productId.sellingPrice * 100 
                    },
                    adjustable_quantity: {
                        enabled: true,
                        minimum: 1
                    },
                    quantity: item.quantity
                };
            }),
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`
        };

        const session = await stripe.checkout.sessions.create(params);

        console.log("Payment session created:", session);
        response.status(200).json({ id: session.id }); // Respond with the session ID

    } catch (error) {
        console.error("Payment error:", error); // Log the error for debugging
        response.status(400).json({
            message: error.message || 'An error occurred while processing your payment.',
            error: true,
            success: false
        });
    }
};

module.exports = paymentController;
