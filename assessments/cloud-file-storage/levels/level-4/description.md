# Level 4 — Compression

Add deterministic compression while keeping storage usage correct.

## compressFile(fileName)

- Sets the file's size to floor(size / 2) and remembers the original size.
- An unknown file, or a file that is already compressed, is ignored.
- The owner's usage is reduced accordingly.

## decompressFile(fileName)

- Restores the original size and marks the file uncompressed.
- An unknown or uncompressed file is ignored.
- If restoring would push the owner over capacity, the call is ignored.

## isCompressed(fileName)

- Returns true if the file is currently compressed, else false.

copyFile copies the source's current size into an uncompressed destination.
