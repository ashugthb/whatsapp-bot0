// load variables from .env file in process.env
require('dotenv').config();

// create express server
const express = require('express');
const app = express();
const PORT = process.env.port || 3000;

// parse request body
// twilio sends application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }))
app.use(express.json());

// create twilio client for interacting with twilio
const twilioClient = require('twilio')(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN,
);

// create dialogflow session client
const dialogflow = require('@google-cloud/dialogflow');
const sessionClient = new dialogflow.SessionsClient();

// post request on /whatsapp endpoint
app.post('/whatsapp', async function(req, res) {

	// users whatsapp number
	const from = req.body.From;

	// sandbox whatsapp number
	const to = req.body.To;
	// message contents
	const body = req.body.Body;

	console.log(`Got message ${body} from ${from}`);

	// session for current user
	const projectId = await sessionClient.getProjectId();
	const sessionPath = sessionClient.projectAgentSessionPath(projectId, from);

	// request dialogflow to classify intent
	const response = await sessionClient.detectIntent({
		session: sessionPath,
		queryInput: {
			text: {
				text: body,
				languageCode: 'en-US',
			}
		}
	});

	// handle action of cashew order
	if(response[0].queryResult.action == 'order-cashew') {
		let cashew_rate = 300
		

		// respond to user
		await twilioClient.messages.create({
			from: to,
			to: from,
			body: `Here is your cashew order details of Rs ${cashew_rate}. `
		});

		res.status(200).end();
		return
	}
	if(response[0].queryResult.action == 'order-menu') {
		let cashew_rate = 300
		

		// respond to user
		await twilioClient.messages.create({
			from: to,
			to: from,
			body: `Here is our menu card pls select the following item to order
1:cashew
2:almond
3:item3
4:item4`
		});

		res.status(200).end();
		return
	}
	// forward dialogflow response to user
	const messages = response[0].queryResult.fulfillmentMessages;
	for (const message of messages) {

		// normal text message
		if(message.text) {
			await twilioClient.messages.create({
				from: to,
				to: from,
				body: message.text.text[0],
			});
		}
	}

	// respond to twilio callback
	res.status(200).end();
});

// start server
app.listen(PORT, () => {
	console.log(`Listening on ${PORT}`);
});