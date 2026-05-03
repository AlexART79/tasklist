#!/usr/bin/env bash
input=$(cat)

# Model
model=$(echo "$input" | jq -r '.model.display_name // "Unknown"')

# Context window usage
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')

# Cost estimate (input ~$3/1M, output ~$15/1M for Sonnet 4.x; cache read ~$0.30/1M, cache write ~$3.75/1M)
total_in=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0')
total_out=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0')
cache_write=$(echo "$input" | jq -r '.context_window.current_usage.cache_creation_input_tokens // 0')
cache_read=$(echo "$input" | jq -r '.context_window.current_usage.cache_read_input_tokens // 0')
cost=$(echo "$total_in $total_out $cache_write $cache_read" | awk '{
  input_cost  = ($1 * 3.00)    / 1000000
  output_cost = ($2 * 15.00)   / 1000000
  cw_cost     = ($3 * 3.75)    / 1000000
  cr_cost     = ($4 * 0.30)    / 1000000
  total = input_cost + output_cost + cw_cost + cr_cost
  printf "$%.4f", total
}')

# Context bar (10 chars wide)
if [ -n "$used_pct" ]; then
  bar=$(echo "$used_pct" | awk '{
    filled = int($1 / 10 + 0.5)
    if (filled > 10) filled = 10
    empty = 10 - filled
    bar = ""
    for (i = 0; i < filled; i++) bar = bar "#"
    for (i = 0; i < empty;  i++) bar = bar "-"
    printf "%s", bar
  }')
  ctx_str=$(printf "[%s] %.0f%%" "$bar" "$used_pct")
else
  ctx_str="[----------] --%"
fi

# Rate limits
five_pct=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
week_pct=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')

rate_str=""
if [ -n "$five_pct" ]; then
  rate_str=$(printf "5h:%.0f%%" "$five_pct")
fi
if [ -n "$week_pct" ]; then
  week_fmt=$(printf "7d:%.0f%%" "$week_pct")
  if [ -n "$rate_str" ]; then
    rate_str="$rate_str $week_fmt"
  else
    rate_str="$week_fmt"
  fi
fi

# Assemble output
line=$(printf "%s  ctx:%s  cost:%s" "$model" "$ctx_str" "$cost")
if [ -n "$rate_str" ]; then
  line=$(printf "%s  %s" "$line" "$rate_str")
fi

echo "$line"
