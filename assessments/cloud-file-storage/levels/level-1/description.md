# Level 1 — Files

Build an in-memory file store that tracks named files by size.

## addFile(fileName, size)

- Adds a file with an integer size in bytes.
- A negative size is ignored.
- If the file name already exists, the call is ignored.

## getFile(fileName)

- Returns the file's size, or null if the file does not exist.

## copyFile(source, dest)

- Copies source into dest.
- If source does not exist, the call is ignored.
- If dest already exists, it is overwritten.
