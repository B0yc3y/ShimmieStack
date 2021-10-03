import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { Server } from 'http';

const STACK_VERSION = '0.4';

//
// Entry point of the application. Gets everything started.
//

export const app: Express = express()
    .use(express.json()) // expect json payloads only
    .use(cookieParser()); // expect cookeis

export const startApiListener = (app: Express, port: number): Server => {
    return app.listen(port, () =>
        console.info(
            `ShimmieStack [${STACK_VERSION}] API Server listening on ${port}!`
        )
    );
};