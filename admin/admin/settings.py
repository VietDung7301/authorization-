"""
Django settings for admin project.

Generated by 'django-admin startproject' using Django 5.0.6.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.0/ref/settings/
"""

from pathlib import Path
from dotenv import load_dotenv

import os

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-c-%-p0+6tdxf0a9ls-vh(g#sysc^en(n4szggij2j$rt3+&9i)'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG_MODE").lower() in ('true', 'yes', '1')

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'authorization.apps.AuthorizationConfig',
    'identity.apps.IdentityConfig',
    'role.apps.RoleConfig',
    'access.apps.AccessConfig'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'admin.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'admin.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    "default": {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('AUTH_DB_NAME'),
        'USER': os.getenv('AUTH_DB_USER'),
        'PASSWORD': os.getenv('AUTH_DB_PASSWORD'),
        'HOST': os.getenv('AUTH_DB_HOST'),
        'PORT': os.getenv('AUTH_DB_PORT'),
    },
    'authorization': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('AUTH_DB_NAME'),
        'USER': os.getenv('AUTH_DB_USER'),
        'PASSWORD': os.getenv('AUTH_DB_PASSWORD'),
        'HOST': os.getenv('AUTH_DB_HOST'),
        'PORT': os.getenv('AUTH_DB_PORT'),
    },
    'identity': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('IDEN_DB_NAME'),
        'USER': os.getenv('IDEN_DB_USER'),
        'PASSWORD': os.getenv('IDEN_DB_PASSWORD'),
        'HOST': os.getenv('IDEN_DB_HOST'),
        'PORT': os.getenv('IDEN_DB_PORT'),
    },
    'role': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('ROLE_DB_NAME'),
        'USER': os.getenv('ROLE_DB_USER'),
        'PASSWORD': os.getenv('ROLE_DB_PASSWORD'),
        'HOST': os.getenv('ROLE_DB_HOST'),
        'PORT': os.getenv('ROLE_DB_PORT'),
    },
    'access': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('ACCESS_DB_NAME'),
        'USER': os.getenv('ACCESS_DB_USER'),
        'PASSWORD': os.getenv('ACCESS_DB_PASSWORD'),
        'HOST': os.getenv('ACCESS_DB_HOST'),
        'PORT': os.getenv('ACCESS_DB_PORT'),
    },
}

DATABASE_ROUTERS = ['database_routers.router.Router']


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
