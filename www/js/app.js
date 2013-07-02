var nick;
var model;

function updateChat() {
  model.messages(0)
    .then(function(messages) {
      var items = [];
      messages.forEach(function(message) {
        var item = $('<li>');
        item.text('<' + message.nick + '>: ' + message.text);
        var highlight = message.text.indexOf(nick) != -1;
        if (highlight) {
          item.addClass('text-error');
        }
        items.push(item[0]);
        latest = message.id;
      });
      $('#chat').children().remove();
      $('#chat').append(items);
    });
}

function go() {
  nick = localStorage.getItem("nick");
  if (!nick) {
    $('#set-nick').click(function() {
      if (!$('#nick-input').val())
        return false;

      localStorage.setItem("nick", $('#nick-input').val());
      nick = localStorage.getItem("nick");
      $('#theform input[name="nick"]').val(nick);
      $('#nickPrompt').modal('hide');
    });
    $('#nickPrompt').modal();
  }
  $('#theform input[name="nick"]').val(nick);

  model = new IMDB();
  model.init().then(function() {
    updateChat();
  });

  var regs = navigator.push.registrations();
  regs.onsuccess = function(e) {
    if (regs.result.length == 0) {
      var req = navigator.push.register();
      req.onsuccess = function() {
        var endpoint = req.result;
        $.post('/endpoint', { endpoint: endpoint })
      }
    }
  }

  $('#theform').submit(function() {
    $('#chat').append('<li class="muted">&lt;' + nick + '&gt;: ' + $('#theform input[name="message"]').val() + '</li>');
    $.post('/message', $('#theform').serialize(), function() {
      $('#theform input[name="message"]').val('');
    });
    return false;
  });
}

$(function() {
  navigator.mozApps.getSelf().onsuccess = function(e) {
    isInstalled = e.target.result != null;
    if (isInstalled) {
      go();
    } else {
      navigator.mozApps
        .install('http://simplechat.nikhilism.com/static/manifest.webapp');
    }
  }
});
