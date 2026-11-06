"""Read WordPress exports as data. SQL and PHP objects are never executed."""
import re
from pathlib import Path

CORE = {"posts", "postmeta", "terms", "term_taxonomy", "term_relationships", "users", "comments", "commentmeta", "options", "termmeta"}


def mysql_rows(text):
    """Decode extended INSERT tuples, including MariaDB string escapes."""
    i, n = 0, len(text)
    escapes = {"0": "\0", "n": "\n", "r": "\r", "t": "\t", "b": "\b", "Z": "\x1a"}
    while i < n:
        while i < n and text[i] in " \r\n\t,;": i += 1
        if i == n: return
        if text[i] != "(": raise ValueError("Expected SQL tuple")
        i += 1
        row = []
        while True:
            while text[i].isspace(): i += 1
            if text[i] == "'":
                i += 1
                value = []
                while i < n:
                    c = text[i]; i += 1
                    if c == "\\":
                        c = text[i]; i += 1
                        value.append(escapes.get(c, "\\" + c if c in "%_" else c))
                    elif c == "'":
                        if i < n and text[i] == "'": value.append("'"); i += 1
                        else: break
                    else: value.append(c)
                else: raise ValueError("Unclosed SQL string")
                row.append("".join(value))
            else:
                start = i
                while i < n and text[i] not in ",)": i += 1
                value = text[start:i].strip()
                row.append(None if value.upper() == "NULL" else value)
            while text[i].isspace(): i += 1
            if text[i] == ")": i += 1; break
            if text[i] != ",": raise ValueError("Expected SQL separator")
            i += 1
        yield row


def dump_records(filename):
    columns, table = {}, None
    with Path(filename).open(encoding="utf-8-sig") as stream:
        for line in stream:
            match = re.match(r"CREATE TABLE `([^`]+)`", line)
            if match:
                table = match[1]; columns[table] = []; continue
            if table:
                match = re.match(r"\s+`([^`]+)`", line)
                if match: columns[table].append(match[1])
                if line.startswith(")"): table = None
                continue
            match = re.match(r"INSERT INTO `([^`]+)`(?:\s*\(([^)]+)\))? VALUES\s*", line)
            if not match: continue
            name = match[1]
            kind = next((k for k in sorted(CORE, key=len, reverse=True) if name.endswith("_" + k)), None)
            if not kind: continue
            fields = re.findall(r"`([^`]+)`", match[2]) if match[2] else columns.get(name)
            if not fields: raise ValueError(f"Missing column definition for {name}")
            prefix = name[:-len(kind)]
            chunk = line[match.end():]
            while True:
                for values in mysql_rows(chunk):
                    if len(values) != len(fields): raise ValueError(f"Column count mismatch: {name}")
                    yield prefix, kind, dict(zip(fields, values))
                if chunk.rstrip().endswith(';'): break
                chunk = next(stream)


def php_value(value):
    """Decode scalar/array metadata with byte lengths; reject object payloads."""
    data = value.encode("utf-8"); offset = 0
    def read(depth=0):
        nonlocal offset
        if depth > 40: raise ValueError("PHP metadata nesting limit")
        tag = chr(data[offset]); offset += 1
        if tag == "N":
            if data[offset:offset+1] != b";": raise ValueError("Invalid null")
            offset += 1; return None
        if data[offset:offset+1] != b":": raise ValueError("Invalid PHP value")
        offset += 1
        if tag in "bid":
            end = data.index(b";", offset); raw = data[offset:end]; offset = end + 1
            return bool(int(raw)) if tag == "b" else int(raw) if tag == "i" else float(raw)
        if tag == "s":
            end = data.index(b":", offset); length = int(data[offset:end]); offset = end + 2
            if length < 0 or length > 16_000_000: raise ValueError("Invalid PHP string length")
            raw = data[offset:offset+length]; offset += length
            if data[offset:offset+2] != b'";': raise ValueError("Invalid PHP string")
            offset += 2; return raw.decode("utf-8")
        if tag == "a":
            end = data.index(b":", offset); length = int(data[offset:end]); offset = end + 2
            if length < 0 or length > 100000: raise ValueError("PHP array limit")
            result = {}
            for _ in range(length):
                key = read(depth+1); result[str(key)] = read(depth+1)
            if data[offset:offset+1] != b"}": raise ValueError("Invalid PHP array")
            offset += 1; return result
        raise ValueError("PHP objects and references are not supported")
    result = read()
    if offset != len(data): raise ValueError("Trailing PHP metadata")
    return result
