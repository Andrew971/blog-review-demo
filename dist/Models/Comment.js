"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dataStore_1 = tslib_1.__importDefault(require("../utils/dataStore"));
const schema = {
    Key: {
        HashKey: 'BlogPostId',
        SortKey: 'Id'
    },
    Index: {
        Id_Index: {
            HashKey: 'Id'
        }
    },
    Item: {
        Id: 'S',
        Author: 'S',
        Body: 'S',
        BlogPostId: 'S'
    }
};
function streamEventHandler(event) {
    if (event.eventName === 'INSERT') {
    }
}
exports.default = new dataStore_1.default('Comment', schema, {
    stream: streamEventHandler,
    batchSize: 1
});
