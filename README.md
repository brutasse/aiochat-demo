# Aiochat

A quick introductory talk on Asyncio / Aiohttp, about building a chat app.

## Slides

[PDF slides](slides.pdf)

## Demo

Running the demo requires Python 3.5 or greater. Setup a virtualenv and run
the server:

```
mkvirtualenv aiochat -p /usr/bin/python3.6
pip install -r requirements.txt
python app.py
```

Visit [http://localhost:8080](http://localhost:8080) with a few browser
windows and start chatting!

Backend code is in [`app.py`](app.py), frontend code is in
[`static/app.js`](static/app.js).
