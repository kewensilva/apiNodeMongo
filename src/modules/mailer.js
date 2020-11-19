const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path  = require('path');
const fs = require('fs');

const mailConfig = require('../config/mail.json');

const { host, port, user, pass } = require('../config/mail.json')
var transport = nodemailer.createTransport({
  host,
  port,
  auth: {
    user,
    pass
  }
});
transport.use('compile', hbs({
  viewEngine: 'handlebars',
  viewPath: path.resolve('./src/resources/mail/'),
  extname: '.html'
}));

module.exports = transport;