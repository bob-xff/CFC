#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""一次性改造：把单行元素 :hover 规则包进 @media(hover:hover)，
   防止触屏设备点击后 hover 态粘住。滚动条伪元素 hover 不处理。"""
import sys

PATH = r"C:\Users\hwff\Desktop\CFC2.0\football-career-simulator.html"

def main():
    with open(PATH, encoding="utf-8") as f:
        lines = f.readlines()
    out, wrapped = [], 0
    for ln in lines:
        s = ln.rstrip("\n")
        core = s.strip()
        if (
            ":hover" in s
            and "scrollbar" not in s
            and s.endswith("}")
            and core.startswith((".", "html"))
            and "{" in s
            and "}" not in s[:-1]
        ):
            out.append("@media(hover:hover){" + s + "}\n")
            wrapped += 1
        else:
            out.append(ln)
    with open(PATH, "w", encoding="utf-8", newline="") as f:
        f.writelines(out)
    print(f"wrapped {wrapped} hover rules")

if __name__ == "__main__":
    main()
