const axios = require('axios')
const token = process.env.TOKEN
const myToken = process.env.MY_TOKEN
const Contact = require("../../dbModels/contacts");
const Script = require("../../dbModels/script");
const UserChatHistory = require("../../dbModels/userChatHistory");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;


exports.check = (req, res) => {
    console.log("webhook called");
    try {
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
    } catch (error) {
        console.error("Error Check: ", error);
        res.sendStatus(500);
    }
}


exports.handle = async (req, res) => {
    var data = req.body
    try {
        if (data.object) {
            if (data.entry[0].changes[0].value.messages) {
                console.log("message received");
                res.sendStatus(200);
                saveChat(data.entry[0].changes[0].value.messages[0].from, "U", data.entry[0].changes[0].value.messages[0].text.body, "R", new ObjectId('000000000000000000000000'), data.entry[0].changes[0].value.messages[0].id);
                handleMessage(data);
                saveContact(data.entry[0].changes[0].value.contacts[0]);
            } else if (data.entry[0].changes[0].value.statuses) {
                updateStaus(data.entry[0].changes[0].value.statuses[0]);
                res.sendStatus(200);
            } else {
                res.sendStatus(404);
            }
        }
    } catch (error) {
        console.error("Error handle: ", error);
        res.sendStatus(404);
    }
}


async function handleMessage(data) {
    console.log("handleMessage called");
    try {
        let phone_no_id = data.entry[0].changes[0].value.metadata.phone_number_id
        let from = data.entry[0].changes[0].value.messages[0].from
        let msg_body = data.entry[0].changes[0].value.messages[0].text.body
        let isGreet = isGreetingMessage(msg_body)

        let msg = await UserChatHistory.aggregate([
            {
                $lookup: {
                    from: "scripts",
                    localField: "scriptId",
                    foreignField: "_id",
                    as: "script"
                }
            },
            {
                $match: {
                    mobileNo: from,
                    scriptId: { $ne: new ObjectId('000000000000000000000000') }
                }
            }
        ]).sort({ _id: -1 }).limit(1);

        let scriptId = null
        if (msg.length <= 0 || isGreet) {
            // new script
            let start = await Script.findOne().sort({ _id: 1 }).limit(1)
            scriptId = start._id
        } else {
            // old script
            scriptId = msg[0].script[0].redirectId
        }

        if (scriptId == null) {
            sendMSG("Thank you", phone_no_id, token, from, scriptId);
        } else {
            async function processScript() {
                let script = await Script.findOne({ _id: scriptId })
                let msg_body = script.msgContent
                sendMSG(msg_body, phone_no_id, token, from, scriptId);

                scriptId = script.redirectId;
                let waitTime = script.waitTime;
                if (waitTime !== null && waitTime > 0) {
                    setTimeout(processScript, waitTime);
                }
            }
            processScript();
        }

    } catch (error) {
        console.error("Error handling message:", error);
    }
}


async function saveContact(data) {
    console.log("saveContact called");
    try {
        const existingContact = await Contact.findOne({
            wa_id: data.wa_id
        });
        if (existingContact === null) {
            await Contact.create(
                {
                    name: data.profile.name,
                    wa_id: data.wa_id
                }
            );
        }
    } catch (error) {
        console.error("Error saving contact:", error);
    }
}


async function updateStaus(obj) {
    try {
        let status = obj.status == "read" ? "R" : obj.status == "delivered" ? "D" : obj.status == "sent" ? "S" : "U"
        let data = {}
        if (status == "D") {
            data = {
                status: status,
                deliveredTime: new Date()
            }
        } else if (status == "R") {
            data = {
                status: status,
                readTime: new Date()
            }
        } else if (status == "S") {
            data = {
                status: status,
                sentTime: new Date()
            }
        } else {
            data = {

            }
        }
        await UserChatHistory.findOneAndUpdate({ wamId: obj.id }, data);
    } catch (error) {
        console.error("Error updating status:", error);
    }
}


async function saveChat(mobileNo, sender, msgContent, status, scriptId, wamId) {
    console.log("saveChat");
    try {
        await UserChatHistory.create(
            {
                mobileNo: mobileNo,
                sender: sender,
                msgContent: msgContent,
                status: status,
                scriptId: scriptId,
                wamId: wamId
            }
        );
    } catch (error) {
        console.error("Error saving UserChatHistory:", error);
    }
}


function isGreetingMessage(message) {
    const greetings = ['hello', 'hi', 'hey'];
    const lowercasedMessage = message.toLowerCase();
    return greetings.some(greeting => lowercasedMessage.startsWith(greeting));
}


async function sendMSG(msg, phone_no_id, token, from, scriptId) {
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
        saveChat(from, "B", msg, "U", scriptId, response.data.messages[0].id);
    } catch (error) {
        console.error("Error sending message:", error);
    }
}