const jwt = require('jsonwebtoken');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');
// const dm = require('../Modules/dbModule');
const { logError } = require('../Modules/logger');

exports.checkAuthorization = (req, res, next) => {
    try {
        var apikey = req.headers['apikey'];
        if (apikey == process.env.APIKEY) {
            next();
        }
        else {
            res.send({
                "code": 300,
                "message": "Access Denied...!"
            });
        }
    } catch (error) {
        console.error(error)
        res.send({
            "code": 400,
            "message": "Server not found..."
        });
    }
}

exports.checkToken = (req, res, next) => {
    let bearerHeader = req.headers['token'];
    if (typeof bearerHeader !== 'undefined') {
        jwt.verify(bearerHeader, process.env.SECRET, (err, decode) => {
            if (err) {
                res.send({
                    'code': 400,
                    'message': 'Invalid token'
                });
            }
            else {
                next();
            }
        });
    }
    else {
        res.send({
            'code': 400,
            'message': 'Access Denied...!'
        });
    }
}

