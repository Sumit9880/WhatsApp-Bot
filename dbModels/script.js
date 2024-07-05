const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const scriptDetailSchema = new Schema(
    {
        msgOption: {
            type: String,
            required: false
        },
        redirectId: {
            type: Schema.Types.ObjectId,
            ref: 'Script',
            required: false
        },
    },
    {
        _id: false
    }
);

const scriptSchema = new Schema(
    {
        msgType: {
            type: String,
            required: true
        },
        msgContent: {
            type: String,
            required: true
        },
        redirectId: {
            type: Schema.Types.ObjectId,
            ref: 'Script',
            required: false
        },
        waitTime: {
            type: Number,
            default: 0
        },
        validationType: {
            type: String,
            required: false
        },
        minResLength: {
            type: Number,
            required: false
        },
        maxResLength: {
            type: Number,
            required: false
        },
        details: [scriptDetailSchema],
    },
    {
        timestamps: true
    }
);

const Script = mongoose.model('Script', scriptSchema);

module.exports = Script;
