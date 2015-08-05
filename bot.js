var utils = require('./utils'),
    path = require('path'),

    token = 'xoxb-7891720802-LbT8vX5q3ioVDuRvQN81UltY',
    slack = new (require('slack-client'))(token, true, true),

    Storage = require('./storage'),
    storage = new Storage('./data.json'),
    data = storage.read() || {
      "scheduled_events": {},
      "event_names": ['Tactics', 'Master analysis', 'Endgame studies'] // default events
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

  if (message.type === 'message' && utils.isDirect(slack.self.id, message.text)) {
    var parts = message.text.split(" ");
    var command = (parts[1] || "").toLowerCase();

    switch (command) {
      case "new":
        var event_name = parts.slice(2).join(" ");

        if (event_name && data.event_names.indexOf(event_name) == -1) {
          data.event_names.push(event_name);
          storage.write(data);
        }

        channel.send(utils.renderSchedule(data, user));
        break;

      case "remove":
        var event_name = parts.slice(2).join(" ");
        var event_name_index = data.event_names.indexOf(event_name);

        if (event_name && event_name_index != -1) {
          data.event_names.splice(event_name_index, 1);
          storage.write(data);
        }

        channel.send(utils.renderSchedule(data, user));
        break;

      case "clear":
        var event_parts = utils.parseEventName(data, message.text);

        if (event_parts) {
          var event_name = event_parts[0];
          delete data.scheduled_events[event_name];
        } else {
          data.scheduled_events = {};
        }

        storage.write(data);
        channel.send(utils.renderSchedule(data, user));
        break;

      case "help":
        var help  = "Schedule commands:\r\n";
            help += "\t@schedule                              - prints the schedule\r\n";
            help += "\t@schedule EVENT_NAME WHEN              - schedules an event\r\n";
            help += "\t@schedule new EVENT_NAME               - adds a new event name to schedule\r\n";
            help += "\t@schedule clear [EVENT_NAME]           - clears the schedule for a given event or all if no event is specified\r\n";
            help += "\t@schedule remove EVENT_NAME            - removes the event from the schedule\r\n";
            help += "\t@schedule help                         - displays this message\r\n";
            help += "\r\n";

        channel.send(help);
        break;

      default:
        var event_parts = utils.parseEventName(data, message.text);

        if (event_parts) {
          var event_name = event_parts[0];
          var event_time = event_parts[1].trim();

          if (event_name && event_time) {
            data.scheduled_events[event_name] = event_time;
            storage.write(data);
          }
        }

        channel.send(utils.renderSchedule(data, user));
    }
  }
});

slack.login();
