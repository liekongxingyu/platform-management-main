import json
import socket
import threading
import time
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Optional, Any

import requests

LISTEN_IP = "0.0.0.0"
LISTEN_PORT = 52381
KEYBOARD_IP = "192.168.1.108"

DEFAULT_VIDEO_ID = 2

current_video_id = DEFAULT_VIDEO_ID
current_video_id_lock = threading.Lock()

BACKEND_BASE_URL = "http://127.0.0.1:9000"

HTTP_LISTEN_IP = "127.0.0.1"
HTTP_LISTEN_PORT = 52382

PTZ_SPEED = 0.5

ACTION_TIMEOUT_SECONDS = 0.6

HTTP_TIMEOUT_SECONDS = 3
CRUISE_TOGGLE_COOLDOWN_SECONDS = 1.0
last_cruise_toggle_ts = 0.0
last_cruise_toggle_lock = threading.Lock()

DEBUG = True

IDLE = "idle"
UP = "up"
DOWN = "down"
LEFT = "left"
RIGHT = "right"
ZOOM_IN = "zoom_in"
ZOOM_OUT = "zoom_out"
CRUISE_TOGGLE = "cruise_toggle"

VALID_ACTIONS = {IDLE, UP, DOWN, LEFT, RIGHT, ZOOM_IN, ZOOM_OUT, CRUISE_TOGGLE}


@dataclass
class PTZState:
    current_action: str = IDLE
    current_action_video_id: int = DEFAULT_VIDEO_ID
    last_action_packet_ts: float = 0.0
    last_raw_hex: str = ""


state = PTZState()
state_lock = threading.Lock()

http = requests.Session()

def get_current_video_id() -> int:
    with current_video_id_lock:
        return current_video_id


def set_current_video_id(video_id: int):
    global current_video_id
    with current_video_id_lock:
        current_video_id = video_id


def build_ptz_start_url(video_id: int) -> str:
    return f"{BACKEND_BASE_URL}/video/ptz/{video_id}/start"


def build_ptz_stop_url(video_id: int) -> str:
    return f"{BACKEND_BASE_URL}/video/ptz/{video_id}/stop"


def build_zoom_start_url(video_id: int) -> str:
    return f"{BACKEND_BASE_URL}/video/zoom/{video_id}/start"


def build_zoom_stop_url(video_id: int) -> str:
    return f"{BACKEND_BASE_URL}/video/zoom/{video_id}/stop"


def build_presets_list_url(video_id: int) -> str:
    return f"{BACKEND_BASE_URL}/video/ptz/{video_id}/presets"


def build_presets_create_url(video_id: int) -> str:
    return f"{BACKEND_BASE_URL}/video/ptz/{video_id}/presets"

def build_cruise_start_current_url(video_id: int) -> str:
    return f"{BACKEND_BASE_URL}/video/ptz/{video_id}/cruise/start-current"


def build_cruise_stop_url(video_id: int) -> str:
    return f"{BACKEND_BASE_URL}/video/ptz/{video_id}/cruise/stop"


def build_cruise_status_url(video_id: int) -> str:
    return f"{BACKEND_BASE_URL}/video/ptz/{video_id}/cruise/status"


def log(*args):
    if DEBUG:
        print("[keyboard-ptz]", *args)


def bytes_to_hex(data: bytes) -> str:
    return data.hex(" ")


def payload_tail(data: bytes, count: int = 10) -> bytes:
    if len(data) <= count:
        return data
    return data[-count:]


def _safe_json(resp: requests.Response) -> Any:
    try:
        return resp.json()
    except Exception:
        return None


