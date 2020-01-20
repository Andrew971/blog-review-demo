import { Router } from 'express'
import BlogRepository from './blogRepository'
import CommentRepository from './commentRepository'

// Init router and path
const router = Router()

// Add sub-routes
router.use('/blog', BlogRepository)
router.use('/comment', CommentRepository)

// Export the base-router
export default router
