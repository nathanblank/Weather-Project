process.stdin.setEncoding("utf8");
let itemsList = []
let fs = require("fs");
let bodyParser = require('body-parser');
let express = require('express');
let path = require('path');
let app = express();

let order = [];
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:false}));

require("dotenv").config({ path: path.resolve(__dirname, '.env') }) 

let mongoUsername = process.env.MONGO_DB_USERNAME;
let password = process.env.MONGO_DB_PASSWORD;

 /* Our database and collection */
let databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
let { MongoClient, ServerApiVersion } = require('mongodb');

app.get("/", (req, res) => {
    res.render('index', {port: port}); 
});

app.get("/signIn", (req, res) => {
    res.render('signIn'); 
});

app.get("/signUp", (req, res) => {
    res.render('signUp'); 
});

app.post("/signUpResponse", async (req, res) => {
    let {username, email, password} = req.body;
    let result = await lookUpOneUser(username);
    if (result != null){
        responseString = "We're sorry but a user with that username already exists. <br>Click <a href='/signUp'>HERE</a> to try again."
    } else {
        addUser(username,email,password);
        responseString = `Welcome to My Weather, ${username}! Click <a href="/home">HERE</a> to view weather data!`
    }
    res.render('signUpResponse', {responseString: responseString})
});

app.post("/signInResponse", async (req, res) => {
    let {username, email, password} = req.body;
    let result = await lookUpOneUser(username);
    if (result != null){
        if(result["password"] == password){
            responseString = `Welcome back ${username}! Click <a href="/home">HERE</a> to view weather data!`
        } else {
        responseString = "We're sorry but we could not validate that as a correct username and password combination. <br>Click <a href='/signIn'>HERE</a> to try again."
        }
    } else {
        responseString = "We're sorry but we could not validate that as a correct username and password combination. <br>Click <a href='/signIn'>HERE</a> to try again."
    }
    res.render('signInResponse', {responseString: responseString})
});

app.get("/home", async (req, res) => {
    res.render('home')
});


if (process.argv.length != 3) {
    process.stdout.write(`Usage weatherServer.js PORT_NUMBER_HERE\n`);
    process.exit(1);
} else {
    port = process.argv[2];
}
app.listen(port);


process.stdout.write("Stop to shutdown the server: ");
process.stdin.on('readable', function () {
	let dataInput = process.stdin.read();
	if (dataInput !== null) {
		let command = dataInput.trim();
		if (command == "stop") {
			process.stdout.write("Shutting down the server\n");
            process.exit(0);
        }
    }
});

async function addUser(signInName, email, password){
    let uri = `mongodb+srv://nathan:12345@weatherproject.pqsijqh.mongodb.net/?retryWrites=true&w=majority`;
    let client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        let newUser = {username: signInName, email: email, password: password}
        let result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newUser);
        return result
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function lookUpOneUser(signInName) {
    let uri = `mongodb+srv://nathan:12345@weatherproject.pqsijqh.mongodb.net/?retryWrites=true&w=majority`;
    let client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};

    try {
        await client.connect();
        let filter = {username: signInName};
        let result = await client.db(databaseAndCollection.db)
                            .collection(databaseAndCollection.collection)
                            .findOne(filter);

        if (result) {
            return result
        } else {
            document.querySelector("#errorMessage").innerHTML = "No user found with that username"
        }
    } catch (e) {
        // console.log("FOUND AN ERROR");
        console.error(e);
    } finally {
        await client.close();
    }
}

function getCurrentDateTime() {
    let currentDate = new Date();
    let daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let dayOfWeek = daysOfWeek[currentDate.getUTCDay()];
    let month = months[currentDate.getUTCMonth()];
    let day = currentDate.getUTCDate();
    let year = currentDate.getUTCFullYear();
    let hours = currentDate.getUTCHours();
    let minutes = currentDate.getUTCMinutes();
    let seconds = currentDate.getUTCSeconds();
    let timeZoneOffset = currentDate.getTimezoneOffset();
    let timeZoneOffsetHours = Math.floor(Math.abs(timeZoneOffset) / 60);
    let timeZoneOffsetMinutes = Math.abs(timeZoneOffset) % 60;
    let timeZoneSign = timeZoneOffset >= 0 ? '-' : '+';
    let timeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let formattedDateTime = `${dayOfWeek} ${month} ${day} ${year} ${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)} GMT${timeZoneSign}${padZero(timeZoneOffsetHours)}${padZero(timeZoneOffsetMinutes)} (${timeZoneName})`;
    return formattedDateTime;
}

function padZero(value) {
    return value < 10 ? `0${value}` : value;
}