"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const utils_1 = require("../utils");
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const Blog_1 = tslib_1.__importDefault(require("../Models/Blog"));
const v4_1 = tslib_1.__importDefault(require("uuid/v4"));
const router = express_1.Router();
router.get('/blogById', async (req, res) => {
    try {
        const { hashKey, sortKey } = req.query;
        const params = {
            Where: {
                HashKey: hashKey,
                SortKey: sortKey || null
            }
        };
        const result = await Blog_1.default.query(params);
        return res.status(http_status_codes_1.OK).json(result);
    }
    catch (err) {
        utils_1.logger.error(err.message, err);
        return res.status(http_status_codes_1.BAD_REQUEST).json({
            error: err.message
        });
    }
});
router.get('/blogByAuthor', async (req, res) => {
    try {
        const { hashKey, sortKey } = req.query;
        const params = {
            Index: 'Author_Index',
            Where: {
                HashKey: hashKey,
                SortKey: sortKey || null
            }
        };
        const result = await Blog_1.default.query(params);
        return res.status(http_status_codes_1.OK).json(result);
    }
    catch (err) {
        utils_1.logger.error(err.message, err);
        return res.status(http_status_codes_1.BAD_REQUEST).json({
            error: err.message
        });
    }
});
router.post('/newBlog', async (req, res) => {
    try {
        const { author, body, title } = req.body;
        const params = {
            Item: {
                Id: v4_1.default(),
                Title: title,
                Author: author,
                Body: body
            }
        };
        const result = await Blog_1.default.putItem(params);
        return res.status(http_status_codes_1.CREATED).json(result);
    }
    catch (err) {
        utils_1.logger.error(err.message, err);
        return res.status(http_status_codes_1.BAD_REQUEST).json({
            error: err.message
        });
    }
});
router.put('/updateBlogById', async (req, res) => {
    try {
        const { Key, UpdateItem } = req.body;
        const { title, body, author, ...rest } = UpdateItem;
        const params = {
            Key: {
                HashKey: Key.id,
                SortKey: Key.title
            },
            Item: {
                Title: title,
                Body: body,
                Author: author,
                Detail: rest
            }
        };
        const result = await Blog_1.default.update(params);
        return res.status(http_status_codes_1.OK).json(result);
    }
    catch (err) {
        utils_1.logger.error(err.message, err);
        return res.status(http_status_codes_1.BAD_REQUEST).json({
            error: err.message
        });
    }
});
router.post('/deleteBlog', async (req, res) => {
    try {
        const { hashKey, sortKey } = req.body;
        const params = {
            Where: {
                HashKey: hashKey,
                SortKey: sortKey || null
            }
        };
        const result = await Blog_1.default.delete(params);
        return res.status(http_status_codes_1.OK).json(result);
    }
    catch (err) {
        utils_1.logger.error(err.message, err);
        return res.status(http_status_codes_1.BAD_REQUEST).json({
            error: err.message
        });
    }
});
exports.default = router;
