import warnings
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

# Suppress annoying Python 3.9 deprecation warnings from Google libraries
warnings.filterwarnings("ignore")
from langchain_google_genai import ChatGoogleGenerativeAI

# 1. Load the Environment Variables
load_dotenv()

# 2. Define the LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash", 
    temperature=0,
)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message")

    if not isinstance(message, str) or not message.strip():
        return jsonify({"error": "A non-empty 'message' is required."}), 400

    try:
        # Temporarily bypass Gemini to test frontend-to-API connectivity.
        # response = llm.invoke(message)
        # return jsonify({"response": response.content})
        return jsonify({
            "response": "API connection is working.",
            "received_message": message,
            "connected": True,
        })
    except Exception as error:
        return jsonify({"error": str(error)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)



