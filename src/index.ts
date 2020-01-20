import cookieParser from 'cookie-parser'
import express from 'express'
import { Request, Response } from 'express'
import logger from 'morgan'
import path from 'path'
import BaseRouter from './Controlers'

// Init express
const app = express()

// Add middleware/settings/routes to express.
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

app.use('/api', BaseRouter)
app.get('/healthcheck', (req, res) => {
  res.status(500).send('I am happy and healthy\n')
});

const viewsDir = path.join(__dirname, 'views')
app.set('views', viewsDir)
const staticDir = path.join(__dirname, 'public')
app.use(express.static(staticDir))
app.get('*', (req: Request, res: Response) => {
    res.sendFile('index.html', {root: viewsDir})
});

// Export express instance
export default app;
