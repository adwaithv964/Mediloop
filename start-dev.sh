#!/bin/bash

# Mediloop Development Startup Script

echo "🚀 Starting Mediloop Development Environment"
echo "============================================"

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo ""
    echo "⚠️  Backend .env file not found!"
    echo "📝 Creating backend/.env from template..."
    echo ""
    echo "GEMINI_API_KEY=your_gemini_api_key_here" > backend/.env
    echo "PORT=5000" >> backend/.env
    echo "NODE_ENV=development" >> backend/.env
    echo "CORS_ORIGIN=http://localhost:3000" >> backend/.env
    echo ""
    echo "✅ Created backend/.env"
    echo "⚠️  Please add your Gemini API key to backend/.env"
    echo ""
fi

# Start backend
echo "🔧 Starting Backend Server..."
cd backend
npm install 2>/dev/null
npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend
echo "🎨 Starting Frontend Server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo "📝 Backend: http://localhost:5000"
echo "📝 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT
wait

