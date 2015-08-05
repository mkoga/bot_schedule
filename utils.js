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

var parseEventName = function(data, text) {
  var result;

  data.event_names.forEach(function(event_name) {
    if (text.indexOf(event_name) != -1) {
      var parts = text.split(event_name);
      result = [event_name, parts[1]];
      return;
    }
  });

  return result;
};

var renderSchedule = function(data, user) {
  // If unscheduled, use copy "_Unscheduled_. Message makeMention("dcwoods") to coordinate times."
  // If scheduled, use formating "{days of the week} at {time} {timezone}"
  // "*Tactics*: Two sessions on Tuesday and Wednesday at 7PM EST & 9PM EST." + "\\r\\n" +
  // "*Master analysis*: _Unscheduled_. Message " + makeMention("dcwoods") + " to coordinate times." + "\\r\\n" +
  // "*Endgame studies*: _Unscheduled_. Message " + makeMention("dcwoods") + " to coordinate times.";

  var schedule = makeMention(user.name) + ": Our meeting times for this week are:" + "\r\n\r\n";

  data.event_names.forEach(function(event_name) {
    var event_time = data.scheduled_events[event_name] || "_Unscheduled_";
    schedule += "*" + event_name + "*: " + event_time + "\r\n";
  });

  schedule += "\r\nMessage " + makeMention("dcwoods") + " to coordinate times.";

  return schedule;
}

module.exports = {
  makeMention: makeMention,
  isDirect: isDirect,
  getOnlineHumansForChannel: getOnlineHumansForChannel,
  parseEventName: parseEventName,
  renderSchedule: renderSchedule
}
