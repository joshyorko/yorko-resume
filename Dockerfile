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

# Copy only the necessary files to install dependencies
COPY pyproject.toml poetry.lock ./

# Install dependencies using Poetry
RUN poetry install

# Copy the rest of the application code, excluding files in .dockerignore
COPY . .

# Set Git safe directory configuration
RUN git config --global --add safe.directory /app

# Expose port 8000 for the application
EXPOSE 8000

# Set the entrypoint to Poetry to run the application
ENTRYPOINT ["poetry", "run"]
CMD ["serve"]
