const SignInForm = (function() {
    // This function initializes the UI
    const initialize = function() {
        // Populate the avatar selection
        Avatar.populate($("#register-avatar"));
        
        // Hide it
        $("#signin-overlay").hide();

        // Submit event for the signin form
        $("#signin-form").on("submit", (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $("#signin-username").val().trim();
            const password = $("#signin-password").val().trim();

            // Send a signin request
            Authentication.signin(username, password,
                () => {
                    hide();
                    UserPanel.update(Authentication.getUser());
                    UserPanel.show();

                    Socket.connect();
                },
                (error) => { $("#signin-message").text(error); }
            );
        });

        // Submit event for the register form
        $("#register-form").on("submit", (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $("#register-username").val().trim();
            const avatar   = $("#register-avatar").val();
            const name     = $("#register-name").val().trim();
            const password = $("#register-password").val().trim();
            const confirmPassword = $("#register-confirm").val().trim();

            // Password and confirmation does not match
            if (password != confirmPassword) {
                $("#register-message").text("Passwords do not match.");
                return;
            }

            // Send a register request
            Registration.register(username, avatar, name, password,
                () => {
                    $("#register-form").get(0).reset();
                    $("#register-message").text("You can sign in now.");
                },
                (error) => { $("#register-message").text(error); }
            );
        });
    };

    // This function shows the form
    const show = function() {
        $("#signin-overlay").fadeIn(500);
    };

    // This function hides the form
    const hide = function() {
        $("#signin-form").get(0).reset();
        $("#signin-message").text("");
        $("#register-message").text("");
        $("#signin-overlay").fadeOut(500);
    };

    return { initialize, show, hide };
})();

const UserPanel = (function() {
    // This function initializes the UI
    const initialize = function() {
        // Hide it
        $("#user-panel").hide();

        // Click event for the signout button
        $("#signout-button").on("click", () => {
            // Send a signout request
            Authentication.signout(
                () => {
                    Socket.disconnect();

                    hide();
                    SignInForm.show();
                }
            );
        });
    };

    // Click event for the user avatar and name
    $("#user-panel .field-content").on("click", () => {
        const currentUser = Authentication.getUser();
        showUserProfile(currentUser); // Show the profile overlay with current user info
    });

    // This function shows the form with the user
    const show = function(user) {
        $("#user-panel").show();
    };

    // This function hides the form
    const hide = function() {
        $("#user-panel").hide();
    };

    // This function updates the user panel
    const update = function(user) {
        if (user) {
            $("#user-panel .user-avatar").html(Avatar.getCode(user.avatar));
            $("#user-panel .user-name").text(user.name);
        }
        else {
            $("#user-panel .user-avatar").html("");
            $("#user-panel .user-name").text("");
        }
    };

    return { initialize, show, hide, update };
})();

const OnlineUsersPanel = (function() {
    // This function initializes the UI
    const initialize = function() {};

    // This function updates the online users panel
    const update = function(onlineUsers) {
        const onlineUsersArea = $("#online-users-area");

        // Clear the online users area
        onlineUsersArea.empty();

		// Get the current user
        const currentUser = Authentication.getUser();

        // Add the user one-by-one
        for (const username in onlineUsers) {
            if (username != currentUser.username) {
                // Set clickable icon
                const userDiv = $("<div class='online-user' id='username-" + username + "'></div>")
                    .append(UI.getUserDisplay(onlineUsers[username]))
                    .on("click", () => {
                        // Show user profile
                        showUserProfile(onlineUsers[username]);
                    });
                onlineUsersArea.append(userDiv);
                // Function to switch to private chat
        

                // Event listener for user click to start private chat
                // userDiv.on("click", function() {
                //     const recipient = username;
                //     console.log(recipient);
                //     switchToPrivateChat(recipient);
                // });
            }
        }
    };

    // This function adds a user in the panel
	const addUser = function(user) {
        const onlineUsersArea = $("#online-users-area");
		
		// Find the user
		const userDiv = onlineUsersArea.find("#username-" + user.username);
		
		// Add the user
		if (userDiv.length == 0) {
            // Set clickable icon
            const newUserDiv = $("<div id='username-" + user.username + "'></div>")
                .append(UI.getUserDisplay(user))
                .on("click", () => {
                    // Show user profile
                    showUserProfile(user);
                });
            onlineUsersArea.append(newUserDiv);
            // Event listener for user click to start private chat
            // newUserDiv.on("click", function() {
            //     const recipient = user.username; // Get the username from the clicked item
            //     console.log(recipient);
            //     switchToPrivateChat(recipient);
            // });
		}
	};


    // This function removes a user from the panel
	const removeUser = function(user) {
        const onlineUsersArea = $("#online-users-area");
		
		// Find the user
		const userDiv = onlineUsersArea.find("#username-" + user.username);
		
		// Remove the user
		if (userDiv.length > 0) userDiv.remove();
	};

    return { initialize, update, addUser, removeUser };
})();

