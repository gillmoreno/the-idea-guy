#!/bin/sh
set -e

/usr/local/bin/the-idea-guy-api &
exec nginx -g 'daemon off;'
