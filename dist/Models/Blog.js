"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dataStore_1 = tslib_1.__importDefault(require("../utils/dataStore"));
const schema = {
    Key: {
        HashKey: 'Id',
        SortKey: 'Title'
    },
    Index: {
        Author_Index: {
            HashKey: 'Author',
            SortKey: 'Title'
        }
    },
    Item: {
        Id: 'S',
        Author: 'S',
        Body: 'S'
    }
};
exports.default = new dataStore_1.default('Blog', schema);
