import os
import urllib.request
import urllib.error
from dotenv import load_dotenv

def validate_api_key():
    load_dotenv(override=True)
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        print("❌ Error: GOOGLE_API_KEY not found in .env file.")
        print("👉 Get a free API key at: https://aistudio.google.com/app/apikey")
        return False

    api_key = api_key.strip("'\" ")

    if not api_key.startswith("AIza"):
        print("⚠️ Warning: Google API keys usually start with 'AIzaSy...'.")
        print("👉 Make sure you copied an API Key from Google AI Studio, not a browser cookie.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

    try:
        urllib.request.urlopen(url)
        print("✅ Success: GOOGLE_API_KEY is valid and working!")
        return True
    except urllib.error.HTTPError as e:
        print(f"❌ Error: Invalid API key (HTTP {e.code}).")
        print("👉 Please get a valid API key at: https://aistudio.google.com/app/apikey")
        return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

# Alias for backwards compatibility if imported elsewhere
validate_google_api_key = validate_api_key

if __name__ == "__main__":
    validate_api_key()
