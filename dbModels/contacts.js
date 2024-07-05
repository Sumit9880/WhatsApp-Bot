const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contactSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        wa_id: {
            type: String,
            required: true,
            unique: true,
            maxlength: 15
        }
    },
    {
        timestamps: true
    }
);

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
