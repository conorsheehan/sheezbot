/**
 * CHECK FOR TOKENS
 */

if (!process.env.page_token) {
    console.log('Error: Specify page_token in environment');
    process.exit(1);
}

if (!process.env.verify_token) {
    console.log('Error: Specify verify_token in environment');
    process.exit(1);
}

/**
 * REQUIRE
 */

var Botkit = require('./node_modules/botkit/lib/Botkit.js');

/**
 * SET UP BOTKIT
 */

var controller = Botkit.facebookbot({
    debug: true,
    access_token: process.env.page_token,
    verify_token: process.env.verify_token,
});

var bot = controller.spawn({});

controller.setupWebserver(process.env.port || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log('ONLINE!');
    });
});

/**
 * CONVERSATIONS
 */

/**
 * HELLO
 */
controller.hears(['hello', 'hi'], 'message_received', function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hey ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hey... uhh... you!!');
        }
    });
});

/**
 * HELLO 2
 */

controller.hears(['yo'], 'message_received', function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hey ' + user.name + '!!');
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('Hey... uhh... you!!');
                    convo.ask('What should I call you?', function(response, convo) {
                        convo.say(response.text + ' it is, then!');

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I\'ll try to remember that...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });

                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        }
    });
});

/**
 * FALLBACK
 */
controller.on('message_received', function(bot, message) {
    bot.reply(message, 'Sorry. I know nothing.');
    return false;
});
