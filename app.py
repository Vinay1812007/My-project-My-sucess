from flask import Flask, request, jsonify, send_from_directory
import requests
import os

app = Flask(__name__, static_folder='.')

# 1. Serve the Frontend
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# 2. Search API Endpoint (Uses iTunes Search API - Free, No Keys)
@app.route('/search')
def search_proxy():
    query = request.args.get('q', 'top hits')
    
    # Apple iTunes API URL
    url = "https://itunes.apple.com/search"
    params = {
        "term": query,
        "media": "music",
        "entity": "song",
        "limit": 25,
        "country": "IN" # Search in India store for Hindi/Telugu results
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("NEON BEATS SERVER STARTED")
    print("Go to: http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
