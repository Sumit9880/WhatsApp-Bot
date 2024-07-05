const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userChatHistorySchema = new Schema(
    {
        mobileNo: {
            type: String,
            required: true,
            maxlength: 16
        },
        sender: {
            type: String,
            required: true,
            maxlength: 1
        },
        msgContent: {
            type: String,
            required: true,
        },
        sentTime: {
            type: Date,
            default: Date.now
        },
        deliveredTime: {
            type: Date,
            default: null
        },
        readTime: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            required: true,
            maxlength: 1
        },
        scriptId: {
            type: Schema.Types.ObjectId,
            ref: 'Script',
            required: false
        },
    },
    {
        timestamps: true
    }
);

userChatHistorySchema.index({ mobileNo: 1 });
userChatHistorySchema.index({ status: 1 });
userChatHistorySchema.index({ scriptId: 1 });

const UserChatHistory = mongoose.model('UserChatHistory', userChatHistorySchema);

module.exports = UserChatHistory;
