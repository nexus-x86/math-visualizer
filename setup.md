### Option 1: Using Docker (Recommended)
1. Provide the `.env` file in the `frontend` and `backend` folder with your valid API keys
2. Run `make docker-build` to build the images.
3. Run `make docker-up` to start the backend on port 8000 and the frontend on port 3000.
4. To stop the containers, run `make docker-down`.

### Option 2: Manual Setup
1. create a python virtual environment in the `backend` folder (and then enter it)
2. install dependencies `pip install -r requirements.txt` and `npm install` in the frontend directory. Make sure you set the required API keys (e.g., `GEMINI_API_KEY`)!
3. run backend && frontend in two separate terminals with `make run-backend` and `make run-frontend`