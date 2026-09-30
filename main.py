import warnings
import logging
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
app.logger.setLevel(logging.INFO)
CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message")

    if not isinstance(message, str) or not message.strip():
        return jsonify({
            "error": "A non-empty 'message' is required."
        }), 400

    try:
        response = llm.invoke(message)

        content = response.content

        # Gemini response can sometimes be a string,
        # or a list of content blocks.
        if isinstance(content, str):
            reply = content

        elif isinstance(content, list):
            reply = "".join(
                block.get("text", "")
                for block in content
                if isinstance(block, dict)
                and block.get("type") == "text"
            )

        else:
            reply = str(content)

        app.logger.info("Gemini reply: %s", reply)

        return jsonify({
            "response": reply,
            "received_message": message,
            "connected": True,
            "service": "gemini",
        })

    except Exception as error:
        app.logger.exception("Gemini request failed")

        return jsonify({
            "error": str(error)
        }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)



