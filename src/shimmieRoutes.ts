//
// Set up all the routes from all over the place.
//

import { NextFunction, Request, Response, Router, Express } from 'express';


export interface IShimmieRoutes {
    timeLogger(req: Request, res: Response, next: NextFunction): void;
    mountApi(app: Express, name: string, mountPoint: string, route: Router): Express;
    catchAll404s(req: Request, res: Response,): void;
    setupMiddleware(app: Express): Express;
    finaliseRoutes(app: Express): Express;
}

export const ShimmieRoutes: IShimmieRoutes = {
    timeLogger: function (req: Request, res: Response, next: NextFunction): void {
        console.info(
            `[${new Date(Date.now()).toLocaleString()}] Route::[${req.method}] ${req.path
            }`
        );
        next();
    },

    mountApi: function (app: Express, name: string, mountPoint: string, route: Router): Express {
        // WARNING: this does not check for overwriting, so because not to mount different functions on
        //          the same head
        if (!mountPoint || !route) {
            throw 'Missing mountPoint details. Please check: ';
        }
        app.use(mountPoint, route);
        console.info(`>>>> Mounted ${mountPoint} with [${name}]`);
        return app;
    },

    catchAll404s: function (req: Request, res: Response): void {
        res.status(404).json({
            statusCode: 404,
            message: `What you talking 'bout Willis? ${req.baseUrl}`,
        });
    },

    setupMiddleware: function (app: Express): Express {
        // set up any middleware
        app.use(ShimmieRoutes.timeLogger);

        return app
    },

    // Any routes that get done after all the user routes have been missed
    finaliseRoutes: function (app: Express): Express {
        // call-all 404s
        app.use('*', ShimmieRoutes.catchAll404s);

        // A catch-all call by express-async-errors
        // TODO: implement
        app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            console.error('500', err.message);
            console.dir(err);
            res.status(500).json({ error: err.message });
        });

        return app
    }
}
