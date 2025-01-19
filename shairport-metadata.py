import re
import sys
import base64
import json

def start_item(line):
    regex = r"<item><type>(([A-Fa-f0-9]{2}){4})</type><code>(([A-Fa-f0-9]{2}){4})</code><length>(\d*)</length>"
    matches = re.findall(regex, line)
    typ = bytes.fromhex(matches[0][0]).decode('utf-8')
    code = bytes.fromhex(matches[0][2]).decode('utf-8')
    length = int(matches[0][4])
    return (typ, code, length)

def start_data(line):
    if line.startswith("<data encoding=\"base64\">"):
        return 0
    return -1

def read_data(line, length):
    b64size = 4 * ((length + 2) // 3)
    return base64.b64decode(line[:b64size])

def guessImageMime(magic):
    if magic.startswith(b'\xff\xd8'):
        return 'image/jpeg'
    elif magic.startswith(b'\x89PNG\r\n\x1a\r'):
        return 'image/png'
    else:
        return "image/jpg"

if __name__ == "__main__":
    metadata = {}
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        sys.stdout.flush()
        if not line.startswith("<item>"):
            continue
        typ, code, length = start_item(line)

        data = b""
        if length > 0:
            r = start_data(sys.stdin.readline())
            if r == -1:
                continue
            data = read_data(sys.stdin.readline(), length)

        if typ == "core":
            if code == "asal":
                metadata['Album Name'] = data.decode('utf-8')
            elif code == "asar":
                metadata['Artist'] = data.decode('utf-8')
            elif code == "minm":
                metadata['Title'] = data.decode('utf-8')

        if typ == "ssnc" and code == "paus":
            print(json.dumps({"event": "Pause"}))
            sys.stdout.flush()

        if typ == "ssnc" and code == "pres":
            print(json.dumps({"event": "Resume"}))
            sys.stdout.flush()

        if typ == "ssnc" and code == "mden":
            print(json.dumps(metadata))
            sys.stdout.flush()
            metadata = {}
