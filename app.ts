require('dotenv').config();
import express, { Application, Request, Response, NextFunction, Errback } from 'express';
import cors from 'cors';
import path from 'path';
import { routes } from './src/routes';
import mongooseConnect from './src/db';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import * as http from 'http';
import * as socketio from "socket.io";
import { CronJob } from "cron";
//import helmet from 'helmet';
import morgan from 'morgan'
import { errorLogger, logger } from "./src/config/winston";

//console.log(process.argv.slice(-1).join())               

const app: Application = express();
//app.use(helmet());// Secure express apps by setting various HTTP headers
app.use(morgan('combined', { stream: logger.stream }));// Logger

const httpServer: http.Server = http.createServer(app);
const io = new socketio.Server(httpServer, { cors: { origin: '*' }, serveClient: false });
app.set('socketIO', io);

// parse application/x-www-form-urlencoded
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  //res.setHeader('Content-Type', 'application/json');
  next();
});

app.use(cors());
app.use(express.urlencoded({ extended: true }))
app.use(express.json({ limit: '10mb' })); //limit object json (send with body)
app.use(express.static('public'));

app.use((err: Errback, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'UnauthorizedError') res.status(401).send('Missing authentication credentials.');
});

const limiter: rateLimit.RateLimit = rateLimit({
  windowMs: (60 * 1000) * 1, // 1 min
  max: 500 //limit for each IP with 500 requests per windowMs
});

app.use(limiter);
app.set("port", process.env.PORT || 3000);

routes(app);


(async () => {
  try {
    await mongooseConnect(app, httpServer, io);
  } catch (error: any) {
    errorLogger.error(`${error.status || 500} - [app.ts] - ${error.message || 'Processing error'}`);
  }
})();

app.get('*', (req: Request, res: Response) => {
  res.status(404).sendFile(path.join(__dirname + '/public/error.html'))
});

export default app; // export to call app to test spec