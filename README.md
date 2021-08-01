# Getting Started

1. Clone the repo

2. Navigate to the Project root directory

3. Create a virtual environment `python3 -m venv venv`

4. Activate the virtual environment `source venv/bin/activate`

5. Install dependencies `pip install -r requirements.txt`

# Run Dev Server

1. In the terminal run `export DEV=1`

2. In the terminal run `make devserver`

3. In a browser navigate to http://localhost:8000

    *Note: To run on a different port, run something like this `make devserver PORT=8088`* 

# Publish Blog

1. In the terminal run `unset DEV`

2. In the terminal run `make github`
