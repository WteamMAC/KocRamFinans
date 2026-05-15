
with open('src/components/dashboard/profile-header.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the first occurrence of ');\n}'
for i in range(len(lines)-1):
    if ');' in lines[i] and '}' in lines[i+1]:
        fixed_lines = lines[:i+2]
        break
else:
    fixed_lines = lines

with open('src/components/dashboard/profile-header.tsx', 'w', encoding='utf-8') as f:
    f.writelines(fixed_lines)
