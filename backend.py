from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
from fastapi.staticfiles import StaticFiles
from app import main


app = FastAPI()

app.mount(
    "/candidates",
    StaticFiles(directory="sample/candidates"),
    name="candidates"
)


# React frontend ko backend access karne dena
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://jhalak-ai.vercel.app",],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/")
def home():
    return {
        "message": "FaceChain Verify Backend is running"
    }


@app.post("/verify")
async def verify_face(
    file: UploadFile = File(...)
):
    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = main(file_path)

    return result