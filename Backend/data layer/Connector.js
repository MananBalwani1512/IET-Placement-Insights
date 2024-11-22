//The library to connect to postgre sql
var mysql = require('mysql2/promise');

//The configuration of the environment variables.
require('dotenv').config({"path" : "./../.env"});

//Getting the connection string from .env file
var userName = process.env.DATABASE_USER_NAME;
var password = process.env.DATABASE_PASSWORD;
var databaseName = process.env.DATABASE_NAME;
var host = process.env.DATABASE_HOST;

//The function which helps to connect to the database
async function getPool()
{
    var pool = mysql.createPool({
        "host" : host,
        "user" : userName,
        "password" : password,
        "database" : databaseName,
        "connectionLimit" : 100,
        "waitForConnections" : true,
        "queueLimit" : 0
    });
    return pool;
}

//The exports are defined so as to use them from everywhere
module.exports = { getPool };