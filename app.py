import os
import time
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# --- CONFIGURATION ---
# Replace these with your actual Spotify credentials if env vars are not set
SPOTIFY_CLIENT_ID = os.environ.get('SPOTIFY_CLIENT_ID', 'YOUR_SPOTIFY_CLIENT_ID_HERE')
SPOTIFY_CLIENT_SECRET = os.environ.get('SPOTIFY_CLIENT_SECRET', 'YOUR_SPOTIFY_CLIENT_SECRET_HERE')

# Global token cache
spotify_token = None
token_expires_at = 0

def get_token():
    """Retrieves or refreshes the Spotify Access Token using Client Credentials Flow."""
    global spotify_token, token_expires_at
    
    if spotify_token and time.time() < token_expires_at:
        return spotify_token
        
    url = "https://accounts.spotify.com/api/token"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {
        "grant_type": "client_credentials",
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET
    }
    
    try:
        response = requests.post(url, headers=headers, data=data)
        response.raise_for_status()
        json_data = response.json()
        
        spotify_token = json_data['access_token']
        # Expires in usually 3600 seconds; subtract 60s buffer
        token_expires_at = time.time() + json_data['expires_in'] - 60
        return spotify_token
    except Exception as e:
        print(f"Error fetching token: {e}")
        return None

@app.route('/')
def home():
    return "Spotify Clone API is Running"

@app.route('/search', methods=['GET'])
def search():
    """Searches Spotify for tracks."""
    query = request.args.get('q')
    if not query:
        return jsonify({"error": "No query provided"}), 400
        
    token = get_token()
    if not token:
        return jsonify({"error": "Failed to authenticate with Spotify"}), 500
        
    url = "https://api.spotify.com/v1/search"
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "q": query,
        "type": "track",
        "limit": 20
    }
    
    try:
        res = requests.get(url, headers=headers, params=params)
        data = res.json()
        
        tracks = []
        if 'tracks' in data and 'items' in data['tracks']:
            for item in data['tracks']['items']:
                # Extract only necessary data for frontend
                tracks.append({
                    "id": item['id'],
                    "name": item['name'],
                    "artist": ", ".join(artist['name'] for artist in item['artists']),
                    "image": item['album']['images'][0]['url'] if item['album']['images'] else "",
                    "preview_url": item['preview_url'], # This is the 30s audio
                    "uri": item['uri']
                })
        
        return jsonify({"tracks": tracks})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Vercel entry point
app = app

if __name__ == '__main__':
    app.run(debug=True, port=5000)
