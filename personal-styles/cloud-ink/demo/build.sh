#!/bin/sh
set -eu
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
LIB=${LIB:-$(CDPATH= cd -- "$HERE/../.." && pwd)}
exec node "$LIB/studio/src/cli.ts" render "$(basename "$HERE")"
