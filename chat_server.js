const express = require("express");

const bcrypt = require("bcrypt");
const fs = require("fs");
const session = require("express-session");

// Create the Express app
const app = express();

// Use the 'public' folder to serve static files
app.use(express.static("public"));

// Use the json middleware to parse JSON data
app.use(express.json());

// Use the session middleware to maintain sessions
const chatSession = session({
    secret: "game",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 300000 }
});
app.use(chatSession);

// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

// Handle the /register endpoint
app.post("/register", (req, res) => {
    // Get the JSON data from the body
    const { username, avatar, name, password } = req.body;

    //
    // D. Reading the users.json file
    //
    const users = JSON.parse(fs.readFileSync("./data/users.json"));

    //
    // E. Checking for the user data correctness
    //
    if (!username || !avatar || !name || !password) {
        res.json({ status: "error", error: "Missing user data." });
        return;
    } 
    if (!containWordCharsOnly(username)) {
        res.json({ status: "error", error: "Username contains invalid characters." });
        return;
    }
    if (username in users) {
        res.json({ status: "error", error: "Username already exists." });
        return;
    }

    //
    // G. Adding the new user account
    //
    const hash = bcrypt.hashSync(password, 10);
    users[username] = { avatar, name, password: hash };
    
    //
    // H. Saving the users.json file
    //
    fs.writeFileSync("./data/users.json", JSON.stringify(users, null, " "));

    //
    // I. Sending a success response to the browser
    //
    res.json({ status: "success"});
});

// Handle the /signin endpoint
app.post("/signin", (req, res) => {
    // Get the JSON data from the body
    const { username, password } = req.body;

    //
    // D. Reading the users.json file
    //
    const users = JSON.parse(fs.readFileSync("./data/users.json"));

    //
    // E. Checking for username/password
    //
    if (!(username in users)) {
        res.json({ status: "error", error: "Username does not exist." });
        return;
    }
    const hashedPassword = users[username].password;
    if (!bcrypt.compareSync(password, hashedPassword)) {
        res.json({ status: "error", error: "Incorrect password." });
        return;
    }

    //
    // G. Sending a success response with the user account
    //
    const user = { username, avatar: users[username].avatar, name: users[username].name };
    req.session.user = user;
    res.json({ status: "success", user: user});
});

// Handle the /validate endpoint
app.get("/validate", (req, res) => {

    //
    // B. Getting req.session.user
    //
    
    if (req.session.user) {
        // User is authenticated, send a success response with the user account
        const user = req.session.user;
        res.json({ status: "success", user });
    } else {
        // User is not authenticated, send an error response
        res.json({ status: "error", error: "User not authenticated." });
    }

    //
    // D. Sending a success response with the user account
    //

});

// Handle the /signout endpoint
app.get("/signout", (req, res) => {

    //
    // Deleting req.session.user
    //
    delete req.session.user;

    //
    // Sending a success response
    //
    res.json({ status: "success" });
});


//
// ***** Please insert your Lab 6 code here *****
//
const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer( app );
const io = new Server(httpServer);

io.use((socket, next) => {
    chatSession(socket.request, {}, next);
});

const onlineUsers = {};
io.on("connection", (socket) => {
    if (socket.request.session.user) {
        const user = socket.request.session.user;
        const { username, avatar, name } = user;
        onlineUsers[username] = user;
        io.emit("add user", JSON.stringify(user));
    }
    socket.on("disconnect", () => {
        if (socket.request.session.user) {
            const user = socket.request.session.user;
            const { username, avatar, name } = user;
            if (onlineUsers[username]) {
                delete onlineUsers[username];
            }
            io.emit("remove user", JSON.stringify(user));
        }
    });
    socket.on("get users", () => {
        socket.emit("users", JSON.stringify(onlineUsers));
    });
    socket.on("get messages", () => {
        const messages = JSON.parse(fs.readFileSync("./data/chatroom.json"));
        socket.emit("messages", JSON.stringify(messages));
    });
    socket.on("post message", (content) => {
        if (socket.request.session.user) {
            const user = socket.request.session.user;
            const message = { user, datetime: new Date().toISOString(), content };
            const messages = JSON.parse(fs.readFileSync("./data/chatroom.json"));
            messages.push(message);
            fs.writeFileSync("./data/chatroom.json", JSON.stringify(messages, null, " "));
            io.emit("add message", JSON.stringify(message));
        }
    });
    socket.on("user typing", () => {
        if (socket.request.session.user) {
            const { username, avatar, name } = socket.request.session.user;
            io.emit("someone typing", username);
        }
    });
})

// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("The chat server has started...");
});

