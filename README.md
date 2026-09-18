# Text To Speech WebApp

## Deploy

```bash
git switch deploy && git merge master && git switch master && git push --all
```

Note: use `git push --all -u` to also upload local branches to remote

## Local test

* HTTP server at REPO root (or directories might diverge from the ones GitHub sees)

```bash
python -m http.server --bind 127.0.0.1 -d ./
```

Link: https://hacktestes.github.io/TTS_WebApp/src/tts.html