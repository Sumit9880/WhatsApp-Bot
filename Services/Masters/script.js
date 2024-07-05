const Script = require("../../dbModels/script");

function reqData(req) {
    const { msgType, msgContent, redirectId, waitTime, validationType, minResLength, maxResLength, details } = req.body;
    return {
        msgType: msgType,
        msgContent: msgContent,
        redirectId: redirectId,
        waitTime: waitTime,
        validationType: validationType,
        minResLength: minResLength,
        maxResLength: maxResLength,
        details: details
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

        const data = await Script.find(filter)
            .sort(sortConfig)
            .skip(skip)
            .limit(pageSize)
            .select(select);

        const count = await Script.countDocuments(filter);

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
            message: "Failed to get Scripts",
        });
    }
};

exports.create = async (req, res) => {
    try {
        const data = reqData(req);
        const result = await Script.create(data);
        res.send({
            code: 200,
            message: "Script created successfully",
        });
    } catch (error) {
        console.error(error);
        res.send({
            code: 400,
            message: "Failed to create Script",
        })
    }
};

exports.update = async (req, res) => {
    try {
        const data = reqData(req);
        const result = await Script.findOneAndUpdate({ _id: req.body._id }, data);
        res.send({
            code: 200,
            message: "Script Updated successfully",
        });
    } catch (error) {
        console.error(error);
        res.send({
            code: 400,
            message: "Failed to update Script",
        })
    }
}