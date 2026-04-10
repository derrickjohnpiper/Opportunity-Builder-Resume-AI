import os
import sys
import importlib.util

# Paths
root_path = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(root_path, "backend")

# Ensure Python looks in the backend folder first
os.chdir(backend_path)
sys.path.insert(0, backend_path)

# Manually load the backend server file to bypass the "circular import" error 
# since this file is also named server.py
spec = importlib.util.spec_from_file_location("real_server", os.path.join(backend_path, "server.py"))
real_server = importlib.util.module_from_spec(spec)
sys.modules["real_server"] = real_server
spec.loader.exec_module(real_server)

# Expose the app to Uvicorn/Granian
app = real_server.app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
