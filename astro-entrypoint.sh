#!/usr/bin/env bash

set -euo pipefail

my_uid=$(id -u)
want_uid=$(stat -c '%u' .)

if [ "$my_uid" != "$want_uid" ] ; then
  existing_user=$(getent passwd "$want_uid" | cut -d: -f1 || true)
  if [ -n "$existing_user" ] ; then
    userdel -r "$existing_user"
  fi

  want_gid=$(stat -c '%g' .)
  existing_group=$(getent group "$want_gid" || true)
  if [ -z "$existing_group" ] ; then
    groupadd -g "$want_gid" astro
  fi

  useradd -m -u "$want_uid" -g "$want_gid" astro
  exec gosu astro "$0" "$@"
fi

npm install
exec "$@"
