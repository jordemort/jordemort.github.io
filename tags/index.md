---
title: Tags
layout: default
---
{% assign sorted_tags = site.tags | sort %}
{% for tag in sorted_tags %}
  - [{{ tag[0] }}](/tags/{{ tag[0] }}/) ({{ tag[1].size }})
{% endfor %}
