# PostgreSQL Password Setup

The migration failed because the password is incorrect. Here's how to fix it:

## Option 1: Find Your PostgreSQL Password

Your PostgreSQL password was set during installation. Common defaults:
- `postgres`
- `admin`
- `root`
- Or a custom password you set

## Option 2: Reset PostgreSQL Password

### Using pgAdmin:
1. Open **pgAdmin**
2. Right-click on **PostgreSQL server** in the left sidebar
3. Select **Properties**
4. Go to **Connection** tab
5. Note the password or change it

### Using SQL Shell (psql):
1. Open **SQL Shell (psql)** as Administrator
2. Connect with your current credentials
3. Run this command to change password:
   ```sql
   ALTER USER postgres WITH PASSWORD 'your_new_password';
   ```

## Option 3: Update Django Settings

Once you know your password, I'll update the Django settings file.

**What is your PostgreSQL password?**

Common options:
- If you don't remember, try resetting it using Option 2
- If you know it, tell me and I'll update settings.py
- If you want to keep it private, you can manually edit `chess_competition/settings.py` line with `'PASSWORD': 'your_password_here'`
