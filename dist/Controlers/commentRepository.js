"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const router = express_1.Router();
router.get('/byBlogPostId', async (req, res) => {
    try {
        return res.status(http_status_codes_1.OK).json({});
    }
    catch (err) {
        utils_1.logger.error(err.message, err);
        return res.status(http_status_codes_1.BAD_REQUEST).json({
            error: err.message
        });
    }
});
router.get('/byId', async (req, res) => {
    try {
        return res.status(http_status_codes_1.OK).json({});
    }
    catch (err) {
        utils_1.logger.error(err.message, err);
        return res.status(http_status_codes_1.BAD_REQUEST).json({
            error: err.message
        });
    }
});
exports.default = router;
