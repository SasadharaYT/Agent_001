python -m venv venv
.\venv\Scripts\activate
pip install -r .\requirements.txt
python .\main.py

In a second terminal, serve the frontend:

cd .\FrontEnd
python -m http.server 5500

Then open http://localhost:5500 in your browser.