const switchToPrivateChat = (recipient) => {
    $("#public-chat-area").hide(); // Hide public chat
    $("#profile-overlay").fadeOut(300); // Close the profile overlay
    $(`#private-chat-${recipient}`).show();
    $(`#private-chat-${recipient}`).empty();
    // Optionally, set the recipient's name in the private chat title
    $(".chat-title").text(`Private Chat with ${recipient}`);
};

// Function to show user profile
const showUserProfile = function(user) {
    // Populate the profile overlay with user information
    $("#profile-avatar").html(Avatar.getCode(user.avatar)); // Assuming Avatar.getCode returns the avatar HTML
    $("#profile-name").text(user.name);
    $("#profile-username").text(user.username); // Assuming user object has a username property

    // Add a button to start private chat
    $("#private-chat-button").off("click").on("click", () => {
        switchToPrivateChat(user.username); // Start private chat with the selected user
    });

    // Show the profile overlay
    $("#profile-overlay").fadeIn(300);
};

// Close button functionality
$("#close-profile").on("click", () => {
    $("#profile-overlay").fadeOut(300);
});

const ChatPanel = (function() {
	// This stores the chat area
    let chatArea = null;
    let typingId = null;

    // This function initializes the UI
    const initialize = function() {
		// Set up the chat area
		chatArea = $("#public-chat-area");  // maybe other code also need to change to show private chat
        // privateChat = $("#private-chat-area");
        $("#chat-input").on("keydown", (e) => {
            Socket.userTyping();
        });
        // Submit event for the input form
        $("#chat-input-form").on("submit", (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the message content
            const content = $("#chat-input").val().trim();

            // Post it
            Socket.postMessage(content);

			// Clear the message
            $("#chat-input").val("");
        });
 	};

    const setTyping = function(username) {
        // Get the current user
        const currentUser = Authentication.getUser();
        if (currentUser.username == username) {
            return;
        }
        if (typingId) clearTimeout(typingId);
        $("#typing-indicator").text(username + " is typing...");
        typingId = setTimeout(() => {
            $("#typing-indicator").text("");
        }, 3000);
    }

    // This function updates the chatroom area
    const update = function(chatroom) {
        // Clear the online users area
        chatArea.empty();

        // Add the chat message one-by-one
        for (const message of chatroom) {
			addMessage(message);
        }
    };

    // This function adds a new message at the end of the chatroom
    const addMessage = function(message) {
		const datetime = new Date(message.datetime);
		const datetimeString = datetime.toLocaleDateString() + " " +
							   datetime.toLocaleTimeString();

		chatArea.append(
			$("<div class='chat-message-panel row'></div>")
				.append(UI.getUserDisplay(message.user))
				.append($("<div class='chat-message col'></div>")
					.append($("<div class='chat-date'>" + datetimeString + "</div>"))
					.append($("<div class='chat-content'>" + message.content + "</div>"))
				)
		);
		chatArea.scrollTop(chatArea[0].scrollHeight);
    };

    return { initialize, update, addMessage, setTyping };
})();

const UI = (function() {
    // This function gets the user display
    const getUserDisplay = function(user) {
        return $("<div class='field-content row shadow'></div>")
            .append($("<span class='user-avatar'>" +
			        Avatar.getCode(user.avatar) + "</span>"))
            .append($("<span class='user-name'>" + user.name + "</span>"));
    };

    // The components of the UI are put here
    const components = [SignInForm, UserPanel, OnlineUsersPanel, ChatPanel];

    // This function initializes the UI
    const initialize = function() {
        // Initialize the components
        for (const component of components) {
            component.initialize();
        }
    };

    return { getUserDisplay, initialize };
})();
