#!/usr/bin/env python3
"""docs/tasks/*.md → the HTML the BB PM editor keeps. Usage: python3 -I docs/tasks/_md2html.py docs/tasks/<ticket>.md
The H1 is the ticket title and is dropped; everything else becomes <h2>/<p>/<ul><li><p>/<table><tr><th|td><p>/<a>/<img>/<pre><code>.
Send the output as `description` through the PM MCP update_issue — a Markdown description is mangled the first time someone saves it in the editor."""
import re, sys, html, pathlib

def inline(t: str) -> str:
    t = html.escape(t, quote=False)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<![*\w])\*(?!\*)([^*\n]+?)\*(?![*\w])', r'<em>\1</em>', t)
    t = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', r'<img class="rounded-md" src="\2">', t)
    t = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a target="_blank" rel="noopener noreferrer" href="\2">\1</a>', t)
    t = re.sub(r'(?<![="\>])(https?://[^\s<)]+)', r'<a target="_blank" rel="noopener noreferrer" href="\1">\1</a>', t)
    t = t.replace('[ ]', '☐').replace('[x]', '☑')
    return t

def convert(md: str) -> str:
    out, lines, i = [], md.splitlines(), 0
    para: list[str] = []
    def flush():
        nonlocal para
        if para:
            out.append('<p>' + '<br>'.join(inline(l) for l in para) + '</p>'); para = []
    while i < len(lines):
        ln = lines[i]
        s = ln.strip()
        if not s:
            flush(); i += 1; continue
        if s.startswith('```'):
            flush(); buf = []; i += 1
            while i < len(lines) and not lines[i].strip().startswith('```'):
                buf.append(lines[i]); i += 1
            out.append('<pre><code>' + html.escape('\n'.join(buf), quote=False) + '</code></pre>'); i += 1; continue
        if s.startswith('<'):          # raw HTML passes through
            flush(); out.append(s); i += 1; continue
        m = re.match(r'^(#{1,3})\s+(.*)$', s)
        if m:
            flush(); lvl = len(m.group(1)); out.append(f'<h{lvl}>{inline(m.group(2))}</h{lvl}>'); i += 1; continue
        if s == '---':
            flush(); out.append('<hr>'); i += 1; continue
        if s.startswith('|'):
            flush(); rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                r = lines[i].strip()
                if not re.match(r'^\|[\s:|-]+\|$', r):
                    rows.append([c.strip() for c in r.strip('|').split('|')])
                i += 1
            if rows:
                head, body = rows[0], rows[1:]
                h = ''.join(f'<th><p>{inline(c)}</p></th>' for c in head)
                b = ''.join('<tr>' + ''.join(f'<td><p>{inline(c)}</p></td>' for c in r) + '</tr>' for r in body)
                out.append(f'<table><tbody><tr>{h}</tr>{b}</tbody></table>')
            continue
        if s.startswith('> '):
            flush(); buf = []
            while i < len(lines) and lines[i].strip().startswith('>'):
                buf.append(lines[i].strip()[1:].strip()); i += 1
            inner = convert('\n'.join(buf))
            out.append(f'<blockquote>{inner}</blockquote>'); continue
        if re.match(r'^[-*]\s+', s):
            flush(); items = []
            while i < len(lines) and re.match(r'^\s*[-*]\s+', lines[i]):
                items.append(re.sub(r'^\s*[-*]\s+', '', lines[i])); i += 1
            out.append('<ul>' + ''.join(f'<li><p>{inline(x)}</p></li>' for x in items) + '</ul>'); continue
        if re.match(r'^\d+\.\s+', s):
            flush(); items = []
            while i < len(lines) and re.match(r'^\s*\d+\.\s+', lines[i]):
                items.append(re.sub(r'^\s*\d+\.\s+', '', lines[i])); i += 1
            out.append('<ol>' + ''.join(f'<li><p>{inline(x)}</p></li>' for x in items) + '</ol>'); continue
        para.append(s); i += 1
    flush()
    return ''.join(out)

if __name__ == '__main__':
    src = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
    # the H1 title line is the ticket's title, not part of its description
    src = re.sub(r'^# .*\n', '', src, count=1)
    sys.stdout.write(convert(src))
