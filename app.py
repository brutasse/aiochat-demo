import asyncio
import json
import os
import random

from collections import defaultdict

from aiohttp import web
from aiohttp_sse import EventSourceResponse


user_events = defaultdict(asyncio.Queue)


ADJECTIVES = ('sartorial edison brooklyn marfa fap single-origin ethical '
              'green sustainable hot synth lo-fi dreamcatcher neutra '
              'chambray lumbersexual etsy cronut pabst readymade'.split())
NOUNS = ('taxidermy bulb vaporware hoodie quinoa tofu sriracha unicorn '
         'listicle semiotics fingerstache swag kombucha pitchfork '
         'humblebrag tacos subway typewriter vinegar raclette microdosing '
         'forage cardigan'.split())


def make_username():
    candidate = None
    while candidate is None or candidate in user_events:
        pair = random.choice(ADJECTIVES), random.choice(NOUNS)
        candidate = "-".join(pair).replace('-', ' ').title().replace(' ', '')
    return candidate


async def broadcast_others(username, event):
    """Send an event to everyone but <username>."""
    for name, queue in user_events.items():
        if name != username:
            await queue.put(event)


async def events(request):
    response = EventSourceResponse()
    response.start(request)

    username = make_username()
    await user_events[username].put({'type': 'username',
                                     'username': username})
    await user_events[username].put({'type': 'users',
                                     'users': list(user_events.keys())})
    await broadcast_others(username, {'type': 'join',
                                      'username': username})

    try:
        while True:
            event = await user_events[username].get()
            response.send(json.dumps(event))

    finally:
        await broadcast_others(username, {'type': 'quit',
                                          'username': username})
        user_events.pop(username)
        response.stop_streaming()
    return response


async def broadcast_event(request):
    data = await request.json()
    for queue in user_events.values():
        await queue.put(data)
    return web.json_response({'success': True})


def home(request):
    with open('index.html', 'r') as f:
        return web.Response(text=f.read(),
                            headers={'Content-Type': 'text/html'})


static_path = os.path.join(os.path.dirname(__file__), 'static')

app = web.Application()
app.router.add_static('/static/', static_path)
app.router.add_route('GET', '/events', events)
app.router.add_route('POST', '/events', broadcast_event)
app.router.add_route('GET', '/', home)


if __name__ == '__main__':
    web.run_app(app)
