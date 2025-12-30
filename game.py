from fastapi import FastAPI, WebSocket
from collections import defaultdict
import random

app = FastAPI()
rooms = defaultdict(dict)
users = {}

@app.post("/api/login")
def login(user:str):
    users.setdefault(user,{})
    return {"ok":True}

@app.get("/api/match")
def match():
    return {"room":str(random.randint(10000,99999))}

@app.websocket("/ws/{room}")
async def ws_game(ws:WebSocket,room:str):
    await ws.accept()
    pid=id(ws)
    try:
        while True:
            data=await ws.receive_json()
            rooms[room][pid]=data
            await ws.send_json(rooms[room])
    except:
        rooms[room].pop(pid,None)

@app.websocket("/ws/chat/{room}")
async def ws_chat(ws:WebSocket,room:str):
    await ws.accept()
    if not hasattr(app.state,"chat"):
        app.state.chat=defaultdict(list)
    app.state.chat[room].append(ws)
    try:
        while True:
            msg=await ws.receive_text()
            for c in app.state.chat[room]:
                await c.send_text(msg)
    except:
        app.state.chat[room].remove(ws)
