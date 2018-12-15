import { enableProdMode } from '@angular/core';
// Express Engine
import { ngExpressEngine } from '@nguniversal/express-engine';
// Import module map for lazy loading
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';
import * as express from 'express';
import * as functions from 'firebase-functions';
import { join } from 'path';
import 'reflect-metadata';
import 'zone.js/dist/zone-node';

const isBot = req => {
  /**
   * A default set of user agent patterns for bots/crawlers that do not perform
   * well with pages that require JavaScript.
   */
  const botUserAgents = [
    'baiduspider',
    'bingbot',
    'embedly',
    'facebookexternalhit',
    'linkedinbot',
    'outbrain',
    'pinterest',
    'quora link preview',
    'rogerbot',
    'showyoubot',
    'slackbot',
    'twitterbot',
    'vkShare',
    'W3C_Validator',
    'whatsapp'
  ];

  const userAgentPattern = new RegExp(botUserAgents.join('|'), 'i');

  let ua = req.headers['user-agent'];
  return ua !== undefined && userAgentPattern.test(ua);
};

// Faster server renders w/ Prod mode (dev mode never needed)
enableProdMode();

// Express server
const app = express();

const PORT = process.env.PORT || 4000;

const DIST_FOLDER = join(process.cwd(), 'public/browser');

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const {
  AppServerModuleNgFactory,
  LAZY_MODULE_MAP
} = require('../public/server/main');

// Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
app.engine(
  'html',
  ngExpressEngine({
    bootstrap: AppServerModuleNgFactory,
    providers: [provideModuleMap(LAZY_MODULE_MAP)]
  })
);

app.set('view engine', 'html');
app.set('views', DIST_FOLDER);

// Example Express Rest API endpoints
// app.get('/api/**', (req, res) => { });
// Server static files from /browser
app.get(
  '*.*',
  express.static(DIST_FOLDER, {
    maxAge: '1y'
  })
);

// All regular routes use the Universal engine
app.get('*', (req, res) => {
  if (isBot(req)) {
    res.render('index', { req });
  } else {
    res.sendFile('index.html', { root: './public/browser' });
  }
});

// Start up the Node server
// app.listen(PORT, () => {
//   console.log(`Node Express server listening on http://localhost:${PORT}`);
// });

export const ssr = functions.https.onRequest(app);
