### Option 1: Using Docker (Recommended)
1. Provide the `.env` file in the `frontend` and `backend` folder with your valid API keys
2. Run `make docker-run` to build and start the backend (8000) and frontend (3000) in one go.
3. To stop the containers, run `make docker-down`.

### Option 2: Manual Setup
1. create a python virtual environment in the `backend` folder (and then enter it)
2. install dependencies `pip install -r requirements.txt` and `npm install` in the frontend directory. Make sure you set the required API keys (e.g., `GEMINI_API_KEY`)!
3. run backend && frontend in two separate terminals with `make run-backend` and `make run-frontend`