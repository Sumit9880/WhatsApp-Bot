const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const scriptDetailsSchema = new Schema(
    {
        SCRIPT_ID: {
            type: Schema.Types.ObjectId,
            required: true
        },
        MSG_OPTION: {
            type: String,
        },
        REDIRECT_ID: {
            type: Schema.Types.ObjectId
        },
    },
    {
        timestamps: true
    }
);

const ScriptDetails = mongoose.model('ScriptDetail', scriptDetailsSchema);

module.exports = ScriptDetails;
