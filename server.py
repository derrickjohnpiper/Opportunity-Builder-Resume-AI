import os
import sys

# Shift the working directory to backend so all imports work perfectly
root_path = os.path.dirname(__file__)
backend_path = os.path.join(root_path, "backend")

os.chdir(backend_path)
sys.path.insert(0, backend_path)

# Import the actual FastAPI app
from server import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
