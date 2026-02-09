# Temporal-Identity-Graph-Model-
Temporal Identity Graph Model for Analyzing Non-Human Identity Paths in IT-OT Convergent Environments A graph-based approach to modeling how identity relationships evolve over time, enabling path-based risk analysis across cloud, CI/CD, Kubernetes, and operational technology systems.

---

## Getting Started — Local Development

This section explains how to clone, configure, and run this project locally on your machine. The goal is to provide a development environment that closely mirrors the research prototype while enabling experimentation, extension, and further modeling.

### 1. Clone the Repository

```bash
git clone https://github.com/shivamps1990-hub/Temporal-Identity-Graph-Model-.git
cd Temporal-Identity-Graph-Model-
```

### 2. Bootstrap the Development Environment

This repository includes a bootstrap script that prepares all necessary dependencies, Python environments, and Node packages.

Make the bootstrap script executable:

```bash
chmod +x bootstrap.sh
```

Now run:

```bash
./bootstrap.sh
```

The above will:
- Create a Python virtual environment
- Install Python dependencies
- Install Node dependencies

### 3. Running the Backend

Start the API server (FastAPI):

```bash
make backend
```

By default, the API will be accessible at:

```
http://localhost:8000
```

### 4. Running the Frontend

In a separate terminal (inside the project root):

```bash
make frontend
```

By default, the UI will be available at:

```
http://localhost:5173
```

### 5. Running Tests

To execute backend tests:

```bash
make test
```

### 6. Stopping Services / Cleanup

To remove generated environments cleanly:

```bash
make clean
```

This setup ensures you can iterate rapidly, run experiments, modify models, and collaborate with others using their local machines without dependencies on Replit or cloud services.
