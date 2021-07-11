#!/usr/bin/env python
# -*- coding: utf-8 -*- #

AUTHOR = 'Jason Figueroa'
SITENAME = 'Jason Figueroa'
# Dev server url
SITEURL = 'http://localhost:8000'
# Vagrant box url
# SITEURL = 'http://localhost:8080'

ABOUTURL = '/pages/about-me.html'
ABOUTSITEURL = '/pages/about-site.html'
FAVICON = '/images/favicon.ico'

THEME = 'pelican-blue-mod'

PATH = 'content'

TIMEZONE = 'America/Chicago'

DEFAULT_LANG = 'en'

# Feed generation is usually not desired when developing
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

SIDEBAR_DIGEST = 'Passionate Learner'

DISPLAY_PAGES_ON_MENU = True

MENUITEMS = (('Blog', SITEURL), ('About Me', ABOUTURL), ('About This Site', ABOUTSITEURL))

# Blogroll
# LINKS = (('Pelican', 'https://getpelican.com/'),
#          ('Python.org', 'https://www.python.org/'),
#          ('Jinja2', 'https://palletsprojects.com/p/jinja/'),
#          ('You can modify those links in your config file', '#'),)

# Social widget
SOCIAL = (('twitter', 'https://twitter.com/jasonfigueroa_'),
          ('github', 'https://github.com/jasonfigueroa'),
          ('linkedin', 'https://www.linkedin.com/in/jason-figueroa-b59a3798/'),)

DEFAULT_PAGINATION = 10

# Uncomment following line if you want document-relative URLs when developing
RELATIVE_URLS = True