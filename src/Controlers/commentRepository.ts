
import { logger } from '../utils';
import { Request, Response, Router, Express } from 'express';
import { BAD_REQUEST, CREATED, OK } from 'http-status-codes';
import { ParamsDictionary } from 'express-serve-static-core';
import Comment from '../Models/Comment'
import uuid from 'uuid/v4'
// Init shared
const router = Router();

/******************************************************************************
 *                      Get  comment  by BlogId- "GET /api/comment/commentByBlogId"
 ******************************************************************************/

router.get('/commentByBlogId', async (req: Request, res: Response) => {
    try {
      const { hashKey, sortKey } = req.query
      const params = {
        Where: {
          HashKey: hashKey,
          SortKey: sortKey || null
        }
      }

      const result = await Comment.query(params)
      return res.status(OK).json(result);
    } catch (err) {
      logger.error(err.message, err);
      return res.status(BAD_REQUEST).json({
          error: err.message
      })
    }
})


/******************************************************************************
 *                       Add One - "POST /api/comment/newComment"
 ******************************************************************************/

router.post('/newComment', async (req: Request, res: Response) => {
    try {
      const {
        author,
        body,
        blogId
      } = req.body

      const params = {
        Item: {
          Id: uuid(),
          Author: author,
          Body: body,
          BlogId: blogId
        }
      }

      const result = await Comment.putItem(params)

      return res.status(CREATED).json(result)
    } catch (err) {
        logger.error(err.message, err);
        return res.status(BAD_REQUEST).json({
            error: err.message
        });
    }
});

// /******************************************************************************
//  *                       Update - "PUT /api/comment/updatecommentById"
//  ******************************************************************************/

router.put('/updateCommentById', async (req: Request, res: Response) => {
    try {
      const {
        Key,
        UpdateItem
      } = req.body

      const {
        body,
        author,
        ...rest
      } = UpdateItem

      const params = {
        Key: {
          HashKey: Key.blogId,
          SortKey: Key.Id
        },
        Item: {
          Body: body,
          Author: author,
          Detail: rest
        }
      }

      const result = await Comment.update(params)

      return res.status(OK).json(result);
    } catch (err) {
        logger.error(err.message, err);
        return res.status(BAD_REQUEST).json({
            error: err.message
        });
    }
});

// /******************************************************************************
//  *                    Delete - "POST /api/comment/deleteComment"
//  ******************************************************************************/

router.post('/deleteComment', async (req: Request, res: Response) => {
    try {
      const { hashKey, sortKey } = req.body
      const params = {
        Where: {
          HashKey: hashKey,
          SortKey: sortKey || null
        }
      }

      const result = await Comment.delete(params)
      return res.status(OK).json(result);
    } catch (err) {
        logger.error(err.message, err);
        return res.status(BAD_REQUEST).json({
            error: err.message
        });
    }
});

/******************************************************************************
 *                                     Export
 ******************************************************************************/

export default router;
