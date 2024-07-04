const { logError } = require('../Modules/logger')
const jwt = require('jsonwebtoken');

exports.getSystemDate = function () {
    let date_ob = new Date();

    // current date 
    // adjust 0 before single digit date
    let day = ("0" + date_ob.getDate()).slice(-2);

    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    // current year
    let year = date_ob.getFullYear();

    // current hours
    let hours = ("0" + date_ob.getHours()).slice(-2);

    // current minutes
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);

    // current seconds
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);
    // prints date & time in YYYY-MM-DD HH:MM:SS format
    date_cur = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
    return date_cur;
}

exports.generateToken = function (userId, res, resultsUser) {
    try {
        var data = {
            "USER_ID": userId,
        }
        jwt.sign({ data }, process.env.SECRET, (error, token) => {
            if (error) {
                console.error(error);
                logError(req.method, req.originalUrl, error, '', '', "JWTTokenError");
                res.send({
                    "code": 500,
                    "message": "Something went wrong."
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "Logged in successfully.",
                    "data": [{
                        "token": token,
                        "UserId": userId,
                        "isLoggedIn": true
                    }
                    ]
                });
            }
        });
    } catch (error) {
        console.error(error);
        logError(req.method, req.originalUrl, error, '', '', "CatchError");
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.sendInteractiveListMSGDate = (msg, phone_no_id, token, from, scriptDetails, header, button, LAST_MSG_ID, apiVersion, callback) => {
    try {
        var datas = []

        if (scriptDetails.length > 0) {
            for (let i = 0; i < scriptDetails.length; i++) {
                var data = {
                    id: scriptDetails[i].ID,
                    title: scriptDetails[i].DATE,
                    // description: scriptDetails[i].DESCRIPTION ? scriptDetails[i].DESCRIPTION  : ''
                }
                datas.push(data)
            }
        }

        const interactiveObject = {
            type: "list",
            header: {
                type: "text",
                text: header,
            },
            body: {
                text: msg,
            },
            footer: {
                text: "Type Home to MainMenu OR Type # to Back Menu",
            },
            action: {
                button: button,
                sections: [
                    {
                        title: "title",
                        rows: datas

                    },
                ],
            },
        };
        axios({
            method: "POST",
            url: "https://graph.facebook.com/" + apiVersion + "/" + phone_no_id + "/messages?access_token=" + token,
            data: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: from,
                type: "interactive",
                interactive: interactiveObject,
                headers: {
                    "Content-Type": "application/json"
                }
            }

        }).then((success) => {
            let WP_MSG_ID = success.data.messages[0].id
            this.executeQueryData('UPDATE message_trasanction SET STATUS = ?, MESSAGE_STATUS = ?,  WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ? ', ['S', 'unsent', WP_MSG_ID, this.getSystemDate(), LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                if (error) {
                    console.log(error);
                    callback('Failed to update message trasanction');
                } else {
                    console.log("success");
                    callback();
                }
            })
        }, (reason) => {
            this.executeQueryData(`SELECT ID, MESSAGE_STATUS, TYPE, WP_CLIENT_ID, PLAN_TYPE, PLAN_ID, AMOUNT_CHARGES FROM view_message_trasanction where ID = ?`, [LAST_MSG_ID], supportKey, (error, results2) => {
                if (error) {
                    console.log("Error in get message_message_trasanction", error);
                    callback(error)
                } else {
                    let NEW_COLUMN_NAME = ''
                    if (results2[0].TYPE == 'UTILITY' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "UTILITY_RATE_REMAINING"
                    else if (results2[0].TYPE == 'MARKETING' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "MARKETING_RATE_REMAINING"
                    else if (results2[0].TYPE == 'AUTHENTICATION' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "AUTH_RATE_REMAINING"
                    else if (results2[0].TYPE == 'SERVICE' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "SERVICE_RATE_REMAINING"
                    else if (results2[0].TYPE == 'UTILITY' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "UTI_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'MARKETING' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "MAR_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'AUTHENTICATION' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "AUTH_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'SERVICE' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "SERVICE_BALANCE_REMAINING"
                    else NEW_COLUMN_NAME = ''

                    this.executeQueryData(`UPDATE message_trasanction SET STATUS = ?, MESSAGE_STATUS = ?, AMOUNT_CHARGES=0, WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ?;UPDATE client_transaction SET DR_MSG_BALANCE = 0, DR_MSG_COUNT = 0 WHERE MSG_ID = ?;UPDATE client_plan_usage SET ${NEW_COLUMN_NAME} = (${NEW_COLUMN_NAME} + ${results2[0].AMOUNT_CHARGES}) where WP_CLIENT_ID = ? AND PLAN_ID = ?;`, ['F', 'failed', null, this.getSystemDate(), LAST_MSG_ID, LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                        if (error) {
                            console.log(error);
                            callback('Failed to update message trasanction');
                        } else {
                            console.log("Failed");
                            callback()
                        }
                    })
                }
            })

        })

    } catch (error) {
        console.log(error);
        callback()
    }
}

exports.sendMSG = (msg, phone_no_id, from, token, LAST_MSG_ID, apiVersion, callback) => {

    let messageData = JSON.stringify({
        TYPE: "TEXT",
        BODY_TEXT: msg
    })

    try {
        axios({
            method: "POST",
            url: "https://graph.facebook.com/" + apiVersion + "/" + phone_no_id + "/messages?access_token=" + token,
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
        }).then((success) => {
            let WP_MSG_ID = success.data.messages[0].id
            this.executeQueryData('UPDATE message_trasanction SET TEXT = ?, STATUS = ?, MESSAGE_STATUS = ?,  WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ? ', [messageData, 'S', 'unsent', WP_MSG_ID, this.getSystemDate(), LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                if (error) {
                    console.log(error);
                    callback('Failed to update message trasanction');
                } else {
                    callback();
                    console.log("success");
                }
            })
        }, (reason) => {
            this.executeQueryData(`SELECT ID, MESSAGE_STATUS, TYPE, WP_CLIENT_ID, PLAN_TYPE, PLAN_ID, AMOUNT_CHARGES FROM view_message_trasanction where ID = ?`, [LAST_MSG_ID], supportKey, (error, results2) => {
                if (error) {
                    console.log("Error in get message_message_trasanction", error);
                    callback(error)
                } else {
                    let NEW_COLUMN_NAME = ''
                    if (results2[0].TYPE == 'UTILITY' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "UTILITY_RATE_REMAINING"
                    else if (results2[0].TYPE == 'MARKETING' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "MARKETING_RATE_REMAINING"
                    else if (results2[0].TYPE == 'AUTHENTICATION' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "AUTH_RATE_REMAINING"
                    else if (results2[0].TYPE == 'SERVICE' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "SERVICE_RATE_REMAINING"
                    else if (results2[0].TYPE == 'UTILITY' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "UTI_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'MARKETING' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "MAR_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'AUTHENTICATION' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "AUTH_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'SERVICE' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "SERVICE_BALANCE_REMAINING"
                    else NEW_COLUMN_NAME = ''

                    this.executeQueryData(`UPDATE message_trasanction SET STATUS = ?, MESSAGE_STATUS = ?, AMOUNT_CHARGES=0, WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ?;UPDATE client_transaction SET DR_MSG_BALANCE = 0, DR_MSG_COUNT = 0 WHERE MSG_ID = ?;UPDATE client_plan_usage SET ${NEW_COLUMN_NAME} = (${NEW_COLUMN_NAME} + ${results2[0].AMOUNT_CHARGES}) where WP_CLIENT_ID = ? AND PLAN_ID = ?;`, ['F', 'failed', null, this.getSystemDate(), LAST_MSG_ID, LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                        if (error) {
                            console.log(error);
                            callback('Failed to update message trasanction');
                        } else {
                            console.log("Failed");
                            callback()

                        }
                    })
                }
            })
        })
    } catch (error) {
        console.log(error);
    }
}

exports.sendMSGWithImage = (msg, phone_no_id, token, from, caption, LAST_MSG_ID, apiVersion, callback) => {

    let messageData = JSON.stringify({
        TYPE: "IMAGE_WITH_TEXT",
        LINK: msg,
        BODY_TEXT: caption
    })
    try {
        axios({
            method: "POST",
            url: "https://graph.facebook.com/" + apiVersion + "/" + phone_no_id + "/messages?access_token=" + token,
            data: {
                messaging_product: "whatsapp",
                to: from,
                type: "image",
                image: {
                    "link": msg,
                    "caption": caption
                },
            },
            headers: {
                "Content-Type": "application/json"
            }
        }).then((success) => {
            let WP_MSG_ID = success.data.messages[0].id
            this.executeQueryData('UPDATE message_trasanction SET TEXT = ?, STATUS = ?, MESSAGE_STATUS = ?,  WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ? ', [messageData, 'S', 'unsent', WP_MSG_ID, this.getSystemDate(), LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                if (error) {
                    console.log("Failed to update message trasanction", error);
                    callback('Failed to update message trasanction');
                } else {
                    console.log("success");
                    callback();
                }
            })
        }, (reason) => {
            console.log("error :- ", reason);
            this.executeQueryData(`SELECT ID, MESSAGE_STATUS, TYPE, WP_CLIENT_ID, PLAN_TYPE, PLAN_ID, AMOUNT_CHARGES FROM view_message_trasanction where ID = ?`, [LAST_MSG_ID], supportKey, (error, results2) => {
                if (error) {
                    console.log("Error in get message_message_trasanction", error);
                    callback("Error in get message_message_trasanction", error);
                } else {
                    let NEW_COLUMN_NAME = ''
                    if (results2[0].TYPE == 'UTILITY' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "UTILITY_RATE_REMAINING"
                    else if (results2[0].TYPE == 'MARKETING' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "MARKETING_RATE_REMAINING"
                    else if (results2[0].TYPE == 'AUTHENTICATION' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "AUTH_RATE_REMAINING"
                    else if (results2[0].TYPE == 'SERVICE' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "SERVICE_RATE_REMAINING"
                    else if (results2[0].TYPE == 'UTILITY' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "UTI_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'MARKETING' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "MAR_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'AUTHENTICATION' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "AUTH_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'SERVICE' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "SERVICE_BALANCE_REMAINING"
                    else NEW_COLUMN_NAME = ''
                    this.executeQueryData(`UPDATE message_trasanction SET STATUS = ?, MESSAGE_STATUS = ?, AMOUNT_CHARGES=0, WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ?;UPDATE client_transaction SET DR_MSG_BALANCE = 0, DR_MSG_COUNT = 0 WHERE MSG_ID = ?;UPDATE client_plan_usage SET ${NEW_COLUMN_NAME} = (${NEW_COLUMN_NAME} + ${results2[0].AMOUNT_CHARGES}) where WP_CLIENT_ID = ? AND PLAN_ID = ?;`, ['F', 'failed', null, this.getSystemDate(), LAST_MSG_ID, LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                        if (error) {
                            console.log("Failed to credit charged amount", error);
                            callback('Failed to update message trasanction');
                        } else {
                            console.log("Success");
                            callback()

                        }
                    })
                }
            })
        })
    } catch (error) {
        console.log("Failed to iamge message ", error);
        callback('Failed to iamge message ');
    }
}

exports.sendInteractiveListMSG = (msg, phone_no_id, token, from, scriptDetails, header, buttonName, LAST_MSG_ID, apiVersion, callback) => {

    try {
        var datas = []
        if (scriptDetails.length > 0) {
            for (let i = 0; i < scriptDetails.length; i++) {
                var data = {
                    id: scriptDetails[i].ID,
                    title: scriptDetails[i].NAME,
                    description: scriptDetails[i].DESCRIPTION ? scriptDetails[i].DESCRIPTION : ''
                }
                datas.push(data)
            }

            if (scriptDetails.length > 8) {
                var data = {
                    id: 0,
                    title: "More Items",
                    description: "Get More Items"
                }
                datas.push(data)
            }
        }

        const interactiveObject = {
            type: "list",
            header: {
                type: "text",
                text: header,
            },
            body: {
                text: msg,
            },
            footer: {
                text: "",
            },
            action: {
                button: buttonName,
                sections: [
                    {
                        title: "title",
                        rows: datas

                    },
                ],
            },
        };

        let messageData = JSON.stringify({
            TYPE: "LIST",
            BODY_TEXT: msg,
            FOOTER: "",
            BUTTON_NAME: buttonName,
            LIST_DATA: datas
        })

        axios({
            method: "POST",
            url: "https://graph.facebook.com/" + apiVersion + "/" + phone_no_id + "/messages?access_token=" + token,
            data: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: from,
                type: "interactive",
                interactive: interactiveObject,
                headers: {
                    "Content-Type": "application/json"
                }
            }

        }).then((success) => {
            let WP_MSG_ID = success.data.messages[0].id
            this.executeQueryData('UPDATE message_trasanction SET TEXT =?, STATUS = ?, MESSAGE_STATUS = ?,  WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ? ', [messageData, 'S', 'unsent', WP_MSG_ID, this.getSystemDate(), LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                if (error) {
                    console.log('Failed to update message trasanction' + error);
                    callback('Failed to update message trasanction' + error);
                } else {
                    console.log("success");
                    callback();
                }
            })
        }, (reason) => {
            console.log("error in sendInteractiveListMSG :- ", reason);
            this.executeQueryData(`SELECT ID, MESSAGE_STATUS, TYPE, WP_CLIENT_ID, PLAN_TYPE, PLAN_ID, AMOUNT_CHARGES FROM view_message_trasanction where ID = ?`, [LAST_MSG_ID], supportKey, (error, results2) => {
                if (error) {
                    console.log("Error in get message_message_trasanction", error);
                    callback("Error in get message_message_trasanction", error);
                } else {
                    let NEW_COLUMN_NAME = ''
                    if (results2[0].TYPE == 'UTILITY' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "UTILITY_RATE_REMAINING"
                    else if (results2[0].TYPE == 'MARKETING' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "MARKETING_RATE_REMAINING"
                    else if (results2[0].TYPE == 'AUTHENTICATION' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "AUTH_RATE_REMAINING"
                    else if (results2[0].TYPE == 'SERVICE' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "SERVICE_RATE_REMAINING"
                    else if (results2[0].TYPE == 'UTILITY' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "UTI_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'MARKETING' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "MAR_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'AUTHENTICATION' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "AUTH_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'SERVICE' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "SERVICE_BALANCE_REMAINING"
                    else NEW_COLUMN_NAME = ''
                    this.executeQueryData(`UPDATE message_trasanction SET STATUS = ?, MESSAGE_STATUS = ?, AMOUNT_CHARGES=0, WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ?;UPDATE client_transaction SET DR_MSG_BALANCE = 0, DR_MSG_COUNT = 0 WHERE MSG_ID = ?;UPDATE client_plan_usage SET ${NEW_COLUMN_NAME} = (${NEW_COLUMN_NAME} + ${results2[0].AMOUNT_CHARGES}) where WP_CLIENT_ID = ? AND PLAN_ID = ?;`, ['F', 'failed', null, this.getSystemDate(), LAST_MSG_ID, LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                        if (error) {
                            console.log("Failed to credit charged amount", error);
                            callback('Failed to update message trasanction');
                        } else {
                            console.log("Success");
                            callback()

                        }
                    })
                }
            })
        })
    } catch (error) {
        console.log("Failed to send list message ", error);
        callback("Failed to send list message", error);
    }
}

exports.sendDocumentMedia = (msg, phone_no_id, token, from, medialink, caption, filename, LAST_MSG_ID, apiVersion, callback) => {
    let messageData = JSON.stringify({
        TYPE: "DOCUMENT",
        LINK: medialink,
        BODY_TEXT: caption,
        filename: filename,
    })
    try {
        axios({
            method: "POST",
            url: "https://graph.facebook.com/" + apiVersion + "/" + phone_no_id + "/messages?access_token=" + token,
            data: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: from,
                type: "document",
                document: {
                    link: medialink,
                    caption: caption,
                    filename: filename
                },
            },
            headers: {
                "Content-Type": "application/json"
            }
        }).then((success) => {
            let WP_MSG_ID = success.data.messages[0].id
            this.executeQueryData('UPDATE message_trasanction SET TEXT = ?, STATUS = ?, MESSAGE_STATUS = ?,  WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ? ', [messageData, 'S', 'unsent', WP_MSG_ID, this.getSystemDate(), LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                if (error) {
                    console.log('Failed to update message trasanction', error);
                    callback('Failed to update message trasanction');
                } else {
                    console.log("success");
                    callback();
                }
            })
        }, (reason) => {
            console.log("error sendDocumentMedia :- ", reason);
            this.executeQueryData(`SELECT ID, MESSAGE_STATUS, TYPE, WP_CLIENT_ID, PLAN_TYPE, PLAN_ID, AMOUNT_CHARGES FROM view_message_trasanction where ID = ?`, [LAST_MSG_ID], supportKey, (error, results2) => {
                if (error) {
                    console.log("Error in get message_message_trasanction", error);
                    callback("Error in get message_message_trasanction", error);
                } else {
                    let NEW_COLUMN_NAME = ''
                    if (results2[0].TYPE == 'UTILITY' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "UTILITY_RATE_REMAINING"
                    else if (results2[0].TYPE == 'MARKETING' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "MARKETING_RATE_REMAINING"
                    else if (results2[0].TYPE == 'AUTHENTICATION' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "AUTH_RATE_REMAINING"
                    else if (results2[0].TYPE == 'SERVICE' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "SERVICE_RATE_REMAINING"
                    else if (results2[0].TYPE == 'UTILITY' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "UTI_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'MARKETING' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "MAR_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'AUTHENTICATION' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "AUTH_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'SERVICE' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "SERVICE_BALANCE_REMAINING"
                    else NEW_COLUMN_NAME = ''
                    this.executeQueryData(`UPDATE message_trasanction SET STATUS = ?, MESSAGE_STATUS = ?, AMOUNT_CHARGES=0, WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ?;UPDATE client_transaction SET DR_MSG_BALANCE = 0, DR_MSG_COUNT = 0 WHERE MSG_ID = ?;UPDATE client_plan_usage SET ${NEW_COLUMN_NAME} = (${NEW_COLUMN_NAME} + ${results2[0].AMOUNT_CHARGES}) where WP_CLIENT_ID = ? AND PLAN_ID = ?;`, ['F', 'failed', null, this.getSystemDate(), LAST_MSG_ID, LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                        if (error) {
                            console.log("Failed to credit charged amount", error);
                            callback('Failed to update message trasanction');
                        } else {
                            console.log("Success");
                            callback()
                        }
                    })
                }
            })
        })

    } catch (error) {
        console.log(error);
        callback("Error in sendDocumentMedia", error);
    }
}

exports.sendInteractiveButtonMSG = (msg, phone_no_id, token, from, scriptDetails, header, text, button, title, LAST_MSG_ID, apiVersion, callback) => {

    try {
        var datas = []
        if (scriptDetails.length > 0) {
            for (let i = 0; i < scriptDetails.length; i++) {
                var data = {
                    "type": "reply",
                    "reply": {
                        id: scriptDetails[i].REDIRECT_ID,
                        title: scriptDetails[i].MSG_OPTION
                    }
                }
                datas.push(data)
            }
        }


        const interactiveObject = {
            type: "button",
            // header: {
            //     type: "image",
            //     text: header,
            // },
            body: {
                text: text,
            },
            footer: {
                text: "",
            },
            action: {
                buttons: datas

            },
        };

        let messageData = JSON.stringify({
            TYPE: "BUTTON",
            BODY_TEXT: text,
            FOOTER: "",
            // BUTTON_NAME: button,
            BUTTON_DATA: datas
        })
        axios({
            method: "POST",
            url: "https://graph.facebook.com/" + apiVersion + "/" + phone_no_id + "/messages?access_token=" + token,
            data: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: from,
                type: "interactive",
                interactive: interactiveObject,
                headers: {
                    "Content-Type": "application/json"
                }
            }

        }).then((success) => {
            console.log("success", success.data);
            let WP_MSG_ID = success.data.messages[0].id
            this.executeQueryData('UPDATE message_trasanction SET TEXT = ?, STATUS = ?, MESSAGE_STATUS = ?,  WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ? ', [messageData, 'S', 'unsent', WP_MSG_ID, this.getSystemDate(), LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                if (error) {
                    console.log(error);
                    callback('Failed to update message trasanction');
                } else {
                    console.log("success");
                    callback(null, success.data);
                }
            })
        }, (reason) => {
            console.log("error InteractiveButtonMSG:- ", reason);
            this.executeQueryData(`SELECT ID, MESSAGE_STATUS, TYPE, WP_CLIENT_ID, PLAN_TYPE, PLAN_ID, AMOUNT_CHARGES FROM view_message_trasanction where ID = ?`, [LAST_MSG_ID], supportKey, (error, results2) => {
                if (error) {
                    console.log("Error in get message_message_trasanction", error);
                    callback(error)
                } else {
                    let NEW_COLUMN_NAME = ''
                    if (results2[0].TYPE == 'UTILITY' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "UTILITY_RATE_REMAINING"
                    else if (results2[0].TYPE == 'MARKETING' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "MARKETING_RATE_REMAINING"
                    else if (results2[0].TYPE == 'AUTHENTICATION' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "AUTH_RATE_REMAINING"
                    else if (results2[0].TYPE == 'SERVICE' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "SERVICE_RATE_REMAINING"
                    else if (results2[0].TYPE == 'UTILITY' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "UTI_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'MARKETING' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "MAR_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'AUTHENTICATION' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "AUTH_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'SERVICE' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "SERVICE_BALANCE_REMAINING"
                    else NEW_COLUMN_NAME = ''
                    this.executeQueryData(`UPDATE message_trasanction SET STATUS = ?, MESSAGE_STATUS = ?, AMOUNT_CHARGES=0, WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ?;UPDATE client_transaction SET DR_MSG_BALANCE = 0, DR_MSG_COUNT = 0 WHERE MSG_ID = ?;UPDATE client_plan_usage SET ${NEW_COLUMN_NAME} = (${NEW_COLUMN_NAME} + ${results2[0].AMOUNT_CHARGES}) where WP_CLIENT_ID = ? AND PLAN_ID = ?;`, ['F', 'failed', null, this.getSystemDate(), LAST_MSG_ID, LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                        if (error) {
                            console.log("Failed to credit charged amount", error);
                            callback('Failed to update message trasanction');
                        } else {
                            console.log("Failed");
                            callback(null, reason)

                        }
                    })
                }
            })
        })

    } catch (error) {
        console.log(error);
        callback('Failed to send button message');
    }
}

exports.sendInteractiveListMSGNew = (msg, phone_no_id, token, from, scriptDetails, header, button, LAST_MSG_ID, apiVersion, callback) => {
    try {
        var datas = []
        if (scriptDetails.length > 0) {
            for (let i = 0; i < scriptDetails.length; i++) {
                var data = {
                    id: scriptDetails[i].REDIRECT_ID,
                    title: scriptDetails[i].MSG_OPTION
                }
                datas.push(data)
            }
        }

        const interactiveObject = {
            type: "list",
            header: {
                type: "text",
                text: header,
            },
            body: {
                text: msg,
            },
            footer: {
                text: "",
                // text: "Type Home to MainMenu OR Type # to Back Menu",
            },
            action: {
                button: button,
                sections: [
                    {
                        title: "title",
                        rows: datas

                    },
                ],
            },
        };

        let messageData = JSON.stringify({
            TYPE: "LIST",
            BODY_TEXT: msg,
            FOOTER: "",
            BUTTON_NAME: button,
            LIST_DATA: datas
        })
        axios({
            method: "POST",
            url: "https://graph.facebook.com/" + apiVersion + "/" + phone_no_id + "/messages?access_token=" + token,
            data: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: from,
                type: "interactive",
                interactive: interactiveObject,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        }).then((success) => {
            let WP_MSG_ID = success.data.messages[0].id
            this.executeQueryData('UPDATE message_trasanction SET TEXT =?, STATUS = ?, MESSAGE_STATUS = ?,  WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ? ', [messageData, 'S', 'unsent', WP_MSG_ID, this.getSystemDate(), LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                if (error) {
                    console.log('Failed to update message trasanction');
                    callback('Failed to update message trasanction');
                } else {
                    console.log("success");
                    callback();
                }
            })
        }, (reason) => {
            console.log("error in sendInteractiveListMSGNew:- ", reason);
            this.executeQueryData(`SELECT ID, MESSAGE_STATUS, TYPE, WP_CLIENT_ID, PLAN_TYPE, PLAN_ID, AMOUNT_CHARGES FROM view_message_trasanction where ID = ?`, [LAST_MSG_ID], supportKey, (error, results2) => {
                if (error) {
                    console.log("Error in get message_message_trasanction", error);
                    callback("Error in get message_message_trasanction", error);
                } else {
                    let NEW_COLUMN_NAME = ''
                    if (results2[0].TYPE == 'UTILITY' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "UTILITY_RATE_REMAINING"
                    else if (results2[0].TYPE == 'MARKETING' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "MARKETING_RATE_REMAINING"
                    else if (results2[0].TYPE == 'AUTHENTICATION' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "AUTH_RATE_REMAINING"
                    else if (results2[0].TYPE == 'SERVICE' && results2[0].PLAN_TYPE == 'R') NEW_COLUMN_NAME = "SERVICE_RATE_REMAINING"
                    else if (results2[0].TYPE == 'UTILITY' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "UTI_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'MARKETING' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "MAR_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'AUTHENTICATION' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "AUTH_BALANCE_REMAINING"
                    else if (results2[0].TYPE == 'SERVICE' && results2[0].PLAN_TYPE == 'B') NEW_COLUMN_NAME = "SERVICE_BALANCE_REMAINING"
                    else NEW_COLUMN_NAME = ''
                    this.executeQueryData(`UPDATE message_trasanction SET STATUS = ?, MESSAGE_STATUS = ?, AMOUNT_CHARGES=0, WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ?;UPDATE client_transaction SET DR_MSG_BALANCE = 0, DR_MSG_COUNT = 0 WHERE MSG_ID = ?;UPDATE client_plan_usage SET ${NEW_COLUMN_NAME} = (${NEW_COLUMN_NAME} + ${results2[0].AMOUNT_CHARGES}) where WP_CLIENT_ID = ? AND PLAN_ID = ?;`, ['F', 'failed', null, this.getSystemDate(), LAST_MSG_ID, LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                        if (error) {
                            console.log("Failed to credit charged amount", error);
                            callback('Failed to update message trasanction');
                        } else {
                            console.log("Success");
                            callback()
                        }
                    })
                }
            })
        })

    } catch (error) {
        console.log(error);
        callback('error in sendInteractiveListMSGNew', error);
    }
}

exports.sendImageMedia = (msg, phone_no_id, token, from, mediaUrl, LAST_MSG_ID, apiVersion) => {
    try {
        axios({
            method: "POST",
            url: "https://graph.facebook.com/" + apiVersion + "/" + phone_no_id + "/messages?access_token=" + token,
            data: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: from,
                type: "image",
                image: {
                    link: mediaUrl
                },
            },
            headers: {
                "Content-Type": "application/json"
            }
        }).then((success) => {

            let WP_MSG_ID = success.data.messages[0].id
            this.executeQueryData('UPDATE message_trasanction SET STATUS = ?, MESSAGE_STATUS = ?,  WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ? ', ['S', 'unsent', WP_MSG_ID, this.getSystemDate(), LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                if (error) {
                    console.log(error);
                    // logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    // mm.rollbackConnection(connection)
                    // callback('Failed to update message trasanction');
                } else {
                    // callback();
                    console.log("success");
                }
            })
        }, (reason) => {
            console.log("error :- ", reason);
            this.executeQueryData('UPDATE message_trasanction SET STATUS = ?, MESSAGE_STATUS = ?, WP_MSG_ID = ?, MSG_DATETIME =? WHERE ID = ? ', ['F', 'failed', null, this.getSystemDate(), LAST_MSG_ID], supportKey, (error, resultTemplate) => {
                if (error) {
                    console.log(error);
                    // logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    // callback('Failed to update message trasanction');
                    // mm.rollbackConnection(connection)
                } else {
                    // callback();
                    console.log("Failed");

                }
            })
        })

    } catch (error) {
        console.log(error);
    }
}

exports.sendTemplateMSG = (msg, phone_no_id, token, from, templateName) => {
    try {
        axios({
            method: "POST",
            url: "https://graph.facebook.com/" + apiVersion + "/" + phone_no_id + "/messages?access_token=" + token,
            data: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: from,
                type: "template",
                template: {
                    name: "hello_world",
                    language: {
                        code: "en"
                    }
                },
                headers: {
                    "Content-Type": "application/json"
                }
            }
        })
    } catch (error) {
        console.log(error);
    }
}

exports.dateValidation = (stringToValidate) => {
    const regex = /(^(((0[1-9]|1[0-9]|2[0-8])[-](0[1-9]|1[012]))|((29|30|31)[-](0[13578]|1[02]))|((29|30)[-](0[4,6,9]|11)))[-](19|[2-9][0-9])\d\d$)|(^29[-]02[-](19|[2-9][0-9])(00|04|08|12|16|20|24|28|32|36|40|44|48|52|56|60|64|68|72|76|80|84|88|92|96)$)/;;
    return regex.test(stringToValidate);
};

exports.numberValidation = (number) => {
    const regex = /^[0-9]+$/;
    return regex.test(number);
};

exports.checkPinCode = (value) => {
    var expr = /^\d{6}(-\d{4})?$/;
    // var expr = /^[0-9][0-9]{5|4|5}$/;
    return expr.test(value)
};

exports.validatePAN = (panNumber) => {
    var panPattern = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
    return panPattern.test(panNumber);

}

exports.validateGSTNumber = (gstNumber) => {
    const gstPattern = /^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Za-z]{1}Z[0-9A-Z]{1})$/;
    return gstPattern.test(gstNumber);
}

exports.validateName = (name) => {
    var regex = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/;
    return regex.test(name);
}

exports.validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

exports.ValidateMobileNumber = (mobileNumber) => {
    var expr = /^(0|91)?[6-9][0-9]{9}$/;
    return expr.test(mobileNumber)
}