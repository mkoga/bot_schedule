var Slack = require('slack-client');
var token = 'xoxb-7891720802-LbT8vX5q3ioVDuRvQN81UltY';
var slack = new Slack(token, true, true);

var makeMention = function(userId) {
  return '<@' + userId + '>';
};

var isDirect = function(userId, messageText) {
  var userTag = makeMention(userId);
  return messageText &&
    messageText.length >= userTag.length &&
    messageText.substr(0, userTag.length) === userTag;
};

var getOnlineHumansForChannel = function(channel) {
  if (!channel) return [];

  return (channel.members || [])
    .map(function(id) { return slack.users[id]; })
    .filter(function(u) { return !!u && !u.is_bot && u.presence === 'active'; });
};

slack.on('open', function () {
  var channels = Object.keys(slack.channels)
    .map(function (k) { return slack.channels[k]; })
    .filter(function (c) { return c.is_member; })
    .map(function (c) { return c.name; });

  var groups = Object.keys(slack.groups)
    .map(function (k) { return slack.groups[k]; })
    .filter(function (g) { return g.is_open && !g.is_archived; })
    .map(function (g) { return g.name; });

  console.log('Welcome to Slack. You are ' + slack.self.name + ' of ' + slack.team.name);

  if (channels.length > 0) {
    console.log('You are in: ' + channels.join(', '));
  }

  else {
    console.log('You are not in any channels.');
  }

  if (groups.length > 0) {
    console.log('As well as: ' + groups.join(', '));
  }
});

slack.on('message', function(message) {
  var channel = slack.getChannelGroupOrDMByID(message.channel);
  var user = slack.getUserByID(message.user);

  if (message.type === 'message' && isDirect(slack.self.id, message.text)) {
  // If unscheduled, use copy "_Unscheduled_. Message makeMention("dcwoods") to coordinate times."
  // If scheduled, use formating "{days of the week} at {time} {timezone}"
    var message = makeMention(user.name) + ": Our meeting times for this week are:" + "\r\n\r\n" + 
                  "*Tactics*: _Sunday_ at 10:30PM EST." + "\r\n" + 
                  "*Master analysis*: _Unscheduled_. Message " + makeMention("dcwoods") + " to coordinate times.";

    channel.send(message);
  }
});

slack.login();