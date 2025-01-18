import re
import sys
import base64
import json
import logging
from enum import Enum

logging.basicConfig(level=logging.INFO)

class MetadataType(Enum):
    CORE = "core"
    SSNC = "ssnc"

class MetadataCode(Enum):
    ALBUM = "asal"
    ARTIST = "asar"
    TITLE = "minm"
    IMAGE = "PICT"
    END = "pend"

class ShairportMetadataProcessor:
    def __init__(self):
        self.metadata = {}

    def start_item(self, line):
        regex = r"<item><type>(([A-Fa-f0-9]{2}){4})</type><code>(([A-Fa-f0-9]{2}){4})</code><length>(\d*)</length>"
        matches = re.findall(regex, line)
        if not matches:
            raise ValueError("Invalid <item> line format")
        typ = bytes.fromhex(matches[0][0]).decode('utf-8')
        code = bytes.fromhex(matches[0][2]).decode('utf-8')
        length = int(matches[0][4])
        return typ, code, length

    def read_data(self, line, length):
        try:
            b64size = 4 * ((length + 2) // 3)
            return base64.b64decode(line[:b64size])
        except Exception as e:
            logging.error(f"Failed to decode data: {e}")
            return b""

    def guess_image_mime(self, magic):
        if magic.startswith(b'\xff\xd8'):
            return 'image/jpeg'
        elif magic.startswith(b'\x89PNG\r\n\x1a\r'):
            return 'image/png'
        return 'image/jpg'

    def process_line(self, line):
        # Processing logic
        pass

    def run(self):
        with sys.stdin as fi:
            for line in fi:
                self.process_line(line)

if __name__ == "__main__":
    processor = ShairportMetadataProcessor()
    processor.run()
