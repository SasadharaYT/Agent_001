import warnings
from dotenv import load_dotenv

# Suppress annoying Python 3.9 deprecation warnings from Google libraries
warnings.filterwarnings("ignore")
from langchain_google_genai import ChatGoogleGenerativeAI

# 1. Load the Environment Variables
load_dotenv()

# 2. Define the LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash", 
    temperature=0,
)

response = llm.invoke("Hello, how are you?")

print("\nModel Response:")
print(response.content)



