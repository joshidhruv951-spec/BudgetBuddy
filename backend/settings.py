# 1. ALLOWED_HOSTS ko '*' kar dein
ALLOWED_HOSTS = ['*']

# 2. INSTALLED_APPS mein 'corsheaders' hona zaroori hai
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',  # <-- Yeh line honi chahiye
    'api',          # aapka app
]

# 3. MIDDLEWARE mein CorsMiddleware sabse upar hona chahiye
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # <-- Sabse top par
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# 4. File ke bilkul aakhri mein yeh do lines add kar dein
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True