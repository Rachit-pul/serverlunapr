const express = require("express")
const app = express()
require("dotenv").config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST)
const bodyParser = require("body-parser")
const cors = require("cors")

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(cors())

const generateResponse = intent => {
	// Generate a response based on the intent's status
	switch (intent.status) {
	  case "requires_action":
	  case "requires_source_action":
		// Card requires authentication
		return {
		  requiresAction: true,
		  clientSecret: intent.client_secret
		};
	  case "requires_payment_method":
	  case "requires_source":
		// Card was not properly authenticated, suggest a new payment method
		return {
		  error: "Your card was denied, please provide a new payment method"
		};
	  case "succeeded":
		// Payment is complete, authentication not required
		// To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
		console.log("💰 Payment received!");
		return { clientSecret: intent.client_secret };
	}
  };

app.post("/payment", cors(), async (req, res) => {
	let { amount, id } = req.body
	try {
		let intent
			intent = await stripe.paymentIntents.create({
				amount,
				currency: "usd",
				description: "lunapr",
				payment_method: id,
				confirm: true,
			})
			console.log("Payment", intent)
			intent = await stripe.paymentIntents.confirm(intent.id)
		// res.json({
		// 	message: "Payment successful",
		// 	success: true
		// })
		res.send(generateResponse(intent));
	} catch (error) {
		console.log("Error", error)
		res.json({
			message: "Payment failed",
			success: false
		})
	}
})


app.listen(process.env.PORT || 4000, () => {
	console.log("Sever is listening on port 4000")
})