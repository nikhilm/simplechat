# SimpleChat

A simple MUC that uses SimplePush push notifications for updates. A demo for
FirefoxOS.

Works *only on FirefoxOS*.

# Usage

Prerequisites:

* Redis
* Python

  git clone git://github.com/nikhilm/simplechat
  cd simplechat
  # virtualenv is recommended but not required.
  virtualenv env
  source env/bin/activate
  # Install dependencies
  pip install -r requirements.txt

Run the Flask server and point the FirefoxOS browser at the domain.

  python app.py

