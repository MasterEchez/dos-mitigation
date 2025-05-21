#!/bin/bash

JVB_CONF="/etc/jitsi/videobridge/jvb.conf"
BACKUP="$JVB_CONF.bak"

# Backup original file
cp "$JVB_CONF" "$BACKUP"

# Remove entire ice4j { ... } block safely (handles nested braces)
awk '
/^[[:space:]]*ice4j[[:space:]]*{/ {
    in_block=1
    brace_count=1
    next
}
in_block {
    brace_count += gsub(/{/, "{")
    brace_count -= gsub(/}/, "}")
    if (brace_count == 0) in_block=0
    next
}
{ print }
' "$BACKUP" > "$JVB_CONF"

# Append replacement config
cat <<EOF >> "$JVB_CONF"

ice4j {
  harvest {
    use-local-addresses = true
    face = "10.0.1.3"
    mapping {
      stun {
        enabled = false
        addresses = []
      }
      aws {
        enabled = false
      }
    }
  }
}
EOF

# echo "Replaced ice4j block in jvb.conf successfully."
