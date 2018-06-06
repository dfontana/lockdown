# lockdown
A simple CLI tool to encrypt files with AES-256 Authentication.

## TODO: Short term
- [ ] Prompt for password to prevent it being leaked into bash history, etc.
- [ ] Organize project files into folders
- [ ] Create file server, allowing files to exist elsewhere on localnet.
 - Does encrption/decryption occur locally or on server, then?
 - How to ensure file transfer isn't compromised? (SSL?)
 - Can files be opened straight from memory? (They'd be in the NodeJS space, is there a way to "hand off" to vim (text) or other program (binary)?) (May need a tmp location locally that removes itself?)
 - Will need a way to browse what files exist, perhaps ranger-esque with file tree queried from server.
- [ ] How to publish to NPM?
- [ ] How to maintain releases (via NPM)?
- [ ] How to submit updates (via NPM)?

## TODO: Long term 
- [ ] Consider switching to typescript; for the fun of it.
- [ ] Utilize the tool as a backend for an encrypted-file browser (making it easier to explore, preview, open, and edit individual files)
