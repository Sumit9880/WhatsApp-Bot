const axios = require('axios')
const token = process.env.TOKEN
const myToken = process.env.MY_TOKEN
const Contact = require("../../dbModels/contacts");
const UserChatHistory = require("../../dbModels/userChatHistory");

exports.check = (req, res) => {
    console.log("webhook called");
    var mode = req.query['hub.mode']
    var challenge = req.query['hub.challenge']
    var token = req.query['hub.verify_token']

    if (mode && token) {
        if (mode === 'subscribe' && token === myToken) {
            res.status(200).send(challenge)
        } else {
            res.status(403)
        }
    }
}

// exports.handle = (req, res) => {
//     console.log("handle called");
//     var data = req.body
//     console.log(data.entry[0].changes);
//     console.log(data.entry[0].changes[0].value.messages);
//     console.log(data.entry[0].changes[0].value.contacts);
//     console.log(data.entry[0].changes[0].value.statuses);
//     if (data.object) {
//         if (data.entry &&
//             data.entry[0].changes &&
//             data.entry[0].changes[0].value.messages &&
//             data.entry[0].changes[0].value.messages[0]
//         ) {
//             var phone_no_id = data.entry[0].changes[0].value.metadata.phone_number_id
//             var from = data.entry[0].changes[0].value.messages[0].from
//             var msg_body = data.entry[0].changes[0].value.messages[0].text.body

//             console.log(msg_body);
//             console.log(from);
//             sendMSG(msg_body, phone_no_id, token, from);
//             res.sendStatus(200);
//         } else {
//             res.sendStatus(404);
//         }
//     }
// }

async function sendMSG(msg, phone_no_id, token, from) {
    console.log("sendMSG called");
    try {
        let url = "https://graph.facebook.com/v20.0/" + phone_no_id + "/messages?access_token=" + token
        let data = {
            messaging_product: "whatsapp",
            to: from,
            text: {
                body: msg
            }
        }
        let headers = {
            "Content-Type": "application/json"
        }
        const response = await axios.post(url, data, headers);
        console.log("response", response.data.messages[0].id);
    } catch (error) {
        console.log(error);
    }
}

exports.handle = async (req, res) => {
    var data = req.body
    try {
        if (data.object) {
            if (data.entry[0].changes[0].value.messages) {
                handleMessage(data);
                saveContact(data.entry[0].changes[0].value.contacts[0]);
                res.sendStatus(200);
            } else if (data.entry[0].changes[0].value.statuses) {
                const result = await UserChatHistory.findOneAndUpdate({ _id: req.body._id }, data);
                res.sendStatus(200);
            } else {
                res.sendStatus(404);
            }
        }
    } catch (error) {
        res.sendStatus(404);
    }
}

function handleMessage(data) {
    var phone_no_id = data.entry[0].changes[0].value.metadata.phone_number_id
    var from = data.entry[0].changes[0].value.messages[0].from
    var msg_body = data.entry[0].changes[0].value.messages[0].text.body
    sendMSG(msg_body, phone_no_id, token, from);
}

async function saveContact(data) {
    try {
        const existingContact = await Contact.findOne({
            wa_id: data.wa_id
        });
        if (existingContact === null) {
            await Contact.create({
                name: data.profile.name,
                wa_id: data.wa_id
            });
        }
    } catch (error) {
        console.error("Error saving contact:", error);
    }
}