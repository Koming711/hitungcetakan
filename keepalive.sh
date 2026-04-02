#!/bin/bash
while true; do
  cd /home/z/my-project
  npx next dev -p 3000 > /home/z/my-project/dev.log 2>&1 &
  PID=$!
  echo "Started dev server PID: $PID"
  # Check every 5 seconds if process is still alive
  while kill -0 $PID 2>/dev/null; do
    sleep 5
  done
  echo "Process died, restarting in 2s..."
  sleep 2
done
