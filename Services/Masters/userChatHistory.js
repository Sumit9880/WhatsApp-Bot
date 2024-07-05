const UserChatHistory = require("../../dbModels/userChatHistory");

function reqData(req) {
    const { mobileNo, sender, msgContent, sentTime, deliveredTime, readTime, status, scriptId } = req.body;
    return {
        mobileNo: mobileNo,
        sender: sender,
        msgContent: msgContent,
        sentTime: sentTime,
        deliveredTime: deliveredTime,
        readTime: readTime,
        status: status,
        scriptId: scriptId,
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
        console.log(filter);
        const data = await UserChatHistory.find(filter)
            .sort(sortConfig)
            .skip(skip)
            .limit(pageSize)
            .select(select);

        const count = await UserChatHistory.countDocuments(filter);

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
            message: "Failed to get UserChatHistorys",
        });
    }
};

exports.create = async (req, res) => {
    try {
        const data = reqData(req);
        const result = await UserChatHistory.create(data);
        res.send({
            code: 200,
            message: "UserChatHistory created successfully",
        });
    } catch (error) {
        console.error(error);
        res.send({
            code: 400,
            message: "Failed to create UserChatHistory",
        })
    }
};

exports.update = async (req, res) => {
    try {
        const data = reqData(req);
        const result = await UserChatHistory.findOneAndUpdate({ _id: req.body._id }, data);
        res.send({
            code: 200,
            message: "UserChatHistory Updated successfully",
        });
    } catch (error) {
        console.error(error);
        res.send({
            code: 400,
            message: "Failed to update UserChatHistory",
        })
    }
}