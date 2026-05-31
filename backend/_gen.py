import os, base64, zlib

# The template_engine.py content will be written via a Python script
# that constructs the file programmatically to avoid shell escaping issues.

TARGET = os.path.join(os.path.dirname(os.path.abspath(__file__)), "template_engine.py")
NL = "\n"
BS = "\\"

with open(TARGET, "w", encoding="utf-8") as f:
    f.write(f'"""{NL}')
    f.write(f"Template Engine for CVCraft - generates LaTeX source from structured CV data.{NL}")
    f.write(f"{NL}")
    f.write(f"Supports six distinct professional templates: modern, traditional, creative,{NL}")
    f.write(f"minimalist, executive, and tech. All use standard fonts (Computer Modern,{NL}")
    f.write(f"Latin Modern) for ATS parseability.{NL}")
    f.write(f'"""{NL}')
    f.write(f"from typing import Dict, Any, List{NL}")
    f.write(f"{NL}{NL}")
    f.write(f"SUPPORTED_TEMPLATES = [{NL}")
    f.write(f'    "modern", "traditional", "creative",{NL}')
    f.write(f'    "minimalist", "executive", "tech"{NL}')
    f.write(f"]{NL}{NL}{NL}")

    # escape_latex function
    f.write(f"def escape_latex(text: str) -> str:{NL}")
    f.write(f'    r"""Escape LaTeX special characters: & % $ # _ {{}} ~ ^ {BS}{NL}')
    f.write(f"{NL}")
    f.write(f"    Returns empty string for None input.{NL}")
    f.write(f'    """{NL}')
    f.write(f"    if text is None:{NL}")
    f.write(f'        return ""{NL}')
    f.write(f"    out = str(text){NL}")
    f.write(f"    # Use placeholders for chars whose replacements contain braces{NL}")
    f.write(f"    out = out.replace('{BS}{BS}', '{BS}x00BS{BS}x00'){NL}")
    f.write(f"    out = out.replace('~', '{BS}x00TI{BS}x00'){NL}")
    f.write(f"    out = out.replace('^', '{BS}x00CA{BS}x00'){NL}")
    f.write(f"    # Escape simple characters{NL}")
    f.write(f"    out = out.replace('&', '{BS}{BS}&'){NL}")
    f.write(f"    out = out.replace('%', '{BS}{BS}%'){NL}")
    f.write(f"    out = out.replace('$', '{BS}{BS}$'){NL}")
    f.write(f"    out = out.replace('#', '{BS}{BS}#'){NL}")
    f.write(f"    out = out.replace('_', '{BS}{BS}_'){NL}")
    f.write(f"    out = out.replace('{{', '{BS}{BS}{{'){NL}")
    f.write(f"    out = out.replace('}}', '{BS}{BS}}}'){NL}")
    f.write(f"    # Replace placeholders with final LaTeX commands{NL}")
    f.write(f"    out = out.replace('{BS}x00BS{BS}x00', '{BS}{BS}textbackslash{{}}'){NL}")
    f.write(f"    out = out.replace('{BS}x00TI{BS}x00', '{BS}{BS}textasciitilde{{}}'){NL}")
    f.write(f"    out = out.replace('{BS}x00CA{BS}x00', '{BS}{BS}textasciicircum{{}}'){NL}")
    f.write(f"    return out{NL}")

print(f"Phase 1 done: {os.path.getsize(TARGET)} bytes")
