/*
This file helps for sending the email to the user
using nodemailer dependency
*/

//Getting prerequisites for the module
var nodemailer = require('nodemailer');
require('dotenv').config({path : "./../.env"});

//Getting all the credentials from .env file
var email = process.env.EMAIL_ID;
var password = process.env.PASSWORD;

//Creating an object to connect to email
var transporter = nodemailer.createTransport
({
    service: 'gmail',
    auth: {
      user: email,
      pass: password
    }
});

//This function takes as input email id subject and content
//and sends email to the email
async function sendEmails(emails,subject, content)
{
    var mailOptions = 
    {
        from: `IET Placement Insights <${email}>`,
        to: emails,
        subject: subject,
        html: content
    };
    
    //Sending email
    transporter.sendMail(mailOptions, function(error, info)
    {
        if (error)
        {
          	throw Error(error);
        }
    });
}

//Exporting function sendEmails
module.exports = { sendEmails };