def recognize_action_from_payload(data: bytes) -> Optional[str]:
    if len(data) < 16:
        return None

    hex_str = bytes_to_hex(data)
    tail_bytes = payload_tail(data, 16)
    tail = bytearray(tail_bytes)

    if data == b"1" * len(data):
        return None

    if tail.endswith(b"\x00\x08\x00\x01"):
        return UP
    if tail.endswith(b"\x00\x10\x00\x01"):
        return DOWN
    if tail.endswith(b"\x00\x04\x00\x01"):
        return LEFT
    if tail.endswith(b"\x00\x02\x00\x01"):
        return RIGHT
    if tail.endswith(b"\x00\x20\x00\x01"):
        return ZOOM_IN
    if tail.endswith(b"\x00\x40\x00\x01"):
        return ZOOM_OUT

    if len(tail) >= 8 and tail[-8:] == b"\x00\x00\x00\x00\x00\x00\x00\x00":
        return IDLE

    if b"cruise" in data.lower() or b"tour" in data.lower():
        return CRUISE_TOGGLE

    return None


def _start_action(video_id: int, action: str):
    try:
        if action in {UP, DOWN, LEFT, RIGHT}:
            url = build_ptz_start_url(video_id)
            body = {"direction": action, "speed": PTZ_SPEED}
            log(f"→ POST ptz/start video_id={video_id} {action}")
            resp = http.post(url, json=body, timeout=HTTP_TIMEOUT_SECONDS)
            log(f"← status={resp.status_code}")

        elif action in {ZOOM_IN, ZOOM_OUT}:
            url = build_zoom_start_url(video_id)
            body = {"direction": action, "speed": 0.5}
            log(f"→ POST zoom/start video_id={video_id} {action}")
            resp = http.post(url, json=body, timeout=HTTP_TIMEOUT_SECONDS)
            log(f"← status={resp.status_code}")

        elif action == CRUISE_TOGGLE:
            global last_cruise_toggle_ts
            now = time.time()
            with last_cruise_toggle_lock:
                if now - last_cruise_toggle_ts < CRUISE_TOGGLE_COOLDOWN_SECONDS:
                    log("巡航按钮冷却中，跳过")
                    return
                last_cruise_toggle_ts = now

            url = build_cruise_status_url(video_id)
            log(f"→ GET cruise/status video_id={video_id}")
            resp = http.get(url, timeout=HTTP_TIMEOUT_SECONDS)
            log(f"← status={resp.status_code}")
            st = _safe_json(resp) or {}

            running = st.get("running") or False

            if not running:
                url2 = build_cruise_start_current_url(video_id)
                log(f"→ POST cruise/start-current")
                resp2 = http.post(url2, timeout=HTTP_TIMEOUT_SECONDS)
                log(f"← status={resp2.status_code}")
            else:
                url2 = build_cruise_stop_url(video_id)
                log(f"→ POST cruise/stop")
                resp2 = http.post(url2, timeout=HTTP_TIMEOUT_SECONDS)
                log(f"← status={resp2.status_code}")

    except Exception as e:
        log(f"[!] _start_action error: {e}")


def _stop_action(video_id: int, action: str):
    try:
        if action in {UP, DOWN, LEFT, RIGHT}:
            url = build_ptz_stop_url(video_id)
            log(f"→ POST ptz/stop video_id={video_id}")
            resp = http.post(url, timeout=HTTP_TIMEOUT_SECONDS)
            log(f"← status={resp.status_code}")

        elif action in {ZOOM_IN, ZOOM_OUT}:
            url = build_zoom_stop_url(video_id)
            log(f"→ POST zoom/stop video_id={video_id}")
            resp = http.post(url, timeout=HTTP_TIMEOUT_SECONDS)
            log(f"← status={resp.status_code}")

    except Exception as e:
        log(f"[!] _stop_action error: {e}")


