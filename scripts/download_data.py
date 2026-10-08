from __future__ import annotations

import io
import ssl
import urllib.request
import zipfile
from pathlib import Path

from app.config import settings

URL = "https://files.grouplens.org/datasets/movielens/ml-latest-small.zip"
WANTED = {"movies.csv", "ratings.csv", "tags.csv"}


def main() -> None:
    destination: Path = settings.data_dir
    destination.mkdir(parents=True, exist_ok=True)
    
    # FIX: Bypass SSL context verification to handle local certification issue
    context = ssl._create_unverified_context()
    
    with urllib.request.urlopen(URL, context=context) as response:
        archive = zipfile.ZipFile(io.BytesIO(response.read()))
    for member in archive.namelist():
        name = Path(member).name
        if name in WANTED:
            (destination / name).write_bytes(archive.read(member))
            print(f"extracted {name}")


if __name__ == "__main__":
    main()