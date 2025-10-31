# db.py
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Read from .env
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "smart_campus")

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[MONGO_DB]

def get_collection(name: str):
    """Helper function to get a specific collection."""
    return db[name]
