# Use the official Python image as a base
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --upgrade pip \
    && pip install poetry

# Set work directory
WORKDIR /app

# Copy poetry files AND README.md before installing dependencies
COPY pyproject.toml poetry.lock README.md ./

# Install dependencies using Poetry
RUN poetry config virtualenvs.create false \
    && poetry install --no-root

# Copy the rest of the application code, excluding files in .dockerignore
COPY . .

# Set Git safe directory configuration
RUN git config --global --add safe.directory /app

# Expose port 8000 for the application
EXPOSE 8000

# Run the serve command directly since we disabled virtualenv creation
CMD ["python", "-m", "yorko_resume.serve"]
