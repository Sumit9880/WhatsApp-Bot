const axios = require('axios')
const token = process.env.TOKEN
const myToken = process.env.MY_TOKEN

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

function sendMSG(msg, phone_no_id, token, from) {
    try {
        axios({
            method: "POST",
            url: "https://graph.facebook.com/v20.0/" + phone_no_id + "/messages?access_token=" + token,
            data: {
                messaging_product: "whatsapp",
                to: from,
                text: {
                    body: msg
                }
            },
            headers: {
                "Content-Type": "application/json"
            }
        })
    } catch (error) {
        console.log(error);
    }
}

exports.handle = (req, res) => {
    var data = req.body
    try {
        if (data.object) {
            if (data.entry[0].changes[0].value.messages[0]) {
                console.log("contact", data.entry[0].changes[0].value.messages);
                handleMessage(data);
                res.sendStatus(200);
            } else if (data.entry[0].changes[0].value.contacts) {
                console.log("contact", data.entry[0].changes[0].value.contacts);
                res.sendStatus(200);
            }
            else if (data.entry[0].changes[0].value.statuses) {
                console.log("status", data.entry[0].changes[0].value.statuses);
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