from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder='.')

# Route for the homepage
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# Route to serve static files (css, js, images)
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    print("Starting Winter '26 Edition Server...")
    print("Go to http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
