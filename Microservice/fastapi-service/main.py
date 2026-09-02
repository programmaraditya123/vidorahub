from fastapi import FastAPI

app = FastAPI(
    title="vidoravibe Backend",
    version="1.0.0"
)

@app.get("/")
def home():
    return "FastAPI backend is runing"