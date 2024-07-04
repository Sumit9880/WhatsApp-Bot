const fs = require('fs');
const path = require('path');
let systemDate = new Date().toLocaleString();

exports.logError = (method, url, error, query, data, type) => {
    const breakLine = "------------------------------------------";
    var file = systemDate.split(',')[0].replace(/\//g, '');
    const logFilePath = path.join('./Loggs', `${file}Error.txt`);
    const logMessage = `\n${breakLine}\nRequested Time :${systemDate}\nRequested Method :${method}\nRequested Url :${url}\nQuery: ${query}\nData: ${data}\nType: ${type}\nError: ${error}`;

    try {
        fs.appendFile(logFilePath, logMessage, (err) => {
            if (err) {
                console.error(`Error logging to file: ${err}`);
            } else {
                console.log("Logged error to file successfully.");
            }
        });
    } catch (err) {
        console.error(`Error logging to file: ${err}`);
    }
}

exports.logInfo = (method, url, query, data, type) => {
    const breakLine = "---------------------------";
    var file = systemDate.split(' ')[0].replace(/-/g, '');
    const logFilePath = path.join('./Loggs', `${file}Info.txt`);
    const logMessage = `\n${breakLine}\nRequested Time :${systemDate}\nRequested Method :${method}\nRequested Url :${url}\nQuery: ${query}\nData: ${JSON.stringify(data)}\nType: ${type}`;

    try {
        fs.appendFile(logFilePath, logMessage, (err) => {
            if (err) {
                console.error(`Error logging to file: ${err}`);
            } else {
                console.log("Logged Info to file successfully.");
            }
        });
    } catch (err) {
        console.error(`Error logging to file: ${err}`);
    }
}

