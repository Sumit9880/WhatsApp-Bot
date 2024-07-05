const Contact = require("../../dbModels/contacts");

function reqData(req) {
    const { name, wa_id } = req.body;
    return {
        name: name,
        wa_id: wa_id
    };
}

exports.get = async (req, res) => {
    try {
        let { pageIndex = 0, pageSize = 10, sortKey = '_id', sortValue = 'DESC', filter = {}, select = {} } = req.body;

        pageIndex = parseInt(pageIndex);
        pageSize = parseInt(pageSize);
        const skip = pageIndex * pageSize;
        const sortConfig = {};
        sortConfig[sortKey] = sortValue === 'DESC' ? -1 : 1;

        const data = await Contact.find(filter)
            .sort(sortConfig)
            .skip(skip)
            .limit(pageSize)
            .select(select);

        const count = await Contact.countDocuments(filter);

        res.send({
            code: 200,
            message: "success",
            count: count,
            dataL: data.length,
            data: data,
        });
    } catch (error) {
        console.error(error);
        res.send({
            code: 400,
            message: "Failed to get Contacts",
        });
    }
};

exports.create = async (req, res) => {
    try {
        const data = reqData(req);
        const result = await Contact.create(data);
        res.send({
            code: 200,
            message: "Contact created successfully",
        });
    } catch (error) {
        console.error(error);
        res.send({
            code: 400,
            message: "Failed to create Contact",
        })
    }
};

exports.update = async (req, res) => {
    try {
        const data = reqData(req);
        const result = await Contact.findOneAndUpdate({ _id: req.body._id }, data);
        res.send({
            code: 200,
            message: "Contact Updated successfully",
        });
    } catch (error) {
        console.error(error);
        res.send({
            code: 400,
            message: "Failed to update Contact",
        })
    }
}
