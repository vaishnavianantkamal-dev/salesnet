import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
})

socket.on('connect', () => {
  console.log('[Socket] Connected:', socket.id)
})

socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected:', reason)
})

socket.on('connect_error', (error) => {
  console.error('[Socket] Connection error:', error.message)
})

export const connectSocket = (token) => {
  if (socket.connected) return
  socket.auth = { token }
  socket.connect()
}

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect()
  }
}