def do_state_machine(new_action: Optional[str], received_ts: float, raw_hex: str):
    global state

    if new_action is None:
        return

    if new_action not in VALID_ACTIONS:
        log(f"new_action {new_action} not in VALID_ACTIONS, skip")
        return

    video_id = get_current_video_id()

    with state_lock:
        state.last_raw_hex = raw_hex
        state.last_action_packet_ts = received_ts

        if new_action == IDLE:
            if state.current_action != IDLE:
                log(f"IDLE → stop {state.current_action}")
                _stop_action(state.current_action_video_id, state.current_action)
                state.current_action = IDLE
                state.current_action_video_id = video_id
            return

        if state.current_action == IDLE:
            log(f"transition: IDLE → {new_action}")
            _start_action(video_id, new_action)
            state.current_action = new_action
            state.current_action_video_id = video_id
            return

        if state.current_action == new_action:
            return

        log(f"transition: {state.current_action} → {new_action}")
        _stop_action(state.current_action_video_id, state.current_action)
        _start_action(video_id, new_action)
        state.current_action = new_action
        state.current_action_video_id = video_id


def idle_watchdog():
    global state
    while True:
        try:
            time.sleep(0.1)
            now = time.time()

            with state_lock:
                if state.current_action == IDLE:
                    continue
                elapsed = now - state.last_action_packet_ts
                if elapsed > ACTION_TIMEOUT_SECONDS:
                    log(f"watchdog: {state.current_action} timeout ({elapsed:.2f}s), stop")
                    _stop_action(state.current_action_video_id, state.current_action)
                    state.current_action = IDLE
        except Exception as e:
            log(f"[!] watchdog error: {e}")


class ControlAPIHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/status":
            video_id = get_current_video_id()
            with state_lock:
                body = {
                    "target_video_id": video_id,
                    "last_action": state.current_action,
                    "last_raw_hex": state.last_raw_hex,
                }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors()
            data = json.dumps(body, ensure_ascii=False).encode("utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        self.send_response(404)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if self.path == "/target":
            try:
                size = int(self.headers.get("Content-Length") or 0)
                body = self.rfile.read(size)
                payload = json.loads(body)
                vid = int(payload.get("video_id") or 0)
                if vid > 0:
                    set_current_video_id(vid)
                    log(f"前端切换控制目标 video_id={vid}")

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._cors()
                res = json.dumps({"ok": True, "video_id": vid}).encode("utf-8")
                self.send_header("Content-Length", str(len(res)))
                self.end_headers()
                self.wfile.write(res)
            except Exception as e:
                self.send_response(400)
                self._cors()
                self.end_headers()
            return

        self.send_response(404)
        self._cors()
        self.end_headers()

    def log_message(self, format, *args):
        return


def run_control_api():
    try:
        server = ThreadingHTTPServer((HTTP_LISTEN_IP, HTTP_LISTEN_PORT), ControlAPIHandler)
        log(f"本地控制API已启动 http://{HTTP_LISTEN_IP}:{HTTP_LISTEN_PORT}")
        server.serve_forever()
    except Exception as e:
        log(f"HTTP API error: {e}")


def receive_udp_loop():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind((LISTEN_IP, LISTEN_PORT))
    sock.settimeout(0.5)
    log(f"监听PTZ键盘 UDP {LISTEN_IP}:{LISTEN_PORT} ...")

    while True:
        try:
            data, addr = sock.recvfrom(1024)
        except TimeoutError:
            continue
        except Exception as e:
            log(f"recv error: {e}")
            time.sleep(0.2)
            continue

        now = time.time()
        src_ip, src_port = addr

        if KEYBOARD_IP and src_ip != KEYBOARD_IP:
            continue

        hex_repr = bytes_to_hex(data)
        action = recognize_action_from_payload(data)
        log(f"← [{src_ip}:{src_port}] len={len(data)} action={action} tail={bytes_to_hex(payload_tail(data, 8))}")

        do_state_machine(action, now, hex_repr)


def main():
    threading.Thread(target=idle_watchdog, daemon=True).start()
    threading.Thread(target=run_control_api, daemon=True).start()
    receive_udp_loop()


if __name__ == "__main__":
    main()
