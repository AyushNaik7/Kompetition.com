#!/bin/bash

echo "Setting up Chess Competition Module..."

# Create virtual environment
echo "Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run migrations
echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

# Create superuser
echo "Creating superuser..."
echo "Please enter superuser credentials:"
python manage.py createsuperuser

echo "Setup complete!"
echo "Run 'python manage.py runserver' to start the development server"
