import sys
import json
from pynput import mouse

def on_click(x, y, button, pressed):
    button_map = {
        mouse.Button.left: 1,
        mouse.Button.right: 2,
        mouse.Button.middle: 3,
        mouse.Button.x1: 4,
        mouse.Button.x2: 5,
    }
    btn = button_map.get(button)
    if btn is None:
        return
    evt = json.dumps({"type": "mousedown" if pressed else "mouseup", "button": btn})
    sys.stdout.write(evt + "\n")
    sys.stdout.flush()

with mouse.Listener(on_click=on_click) as listener:
    listener.join()
