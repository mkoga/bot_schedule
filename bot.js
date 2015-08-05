var Slack = require('slack-client');
var token = 'xoxb-7891720802-LbT8vX5q3ioVDuRvQN81UltY';
var slack = new Slack(token, true, true);

var scheduled_events = {};
var event_names = ['Tactics', 'Master analysis', 'Endgame studies'];

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

var parseEventName = function(text) {
  var result;

  event_names.forEach(function(event_name) {
    if (text.indexOf(event_name) != -1) {
      var parts = text.split(event_name);
      result = [event_name, parts[1]];
      return;
    }
  });

  return result;
};

var renderSchedule = function(user) {
  // If unscheduled, use copy "_Unscheduled_. Message makeMention("dcwoods") to coordinate times."
  // If scheduled, use formating "{days of the week} at {time} {timezone}"
  // "*Tactics*: Two sessions on Tuesday and Wednesday at 7PM EST & 9PM EST." + "\\r\\n" +
  // "*Master analysis*: _Unscheduled_. Message " + makeMention("dcwoods") + " to coordinate times." + "\\r\\n" +
  // "*Endgame studies*: _Unscheduled_. Message " + makeMention("dcwoods") + " to coordinate times.";

  var schedule = makeMention(user.name) + ": Our meeting times for this week are:" + "\r\n\r\n";

  event_names.forEach(function(event_name) {
    var event_time = scheduled_events[event_name] || "_Unscheduled_. Message " + makeMention("dcwoods") + " to coordinate times.";
    schedule += "*" + event_name + "*: " + event_time + "\r\n";
  });

  return schedule;
}

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
    var parts = message.text.split(" ");
    var command = (parts[1] || "").toLowerCase();

    switch (command) {
      case "clean":
        var event_parts = parseEventName(message.text);

        if (event_parts) {
          var event_name = event_parts[0];
          delete scheduled_events[event_name];
        } else {
          scheduled_events = {};
        }

        channel.send(renderSchedule(user));
        break;

      default:
        var event_parts = parseEventName(message.text);

        if (event_parts) {
          var event_name = event_parts[0];
          var event_time = event_parts[1].trim();

          if (event_name && event_time) {
            scheduled_events[event_name] = event_time;
          }
        }

        channel.send(renderSchedule(user));
    }
  }
});

slack.login();
