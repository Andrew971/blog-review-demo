
import { logger } from '../utils';
import { Request, Response, Router, Express } from 'express';
import { BAD_REQUEST, CREATED, OK } from 'http-status-codes';
import { ParamsDictionary } from 'express-serve-static-core';
import Blog from '../Models/Blog'
import uuid from 'uuid/v4'
// Init shared
const router = Router();

/******************************************************************************
 *                      Get All blog - "GET /api/blog/all"
 ******************************************************************************/

router.get('/blogById', async (req: Request, res: Response) => {
    try {
      const { hashKey, sortKey } = req.query
      const params = {
        Where: {
          HashKey: hashKey,
          SortKey: sortKey || null
        }
      }

      const result = await Blog.query(params)
      return res.status(OK).json(result);
    } catch (err) {
      logger.error(err.message, err);
      return res.status(BAD_REQUEST).json({
          error: err.message
      })
    }
})

router.get('/blogByAuthor', async (req: Request, res: Response) => {
    try {
      const { hashKey, sortKey } = req.query
      const params = {
        Index: 'Author_Index',
        Where: {
          HashKey: hashKey,
          SortKey: sortKey || null
        }
      }

      const result = await Blog.query(params)
      return res.status(OK).json(result);
    } catch (err) {
        logger.error(err.message, err);
        return res.status(BAD_REQUEST).json({
            error: err.message
        });
    }
});

/******************************************************************************
 *                       Add One - "POST /api/blog/add"
 ******************************************************************************/

router.post('/newBlog', async (req: Request, res: Response) => {
    try {
      const {
        author,
        body,
        title
      } = req.body

      const params = {
        Item: {
          Id: uuid(),
          Title: title,
          Author: author,
          Body: body
        }
      }

      const result = await Blog.putItem(params)

      return res.status(CREATED).json(result)
    } catch (err) {
        logger.error(err.message, err);
        return res.status(BAD_REQUEST).json({
            error: err.message
        });
    }
});

// /******************************************************************************
//  *                       Update - "PUT /api/blog/update"
//  ******************************************************************************/

router.put('/updateBlogById', async (req: Request, res: Response) => {
    try {
      const {
        Key,
        UpdateItem
      } = req.body

      const {
        title,
        body,
        author,
        ...rest
      } = UpdateItem

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
      }

      const result = await Blog.putItem(params)

      return res.status(OK).json(result);
    } catch (err) {
        logger.error(err.message, err);
        return res.status(BAD_REQUEST).json({
            error: err.message
        });
    }
});

// /******************************************************************************
//  *                    Delete - "DELETE /api/blog/delete/:id"
//  ******************************************************************************/

router.post('/deleteBlog', async (req: Request, res: Response) => {
    try {
      const { hashKey, sortKey } = req.body
      const params = {
        Where: {
          HashKey: hashKey,
          SortKey: sortKey || null
        }
      }

      const result = await Blog.delete(params)
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
