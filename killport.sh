#!/bin/bash

# Get the argument port
port="$1"

# Check if the port is provided
if [ -z "$port" ]; then
  echo "Error: No port provided."
  echo "Usage: ./killport.sh <port>"
  exit 1
fi

# Check if lsof is installed
if ! command -v lsof &> /dev/null; then
  echo "Error: lsof is not installed. Please install it using:"
  echo "  sudo apt-get install lsof"
  exit 1
fi

# Find process using the port (without sudo first)
pid=$(lsof -t -i:$port 2>/dev/null)

# If not found, try with sudo
if [ -z "$pid" ]; then
  echo "Trying with sudo..."
  pid=$(sudo lsof -t -i:$port 2>/dev/null)
fi

# Check if a process is running on the given port
if [ -z "$pid" ]; then
  echo "No process found running on port $port."
  exit 0
fi

# Handle multiple PIDs
for p in $pid; do
  echo "Killing process $p running on port $port"
  # Try without sudo first
  kill -15 "$p" 2>/dev/null || sudo kill -15 "$p"
  
  # If still running, force kill
  sleep 1
  if ps -p "$p" > /dev/null; then
    kill -9 "$p" 2>/dev/null || sudo kill -9 "$p"
  fi
done

# Wait a moment for processes to terminate
sleep 1

# Confirm port is free
if lsof -i:$port 2>/dev/null || sudo lsof -i:$port 2>/dev/null; then
  echo "Failed to free port $port."
else
  echo "Port $port successfully freed."
fi