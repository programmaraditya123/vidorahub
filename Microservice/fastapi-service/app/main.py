from fastapi import FastAPI

app = FastAPI(
    title="Vidorahub Microservice",
    version="0.1.0",
)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "FastAPI microservice is running"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}
