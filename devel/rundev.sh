#!/bin/bash

PORT=3456

echo "Starting webpack server on port $PORT"
echo

webpack-dev-server --progress --devtool=source-map --colors --port $PORT
