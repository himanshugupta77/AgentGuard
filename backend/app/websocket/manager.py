import json
import logging
from fastapi import WebSocket
from typing import Any

logger = logging.getLogger("agentguard.websocket")

class ConnectionManager:
    """Manages active WebSocket connections and broadcasts real-time telemetry."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, data: dict[str, Any]):
        """Broadcasts a structured JSON event to all connected UI clients."""
        payload = json.dumps({"type": event_type, "data": data}, default=str)
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending to WebSocket client: {e}")
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)

ws_manager = ConnectionManager()
