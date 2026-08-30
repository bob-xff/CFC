# -*- coding: utf-8 -*-
import io, sys
L = io.open(r"C:\Users\Administrator\Desktop\CFC1.0\build\revamp\_check.js", encoding="utf-8").read().split("\n")
ln = int(sys.argv[1]) if len(sys.argv) > 1 else 1615
line = L[ln - 1]
print("LEN", len(line))
print(line[:600])
