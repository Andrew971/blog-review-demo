"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dataStore_1 = tslib_1.__importDefault(require("../utils/dataStore"));
const Blog_1 = tslib_1.__importDefault(require("./Blog"));
const schema = {
    Key: {
        HashKey: 'BlogId',
        SortKey: 'Id'
    },
    Item: {
        Id: 'S',
        Author: 'S',
        Body: 'S',
        BlogId: 'S'
    }
};
async function streamEventHandler(event) {
    if (event.eventName === 'INSERT') {
        const { OldImage, NewImage } = event.body;
        const queryParam = {
            Where: {
                HashKey: NewImage.BlogId
            }
        };
        const queryResult = await Blog_1.default.query(queryParam);
        const blogItem = queryResult.Item[0];
        const params = {
            Key: {
                HashKey: blogItem.Id,
                SortKey: blogItem.Title
            },
            Item: {
                Replies: blogItem.Replies ? blogItem.Replies + 1 : 1
            }
        };
        const result = await Blog_1.default.update(params);
        return result;
    }
}
exports.default = new dataStore_1.default('Comment', schema, {
    stream: streamEventHandler,
    batchSize: 1
});
