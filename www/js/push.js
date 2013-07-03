$(function() {
var model = new IMDB();
model.init().then(function() {
  navigator.mozSetMessageHandler('push', function(message) {
    model.latest().then(function(latest) {
      if (latest >= message.version) {
        console.log("Not downloading since " + message.version + " is same as " + latest);
      }

      $.getJSON('/message/'+latest, function(data) {
        var list = data.messages;
        model.add(list).then(function(su) {
          list.forEach(function(message) {
            if (message.text.indexOf(localStorage.getItem("nick")) != -1) {
              var notification = navigator.mozNotification.createNotification("SimpleChat", message.text);
              notification.show();
            }
          });
          updateChat();
        }, function(e) {
            console.log("Error adding " + e.target.error.name);
        });
      });
    });
  });
});

navigator.mozSetMessageHandler('push-register', function(message) {
  var notification = navigator.mozNotification.createNotification("SimpleChat", "Lost all registrations!");
  notification.show();
});

});
