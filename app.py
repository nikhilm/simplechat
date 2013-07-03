from flask import Flask, render_template, request, abort, session, make_response, send_file, redirect
import json
import requests
from redis import Redis
from Queue import Queue
from threading import Thread

app = Flask(__name__, static_url_path='/static', static_folder='www')
app.secret_key = 'topseekret'
redis = Redis()

MAX_MESSAGES = 50

def k(s):
    return 'simplechat:%s'%s

notification_queue = Queue()

def notify():
  while True:
      # consume next version from queue
      version = notification_queue.get()
      for endpoint in redis.lrange(k('endpoints'), 0, -1):
          print endpoint
          r = requests.put(endpoint, data={'version': version})
          print r

@app.route('/')
def index():
    return send_file('www/index.html')

@app.route('/message', methods=['POST'])
def message():
    mid = redis.incr(k('id-counter'))
    # In one transaction, add this message to the end and remove the first one if the cardinality is > MAX_MESSAGES
    with redis.pipeline() as pipe:
        data = json.dumps({'id': mid, 'nick': request.form['nick'], 'text': request.form['message']})
        pipe.zadd(k('messages'), data, float(mid))
        pipe.zremrangebyrank(k('messages'), 0, -MAX_MESSAGES)
        n = pipe.execute()

        notification_queue.put(mid)
        return 'OK'

# start is exclusive
@app.route('/message/<start>', methods=['GET'])
def messages(start):
    messages = redis.zrangebyscore(k('messages'),
                                   '(%d'%int(start),
                                   'inf')
    # calling flask.jsonify would lead to double-JSON-ification of messages
    response = make_response('{"messages": [%s]}'%(',\n'.join(messages)))
    response.headers['Content-Type'] = 'application/json'
    return response

@app.route('/endpoint', methods=['POST'])
def endpoint():
    endpoint = request.form['endpoint']

    if not endpoint:
        abort(400)

    redis.rpush(k('endpoints'), endpoint)
    # Ping this endpoint immediately so that the new client downloads existing messages.
    # Since this is a new endpoint, we can send the version as 1.
    requests.put(endpoint, data={'version': 1})
    return 'OK'

if __name__ == '__main__':
    t = Thread(target=notify)
    t.daemon = True
    t.start()
    app.run(debug=True, port=9100)
