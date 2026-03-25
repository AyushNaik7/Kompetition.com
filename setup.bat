@echo off

echo Setting up Chess Competition Module...

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Run migrations
echo Running migrations...
python manage.py makemigrations
python manage.py migrate

REM Create superuser
echo Creating superuser...
echo Please enter superuser credentials:
python manage.py createsuperuser

echo Setup complete!
echo Run 'python manage.py runserver' to start the development server
pause
