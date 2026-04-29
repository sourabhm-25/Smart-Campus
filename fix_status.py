import re

path = r"c:\Users\SOURABH\Desktop\Rag\Backend\routers\student_router.py"
content = open(path, encoding="utf-8").read()

# Replace all occurrences of  "status": "active"  with  "status": {"$ne": "closed"}
# This covers the 3 queries in student_router.py that filter homework
old = '"status": "active"'
new = '"status": {"$ne": "closed"}'

count = content.count(old)
content = content.replace(old, new)
open(path, "w", encoding="utf-8").write(content)
print(f"Replaced {count} occurrence(s) of {repr(old)} with {repr(new)}")
