const Socket = (function() {
    // This stores the current Socket.IO socket
    let socket = null;

    // This function gets the socket from the module
    const getSocket = function() {
        return socket;
    };

    // This function connects the server and initializes the socket
    const connect = function() {
        socket = io();

        // Wait for the socket to connect successfully
        socket.on("connect", () => {
            // Get the online user list
            console.log(socket)
            socket.emit("get users");

            // Get the chatroom messages
            socket.emit("get public messages");
        });

        // Set up the users event
        socket.on("users", (onlineUsers) => {
            onlineUsers = JSON.parse(onlineUsers);

            // Show the online users
            OnlineUsersPanel.update(onlineUsers);
        });

        // Set up the add user event
        socket.on("add user", (user) => {
            user = JSON.parse(user);

            // Add the online user
            OnlineUsersPanel.addUser(user);
        });

        // Set up the remove user event
        socket.on("remove user", (user) => {
            user = JSON.parse(user);

            // Remove the online user
            OnlineUsersPanel.removeUser(user);
        });

        // Set up the messages event
        socket.on("messages", (chatroom) => {
            chatroom = JSON.parse(chatroom);

            // Show the chatroom messages
            ChatPanel.update(chatroom);
        });

        // Set up the add message event
        socket.on("add message", (message) => {
            message = JSON.parse(message);

            // Add the message to the chatroom
            ChatPanel.addMessage(message);
        });

        socket.on("someone typing", (username) => {
            ChatPanel.setTyping(username);
        })

        // // Handle private messages
        // socket.on("private message", ({ recipient, content }) => {
        //     const sender = socket.request.session.user;
        //     if (recipient in onlineUsers) {
        //         const message = { user: sender, datetime: new Date().toISOString(), content };
        //         // Emit the message to the recipient only
        //         socket.to(recipient).emit("private message", JSON.stringify(message));
        //     }
        // });
        // Handle private messages
        socket.on("private message", ({ recipient, content }) => {
            const sender = socket.request.session.user;
            if (recipient in onlineUsers) {
                const message = { user: sender, datetime: new Date().toISOString(), content };
                // Emit the message to the recipient only
                socket.to(recipient).emit("private message", JSON.stringify(message));
                
                // Create a new private chat panel if it doesn't exist
                createPrivateChatPanel(recipient);
            }
        });
    };

    // Function to create a new private chat panel
    const createPrivateChatPanel = (recipient) => {
        const chatPanelId = `private-chat-${recipient}`;
        if (!$(`#${chatPanelId}`).length) { // Check if the panel already exists
            const privateChatPanel = `
                <div id="${chatPanelId}" class="private-chat-panel">
                    <div class="chat-title">Private Chat with ${recipient}</div>
                    <div class="private-chat-area"></div>
                    <input class="private-chat-input" placeholder="Type a message...">
                    <button class="send-private-message">Send</button>
                </div>
            `;
            $("#main-panel").append(privateChatPanel); // Append to the main panel
            $(`#private-chat-${recipient}`).hide();
        }
    };

    // This function disconnects the socket from the server
    const disconnect = function() {
        socket.disconnect();
        socket = null;
    };

    // This function sends a post message event to the server
    const postMessage = function(content) {
        if (socket && socket.connected) {
            socket.emit("post message", content);
        }
    };

    // This functino sends 
    const userTyping = function() {
        if (socket && socket.connected) {
            socket.emit("user typing");
        }
    };

    return { getSocket, connect, disconnect, postMessage, userTyping };
})();
